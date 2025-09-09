const { google } = require('googleapis');
const sheets = google.sheets('v4');

async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return await auth.getClient();
}

module.exports = async (req, res) => {
  const { path } = req;

  if (path === '/api/getSheetData') {
    const { page, rows } = req.query;
    try {
      const authClient = await getGoogleSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Sheet1!A1:Z'
      });
      const data = response.data.values || [];
      const headers = data[0] || [];
      const rowsData = data.slice(1);
      const totalRows = rowsData.length;
      const startIndex = (page - 1) * rows;
      const endIndex = rows === 'all' ? totalRows : startIndex + parseInt(rows);
      const paginatedData = rowsData.slice(startIndex, endIndex);

      res.status(200).json({
        headers,
        data: paginatedData,
        totalRows
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (path === '/api/submitForm') {
    try {
      const authClient = await getGoogleSheetsClient();
      const formData = req.body;
      const values = [
        [
          new Date().toISOString(),
          `UNIQUE_${Date.now()}`,
          formData.creationDate,
          formData.location,
          formData.partyName,
          formData.contactPerson,
          formData.modelNo,
          formData.complaint,
          formData.serialNumber,
          formData.mobileNo,
          formData.actionTaken,
          formData.additionalWork,
          formData.closedWhatsApp,
          formData.performedBy,
          formData.submittedBy,
          formData.assignToPerson,
          formData.department,
          formData.existingAttachments
        ]
      ];

      await sheets.spreadsheets.values.append({
        auth: authClient,
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Sheet1!A:Z',
        valueInputOption: 'RAW',
        resource: { values }
      });

      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (path.startsWith('/api/updateEntry/')) {
    const uniqueId = path.split('/')[3];
    try {
      const authClient = await getGoogleSheetsClient();
      const formData = req.body;

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Sheet1!A1:Z'
      });

      const data = response.data.values || [];
      const rowIndex = data.findIndex(row => row[1] === uniqueId);
      if (rowIndex === -1) {
        res.status(404).json({ error: 'Entry not found' });
        return;
      }

      const updatedRow = [
        data[rowIndex][0],
        uniqueId,
        formData.creationDate,
        formData.location,
        formData.partyName,
        formData.contactPerson,
        formData.modelNo,
        formData.complaint,
        formData.serialNumber,
        formData.mobileNo,
        formData.actionTaken,
        formData.additionalWork,
        formData.closedWhatsApp,
        formData.performedBy,
        formData.submittedBy,
        formData.assignToPerson,
        formData.department,
        formData.existingAttachments
      ];

      await sheets.spreadsheets.values.update({
        auth: authClient,
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: `Sheet1!A${rowIndex + 1}:Z${rowIndex + 1}`,
        valueInputOption: 'RAW',
        resource: { values: [updatedRow] }
      });

      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (path === '/api/suggestions') {
    const { field, query } = req.query;
    try {
      const authClient = await getGoogleSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Sheet1!A1:Z'
      });
      const data = response.data.values.slice(1) || [];
      const fieldIndex = {
        partyName: 4,
        contactPerson: 5,
        modelNo: 6,
        complaint: 7,
        serialNumber: 8,
        mobileNo: 9,
        actionTaken: 10,
        assignToPerson: 15,
        department: 16
      }[field];

      const suggestions = [...new Set(data.map(row => row[fieldIndex]).filter(val => val && val.toLowerCase().includes(query.toLowerCase())))];
      res.status(200).json(suggestions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (path === '/api/mobileNo') {
    const { partyName } = req.query;
    try {
      const authClient = await getGoogleSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Sheet1!A1:Z'
      });
      const data = response.data.values.slice(1) || [];
      const row = data.find(row => row[4] && row[4].toLowerCase() === partyName.toLowerCase());
      res.status(200).json({ mobileNo: row ? row[9] : '' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
};
