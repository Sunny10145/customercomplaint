function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('form')
    .setTitle("Ekkaa Electronics")
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function generateUniqueId(sheet) {
  try {
    var lastRow = sheet.getLastRow();
    var uniqueIdColumn = 2; // Column B
    var prefix = 'Query-';
    var maxId = 0;

    if (lastRow > 1) {
      var existingIds = sheet.getRange(2, uniqueIdColumn, lastRow - 1, 1).getValues();
      existingIds.forEach(function(row) {
        var id = row[0];
        if (id && id.startsWith(prefix)) {
          var num = parseInt(id.replace(prefix, ''), 10);
          if (!isNaN(num) && num > maxId) {
            maxId = num;
          }
        }
      });
    }

    var newIdNum = maxId + 1;
    return prefix + String(newIdNum).padStart(4, '0');
  } catch (error) {
    Logger.log('Error generating unique ID: ' + error.message);
    throw new Error('Error generating unique ID: ' + error.message);
  }
}

function submitForm(formData) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) throw new Error('No active spreadsheet found');

    var sheet = spreadsheet.getSheetByName('Sheet4');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Sheet4');
      sheet.getRange(1, 1, 1, 19).setValues([[
        'Date', 'UNIQUE_ID', 'CREATION_DATE', 'LOCATION', 'PARTY_NAME', 'CONTACT_PERSON', 
        'MODEL_NO', 'COMPLAINT', 'SERIAL_NUMBER', 'MOBILE_NO', 'ACTION_TAKEN', 
        'ADDITIONAL_WORK', 'CLOSED_WHATSAPP', 'PERFORMED_BY', 'Entry_By', 
        'ACTUAL', 'RATING', 'COMMENT', 'FEEDBACK_FORM'
      ]]);
    }

    var lastRow = sheet.getLastRow();
    var nextRow = lastRow >= 1 ? lastRow + 1 : 2;
    var submissionTime = new Date();
    var uniqueId = generateUniqueId(sheet);

    // Generate Feedback Form URL with pre-filled fields (UNIQUE_ID, COMPLAINT, ACTION_TAKEN)
    const baseFeedbackFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSc59zL-fWC284UTFtklQMvZygfs6H_FVKoLfwYY3eevXxqKHA/viewform?usp=pp_url';
    const uniqueIdEntryId = 'entry.401897819'; // UNIQUE_ID field ID
    const complaintEntryId = 'entry.1819820335'; // COMPLAINT field ID
    const actionTakenEntryId = 'entry.401077421'; // ACTION_TAKEN field ID

    let feedbackFormUrl = `${baseFeedbackFormUrl}&${uniqueIdEntryId}=${encodeURIComponent(uniqueId)}`;
    feedbackFormUrl += `&${complaintEntryId}=${encodeURIComponent(formData.complaint || '')}`;
    feedbackFormUrl += `&${actionTakenEntryId}=${encodeURIComponent(formData.actionTaken || '')}`;

    // Store data in sheet
    var data = [[
      submissionTime,
      uniqueId,
      formData.creationDate || '',
      formData.location || '',
      formData.partyName || '',
      formData.contactPerson || '',
      formData.modelNo || '',
      formData.complaint || '',
      formData.serialNumber || '',
      formData.mobileNo || '',
      formData.actionTaken || '',
      formData.additionalWork || '',
      formData.closedWhatsApp || '',
      formData.performedBy || '',
      formData.submittedBy || '',
      '', // ACTUAL (not in form)
      '', // RATING (not in form)
      '', // COMMENT (not in form)
      feedbackFormUrl // Store the pre-filled URL in the sheet
    ]];

    sheet.getRange(nextRow, 1, 1, 19).setValues(data);
    Logger.log('Form submitted successfully: ' + uniqueId);
    return true;
  } catch (error) {
    Logger.log('Submission failed: ' + error.message);
    throw new Error('Submission failed: ' + error.message);
  }
} 

function getSheetData(page, rowsPerPage) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName('Sheet4');
    if (!sheet) return JSON.stringify({ headers: [], data: [], totalRows: 0 });

    var lastRow = sheet.getLastRow();
    var totalRows = lastRow > 1 ? lastRow - 1 : 0;
    var lastColumn = sheet.getLastColumn();

    var startRow = 2 + ((page - 1) * rowsPerPage);
    var numRows = Math.min(rowsPerPage, totalRows - ((page - 1) * rowsPerPage));
    if (numRows <= 0) return JSON.stringify({ headers: [], data: [], totalRows: totalRows });

    var range = sheet.getRange(startRow, 1, numRows, lastColumn);
    var values = range.getValues();

    var headers = [
      'Date', 'UNIQUE_ID', 'CREATION_DATE', 'LOCATION', 'PARTY_NAME', 'CONTACT_PERSON', 
      'MODEL_NO', 'COMPLAINT', 'SERIAL_NUMBER', 'MOBILE_NO', 'ACTION_TAKEN', 
      'ADDITIONAL_WORK', 'CLOSED_WHATSAPP', 'PERFORMED_BY', 'Entry_By', 
      'ACTUAL', 'RATING', 'COMMENT', 'FEEDBACK_FORM'
    ];

    Logger.log('Fetched sheet data: Page ' + page + ', Rows: ' + numRows);
    return JSON.stringify({ headers: headers, data: values, totalRows: totalRows });
  } catch (error) {
    Logger.log('Error fetching data: ' + error.message);
    throw new Error('Error fetching data: ' + error.message);
  }
}

function getEntryByUniqueId(uniqueId) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName('Sheet4');
    if (!sheet) throw new Error('Sheet not found');

    var data = sheet.getDataRange().getValues();
    if (data.length === 0) throw new Error('No data found in the sheet');

    var headers = data[0];
    var uniqueIdIndex = headers.indexOf('UNIQUE_ID');
    if (uniqueIdIndex === -1) throw new Error('UNIQUE_ID column not found');

    for (var i = 1; i < data.length; i++) {
      if (data[i][uniqueIdIndex] === uniqueId) {
        var entry = {};
        headers.forEach((header, index) => {
          entry[header] = data[i][index];
        });
        Logger.log('Found Entry: ' + JSON.stringify(entry));
        return JSON.stringify(entry);
      }
    }
    Logger.log('No entry found for UNIQUE_ID: ' + uniqueId);
    return null;
  } catch (error) {
    Logger.log('Error fetching entry: ' + error.message);
    throw new Error('Error fetching entry: ' + error.message);
  }
}

function updateEntry(uniqueId, formData) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName('Sheet4');
    if (!sheet) throw new Error('Sheet not found');

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var uniqueIdIndex = headers.indexOf('UNIQUE_ID');
    if (uniqueIdIndex === -1) throw new Error('UNIQUE_ID column not found');

    for (var i = 1; i < data.length; i++) {
      if (data[i][uniqueIdIndex] === uniqueId) {
        var oldRow = data[i];
        var newRow = [
          new Date(),
          uniqueId,
          formData.creationDate || oldRow[2],
          formData.location || oldRow[3],
          formData.partyName || oldRow[4],
          formData.contactPerson || oldRow[5],
          formData.modelNo || oldRow[6],
          formData.complaint || oldRow[7],
          formData.serialNumber || oldRow[8],
          formData.mobileNo || oldRow[9],
          formData.actionTaken || oldRow[10],
          formData.additionalWork || oldRow[11],
          formData.closedWhatsApp || oldRow[12],
          formData.performedBy || oldRow[13],
          formData.submittedBy || oldRow[14],
          formData.actual !== undefined ? formData.actual : oldRow[15],
          formData.rating !== undefined ? formData.rating : oldRow[16],
          formData.comment !== undefined ? formData.comment : oldRow[17],
          oldRow[18] || '' // Feedback Form (not updated via form)
        ];

        var changes = [];
        headers.forEach((header, index) => {
          if (index !== 1) { // Skip UNIQUE_ID
            var oldValue = oldRow[index] instanceof Date ? oldRow[index].toLocaleString('en-US') : (oldRow[index] || '').toString().trim();
            var newValue = newRow[index] instanceof Date ? newRow[index].toLocaleString('en-US') : (newRow[index] || '').toString().trim();
            if (oldValue !== newValue) {
              changes.push(`${header}: "${oldValue}" -> "${newValue}"`);
            }
          }
        });
        var changesString = changes.length > 0 ? changes.join(', ') : 'No changes detected';
        Logger.log('Changes for UNIQUE_ID ' + uniqueId + ': ' + changesString);

        sheet.getRange(i + 1, 1, 1, 19).setValues([newRow]);

        var historySheet = spreadsheet.getSheetByName('EditHistory');
        if (!historySheet) {
          historySheet = spreadsheet.insertSheet('EditHistory');
          historySheet.getRange(1, 1, 1, 4).setValues([['UNIQUE_ID', 'Timestamp', 'User', 'Changes']]);
        }
        historySheet.appendRow([uniqueId, new Date(), Session.getActiveUser().getEmail(), changesString]);
        
        Logger.log('Entry updated successfully: ' + uniqueId);
        return true;
      }
    }
    throw new Error('Entry not found for UNIQUE_ID: ' + uniqueId);
  } catch (error) {
    Logger.log('Error updating entry: ' + error.message);
    throw new Error('Error updating entry: ' + error.message);
  }
}

function deleteEntryByUniqueId(uniqueId) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName('Sheet4');
    if (!sheet) throw new Error('Sheet not found');

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var uniqueIdIndex = headers.indexOf('UNIQUE_ID');
    if (uniqueIdIndex === -1) throw new Error('UNIQUE_ID column not found');

    for (var i = 1; i < data.length; i++) {
      if (data[i][uniqueIdIndex] === uniqueId) {
        sheet.deleteRow(i + 1);
        Logger.log('Entry deleted successfully: ' + uniqueId);
        return true;
      }
    }
    throw new Error('Entry not found for UNIQUE_ID: ' + uniqueId);
  } catch (error) {
    Logger.log('Error deleting entry: ' + error.message);
    throw new Error('Error deleting entry: ' + error.message);
  }
}

function getEditHistory(uniqueId) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName('EditHistory');
    if (!sheet) {
      Logger.log('EditHistory sheet not found, returning empty history');
      return JSON.stringify([]);
    }

    var data = sheet.getDataRange().getValues();
    var history = [];
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === uniqueId) {
        var timestamp = new Date(data[i][1]);
        var cleanTimestamp = timestamp.toLocaleString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: '2-digit', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });

        var changesText = data[i][3] || 'No changes recorded';
        var highlightedChanges = changesText;
        if (changesText !== 'No changes recorded') {
          highlightedChanges = changesText.replace(
            /"([^"]*)"\s*->\s*"([^"]*)"/g,
            '<span style="background-color: yellow;">"$1"</span> -> <span style="background-color: yellow;">"$2"</span>'
          );
        }

        history.push({
          timestamp: cleanTimestamp,
          user: data[i][2] || 'Unknown User',
          changes: highlightedChanges
        });
      }
    }
    
    Logger.log('Edit History for ' + uniqueId + ': ' + JSON.stringify(history));
    return JSON.stringify(history);
  } catch (error) {
    Logger.log('Error fetching edit history: ' + error.message);
    throw new Error('Error fetching edit history: ' + error.message);
  }
}


