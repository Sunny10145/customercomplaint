const express = require('express');
const { google } = require('googleapis');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(express.json());

// Google API credentials (Service Account se lena hoga)
const auth = new google.auth.GoogleAuth({
  keyFile: './credentials.json', // Aapka service account key file
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
  ]
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

const SPREADSHEET_ID = 'https://docs.google.com/spreadsheets/d/1DQycv__0roCHh26eBhjVlow-AH3qvTO9teHIVSalei8/edit?gid=1661887202#gid=1661887202'; // Aapka Google Sheet ID
const FOLDER_ID = '1uhnARKvGDVAVohSP4UEi_J1yyam5B4gV';

// Form submission handler
app.post('/submit', upload.fields([{ name: 'fileUpload1' }, { name: 'fileUpload2' }]), async (req, res) => {
  try {
    const { complaintDate, location, partyName, contactPerson, modelNo, complaint, serialNo, customerMobile } = req.body;
    const files = req.files;
    const currentDateTime = new Date();

    // Upload files to Google Drive
    let fileUrl1 = '', fileUrl2 = '';
    if (files.fileUpload1) {
      const fileMetadata = {
        name: files.fileUpload1[0].originalname || `File1_${currentDateTime.toISOString()}`,
        parents: [FOLDER_ID]
      };
      const media = { mimeType: files.fileUpload1[0].mimetype, body: files.fileUpload1[0].buffer };
      const file = await drive.files.create({ resource: fileMetadata, media });
      fileUrl1 = `https://drive.google.com/file/d/${file.data.id}/view`;
    }
    if (files.fileUpload2) {
      const fileMetadata = {
        name: files.fileUpload2[0].originalname || `File2_${currentDateTime.toISOString()}`,
        parents: [FOLDER_ID]
      };
      const media = { mimeType: files.fileUpload2[0].mimetype, body: files.fileUpload2[0].buffer };
      const file = await drive.files.create({ resource: fileMetadata, media });
      fileUrl2 = `https://drive.google.com/file/d/${file.data.id}/view`;
    }

    // Append data to Google Sheets
    const values = [
      [
        currentDateTime.toISOString(),
        complaintDate || '',
        location || '',
        partyName || '',
        contactPerson || '',
        modelNo || '',
        complaint || '',
        serialNo || '',
        customerMobile || '',
        fileUrl1,
        fileUrl2
      ]
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet4!A2:K',
      valueInputOption: 'RAW',
      resource: { values }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
