![TUImailout](src/assets/TUImailout.gif)

A powerful, interactive Terminal User Interface (TUI) application for sending mass emails using multiple providers including Amazon SES, Mailgun, Mailchimp Transactional, SendGrid, and Custom SMTP. Built with Node.js, React (Ink), and TypeScript.

## Features

*   **Multi-Provider Support:** Send seamlessly via:
    *   **Amazon SES**
    *   **Mailgun**
    *   **Mailchimp Transactional**
    *   **SendGrid**
    *   **Custom SMTP Providers**
*   **Multiple Credentials:** Manage multiple accounts for each provider (e.g., "Personal SES", "Work SES", "Client Mailgun"). Easily switch between accounts for different campaigns.
*   **Mass Campaigns:**
    *   Load HTML templates from local folders (includes standard HTML boilerplate).
    *   Load recipient lists from CSV files.
    *   **Human-like Sending:** "Bursty" sending logic to mimic human behavior and avoid spam filters.
        *   **How it works:** The system operates in 5-minute cycles. In each cycle, it wakes up at two random times to send a "burst" of emails equal to your Rate Limit.
        *   *Example:* If you set a limit of 100, it sends a total of 1000 emails over 25 minutes (sending 200 per 5-minute cycle). If you set a limit of 500, it finishes in ~5 minutes.
    *   **Precise Rate Limiting:** Accurate enforcement of user-defined constraints with execution time compensation.
    *   **Micro-Throttling:** Adds a 200ms safety pause between every email to prevent API flooding.
    *   Background processing with real-time monitoring.
    *   Step-by-step wizard with progress tracking.
*   **Templates Manager:**
    *   Browse and manage your HTML email templates.
    *   **Browser Preview:** Instantly open templates in your default browser to view the final design.
    *   **Management:** Rename template folders and delete unused templates with confirmation.
*   **Lists Manager:**
    *   **Create & Delete:** Create new lists by pasting text or delete existing lists safely.
    *   **Auto-Header:** Automatically adds `email,name` header if missing and filters blank lines.
    *   **CSV Editor:** Built-in editor for managing recipient lists.
    *   View, edit, and preview CSV files without leaving the app.
*   **Logs Manager:**
    *   **Scrollable History:** Use ↑/↓ keys to scroll through extensive log history.
    *   Comprehensive activity logging with auto-refresh and category filters.
    *   Trimmed and formatted display for large log messages and data.
*   **Reliability Features:**
    *   **Pre-flight Validation:** Campaigns automatically verify your provider connection before starting.
    *   **SMTP Testing:** Real-time connection testing with timeout handling for custom SMTP.
*   **Theme System:**
    *   6 Futuristic Themes: Cyber Cyan, Neon Nights, Toxic Waste, Cobalt Strike, Retro Amber, Matrix Ghost.
*   **Enhanced UX:**
    *   Cinematic boot and shutdown animations.
    *   Split-pane layouts across all major views.
    *   Shortcut Hints: `(Q)` and `ESC` shortcuts clearly labeled for quick navigation.
    *   Number key shortcuts (1-9) for lightning-fast menu navigation.
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
On first run, navigate to **Settings** to configure your credentials. You can add multiple accounts for each provider:
*   **Amazon SES:** Settings -> Amazon SES Providers
*   **Mailgun:** Settings -> Mailgun Providers
*   **Mailchimp:** Settings -> Mailchimp Providers
*   **SendGrid:** Settings -> SendGrid Providers
*   **SMTP:** Settings -> Custom SMTP Providers

### Sending a Campaign
1.  Place HTML templates in the `templates/` folder (e.g., `templates/newsletter/index.html`).
2.  Place CSV recipient lists in the `lists/` folder (header: `email,name`).
3.  Select **Start Mass Campaign** from the main menu.
4.  Follow the wizard to select your template, list, provider, and specific account.

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