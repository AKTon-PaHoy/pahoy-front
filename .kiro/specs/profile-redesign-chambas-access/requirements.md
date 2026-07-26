# Requirements Document

## Introduction

This feature redesigns the profile page into a view-only display with user information prominently shown, a chambas (gigs) summary section, and an account settings section with actions like logout, change password, change email, and account deletion. Edit functionality moves to a new `/profile/edit` route focused exclusively on profile field editing. The "Chambas" item is removed from the bottom navigation bar and replaced with "Mensajes" (Messages), and the `/gigs` route remains accessible via a link from the profile chambas summary section.

## Glossary

- **Profile_View_Page**: The redesigned page at `/profile` that displays user information in a read-only format, a chambas summary section, an account settings section, and navigation to the edit page.
- **Profile_Edit_Page**: A new page at `/profile/edit` containing the form fields for editing profile data (first_name, last_name, phone_number, bio), profile picture upload, and location update. This page does not contain account-level actions.
- **Account_Settings_Section**: A section within the Profile_View_Page that displays a list of tappable items for account-level actions: Change Email, Change Password, Logout, and Account Deletion.
- **Chambas_Summary_Section**: A section within the Profile_View_Page that displays the total count of the user's gigs, a preview of recent gigs, and a "Ver todas" link navigating to `/gigs`.
- **Bottom_Navigation**: The persistent bottom tab bar visible on main app pages providing access to primary sections of the application.
- **Messages_Nav_Item**: The new bottom navigation entry labeled "Mensajes" using the MessageChatCircle icon, replacing the former "Chambas" entry.
- **User_Data_API**: The backend endpoint `GET /api/auth/user/` returning username, email, and location.
- **Profile_Data_API**: The backend endpoint `GET /api/profile/retrieve/` returning first_name, last_name, bio, phone_number, and profile_pic.
- **My_Gigs_API**: The backend endpoint `GET /api/gigs/my-gigs/` returning the authenticated user's gig list.
- **Profile_Update_API**: The backend endpoint `PATCH /api/profile/update/` accepting multipart/form-data for profile field and picture updates.
- **Logout_API**: The backend endpoint `POST /api/auth/logout/` that invalidates the current session.
- **Change_Password_API**: The backend endpoint `POST /api/auth/change-password/` that changes the user's password (existing page at `/profile/change-password`).
- **Change_Email_API**: The backend endpoint `PATCH /api/auth/change-email/` that updates the user's email address.
- **Delete_Account_API**: The backend endpoint `DELETE /api/auth/delete-account/` that permanently deletes the user's account.

## Requirements

### Requirement 1: Profile View Page Layout and Data Display

**User Story:** As an authenticated user, I want to see my profile information displayed prominently in a read-only view, so that I can quickly review my personal details without accidentally editing them.

#### Acceptance Criteria

1. WHEN the user navigates to `/profile`, THE Profile_View_Page SHALL fetch User_Data_API and Profile_Data_API and display the user's profile picture (or a default avatar placeholder), full name (first_name + last_name), username, bio, and location.
2. THE Profile_View_Page SHALL render the profile picture as a large centered circular image at the top of the page.
3. THE Profile_View_Page SHALL display the full name using `text-display-xs font-bold text-primary` styling below the profile picture.
4. THE Profile_View_Page SHALL display the username prefixed with "@" using `text-sm text-tertiary` styling below the full name.
5. THE Profile_View_Page SHALL display the bio text below the username when bio content exists.
6. WHILE the Profile_View_Page is loading data, THE Profile_View_Page SHALL display a centered loading indicator.
7. IF the data fetch fails, THEN THE Profile_View_Page SHALL display an error message "No pudimos cargar tu perfil. Intenta de nuevo mas tarde."
8. THE Profile_View_Page SHALL animate content entry using motion.div with opacity transition from 0 to 1 and y offset from 16 to 0 over 0.35 seconds with ease-out timing.
9. THE Profile_View_Page SHALL use a full-height mobile layout with `min-h-dvh flex flex-col bg-white` and bottom padding of `pb-20` to accommodate the Bottom_Navigation.

### Requirement 2: Edit Profile Navigation

**User Story:** As an authenticated user, I want to navigate to an edit page from my profile view, so that I can update my personal information when needed.

#### Acceptance Criteria

1. THE Profile_View_Page SHALL display an "Editar perfil" button that navigates the user to `/profile/edit`.
2. WHEN the user taps the "Editar perfil" button, THE Profile_View_Page SHALL navigate to the Profile_Edit_Page at `/profile/edit`.
3. THE Profile_View_Page SHALL render the "Editar perfil" button prominently below the user information section using primary button styling.

### Requirement 3: Profile Edit Page

**User Story:** As an authenticated user, I want a dedicated page to edit my profile fields and upload a new profile picture, so that I can keep my information up-to-date.

#### Acceptance Criteria

1. WHEN the user navigates to `/profile/edit`, THE Profile_Edit_Page SHALL fetch Profile_Data_API and User_Data_API and pre-fill the form fields with current values for first_name, last_name, phone_number, and bio.
2. THE Profile_Edit_Page SHALL display the current profile picture at the top with a camera overlay icon allowing the user to select a new image.
3. WHEN the user taps the profile picture area on the Profile_Edit_Page, THE Profile_Edit_Page SHALL open a file selection dialog for choosing an image file.
4. WHEN the user selects an image, THE Profile_Edit_Page SHALL open the image cropper and upon crop completion send a PATCH request to Profile_Update_API as multipart/form-data with the cropped image as the profile_pic field.
5. WHEN the user modifies editable fields and submits the form, THE Profile_Edit_Page SHALL send a PATCH request to Profile_Update_API with the updated field values.
6. THE Profile_Edit_Page SHALL validate that first_name and last_name are not empty before submitting.
7. IF client-side validation fails, THEN THE Profile_Edit_Page SHALL display the corresponding error message on the failing field without making an API call.
8. WHEN the Profile_Update_API returns a successful response, THE Profile_Edit_Page SHALL display a success indication to the user.
9. IF the Profile_Update_API returns field-level validation errors, THEN THE Profile_Edit_Page SHALL map each error to the corresponding form field and display the error message via the field hint.
10. WHILE the profile update request is in progress, THE Profile_Edit_Page SHALL disable the submit button and show a loading state.
11. WHEN the user begins typing in a field that has a displayed error, THE Profile_Edit_Page SHALL clear the error for that specific field.
12. THE Profile_Edit_Page SHALL display a sticky header with a back button that navigates to `/profile`, a centered brand logo, and a right spacer for alignment.
13. THE Profile_Edit_Page SHALL display the LocationSection component allowing the user to view and update their location.
14. THE Profile_Edit_Page SHALL be accessible only to authenticated users who have completed onboarding.

### Requirement 4: Chambas Summary Section on Profile View

**User Story:** As an authenticated user, I want to see a summary of my gigs on my profile page, so that I can quickly access and monitor my services without navigating away.

#### Acceptance Criteria

1. WHEN the Profile_View_Page loads successfully, THE Profile_View_Page SHALL fetch My_Gigs_API and display the Chambas_Summary_Section below the user information area.
2. THE Chambas_Summary_Section SHALL display the total count of the user's gigs as a heading (e.g., "Mis Chambas (3)").
3. WHEN the user has one or more gigs, THE Chambas_Summary_Section SHALL display up to 3 recent gigs as compact card previews showing the gig name, front image, and price.
4. THE Chambas_Summary_Section SHALL display a "Ver todas" link that navigates the user to `/gigs` when the user has gigs.
5. WHEN the user taps a gig preview card in the Chambas_Summary_Section, THE Profile_View_Page SHALL navigate to `/gig/{gig_id}`.
6. WHEN the user has zero gigs, THE Chambas_Summary_Section SHALL display a message "Aun no tienes chambas" with a "Crear chamba" button that navigates to `/gigs/new`.
7. WHILE the gigs data is loading, THE Chambas_Summary_Section SHALL display a compact loading indicator.
8. IF the My_Gigs_API request fails, THEN THE Chambas_Summary_Section SHALL display a brief error message "No pudimos cargar tus chambas" with a "Reintentar" button.

### Requirement 5: Account Settings Section on Profile View

**User Story:** As an authenticated user, I want to access account-level actions like changing my email, changing my password, logging out, and deleting my account directly from my profile view, so that I can manage my account without navigating to the edit page.

#### Acceptance Criteria

1. THE Profile_View_Page SHALL display the Account_Settings_Section below the Chambas_Summary_Section.
2. THE Account_Settings_Section SHALL display a list of tappable items in the following order: "Cambiar correo", "Cambiar contrasena", "Cerrar sesion", "Eliminar cuenta".
3. WHEN the user taps "Cambiar correo", THE Profile_View_Page SHALL navigate to `/profile/change-email`.
4. WHEN the user taps "Cambiar contrasena", THE Profile_View_Page SHALL navigate to `/profile/change-password`.
5. WHEN the user taps "Cerrar sesion", THE Profile_View_Page SHALL display a confirmation dialog asking the user to confirm logout.
6. WHEN the user confirms logout in the confirmation dialog, THE Profile_View_Page SHALL send a POST request to Logout_API, clear the stored authentication token, and navigate to `/`.
7. IF the user cancels the logout confirmation dialog, THEN THE Profile_View_Page SHALL dismiss the dialog and remain on the profile page.
8. WHEN the user taps "Eliminar cuenta", THE Profile_View_Page SHALL display a destructive confirmation dialog warning the user that this action is permanent and cannot be undone.
9. WHEN the user confirms account deletion in the destructive confirmation dialog, THE Profile_View_Page SHALL send a DELETE request to Delete_Account_API, clear the stored authentication token, and navigate to `/`.
10. IF the user cancels the account deletion confirmation dialog, THEN THE Profile_View_Page SHALL dismiss the dialog and remain on the profile page.
11. IF the Delete_Account_API request fails, THEN THE Profile_View_Page SHALL display an error message "No pudimos eliminar tu cuenta. Intenta de nuevo mas tarde."
12. THE Account_Settings_Section SHALL render the "Eliminar cuenta" item with destructive styling (text-error-primary) to indicate the dangerous nature of the action.

### Requirement 6: Bottom Navigation Update

**User Story:** As an authenticated user, I want to access Messages from the bottom navigation, so that I can quickly check conversations with clients or talent.

#### Acceptance Criteria

1. THE Bottom_Navigation SHALL display exactly five items in the following order: "Inicio" (Home02 icon, path `/home`), "Buscar" (SearchLg icon, path `/search`), "Contratos" (ClipboardCheck icon, path `/contracts`), "Mensajes" (MessageChatCircle icon, path `/messages`), "Perfil" (User01 icon, path `/profile`).
2. THE Bottom_Navigation SHALL remove the "Chambas" item (Briefcase02 icon, path `/gigs`) from the navigation items array.
3. THE Messages_Nav_Item SHALL use the MessageChatCircle icon from `@untitledui/icons` and navigate to `/messages` when tapped.
4. WHEN the user is on a route starting with `/messages`, THE Bottom_Navigation SHALL highlight the "Mensajes" item as active using brand-600 color and semibold text.

### Requirement 7: Route Configuration Updates

**User Story:** As a developer, I want the application routing to support the new profile edit page, change email page, and updated navigation paths, so that users can access all features via their expected URLs.

#### Acceptance Criteria

1. THE application router SHALL register the `/profile/edit` route rendering the Profile_Edit_Page wrapped with RequireAuth and RequireOnboarding guards.
2. THE application router SHALL register the `/profile/change-email` route rendering a Change Email page wrapped with RequireAuth and RequireOnboarding guards.
3. THE application router SHALL include `/messages` in the NAV_ROUTES array so the Bottom_Navigation displays on the messages route.
4. THE application router SHALL keep the `/gigs` route registered and accessible but remove `/gigs` from affecting bottom navigation visibility only when accessed directly (it remains in NAV_ROUTES for backward compatibility).
5. THE application router SHALL include `/profile/edit` and `/profile/change-email` as routes that do not display the Bottom_Navigation.

### Requirement 8: Chambas Route Accessibility

**User Story:** As an authenticated user, I want to still access my full chambas list via the "Ver todas" link or direct URL, so that I can manage all my gigs when needed.

#### Acceptance Criteria

1. WHEN the user navigates to `/gigs` directly or via the "Ver todas" link, THE application SHALL render the existing ChambasScreen page with full gig list, tab filtering, and status management.
2. THE ChambasScreen at `/gigs` SHALL continue to display the Bottom_Navigation with no tab highlighted as active for the "Chambas" item (since it no longer exists in the nav).
3. THE ChambasScreen SHALL remain wrapped with RequireAuth and RequireOnboarding route guards.
