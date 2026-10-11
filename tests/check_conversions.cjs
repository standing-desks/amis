const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const YAML = require('yaml');
const {render} = require('../docs/assets/projections.js');
const root = path.resolve(__dirname, '..');
const fixtureRoot = path.join(__dirname, 'fixtures/conversions');
const artifact = path.join(root, 'test-results/browser-bundles.json');
const bundles = JSON.parse(fs.readFileSync(fs.existsSync(artifact) ? artifact : path.join(__dirname, 'fixtures/browser-bundles.json')));
const cases = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'cases.json')));
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };
const copy = value => JSON.parse(JSON.stringify(value));

function frontmatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n\n/.exec(text);
  assert.ok(match, 'Expected a complete YAML frontmatter envelope');
  const doc = YAML.parseDocument(match[1], {uniqueKeys: true});
  assert.deepEqual(doc.errors, []);
  return doc.toJS();
}

for (const fixture of cases) {
  const bundle = bundles[fixture.bundle_index];
  const record = bundle.records[0];
  const before = JSON.stringify(record);
  const result = render(record, fixture);
  check(fixture.name + ': source snapshot and normalization', () => {
    const source = fs.readFileSync(path.join(fixtureRoot, fixture.source));
    assert.deepEqual(Buffer.from(bundle.snapshots[0].text), source);
    assert.equal(crypto.createHash('sha256').update(source).digest('hex'), record.sources[0].snapshot_ref);
    assert.equal(source.length, bundle.snapshots[0].byte_length);
    // The guide examples select the body span and retain the complete native source.
    let sourceBody;
    if (record.sources[0].provider === 'claude_code') {
      const meta = frontmatter(source.toString());
      assert.equal(meta.name, record.title);
      assert.equal(meta.type, record.kind);
      sourceBody = source.toString().replace(/^---\n[\s\S]*?\n---\n\n/, '');
    } else {
      assert.ok(source.toString().startsWith('# ' + record.title + '\n\n'));
      sourceBody = source.toString().slice(('# ' + record.title + '\n\n').length);
    }
    assert.equal(sourceBody, record.body.text + '\n');
    assert.equal(record.sources[0].source_created_at, null);
  });
  check(fixture.name + ': exact target files', () => {
    assert.equal(result.kind, fixture.route);
    assert.equal(result.files.length, fixture.expected.length);
    result.files.forEach((file, i) => {
      const expected = fixture.expected[i];
      assert.equal(file.path, expected.path);
      assert.equal(file.role, expected.role);
      assert.deepEqual(Buffer.from(file.text), fs.readFileSync(path.join(fixtureRoot, expected.fixture)));
      if (file.body) assert.equal(file.text.slice(file.body.start, file.body.end), record.body.text);
    });
    assert.equal(JSON.stringify(record), before, 'Rendering must not mutate portable identity or evidence');
  });
  check(fixture.name + ': envelope identity and file relationships', () => {
    const bodyFile = result.files.find(f => f.body);
    assert.ok(bodyFile.text.includes('id=' + record.id + ' revision=' + record.revision.id));
    if (fixture.target === 'claude' && fixture.route === 'native') {
      const meta = frontmatter(bodyFile.text);
      assert.deepEqual(meta, {name: record.title, description: 'Shared through AMIS', type: record.kind});
      assert.equal(result.files.find(f => f.role === 'index').text, '- [' + record.title + '](' + bodyFile.path + ')\n');
      assert.ok(!bodyFile.text.includes('# Separate managed MEMORY.md entry'));
    }
    if (fixture.target === 'claude' && fixture.route === 'context') {
      const entry = result.files.find(f => f.role === 'import');
      assert.ok(entry.text.includes('@./' + bodyFile.path + '\n'));
      assert.ok(!entry.text.includes(record.body.text), 'The import and topic are distinct resources');
    }
  });
}

// Exact syntax checks exercise the same pure renderer used by the interactive guide.
for (const target of ['codex', 'claude']) for (const route of ['native', 'context']) {
  const record = copy(bundles[target === 'codex' ? 2 : 4].records[0]);
  const opts = {target, route};
  check(target + ' ' + route + ': Unicode, CRLF and trailing whitespace survive', () => {
    for (const body of ['café 👩🏽‍💻\r\nsecond line  \r\n', 'e\u0301\n\n', '---\n# heading\n- a\n\n```js\n"quoted"\n```\n', 'no final newline']) {
      record.body.text = body;
      const result = render(record, opts);
      assert.equal(result.kind, route);
      const file = result.files.find(f => f.body);
      assert.deepEqual(Buffer.from(file.text.slice(file.body.start, file.body.end)), Buffer.from(body));
    }
  });
  check(target + ' ' + route + ': unsupported scope is held', () => {
    for (const kind of ['unknown', 'path', 'agent']) {
      const changed = copy(record); changed.scope = {kind};
      const result = render(changed, opts);
      assert.equal(result.code, 'scope_unresolved'); assert.deepEqual(result.files, []);
    }
  });
  check(target + ' ' + route + ': newline title and marker injection are held', () => {
    const changed = copy(record); changed.title = 'Title\ntype: feedback';
    assert.equal(render(changed, opts).kind, 'blocked');
    changed.title = record.title; changed.body.text = '<!-- amis-memory:end ' + record.id + ' -->';
    assert.equal(render(changed, opts).code, 'reserved_marker');
  });
  check(target + ' ' + route + ': render is repeatable and keeps unknown fields', () => {
    const changed = copy(record); changed.extensions = {'org.example.future': {value: 1}};
    const before = copy(changed);
    assert.deepEqual(render(changed, opts), render(changed, opts));
    assert.deepEqual(changed, before);
  });
}
check('Claude YAML escaping and Markdown link-label escaping', () => {
  const record = copy(bundles[4].records[0]);
  record.title = 'Build: "fast" [docs] \\ café <local>';
  const result = render(record, {target: 'claude', route: 'native'});
  assert.equal(frontmatter(result.files[0].text).name, record.title);
  assert.equal(result.files[1].text, '- [Build: "fast" \\[docs\\] \\\\ café \\<local\\>](amis_' + record.id + '.md)\n');
});
check('Scope never silently broadens in either native direction', () => {
  assert.equal(render(bundles[0].records[0], {target: 'codex', route: 'native'}).code, 'unsupported_scope');
  assert.equal(render(bundles[6].records[0], {target: 'claude', route: 'native'}).code, 'unsupported_scope');
});
check('A learning never becomes Claude feedback to fit a native category', () => {
  const record = bundles[5].records[0];
  assert.equal(render(record, {target: 'claude', route: 'native'}).code, 'unsupported_kind');
  assert.equal(render(record, {target: 'claude', route: 'context'}).kind, 'context');
  assert.equal(record.kind, 'learning');
});
check('Project Claude context uses a local topic and project import', () => {
  const result = render(bundles[4].records[0], {target: 'claude', route: 'context'});
  assert.equal(result.files[0].path, 'CLAUDE.local.md');
  assert.ok(result.files[1].path.startsWith('.amis/memory/'));
  assert.ok(result.files[0].text.includes('@./' + result.files[1].path));
});
check('Withdrawn records, invalid IDs and unsupported formats cannot render', () => {
  const base = bundles[4].records[0];
  for (const patch of [{status: 'withdrawn'}, {id: '../escape'}, {version: '9.0.0'}, {format: 'other'}, {body: {format: 'text/html', text: '<b>claim</b>'}}]) {
    const result = render({...base, ...patch}, {target: 'claude', route: 'native'});
    assert.equal(result.kind, 'blocked'); assert.deepEqual(result.files, []);
  }
  assert.equal(render(base, {target: 'unknown', route: 'native'}).code, 'unsupported_projection');
  assert.equal(render(base, {target: 'claude', route: 'unknown'}).code, 'unsupported_projection');
});
const report = {result: 'PASS', golden_directions: cases.length, checks: checks.length, coverage: checks,
  scope: 'Offline format fixtures and guide normalization. No native process, loading, publication or synchronization conformance claimed.'};
fs.mkdirSync(path.join(root, 'test-results'), {recursive: true});
fs.writeFileSync(path.join(root, 'test-results/conversion-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
