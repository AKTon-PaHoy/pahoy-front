# Requirements Document

## Introduction

The Profile View feature provides authenticated users with a dedicated area to view and manage their account information. It consists of a main profile page displaying user and profile data, the ability to update editable fields and the profile picture, a sub-page for changing the password, and a logout mechanism with confirmation.

## Glossary

- **Profile_Page**: The main view rendered at `/profile` displaying user account and profile information with edit capabilities.
- **Change_Password_Page**: A sub-page rendered at `/profile/change-password` allowing the user to update their password.
- **User_Data**: Read-only account data retrieved from `GET /api/auth/user/` including username and email.
- **Profile_Data**: Editable profile data retrieved from `GET /api/profile/retrieve/` including first_name, last_name, bio, phone_number, and profile_pic.
- **Profile_API**: The backend endpoint `PATCH /api/profile/update/` accepting multipart/form-data for profile updates.
- **Password_API**: The backend endpoint `POST /api/auth/change-password/` accepting current_password, new_password, and new_password_confirm.
- **Logout_API**: The backend endpoint `POST /api/auth/logout/` that invalidates the current session token.
- **Bottom_Navigation**: The persistent bottom tab bar visible on main app pages including the profile page.
- **Confirmation_Dialog**: A modal dialog requiring explicit user confirmation before performing a destructive action.

## Requirements

### Requirement 1: Profile Page Data Display

**User Story:** As an authenticated user, I want to see my account and profile information on a dedicated page, so that I can review my current data at a glance.

#### Acceptance Criteria

1. WHEN the user navigates to `/profile`, THE Profile_Page SHALL fetch User_Data from `GET /api/auth/user/` and Profile_Data from `GET /api/profile/retrieve/` and display the results.
2. THE Profile_Page SHALL display the username and email fields as read-only text (not editable inputs).
3. THE Profile_Page SHALL display the profile picture retrieved from Profile_Data, or a default avatar placeholder when no profile_pic exists.
4. THE Profile_Page SHALL display editable fields for first_name, last_name, bio, and phone_number pre-filled with the current Profile_Data values.
5. WHILE the Profile_Page is loading data, THE Profile_Page SHALL display a loading indicator to the user.
6. IF the data fetch fails, THEN THE Profile_Page SHALL display an error message informing the user that the data could not be loaded.

### Requirement 2: Profile Information Update

**User Story:** As an authenticated user, I want to update my personal profile information, so that I can keep my details accurate and up-to-date.

#### Acceptance Criteria

1. WHEN the user modifies an editable field and submits the form, THE Profile_Page SHALL send a PATCH request to Profile_API with the updated field values.
2. THE Profile_Page SHALL validate that first_name and last_name are not empty before submitting.
3. WHEN the Profile_API returns a successful response, THE Profile_Page SHALL display a success indication to the user.
4. IF the Profile_API returns field-level validation errors, THEN THE Profile_Page SHALL map each error to the corresponding form field and display the error message via the field hint.
5. WHILE the profile update request is in progress, THE Profile_Page SHALL disable the submit button and show a loading state.
6. WHEN the user begins typing in a field that has a displayed error, THE Profile_Page SHALL clear the error for that specific field.

### Requirement 3: Profile Picture Update

**User Story:** As an authenticated user, I want to update my profile picture, so that other users and clients can identify me visually.

#### Acceptance Criteria

1. WHEN the user taps the profile picture area, THE Profile_Page SHALL open a file selection dialog allowing the user to choose an image file.
2. WHEN the user selects an image file, THE Profile_Page SHALL send a PATCH request to Profile_API as multipart/form-data including the selected image as the profile_pic field.
3. WHEN the Profile_API returns a successful response with the new profile_pic URL, THE Profile_Page SHALL update the displayed profile picture immediately.
4. IF the image upload fails, THEN THE Profile_Page SHALL display an error message informing the user that the upload could not be completed.
5. WHILE the image upload is in progress, THE Profile_Page SHALL display a loading indicator over the profile picture area.

### Requirement 4: Change Password Sub-Page

**User Story:** As an authenticated user, I want to change my password from a dedicated page, so that I can maintain the security of my account.

#### Acceptance Criteria

1. WHEN the user taps the "Cambiar contraseña" button on the Profile_Page, THE Profile_Page SHALL navigate to `/profile/change-password`.
2. THE Change_Password_Page SHALL display three input fields: current_password, new_password, and new_password_confirm.
3. WHEN the user submits the change password form, THE Change_Password_Page SHALL validate that all three fields are non-empty and that new_password has at least 8 characters.
4. WHEN the user submits the change password form, THE Change_Password_Page SHALL validate that new_password and new_password_confirm match.
5. IF client-side validation fails, THEN THE Change_Password_Page SHALL display the corresponding error message on the failing field without making an API call.
6. WHEN validation passes, THE Change_Password_Page SHALL send a POST request to Password_API with current_password, new_password, and new_password_confirm.
7. WHEN the Password_API returns a successful response, THE Change_Password_Page SHALL display a success message and navigate back to the Profile_Page.
8. IF the Password_API returns field-level errors, THEN THE Change_Password_Page SHALL map each error to the corresponding form field and display the error message.
9. WHILE the password change request is in progress, THE Change_Password_Page SHALL disable the submit button and show a loading state.
10. WHEN the user begins typing in a field that has a displayed error, THE Change_Password_Page SHALL clear the error for that specific field.

### Requirement 5: Logout

**User Story:** As an authenticated user, I want to log out of my account, so that I can end my session securely.

#### Acceptance Criteria

1. THE Profile_Page SHALL display a "Cerrar sesión" button.
2. WHEN the user taps the "Cerrar sesión" button, THE Profile_Page SHALL display a Confirmation_Dialog asking the user to confirm the logout action.
3. WHEN the user confirms the logout in the Confirmation_Dialog, THE Profile_Page SHALL send a POST request to Logout_API.
4. WHEN the Logout_API call completes (success or failure), THE Profile_Page SHALL clear the stored authentication token from local storage.
5. WHEN the token is cleared after logout, THE Profile_Page SHALL navigate the user to the root route `/`.
6. WHEN the user dismisses the Confirmation_Dialog without confirming, THE Profile_Page SHALL close the dialog and take no further action.

### Requirement 6: Navigation and Layout

**User Story:** As an authenticated user, I want the profile page to follow consistent navigation patterns, so that I can move between sections seamlessly.

#### Acceptance Criteria

1. THE Profile_Page SHALL display the Bottom_Navigation component with the profile tab in an active/selected state.
2. THE Profile_Page SHALL animate content entry using a motion fade-in (opacity 0 to 1, y offset 16 to 0, duration 0.35 seconds, ease-out timing).
3. THE Change_Password_Page SHALL display a back button in the header that navigates the user back to the Profile_Page.
4. THE Change_Password_Page SHALL follow the standard page layout pattern with sticky header, centered brand logo, and motion content animation.
5. THE Profile_Page SHALL be accessible only to authenticated users (wrapped with authentication route guard).
6. THE Change_Password_Page SHALL be accessible only to authenticated users (wrapped with authentication route guard).
