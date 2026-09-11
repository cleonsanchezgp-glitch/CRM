# CRM para gestion de clientes - Test Management Plan

## Title

| Field | Value |
| --- | --- |
| Document | Test Management Plan |
| Initiative | CRM para gestion de clientes |
| Version | 0.1 |
| Status | Draft |
| Author | Quaestor |
| Reviewers | Aelium |
| Organization | Aelium |
| Last Updated | 2026-09-11 |

## 1. Introduction

### 1.1 Purpose

This Test Management Plan defines the planned verification approach for the client-management CRM baseline, aligned with the Aelium Organizational Test Strategy and the risk basis in `SQCA.md`.

## 2. Test Objectives

| Objective | Description |
| --- | --- |
| Validate core CRM workflows | Confirm customers, prospects, service-module records such as APIs, documents, incidents, relationships, tags, and dashboard flows behave as specified. |
| Protect CRM data integrity | Verify PostgreSQL relationships and API mutations preserve expected business records. |
| Verify search/tag usability | Confirm text and `#tag` filtering works consistently across modules. |
| Prepare production identity readiness | Verify Keycloak design and future integration behavior before replacing local seed-user authentication. |
| Keep production gaps visible | Ensure authentication, file upload, CRUD, AI provider, and deployment gaps are not treated as complete. |

## 3. Test Scope

### In Scope

- Functional tests for core CRM modules.
- Integration tests for frontend/backend/PostgreSQL flows.
- Search and tag behavior tests.
- Local setup and API health checks.
- Security planning tests for current local auth boundaries and Keycloak integration readiness.
- Error, empty, and missing-related-record UI states.

### Out of Scope

- Executed production Keycloak validation until a realm/client exists.
- Full performance benchmarking until realistic data volumes are defined.
- Production hosting, backups, monitoring, and secure attachment implementation tests until those designs exist.
- AI chatbot provider tests until a provider is selected.

## 4. Test Strategy

| Level | Description |
| --- | --- |
| Unit Testing | Verify search parsing, formatting utilities, backend helper logic, and validation behavior. |
| Integration Testing | Verify backend routes against PostgreSQL, tag relationships, customer/API relationships, and future Keycloak token-validation integration. |
| System Testing | Verify complete module flows through the browser and backend API. |
| End-to-End Testing | Verify login, dashboard, entity navigation, search/tag filtering, and selected create/delete workflows. |

## 5. Test Environment

| Environment | Description |
| --- | --- |
| Local development | PostgreSQL `CRM` on port 5433, backend on `127.0.0.1:8080`, optional Vite dev frontend on `127.0.0.1:5173`. |
| Keycloak integration environment | TBD. Required before production identity tests can move from Planned to executable. |
| Production-like environment | TBD. Required before release decisions involving auth, attachments, backups, monitoring, or external AI. |

Substantial test-infrastructure work is not split into its own Initiative yet; current planning treats it as future work until a dedicated environment/tooling stream is confirmed.

## 6. Test Data

Use seeded PostgreSQL data for local smoke and integration tests. Avoid real customer data unless a data-protection process exists. For Keycloak, use dedicated test users, groups, roles, and claims that do not mirror real credentials.

## 7. Automation Strategy

Automate local smoke checks, backend route checks, search/parser checks, and representative UI workflows where practical. Add Keycloak integration tests once realm/client configuration exists. CI execution is TBD.

## 8. Defect Management

Defects should include affected requirement/test IDs, reproduction steps, observed result, expected result, severity, owner, and status. Critical authentication, authorization, data integrity, or customer-data exposure issues block production readiness.

## 9. Metrics and Reporting

| Metric | Description |
| --- | --- |
| Test Coverage | FR/NFR items with planned or executed test coverage. |
| Defect Density | Defects by module or requirement area. |
| Pass Rate | Executed tests passing vs. failing; planned tests are not counted as pass. |
| Blocked Tests | Tests blocked by missing environment, Keycloak configuration, or production design decisions. |
| Security Readiness | Authentication, authorization, and sensitive-data safeguards covered by tests or still open. |

## 10. Traceability

| Requirement (FR-xxx / NFR-xxx) | Test (TEST-xxx) | Evidence | Status |
| --- | --- | --- | --- |
| FR-001 | TEST-001 - Open customer module and verify customer list loads with identifiers. | TBD | Planned |
| FR-002 | TEST-002 - Open customer detail and verify related contracts, invoices, APIs, tags, and empty states. | TBD | Planned |
| FR-003 | TEST-003 - Open prospective customer module and verify prospects are separated from customers. | TBD | Planned |
| FR-004 | TEST-004 - Open prospective customer detail and verify status, template recommendations, and tags. | TBD | Planned |
| FR-005 | TEST-005 - Open API template detail and verify related customers/prospects and tags. | TBD | Planned |
| FR-006 | TEST-006 - Open specific API detail and verify related customer, tools, URL, and tags. | TBD | Planned |
| FR-007 | TEST-007 - Verify invoice and contract lists expose expected document metadata. | TBD | Planned |
| FR-008 | TEST-008 - Verify incidents expose title, description, evidence reference, and customer relation. | TBD | Planned |
| FR-009 | TEST-009 - Verify dashboard summaries, quick access, and chatbot placeholder area. | TBD | Planned |
| FR-010 | TEST-010 - Verify tags expose name, type, color, and timestamps where available. | TBD | Planned |
| FR-011 | TEST-011 - Add/remove tags for each supported entity type and verify persisted associations. | TBD | Planned |
| FR-012 | TEST-012 - Search by `#tag` and verify matching tagged records are returned. | TBD | Planned |
| FR-013 | TEST-013 - Search by partial name, CIF, and ID in relevant modules. | TBD | Planned |
| FR-014 | TEST-014 - Verify multiple tag search behavior after AND/OR semantics are decided. | TBD | Planned |
| FR-015 | TEST-015 - Compare search parsing behavior across modules for consistency. | TBD | Planned |
| FR-016 | TEST-016 - Follow README setup commands for database, backend, and frontend. | TBD | Planned |
| FR-017 | TEST-017 - Call health and CRM API endpoints with valid and invalid session context. | TBD | Planned |
| FR-018 | TEST-018 - Verify local seed-user login succeeds and invalid credentials fail. | TBD | Planned |
| FR-019 | TEST-019 - Validate Keycloak realm/client/role design and backend token-validation plan before production auth replacement. | TBD | Planned |
| FR-020 | TEST-020 - Review a module addition/removal path for bounded code changes. | TBD | Planned |
| FR-021 | TEST-021 - Review secure file-upload requirements before enabling attachment handling. | TBD | Planned |
| FR-022 | TEST-022 - Review module CRUD coverage and record missing operations. | TBD | Planned |
| FR-023 | TEST-023 - Verify chatbot integration remains provider-neutral until selection. | TBD | Planned |
| NFR-001 | TEST-024 - Measure local list/search visible response on seeded data. | TBD | Planned |
| NFR-002 | TEST-025 - Review query plans/indexes for relationship-heavy views. | TBD | Planned |
| NFR-003 | TEST-026 - Verify frontend/backend API target can change by environment. | TBD | Planned |
| NFR-004 | TEST-027 - Review whether detail screens expose relationships understandably. | TBD | Planned |
| NFR-005 | TEST-028 - Verify consistent `#tag` behavior across modules. | TBD | Planned |
| NFR-006 | TEST-029 - Simulate missing related records and verify recoverable UI states. | TBD | Planned |
| NFR-007 | TEST-030 - Restart local services following documentation. | TBD | Planned |
| NFR-008 | TEST-031 - Verify production readiness blocks current seed-user/AES login and requires Keycloak. | TBD | Planned |
| NFR-009 | TEST-032 - Review attachment access-control design before production document handling. | TBD | Planned |
| NFR-010 | TEST-033 - Review module boundary impact for representative changes. | TBD | Planned |
| NFR-011 | TEST-034 - Check documentation/test impact when entity relationships change. | TBD | Planned |
| NFR-012 | TEST-035 - Review AI integration point for provider neutrality. | TBD | Planned |
| NFR-013 | TEST-036 - Verify navigation remains coherent after module changes. | TBD | Planned |
| NFR-014 | TEST-037 - Review safeguards for sensitive create/update/delete operations. | TBD | Planned |

## References

- `_context/_verification/Test-Policy.md`
- `_context/_verification/Test-Strategy.md`
- `_context/_verification/SQCA.md`
- `_context/_specification/FRDs/`
- `_context/_specification/NFRD.md`
- `_context/_design/ADD.md`
