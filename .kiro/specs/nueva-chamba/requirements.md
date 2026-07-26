# Requirements Document

## Introduction

The "Nueva Chamba" (Create New Gig) feature provides a form-based flow at the `/gigs/new` route where authenticated talents can create a new gig (service offering). The form collects a title, description, up to three images, a price with pricing model, active status, and optional tags. Upon successful submission, the system sends the data as multipart/form-data to the backend API and navigates back to the gigs listing. The view follows the standard mobile-first form patterns established in the application.

## Glossary

- **Nueva_Chamba_View**: The page component rendered at the `/gigs/new` route that displays the gig creation form
- **Gig_Form**: The form element within Nueva_Chamba_View containing all input fields for creating a gig
- **Image_Upload_Section**: The area of the form where the user can upload up to three images using the ImageCropper component with square crop
- **Create_Gig_API**: The backend endpoint `POST /api/gigs/create/` that accepts multipart/form-data to create a new gig
- **Price_Type_Selector**: A form control allowing the user to choose between "Fijo" (fixed price) and "Horas" (hourly rate)
- **Form_Error_State**: The UI state where one or more fields display validation error messages

## Requirements

### Requirement 1: Page Layout and Route Registration

**User Story:** As a talent, I want to access a dedicated gig creation page from the Chambas view, so that I can publish a new service offering.

#### Acceptance Criteria

1. WHEN the user navigates to `/gigs/new`, THE Nueva_Chamba_View SHALL render with a full-height mobile layout using `min-h-dvh flex flex-col bg-white`.
2. THE Nueva_Chamba_View SHALL display a header with a back button on the left, the brand logo centered, and a right spacer to balance the layout.
3. WHEN the user taps the back button in the header, THE Nueva_Chamba_View SHALL navigate back to the previous page in the browser history.
4. WHEN the Nueva_Chamba_View mounts, THE Nueva_Chamba_View SHALL animate the content area using motion.div with opacity transition from 0 to 1 and vertical translation from 16px to 0 over 0.35 seconds with ease-out easing.
5. THE Nueva_Chamba_View SHALL display the route protected by the existing RequireAuth and RequireOnboarding guards.

### Requirement 2: Form Fields

**User Story:** As a talent, I want to fill out the details of my new gig in a clear form, so that I can accurately describe the service I offer.

#### Acceptance Criteria

1. THE Gig_Form SHALL display a text input field for "Nombre de la chamba" (gig name) with a maximum length of 255 characters, marked as required.
2. THE Gig_Form SHALL display a textarea field for "Descripción" (gig description), marked as required.
3. THE Gig_Form SHALL display the Image_Upload_Section allowing the user to select up to three images (front image, second image, third image), each optional.
4. THE Gig_Form SHALL display a numeric input field for "Precio" (price), marked as required, accepting only values greater than zero.
5. THE Gig_Form SHALL display a Price_Type_Selector with two options: "Fijo" (fixed, default selected) and "Horas" (hourly).
6. THE Gig_Form SHALL display a toggle for "Activa" (is_active) defaulting to true, indicating whether the gig is published immediately.
7. THE Gig_Form SHALL display an optional text input field for "Tags" (tags).
8. THE Gig_Form SHALL use a vertical layout with consistent spacing (`gap-5`) between fields following the established form patterns.

### Requirement 3: Image Upload

**User Story:** As a talent, I want to upload and crop images for my gig, so that my service listing looks professional and visually appealing.

#### Acceptance Criteria

1. WHEN the user taps an image upload slot, THE Image_Upload_Section SHALL open the existing ImageCropper component configured for square crop (1:1 aspect ratio).
2. WHEN the user completes cropping an image, THE Image_Upload_Section SHALL display a thumbnail preview of the cropped image in the corresponding slot.
3. THE Image_Upload_Section SHALL validate that each uploaded image has dimensions between 400x400 and 2000x2000 pixels.
4. IF the user selects an image with dimensions outside the valid range, THEN THE Image_Upload_Section SHALL display an error message indicating the dimension requirements.
5. WHEN the user taps a filled image slot, THE Image_Upload_Section SHALL provide an option to remove or replace the current image.

### Requirement 4: Client-Side Validation

**User Story:** As a talent, I want to see clear error messages when I miss required fields, so that I can correct my input before submitting.

#### Acceptance Criteria

1. WHEN the user submits the Gig_Form, THE Nueva_Chamba_View SHALL validate all required fields (name, description, price) before sending the request to the Create_Gig_API.
2. IF the "name" field is empty on submit, THEN THE Gig_Form SHALL display the error message "El nombre es requerido" below the name field.
3. IF the "description" field is empty on submit, THEN THE Gig_Form SHALL display the error message "La descripción es requerida" below the description field.
4. IF the "price" field is empty or contains a value less than or equal to zero on submit, THEN THE Gig_Form SHALL display the error message "El precio debe ser mayor a 0" below the price field.
5. WHEN the user starts typing in a field that has an active error, THE Gig_Form SHALL clear the error message for that specific field.
6. THE Gig_Form SHALL not perform validation on blur; validation SHALL only execute on form submission.

### Requirement 5: Form Submission

**User Story:** As a talent, I want to submit my gig details and see a loading indicator, so that I know the system is processing my request.

#### Acceptance Criteria

1. WHEN the user submits a valid Gig_Form, THE Nueva_Chamba_View SHALL send a POST request to the Create_Gig_API endpoint `/api/gigs/create/` with the form data encoded as multipart/form-data.
2. THE Nueva_Chamba_View SHALL include the authentication token from local storage in the request headers.
3. WHILE the Create_Gig_API request is in progress, THE submit button SHALL display a loading state with the text "Creando chamba..." and a spinner indicator.
4. WHILE the Create_Gig_API request is in progress, THE submit button SHALL be disabled to prevent duplicate submissions.
5. WHEN the Create_Gig_API returns a successful response, THE Nueva_Chamba_View SHALL navigate the user to the `/gigs` route.
6. THE submit button SHALL restore its default state after the request completes regardless of success or failure.

### Requirement 6: Backend Error Handling

**User Story:** As a talent, I want to see specific error messages from the server mapped to the relevant fields, so that I can fix issues the backend detected.

#### Acceptance Criteria

1. IF the Create_Gig_API returns field-level errors, THEN THE Gig_Form SHALL map each backend error to its corresponding form field and display the first error message for that field.
2. IF the Create_Gig_API returns a non-field error (non_field_errors or general error), THEN THE Gig_Form SHALL display the error message in a visible location within the form.
3. IF the Create_Gig_API returns a 401 Unauthorized response, THEN THE Nueva_Chamba_View SHALL rely on the existing api() utility behavior to clear the token and redirect to the `/` route.

### Requirement 7: Authentication and Onboarding Guard

**User Story:** As an unauthenticated user, I want to be redirected away from the gig creation page, so that the app protects the creation flow for authenticated talent only.

#### Acceptance Criteria

1. WHEN a user without a valid authentication token navigates to `/gigs/new`, THE Nueva_Chamba_View SHALL redirect the user to the `/` route.
2. WHEN a user who has not completed onboarding navigates to `/gigs/new`, THE Nueva_Chamba_View SHALL redirect the user to `/complete-profile`.

### Requirement 8: Form Data Mapping

**User Story:** As a developer, I want the form fields to map correctly to the API contract, so that the backend receives properly structured data.

#### Acceptance Criteria

1. THE Gig_Form SHALL map the "name" field to the `name` parameter in the multipart request body.
2. THE Gig_Form SHALL map the "description" field to the `description` parameter in the multipart request body.
3. THE Gig_Form SHALL map the front image to the `gig_front_img` parameter, the second image to the `gig_secong_img` parameter, and the third image to the `gig_third_img` parameter in the multipart request body.
4. THE Gig_Form SHALL map the "price" field to the `price` parameter as a decimal value in the multipart request body.
5. THE Gig_Form SHALL map the selected pricing model to the `price_type` parameter with the value "Fijo" or "Horas" in the multipart request body.
6. THE Gig_Form SHALL map the active toggle state to the `is_active` parameter as a boolean value in the multipart request body.
7. WHERE the user provides tags, THE Gig_Form SHALL map the tags field to the `tags` parameter in the multipart request body.
8. THE Gig_Form SHALL use the `apiMultipart()` utility from `@/utils/api` to construct and send the FormData request.
