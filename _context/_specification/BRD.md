# CRM para gestion de clientes - Business Requirements Document

## Title

| Field | Value |
| --- | --- |
| Document | Business Requirements Document |
| Initiative | CRM para gestion de clientes |
| Version | 0.1 |
| Status | Draft - migrated from prompts |
| Author | Consultor |
| Reviewers | Aelium |
| Organization | Aelium |
| Last Updated | 2026-09-11 |

## 1. Introduction

### 1.1 Purpose

This document defines the business requirements for Aelium's CRM for managing customers and prospective customers. API template and specific API administration is treated as a concrete module of Aelium's current automation-services business, not as the CRM's primary purpose.

### 1.2 Scope

The CRM covers internal management of commercial and delivery information for automation services. It includes entity management, relationships between entities, searchable/tagged classification, and a modular technical foundation for future extensions.

### 1.3 Definitions

| Term | Definition |
| --- | --- |
| Customer | Company with an active signed contract with Aelium |
| Prospective customer | Company contacted or evaluated by Aelium but without a signed contract |
| API template | Reusable API model that can be recommended to customers or prospective customers |
| Specific API | API designed or implemented for a particular customer |
| Tag | Reusable label used to classify and filter CRM records |
| CIF | Company tax identifier used as a primary identifier for customers and prospects |

## 2. Business Objectives

| Objective | Description |
| --- | --- |
| OBJ-001 | Centralize customer and prospect information with related commercial, operational, and service records |
| OBJ-002 | Support business-specific service modules, including reusable API templates and customer-specific APIs |
| OBJ-003 | Enable fast retrieval through global search and tags |
| OBJ-004 | Keep the product modular and maintainable as new CRM windows are added |
| OBJ-005 | Establish a reliable local technical foundation |
| OBJ-006 | Prepare for future secure operations and AI assistance |

## 3. Stakeholders

| Stakeholder | Role | Interest |
| --- | --- | --- |
| Aelium administrators | Primary business users | Operational CRM management |
| Aelium delivery team | Service and automation implementers | Customer context, reusable service templates, API reuse, and implementation traceability |
| Aelium sales / operations | Commercial users | Prospect follow-up and opportunity visibility |
| System maintainer | Technical owner | Maintainable modules, database integrity, and local operation |

## 4. Business Requirements

| ID | Requirement | Priority | Traces to (OBJ-xxx) |
| --- | --- | --- | --- |
| REQ-001 | The CRM shall maintain customer records with CIF, company name, contact phone, needs, address, attached-file references, and related business records. | High | OBJ-001 |
| REQ-002 | The CRM shall maintain prospective customer records separately from customers, including status, needs, contact data, tags, and recommended API templates. | High | OBJ-001 |
| REQ-003 | The CRM shall support service-template modules, currently represented by API templates, as reusable assets that can be related to customers and prospective customers. | High | OBJ-002 |
| REQ-004 | The CRM shall support customer-specific service implementations, currently represented by customer-specific APIs, and relate them to the customers they were designed for. | High | OBJ-002 |
| REQ-005 | The CRM shall expose contracts and invoices related to customers, including dates, company names, document URLs, and invoice cost where applicable. | High | OBJ-001 |
| REQ-006 | The CRM shall maintain incidents related to customers so operational issues can be tracked from the CRM. | Medium | OBJ-001 |
| REQ-007 | The CRM shall provide a reusable tag system for customers, prospective customers, API templates, and specific APIs. | High | OBJ-003 |
| REQ-008 | The CRM shall provide global and module-level search by name, CIF, ID, and tag expressions using the `#tag` convention. | High | OBJ-003 |
| REQ-009 | The CRM shall support a modular application structure so modules can be added or removed with limited impact on unrelated modules. | High | OBJ-004 |
| REQ-010 | The CRM shall run locally with a Rust backend, Vite/TailwindCSS frontend, and PostgreSQL database using documented setup commands. | High | OBJ-005 |
| REQ-011 | The CRM shall provide an administrator login baseline while leaving production-grade authentication as a planned requirement. | Medium | OBJ-006 |
| REQ-012 | The CRM shall reserve a central dashboard area for chatbot, quick access, summaries, and basic statistics. | Medium | OBJ-006 |
| REQ-013 | The CRM shall document future implementation needs for secure file uploads, real authentication, full CRUD per module, and AI provider integration. | Medium | OBJ-006 |

## 5. Business Constraints

| ID | Constraint | Rationale |
| --- | --- | --- |
| CON-001 | Use Rust/Axum for the backend | Current codebase and README establish this stack |
| CON-002 | Use Vite/TailwindCSS for the frontend | Current codebase and source prompts establish this stack |
| CON-003 | Use PostgreSQL for persistence | Current database scripts and local environment depend on PostgreSQL |
| CON-004 | Support local operation before final domain deployment | Source prompts state that the final domain is not defined |
| CON-005 | Avoid assuming a final AI provider | Source prompts state that the chatbot provider is not defined |

## 6. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Seed-user authentication remains in place too long | Unauthorized access risk if used beyond local development | Track production authentication as a requirement and test it before deployment |
| Document URLs and attachments are not secured | Customer or commercial information could be exposed | Design secure upload and access control before production use |
| Tag and search behavior becomes inconsistent across modules | Users cannot reliably find records | Define shared search/tag rules and acceptance criteria |
| Module boundaries are unclear | New features become harder to add or remove | Preserve frontend/backend modularity in design decisions |
| Database relationships drift from business rules | Incorrect customer, service-module, or document relationships | Keep schema, requirements, and tests traceable |

## 7. Success Criteria

The CRM is successful when Aelium can run the application locally, view and search core CRM entities, manage relationships around customers and prospects, classify records with tags, and extend business-specific modules such as APIs without destabilizing unrelated CRM areas.

## References

- `README.md`
- `prompts/PROMT inicial de creacion del CRM.txt`
- `prompts/Segundo promt de cracion inicial CRM.txt`
- `database/schema.sql`
