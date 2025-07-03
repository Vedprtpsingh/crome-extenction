# LinkedIn Profile Scraper Extension

This Chrome extension helps you scrape LinkedIn profiles from web pages, manage the collected links, and avoid duplicates.

## Features

- **Scrape LinkedIn Profiles**: Automatically find and collect LinkedIn profile links from the pages you visit.
- **Manage Scraped Links**: View all the collected links in a clean and organized list.
- **Avoid Duplicates**: The extension automatically detects and separates duplicate links, so you don't have to.
- **Track Opened Links**: Links you open or delete are moved to a separate "Opened/Deleted" list to keep your main list clean.
- **Easy to Use**: A simple interface makes it easy to manage your scraped links.

## How to Use

1. **Install the Extension**: Load the extension into Chrome.
2. **Scrape Profiles**: The extension will automatically start scraping LinkedIn profile links from the pages you visit.
3. **View Links**: Click on the extension icon to open the list of scraped links.
4. **Manage Links**:
    - **Scanned Links**: This is the main list of unique, unopened links.
    - **Opened/Deleted Links**: Links you open or delete from the main list will appear here.
    - **Duplicate Links**: Any duplicate links found during scraping will be shown in this list.

## Files

- `manifest.json`: The extension's manifest file.
- `background.js`: Handles the core logic of scraping and managing links.
- `list.html` / `list.js`: The page that displays the lists of links.
- `popup.html` / `popup.js`: The main popup for the extension.
- `progress.html` / `progress.js`: A progress window that appears during scraping.
- `icon16.png`, `icon48.png`, `icon128.png`: The extension's icons.