# TUImailout

A powerful, interactive Terminal User Interface (TUI) application for sending mass emails using Amazon SES, Mailgun, and Mailchimp Transactional. Built with Node.js, React (Ink), and TypeScript.

## Features

*   **Multi-Provider Support:** Send seamlessly via Amazon SES, Mailgun, or Mailchimp Transactional.
*   **Mass Campaigns:**
    *   Load HTML templates from local folders (includes standard HTML boilerplate).
    *   Load recipient lists from CSV files.
    *   Configurable sending rates (emails per minute).
    *   Background processing with real-time monitoring.
*   **Settings Management:**
    *   Modular settings menus for Amazon SES, Mailgun, and Mailchimp.
    *   Theme configuration.
    *   Manage multiple "From" addresses.
*   **Theme System:**
    *   6 Futuristic Themes: Cyber Cyan, Neon Nights, Toxic Waste, Cobalt Strike, Retro Amber, Matrix Ghost.
*   **Interactivity:**
    *   Cinematic boot and shutdown animations.
    *   Menu-driven interface with keyboard navigation.
*   **Manual Sending:** Send individual quick emails via any configured provider.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/not_jarod/TUImailout.git
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

## Directory Structure
*   `src/`: Source code.
*   `templates/`: Folder for HTML email templates.
*   `lists/`: Folder for CSV recipient lists.
*   `dist/`: Compiled code.

## License
MIT