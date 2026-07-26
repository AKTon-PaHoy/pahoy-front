# Requirements Document

## Introduction

The Contracts feature enables the full lifecycle of service agreements on Pa·Hoy: a talent proposes a contract from a chat conversation, the client reviews and accepts it, and both parties can track active and past contracts in a dedicated view. This feature connects the existing chat system with a new contract management flow, covering proposal creation, acceptance confirmation, listing, and detail views.

## Glossary

- **Talent**: The gig owner who offers a service on the platform and can propose contracts to clients.
- **Client**: The authenticated user who initiated the chat room and can accept contract proposals.
- **Contract**: A service agreement between a Talent and a Client, containing price, price type, status, and references to a Gig.
- **Gig**: A service listing created by a Talent, containing name, description, price, and price type.
- **Contract_Proposal_Modal**: A modal dialog that appears when the Talent initiates a contract proposal, allowing price adjustment before sending.
- **Contract_Card**: A UI component rendered within the chat conversation that displays contract details and actions to the Client.
- **Contract_Confirmation_Page**: A dedicated page where the Client reviews contract details and accepts the proposal.
- **Contracts_List_Page**: A page displaying all contracts involving the authenticated user, with tab-based filtering.
- **Contract_Detail_Page**: A page showing the full details of a specific contract.
- **Chat_Input**: The input area at the bottom of a chat conversation, which includes the "Enviar Contrato" action for Talents.
- **Bottom_Navigation**: The persistent navigation bar at the bottom of the app with links to main sections.
- **API_Client**: The `api()` utility from `@/utils/api` used for all backend HTTP calls with token authentication.

## Requirements

### Requirement 1: Contract Proposal from Chat

**User Story:** As a Talent, I want to send a contract proposal to a Client from within our chat conversation, so that I can formalize a service agreement.

#### Acceptance Criteria

1. WHEN the Talent taps the "Enviar Contrato" button in the Chat_Input, THE Contract_Proposal_Modal SHALL open displaying the current Gig name, price, and price_type as default values; IF the Gig price is null, THEN the price field SHALL default to empty and require the Talent to enter a value before confirming.
2. WHILE the Contract_Proposal_Modal is open, THE Contract_Proposal_Modal SHALL allow the Talent to modify the price (numeric decimal, minimum 0.01, maximum 999,999,999.99) and select a price_type ("Fijo" or "Horas") before sending.
3. WHEN the Talent confirms the proposal in the Contract_Proposal_Modal, THE API_Client SHALL send a `POST /api/contracts/create/` request with the Gig UUID and the entered price and price_type values.
4. WHEN the contract creation API responds with status 201, THE API_Client SHALL send a `POST /api/chat/rooms/{room_id}/messages/` request with the `room` UUID, the returned contract UUID in the `contract` field, and a system-generated `content` string indicating a contract proposal was sent.
5. WHEN the contract message is sent successfully (status 201), THE Contract_Proposal_Modal SHALL close and the chat conversation SHALL append the new contract message to the message list and scroll it into view.
6. IF the contract creation API returns a validation error (status 400), THEN THE Contract_Proposal_Modal SHALL map field-level error messages from the response to their corresponding form fields and remain open.
7. WHILE the contract creation or message sending request is in progress, THE Contract_Proposal_Modal SHALL display a loading state on the confirm button, disable the confirm button, and disable the price and price_type inputs to prevent duplicate submissions.
8. IF the contract creation API succeeds but the chat message API returns an error, THEN THE Contract_Proposal_Modal SHALL close and the chat conversation SHALL display the contract message on the next message sync cycle.
9. IF the Talent attempts to confirm the proposal with an empty or non-numeric price value, THEN THE Contract_Proposal_Modal SHALL display a validation error on the price field indicating a valid price is required, without making any API request.

### Requirement 2: Contract Card Display in Chat

**User Story:** As a Client, I want to see a contract proposal card in the chat conversation, so that I can review the proposed terms and navigate to accept the contract.

#### Acceptance Criteria

1. WHEN a chat message has a non-null `contract` field, THE Contract_Card SHALL fetch the contract details from `GET /api/contracts/retrieve/{contract_id}/` and display the contract price formatted as currency (e.g., "$1,500.00"), price type ("Fijo" or "Horas"), and current status.
2. IF the contract's price field is null, THEN THE Contract_Card SHALL display a placeholder text "Precio no definido" in place of the price value.
3. WHEN the Client views a Contract_Card with status "Propuesta", THE Contract_Card SHALL render an enabled "Ver Contrato" button.
4. WHEN the Client views a Contract_Card with a status other than "Propuesta" (i.e., "Activo", "Confirmado", "Concluido", "Cancelado", or "Disputa"), THE Contract_Card SHALL render the "Ver Contrato" button in a disabled state.
5. WHEN the Client taps the "Ver Contrato" button on a Contract_Card with status "Propuesta", THE Contract_Card SHALL navigate to the Contract_Confirmation_Page at `/contracts/:contractId/confirm` for that contract.
6. WHILE the contract details are loading from the API, THE Contract_Card SHALL display a loading skeleton placeholder matching the card's dimensions.
7. IF the contract details API returns an error, THEN THE Contract_Card SHALL display an error indication within the card area and provide a "Reintentar" button that re-fetches the contract details when tapped.
8. WHEN the authenticated user's UUID matches the message sender UUID, THE chat conversation SHALL display a "Contrato enviado" label instead of the full Contract_Card.
9. WHEN the authenticated user's UUID does not match the message sender UUID and the message has a non-null `contract` field, THE chat conversation SHALL render the full Contract_Card component.

### Requirement 3: Contract Confirmation Flow

**User Story:** As a Client, I want to review a contract proposal on a dedicated page and accept it, so that I can formalize the agreement with the Talent.

#### Acceptance Criteria

1. WHEN the Client navigates to the Contract_Confirmation_Page, THE API_Client SHALL fetch the contract from `GET /api/contracts/retrieve/{contract_id}/` and then fetch the associated gig details from `GET /api/gigs/retrieve/{gig_id}/` using the contract's gig UUID.
2. WHEN both the contract and gig data have loaded successfully, THE Contract_Confirmation_Page SHALL display: the gig front image, gig name, talent name with verification badge, talent rating, distance to the Client, the contract price formatted as currency, the price type ("Fijo" displayed as total or "Horas" displayed as per-hour rate), and the current contract status.
3. WHILE the contract or gig details are loading, THE Contract_Confirmation_Page SHALL display a loading indicator in place of the content area.
4. IF the contract retrieval API returns a 404 error, THEN THE Contract_Confirmation_Page SHALL display an error message indicating the contract was not found and provide a back navigation option.
5. WHEN the contract status is "Propuesta", THE Contract_Confirmation_Page SHALL render an enabled primary CTA button labeled "Sí, contratar a {talent_first_name}" with a checkmark icon, pinned to the bottom of the viewport.
6. WHEN the Client taps the CTA button on the Contract_Confirmation_Page, THE API_Client SHALL send a `PATCH /api/contracts/accept/{contract_id}/` request with TokenAuth credentials.
7. WHEN the accept API responds with status 200, THE Contract_Confirmation_Page SHALL navigate the Client to the Contract_Detail_Page for that contract, which will display the updated status "Activo".
8. IF the accept API returns an error (400 or 401), THEN THE Contract_Confirmation_Page SHALL display the error message from the `detail` field or the first field error below the CTA button using `text-error-primary` styling, without navigating away.
9. WHILE the accept request is in progress, THE Contract_Confirmation_Page SHALL display a loading state on the CTA button (spinner with text "Confirmando...") and disable the button to prevent duplicate submissions.

### Requirement 4: Contracts List View

**User Story:** As a user, I want to see all my contracts in a dedicated list view with status filters, so that I can track active and past service agreements.

#### Acceptance Criteria

1. WHEN the user navigates to the Contracts_List_Page, THE API_Client SHALL fetch contracts from `GET /api/contracts/list/` with the status values corresponding to the "En Curso" tab selected by default, making one request per status value ("Activo" and "Confirmado") and merging the results sorted by `updated_at` descending.
2. THE Contracts_List_Page SHALL display two tab filters: "En Curso" for contracts with status "Activo" or "Confirmado", and "Historial" for contracts with status "Concluido" or "Cancelado". The "En Curso" tab SHALL be selected by default on page load.
3. WHEN the user selects a tab filter, THE API_Client SHALL request contracts from `GET /api/contracts/list/` making one request per status value covered by that tab (two requests per tab), merge the results sorted by `updated_at` descending, and THE Contracts_List_Page SHALL display only the merged matching contracts.
4. THE Contracts_List_Page SHALL render each contract item as a card displaying: the gig front image as a thumbnail, the gig name as the title, the counterparty name (the other party in the contract) with a verified badge, the contract `updated_at` formatted as a relative date-time label (e.g., "Hoy, 2:30 pm", "Mañana, 8:30 am"), a status icon (clock icon for "En Curso" items, checkmark icon for "Historial" items), and the contract price formatted as currency.
5. WHEN the user taps a contract item in the list, THE Contracts_List_Page SHALL navigate to the Contract_Detail_Page for that contract.
6. WHILE contracts are loading, THE Contracts_List_Page SHALL display a loading skeleton placeholder in the list area.
7. IF the API returns an error for any status request, THEN THE Contracts_List_Page SHALL display an error message indicating the failure with a retry option.
8. WHEN the API returns zero contracts for all status values in the active tab, THE Contracts_List_Page SHALL display an empty state with an illustration and a message indicating no contracts exist for that filter.
9. WHEN the total contract count for any status in the active tab exceeds 20 results, THE Contracts_List_Page SHALL support infinite scroll pagination, loading the next page of results when the user scrolls within 200px of the list bottom.

### Requirement 5: Contract Detail View

**User Story:** As a user, I want to see the full details of a contract, so that I can review the terms and current status of a service agreement.

#### Acceptance Criteria

1. WHEN the user navigates to the Contract_Detail_Page, THE API_Client SHALL fetch the contract from `GET /api/contracts/retrieve/{contract_id}/` within 10 seconds, using the `contract_id` from the route parameter `/contracts/:contractId`.
2. THE Contract_Detail_Page SHALL display the page title "Detalle de contratación" in the header, a status badge showing the current contract status value, the contract price formatted as currency, the price type ("Fijo" or "Horas"), a creation date formatted in locale-appropriate human-readable format (e.g., "miércoles 23 de julio"), and the last updated date in the same format.
3. THE Contract_Detail_Page SHALL display a timeline progress indicator showing the contract lifecycle steps, with completed steps visually distinguished from pending steps based on the current contract status.
4. THE Contract_Detail_Page SHALL display the associated gig information including the gig name and talent name, fetched via the gig UUID reference in the contract response.
5. WHILE the contract details are loading, THE Contract_Detail_Page SHALL display a loading indicator centered in the content area, preventing interaction with action buttons until data is available.
6. IF the contract retrieval API returns a 404 or 401 error, THEN THE Contract_Detail_Page SHALL display an error message indicating the contract could not be loaded and SHALL render a back navigation button allowing the user to return to the previous page.
7. THE Contract_Detail_Page SHALL provide a back navigation button in the header (left-aligned, using the ChevronLeft icon) that navigates the user to the previous page via browser history.
8. IF the contract status is "Activo" or "Confirmado", THEN THE Contract_Detail_Page SHALL display a "Cancelar contratación" button at the bottom of the page that allows the user to initiate cancellation.

### Requirement 6: Routing and Navigation Integration

**User Story:** As a user, I want to navigate to the contracts section from the bottom navigation, so that I can access my contracts from anywhere in the app.

#### Acceptance Criteria

1. THE Bottom_Navigation SHALL render a "Contratos" item with the `ClipboardCheck` icon that navigates to the `/contracts` route and displays an active state (brand color and bold label) when the current path starts with `/contracts`.
2. WHEN the user navigates to `/contracts`, THE application SHALL render the Contracts_List_Page within authenticated and onboarded route guards, with the Bottom_Navigation visible.
3. WHEN the user navigates to `/contracts/:contractId`, THE application SHALL render the Contract_Detail_Page within authenticated and onboarded route guards.
4. WHEN the user navigates to `/contracts/:contractId/confirm`, THE application SHALL render the Contract_Confirmation_Page within authenticated and onboarded route guards.
5. THE application SHALL hide the Bottom_Navigation on the Contract_Confirmation_Page and Contract_Detail_Page routes by including their path patterns in the NO_NAV_ROUTES configuration.
6. IF the user is not authenticated when navigating to any `/contracts` route, THEN THE application SHALL redirect the user to the `/` (splash) route.
7. IF the user is authenticated but has not completed onboarding when navigating to any `/contracts` route, THEN THE application SHALL redirect the user to the `/complete-profile` route.
