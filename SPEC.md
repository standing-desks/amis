# AMIS - Agent Memory Interface Spec

**Version:** 0.4.0

AMIS is an independent specification for portable agent memory and interoperable adapter behavior. AMIS is not an adopted industry standard. Native adapters and transport bindings still require conformance testing.

The terms MUST, MUST NOT, SHOULD and MAY express the proposed conformance requirements.


## Independent core. Explicit receiver behavior.

**AMIS - Agent Memory Interface Spec** is an independent, vendor-neutral specification. It defines portable memory semantics and interoperable adapter behavior. No product, operating system, database, SDK or transport is required. Consuming projects own converters, native format profiles and integration tests. This document does not claim industry adoption or acronym uniqueness.

The portable core contains knowledge and its evidence. The adapter contract describes conversion and delivery. Local policy decides which records may be published to which bindings. Portable data MUST NOT supply that authority. A record marked `active` is a lifecycle claim, never authorization. A receiver may require human approval or apply an explicit local policy; the portable record cannot select that policy or grant itself trust.

This repository contains the specification, schemas, portable examples and documentation. Validators, canonicalization implementations, native parsers, renderers, publication implementations, user interfaces and product roadmaps belong to consuming projects. Documentation tooling builds and checks the published pages; it does not implement the memory contract. The specification does not promise model recall or universal native compatibility.

Parsing changes representation deterministically. Semantic consolidation (combining claims, resolving contradictions or summarizing) creates a separately reviewed proposal with explicit inputs. Equal wording alone never proves equivalent scope, independent evidence or identical memory identity.

## Records, declared evidence and history.

```
{
  "format": "amis.bundle",
  "version": "0.4.0",
  "bundle_id": "<uuid>",
  "exported_at": "<timestamp>",
  "producer": { "name": "Example producer", "version": "<implementation version>" },
  "required_features": [
    "amis.scope.v1",
    "amis.revision-graph.v1",
    "amis.integrity.jcs-sha256.v1"
  ],
  "history": { "coverage": "complete", "missing_parents": [] },
  "records": [ "<immutable revisions>" ],
  "snapshots": [ "<source descriptors and optional payloads>" ],
  "integrity": { "algorithm": "sha256", "canonicalization": "jcs-rfc8785", "digest": "<hex>" }
}
```

A `*.amis.json` manifest uses UTF-8 JSON and the existing `application/json` media type. The top-level format is `amis.bundle`; each record independently declares `format: amis.record` and `version: 0.4.0`, so its digest binds the interpretation as well as content. Schema files are distributed with the specification; AMIS claims no registered URI namespace, media type or hosted schema endpoint. Small sources can be inline; larger packs use regular files under `sources/` next to the manifest. Compression, remote URL retrieval and streaming wire formats are outside the base specification. Readers MUST declare maximum document bytes, records, nesting depth, snapshots and total expanded bytes before ingest. Exceeding a limit is an explicit failure or incomplete scan, never silent truncation.

| Record field | Contract |
| --- | --- |
| id | Stable memory UUID; never reassigned to another claim. |
| revision | Unique revision UUID, exact parents and creation time; immutable. |
| title · kind · body | Readable label, open category, plain text or Markdown. Active records require nonempty content. An authored record may have no external sources. |
| scope | Global, project, path, agent or unknown; logical identity is separate from local paths. |
| status · validity | Active/withdrawn, plus optional not-before and expiry bounds. Never a publication permission. |
| provenance | Complete, partial or unknown derivation inventory; explicit omissions without invented origin. |
| sources | Opaque source identity, provider, logical locator, optional snapshot reference, observation and nullable native dates. |
| derivation | Authored, verbatim, parsed, human edited or model proposed; versioned adapter and exact input revision references. |
| integrity | Canonical record digest covering meaning, scope, history, evidence and unknown data. |
| extensions | Optional namespaced additions; unknown fields at every object level are retained. |

Evidence availability is explicit. A source may have `snapshot_ref: null` when no digest was recorded; never fabricate one. A known snapshot declares a SHA-256 reference, media type, nullable byte length and `availability`: included, withheld, erased or unavailable. Included snapshots require a non-null byte length and exactly one payload: `text`, canonical padded RFC 4648 `base64`, or a relative `path`. Other availability states MUST carry no payload. Unknown length is null, not zero. Availability describes the evidence supplied; an erased descriptor is not proof that every historical or remote copy was destroyed. Every non-null source reference resolves to a descriptor, even when its bytes are absent.

Text hashes decoded UTF-8 bytes with no BOM removal, newline conversion or Unicode normalization. Use base64 or a file for bytes that cannot be represented as valid Unicode. Included payload length and hash MUST match. Snapshot digests are unique in a bundle. UTF-8 byte selectors must be in bounds and end on character boundaries; a selector cannot be certified while its bytes are unavailable. A valid record hash does not prove missing source bytes were verified.

`provenance.completeness` is complete, partial or unknown. It describes the recorded derivation inventory, not whether all source payloads travel with this pack. Record known omissions and their reasons. Complete source inventories may reference deliberately withheld bytes. An authored record can have an empty source list; an imported record with unknown origin must disclose that gap. A receiver decides whether evidence is adequate for publication and reports that decision. Transporting a different availability descriptor changes the bundle digest; changing a record’s provenance changes its revision. Source locators and metadata also need disclosure review because withholding a body does not remove them.

File payloads MUST remain within the pack root, under `sources/`, using slash-separated relative components. Reject empty, dot, dot-dot, absolute, drive, NUL and backslash paths; reject symlink traversal and non-regular files. Resolve and read using directory-relative, no-follow operations so validation itself is not subject to path replacement races. No external links are fetched automatically. Source locators are descriptive identifiers, never executable paths or write destinations.

Preserve qualifiers and links. Relative links need source context: an adapter must report whether it resolves, packages, rebases or blocks them. Unsupported attachments and native metadata stay in source snapshots with a fidelity report. Whole transcripts, skills, instructions and settings are not automatically durable memories; scan them as their native type and require explicit extraction policy.

## Model a graph, not a counter.

Each record has a memory UUID and a distinct revision UUID. UUIDs MUST use lowercase hexadecimal in the hyphenated 8-4-4-4-12 representation; reject noncanonical casing rather than normalizing it after hashing. Use collision-resistant UUID generation; identifiers MUST NOT be derived only from text or wall-clock time. Each parent reference is `{memory_id, revision_id, digest}`. Parent revisions belong to the same memory. A genesis revision has no parents; an accepted edit references its base. A reviewed merge references all resolved heads. Same revision ID with different data is an identity conflict, never an overwrite.

Different memories combined into a new claim get a new memory ID, with exact inputs in `derivation.inputs`. Those references may cross memory IDs. The lineage graph across parent and derivation edges MUST be acyclic and cannot reference itself. Accepting a same-memory edit retains original `created_at`. Revision and source times describe observations; clock skew MUST NOT select a conflict winner.

A bundle may contain several revisions of one memory, but never duplicate revision IDs. `history.coverage=complete` requires every parent and derivation input to be resolvable within the bundle. A partial pack lists the exact unresolved references in `missing_parents`, including derivation inputs. Recipients may fill those gaps from verified local history. Missing ancestry is retained explicitly; it blocks publication and reconciliation that depend on unresolved history. The known graph must still be cycle-free. Unknown hidden ancestry cannot be certified.

Several active heads require review; “newest timestamp wins” is forbidden. A known withdrawal holds automatic publication for that identity, including incoming branches based on older history. A deliberate restoration creates an explicitly reviewed active revision referencing all current heads, including withdrawals. Native disappearance alone does not create a tombstone.

Validity is independent of history. Null bounds mean unspecified. When both exist, `not_before < expires_at`; applicability uses `not_before ≤ now < expires_at`. An expired or future record remains readable but is ineligible for new publication. Expiry schedules tracked removal or correction of existing owned projections. Renewal creates a reviewed revision; it does not rewrite history. A detector that cannot establish a credible current time holds time-bound publication.

## Hash the whole meaning-bearing record.

The required baseline uses the [JSON Canonicalization Scheme, RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) and SHA-256. For a record digest, remove only that record’s top-level `integrity` member, canonicalize the remaining JSON and hash the UTF-8 bytes. Unknown fields and nested members named “integrity” remain included. Bundle, plan and receipt digests follow the same top-level rule; a bundle digest includes its records’ integrity objects.

Readers MUST reject duplicate JSON member names, non-finite numbers, malformed UTF-8 and unpaired surrogates before materialization. Integer values must fit the interoperable range ±(2^53 − 1); higher precision belongs in declared strings. Apply the [I-JSON interoperability constraints](https://www.rfc-editor.org/rfc/rfc7493) and the schema’s asserted UUID/date-time formats. Do not normalize string content before hashing. Object order and insignificant JSON whitespace do not change the digest; string whitespace does.

Integrity proves consistency, not authorship, truth or authorization. An attacker can recompute an unsigned digest. Newly imported content remains untrusted evidence requiring local policy and review. Source prose cannot change adapters, grant permissions or override scope by instruction. Publishing memory intentionally introduces model context, so exact content is part of the review surface.

Reader sequence: enforce byte limits and strict parsing → select a supported format version → validate structure with format assertions → verify canonical digests → resolve snapshots and references → evaluate semantics, compatibility and local policy. Schema validation alone is insufficient. Do not fetch schemas or extension code from imported identifiers.

## Preserve what you do not understand. Hold what you cannot honor.

| Input | Reader behavior | Publication |
| --- | --- | --- |
| Supported exact 0.x version + understood features | Validate and import. | Apply normal scope/review gates. |
| Unknown 0.x or major version | Retain opaque original bytes with a limit-bounded error. | Blocked until explicit migration or support. |
| Unknown required feature | Archive without interpreting the unsupported semantics. | Blocked. |
| Unknown optional field or extension | Preserve it exactly as JSON data; include it in integrity. | Allowed only when it cannot affect the known meaning or behavior. |
| Future stable 1.x policy | Patch clarifies; minor adds optional compatible capability; major breaks semantics. | Required feature negotiation still applies. |

Every 0.x version is explicit and may break compatibility; accepting a previous version by relabeling it 0.4.0 is forbidden. Migration retains original bytes, creates a validated new representation and records derivation; digest or semantic changes require new revisions and publication review. The future 1.x policy is a commitment to adopt before stability, not a compatibility promise for current 0.x versions. The prior application-specific 0.3.0 design is not wire-compatible: namespace, record envelope, scope and publication descriptors changed. Migration must preserve original identifiers as source references and must never reuse a revision ID for changed data.

Required features are namespaced, versioned identifiers. The initial three cover scope, revision graphs and canonical integrity. An extension that alters interpretation, identity, retention, scope or publication MUST declare a required feature; “optional” cannot hide behavioral requirements. Unknown kinds or scopes are preservable but not publishable by an adapter that cannot represent them. Local policy can be stricter.

Maintain a public, versioned specification registry of feature identifiers, kinds, error codes and conformance vectors with a change log and maintainer review. Reserve `amis.*` tokens for the specification’s core and feature registry; third parties use reverse-domain names. Readers MUST carry unknown values through import/export without dropping them or creating a revision. If an edit cannot safely preserve a field’s meaning, hold the edit. Exclude embeddings, transport, signatures, encryption and distributed consensus from the base; define separate reviewed profiles if needed.

## A storage directory is not a scope guarantee.

Project, user and agent identities resolve through confirmed local bindings outside portable bundles. Project names, repository URLs and matching folder names may suggest a binding but cannot establish one. Worktrees may map to the same logical repository only by explicit local configuration. A changed binding invalidates approval. Path scope uses repository-relative components and explicit `exact` or `subtree` matching, with no implicit globbing or platform case folding; an adapter unable to preserve the semantics holds publication.

A project may be a repository, workspace or another collection; the local binding supplies that meaning. An adapter MUST hold publication unless a tested capability matches the record's scope exactly. Scope describes intended applicability and loading, not a security boundary or guaranteed model obedience. Labeling globally loaded text for one project does not create project loading isolation.

Consumer-owned profiles document native formats, scope mappings, discovery and loading rules, resource budgets, tested versions and observable delivery evidence. The specification does not define a supported-harness list or maintain native file layouts.

Adapters MUST advertise tested versions and effective configuration fingerprints. Unknown write layouts fail closed; read support may independently retain opaque snapshots. Preserve existing content, generated resources and source stores according to the consumer's tested native profile. Source discovery may be broader than supported write destinations.

## Six operations, with explicit failure modes.

The operation contract is independent of language and transport. A binding may use local calls, a CLI or an authenticated service; no particular binding is mandatory. The visual operation payloads are illustrative excerpts, not a finished RPC wire schema. Bundle, capability, plan and receipt schemas define data shape; these behavioral rules complete the proposed contract.

1. **Describe:** return adapter/version, supported AMIS versions, required features, readable formats, kinds/scopes/routes, limits, tested harness versions, configuration fingerprint, write coordination and observable loading levels.
2. **Scan:** return a pinned inventory generation, bounded pages and resumable cursors, source fingerprints and coverage errors. Cursor expiry or source mutation requires rescan; an interrupted or stale inventory never implies deletion.
3. **Normalize:** snapshot before parsing, reuse a verified local source identity or owned receipt, preserve exact provenance, classify uncertain semantics and return candidates. Unknown source creation dates remain null. No implicit summarization or authorization. Sources without recoverable bytes use the explicit provenance-gap representation.
4. **Plan:** resolve scope and current heads, check validity, compatibility, owned base bytes, target budget and write coordination. Freeze explicit before/after resource states (present with verified snapshots, or absent for creation/removal), expected head references, binding/configuration digests, fidelity by JSON pointer, blockers and an expiry. Output a sealed local plan.
5. **Apply:** require an unexpired local approval of that plan digest. Recheck current heads, policy, bindings, configuration and resource preconditions. Journal before mutation; apply per-target writes through declared coordination and preserve partial outcomes.
6. **Verify:** inspect exact resulting bytes and route-specific evidence. Report write, availability and withdrawal independently, with observation time, output references and explicit limits. Return changed/missing/conflicting outputs for reconciliation.

Minimum stable error families: `unsupported_version`, `unsupported_feature`, `invalid_integrity`, `history_incomplete`, `identity_conflict`, `scope_unresolved`, `unsupported_projection`, `budget_exceeded`, `stale_plan`, `write_conflict` and `verification_unavailable`. Each outcome includes a retry policy: never, after review, after rescan or same plan. Do not retry permission/configuration/semantic failures as transient I/O.

A fidelity report accounts for every record field: verbatim, mapped, retained locally, blocked or explicitly approved omission. Content, identity continuity and scope cannot be silently omitted. Reports and resource diffs are both part of approval. Local approval stores decision ID, actor/policy, plan digest and decision/expiry time separately; importing a plan or a receipt never recreates it.

## Per-target recovery, without pretending files are transactions.

Persist immutable intent, approval linkage and exact before/after snapshots before any mutation. Bind the idempotency key to the receiver instance, target binding and immutable plan digest and retain the resulting receipt across restarts. A completed output that still matches becomes a no-op on retry. One failed target must not rewrite successful targets. Multi-file and multi-harness changes are not globally atomic.

Each adapter declares `versioned_api` (real conditional version checks), `cooperative_lock` (all writers honor the same lock), or `quiescent_required` (writers must be stopped or excluded during apply). Atomic rename provides per-file replacement, **not compare-and-swap against arbitrary external writers**. Pre/post hashes alone cannot eliminate the race. Where safe coordination cannot be established, hold shared mutable writes and disable unattended synchronization for that route. Never imply a lock protects against a writer that ignores it.

With coordination held, verify preconditions, write temporary files on the destination volume, preserve required metadata, flush according to the supported platform’s durability contract, replace atomically and journal each completed step. Revalidate path containment without following symlinks. Preserve unrelated user content and record exact managed sections. Pre-create topic content before adding its index reference; remove the reference before removing its owned topic. Choose route-specific ordering that keeps partial states recoverable.

After a crash, compare each destination with both before and after snapshots. Exact after means that step is applied; exact before permits replay under renewed checks; anything else is a conflict. Do not roll back over intervening user edits. Retry a partial plan only if its approval and all remaining preconditions still hold; otherwise create a replacement plan that accounts for successful steps.

Receipts have independent dimensions: `write_state` (pending/partial/complete/conflict/failed), `availability` (unknown/unavailable/discoverable/loaded), and `withdrawal` (not requested/pending/verified). Evidence names observed bytes, index presence, consolidation, fresh-context loading or withdrawal, with timestamps and exact output hashes. Missing evidence cannot be upgraded by inference. “Loaded” means observed in the declared context, not future recall, compliance or loading of every indexed topic.

Evidence becomes stale after output, configuration or harness-version change, or the local policy’s evidence deadline. Keep historical receipts but show current availability as unverified until refreshed. Native execution for verification follows the application’s normal execution controls; merely saving a file must never trigger an undisclosed paid model run.

## Keep the base. Preserve the competing claim.

| Observation | Required result |
| --- | --- |
| Owned receipt + identical projection | No new memory, revision or independent evidence. |
| Native changed; canonical unchanged | Propose a reviewed revision from the exported base. |
| Canonical changed; native unchanged | Plan the newly approved projection. |
| Both changed | Retain base and both edits; resolve explicit branches. |
| Marker with no owned receipt | Untrusted identity hint; no automatic overwrite or deduplication. |
| Missing file, renamed file or regenerated summary | Require continuity evidence; do not infer withdrawal. |
| Withdrawn identity reappears | Suppress resurrection and retain the withdrawal obligation. |

A source registry ties opaque source IDs to observed native objects and snapshots. File paths alone are not stable identity. A marker is meaningful only alongside an owned receipt, exact output/base bytes and a confirmed binding. Content similarity may flag a possible echo for review, but cannot invent independent corroboration. A foreign receipt is archival evidence, never local ownership.

Withdrawal appends a revision with a reason and at least one parent. Its body and source payloads may be omitted. Queue removal or correction of owned projections; native derived summaries and already-running contexts may persist. Track those limitations and pending corrections explicitly. Changes to shared files still require valid plans and write coordination.

Withdrawal and erasure are different operations. Local erasure may remove sensitive body/source/history payloads subject to the chosen retention policy, while retaining a minimal suppression ledger of identity and digests to prevent accidental resurrection. Those identifiers can themselves be sensitive and need an explicit retention policy. If the user erases that ledger too, explain that old imports can no longer be recognized. Partial history records the missing ancestors; no claim of remote erasure is possible without target evidence.

## Keep capabilities separate from the portable core.

**Core:** record/bundle identity, scope, lifecycle, validity, provenance, revision graph, strict JSON and canonical integrity. A core reader can archive and inspect knowledge without possessing any native write capability. Core validation does not require a database, model, network endpoint or approval UI. A conforming exporter declares completeness and never implies that a selected export is a full backup.

**Informational links - `amis.links.v1`:** optional `links[]` entries carry a UUID, open relation identifier and target. A pinned target uses the exact memory/revision/digest reference; a current target uses `{memory_id, selection: "current"}`. Current resolution returns the eligible head set or an explicit conflict, never a timestamp-selected winner. A missing pinned version is missing or gone, never substituted with current content. Links may cycle; parent/derivation history may not. Links do not grant authority, withdraw another record, corroborate themselves or affect task readiness. Adding a link creates a new source revision and does not change the target. Any record with links requires the feature token at bundle level. Cross-store retrieval follows local access policy and must not automatically fetch targets.

**Publication - `amis.publication.v1`:** capability negotiation, exact plans, receiver-owned authorization, apply/recovery and evidence receipts. Target descriptors use open `provider` and versioned `profile` identifiers defined by consumers. Mutations name a binding-owned `resource_ref`; a file adapter resolves it to a safe local path, while a service adapter may resolve it to a conditional API object. No portable locator is automatically a write target. Unknown profiles cannot publish. Roles and evidence kinds are extensible, but unknown evidence cannot establish a known availability claim. Plans with blockers may contain zero mutations; an executable plan must have mutations and no blockers.

**Synchronization - `amis.sync.v1`:** publication plus incremental observation, explicit withdrawal and durable recovery. A continuation token binds the provider instance, source selection, visibility policy and inventory generation. It is opaque; expiry or incompatible reuse returns an explicit rescan requirement. A completed baseline plus ordered, durably checkpointed changes is required before declaring convergence. Withdrawal and erasure events are explicit; absence from a page, export, changed authorization scope or stale snapshot never means deletion. Receivers acknowledge only after durable acceptance; duplicate events are harmless by revision identity. Retention gaps invalidate cursors and require a fresh baseline with suppression state. No claim of distributed atomicity or universal convergence is made while either side has unresolved conflicts.

The capability descriptor declares exact AMIS versions, feature IDs, profiles, supported operations, scope/kind sets, write coordination, verification levels and finite limits. An empty capability list means none, not a wildcard. Per-operation limits may be stricter and must be exposed before processing. Descriptors have a configuration digest, observation time, expiry and integrity proof; a stale descriptor invalidates a dependent plan. A descriptor is a provider claim, not certification or authentication. The descriptor schema is available as a separate artifact.

### Common operation semantics

Each binding must carry an operation/request identity, exact protocol version, selected profile, deadline/cancellation context and either a result or structured error with a retry classification. A successful empty list is distinguishable from an unsupported operation. Unknown required operations fail explicitly; they never become successful no-ops. A read returns complete selected record content or an explicit incomplete/unavailable result, never silently truncated text. Multi-target results preserve each target’s outcome even when the overall operation is partial.

Apply idempotency is scoped to receiver instance, target binding and immutable plan digest. Reuse of an idempotency key with a different plan is an error. Concurrent applications to the same binding must serialize or use the target’s conditional-write mechanism. After a timeout or cancellation, the outcome is unknown until the journal/receipt is inspected; a client must not assume rollback or start a different mutation blindly. Bindings must specify their own authentication and access control. An AMIS digest supplies neither.

The six visual operation examples are not a finalized network protocol. Before a transport binding claims interoperability, it must publish typed request/result schemas, capability and error mappings, cancellation semantics and matching test vectors. The core and profile tokens in this specification are proposed contracts, not claims that any particular provider has implemented or certified them.

### Governance and evolution

Keep the specification, schemas, extension registry, migration notes and conformance vectors in a vendor-neutral distribution. The registry defines each token’s owner, version, dependencies, semantics, required/optional status and compatibility behavior. No vendor receives a privileged semantic namespace. Third-party identifiers use a controlled reverse-domain prefix; core tokens are reserved by the specification. Do not execute extension code or fetch schemas based on imported text.

Deprecation must identify a replacement, a compatibility interval and a loss-accounted migration. Numeric enums, implementation paths, database tables and model-specific embeddings are not core identities. A future integrity or encoding profile must explicitly negotiate its algorithm and interpretation; old readers archive unsupported semantics rather than reinterpret an existing digest. Keep SHA-256/JCS mandatory within this version so independent implementations share a verifiable baseline.

Future robustness comes from bounded contracts, version negotiation, transparent omissions and shared conformance tests. It does not promise that the current specification can anticipate every provider. Semantic changes require explicit evolution; unknown data remains recoverable.

## Stabilize through fixtures and independent readers.

Implement schemas, strict parsing/canonicalization, immutable history, source identity, receiver bindings and delivery journals independently of native adapters. Adapters own native layouts and capability checks. Applications choose their storage engine, user interface and deployment model. Storage may use a database or files; the portable contract remains independent of that choice.

1. **Reader:** strict JSON, schema with asserted formats, canonical hash vectors, snapshot bytes/lengths/paths/selectors, graph references/cycles, duplicate IDs, time bounds and unknown-field preservation. Include Unicode, CRLF, BOM, base64 and resource-limit fixtures.
2. **Converter:** consumer-owned source → AMIS → target fixtures for every advertised direction, with expected bytes, native metadata escaping, retained qualifiers, kind/scope mismatch, native loading configuration, relative links and full fidelity accounting. Importing exported projections must not create new evidence. Consumers maintain these converters and their native-format test suites outside this specification repository.
3. **Publisher:** approval bound to digest/heads/bindings, expiry/configuration invalidation, actual write coordination, user-content preservation, index/context budgets, conditional creation and separate availability evidence. Run fresh-context loading tests in isolated harness homes with recorded versions.
4. **Synchronizer:** interrupt after every journal/write step, retry partial deliveries twice, race native edits, reorder scan pages, expire cursors, fork and merge revisions, restore withdrawn branches and change configuration. Test missing receipts and unknown required features.

These are separate conformance claims. A valid reader is not a proven publisher; a publisher does not automatically qualify for unattended sync. Consumers choose their product milestones and supported routes. Semantic consolidation remains a separately reviewed operation with explicit inputs.

Before declaring 1.0, require two independent reader/canonicalization implementations to pass shared vectors, independently maintained adapters to demonstrate the isolated conversion/loading matrix for their advertised routes, documented migration fixtures from supported versions, and a reviewed extension/error registry. Each implementation publishes its exact tested versions, capabilities and known omissions. Specification review and browser tests cannot establish native conformance.

**Deliverable boundary:** this repository contains only the specification, schemas, portable examples and documentation, with a documentation build and documentation checks. Consuming projects implement and test validation, canonicalization, converters, publication, synchronization and product interfaces. No validator, converter, renderer, SDK or reference implementation is distributed here. This repository cleanup does not change the 0.4.0 wire schemas or their behavioral requirements.
