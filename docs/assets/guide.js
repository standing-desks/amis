'use strict';
const $ = id => document.getElementById(id);
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = value => JSON.parse(JSON.stringify(value));
const doc = JSON.parse($('canonical-example').textContent);
const record = doc.records[0];
let selectedGroup = 'identity', full = false, stressEpoch = 0;
function canonical(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') {
    for (const c of value) { const n = c.codePointAt(0); if (n >= 0xd800 && n <= 0xdfff) throw Error('Invalid Unicode scalar'); }
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))) throw Error('Unsupported numeric value');
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (typeof value === 'object') return '{' + Object.keys(value).sort().map(key => canonical(key) + ':' + canonical(value[key])).join(',') + '}';
  throw Error('Unsupported JSON value');
}
async function seal(value) {
  const copy = clone(value); delete copy.integrity;
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(copy)));
  const digest = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  return {...copy, integrity:{algorithm:'sha256',canonicalization:'jcs-rfc8785',digest}};
}
async function integrityOK(value) { return (await seal(value)).integrity.digest === value.integrity?.digest; }
const groups = {
  identity:{note:'Memory identity stays stable. Each changed revision has a distinct UUID and exact parent references. Integrity covers all meaning-bearing fields.',value:() => ({id:record.id,revision:record.revision,created_at:record.created_at,integrity:record.integrity})},
  meaning:{note:'The record carries the claim, representation and an open kind. Native parsing and rendering are maintained by consuming projects.',value:() => ({title:record.title,kind:record.kind,body:record.body})},
  scope:{note:'Scope describes intended applicability. Lifecycle and validity are separate. Receiver-owned bindings and approval never come from portable content.',value:() => ({scope:record.scope,status:record.status,validity:record.validity})},
  provenance:{note:'Sources reference exact snapshot hashes. Derivation declares transformations and input revisions. Missing evidence is recorded explicitly.',value:() => ({sources:record.sources,derivation:record.derivation,provenance:record.provenance,snapshots:doc.snapshots})}
};
function showGroup(key) {
  selectedGroup = key;
  document.querySelectorAll('[data-passport]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.passport === key)));
  $('passport-file').textContent = full ? 'memory.amis.json / complete bundle' : 'record / ' + key;
  $('passport-code').textContent = JSON.stringify(full ? doc : groups[key].value(), null, 2);
  $('passport-explain').textContent = full ? 'The complete portable AMIS 0.4.0 example. This guide does not convert or publish native files.' : groups[key].note;
  $('show-full').textContent = full ? 'Show selected fields' : 'Show full bundle';
}
const profiles = {
  core:['Core','Records and portable bundles','Identity, scope, lifecycle, provenance, revision graphs and canonical integrity. This contract is independent of a provider, database, UI or transport.','amis.scope.v1'],
  links:['Links','Explicit references between records','Typed links identify an exact revision or a current head set. They do not grant authority or create independent evidence.','amis.links.v1'],
  publication:['Publication','Plans and honest delivery evidence','An optional contract for exact resource mutations, receiver-owned authorization, write coordination and separate availability observations. Consumers implement the native routes.','amis.publication.v1'],
  sync:['Synchronization','Durable observation and reconciliation','An optional contract for scoped cursors, explicit withdrawal, retained conflicts and recovery. Consumers implement watchers and native coordination.','amis.sync.v1']
};
function showProfile(key) {
  const profile = profiles[key];
  document.querySelectorAll('[data-profile]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.profile === key)));
  $('profile-preview').innerHTML = '<div><span class="eyebrow">' + esc(profile[0]) + '</span><h3>' + esc(profile[1]) + '</h3><p>' + esc(profile[2]) + '</p></div><pre>format: "amis.bundle"\nversion: "0.4.0"\nfeature: "' + esc(profile[3]) + '"</pre>';
}
const cases = {
  fork:['Concurrent revisions remain distinct.','Preserve both heads','Two edits reference the same parent by revision ID and digest. A reviewed merge references both heads; wall-clock time never selects a winner.'],
  tamper:['Meaning is covered by integrity.','Integrity mismatch','Changing the scope without updating the record digest invalidates its integrity. A recomputed unsigned digest would still establish consistency only, not trust or permission.'],
  feature:['Unknown requirements remain explicit.','Archive only','A reader that does not understand a required feature preserves the document without publishing a partial interpretation. Unknown optional fields remain part of the integrity-covered data.'],
  withdrawal:['History does not silently resurrect.','Retain the withdrawal','A known withdrawal holds automatic publication for that identity. Restoration requires a separately reviewed revision that references the current heads.']
};
async function showCase(key) {
  const epoch = ++stressEpoch, value = cases[key];
  document.querySelectorAll('[data-stress]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stress === key)));
  let detail = value[2];
  if (key === 'tamper') {
    const changed = clone(record); changed.scope = {kind:'global',subject_ref:'another-owner'};
    const valid = await integrityOK(changed);
    if (epoch !== stressEpoch) return;
    detail += ' Computed digest comparison: ' + (valid ? 'MATCH (unexpected)' : 'MISMATCH') + '.';
  }
  $('stress-result').innerHTML = '<span class="badge amber">' + esc(value[1]) + '</span><h3>' + esc(value[0]) + '</h3><p>' + esc(detail) + '</p>';
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.passport) showGroup(button.dataset.passport);
  if (button.dataset.profile) showProfile(button.dataset.profile);
  if (button.dataset.stress) showCase(button.dataset.stress);
  if (button.id === 'show-full') { full = !full; showGroup(selectedGroup); }
  if (button.id === 'theme') document.body.classList.toggle('dark');
});
window.amisSpecDemo = {getDocument:() => clone(doc), canonical, seal, integrityOK};
showGroup('identity'); showProfile('core'); showCase('fork');
