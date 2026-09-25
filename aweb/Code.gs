// ============================================
// Secure File Transfer - Google Apps Script
// ============================================

// CONFIGURATION - Replace with your email address
const OWNER_EMAIL = 'your-email@gmail.com';

// Spreadsheet configuration
const SHEET_NAME = 'File Transfers';

// ============================================
// Main POST handler
// ============================================

function doPost(e) {
  try {
    // Parse the incoming JSON data
    const jsonString = e.postData.contents;
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (!data.name || !data.email) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, message: 'Missing required fields' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Save to Google Sheets
    const rowData = saveToSheet(data);
    
    // Send email notification
    sendEmailNotification(data, rowData);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'File uploaded successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// Save data to Google Sheets
// ============================================

function saveToSheet(data) {
  // Get or create the spreadsheet
  const spreadsheet = getOrCreateSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  
  // Set up headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    const headers = ['Timestamp', 'Name', 'Email', 'Message', 'File Name', 'File Size', 'Mime Type'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format header row
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#667eea')
      .setFontColor('white')
      .setFontWeight('bold');
    
    // Set column widths
    sheet.setColumnWidths(1, 7, 150);
    sheet.setColumnWidth(1, 180); // Timestamp
    sheet.setColumnWidth(4, 300); // Message
  }
  
  // Prepare row data
  const timestamp = new Date().toLocaleString();
  const fileSize = formatFileSize(data.fileSize || 0);
  
  const rowData = [
    timestamp,
    data.name,
    data.email,
    data.message || '',
    data.fileName || '',
    fileSize,
    data.mimeType || ''
  ];
  
  // Append data to sheet
  const lastRow = sheet.getLastRow() + 1;
  sheet.getRange(lastRow, 1, 1, rowData.length).setValues([rowData]);
  
  // Alternate row colors for better readability
  if (lastRow % 2 === 0) {
    sheet.getRange(lastRow, 1, 1, rowData.length).setBackground('#f9f9f9');
  }
  
  return rowData;
}

// ============================================
// Get or create spreadsheet
// ============================================

function getOrCreateSpreadsheet() {
  // Try to find existing spreadsheet by name
  const spreadsheets = DriveApp.getFilesByName('File Transfer Submissions');
  
  if (spreadsheets.hasNext()) {
    return SpreadsheetApp.open(spreadsheets.next());
  }
  
  // Create new spreadsheet
  const spreadsheet = SpreadsheetApp.create('File Transfer Submissions');
  
  // Share with owner email
  spreadsheet.addEditor(OWNER_EMAIL);
  
  return spreadsheet;
}

// ============================================
// Send email notification with file attachment
// ============================================

function sendEmailNotification(data, rowData) {
  // Email subject
  const subject = '🔔 New File Upload: ' + data.fileName;
  
  // Email body
  const body = `
<html>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">📎 New File Upload</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Secure File Transfer Notification</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <h2 style="color: #333; font-size: 18px; margin-bottom: 20px;">Submission Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #667eea; width: 40%;">Name:</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #667eea;">Email:</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">${data.email}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #667eea;">File Name:</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">${data.fileName || 'No file'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #667eea;">File Size:</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">${formatFileSize(data.fileSize || 0)}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #667eea; vertical-align: top;">Message:</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; color: #333;">${data.message || 'No message provided'}</td>
        </tr>
        <tr>
          <td style="padding: 12px; font-weight: bold; color: #667eea;">Submitted:</td>
          <td style="padding: 12px; color: #333;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
      
      <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          <strong>Note:</strong> The uploaded file is attached to this email. 
          Data has also been saved to Google Sheets.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">
      <p style="margin: 0;">This is an automated notification from Secure File Transfer</p>
    </div>
  </div>
</body>
</html>
  `;
  
  // Prepare email options
  const options = {
    htmlBody: body,
    name: 'Secure File Transfer',
    replyTo: data.email,
    attachments: []
  };
  
  // Attach file if provided
  if (data.fileData && data.fileName) {
    try {
      // Decode base64 and create blob
      const blob = Utilities.newBlob(
        Utilities.base64Decode(data.fileData),
        data.mimeType || 'application/octet-stream',
        data.fileName
      );
      options.attachments = [blob];
    } catch (error) {
      Logger.log('Error creating file attachment: ' + error.toString());
    }
  }
  
  // Send email
  MailApp.sendEmail(OWNER_EMAIL, subject, '', options);
}

// ============================================
// Helper function to format file size
// ============================================

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================
// GET handler (for testing)
// ============================================

function doGet() {
  return HtmlService.createHtmlOutput(`
    <html>
      <body style="font-family: Arial, sans-serif; padding: 50px; text-align: center;">
        <h1>✅ Secure File Transfer - Google Apps Script</h1>
        <p>The web application is running successfully!</p>
        <p style="color: #666;">Use POST requests to submit files and data.</p>
        <hr style="margin: 30px 0;">
        <h3>Configuration</h3>
        <p><strong>Owner Email:</strong> ${OWNER_EMAIL}</p>
        <p><strong>Sheet Name:</strong> ${SHEET_NAME}</p>
      </body>
    </html>
  `);
}
