# Conversion format fixtures

These synthetic inputs test the format examples, not a live agent or general native-memory parser. There are no personal memories in this fixture set.

| Fixture | Source | Target resources |
| --- | --- | --- |
| claude-to-codex-context | Claude topic Markdown with frontmatter, project feedback | Managed AGENTS.md section |
| claude-to-codex-native | Claude topic Markdown with frontmatter, reviewed global preference | Codex ad-hoc Markdown note candidate |
| codex-to-claude-native | Selected Codex Markdown memory, reviewed project feedback | Claude topic plus separate MEMORY.md index entry |
| codex-to-claude-context | Selected Codex Markdown memory, reviewed global preference | User CLAUDE.md import plus separate topic |

`source.md` is the exact source snapshot. `expected-*.md` files are checked-in output bytes. `cases.json` connects each case to the canonical AMIS bundle in `../browser-bundles.json`. The browser exercises the native-wrapper selection and AMIS normalization. The format suite checks the resulting source hash, body, native fields and exact target files using the same renderer as the visual guide. A YAML parser independently checks emitted Claude frontmatter.

The renderer produces new resource fragments only. Paths resolve under already-reviewed local bindings; they are not instructions to overwrite an existing file. `body` spans in the renderer result use JavaScript UTF-16 offsets for tests and display, not portable AMIS byte selectors. Formatting preserves the selected memory body exactly and retains the full source snapshot. UUID markers are descriptive; they do not establish ownership without a receiver-owned receipt.

Additional cases cover YAML quoting, Markdown link labels, Unicode, CRLF, trailing whitespace, blank lines, code fences, unsupported scopes and kinds, withdrawn records, invalid IDs, reserved markers and deterministic rendering. These checks do not verify native loading, existing-file preservation, budgets, approval, version discovery, crash recovery or synchronization. Those remain adapter conformance work.

The Claude topic/index and context import examples follow the [Claude memory documentation](https://code.claude.com/docs/en/memory). Codex ad-hoc notes remain a candidate profile based on the [pinned source](https://github.com/openai/codex/blob/0ada5d8806cdad498230d5b1b2924091e04c8feb/codex-rs/ext/memories/src/local/ad_hoc_note.rs); this is not a stable cross-harness API. Do not infer memory scope from its storage path.
