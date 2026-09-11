# CRM para gestion de clientes - Requirements Traceability Matrix

## Title

| Field | Value |
| --- | --- |
| Document | Requirements Traceability Matrix |
| Initiative | CRM para gestion de clientes |
| Version | 0.1 |
| Status | Generated projection - planned verification only |
| Author | Vestigator |
| Reviewers | Aelium |
| Organization | Aelium |
| Last Updated | 2026-09-11 |

## 1. Purpose

This matrix is a derived projection across Specification, Design, Planning, Time, and Verification. It is not the source of truth for any requirement, decision, work package, milestone, test, evidence, or status.

Source authorities are local Markdown using the backward-compatible `classic` profile because `_context/MANAGEMENT-MODEL.yaml` is absent.

## 2. ID Prefix Registry

| Semantic entity | Prefix | Dimension |
| --- | --- | --- |
| Objective | `OBJ-xxx` | Specification |
| Requirement | `REQ-xxx` | Specification |
| Functional Requirement | `FR-xxx` | Specification |
| Non-Functional Requirement | `NFR-xxx` | Specification |
| Acceptance Criterion | `AC-xxx` | Specification / Verification planning |
| Architecture Decision | `ADR-xxx` | Design |
| Initiative | `INI-xxx` | Planning |
| Project | `PRJ-xxx` | Planning |
| Work Package | `WP-xxx` | Planning |
| Task | `TSK-xxx` | Planning |
| Milestone | `MS-xxx` | Time |
| Test | `TEST-xxx` | Verification |
| Evidence | `EVD-xxx` | Verification execution |

## 3. Matrix

| ID | Type | Description | Parent | Addressed by (decision) | Realized by (work package) | Verified by (test) | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OBJ-001 | Objective | Centralize customer and prospect information with related commercial, operational, and service records |  |  | INI-001 |  |  | Draft |
| OBJ-002 | Objective | Support business-specific service modules, including reusable API templates and customer-specific APIs |  |  | INI-001 |  |  | Draft |
| OBJ-003 | Objective | Enable retrieval through global search and tags |  |  | INI-001 |  |  | Draft |
| OBJ-004 | Objective | Keep the product modular and maintainable |  |  | INI-001 |  |  | Draft |
| OBJ-005 | Objective | Establish a reliable local technical foundation |  |  | INI-001 |  |  | Draft |
| OBJ-006 | Objective | Prepare for secure operations and AI assistance |  |  | INI-001 |  |  | Draft |
| REQ-001 | Requirement | Maintain customer records and related business records | OBJ-001 | ADR-003 | WP-001 |  |  | Draft |
| REQ-002 | Requirement | Maintain prospective customer records separately | OBJ-001 | ADR-003 | WP-001 |  |  | Draft |
| REQ-003 | Requirement | Support reusable service-template modules, currently API templates | OBJ-002 | ADR-003, ADR-004 | WP-001 |  |  | Draft |
| REQ-004 | Requirement | Support customer-specific service implementations, currently APIs | OBJ-002 | ADR-003, ADR-007 | WP-001 |  |  | Draft |
| REQ-005 | Requirement | Expose customer contracts and invoices | OBJ-001 | ADR-003 | WP-001 |  |  | Draft |
| REQ-006 | Requirement | Maintain customer incidents | OBJ-001 | ADR-003 | WP-001 |  |  | Draft |
| REQ-007 | Requirement | Provide reusable tags | OBJ-003 | ADR-004 | WP-002 |  |  | Draft |
| REQ-008 | Requirement | Provide text and tag search | OBJ-003 |  | WP-002 |  |  | Draft |
| REQ-009 | Requirement | Support modular application structure | OBJ-004 | ADR-002 | WP-003 |  |  | Draft |
| REQ-010 | Requirement | Run locally with Rust, Vite/TailwindCSS, and PostgreSQL | OBJ-005 | ADR-001, ADR-002, ADR-003, ADR-005, ADR-007 | WP-003 |  |  | Draft |
| REQ-011 | Requirement | Provide administrator login baseline and production auth path | OBJ-006 | ADR-006, ADR-009 | WP-003 |  |  | Draft |
| REQ-012 | Requirement | Reserve dashboard for chatbot, access, summaries, and statistics | OBJ-006 | ADR-008 | WP-001, WP-003 |  |  | Draft |
| REQ-013 | Requirement | Document secure upload, auth, CRUD, and AI future needs | OBJ-006 | ADR-008 | WP-003 |  |  | Draft |
| FR-001 | FR | List customers | REQ-001 |  | WP-001 | TEST-001 | TBD | Planned |
| FR-002 | FR | Display customer detail and related records | REQ-001 |  | WP-001 | TEST-002 | TBD | Planned |
| FR-003 | FR | List prospective customers separately | REQ-002 |  | WP-001 | TEST-003 | TBD | Planned |
| FR-004 | FR | Display prospective customer detail | REQ-002 |  | WP-001 | TEST-004 | TBD | Planned |
| FR-005 | FR | List and detail API templates | REQ-003 |  | WP-001 | TEST-005 | TBD | Planned |
| FR-006 | FR | List and detail specific APIs | REQ-004 |  | WP-001 | TEST-006 | TBD | Planned |
| FR-007 | FR | Expose customer contracts and invoices | REQ-005 |  | WP-001 | TEST-007 | TBD | Planned |
| FR-008 | FR | Expose customer incidents | REQ-006 |  | WP-001 | TEST-008 | TBD | Planned |
| FR-009 | FR | Provide dashboard summaries and chatbot area | REQ-012 |  | WP-001 | TEST-009 | TBD | Planned |
| FR-010 | FR | Maintain reusable tag metadata | REQ-007 |  | WP-002 | TEST-010 | TBD | Planned |
| FR-011 | FR | Associate tags with supported entity types | REQ-007 | ADR-004 | WP-002 | TEST-011 | TBD | Planned |
| FR-012 | FR | Filter records by `#tag` | REQ-008 |  | WP-002 | TEST-012 | TBD | Planned |
| FR-013 | FR | Search by name, CIF, ID, and partial text | REQ-008 |  | WP-002 | TEST-013 | TBD | Planned |
| FR-014 | FR | Support multiple tag terms | REQ-008 |  | WP-002 | TEST-014 | TBD | Planned |
| FR-015 | FR | Keep search/tag behavior consistent | REQ-009 |  | WP-002 | TEST-015 | TBD | Planned |
| FR-016 | FR | Provide local run commands | REQ-010 | ADR-005 | WP-003 | TEST-016 | TBD | Planned |
| FR-017 | FR | Expose backend health and CRM endpoints | REQ-010 | ADR-001, ADR-005, ADR-007 | WP-003 | TEST-017 | TBD | Planned |
| FR-018 | FR | Provide local administrator login baseline | REQ-011 | ADR-006 | WP-003 | TEST-018 | TBD | Planned |
| FR-019 | FR | Keep production authentication explicit | REQ-011 | ADR-006, ADR-009 | WP-003 | TEST-019 | TBD | Planned |
| FR-020 | FR | Maintain modular frontend structure | REQ-009 | ADR-002 | WP-003 | TEST-020 | TBD | Planned |
| FR-021 | FR | Keep secure upload explicit | REQ-013 |  | WP-003 | TEST-021 | TBD | Planned |
| FR-022 | FR | Keep full CRUD visible | REQ-013 |  | WP-003 | TEST-022 | TBD | Planned |
| FR-023 | FR | Keep AI provider integration explicit | REQ-013 | ADR-008 | WP-003 | TEST-023 | TBD | Planned |
| NFR-001 | NFR | Search/list responsiveness | REQ-008 |  | WP-002 | TEST-024 | TBD | Planned |
| NFR-002 | NFR | Query design for relationship-heavy views | REQ-010 |  | WP-003 | TEST-025 | TBD | Planned |
| NFR-003 | NFR | Adapt local/future API configuration | REQ-010 | ADR-005 | WP-003 | TEST-026 | TBD | Planned |
| NFR-004 | NFR | Make entity relationships understandable | REQ-001, REQ-002, REQ-003, REQ-004 |  | WP-001 | TEST-027 | TBD | Planned |
| NFR-005 | NFR | Keep search/tag interactions consistent | REQ-008 |  | WP-002 | TEST-028 | TBD | Planned |
| NFR-006 | NFR | Handle missing related records safely | REQ-001, REQ-002, REQ-003, REQ-004 |  | WP-001 | TEST-029 | TBD | Planned |
| NFR-007 | NFR | Keep local setup restartable | REQ-010 | ADR-005 | WP-003 | TEST-030 | TBD | Planned |
| NFR-008 | NFR | Treat seed-user login as non-production | REQ-011 | ADR-006, ADR-009 | WP-003 | TEST-031 | TBD | Planned |
| NFR-009 | NFR | Protect attachment/document data | REQ-013 |  | WP-003 | TEST-032 | TBD | Planned |
| NFR-010 | NFR | Preserve module boundaries | REQ-009 | ADR-001, ADR-002, ADR-009 | WP-003 | TEST-033 | TBD | Planned |
| NFR-011 | NFR | Keep relationships traceable when changed | REQ-010 |  | WP-003 | TEST-034 | TBD | Planned |
| NFR-012 | NFR | Keep AI integration provider-neutral | REQ-012, REQ-013 | ADR-008 | WP-003 | TEST-035 | TBD | Planned |
| NFR-013 | NFR | Add/remove modules without destabilizing navigation | REQ-009 | ADR-002 | WP-003 | TEST-036 | TBD | Planned |
| NFR-014 | NFR | Safeguard sensitive operations | REQ-013 |  | WP-003 | TEST-037 | TBD | Planned |
| AC-001 | Acceptance Criterion | Customer list displays selectable customers | FR-001 |  |  |  |  | Draft |
| AC-002 | Acceptance Criterion | Customer detail displays related records | FR-002 |  |  |  |  | Draft |
| AC-003 | Acceptance Criterion | Prospects are shown separately from customers | FR-003 |  |  |  |  | Draft |
| AC-004 | Acceptance Criterion | Prospect detail displays recommendations | FR-004 |  |  |  |  | Draft |
| AC-005 | Acceptance Criterion | API template detail displays relations | FR-005 |  |  |  |  | Draft |
| AC-006 | Acceptance Criterion | Specific API detail displays customer relation | FR-006 |  |  |  |  | Draft |
| AC-007 | Acceptance Criterion | Contract and invoice records are displayed | FR-007 |  |  |  |  | Draft |
| AC-008 | Acceptance Criterion | Incident information is displayed | FR-008 |  |  |  |  | Draft |
| AC-009 | Acceptance Criterion | Dashboard shows summaries and chatbot area | FR-009 |  |  |  |  | Draft |
| AC-010 | Acceptance Criterion | Tags display on tagged records | FR-010 |  |  |  |  | Draft |
| AC-011 | Acceptance Criterion | Tag associations display correctly | FR-011 |  |  |  |  | Draft |
| AC-012 | Acceptance Criterion | `#Docker` returns tagged records | FR-012 |  |  |  |  | Draft |
| AC-013 | Acceptance Criterion | Partial text search returns matching records | FR-013 |  |  |  |  | Draft |
| AC-014 | Acceptance Criterion | Multiple tag query follows chosen rule | FR-014 |  |  |  |  | Draft |
| AC-015 | Acceptance Criterion | Search behavior is consistent across modules | FR-015 |  |  |  |  | Draft |
| AC-016 | Acceptance Criterion | README setup lets backend connect to CRM database | FR-016 |  |  |  |  | Draft |
| AC-017 | Acceptance Criterion | Backend endpoint returns valid response or meaningful error | FR-017 |  |  |  |  | Draft |
| AC-018 | Acceptance Criterion | Local login accepts seeded users and rejects invalid credentials | FR-018 |  |  |  |  | Draft |
| AC-019 | Acceptance Criterion | Production auth review records current baseline as insufficient | FR-019 |  |  |  |  | Draft |
| AC-020 | Acceptance Criterion | New module can be bounded in view/template area | FR-020 |  |  |  |  | Draft |
| AC-021 | Acceptance Criterion | Secure upload/access control is required before attachments | FR-021 |  |  |  |  | Draft |
| AC-022 | Acceptance Criterion | Missing CRUD behavior is visible | FR-022 |  |  |  |  | Draft |
| AC-023 | Acceptance Criterion | Chatbot remains provider-neutral | FR-023 |  |  |  |  | Draft |
| AC-024 | Acceptance Criterion | Search/list visible response is acceptable on seed data | NFR-001 |  |  |  |  | Draft |
| AC-025 | Acceptance Criterion | Query/index review identifies needed adjustments | NFR-002 |  |  |  |  | Draft |
| AC-026 | Acceptance Criterion | API target can change without rewriting module code | NFR-003 |  |  |  |  | Draft |
| AC-027 | Acceptance Criterion | Detail views present relationships or empty states clearly | NFR-004 |  |  |  |  | Draft |
| AC-028 | Acceptance Criterion | `#tag` syntax is parsed consistently | NFR-005 |  |  |  |  | Draft |
| AC-029 | Acceptance Criterion | Missing related records show recoverable states | NFR-006 |  |  |  |  | Draft |
| AC-030 | Acceptance Criterion | Local services restart from documentation | NFR-007 |  |  |  |  | Draft |
| AC-031 | Acceptance Criterion | Production readiness requires Keycloak/auth replacement | NFR-008 |  |  |  |  | Draft |
| AC-032 | Acceptance Criterion | Attachment design requires access control | NFR-009 |  |  |  |  | Draft |
| AC-033 | Acceptance Criterion | Representative module change is localized | NFR-010 |  |  |  |  | Draft |
| AC-034 | Acceptance Criterion | Relationship changes expose doc/test impact | NFR-011 |  |  |  |  | Draft |
| AC-035 | Acceptance Criterion | AI integration point remains provider-neutral | NFR-012 |  |  |  |  | Draft |
| AC-036 | Acceptance Criterion | Navigation stays coherent after module changes | NFR-013 |  |  |  |  | Draft |
| AC-037 | Acceptance Criterion | Sensitive CRUD design includes safeguards | NFR-014 |  |  |  |  | Draft |

## 4. Gap Checklist

| # | Check | Current finding |
| --- | --- | --- |
| 1 | Requirement with no implementation | No FR/NFR is missing a Work Package in the current Markdown plan. |
| 2 | Requirement with no test | No FR/NFR is missing a planned test in `TMP.md`. Acceptance Criteria do not yet have separate test rows. |
| 3 | Orphan task | No orphan tasks found; all tasks live under WP-001, WP-002, or WP-003. |
| 4 | Requirement modified after verification | Not assessed; no executed evidence exists yet. |
| 5 | NFR with no evidence | All NFR tests are planned and have no evidence yet. This is expected before execution, but blocks verified status. |
| 6 | Work closed but requirement still open | Not applicable; all planning work is Draft. |

### Findings Summary

| Category | Count | Notes |
| --- | --- | --- |
| Dangling references | 0 | No cited `OBJ`, `REQ`, `FR`, `NFR`, `ADR`, `WP`, or `TEST` ID is known to be missing. |
| Orphans | 0 | No orphan requirement, work package, task, or test identified in the generated projection. |
| Unimplemented FR/NFR | 0 | All 37 FR/NFR rows are realized by a Work Package. |
| Untested FR/NFR | 0 | All 37 FR/NFR rows have planned test coverage. |
| Unevidenced tests | 37 | All tests are `Planned` with `TBD` evidence; none are claimed as `PASS`. |
| Stale verification | Not assessed | No immutable evidence timestamps exist yet. |

## References

- `_context/VSD.md`
- `_context/_specification/BRD.md`
- `_context/_specification/FRDs/`
- `_context/_specification/NFRD.md`
- `_context/_design/ADD.md`
- `_context/_planning/`
- `_context/_time/ROADMAP.md`
- `_context/_verification/SQCA.md`
- `_context/_verification/TMP.md`
