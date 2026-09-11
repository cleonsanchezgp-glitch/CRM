# CRM para gestion de clientes - Software Quality Characteristics Analysis

## Title

| Field | Value |
| --- | --- |
| Document | Software Quality Characteristics Analysis (SQCA) |
| Initiative | CRM para gestion de clientes |
| Version | 0.1 |
| Status | Draft |
| Author | Quaestor |
| Reviewers | Aelium |
| Organization | Aelium |
| Last Updated | 2026-09-11 |

## 1. Purpose

This SQCA prioritizes ISO/IEC 25010:2023 quality characteristics for the CRM so the Test Management Plan can select test depth based on stated product risk. The CRM is centered on customer and prospect management and handles service-module records such as APIs, contracts, invoices, incidents, tags, and authentication data, with Keycloak planned as the production identity-management direction.

## 2. Priority Scale

| Priority | Meaning |
| --- | --- |
| High | Material risk if this characteristic fails; drives dedicated, deeper coverage. |
| Medium | Real but bounded risk; drives representative coverage. |
| Low | Limited exposure; spot-checked or covered incidentally. |
| N/A | Not applicable to this product context. |

## 3. Characteristic Assessment

### 3.1 Functional Suitability

| Subcharacteristic | Priority | Rationale | Derived test types |
| --- | --- | --- | --- |
| Functional completeness | High | The CRM must cover core entities, relationships, tags, search, local operation, and production identity readiness to be useful. | Requirements coverage, system tests, acceptance tests |
| Functional correctness | High | Incorrect customer/API/invoice/contract relationships can mislead business operations. | Unit, integration, data integrity, acceptance tests |
| Functional appropriateness | Medium | Workflows must fit Aelium's operational needs, but early usage can refine flow details. | Exploratory tests, acceptance tests |

### 3.2 Performance Efficiency

| Subcharacteristic | Priority | Rationale | Derived test types |
| --- | --- | --- | --- |
| Time behaviour | Medium | Search and list views must feel responsive for operational use. | API response checks, UI smoke timings |
| Resource utilization | Low | Initial local/small-business scope has limited known load. | Spot checks |
| Capacity | Medium | PostgreSQL relationship queries and tag search need review before real data growth. | Query review, representative data tests |

### 3.3 Compatibility

| Subcharacteristic | Priority | Rationale | Derived test types |
| --- | --- | --- | --- |
| Co-existence | Low | No strong evidence yet of shared-host constraints. | Deployment smoke checks |
| Interoperability | Medium | Frontend/backend/PostgreSQL and future Keycloak/GitHub integrations must work together. | Integration tests, contract checks |

### 3.4 Interaction Capability

| Subcharacteristic | Priority | Rationale | Derived test types |
| --- | --- | --- | --- |
| Appropriateness recognisability | Medium | Users need to understand CRM modules and record relationships quickly. | UX review, acceptance tests |
| Learnability | Medium | Aelium administrators should use modules without database knowledge. | Exploratory tests |
| Operability | High | Search, navigation, detail views, and tag management are central workflows. | E2E tests, acceptance tests |
| User error protection | Medium | Future CRUD and sensitive operations need safeguards. | Negative tests, UX review |
| User engagement | Low | The CRM is operational software; engagement polish matters less than task success. | Visual review |
| Inclusivity | TBD | No accessibility target has been declared yet. | TBD |
| User assistance | Low | Current source material does not define in-app help. | Spot checks |
| Self-descriptiveness | Medium | Empty, loading, and error states are important for relationship-heavy views. | UI state tests |

### 3.5 Reliability

| Subcharacteristic | Priority | Rationale | Derived test types |
| --- | --- | --- | --- |
| Faultlessness | High | Backend/API/data errors can block CRM operation or corrupt understanding of records. | Unit, integration, regression tests |
| Availability | Medium | Local operation must be restartable; production availability targets are not yet defined. | Smoke tests, restart checks |
| Fault tolerance | Medium | Missing related records and backend failures should not crash the UI. | Negative tests, UI error-state tests |
| Recoverability | Medium | Database and attachment-related recovery will matter before production. | Backup/restore plan review, failure tests |

### 3.6 Security

| Subcharacteristic | Priority | Rationale | Derived test types |
| --- | --- | --- | --- |
| Confidentiality | High | CRM records include customer, contract, invoice, incident, and attachment references. | Auth tests, access-control tests, data exposure review |
| Integrity | High | Incorrect or unauthorized changes to CRM data can harm business records. | Authorization tests, data mutation tests |
| Non-repudiation | Low | No formal audit trail requirement is declared yet. | TBD |
| Accountability | High | Production user management through Keycloak needs traceable user/role behavior. | Role/claim tests, auditability review |
| Authenticity | High | Keycloak must correctly establish user identity before protected API access. | OIDC/token validation tests, login flow tests |
| Resistance | Medium | Production exposure will require basic resistance to common auth/API misuse. | Security smoke tests, negative API tests |

### 3.7 Maintainability

| Subcharacteristic | Priority | Rationale | Derived test types |
| --- | --- | --- | --- |
| Modularity | High | Modular screens and bounded backend behavior are a stated product objective. | Code review, module boundary checks |
| Reusability | Medium | API templates and shared UI/search/tag utilities should be reusable. | Review, regression tests |
| Analysability | Medium | The system must remain understandable as modules grow. | Code review, documentation review |
| Modifiability | High | Adding/removing modules is a core architectural objective. | Change-impact review |
| Testability | Medium | Requirements now need tests and evidence paths before production. | Test design review |

### 3.8 Flexibility

| Subcharacteristic | Priority | Rationale | Derived test types |
| --- | --- | --- | --- |
| Adaptability | Medium | Local and future production environments must be configurable. | Configuration tests |
| Scalability | Medium | Data volume and module growth are expected, though no hard volume target exists yet. | Representative data tests |
| Installability | Medium | README-based setup is important for local operation. | Setup smoke tests |
| Replaceability | Medium | AI provider is undecided and should remain replaceable; Keycloak is now the chosen identity direction. | Architecture review |

### 3.9 Safety

| Subcharacteristic | Priority | Rationale | Derived test types |
| --- | --- | --- | --- |
| Operational constraint | Medium | Sensitive CRUD operations and attachment handling need guardrails before production. | Negative tests, workflow review |
| Risk identification | Medium | Production gaps must stay visible rather than being treated as complete. | Readiness review |
| Fail safe | Medium | Failed API/auth operations should fail closed rather than expose data. | Negative auth/API tests |
| Hazard warning | Low | No physical or life-safety hazard context applies. | N/A |
| Safe integration | Medium | Keycloak, GitHub, database, and frontend integration failures should not expose or corrupt data. | Integration failure tests |

## 4. Summary - High Priority Only

| Characteristic | Subcharacteristic | Rationale | Derived test types |
| --- | --- | --- | --- |
| Functional Suitability | Functional completeness | Core CRM scope must be covered to be useful. | Requirements coverage, system tests, acceptance tests |
| Functional Suitability | Functional correctness | Incorrect business relationships can mislead operations. | Unit, integration, data integrity, acceptance tests |
| Interaction Capability | Operability | Search, navigation, details, and tags are central workflows. | E2E tests, acceptance tests |
| Reliability | Faultlessness | Backend/API/data errors can block CRM use. | Unit, integration, regression tests |
| Security | Confidentiality | Customer and commercial records are sensitive. | Auth tests, access-control tests, data exposure review |
| Security | Integrity | Unauthorized or incorrect mutations can harm business records. | Authorization tests, data mutation tests |
| Security | Accountability | Keycloak roles and user identity need traceable behavior. | Role/claim tests, auditability review |
| Security | Authenticity | Keycloak must establish identity for protected access. | OIDC/token validation tests, login flow tests |
| Maintainability | Modularity | Modular expansion is a stated objective. | Code review, module boundary checks |
| Maintainability | Modifiability | Adding/removing modules is a core architectural objective. | Change-impact review |

## References

- `_context/VSD.md`
- `_context/_specification/BRD.md`
- `_context/_specification/FRDs/`
- `_context/_specification/NFRD.md`
- `_context/_design/ADD.md`
- `_context/_verification/Test-Strategy.md`
