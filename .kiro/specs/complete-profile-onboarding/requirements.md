# Requirements: Complete Profile Onboarding

## Requirement 1

**User Story:** As a newly registered user, I want to be redirected to a profile completion form after logging in, so that I can provide the necessary information to use the platform.

### Acceptance Criteria

1. WHEN an authenticated user has `onboarding_complete === false` on their profile THEN the system SHALL redirect them to the `/complete-profile` route instead of `/home`
2. WHEN a user with `onboarding_complete === true` navigates to `/complete-profile` THEN the system SHALL redirect them to `/home`
3. WHEN a non-authenticated user navigates to `/complete-profile` THEN the system SHALL redirect them to the splash page `/`

## Requirement 2

**User Story:** As a user completing my profile, I want to upload and crop a profile picture to a 400x400 square, so that my profile picture meets platform requirements.

### Acceptance Criteria

1. WHEN a user taps the profile picture area THEN the system SHALL open a file picker restricted to image types (JPEG, PNG, WebP)
2. WHEN a user selects an image THEN the system SHALL display an image cropper modal that constrains selection to a 1:1 square aspect ratio
3. WHEN the user confirms the crop THEN the system SHALL produce a 400x400 pixel image blob for upload
4. WHEN the user cancels the crop THEN the system SHALL discard the selected image and return to the form without changes

## Requirement 3

**User Story:** As a user completing my profile, I want to enter my personal information (name, birth date, document ID, phone), so that the platform can verify my identity.

### Acceptance Criteria

1. WHEN the form is displayed THEN the system SHALL show required fields for first name, last name, birth date, and document ID
2. WHEN the user selects a document type THEN the system SHALL display a composite input with a type selector (CC, TI, CE, PP) and a numeric input for the document number
3. WHEN the user submits the form with any required field empty THEN the system SHALL display inline validation errors for those fields
4. WHEN birth_date is submitted THEN the system SHALL format it as `YYYY-MM-DD` for the API

## Requirement 4

**User Story:** As a user completing my profile, I want to detect my location automatically, so that the platform can connect me with nearby talent and services.

### Acceptance Criteria

1. WHEN the user taps the "Detectar ubicación" button THEN the system SHALL request browser geolocation permission
2. WHEN geolocation succeeds THEN the system SHALL send latitude and longitude to `PATCH /api/auth/update-location/` and display a success indicator
3. WHEN geolocation fails or is denied THEN the system SHALL display an error message and allow the user to continue without location

## Requirement 5

**User Story:** As a user completing my profile, I want to submit the completed form and be redirected to the home screen, so that I can start using the platform.

### Acceptance Criteria

1. WHEN the user submits a valid form THEN the system SHALL send a `PATCH /api/profile/update/` request with `multipart/form-data` including `onboarding_complete: true`
2. WHEN the API returns success THEN the system SHALL display a success animation screen and auto-redirect to `/home` after 2 seconds
3. WHEN the API returns validation errors THEN the system SHALL map field errors to the corresponding form fields
4. WHEN the form is submitting THEN the system SHALL disable the submit button and show a loading state
