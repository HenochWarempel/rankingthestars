// ============================================================
// Plak dit bestand in Extensions > Apps Script van je Google Sheet.
// Zie README.md voor de volledige installatie-instructies.
// ============================================================

var PLAYERS = ["Arhan", "David", "Henoch", "Jan", "Jasper", "John", "Just", "Mathew", "Mesach", "Stephan", "Tom B", "Tom P"];
var SHEET_NAME = "Ratings";

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Rater"].concat(PLAYERS));
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  var sheet = getSheet_();
  var data = JSON.parse(e.postData.contents);
  var rater = String(data.rater || "").trim();
  var ratings = data.ratings || {};

  if (!rater || PLAYERS.indexOf(rater) === -1) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Onbekende of ontbrekende rater." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var row = [new Date(), rater];
  PLAYERS.forEach(function (p) {
    if (p === rater) {
      row.push("");
    } else {
      var v = ratings[p];
      row.push(v === undefined || v === null || v === "" ? "" : Number(v));
    }
  });

  // Bestaande rij van deze rater overschrijven (zodat opnieuw ranken geen dubbele rij geeft)
  var values = sheet.getDataRange().getValues();
  var foundRow = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][1] === rater) { foundRow = i + 1; break; }
  }
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "Rating-app backend draait." }))
    .setMimeType(ContentService.MimeType.JSON);
}
