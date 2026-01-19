# Changelog

All notable changes to this project will be documented in this file.

## [1.3.2] - 2026-01-19
### Changed
- **Major UI Refactor:** Applied split-pane layout pattern across entire application
  - Manual Sending: Left pane for provider selection, right pane for send form
  - Campaign Monitor: Left pane for campaign list, right pane for campaign details with live updates
  - Campaign Setup: Left pane for step progress tracker, right pane for current step form
  - Info: Left pane for section navigation (About, Credits, License), right pane for content
- **Component Architecture:** Refactored SendSES, SendMailgun, and SendMailchimp to be embeddable with focus management
- **Version Management:** Centralized version in `src/utils/version.ts` for consistent display across app
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
