# Local Platform and Keycloak Readiness - Work Package

## Title

| Field | Value |
| --- | --- |
| Document | Work Package |
| Work Package ID | WP-003 |
| Version | 0.3 |
| Status | Implemented |
| Author | Rector |
| Reviewers | Aelium |
| Organization | Aelium |
| Last Updated | 2026-09-11 |

## 1. Overview

This work package covers local runtime reliability, backend/frontend/database setup, and the transition path from local seed-user authentication to Keycloak-based production identity management.

## 2. Belongs to Project

| Project (PRJ-xxx) |
| --- |
| PRJ-001 |

## 3. Realizes

| Requirement (FR-xxx / NFR-xxx) | Notes |
| --- | --- |
| FR-016 | Local run commands |
| FR-017 | Backend API endpoints |
| FR-018 | Local administrator login baseline |
| FR-019 | Production-grade authentication requirement |
| FR-020 | Modular frontend structure |
| FR-021 | Secure file-upload requirement |
| FR-022 | Full CRUD visibility |
| FR-023 | Future AI provider integration |
| NFR-003 | Environment adaptability |
| NFR-007 | Restartable local setup |
| NFR-008 | Local auth is not production auth |
| NFR-009 | Attachment protection |
| NFR-010 | Maintainable module boundaries |
| NFR-012 | Provider-neutral AI integration |
| NFR-014 | Safeguards for sensitive operations |

## 4. Tasks

| ID | Task | Status | Owner |
| --- | --- | --- | --- |
| TSK-009 | Verify README local setup against current backend, frontend, and database behavior | Done | Aelium |
| TSK-010 | Define Keycloak realm, client, roles, groups, and token claims for CRM users | Done | Aelium |
| TSK-011 | Plan backend token validation and route-level authorization based on Keycloak claims | Done | Aelium |
| TSK-012 | Plan frontend login/session changes for Keycloak integration | Done | Aelium |
| TSK-013 | Decide how local seed-user auth is retained, disabled, or replaced after Keycloak integration | Done | Aelium |
| TSK-014 | Keep secure attachments, full CRUD gaps, and AI provider integration visible for later work | Done | Aelium |

## 5. Status

| Field | Value |
| --- | --- |
| Overall status | Implemented for Keycloak-only local readiness |
| Start date | 2026-09-10 |
| Target completion | 2026-09-11 |

## 6. Implementation Notes

| Area | Decision / Outcome |
| --- | --- |
| Local platform | `docker-compose.yml` now starts PostgreSQL, backend, frontend, and Keycloak. Keycloak is exposed on `127.0.0.1:8081`. |
| Realm import | `keycloak/realm-export.json` defines realm `crm`, public OIDC client `crm-frontend`, roles `crm_user` and `crm_admin`, groups, and development users `Manu` and `Carlos`. |
| Backend authentication | `backend/src/auth.rs` supports `AUTH_MODE=keycloak` as the default path. `/api/auth/login` is disabled in Keycloak mode, and protected routes require RS256 Keycloak access tokens. `local` and `hybrid` remain explicit development escape hatches only. |
| Backend authorization baseline | Keycloak tokens must match `KEYCLOAK_ISSUER`, `KEYCLOAK_CLIENT_ID`, and `KEYCLOAK_REQUIRED_ROLE` when configured. Default required role is `crm_user`. JWKS are cached in process. |
| Frontend session | `frontend/src/lib/keycloak.js` authenticates against Keycloak from the CRM login form using Direct Access Grants, stores the Keycloak access token in the existing session path, and does not redirect users to the hosted Keycloak login page. |
| Local seed users | Seed-user/AES login is not used by the CRM login screen and is blocked by default in the backend. It remains available only as an explicit development escape hatch when `AUTH_MODE=local` or `AUTH_MODE=hybrid` is combined with `ALLOW_LOCAL_AUTH=true`. |
| Runtime documentation | `README.md` documents Docker startup, Keycloak URLs, users, auth modes, and local environment variables. |

## 7. Remaining Follow-up

| Topic | Status |
| --- | --- |
| Secure attachments | Still future work under FR-021 / NFR-009. |
| Full CRUD gaps | Still future work under FR-022. |
| AI provider integration | Still future work under FR-023 / NFR-012. |
| Production hardening | Required before production: TLS, secrets, Keycloak persistence/backups, password policy, key rotation, monitoring, and environment-specific redirect origins. |

## References

- `_context/_specification/FRDs/FRD-local-platform-and-future-readiness.md`
- `_context/_specification/NFRD.md`
- `_context/_design/ADD.md`
