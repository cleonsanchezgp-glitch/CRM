# CRM para gestion de clientes - Non-Functional Requirements Document

## Title

| Field | Value |
| --- | --- |
| Document | Non-Functional Requirements Document |
| Initiative | CRM para gestion de clientes |
| Version | 0.1 |
| Status | Draft - migrated from prompts |
| Author | Consultor |
| Reviewers | Aelium |
| Organization | Aelium |
| Last Updated | 2026-09-11 |

## 1. Overview

This document describes the non-functional requirements for the CRM, organized by ISO/IEC 25010:2023 quality characteristics. Functional suitability is covered by the FRDs.

## 2. Performance Efficiency

| ID | Requirement | Target / Threshold | Traces to (REQ-xxx) | Verifies (AC-xxx) |
| --- | --- | --- | --- | --- |
| NFR-001 | Search and module list operations shall remain responsive for normal small-business CRM datasets. | Initial target: visible response within 2 seconds for seeded/local datasets; production thresholds to be refined with real volume | REQ-008 | AC-024 |
| NFR-002 | PostgreSQL queries for relationship-heavy views shall be designed to avoid unnecessary full-table scans as data grows. | Index and query review before production deployment | REQ-010 | AC-025 |

## 3. Compatibility

| ID | Requirement | Target / Threshold | Traces to (REQ-xxx) | Verifies (AC-xxx) |
| --- | --- | --- | --- | --- |
| NFR-003 | The frontend shall operate against the local backend API during development and remain adaptable to a future production domain. | API base configuration supports local and future deployment modes | REQ-010 | AC-026 |

## 4. Interaction Capability

| ID | Requirement | Target / Threshold | Traces to (REQ-xxx) | Verifies (AC-xxx) |
| --- | --- | --- | --- | --- |
| NFR-004 | CRM screens shall make common entity relationships understandable without requiring users to inspect database tables. | Detail views expose related records and useful empty states | REQ-001, REQ-002, REQ-003, REQ-004 | AC-027 |
| NFR-005 | Search and tag interactions shall be consistent across modules. | Same `#tag` convention and parsing behavior wherever search appears | REQ-008 | AC-028 |

## 5. Reliability

| ID | Requirement | Target / Threshold | Traces to (REQ-xxx) | Verifies (AC-xxx) |
| --- | --- | --- | --- | --- |
| NFR-006 | The CRM shall handle missing related records without crashing the active view. | Empty, loading, and error states exist for relationship-heavy views | REQ-001, REQ-002, REQ-003, REQ-004 | AC-029 |
| NFR-007 | Local setup documentation shall allow the backend, frontend, and database to be restarted predictably. | README commands remain current with implementation | REQ-010 | AC-030 |

## 6. Security

| ID | Requirement | Target / Threshold | Traces to (REQ-xxx) | Verifies (AC-xxx) |
| --- | --- | --- | --- | --- |
| NFR-008 | Seed-user/AES login shall be treated as local-development baseline rather than production security. | Production release cannot rely only on current seed-user approach | REQ-011 | AC-031 |
| NFR-009 | Future file upload and document access shall protect customer, contract, invoice, and incident data. | Secure upload/access-control design required before production attachments | REQ-013 | AC-032 |

## 7. Maintainability

| ID | Requirement | Target / Threshold | Traces to (REQ-xxx) | Verifies (AC-xxx) |
| --- | --- | --- | --- | --- |
| NFR-010 | The application shall preserve module boundaries in frontend views, shared utilities, backend routes, and database access. | New modules can be added with limited unrelated changes | REQ-009 | AC-033 |
| NFR-011 | Requirements, schema, and implementation should remain traceable when entity relationships change. | Changed relationships update docs and tests in the same delivery cycle | REQ-010 | AC-034 |

## 8. Flexibility

| ID | Requirement | Target / Threshold | Traces to (REQ-xxx) | Verifies (AC-xxx) |
| --- | --- | --- | --- | --- |
| NFR-012 | The CRM shall remain adaptable to future AI provider integration without coupling current dashboard behavior to a chosen vendor. | Chatbot area and integration points do not assume a specific provider | REQ-012, REQ-013 | AC-035 |
| NFR-013 | The CRM shall support adding and removing modules without destabilizing core navigation. | Module registration/navigation design is reviewed before new module work | REQ-009 | AC-036 |

## 9. Safety

| ID | Requirement | Target / Threshold | Traces to (REQ-xxx) | Verifies (AC-xxx) |
| --- | --- | --- | --- | --- |
| NFR-014 | Operations that could expose, overwrite, or remove business-critical customer, contract, invoice, or API data shall be designed with safeguards before production use. | Destructive or sensitive operations require explicit UX/API safeguards in future CRUD work | REQ-013 | AC-037 |

## 10. Acceptance Criteria

| ID | Given | When | Then | Verifies |
| --- | --- | --- | --- | --- |
| AC-024 | Seed/local CRM data exists | A user searches or opens a module list | The response is visibly returned without excessive delay | NFR-001 |
| AC-025 | Relationship-heavy views are prepared for production | Queries are reviewed | Necessary indexes or query adjustments are identified | NFR-002 |
| AC-026 | The app runs in local development | The API target is changed for another environment | The frontend can be configured without rewriting module code | NFR-003 |
| AC-027 | A user opens a detail view | Related records exist or are absent | The view presents relationships or empty states clearly | NFR-004 |
| AC-028 | A user searches with a tag in more than one module | The same tag syntax is used | The modules parse the search consistently | NFR-005 |
| AC-029 | A related record is missing | The parent view loads | The system shows an empty or recoverable state | NFR-006 |
| AC-030 | A maintainer follows local run documentation | Services are restarted | The documented commands still work or the gap is visible | NFR-007 |
| AC-031 | Production readiness is reviewed | Authentication is assessed | The current local baseline is not accepted as production-grade | NFR-008 |
| AC-032 | Attachment handling is planned | Customer documents are in scope | Secure upload and access control are required before release | NFR-009 |
| AC-033 | A new module is added | The code change is reviewed | The change is mostly localized to module-specific files and shared contracts | NFR-010 |
| AC-034 | An entity relationship changes | Documentation and tests are reviewed | The requirement, schema, implementation, and verification impact is visible | NFR-011 |
| AC-035 | AI integration is planned | A provider is evaluated | The design can integrate it without assuming the provider in current baseline behavior | NFR-012 |
| AC-036 | A module is added or removed | Navigation is reviewed | Core navigation remains coherent | NFR-013 |
| AC-037 | A sensitive CRUD operation is planned | The flow is designed | The design includes confirmation, authorization, or recovery safeguards appropriate to the risk | NFR-014 |

## References

- ISO/IEC 25010:2023 Systems and Software Quality Models
- `README.md`
- `prompts/Segundo promt de cracion inicial CRM.txt`
