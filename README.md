<p><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/amis-logo-on-dark.svg"><img src="docs/assets/brand/amis-logo.svg" alt="AMIS, Agent Memory Interface Spec" width="440"></picture></p>

# AMIS - Agent Memory Interface Spec

AMIS is a vendor-neutral specification for moving durable agent memory between harnesses while preserving meaning, scope, identity and source evidence.

**Amis means "friends" in French.** We chose the name because we want different agent harnesses to work together. The AMIS format aims to make their memory compatible through a shared representation and adapters that translate to and from each harness's native format.

**Status: draft 0.4.0.** The data schemas and interactive examples are executable design artifacts. Native adapter behavior and transport bindings still need independent conformance testing before a stable release.

```text
Source memory → source adapter → AMIS record → target adapter → target memory
                                   │
                         History, scope, provenance
                         and explicit delivery evidence
```

- [Specification](SPEC.md) - proposed normative behavior and compatibility rules.
- [Visual guide](docs/index.html) - interactive conversion, conflict and profile examples; open locally in a browser.
- [Schemas](schemas/0.4.0/) - bundles, publication plans, delivery receipts and capability descriptors.
- [Example memory bundle](examples/project-feedback.amis.json) and [capability descriptor](examples/capabilities.json).
- [Visual identity](docs/brand.html) and [SVG assets](docs/assets/brand/).
- [Contributing](CONTRIBUTING.md) and [draft changes](CHANGELOG.md).

## Harness support and roadmap

**Supported draft formats** means AMIS has documented profiles and [tested offline conversion fixtures](tests/fixtures/conversions/README.md). Native loading, publication and synchronization still need adapter conformance testing. **Upcoming** means a planned AMIS profile whose implementation and validation are still to come.

The table covers current format support and additional harnesses on the roadmap. Links point to each harness's own memory or instruction documentation; the listed files are the existing formats an AMIS adapter would need to handle.

| Harness | AMIS status | Memory or instruction formats |
| --- | --- | --- |
| [Codex](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | Supported draft formats | Selected Markdown memory snapshots, candidate ad-hoc notes and `AGENTS.md` context. |
| [Claude Code](https://code.claude.com/docs/en/memory) | Supported draft formats | Topic Markdown, `MEMORY.md` index entries and `CLAUDE.md` imports. |
| [Pi](https://github.com/earendil-works/pi/tree/main/packages/coding-agent#context-files) | Upcoming | `AGENTS.md` and `CLAUDE.md` context files. |
| [Oh My Pi (OMP)](https://github.com/can1357/oh-my-pi/blob/main/docs/config-usage.md) | Upcoming | `AGENTS.md`, `.omp/AGENTS.md` and rules files. |
| [OpenCode](https://docs.opencode.ai/docs/rules/) | Upcoming | `AGENTS.md` and configured instruction files. |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/memory.md) | Upcoming | `GEMINI.md` and private project memory files. |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions) | Upcoming | `AGENTS.md`, `.github/copilot-instructions.md` and scoped `*.instructions.md` files. |
| [Cursor](https://cursor.com/docs/rules) | Upcoming | `AGENTS.md` and `.cursor/rules/*.mdc`. |
| [Google Antigravity](https://antigravity.google/docs/rules) | Upcoming | `AGENTS.md`, `GEMINI.md` and `.agents/rules/`. |
| [Cascade (Windsurf / Devin Desktop)](https://docs.devin.ai/desktop/cascade/memories) | Upcoming | Cascade memories, `.devin/rules/` and legacy `.windsurf/rules/`. |
| [Cline](https://docs.cline.bot/customization/cline-rules) | Upcoming | `.clinerules/` and `.cline/rules/`. |
| [Roo Code](https://roocodeinc.github.io/Roo-Code/features/custom-instructions/) (archived) | Upcoming | Legacy `.roo/rules/`, mode-specific rules and `.roorules`. |
| [Kilo Code](https://kilo.ai/docs/customize/custom-instructions) | Upcoming | `AGENTS.md` and instruction files configured in `kilo.jsonc`. |
| [Aider](https://aider.chat/docs/usage/conventions.html) | Upcoming | Markdown conventions and other context files loaded with `--read`. |
| [Goose](https://github.com/block/goose/blob/main/documentation/docs/guides/context-engineering/using-goosehints.md) | Upcoming | `.goosehints` instruction files. |
| [Amp](https://ampcode.com/docs/customize/agents-md) | Upcoming | `AGENTS.md` and referenced guidance files. |
| [Factory Droid](https://docs.factory.com/harness/agents-md) | Upcoming | `AGENTS.md` project and directory instructions. |
| [OpenHands](https://docs.openhands.dev/sdk/guides/persistent-memory) | Upcoming | `AGENTS.md` and opt-in user/project `MEMORY.md` indexes and daily logs. |
| [Hermes Agent](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory) | Upcoming | Persistent `MEMORY.md` and `USER.md` files. |
| [OpenClaw](https://docs.openclaw.ai/concepts/memory) | Upcoming | `MEMORY.md` and daily `memory/YYYY-MM-DD.md` notes. |
| [Kiro](https://kiro.dev/docs/steering/) | Upcoming | `AGENTS.md` and `.kiro/steering/` files. |
| [Qwen Code](https://qwenlm.github.io/qwen-code-docs/en/users/features/memory/) | Upcoming | `QWEN.md`, `AGENTS.md` and auto-memory notes. |

Shared filenames alone do not establish AMIS compatibility. Each profile must preserve the harness's scope, loading rules and authorization boundaries. Upcoming profiles have no release dates yet.

## Design boundaries

The core covers immutable record revisions, explicit scope, provenance, lifecycle and canonical integrity. It does not require a particular application, database, programming language, model or transport.

Optional profiles add informational links, native publication and synchronization. Providers advertise capabilities; unknown required semantics prevent publication. Codex and Claude Code are initial illustrative adapter profiles, not dependencies or certified implementations.

Receivers own authorization. A checksum establishes byte consistency, not authorship, truth or permission. Delivery evidence distinguishes written content, discoverability and observed loading.

## Work on the draft

Use Python 3.11+ and Node.js 22+:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
npm ci
npx playwright install chromium
make check
```

`make check` checks generated documentation, exercises the browser examples, checks exact Codex/Claude projection files in both directions, validates all four schemas and verifies canonical hashes with an independent Python implementation. Reports and screenshots go to `test-results/`.

Edit `SPEC.md` for normative text. Edit `docs/guide.template.html` and `docs/assets/` for the visual guide. Run `make docs` to rebuild the generated HTML, then `make check`. Tests are artifact checks, not proof of native harness integration.

## Conversion format fixtures

`make check-conversions` runs four golden conversions and escaping, byte preservation, identity and scope checks. The [fixture guide](tests/fixtures/conversions/README.md) describes the tested input and output formats. The browser uses the same offline renderer. Native loading and safe publication still require adapter integration tests.

## Consume a pinned draft

Pin an exact repository commit, including `schemas/`, when using these draft artifacts.
The importable [Python API](amis_contract.py) provides `loads`, `seal`, `digest`,
`record_reference`, `validate_bundle` and `validate_document`. Add the checkout root
to Python's module path and install `requirements-dev.txt`. Importing the API does
not run tests or generate reports. Validation remains active under `python -O`.

`validate_bundle` returns `valid` or `archive_only` for unknown required features.
`validate_document(kind, value)` checks the schema and integrity of a plan, receipt
or capability descriptor. Invalid inputs raise exceptions. Callers must enforce
input limits and retain receiver-owned authorization and publication policy.
External snapshot files are not resolved by this offline checker. These checks
cover the tested draft behaviors, not all normative requirements of the spec.

The dependency also provides the pure CommonJS/browser renderer at
`docs/assets/projections.js`: `render(record, {target, route})` returns proposed
files or a blocked route. Validate the bundle before rendering and hold
`archive_only` bundles. Rendering does not authorize or perform a write.

## Toward 1.0

Stability requires shared conformance vectors, independent implementations, a reviewed extension registry, explicit draft migrations and tested native profiles. Breaking semantics require versioned changes; the draft does not promise unlimited forward compatibility.
