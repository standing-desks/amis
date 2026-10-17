# TWINE-77: portable memory and delivery contract draft

Status: first design pass, 2026-10-17. Work item:
[TWINE-77](https://linear.app/twine-dev/issue/TWINE-77).

This proposal is informative and pending. AMIS remains at **0.4.0**. It does not
amend the normative requirements in [SPEC.md](../../SPEC.md), change the published
schemas, or assign a version to the proposed contract. Candidate field names below
are design notation, not fields that a 0.4.0 reader is expected to understand.

Read the [simple HTML explanation](../memory-consolidation.html) for the intended
flow. Applications implement that flow; this repository defines the portable
contract and its documentation.

## Objective and ownership

An implementation can preserve a memory's content, applicability, identity,
history and evidence while translating its representation. A target receives only
the meaning its tested route can represent, with a precise account of retained,
mapped and omitted information. Semantic consolidation is a separately reviewed
proposal. It is not a guarantee that generated text preserves every implication.

| Owner | Responsibility |
| --- | --- |
| AMIS | Portable records, schemas, feature definitions, lifecycle and delivery requirements, explanatory examples and expected conformance outcomes. |
| Consuming application | Its library, authorization, proposal review, storage, converters, native profiles, scheduling, recovery, privacy controls and implementation tests. |
| Native harness | Its own memory behavior, generated state, context loading and execution. |

The core stays vendor-neutral. Provider layouts, a background service, app screens,
model selection and supported-harness lists belong to the consumer. The HTML uses
Codex and Claude Code as illustrative sources and destinations, not certified
profiles. No validator, converter or worker is introduced by this proposal.

## One end-to-end contract

1. Capture an allowed source occurrence and its available evidence. A scan reports
   incomplete coverage explicitly and never interprets absence as withdrawal.
2. Normalize representation while preserving source identity, scope and exact
   evidence. Reading the same occurrence again does not create a new revision.
3. Optionally prepare a semantic proposal over exact revision references. Keep
   original inputs, competing claims and qualifiers inspectable.
4. Accept the proposal through a receiver-owned decision. Acceptance into a library
   and authorization to publish are distinct decisions.
5. Prepare a target-specific plan with exact effects, fidelity, binding, capabilities
   and resource preconditions. An incompatible target remains held.
6. Authorize the exact plan, acquire the required coordination, revalidate, apply
   and journal each outcome. One target's failure does not repeat another's success.
7. Record what was written, what is discoverable and what loading was actually
   observed. Correct or withdraw owned effects through a new authorized plan.

Observation and proposal preparation can run in the background. Publication
requires a human decision or an explicitly configured receiver policy. A consumer
may support only explicit human approval initially. Imported content and model
output never choose the policy or grant themselves permission.

## 1. Bind interpretation to immutable artifacts

**Problem:** 0.4.0 declares required features at bundle level. An isolated record
does not carry that declaration, so a repackaging implementation must reconstruct
requirements from surrounding context. Plans and receipts also lack an explicit
required-feature field.

**Proposed rule:** every independently exchanged, meaning-bearing artifact carries
its own required feature set inside the data covered by its digest. This includes
records, bundles, plans, receipts and capability descriptors. A descriptor's
required features describe how to interpret the descriptor; its supported features
describe the provider's capabilities. These are different sets.

- Candidate field: `required_features`, containing canonical, unique feature IDs.
- A bundle declares the union of its own requirements and its included records'
  requirements. Records retain their declarations when selected or repackaged.
- Adding or changing a record requirement changes its digest and requires a new
  revision. An exporter cannot reduce requirements to make an adapter accept it.
- An unknown required feature makes that artifact opaque and ineligible for use.
  Archival retention remains bounded. It is not partial semantic acceptance.
- Unknown optional data survives import/export. An implementation that cannot
  preserve its meaning during an edit holds that edit.
- A known feature declares its owner, dependencies, affected fields, schema
  constraints and required behavior in the registry. It cannot silently redefine
  the meaning of an existing core field.

**Acceptance example:** export one record from a multi-feature bundle, import it
through a reader that lacks one requirement, and export it again. The requirement
and record digest survive, and publication remains held.

## 2. Define lifecycle effects across derivation

**Problem:** the same-memory withdrawal rule does not fully specify what happens
to another memory derived from it. If C combines A and B, withdrawing A must not
leave C automatically publishable solely because C has a different UUID.

**Proposed rule:** acceptance and publication evaluate the current eligibility of
the transitive parent and derivation closure, not only the candidate's own status.
Receivers maintain dependencies sufficient to identify affected pending proposals,
accepted descendants and owned publications.

| Input change | Required receiver outcome under the proposed contract |
| --- | --- |
| An input is withdrawn, suppressed, expired or erased | Hold dependent acceptance and publication. Identify already-published descendants for correction or review. |
| An input has a new head or unresolved competing heads | Invalidate dependent decisions that assumed the previous head set. Re-evaluate the exact proposal against current state. |
| Required ancestry or provenance is unavailable | Retain the record and explicit gap; hold actions whose validity depends on that missing evidence. |
| A reviewer establishes that a descendant remains valid independently | Record a new reviewed derivation and the evidence supporting it. Preserve historical references; do not silently remove an input from an existing revision. |
| A previously withdrawn identity is deliberately restored | Incorporate all current heads, including withdrawals, and obtain a new receiver decision. Old approvals remain invalid. |

A change does not automatically delete every descendant. Holding a descendant
does not erase independent evidence or rewrite history. The receiver records the
reason and the exact dependency that invalidated a decision. Revocation and apply
share a serialization boundary so a check immediately before dispatch cannot be
bypassed by a concurrent state change. In-flight effects are reconciled explicitly.

Historical parents are expected to be superseded. A revision does not become
invalid merely because it replaced its own parent, and a reviewed renewal or
restoration can resolve the earlier lifecycle condition. Revalidation compares
the current dependency state with the recorded decision and any explicit
resolution; it does not require every historical ancestor to be a current head.
An imported restoration still requires the receiver's own decision.

Source occurrence identity is separate from snapshot equality. An observed
A -> B -> A edit is new history; repeated observation of unchanged A is not.
An owned exported projection creates no new memory or independent corroboration.

**Acceptance example:** accept C from A and B, publish it to one target, then
withdraw A while another target waits. The waiting publication stops, the first
target gets a tracked correction obligation, and unrelated memories remain intact.

## 3. Coordinate by resource and loading context

**Problem:** distinct logical bindings can resolve to the same native index or
instruction resource. Serializing by binding ID alone does not establish exclusion
across those aliases. A single resource may also load into multiple contexts.

**Proposed rule:** a consumer resolves a plan's entire mutation set into locally
verified resource identities and coordination domains before approval and apply.
Resource identities are receiver-owned and account for native aliasing rules;
portable paths, equal bytes and source locators cannot establish them.

- The plan binds the resource mapping and effective loading contexts in its local
  binding digest. A changed mapping or expanded audience invalidates approval.
- Overlapping resources share coordination even when their binding IDs differ.
  Consumers define a deterministic acquisition order for multiple domains.
- Duplicate or aliased mutations within a plan are rejected unless a defined
  ordered sequence gives each step a distinct identity and consistent states.
- All writers must participate in the declared coordination, or native writes wait
  for verified exclusion. A private application lock does not exclude a harness.
- Plans expose the intended contexts, effective contexts and fidelity of the
  selected route. Publication into instruction context is explicitly disclosed.
- Capabilities describe tested combinations of operation, route, scope, kind,
  version, configuration, coordination and limits. Separate lists do not imply
  that every combination is supported.

The core specifies these properties; consumers define native identity resolution,
safe path access, lock protocols, metadata preservation and loading behavior.

**Acceptance example:** two bindings resolve to one shared index. Concurrent plans
cannot both rely on its old contents. After the first succeeds, the second either
revalidates a compatible precondition or requires a replacement authorized plan.

## 4. Make delivery observations precise

**Problem:** 0.4.0 evidence references output hashes, while a successful deletion
has no current output bytes. Free-form evidence also leaves the mapping from an
observation to a claim such as `loaded` underspecified.

**Proposed rule:** evidence identifies the observed resource or context, its state
and the observation conditions. Claims are derived from defined evidence rules.

| Candidate observation field | Meaning |
| --- | --- |
| `resource_ref` | Exact receiver-bound resource or declared loading context. |
| `state` | Present, absent or unknown. Unknown is distinct from verified absence. |
| `content_digest` | Required for observed present bytes; absent for an absent resource. |
| `kind` | A registered observation type with explicit claim rules. |
| `observed_at` | Observation time, not a timestamp-based conflict winner. |
| `configuration_digest` and harness version | The conditions under which the observation is valid. |
| Context identity and selection | Required for a loading claim, including which revision or part was observed. |
| Observation identity and predecessor | A receiver-scoped history of observations without overwriting past evidence. |

Resource absence is an observation, not the SHA-256 of an empty file. A verified
withdrawal names the owned effects removed or corrected; it cannot establish
erasure from all contexts, summaries or backups. Unknown evidence kinds cannot
support a known claim. A receipt contains per-step results for partial delivery.

Each observation is immutable. A new observation may supersede an earlier one for
the same subject under a defined receiver ordering. Importing a foreign receipt
does not establish local ownership, current state or authorization. Changed bytes,
configuration, version or an evidence deadline make the current claim unverified
while preserving its history. Loading one index or topic does not imply loading
every referenced topic, future recall or instruction compliance.

**Acceptance examples:** a deletion can be verified using resource absence; a
written file cannot claim loading without context evidence; a stale loading
observation cannot overwrite a later conflict after a configuration change.

## 5. Complete the logical operation outcomes

These are proposed language-independent contracts, not an RPC or storage design.
A transport binding supplies authentication, wire envelopes and cancellation
delivery. Consumer-owned converters supply native format mappings.

| Operation | Required logical input | Required logical result |
| --- | --- | --- |
| Describe | Requested protocol and profile | Observed, expiring capabilities with tested combinations and finite limits, or explicit incompatibility. |
| Scan | Confirmed source selection and optional bound cursor | Inventory generation, bounded observations, coverage errors and continuation or explicit completion. Stale cursors request rescan. |
| Normalize | Pinned source occurrence, evidence and parser identity | Candidates with exact provenance and compatibility, unchanged occurrence, or a held result. No implicit semantic consolidation. |
| Plan | Exact candidate revision, intended target and current receiver decision | An immutable executable plan, a held plan with structured blockers, or an explicit no-change outcome. |
| Apply | Exact plan, receiver authorization and idempotency identity | Per-step receipt for complete, partial, conflicting, failed or uncertain effects. Cancellation does not imply rollback. |
| Verify | Exact plan/receipt subject and requested observation level | Fresh typed observations, including unavailable verification and its reason. |

Every operation also carries request identity, exact protocol/profile, finite
deadline, cancellation context and a structured retry classification. A no-change
result is distinct from an unsupported operation and requires no synthetic write.

Plans bind mutation ordering, exact before/after states, current heads, dependency
eligibility, resource mapping, capability/configuration identities, fidelity,
authorization context and expiry. Their snapshot references resolve only through
a verified receiver-controlled snapshot inventory. Snapshot bytes required for
pending recovery remain retained; a digest alone cannot reconstruct them.

Multiple records updating one shared index need a composed local plan or explicit
dependent plans. The consumer cannot approve independently computed stale index
replacements and assume serialization will make them compatible. The final batch
representation and its approval unit remain an open design decision below.

## 6. Registry, extension boundaries and migration

Publish normative definitions and expected outcomes as specification artifacts.
Implementations maintain executable validation and native integration tests.

| Artifact | Required content in the completed redesign |
| --- | --- |
| Feature registry | Owner, version, dependencies, affected fields, required behavior, unknown-feature handling and compatibility. |
| Kinds and scope definitions | Exact semantics and the boundary between an unknown scope and a supported extension. |
| Error registry | Stable code, failure phase, meaning, whether effects may have occurred and allowed retry class. |
| Evidence registry | Observation subject and requirements for each delivery or withdrawal claim. |
| Worked examples | Valid and invalid outcomes for reader, publication and synchronization scenarios, with exact source bytes where relevant. |
| Migration notes | Identity preservation, changed revision allocation, historical references, evidence gaps and approval invalidation. |

For this draft, a new scope shape requires an explicit new core contract or a
negotiated profile with its own validation. It is not a new value silently accepted
by the existing 0.4.0 scope schema. An unsupported artifact remains opaque. Optional
metadata cannot alter applicability, authorization, retention or loading rules.

Migration retains original artifacts and their version. It never adds candidate
fields to 0.4.0 and pretends existing consumers enforce them. A changed record gets
a new revision, with traceable original identity/evidence. Importing or migrating
does not recreate a local approval. No version is selected or bumped in this pass.

## Consumer acceptance cases

The completed contract needs portable examples with expected outcomes for these
cases. These are acceptance descriptions, not claims that the tests already exist.

| Case | Expected outcome |
| --- | --- |
| Unicode, strict JSON, canonicalization and unknown optional data | Independent readers agree on acceptance and digest; preserved data survives export. |
| Missing required feature during selective export | Requirement remains attached to the record; unsupported publication is held. |
| Two memories with similar text but different scope | Preserve separate identities and applicability; no automatic semantic merge. |
| Incomplete scan, disabled source or expired cursor | Retain coverage gap and request rescan where needed; no inferred deletion. |
| Repeated scan and observed A -> B -> A | Repeated occurrence is a no-op; observed new occurrence remains new history. |
| Derived input withdrawn while a target waits | Invalidate pending work and track correction of published descendants. |
| Two bindings sharing a resource | Coordinate against the same resource; reject stale or overlapping plans. |
| Crash after every durable-intent and mutation step | Reconcile before/after/current states and retain successful partial outcomes. |
| Retry an apply or undo twice | Resume the same operation; no duplicate revision, evidence or native effect. |
| Native edit after publication, followed by undo | Suppress republishing first; preserve the native edit and report the conflicting correction. |
| Backup restore, lost receipt or copied library | Reconfirm ownership and bindings; foreign or missing evidence grants no write authority. |
| Capacity, harness version or loading configuration changes | Re-evaluate compatibility and invalidate dependent plans and current availability claims. |
| Rejected or stale semantic proposal | Persist the decision; do not reaccept unchanged evidence or apply a late result. |

Meaning changes require review of qualifiers, contradictions, source independence
and scope. Semantic quality evaluations belong to the consumer and cannot be
replaced by JSON validation or model confidence. A hosted consolidator's disclosure
and consent cover the selected content before the request is sent.

## Remaining design work

1. Settle artifact feature inheritance, batch-plan representation, evidence
   ordering, and the boundary between portable evidence and receiver-private state.
2. Turn the proposed logical fields into reviewed schemas and complete examples
   in an explicitly pending design, then document each migration consequence.
3. Specify field-by-field fidelity accounting, capability combinations and the
   extension/error/evidence registries, including bounded resource behavior.
4. Walk through the acceptance cases with independent consumer implementations.
   Prove native coordination and fresh-context loading separately for each route.
5. Finalize a version and promote the accepted contract only in a later release
   decision. TWINE-77 remains in progress until its normative deliverables are done.

The current pass supplies the first proposed rules and the plain-language HTML
explanation. It does not complete TWINE-77 or implement the redesign in Twine.
