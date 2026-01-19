# TUImailout

A powerful, interactive Terminal User Interface (TUI) application for sending mass emails using Amazon SES, Mailgun, and Mailchimp Transactional. Built with Node.js, React (Ink), and TypeScript.

## Features

*   **Multi-Provider Support:** Send seamlessly via Amazon SES, Mailgun, or Mailchimp Transactional.
*   **Mass Campaigns:**
    *   Load HTML templates from local folders (includes standard HTML boilerplate).
    *   Load recipient lists from CSV files.
    *   Configurable sending rates (emails per minute).
    *   Background processing with real-time monitoring.
    *   Step-by-step wizard with progress tracking.
*   **Lists Manager:**
    *   Built-in CSV editor for managing recipient lists.
    *   View, edit, and preview CSV files without leaving the app.
    *   Line-by-line editing with keyboard navigation.
    *   File metadata display (size, line count, last modified).
*   **Logs Manager:**
    *   Comprehensive activity logging system.
    *   Filter logs by category (System, Settings, Campaigns, Emails, Errors).
    *   Real-time auto-refresh monitoring.
    *   Statistics dashboard with log counts.
    *   Clear logs functionality.
*   **Settings Management:**
    *   Modular split-pane interface for easy navigation.
    *   Provider settings for Amazon SES, Mailgun, and Mailchimp.
    *   Theme configuration with 6 futuristic themes.
    *   Manage multiple "From" addresses (name + email) for quick selection.
*   **Theme System:**
    *   6 Futuristic Themes: Cyber Cyan, Neon Nights, Toxic Waste, Cobalt Strike, Retro Amber, Matrix Ghost.
*   **Enhanced UX:**
    *   Cinematic boot and shutdown animations.
    *   Split-pane layouts across all major views.
    *   Number key shortcuts (1-8) for quick menu navigation.
    *   Menu-driven interface with intuitive keyboard controls.
*   **Manual Sending:** Send individual quick emails via any configured provider.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/a2-stuff/TUImailout.git
    cd TUImailout
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Build the project:**
    ```bash
    npm run build
    ```

## Usage

Start the application:

```bash
npm start
```

### Configuration
On first run, navigate to **Settings** to configure your credentials:
*   **Amazon SES:** Settings -> Provider: Amazon SES
*   **Mailgun:** Settings -> Provider: Mailgun
*   **Mailchimp:** Settings -> Provider: Mailchimp

### Sending a Campaign
1.  Place HTML templates in the `templates/` folder (e.g., `templates/newsletter/index.html`).
2.  Place CSV recipient lists in the `lists/` folder (header: `email,name`).
3.  Select **Start Mass Campaign** from the main menu.
4.  Follow the wizard to select your template, list, and provider.

### Managing Lists
1.  Select **Lists Manager** from the main menu (or press `4`).
2.  Choose a CSV file from the list to view or edit.
3.  Press **Edit File** to enter edit mode.
4.  Navigate lines with ↑/↓, press Enter to edit a line.
5.  Press Tab to show save menu, then save or cancel changes.

### Viewing Logs
1.  Select **Logs Manager** from the main menu (or press `5`).
2.  Choose a log category to filter (System, Settings, Campaigns, Emails, Errors).
3.  View logs in real-time with auto-refresh enabled.
4.  Toggle auto-refresh or clear all logs from the menu.

## Directory Structure
*   `src/`: Source code.
*   `templates/`: Folder for HTML email templates.
*   `lists/`: Folder for CSV recipient lists.
*   `.logs/`: Application logs (auto-managed, last 1000 entries).
*   `dist/`: Compiled code.

## License
MIT