# Secure File Transfer - Complete Deployment Guide

This document provides step-by-step instructions to deploy the Google Apps Script and connect it with your website.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deploying Google Apps Script](#deploying-google-apps-script)
3. [Configuring Your Website](#configuring-your-website)
4. [Testing the Application](#testing-the-application)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ A Google Account (Gmail)
- ✅ A code editor (VS Code, Notepad++, etc.)
- ✅ Basic knowledge of HTML/JavaScript

---

## Deploying Google Apps Script

### Step 1: Create a New Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click on **"New project"** button
3. A new script editor window will open

### Step 2: Configure the Project

1. Rename the project to "Secure File Transfer" (click on "Untitled project")
2. Delete any existing code in the editor
3. Create a new file by clicking the **"+"** icon next to "Files"
4. Select **"Script"** to create a new `.gs` file
5. Name it `Code.gs`

### Step 3: Copy the Code

1. Open the `Code.gs` file from this project folder
2. Copy all the content
3. Paste it into the Google Apps Script editor
4. **Important:** Find this line in the code:
   ```javascript
   const OWNER_EMAIL = 'your-email@gmail.com';
   ```
5. Replace `'your-email@gmail.com'` with your actual email address

### Step 4: Save the Script

- Press `Ctrl + S` or click the floppy disk icon
- The script will be saved

### Step 5: Deploy as Web App

1. Click on the **"Deploy"** button (top right corner)
2. Select **"New deployment"**
3. Click on the **"Select type"** gear icon
4. Choose **"Web app"**
5. Configure the deployment:
   - **Description:** Version 1 (or any description)
   - **Execute as:** "Me" (your Google account)
   - **Who has access:** "Anyone" (this allows your website to submit data)
6. Click **"Deploy"**
7. Click **"Authorize access"** button
8. Select your Google account
9. If you see a warning "Google hasn't verified this app", click **"Advanced"** → **"Go to Secure File Transfer (unsafe)"**
10. Click **"Allow"** to grant permissions

### Step 6: Copy the Web App URL

1. After deployment, you'll see a "Web app" section
2. Copy the **"Web app URL"** (it looks like: `https://script.google.com/macros/s/XXXXX/exec`)
3. **Save this URL carefully** - you'll need it for your website!

---

## Configuring Your Website

### Step 1: Update the JavaScript Configuration

1. Open `script.js` in your project folder
2. Find this line at the top:
   ```javascript
   const APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
3. Replace the placeholder with your actual Web App URL:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR-ACTUAL-URL/exec';
   ```

### Step 2: Test the Website

You can test the website by:

#### Option A: Open Directly in Browser
1. Double-click `index.html` to open it in your browser
2. Fill in the form with test data
3. Select a small test file
4. Click Submit

#### Option B: Use a Local Server
If you want to test with a local server:
1. Open terminal/command prompt in your project folder
2. Run: `npx http-server` (requires Node.js)
3. Or use VS Code "Live Server" extension

#### Option C: Host Online
You can host the website for free using:
- GitHub Pages
- Netlify
- Vercel
- Your own web hosting

---

## How It Works

## Google Sheets Structure

When users submit files, the following data is saved in Google Sheets (auto-created as "File Transfer Submissions"):

| Column | Description |
|--------|-------------|
| **A** | Timestamp - Date and time of submission |
| **B** | Name - User's name |
| **C** | Email - User's email address |
| **D** | Message - User's message/description |
| **E** | File Name - Name of uploaded file |
| **F** | File Size - Size of file (Bytes/KB/MB) |
| **G** | Mime Type - Fileapplication type (/pdf, image/png, etc.) |

### Data Flow

```
User's Browser                    Google Apps Script              Google Services
     |                                   |                               |
     |  1. Fill form & select file       |                               |
     |---------------------------------->|                               |
     |                                   |                               |
     |  2. Convert file to Base64        |                               |
     |  3. Send JSON via fetch()        |                               |
     |---------------------------------->|                               |
     |                                   |                               |
     |                                   |  4. Parse JSON data           |
     |                                   |  5. Save to Google Sheets     |
     |                                   |------------------------------>|
     |                                   |                               |
     |                                   |  6. Send email with attachment|
     |                                   |------------------------------>|
     |                                   |                               |
     |  7. Return success response       |                               |
     |<----------------------------------|                               |
     |                                   |                               |
```

### Google Sheets Structure

When users submit files, the following data is saved in Google Sheets:

| Timestamp | Name | Email | Message | File Name | File Size | Mime Type |
|-----------|------|-------|---------|-----------|-----------|-----------|
| Date/Time | John | john@example.com | Test message | document.pdf | 2.5 MB | application/pdf |

---

## Troubleshooting

### Issue: "Access Denied" or "Authorization Required"

**Solution:**
- Redeploy the web app with "Anyone" access
- Make sure you're not using "Anyone with Google Account"

### Issue: File Not Attached to Email

**Possible causes:**
1. File size exceeds 25MB (Gmail limit)
2. File type not supported

**Solution:**
- The current code limits file size to 10MB
- For Gmail, the actual limit is 25MB
- Check the file size in JavaScript console

### Issue: Data Not Saving to Sheets

**Solution:**
1. Check that the script has permission to access Drive
2. Verify the spreadsheet was created (script creates "File Transfer Submissions")
3. Check the Google Apps Script execution logs

### Issue: CORS Errors

**This is normal!** The script uses `no-cors` mode which:
- Sends data successfully
- Returns an opaque response (can't read response body)
- This is intentional and works correctly

### Issue: Email Not Received

**Check:**
1. Spam/Junk folder
2. Correct email address in `OWNER_EMAIL`
3. Gmail sending limits (500 emails/day for free accounts)

---

## Security Considerations

### Current Implementation

✅ **Pros:**
- No login required (easy for users)
- Data saved to your private Google Sheet
- File attachments sent to your email
- Mobile-friendly interface

⚠️ **Limitations:**
- No user authentication
- Rate limiting not implemented
- No file type restrictions

### Recommendations for Production

1. **Add reCAPTCHA** to prevent spam
2. **Implement rate limiting** in Apps Script
3. **Add file type validation** 
4. **Use Google Sign-In** if you need user authentication
5. **Store files in Google Drive** instead of email attachments

---

## Cost

- **Google Apps Script:** Free (with limits)
- **Google Sheets:** Free
- **Gmail:** Free (500 emails/day limit)
- **Website Hosting:** Your choice (can be free)

---

## Support

If you encounter issues:

1. Check Google Apps Script **Execution Log** (View → Executions)
2. Check Google Apps Script **Logs** (View → Logs)
3. Open browser Developer Console (F12) for JavaScript errors

---

## File Structure

```
aweb/
├── index.html          # Main HTML form
├── style.css           # Styling
├── script.js           # Frontend JavaScript
├── Code.gs             # Google Apps Script (backend)
├── appsscript.json     # Apps Script configuration
├── INSTRUCTIONS.md     # This file
└── TODO.md             # Project TODO list
```

---

## Quick Reference

| Item | Value |
|------|-------|
| Max File Size | 10 MB |
| Required Fields | Name, Email, File |
| Optional Fields | Message |
| Email Notifications | Yes |
| Google Sheets | Auto-created |

---

**Created with ❤️ using Google Apps Script**

