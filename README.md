<p><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/amis-logo-on-dark.svg"><img src="docs/assets/brand/amis-logo.svg" alt="AMIS, Agent Memory Interface Spec" width="440"></picture></p>

# AMIS - Agent Memory Interface Spec

**Amis means "friends" in French.** AMIS is a vendor-neutral specification for portable agent memory, preserving meaning, scope, history and source evidence.

**Version 0.4.0** · [Specification](SPEC.md) · [Visual guide](docs/index.html) · [Schemas](schemas/0.4.0/) · [Example bundle](examples/project-feedback.amis.json)

## Repository boundary

This repository owns the specification and its supporting schemas, portable examples, conformance vectors, reference validation tooling and documentation.

Consuming projects own converters between AMIS and native formats, provider profiles, native fixtures, integration tests, publication, synchronization and product interfaces. They publish their own supported-harness lists and compatibility claims.

[Twine](https://github.com/standing-desks/twine) owns its Codex and Claude Code converters and conversion tests. Those implementations are maintained separately from AMIS. This repository does not distribute native converters or promise support for particular harnesses.

## Development

Requires Python 3.11+ and Node.js 22+.

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
npm ci
npx playwright install chromium
make check
```

After documentation changes, run `make docs` and `make check`. Checks cover the portable contract, generated documentation and the specification guide. They do not establish native integration conformance. See [Contributing](CONTRIBUTING.md) and the [changelog](CHANGELOG.md).

To use the [reference validator](amis_contract.py), pin an exact repository commit, including `schemas/`. It checks AMIS structure, integrity and tested behavioral rules; callers own resource limits, native conversion, authorization and publication. The ownership change leaves the 0.4.0 wire schemas unchanged.
