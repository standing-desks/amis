# AMIS

This repository defines Agent Memory Interface Spec, an independent draft for portable agent memory and adapter behavior.

- Keep the core vendor-neutral. Provider, storage, UI and transport details belong in profiles or informative examples.
- Treat `SPEC.md` as the normative source. Generate `docs/spec.html` from it; do not edit that generated file directly.
- Edit `docs/guide.template.html` and `docs/assets/` for the interactive guide. `docs/index.html` embeds the canonical example and is generated.
- Keep schemas, examples, specification and fixtures consistent. Behavioral constraints are not all expressible in JSON Schema.
- Preserve immutable identities, exact revision references, truthful provenance, explicit compatibility and receiver-owned authorization.
- Do not claim native integration, independent implementation conformance or industry adoption based on browser/schema checks.
- Run `make docs` and `make check` for contract or documentation changes. Update `CHANGELOG.md` when the draft contract changes.
- Keep dependency changes intentional and retain lockfiles. Do not add implementation-specific dependencies to the portable format.
