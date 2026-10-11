<p><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/amis-logo-on-dark.svg"><img src="docs/assets/brand/amis-logo.svg" alt="AMIS, Agent Memory Interface Spec" width="440"></picture></p>

# AMIS - Agent Memory Interface Spec

AMIS is a vendor-neutral specification for moving durable agent memory between tools while preserving meaning, scope, identity and source evidence.

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
