# Search and Tags - Functional Requirements Document

## Document Control

| Field | Value |
| --- | --- |
| Requirement Name | Search and Tags |
| ID | FRD-SEARCH-TAGS |
| Version | 0.1 |
| Author | Consultor |
| Last Updated | 2026-09-11 |

## 1. Overview

This feature covers reusable tags and search behavior across CRM modules. Tags classify customers, prospective customers, and business-specific service modules such as API templates and specific APIs. Search supports ordinary text and `#tag` expressions so records can be found by business identifiers and classification labels.

## 2. Actors

| Actor | Description |
| --- | --- |
| Administrator | Aelium user searching and classifying records |
| System | CRM frontend, backend API, and PostgreSQL database |

## 3. Functional Requirements

| ID | Description | Priority | Traces to (REQ-xxx) |
| --- | --- | --- | --- |
| FR-010 | The system shall maintain reusable tags with name, type, color, and timestamps. | High | REQ-007 |
| FR-011 | The system shall associate tags with customers, prospective customers, and supported service-module records such as API templates and specific APIs. | High | REQ-007 |
| FR-012 | The system shall allow records to be filtered by tag using the `#tag` convention. | High | REQ-008 |
| FR-013 | The system shall allow records to be searched by name, CIF, ID, and partial text where relevant to the module. | High | REQ-008 |
| FR-014 | The system shall support multiple tag terms in one search expression. | Medium | REQ-008 |
| FR-015 | The system shall keep search and tag behavior consistent across modules. | High | REQ-009 |

## 4. Workflow

1. The administrator enters text, a `#tag`, or multiple tags in a search field.
2. The system parses ordinary text and tag tokens.
3. The system filters the active module's records using the parsed criteria.
4. The administrator selects a filtered result or adjusts the search.

## 5. Inputs

| Input | Source |
| --- | --- |
| Search text | Administrator input |
| Tag tokens | Administrator input using `#tag` |
| Tag associations | CRM database |
| Record identifiers and names | CRM database |

## 6. Outputs

| Output | Destination |
| --- | --- |
| Filtered records | Active CRM module list |
| Tag chips/labels | Record cards and detail views |
| Empty state | Active CRM module list when no record matches |

## 7. Acceptance Criteria

| ID | Given | When | Then | Verifies |
| --- | --- | --- | --- | --- |
| AC-010 | Tags exist in the system | The administrator views a tagged record | The system displays the associated tags | FR-010 |
| AC-011 | A customer, prospect, template API, or specific API has tags | The record is opened | The system displays the correct tag associations | FR-011 |
| AC-012 | Records are tagged with `#Docker` | The administrator searches for `#Docker` | The system returns records associated with that tag | FR-012 |
| AC-013 | A record has a matching name, CIF, or ID | The administrator enters matching partial text | The system includes the record in search results | FR-013 |
| AC-014 | Records have multiple tag combinations | The administrator searches for more than one tag | The system returns records matching the combined tag query according to the implemented filter rule | FR-014 |
| AC-015 | The administrator uses search in different modules | The same kind of query is entered | The system applies consistent parsing and visible behavior | FR-015 |

## 8. Error Handling

- If a tag does not exist, the system shall show no matching results without failing.
- If tag metadata is incomplete, the system shall still show the tag name.
- If search input is empty, the module shall return to its default list state.

## 9. Interface Requirements *(optional - only when this feature exposes or consumes an explicit interface contract, e.g. API, event, file format)*

| ID | Interface | Description | Traces to (REQ-xxx) |
| --- | --- | --- | --- |
| INT-002 | Search parser | Frontend search logic parses plain text and `#tag` tokens consistently | REQ-008 |
| INT-003 | Tag persistence tables | Backend/database maintains tag and record-tag association tables | REQ-007 |

## References

- `prompts/PROMT inicial de creacion del CRM.txt`
- `prompts/Segundo promt de cracion inicial CRM.txt`
