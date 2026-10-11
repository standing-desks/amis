<p><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/amis-logo-on-dark.svg"><img src="docs/assets/brand/amis-logo.svg" alt="AMIS, Agent Memory Interface Spec" width="440"></picture></p>

# AMIS - Agent Memory Interface Spec

**Amis means "friends" in French.** AMIS is a vendor-neutral memory format designed to help different agent harnesses work together. Adapters translate between AMIS and native formats, preserving meaning, scope, history and source evidence.

**Version 0.4.0** · [Specification](SPEC.md) · [Visual guide](docs/index.html) · [Schemas](schemas/0.4.0/) · [Example bundle](examples/project-feedback.amis.json)

## Harness support

**Supported formats** have documented profiles and [tested offline conversions](tests/fixtures/conversions/README.md). Native loading, publication and synchronization still need adapter conformance testing. **Upcoming** profiles are planned.

| Harness | AMIS status |
| --- | --- |
| [Codex](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | Supported formats |
| [Claude Code](https://code.claude.com/docs/en/memory) | Supported formats |
| [Pi](https://github.com/earendil-works/pi/tree/main/packages/coding-agent#context-files) | Upcoming |
| [Oh My Pi (OMP)](https://github.com/can1357/oh-my-pi/blob/main/docs/config-usage.md) | Upcoming |
| [OpenCode](https://docs.opencode.ai/docs/rules/) | Upcoming |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/memory.md) | Upcoming |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions) | Upcoming |
| [Cursor](https://cursor.com/docs/rules) | Upcoming |
| [Google Antigravity](https://antigravity.google/docs/rules) | Upcoming |
| [Cascade (Windsurf / Devin Desktop)](https://docs.devin.ai/desktop/cascade/memories) | Upcoming |
| [Cline](https://docs.cline.bot/customization/cline-rules) | Upcoming |
| [Roo Code](https://roocodeinc.github.io/Roo-Code/features/custom-instructions/) (archived) | Upcoming |
| [Kilo Code](https://kilo.ai/docs/customize/custom-instructions) | Upcoming |
| [Aider](https://aider.chat/docs/usage/conventions.html) | Upcoming |
| [Goose](https://github.com/block/goose/blob/main/documentation/docs/guides/context-engineering/using-goosehints.md) | Upcoming |
| [Amp](https://ampcode.com/docs/customize/agents-md) | Upcoming |
| [Factory Droid](https://docs.factory.com/harness/agents-md) | Upcoming |
| [OpenHands](https://docs.openhands.dev/sdk/guides/persistent-memory) | Upcoming |
| [Hermes Agent](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory) | Upcoming |
| [OpenClaw](https://docs.openclaw.ai/concepts/memory) | Upcoming |
| [Kiro](https://kiro.dev/docs/steering/) | Upcoming |
| [Qwen Code](https://qwenlm.github.io/qwen-code-docs/en/users/features/memory/) | Upcoming |

## Development

Requires Python 3.11+ and Node.js 22+.

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
npm ci
npx playwright install chromium
make check
```

After documentation changes, run `make docs` and `make check`. See [Contributing](CONTRIBUTING.md) and the [changelog](CHANGELOG.md).

To use the [Python validator](amis_contract.py) or [projection renderer](docs/assets/projections.js), pin an exact repository commit, including `schemas/`.
