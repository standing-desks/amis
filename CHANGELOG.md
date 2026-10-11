# Draft changes

## 0.4.0 — Initial independent draft

- Name the specification AMIS — Agent Memory Interface Spec.
- Define neutral `amis.bundle` and `amis.record` identifiers, with record versions covered by integrity hashes.
- Separate the portable core from optional links, publication and synchronization profiles.
- Replace closed provider lists and filesystem-only mutation targets with open provider/profile identifiers and bound resource references.
- Represent authored memories, unknown provenance and included, withheld, erased or unavailable source bytes explicitly.
- Require canonical lowercase UUIDs to prevent identity aliases.
- Retain immutable revision graphs, conflict preservation, strict JSON/JCS integrity, scope gates, validity intervals, withdrawal and recovery rules.
- Add capability descriptors, version negotiation, local publication plans, independent delivery observations and proposed conformance levels.
- Include interactive Codex/Claude examples and automated artifact validation. Native adapters and transport bindings remain proposed.

This draft is not wire-compatible with the preceding application-specific 0.3.0 design. Migration must preserve original evidence and must not reuse revision IDs for changed data.
