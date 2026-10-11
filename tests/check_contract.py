from pathlib import Path
import json,copy,hashlib,base64,uuid,datetime,re
import jsonschema,rfc8785
ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'schemas'/'0.4.0'
EXAMPLES=ROOT/'examples'
ARTIFACTS=ROOT/'test-results'
ARTIFACTS.mkdir(exist_ok=True)
schemas={n:json.loads((D/f'{n}.schema.json').read_text()) for n,suffix in [('bundle',''),('plan','-plan'),('receipt','-receipt'),('capabilities','-capabilities')]}
for s in schemas.values():jsonschema.Draft202012Validator.check_schema(s)
validators={k:jsonschema.Draft202012Validator(s,format_checker=jsonschema.FormatChecker()) for k,s in schemas.items()}
def digest(v):
 v=copy.deepcopy(v);v.pop('integrity',None);return hashlib.sha256(rfc8785.dumps(v)).hexdigest()
def seal(v):
 v=copy.deepcopy(v);v['integrity']={'algorithm':'sha256','canonicalization':'jcs-rfc8785','digest':digest(v)};return v
def rr(r):return {'memory_id':r['id'],'revision_id':r['revision']['id'],'digest':r['integrity']['digest']}
def strict_pairs(pairs):
 d={}
 for k,v in pairs:
  if k in d:raise ValueError('duplicate JSON member')
  d[k]=v
 return d
def path_ok(path):return path.startswith('sources/') and all(x not in ('','.','..') for x in path.split('/')) and not any(x in path for x in ['\\','\x00',':'])
def validate(d):
 validators['bundle'].validate(d)
 assert digest(d)==d['integrity']['digest'],'bundle integrity'
 snaps={}
 for s in d['snapshots']:
  assert s['sha256'] not in snaps,'duplicate snapshot'
  if s['availability']!='included':
   snaps[s['sha256']]=None;continue
  if 'text' in s:b=s['text'].encode()
  elif 'base64' in s:
   b=base64.b64decode(s['base64'],validate=True);assert base64.b64encode(b).decode()==s['base64'],'base64 canonical'
  else:
   assert path_ok(s['path']),'path escape'
   raise ValueError('external fixtures not loaded by this offline check')
  assert s['byte_length']==len(b) and hashlib.sha256(b).hexdigest()==s['sha256'],'snapshot integrity'
  snaps[s['sha256']]=b
 records={}
 for r in d['records']:
  rid=r['revision']['id'];assert rid not in records,'duplicate revision';records[rid]=r
  assert digest(r)==r['integrity']['digest'],'record integrity'
  v=r['validity'];assert not(v['not_before'] and v['expires_at']) or datetime.datetime.fromisoformat(v['not_before'].replace('Z','+00:00'))<datetime.datetime.fromisoformat(v['expires_at'].replace('Z','+00:00')),'validity interval'
  for src in r['sources']:
   if src['snapshot_ref'] is None:continue
   b=snaps[src['snapshot_ref']]
   if b is None:continue
   if 'selector' in src:
    t=src['selector'];assert t['start']+t['length']<=len(b),'selector bounds';b.decode();b[:t['start']].decode();b[:t['start']+t['length']].decode()
 missing=[];edges={}
 for rid,r in records.items():
  edges[rid]=[]
  for parent in r['revision']['parents']:assert parent['memory_id']==r['id'],'parent memory'
  for dep in r['revision']['parents']+r['derivation']['inputs']:
   assert dep['revision_id']!=rid,'self reference'
   other=records.get(dep['revision_id'])
   if other:
    assert rr(other)==dep,'reference integrity'
    if dep in r['revision']['parents']:assert r['created_at']==other['created_at'],'creation time'
    edges[rid].append(dep['revision_id'])
   elif dep not in missing:missing.append(dep)
 if d['history']['coverage']=='complete':assert not missing and not d['history']['missing_parents'],'incomplete history'
 else:assert sorted(missing,key=str)==sorted(d['history']['missing_parents'],key=str),'undeclared missing parents'
 def visit(rid,stack,seen):
  assert rid not in stack,'cycle'
  if rid in seen:return
  for x in edges[rid]:visit(x,stack|{rid},seen)
  seen.add(rid)
 for rid in records:visit(rid,set(),set())
 known={'amis.scope.v1','amis.revision-graph.v1','amis.integrity.jcs-sha256.v1','amis.links.v1'}
 return 'archive_only' if set(d['required_features'])-known else 'valid'
example=json.loads((EXAMPLES/'project-feedback.amis.json').read_text(),object_pairs_hook=strict_pairs)
fixtures=json.loads(((ARTIFACTS/'browser-bundles.json') if (ARTIFACTS/'browser-bundles.json').exists() else (ROOT/'tests'/'fixtures'/'browser-bundles.json')).read_text())
for d in [example]+fixtures:assert validate(d)=='valid'
checks=[]
def rejects(name,fn):
 try:fn()
 except (AssertionError,ValueError,KeyError,jsonschema.ValidationError,UnicodeError):checks.append(name);return
 raise AssertionError('Unexpected acceptance: '+name)
def mutation(fn,record=False,reseal_record=False):
 d=copy.deepcopy(example);fn(d['records'][0] if record else d)
 if reseal_record:d['records'][0]=seal(d['records'][0])
 return seal(d)
rejects('duplicate JSON names',lambda:json.loads('{"id":1,"id":2}',object_pairs_hook=strict_pairs))
rejects('scope alteration without record seal',lambda:validate(mutation(lambda r:r.update(scope={'kind':'global','subject_ref':'changed'}),True)))
rejects('invalid UUID',lambda:validate(mutation(lambda r:r.update(id='bad'),True,True)))
rejects('noncanonical UUID casing',lambda:validate(mutation(lambda r:r.update(id='abcdef01-2345-4678-9abc-def012345678'.upper()),True,True)))
rejects('invalid timestamp',lambda:validate(mutation(lambda r:r.update(created_at='yesterday'),True,True)))
rejects('active record without body',lambda:validate(mutation(lambda r:r.pop('body'),True,True)))
rejects('snapshot length',lambda:validate(mutation(lambda d:d['snapshots'][0].update(byte_length=2))))
rejects('snapshot hash',lambda:validate(mutation(lambda d:d['snapshots'][0].update(text='changed'))))
rejects('selector bounds',lambda:validate(mutation(lambda r:r['sources'][0].update(selector={'kind':'utf8-byte-range','start':99999,'length':2}),True,True)))
rejects('duplicate revisions',lambda:validate(mutation(lambda d:d['records'].append(copy.deepcopy(d['records'][0])))))
validate(mutation(lambda r:r.update(validity={'not_before':'2026-10-10T00:00:00Z','expires_at':'2026-11-11T00:00:00Z'}),True,True));checks.append('valid bounded interval')
rejects('reversed validity',lambda:validate(mutation(lambda r:r.update(validity={'not_before':'2026-11-11T00:00:00Z','expires_at':'2026-10-11T00:00:00Z'}),True,True)))
rejects('unpaired surrogate',lambda:rfc8785.dumps({'body':'\ud800'}))
rejects('unsafe integer',lambda:rfc8785.dumps({'number':9007199254740992}))
rejects('nonfinite number',lambda:rfc8785.dumps({'number':float('inf')}))
for p in ['../source','sources/../escape','/sources/a','sources//a','sources/./a','sources/a\\b','sources/C:a']:
 assert not path_ok(p);checks.append('unsafe path '+p)
unknown=mutation(lambda d:d['required_features'].append('example.future.v9'));assert validate(unknown)=='archive_only';checks.append('unknown required feature is archival')
extra=mutation(lambda r:r.update(extensions={'example.meta':{'unknown':['é',{'integrity':'retain nested key'}]}}),True,True);validate(extra);assert json.loads(json.dumps(extra))==extra;checks.append('unknown fields round trip')
A=copy.deepcopy(example['records'][0])
def branch(parent,text):
 r=copy.deepcopy(parent);r['revision']['id']=str(uuid.uuid4());r['revision']['parents']=[rr(parent)];r['body']['text']=text;return seal(r)
B=branch(A,'Machine one edit');C=branch(A,'Machine two edit');M=branch(B,'Reviewed combined edit');M['revision']['parents']=[rr(B),rr(C)];M=seal(M)
fork=copy.deepcopy(example);fork['records']=[A,B,C,M];validate(seal(fork));checks.append('unique concurrent revisions and explicit merge')
partial=copy.deepcopy(example);partial['records']=[B];partial['history']={'coverage':'partial','missing_parents':[rr(A)]};validate(seal(partial));checks.append('declared partial history')
partial['history']={'coverage':'complete','missing_parents':[]};rejects('missing ancestry cannot claim completeness',lambda:validate(seal(partial)))
bad=copy.deepcopy(fork);bad['records'][1]['revision']['parents'][0]['digest']='0'*64;bad['records'][1]=seal(bad['records'][1]);rejects('parent digest mismatch',lambda:validate(seal(bad)))
W=branch(M,'temporary');W.pop('body');W['status']='withdrawn';W['sources']=[];W['withdrawal']={'reason':'user_request'};W=seal(W);fork['records'].append(W);validate(seal(fork));checks.append('content-free withdrawal')
ref=rr(A);sha=example['snapshots'][0]['sha256'];now=example['exported_at'];newid=lambda:str(uuid.uuid4())
plan=seal({'format':'amis.plan','version':'0.4.0','id':newid(),'record':ref,'expected_heads':[ref],'target':{'provider':'claude_code','profile':'example.claude.native.v1','binding_id':newid(),'binding_digest':sha,'adapter':'fixture@0.3','capabilities_digest':sha},'created_at':now,'expires_at':'2026-11-01T00:00:00Z','coordination':'quiescent_required','mutations':[{'resource_ref':'urn:example:target-topic','before':{'state':'absent'},'after':{'state':'present','sha256':sha,'snapshot_ref':sha},'role':'topic'}],'fidelity':[{'pointer':'/body/text','outcome':'verbatim','detail':'Fixture bytes'}],'blockers':[]})
validators['plan'].validate(plan)
remove=copy.deepcopy(plan);remove['mutations'][0]['before'],remove['mutations'][0]['after']=remove['mutations'][0]['after'],remove['mutations'][0]['before'];remove=seal(remove);validators['plan'].validate(remove);checks.append('create and remove plans')
invalid=copy.deepcopy(remove);invalid['mutations'][0]['after']['sha256']=sha;rejects('absent state cannot carry a content hash',lambda:validators['plan'].validate(seal(invalid)))
receipt=seal({'format':'amis.receipt','version':'0.4.0','id':newid(),'plan_id':plan['id'],'plan_digest':plan['integrity']['digest'],'record':ref,'target_binding_id':plan['target']['binding_id'],'observed_at':now,'write_state':'complete','availability':'discoverable','withdrawal':'not_requested','outputs':[{'resource_ref':'urn:example:target-topic','state':'present','sha256':sha,'role':'topic'}],'evidence':[{'kind':'bytes_match','observed_at':now,'output_refs':[sha],'detail':'Example bytes match'}]})
validators['receipt'].validate(receipt);checks.append('separate receipt availability')
# Neutral providers are valid without changing the core schema.
foreign=copy.deepcopy(plan);foreign['target']['provider']='org.example.notes';foreign['target']['profile']='org.example.notes.v2';foreign['mutations'][0]['resource_ref']='urn:uuid:'+newid();validators['plan'].validate(seal(foreign));checks.append('open provider and resource profiles')
held=copy.deepcopy(plan);held['mutations']=[];held['blockers']=['scope_unresolved'];validators['plan'].validate(seal(held));checks.append('held plan without writes')
held['blockers']=[];rejects('empty executable plan',lambda:validators['plan'].validate(seal(held)))
withheld=copy.deepcopy(example);withheld['snapshots'][0].pop('text');withheld['snapshots'][0]['availability']='withheld';assert validate(seal(withheld))=='valid';checks.append('explicitly withheld source bytes')
withheld['snapshots'][0]['text']='should not travel';rejects('withheld payload leakage',lambda:validate(seal(withheld)))
unknown=copy.deepcopy(example);unknown['records'][0]['sources'][0]['snapshot_ref']=None;unknown['records'][0]['provenance']={'completeness':'unknown','omissions':[{'reason':'not_recorded','detail':'Legacy import has no raw source digest.'}]};unknown['records'][0]=seal(unknown['records'][0]);unknown['snapshots']=[];validate(seal(unknown));checks.append('truthful unknown provenance')
authored=copy.deepcopy(example);authored['records'][0]['sources']=[];authored['records'][0]['derivation']['mode']='authored';authored['records'][0]=seal(authored['records'][0]);authored['snapshots']=[];validate(seal(authored));checks.append('authored memory without invented external source')
linked=copy.deepcopy(example);linked['required_features'].append('amis.links.v1');linked['records'][0]['links']=[{'id':newid(),'relation':'related','target':{'memory_id':newid(),'selection':'current'}}];linked['records'][0]=seal(linked['records'][0]);validate(seal(linked));checks.append('informational current link')
linked['required_features'].remove('amis.links.v1');rejects('links must declare required semantics',lambda:validate(seal(linked)))
linked['required_features'].append('amis.links.v1');linked['records'][0]['links'][0]['target']['revision_id']=newid();linked['records'][0]=seal(linked['records'][0]);rejects('mixed pinned and current target',lambda:validate(seal(linked)))
linked['records'][0]['links'][0]['target']=rr(B);linked['records'][0]=seal(linked['records'][0]);validate(seal(linked));checks.append('pinned informational reference may be unresolved')
wrong=copy.deepcopy(example);wrong['records'][0]['version']='0.5.0';wrong['records'][0]=seal(wrong['records'][0]);rejects('record version cannot drift from negotiated draft',lambda:validate(seal(wrong)))
cap=seal({'format':'amis.capabilities','version':'0.4.0','provider':'org.example.markdown','implementation':{'name':'Example read adapter','version':'0.1.0'},'protocol_versions':['0.4.0'],'features':['amis.scope.v1','amis.revision-graph.v1','amis.integrity.jcs-sha256.v1'],'profiles':[{'id':'org.example.markdown.v1','version':'1.0.0','operations':['describe','scan','normalize'],'scopes':['project','global'],'kinds':['feedback','learning','user'],'coordination':[],'verification':[]}],'limits':{'max_document_bytes':10485760,'max_records':1000,'max_depth':64,'max_source_bytes':1048576,'max_total_source_bytes':10485760},'configuration_digest':sha,'observed_at':now,'expires_at':'2026-11-01T00:00:00Z'})
validators['capabilities'].validate(cap);checks.append('read-only capability descriptor')
checked_cap=json.loads((EXAMPLES/'capabilities.json').read_text())
validators['capabilities'].validate(checked_cap)
assert digest(checked_cap)==checked_cap['integrity']['digest'],'capability integrity'
result={'result':'PASS','schemas':len(schemas),'bundles_with_independent_JCS_hashes':len(fixtures)+1,'behavioral_and_negative_checks':len(checks),'checks':checks,'scope':'Draft artifact validation; no native adapter or service conformance claimed.'}
(ARTIFACTS/'contract-report.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
