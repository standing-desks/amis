# Changelog

## Updates

- Complete the spec-only repository boundary: remove the Python validator, API and contract tests, validator fixtures, and executable canonicalization and hashing from the guide. Validators and other reference implementations belong to consuming projects.
- Keep the documentation build and documentation-only checks, and remove validator dependencies and Make targets. AMIS 0.4.0 schemas, examples and behavioral requirements are unchanged.
- Scope the repository to the specification, schemas, portable examples, conformance vectors and reference validation tooling. Consuming projects own native converters, profiles and integration tests.
- Move the Codex/Claude renderer and golden conversion fixtures to Twine. Replace the converter demonstration and harness roadmap with a portable contract guide. The 0.4.0 wire schemas are unchanged.
- Remove em and en dashes from authored content and record the writing preference.
- Add the woven AMIS SVG logo, favicon, dark variant and eight interface icons.
- Share the offline projection renderer with the visual guide and test exact files in both Codex/Claude directions.
- Split Claude topics from index/import resources and quote frontmatter scalars safely.

## 0.4.0 - Initial independent specification

- Name the specification AMIS - Agent Memory Interface Spec.
- Define neutral `amis.bundle` and `amis.record` identifiers, with record versions covered by integrity hashes.
- Separate the portable core from optional links, publication and synchronization profiles.
- Replace closed provider lists and filesystem-only mutation targets with open provider/profile identifiers and bound resource references.
- Represent authored memories, unknown provenance and included, withheld, erased or unavailable source bytes explicitly.
- Require canonical lowercase UUIDs to prevent identity aliases.
- Retain immutable revision graphs, conflict preservation, strict JSON/JCS integrity, scope gates, validity intervals, withdrawal and recovery rules.
- Add capability descriptors, version negotiation, local publication plans, independent delivery observations and proposed conformance levels.
- Include interactive Codex/Claude examples and automated artifact validation. Native adapters and transport bindings remain proposed.

Version 0.4.0 is not wire-compatible with the preceding application-specific 0.3.0 design. Migration must preserve original evidence and must not reuse revision IDs for changed data.
