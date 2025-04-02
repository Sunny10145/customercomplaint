function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('form')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Replace this with your Google Drive folder ID
const FOLDER_ID = '1uhnARKvGDVAVohSP4UEi_J1yyam5B4gV';

function submitForm(formData) {
  try {
    // Get the active spreadsheet
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new Error('No active spreadsheet found');
    }

    // Get or create Sheet4
    var sheet = spreadsheet.getSheetByName('Sheet4');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Sheet4');
      Logger.log('Sheet4 created because it didn’t exist');
    }

    // Get the folder where files will be uploaded
    var folder = DriveApp.getFolderById(FOLDER_ID);
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Get the last row and determine the next row (starting at A2)
    var lastRow = sheet.getLastRow();
    var nextRow = lastRow >= 1 ? lastRow + 1 : 2;
    var currentdatetime = new Date();

    // Upload files and get their URLs if files are provided
    var fileUrl1 = '';
    var fileUrl2 = '';
    
    if (formData.fileUpload1) {
      var fileBlob1 = Utilities.newBlob(
        Utilities.base64Decode(formData.fileUpload1.split(',')[1]), // Remove "data:*/*;base64," prefix
        formData.fileUpload1MimeType || 'application/octet-stream',
        formData.fileUpload1Name || 'File1_' + currentdatetime.toISOString()
      );
      var uploadedFile1 = folder.createFile(fileBlob1);
      fileUrl1 = uploadedFile1.getUrl();
    }

    if (formData.fileUpload2) {
      var fileBlob2 = Utilities.newBlob(
        Utilities.base64Decode(formData.fileUpload2.split(',')[1]),
        formData.fileUpload2MimeType || 'application/octet-stream',
        formData.fileUpload2Name || 'File2_' + currentdatetime.toISOString()
      );
      var uploadedFile2 = folder.createFile(fileBlob2);
      fileUrl2 = uploadedFile2.getUrl();
    }

    // Prepare data for the spreadsheet (columns A to K)
    var data = [
      [
        currentdatetime || '',
        formData.complaintDate || '',
        formData.location || '',
        formData.partyName || '',
        formData.contactPerson || '',
        formData.modelNo || '',
        formData.complaint || '',
        formData.serialNo || '',
        formData.customerMobile || '',
        fileUrl1 || '',
        fileUrl2 || ''
      ]
    ];

    // Log the data for debugging
    Logger.log('Storing data in Sheet4, row ' + nextRow + ': ' + JSON.stringify(data));

    // Write data to Sheet4 starting at A2 (columns A to K)
    sheet.getRange(nextRow, 1, 1, 11).setValues(data);
    return true; // Indicate success
  } catch (error) {
    Logger.log('Error in submitForm: ' + error.toString());
    throw new Error('Submission failed: ' + error.message);
  }
}
