<p><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/amis-logo-on-dark.svg"><img src="docs/assets/brand/amis-logo.svg" alt="AMIS, Agent Memory Interface Spec" width="440"></picture></p>

# AMIS - Agent Memory Interface Spec

**Amis means "friends" in French.** AMIS is a vendor-neutral specification for portable agent memory, preserving meaning, scope, history and source evidence.

**Version 0.4.0** · [Specification](SPEC.md) · [Visual guide](docs/index.html) · [Schemas](schemas/0.4.0/) · [Example bundle](examples/project-feedback.amis.json)

**TWINE-77, in progress:** read the [simple explanation of memory consolidation](docs/memory-consolidation.html) and the [proposed contract changes](docs/proposals/twine-77.md). These are informative drafts. Version 0.4.0 and its published wire contract remain unchanged.

## Repository boundary

This repository contains only the specification, schemas, portable examples and documentation, with a documentation build and documentation checks.

Consuming projects own validators, canonicalization implementations, converters between AMIS and native formats, provider profiles, native fixtures, integration tests, publication, synchronization and product interfaces. They publish their own supported-harness lists and compatibility claims.

[Twine](https://github.com/standing-desks/twine) owns its Codex and Claude Code converters and conversion tests. Implementations are maintained separately from AMIS. No validator, converter, renderer, SDK or reference implementation is distributed here.

## Development

Requires Python 3.11+ and Node.js 22+.

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
npm ci
npx playwright install chromium
make check
```

After documentation changes, run `make docs` and `make check`. Checks cover generated-document freshness, displayed examples, local documentation links and browser presentation. They do not validate AMIS semantics or establish implementation conformance. See [Contributing](CONTRIBUTING.md) and the [changelog](CHANGELOG.md).

To implement AMIS, pin an exact specification revision and its `schemas/` and `examples/`. Follow `SPEC.md` for strict parsing, canonical integrity, scope, history and other behavioral requirements beyond JSON Schema. The repository cleanup leaves the 0.4.0 wire schemas and examples unchanged.
