# Local Platform and Future Readiness - Functional Requirements Document

## Document Control

| Field | Value |
| --- | --- |
| Requirement Name | Local Platform and Future Readiness |
| ID | FRD-LOCAL-PLATFORM |
| Version | 0.1 |
| Author | Consultor |
| Last Updated | 2026-09-10 |

## 1. Overview

This feature covers local operation, administrator login baseline, modularity expectations, and reserved future capabilities such as secure file upload, full CRUD, and AI chatbot integration.

## 2. Actors

| Actor | Description |
| --- | --- |
| Administrator | Aelium user accessing the CRM |
| System maintainer | Technical owner running, extending, and securing the application |
| System | CRM frontend, backend, and database |

## 3. Functional Requirements

| ID | Description | Priority | Traces to (REQ-xxx) |
| --- | --- | --- | --- |
| FR-016 | The system shall provide documented commands for running the backend, frontend, and PostgreSQL database locally. | High | REQ-010 |
| FR-017 | The backend shall expose health and CRM data endpoints consumed by the frontend. | High | REQ-010 |
| FR-018 | The system shall provide an administrator login baseline for local operation. | Medium | REQ-011 |
| FR-019 | The system shall keep production-grade authentication as an explicit future implementation need. | High | REQ-011 |
| FR-020 | The system shall maintain a modular frontend structure so modules can be added or removed with limited impact. | High | REQ-009 |
| FR-021 | The system shall keep secure file upload as an explicit future implementation need. | Medium | REQ-013 |
| FR-022 | The system shall keep full CRUD per module as an explicit future implementation need where not already implemented. | Medium | REQ-013 |
| FR-023 | The system shall keep AI chatbot provider integration as an explicit future implementation need until a provider is selected. | Medium | REQ-013 |

## 4. Workflow

1. The system maintainer prepares PostgreSQL with schema and seed data.
2. The system maintainer starts the backend.
3. The system maintainer builds or serves the frontend.
4. The administrator logs in through the local baseline.
5. The administrator uses available modules while future capabilities remain tracked.

## 5. Inputs

| Input | Source |
| --- | --- |
| `DATABASE_URL` | Environment or backend default |
| `CRM_AES_KEY` | Environment or backend default |
| PostgreSQL schema and seed data | `database/*.sql` |
| Login credentials | Seeded local users |

## 6. Outputs

| Output | Destination |
| --- | --- |
| Running backend API | `http://127.0.0.1:8080` |
| Development frontend | `http://127.0.0.1:5173` |
| Built frontend served by backend | Browser |
| Explicit future implementation gaps | Requirements and planning backlog |

## 7. Acceptance Criteria

| ID | Given | When | Then | Verifies |
| --- | --- | --- | --- | --- |
| AC-016 | PostgreSQL is available with schema and seed data | The maintainer follows README commands | The backend can connect to the `CRM` database | FR-016 |
| AC-017 | The backend is running | The frontend calls a documented endpoint | The backend returns a valid API response or a meaningful error | FR-017 |
| AC-018 | Local seed users exist | The administrator logs in locally | The system allows access according to the implemented local baseline | FR-018 |
| AC-019 | The project is assessed for production readiness | Authentication is reviewed | The system records production-grade authentication as required before production use | FR-019 |
| AC-020 | A new module is planned | The maintainer inspects the frontend structure | The module can be located in a bounded view/template area without rewriting unrelated modules | FR-020 |
| AC-021 | A user needs attachments | File handling is reviewed | The system records secure upload and access control as required before production document handling | FR-021 |
| AC-022 | A module lacks create/update/delete behavior | The module is reviewed | The missing CRUD behavior is visible as future work | FR-022 |
| AC-023 | A chatbot provider is not selected | The dashboard is reviewed | The chatbot area remains reserved without assuming a provider | FR-023 |

## 8. Error Handling

- If the database is unavailable, the backend shall fail visibly rather than silently returning misleading data.
- If required environment values are absent, documented defaults may be used for local development only.
- If a production-only capability is not implemented, the system shall keep it visible as planned work rather than presenting it as complete.

## 9. Interface Requirements *(optional - only when this feature exposes or consumes an explicit interface contract, e.g. API, event, file format)*

| ID | Interface | Description | Traces to (REQ-xxx) |
| --- | --- | --- | --- |
| INT-004 | Backend API | Provides local API endpoints for health and CRM data | REQ-010 |
| INT-005 | PostgreSQL schema | Defines tables and relationships for CRM records | REQ-010 |

## References

- `README.md`
- `backend/Cargo.toml`
- `database/schema.sql`
