/* Offline format examples. These functions render bytes; they never write files. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.amisProjections = factory();
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  const claudeKinds = new Set(['user', 'feedback', 'project', 'reference']);
  const held = (code, reason) => ({kind: 'blocked', code, reason, files: []});

  function render(record, {target, route}) {
    if (!['codex', 'claude'].includes(target) || !['native', 'context'].includes(route))
      return held('unsupported_projection', 'Unknown target or route.');
    if (record.format !== 'amis.record' || record.version !== '0.4.0')
      return held('unsupported_version', 'The example renderer only supports AMIS records at 0.4.0.');
    if (!uuid.test(record.id) || !uuid.test(record.revision?.id))
      return held('identity_conflict', 'Canonical memory and revision UUIDs are required.');
    if (record.status !== 'active') return held('inactive_record', 'Only active records can be rendered.');
    if (!['text/plain', 'text/markdown'].includes(record.body?.format) || !record.body.text)
      return held('unsupported_projection', 'A nonempty plain text or Markdown body is required.');
    if (typeof record.title !== 'string' || !record.title.trim() || /[\r\n\u0000-\u001f\u007f]/.test(record.title))
      return held('unsupported_projection', 'This profile requires a single-line title without control characters.');
    if (typeof record.kind !== 'string' || /[\r\n\u0000-\u001f\u007f]/.test(record.kind))
      return held('unsupported_projection', 'The kind must fit a single metadata line.');
    if ([record.body.text, record.title].some(text => text.includes('<!-- amis-memory:')))
      return held('reserved_marker', 'Source text contains a reserved projection marker; review an alternate encoding.');
    const scope = record.scope?.kind;
    if (!['global', 'project'].includes(scope))
      return held('scope_unresolved', 'Unknown, path and agent scopes require a compatible reviewed binding.');
    if (route === 'native' && target === 'codex' && scope !== 'global')
      return held('unsupported_scope', 'Codex global memory cannot provide project-scoped loading.');
    if (route === 'native' && target === 'claude' && scope !== 'project')
      return held('unsupported_scope', 'Claude repository memory cannot provide global delivery.');
    if (route === 'native' && target === 'claude' && !claudeKinds.has(record.kind))
      return held('unsupported_kind', 'There is no equivalent Claude native category; use a compatible context route.');

    const id = record.id;
    const marker = '<!-- amis-memory:id=' + id + ' revision=' + record.revision.id + ' -->';
    const files = [];
    function bodyFile(path, role, prefix, suffix) {
      const text = prefix + record.body.text + suffix;
      files.push({path, role, text, body: {start: prefix.length, end: prefix.length + record.body.text.length}});
    }
    if (target === 'codex' && route === 'context') {
      bodyFile('AGENTS.md', 'context', '<!-- amis-memory:begin ' + id + ' -->\n## ' + record.title + '\n',
        '\n' + marker + '\n<!-- amis-memory:end ' + id + ' -->\n');
    } else if (target === 'codex') {
      bodyFile('extensions/ad_hoc/notes/amis-' + id + '-r' + record.revision.id + '.md', 'note',
        '# ' + record.title + '\nKind: ' + record.kind + '\nScope: global / mapped user\n\n', '\n\n' + marker + '\n');
    } else if (route === 'native') {
      const filename = 'amis_' + id + '.md';
      // JSON double-quoted strings are YAML-compatible scalars, including colons and quotes.
      bodyFile(filename, 'topic', '---\nname: ' + JSON.stringify(record.title) +
        '\ndescription: "Shared through AMIS"\ntype: ' + JSON.stringify(record.kind) + '\n---\n\n', '\n' + marker + '\n');
      const label = record.title.replace(/\\/g, '\\\\').replace(/[\[\]<>]/g, c => '\\' + c);
      files.push({path: 'MEMORY.md', role: 'index', text: '- [' + label + '](' + filename + ')\n'});
    } else {
      const topic = (scope === 'global' ? 'amis-memory/' : '.amis/memory/') + id + '.md';
      files.push({path: scope === 'global' ? 'CLAUDE.md' : 'CLAUDE.local.md', role: 'import',
        text: '<!-- amis-memory:begin ' + id + ' -->\n@./' + topic + '\n<!-- amis-memory:end ' + id + ' -->\n'});
      bodyFile(topic, 'topic', '# ' + record.title + '\n\n', '\n' + marker + '\n');
    }
    return {kind: route, files};
  }
  return {render};
});
