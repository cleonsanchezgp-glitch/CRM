# CRM para gestion de clientes - Vision and Scope Document

## Title

| Field | Value |
| --- | --- |
| Document | Vision and Scope Document |
| Initiative | CRM para gestion de clientes |
| Version | 0.1 |
| Status | Draft - migrated from prompts |
| Author | Consultor |
| Reviewers | Aelium |
| Organization | Aelium |
| Repository Type | Software Product |
| Last Updated | 2026-09-11 |

## 1. Vision

Create a modular CRM for Aelium centered on managing customers and prospective customers throughout the working relationship. The product centralizes customer context, commercial records, service needs, contracts, invoices, incidents, tags, search, and business-specific modules such as API templates and customer-specific APIs.

## 2. Problem Statement

Aelium needs to manage growing information about the customers it works with and the prospective customers it is evaluating. API templates and specific APIs are important for the current business idea, but they are one concrete service domain inside the broader CRM purpose. Without a structured CRM, customer context, opportunities, documents, incidents, and service relationships can become scattered across files, manual notes, database scripts, and isolated screens.

## 3. Business Opportunity

A structured CRM gives Aelium a foundation for repeatable customer management, clearer opportunity tracking, better visibility of contracts and invoices, more organized service delivery, and future AI-assisted workflows. API management remains a valuable module for the current automation-services model, while the CRM foundation can support other client-related modules as the business evolves.

## 4. Stakeholders

| Stakeholder | Role | Interest |
| --- | --- | --- |
| Aelium administrators | Primary business users | Manage customers, prospects, contracts, invoices, incidents, service modules, APIs, and tags from one interface |
| Aelium delivery team | Service and automation implementers | Understand each customer's needs, active services, reusable templates, and specific implementations |
| Aelium sales / operations | Opportunity and account follow-up | Track prospective customers, needs, status, and recommended API templates |
| Customers and prospective customers | Business entities represented in the CRM | Receive better follow-up and more organized service delivery |
| System maintainer | Technical owner | Extend modules, maintain PostgreSQL data, and operate Rust/Vite application components |

## 5. Product Scope

In scope:

- Customer and prospective customer management.
- API template and customer-specific API management as one business-specific module.
- Contract, invoice, and incident visibility.
- Global tag system for classification and filtering.
- Global and module-level search by name, CIF, ID, and tags.
- Modular frontend structure for adding and removing screens or functionality.
- Rust backend API with PostgreSQL persistence.
- Local-first operation while the final domain and deployment model are undefined.

Out of scope for the current baseline:

- Production authentication with sessions or JWT beyond the current seed-user/AES baseline.
- Secure document upload implementation.
- AI chatbot provider integration.
- Public customer self-service portal.
- Final production hosting and domain architecture.

## 6. Objectives

| ID | Objective | Success Metric | Target |
| --- | --- | --- | --- |
| OBJ-001 | Centralize customer and prospect information with related commercial, operational, and service records | Users can view customer or prospect details and related records from the CRM | Customer/prospect profiles cover core fields and relationships |
| OBJ-002 | Support business-specific service modules, including reusable API templates and customer-specific APIs | API templates and specific APIs can be listed, opened, searched, and related to customers/prospects without defining the CRM's whole purpose | API modules behave as client-management extensions |
| OBJ-003 | Enable fast retrieval through global search and tags | Users can filter records by text and tag expressions | Search supports names, CIF, IDs, and `#tag` terms |
| OBJ-004 | Keep the product modular and maintainable as new CRM windows are added | New modules can be added without rewriting central application structure | Frontend and backend preserve module boundaries |
| OBJ-005 | Establish a reliable local technical foundation | Backend, frontend, and PostgreSQL can run locally from documented commands | Local build/run path works for development |
| OBJ-006 | Prepare for future secure operations and AI assistance | Known future gaps are explicit and traceable | Authentication, file upload, and chatbot integration remain documented requirements |

## 7. Constraints

| ID | Constraint | Rationale |
| --- | --- | --- |
| CON-001 | Backend is implemented in Rust with Axum | Current repository and README define Rust/Axum backend as the application baseline |
| CON-002 | Frontend is implemented with Vite and TailwindCSS | Current repository and source prompts define the frontend approach |
| CON-003 | Data persistence uses PostgreSQL | Current schema and local execution path depend on PostgreSQL |
| CON-004 | Local environment currently uses PostgreSQL on port 5433 with database `CRM` | README and prompts define local development assumptions |
| CON-005 | Final production domain and provider for AI chatbot are not yet defined | Source prompts explicitly leave these decisions open |

## References

- `README.md`
- `prompts/PROMT inicial de creacion del CRM.txt`
- `prompts/Segundo promt de cracion inicial CRM.txt`
- `database/schema.sql`
- `interfaz CRM/*.jpg`
