# Hostinger Node.js Deployment Guide

This guide covers the manual setup required to connect your GitHub repository to Hostinger via the automated CI/CD pipeline we've set up.

## 1. GitHub Secrets Setup
Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.

Add the following secrets:

1.  **HOSTINGER_FTP_SERVER**: Your Hostinger FTP IP (e.g., `185.xxx.xxx.xxx` or domain `ftp.yourdomain.com`).
2.  **HOSTINGER_FTP_USERNAME**: Your FTP Username (e.g., `u123456789`).
3.  **HOSTINGER_FTP_PASSWORD**: Your FTP Password.
4.  **HOSTINGER_FTP_PATH**: The absolute path to your deployment directory.
    *   **Example**: `/home/u123456789/domains/learnpharmacy.in/public_html/`
    *   *Note*: Ensure this path matches where you want the `server` folder contents to land. Typically `public_html` for the main site.

## 2. Hostinger Control Panel Setup

1.  Log in to Hostinger hPanel.
2.  Navigate to **Websites** -> **Manage** -> **UPS / Advanced** -> **Node.js**.
3.  **Create Application**:
    *   **Node.js Version**: Select **v18** or **v20** (Recommended).
    *   **Application Mode**: **Production**.
    *   **Application Root**: `public_html` (or wherever your `server` code is deployed).
    *   **Application Startup File**: `server.js` (We created a shim file that points to the correct location).
    *   Click **Create**.

## 3. Environment Variables (Hostinger)

In the Node.js application settings (same page):

1.  Enter your environment variables one by one:
    *   `DB_HOST`: (From "Databases" -> "Management" section)
    *   `DB_USER`: Your MySQL User
    *   `DB_PASSWORD`: Your MySQL Password
    *   `DB_NAME`: Your Database Name
    *   `JWT_SECRET`: A long random string.
    *   `PORT`: Leave blank (Hostinger assigns this automatically).

## 4. First Deployment & Start

1.  **Push to GitHub**: Push your latest code (including the workflows) to the `master` branch.
    *   Go to the **Actions** tab in GitHub to watch the "Deploy to Hostinger (FTP)" workflow.
    *   Wait for it to complete.

2.  **Install Dependencies (Hostinger)**:
    *   Once the GitHub Action says "Support/Success", go back to Hostinger Node.js settings.
    *   Click the **NPM Install** button. This installs dependencies from the uploaded `package.json`.

3.  **Restart Application**:
    *   Click **Restart** to launch the server.

## Troubleshooting

*   **FTP Failures**: If the GitHub Action fails on FTP, check your `HOSTINGER_FTP_PATH` (ensure it starts with `/home/...`) and Credentials.
*   **Startup Errors**: Check the `error_log` in your File Manager.
*   **Missing styles/frontend**: Ensure the build step completed in GitHub actions (check the logs for "Bundle frontend and backend").
