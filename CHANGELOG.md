# Changelog

All notable changes to this project will be documented in this file.

## [1.3.5] - 2026-01-19
### Added
- **Templates Manager:** New view to manage HTML templates
  - List all templates in the `templates/` directory
  - **View in Browser:** Instantly open any template in your default browser to preview the design
  - **Rename Templates:** Rename template folders directly within the app
  - **Delete Templates:** Permanent deletion with safety confirmation
- **List Deletion:** Added ability to delete CSV lists from the Lists Manager with confirmation
- **Provider Validation:** Campaigns now validate provider connectivity **before** starting to prevent "fake success" on bad credentials

### Improved
- **SMTP Reliability:** Added explicit `transporter.verify()` and timeout handling (Connection/Greeting/Socket) to detect invalid credentials early
- **Scrollable Logs:** The Logs Manager now supports vertical scrolling with ↑/↓ keys for long log history
- **UI/UX:** Added next-step menus after provider configuration for immediate testing; improved menu layout on Home screen


## [1.3.4] - 2026-01-19
### Added
- **Custom SMTP Support:** Support for multiple custom SMTP providers
  - Management of multiple SMTP configurations (Host, Port, TLS, Credentials)
  - Manual send via custom SMTP
  - Campaign support: select any configured SMTP server for mass campaigns
  - Integrated `nodemailer` for robust SMTP delivery
- **Create New List:** New feature to create CSV lists directly in the app
  - Paste multi-line text (email lists) to create new lists
  - Automatic CSV header detection and addition (`email,name`)
  - Automatic blank line filtering
- **Shortcut Hints:** Added `(Q)` hints to all "Back to Home/Menu" buttons and updated ESC help text to include `Q` shortcut

### Improved
- **Logging Display:** Enhanced log visibility for large messages and detailed data
  - Automated truncation of long log messages
  - Structured formatting for detailed log objects
  - Improved readability for high-volume logs

## [1.3.3] - 2026-01-19
### Fixed
- **HTML Email Support:** All providers (SES, Mailgun, Mailchimp) now send HTML emails instead of plain text
  - Templates are properly rendered in recipient email clients
  - Changed from `text` to `html` parameter in all email controllers
- **Campaign Worker:** Fixed ES module `__dirname` issue that caused campaigns to crash
  - Added `fileURLToPath` and `dirname` imports for ES module compatibility
  - Campaigns now start and run properly
- **CSV Editor:** Automatically removes blank lines when saving files
  - Prevents CSV parsing errors in campaigns
  - Ensures clean, valid CSV files
- **CSV Parsing:** Enhanced error handling with detailed messages
  - Strict column count validation
  - Clear error messages showing exact issue and expected format
  - Empty file detection
  - Missing email validation
- **Logging System:** Added comprehensive logging to campaign worker
  - All campaign events logged (start, completion, failures)
  - Each email send tracked (success/failure)
  - CSV parsing errors logged with context
  - Viewable in Logs Manager with filtering
- **From Addresses:** Added data migration for old email format
  - Old string arrays automatically converted to name+email objects
  - Default names derived from email addresses
  - Fixed "undefined" display and crashes
- **From Addresses UI:** Fixed navigation in edit mode
  - Added three-step flow: Name → Email → Actions
  - Save/Delete/Cancel menu properly accessible
  - Better focus management

## [1.3.2] - 2026-01-19
### Added
- **Logs Manager:** Comprehensive activity logging and monitoring system
  - View all application logs in one place
  - Filter by category: System, Settings, Campaigns, Emails, Errors
  - Auto-refresh mode for real-time monitoring
  - Statistics dashboard showing log counts by category
  - Clear logs functionality
  - Logs stored in `.logs/app.log` with automatic trimming (last 1000 entries)
- **Lists Manager:** New built-in CSV editor for managing recipient lists
  - View all CSV files in the `/lists` directory
  - Built-in line-by-line editor with navigation (no external editor needed)
  - File preview with metadata (size, line count, last modified)
  - Live editing with save/cancel functionality
- **Keyboard Shortcuts:** Added number keys (1-8) to main menu for quick navigation
- **Repository Links:** Updated GitHub links in Info page to point to `a2-stuff/TUImailout`

### Changed
- **Major UI Refactor:** Applied split-pane layout pattern across entire application
  - Manual Sending: Left pane for provider selection, right pane for send form
  - Campaign Monitor: Left pane for campaign list, right pane for campaign details with live updates
  - Campaign Setup: Left pane for step progress tracker, right pane for current step form
  - Info: Left pane for section navigation (About, Credits, License), right pane for content
- **Component Architecture:** Refactored SendSES, SendMailgun, and SendMailchimp to be embeddable with focus management
- **Version Management:** Centralized version in `src/utils/version.ts` for consistent display across app
  - Boot animation now displays current version dynamically
  - Header and Info page use centralized version constant
- **Code Cleanup:** Removed individual send view routes in favor of split-pane ManualMenu

## [1.3.1] - 2026-01-19
### Changed
- **Modular Views:** Redesigned Settings menu to use a split-pane layout (sidebar + content).
- **Versioning:** Adopted patch-first versioning convention.

## [1.3.0] - 2026-01-19
### Added
- **From Address Management:** New settings view to save and manage frequently used "From" email addresses.
- **Easy Selection:** Campaign and manual sending wizards now allow selecting from saved email addresses or typing a new one manually.

### Changed
- **Branding:** Updated application name to "TUImailout".
- **Attribution:** Updated creator handle to "@not_jarod".

## [1.2.0] - 2026-01-19
### Changed
- **Settings Redesign:** Provider settings are now grouped in their own dedicated sub-menus.
- **Theme Updates:** Removed gradient dependency, added new semantic colors, and added new themes.
- **Templates:** Updated default marketing template.

## [1.1.0] - 2026-01-19
### Added
- **Campaign System:** Support for mass email campaigns.
- **Background Workers:** Campaigns run in detached processes.
- **Monitor View:** View progress of running and completed campaigns.
- **Manual Sending Submenu:** Grouped single-email sending options.
- **Provider Validation:** Added checks to ensure API keys are configured before sending.
- **Boot Animation:** Added startup sequence.

## [1.0.0] - 2026-01-19
### Added
- Initial release.
