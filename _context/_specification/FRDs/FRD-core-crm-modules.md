# CRM Core Modules - Functional Requirements Document

## Document Control

| Field | Value |
| --- | --- |
| Requirement Name | CRM Core Modules |
| ID | FRD-CORE-CRM-MODULES |
| Version | 0.1 |
| Author | Consultor |
| Last Updated | 2026-09-11 |

## 1. Overview

This feature covers the core CRM modules for customers, prospective customers, contracts, invoices, incidents, and business-specific service modules. API templates and specific APIs are the first concrete service-module implementation for Aelium's current business idea.

## 2. Actors

| Actor | Description |
| --- | --- |
| Administrator | Aelium user managing CRM data and relationships |
| System | CRM frontend, backend API, and PostgreSQL database |

## 3. Functional Requirements

| ID | Description | Priority | Traces to (REQ-xxx) |
| --- | --- | --- | --- |
| FR-001 | The system shall list customers with enough identifying information to select a customer record. | High | REQ-001 |
| FR-002 | The system shall display a customer detail view with customer data, related contracts, invoices, specific APIs, API templates, tags, and file references where available. | High | REQ-001 |
| FR-003 | The system shall list prospective customers separately from customers. | High | REQ-002 |
| FR-004 | The system shall display a prospective customer detail view with prospect data, status, recommended API templates, and tags. | High | REQ-002 |
| FR-005 | The system shall list service templates, currently API templates, and show their details, related customers, related prospects, and tags. | High | REQ-003 |
| FR-006 | The system shall list customer-specific service implementations, currently specific APIs, and show their details, related customer, tools, and tags. | High | REQ-004 |
| FR-007 | The system shall expose customer-related contracts and invoices with document URL, date, company name, and invoice cost where applicable. | High | REQ-005 |
| FR-008 | The system shall expose incidents associated with customers. | Medium | REQ-006 |
| FR-009 | The system shall provide a dashboard with quick access, customer/API summaries, and a reserved chatbot area. | Medium | REQ-012 |

## 4. Workflow

1. The administrator opens a CRM module.
2. The system requests the relevant records from the backend API.
3. The administrator selects a record.
4. The system displays the detail view and related records.
5. The administrator navigates back to the list or to a related module.

## 5. Inputs

| Input | Source |
| --- | --- |
| Customer/prospect/API/document identifiers | Administrator selection or URL state |
| Search or filter text | Administrator input |
| CRM records | PostgreSQL through backend API |

## 6. Outputs

| Output | Destination |
| --- | --- |
| Lists of CRM records | Frontend module views |
| Detail views and related records | Frontend profile/detail screens |
| Dashboard summaries | CRM dashboard |

## 7. Acceptance Criteria

| ID | Given | When | Then | Verifies |
| --- | --- | --- | --- | --- |
| AC-001 | Customer records exist | The administrator opens the customers module | The system shows a selectable list of customers | FR-001 |
| AC-002 | A customer has related APIs, contracts, invoices, or tags | The administrator opens the customer detail view | The system displays the customer data and available related records | FR-002 |
| AC-003 | Prospective customer records exist | The administrator opens the prospective customers module | The system shows prospects separately from customers | FR-003 |
| AC-004 | A prospective customer has recommended API templates | The administrator opens the prospect detail view | The system displays the prospect and available template recommendations | FR-004 |
| AC-005 | API template records exist | The administrator opens an API template | The system displays template details and related customers or prospects when available | FR-005 |
| AC-006 | Specific API records exist | The administrator opens a specific API | The system displays API details and its related customer when available | FR-006 |
| AC-007 | A customer has contracts or invoices | The administrator views the customer or financial module | The system displays the related document records | FR-007 |
| AC-008 | Customer incidents exist | The administrator opens incident information | The system displays incident title, description, evidence reference, and related customer | FR-008 |
| AC-009 | The administrator opens the dashboard | The dashboard loads | The system displays quick access, summaries, statistics, and the chatbot area placeholder | FR-009 |

## 8. Error Handling

- If the backend cannot load records, the UI shall show a recoverable error state.
- If a selected record no longer exists, the UI shall return to a safe list or empty state.
- If related records are absent, the UI shall show an empty state rather than failing the detail view.

## 9. Interface Requirements *(optional - only when this feature exposes or consumes an explicit interface contract, e.g. API, event, file format)*

| ID | Interface | Description | Traces to (REQ-xxx) |
| --- | --- | --- | --- |
| INT-001 | Backend REST API | Frontend consumes CRM endpoints for dashboard, customers, prospects, APIs, invoices, contracts, and incidents | REQ-010 |

## References

- `README.md`
- `prompts/Segundo promt de cracion inicial CRM.txt`
