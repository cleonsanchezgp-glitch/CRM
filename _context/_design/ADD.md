# CRM para gestion de clientes - Architecture Design Document

## Title

| Field | Value |
| --- | --- |
| Document | Architecture Design Document |
| Initiative | CRM para gestion de clientes |
| Version | 0.1 |
| Status | Draft |
| Author | Conditor |
| Reviewers | Aelium |
| Organization | Aelium |
| Last Updated | 2026-09-11 |

## 1. Overview

### 1.1 Purpose

This document describes the current and intended architecture of Aelium's CRM for customer and prospect management, including contracts, invoices, incidents, tags, search, and business-specific service modules such as API templates and customer-specific APIs.

### 1.2 Scope

Covered systems and components:

- Vite/TailwindCSS frontend application.
- Rust/Axum backend API.
- PostgreSQL CRM database.
- Local development/runtime configuration.
- GitHub repository file browsing integration exposed by the backend.
- Authentication/session baseline used by the CRM and intended Keycloak-based production identity management.

Not covered in this version:

- Final production hosting architecture.
- Final AI chatbot provider architecture.
- Secure upload/storage architecture for attachments.

## 2. Architectural Principles

- **Modular application structure:** CRM modules should remain bounded so new screens and capabilities can be added or removed with limited impact.
- **Traceable business data:** customer, prospect, API, contract, invoice, incident, and tag relationships should be explicit in the data model and exposed through APIs.
- **Local-first development:** the product must run predictably on a local backend, frontend, and PostgreSQL database while final deployment decisions are open.
- **Security evolves before production:** local seed-user/AES login is acceptable for development only; production identity management will be based on Keycloak before production use.
- **Provider-neutral future AI:** the dashboard reserves chatbot space without coupling the current architecture to an AI provider.

## 3. System Context

Aelium administrators use the CRM frontend in a browser. The frontend calls the backend under `/api`. The current backend authenticates local users for development, reads and writes PostgreSQL CRM records, and can call GitHub APIs for repository file metadata and content when a token is configured. The production target introduces Keycloak as the identity provider for user authentication, session/token issuance, and user/role management.

### Context Diagram

```text
Aelium administrator
  |
  v
CRM frontend (Vite/TailwindCSS)
  |
  v
CRM backend API (Rust/Axum)
  |             |              |
  v             v              v
PostgreSQL      Keycloak       GitHub API (repository browsing, optional token)
```

## 4. High-Level Architecture

### Components

| Component | Description |
| --- | --- |
| Frontend shell and views | Browser UI with dashboard, navigation, login, CRM modules, modals, shared templates, and formatting utilities |
| Frontend API client | Shared JavaScript API functions for authentication, CRUD calls, GitHub repository browsing, and tag mutation |
| Backend HTTP router | Axum routes under `/api` for health, auth, dashboard, customers, prospects, APIs, invoices, contracts, incidents, tags, and GitHub helpers |
| Authentication/session module | Login flow using encrypted stored passwords and in-memory session tokens |
| Keycloak identity provider | Intended production component for user authentication, role/group management, and token validation |
| PostgreSQL data model | CRM entity tables, relationship tables, tag tables, indexes, and seed data |
| GitHub integration | Backend HTTP client that reads repository tree, file content, and latest commit metadata |
| Static frontend serving | Backend serves built frontend assets from `frontend/dist` for one-port local/production-style operation |

## 5. Data Flow

Current local CRM data flow:

1. The administrator logs in through the frontend.
2. The frontend posts credentials to `/api/auth/login`.
3. The backend validates the user against PostgreSQL and returns a session token.
4. The frontend includes the token in later API requests.
5. The backend loads CRM records and relationships from PostgreSQL.
6. The frontend renders lists, detail views, tags, and related records.

Target production identity flow:

1. The administrator authenticates through Keycloak.
2. Keycloak issues an identity/access token according to the configured realm, client, users, groups, and roles.
3. The frontend sends the token to the backend API.
4. The backend validates the token and maps claims/roles to allowed CRM operations.
5. The backend loads or mutates CRM records only after authorization succeeds.

GitHub repository browsing flow:

1. The administrator opens an API record with a repository URL.
2. The frontend requests repository data through backend GitHub endpoints.
3. The backend validates the session, parses the repository URL, calls GitHub, and returns normalized metadata or content.
4. The frontend renders folders, files, previews, or recoverable error states.

## 6. Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vite, JavaScript modules, TailwindCSS, HTML templates |
| Backend | Rust, Axum, Tokio, SQLx, Reqwest |
| Authentication baseline | AES/CBC encrypted seed passwords, in-memory session tokens |
| Production identity management | Keycloak realm, clients, users/groups, roles, and token validation |
| Database | PostgreSQL with `pgcrypto`, relational tables, join tables, and indexes |
| AI Layer | Reserved for future provider integration; not selected |
| Infrastructure | Local development on `127.0.0.1:8080` backend and optional Vite dev server on `127.0.0.1:5173` |

## 7. Deployment Architecture

### Development

PostgreSQL runs locally on port 5433 with database `CRM`. The backend runs on `127.0.0.1:8080`. The frontend can either run through Vite development mode on `127.0.0.1:5173` with `/api` proxying, or be built and served by the backend from `frontend/dist`.

### Staging

No staging architecture is defined yet. Before staging exists, the project should define environment-specific database credentials, Keycloak realm/client configuration, frontend API target configuration, token validation behavior, and representative test data.

### Production

No production hosting architecture is defined yet. Production requires decisions for hosting, domain, TLS, database management, secrets management, Keycloak deployment or managed hosting, authentication, authorization, backups, attachment storage, logging, monitoring, and AI provider integration if chatbot functionality is enabled.

## 8. Security Considerations

### Authentication

The current baseline authenticates seeded users against encrypted stored passwords and returns in-memory session tokens. This supports local development but is not sufficient as the final production authentication design. The production design target is Keycloak, with the CRM frontend using the configured client flow and the backend validating tokens before serving protected routes.

### Authorization

The current model stores roles and permissions in the user table, but route-level behavior is primarily session-based. Production authorization should move role and group authority to Keycloak claims, with backend enforcement by operation and module.

### Data Protection

The CRM stores or references customer data, contracts, invoices, incidents, API records, and attachment URLs. Secure file upload, access control, secret management, database credential handling, and real-data test constraints must be designed before production use.

## 9. Architecture Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| ADR-001 | Use Rust/Axum for the backend API. | Matches the current implementation and supports a typed, performant API layer for CRM data and integrations. |
| ADR-002 | Use Vite/TailwindCSS with modular JavaScript views for the frontend. | Matches the current implementation and supports fast local development plus modular CRM screens. |
| ADR-003 | Use PostgreSQL as the system of record for CRM entities and relationships. | The source prompts require PostgreSQL and the current schema models customers, prospects, service-module records such as APIs, documents, incidents, tags, and join tables. |
| ADR-004 | Represent customer/service-module/tag relationships with explicit relational join tables. | The CRM needs many-to-many relationships and reliable traversal between customers, prospects, service-module records such as APIs, and tags. |
| ADR-005 | Serve the built frontend from the backend for a one-port runtime path. | The README defines a production/local mode where the backend serves `frontend/dist` and API endpoints under one port. |
| ADR-006 | Treat current AES/seed-user login as local baseline only. | The README and requirements identify production authentication as future work; architecture must not overstate the current security level. |
| ADR-007 | Keep GitHub repository browsing behind backend routes. | Backend mediation keeps token use and GitHub API normalization out of the browser-side module logic. |
| ADR-008 | Reserve chatbot integration behind future provider-neutral design. | The source prompts require a central chatbot but leave the provider undefined, so current architecture should avoid vendor coupling. |
| ADR-009 | Use Keycloak for production identity and user management. | A dedicated identity provider avoids custom production password/session handling and supports centralized users, groups, roles, and token-based backend authorization. |

## 10. Requirements Addressed

| Decision (ADR-xxx) | Requirement(s) satisfied | Notes |
| --- | --- | --- |
| ADR-001 | REQ-010, FR-017, INT-004, NFR-010 | Establishes backend technology and API boundary. |
| ADR-002 | REQ-009, REQ-010, FR-020, NFR-010, NFR-013 | Establishes modular frontend direction. |
| ADR-003 | REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-010, INT-005 | Establishes persistence for CRM records and relationships. |
| ADR-004 | REQ-003, REQ-004, REQ-007, FR-011, INT-003 | Supports many-to-many relationships and tags. |
| ADR-005 | REQ-010, FR-016, FR-017, NFR-003, NFR-007 | Supports documented local operation. |
| ADR-006 | REQ-011, FR-018, FR-019, NFR-008 | Makes the current login boundary explicit. |
| ADR-007 | REQ-004, REQ-010, FR-017, INT-004 | Documents current backend-mediated GitHub integration. |
| ADR-008 | REQ-012, REQ-013, FR-023, NFR-012 | Keeps chatbot direction explicit while provider remains undecided. |
| ADR-009 | REQ-011, FR-019, NFR-008, NFR-010 | Establishes the production identity-management direction with Keycloak. |
