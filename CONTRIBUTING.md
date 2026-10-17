# Contributing to AMIS

Keep the specification independent of any application or provider. New providers implement profiles; they do not change the meaning of core fields.

Validators, canonicalization implementations, native parsers, renderers, provider
profiles, conversion fixtures and integration tests belong to consuming projects.
This repository accepts specification text, schemas, portable examples and
documentation, with tooling only for building and checking that documentation.
Product interfaces and supported-harness roadmaps are maintained by the
implementations that provide them.

Propose changes with:

1. The concrete interoperability problem and a before/after example.
2. Whether the change belongs in the core, an optional feature, a provider profile or a transport binding.
3. Compatibility, migration, resource limits and failure behavior.
4. Schema/example updates and a description of the conformance cases implementations must cover.

`SPEC.md` is the normative specification. Schemas constrain structure; consumers must also implement behavioral validation. Visual explanations are informative and must not imply that this repository provides an implementation or that adapters have been certified.

Preserve unknown optional data. Unknown required semantics must fail explicitly or remain opaque archival data. Never reuse a revision identity for changed record data, infer semantic deletion from an incomplete export, or treat a portable record as authorization.

Use `make docs` after editing specification or guide sources, and `make check` before submitting a change. Record user-visible contract changes in `CHANGELOG.md`. The 0.x series allows breaking changes only through an explicit new version and migration notes.
