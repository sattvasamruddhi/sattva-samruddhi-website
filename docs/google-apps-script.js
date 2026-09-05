// Sattva Samruddhi - contact form backend.
// Setup and deployment instructions: see docs/contact-form-setup.md

// EDITABLE - where consultation requests are emailed.
// Comma-separate to notify more than one address.
var NOTIFICATION_EMAIL = "sattvasamruddhi@gmail.com";

var SHEET_NAME = "Consultations";
var SHEET_HEADERS = ["Timestamp", "First Name", "Last Name", "Email", "Contact No", "Message"];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    appendToSheet(data);
    sendEmail(data);
    return json({ success: true });
  } catch (err) {
    return json({ success: false, error: err.message });
  }
}

// Opening the /exec URL in a browser confirms the deployment is live.
function doGet() {
  return json({ status: "ok" });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function appendToSheet(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var r = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
    r.setValues([SHEET_HEADERS]);
    r.setFontWeight("bold");
    r.setBackground("#f5e6d3");
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    timestamp(),
    data.first_name,
    data.last_name,
    data.email,
    data.contact_no,
    data.message
  ]);

  // A phone number like "+91 98675..." starts with "+", so Sheets treats the
  // cell as a formula and shows #ERROR!. Force the Contact No column to plain
  // text ("@") and rewrite the value so it is stored verbatim.
  var contactCol = SHEET_HEADERS.indexOf("Contact No") + 1;
  var contactCell = sheet.getRange(sheet.getLastRow(), contactCol);
  contactCell.setNumberFormat("@");
  contactCell.setValue(data.contact_no);
}

function sendEmail(data) {
  var name = [data.first_name, data.last_name].filter(String).join(" ");
  var subject = "New consultation request - " + name;
  var fields = [
    ["Name", name],
    ["Email", data.email],
    ["Contact No", data.contact_no],
    ["Message", data.message]
  ];
  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    replyTo: data.email,
    htmlBody: buildHtml(subject, fields, timestamp())
  });
}

function timestamp() {
  return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

function buildHtml(title, fields, ts) {
  var rows = fields.map(function (f) {
    return '<tr>'
      + '<td style="padding:10px 16px;font-weight:600;color:#4c463e;background:#f6f3f2;'
      + 'white-space:nowrap;border-bottom:1px solid #e5e2e1;width:35%;">' + f[0] + '</td>'
      + '<td style="padding:10px 16px;color:#1b1b1b;border-bottom:1px solid #e5e2e1;">'
      + (f[1] || "-") + '</td></tr>';
  }).join("");

  return '<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#fff;'
    + 'border:1px solid #cec5bb;border-radius:10px;overflow:hidden;">'
    + '<div style="background:linear-gradient(135deg,#675d4e,#4f4538);padding:28px 32px;">'
    + '<p style="color:rgba(255,255,255,.7);margin:0 0 4px;font-size:11px;letter-spacing:1px;'
    + 'text-transform:uppercase;">Sattva Samruddhi</p>'
    + '<h2 style="color:#fff;margin:0;font-size:19px;">' + title + '</h2></div>'
    + '<table style="width:100%;border-collapse:collapse;">' + rows + '</table>'
    + '<div style="padding:12px 20px;background:#f6f3f2;border-top:1px solid #e5e2e1;">'
    + '<p style="margin:0;font-size:11px;color:#7d766d;">Submitted ' + ts
    + ' IST - sattvasamruddhi.com</p></div></div>';
}
