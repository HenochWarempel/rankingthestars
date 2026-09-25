// ============================================================
// Plak dit bestand in Extensions > Apps Script van je Google Sheet
// (overschrijf de volledige inhoud van Code.gs).
// Zie README.md voor de (eenmalige) installatie- en setup-stappen.
// ============================================================

var PLAYERS = ["Arhan", "David", "Henoch", "Jan", "Jasper", "John", "Just", "Mathew", "Mesach", "Stephan", "Tom B", "Tom P"];
var SHEET_NAME = "Ratings";

// Pas dit aan naar de echte URL van je GitHub Pages-site als die afwijkt.
var BASE_URL = "https://henochwarempel.github.io/rankingthestars/";
var ADMIN_URL = "https://henochwarempel.github.io/rankingthestars/admin.html";

/* ============================================================
   EENMALIGE SETUP
   ============================================================ */

// Voer dit één keer uit (Apps Script-editor: functie 'setup' selecteren > Run).
// Maakt een admin-wachtwoord en een uniek token per speler aan, en migreert
// een eventueel bestaand sheet (van vóór de rondes-functionaliteit) veilig.
function setup() {
  var p = props_();
  if (!p.getProperty("ADMIN_PASSWORD")) {
    p.setProperty("ADMIN_PASSWORD", Utilities.getUuid().split("-")[0]);
  }
  if (!p.getProperty("CURRENT_ROUND")) {
    p.setProperty("CURRENT_ROUND", "1");
  }
  var tokens = getTokenMap_();
  var changed = false;
  PLAYERS.forEach(function (name) {
    var exists = Object.keys(tokens).some(function (t) { return tokens[t] === name; });
    if (!exists) {
      tokens[Utilities.getUuid().replace(/-/g, "")] = name;
      changed = true;
    }
  });
  if (changed) p.setProperty("TOKENS", JSON.stringify(tokens));

  getSheet_(); // maakt/migreert het tabblad

  Logger.log("Setup klaar.");
  Logger.log("Admin-wachtwoord: " + p.getProperty("ADMIN_PASSWORD"));
  Logger.log("Admin-pagina: " + ADMIN_URL);
  Logger.log("--- Persoonlijke stem-links ---");
  getPersonalLinks();
}

// Wijzig het admin-wachtwoord, bv. setAdminPassword("mijnnieuwewachtwoord") uitvoeren.
function setAdminPassword(newPassword) {
  props_().setProperty("ADMIN_PASSWORD", newPassword);
  Logger.log("Admin-wachtwoord bijgewerkt naar: " + newPassword);
}

// Print alle persoonlijke stem-links naar het uitvoeringslogboek (View > Logs).
function getPersonalLinks() {
  var tokens = getTokenMap_();
  var byName = {};
  Object.keys(tokens).forEach(function (t) { byName[tokens[t]] = t; });
  PLAYERS.forEach(function (name) {
    var token = byName[name];
    Logger.log(name + ": " + BASE_URL + "?t=" + token);
  });
}

/* ============================================================
   HELPERS
   ============================================================ */

function props_() { return PropertiesService.getScriptProperties(); }

function getTokenMap_() {
  var raw = props_().getProperty("TOKENS");
  return raw ? JSON.parse(raw) : {};
}

function nameForToken_(token) {
  if (!token) return null;
  var tokens = getTokenMap_();
  return tokens[token] || null;
}

function getCurrentRound_() {
  return Number(props_().getProperty("CURRENT_ROUND") || "1");
}

function checkAdminPassword_(password) {
  var real = props_().getProperty("ADMIN_PASSWORD");
  return !!real && password === real;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Ronde", "Rater"].concat(PLAYERS).concat(["RequestId"]));
    sheet.setFrozenRows(1);
  } else {
    ensureSchema_(sheet);
  }
  return sheet;
}

// Migreert een sheet naar het huidige schema (Timestamp, Ronde, Rater, ...spelers,
// RequestId) zonder data te verliezen, ongeacht van welke eerdere versie je komt.
function ensureSchema_(sheet) {
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (header[1] !== "Ronde") {
    sheet.insertColumnAfter(1);
    sheet.getRange(1, 2).setValue("Ronde");
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var values = [];
      for (var i = 0; i < lastRow - 1; i++) values.push([1]);
      sheet.getRange(2, 2, lastRow - 1, 1).setValues(values);
    }
  }
  var lastCol = sheet.getLastColumn();
  if (sheet.getRange(1, lastCol).getValue() !== "RequestId") {
    sheet.getRange(1, lastCol + 1).setValue("RequestId");
  }
}

function readRows_() {
  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  var rows = [];
  var ridx = 3 + PLAYERS.length;
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    var ratings = {};
    for (var j = 0; j < PLAYERS.length; j++) ratings[PLAYERS[j]] = r[3 + j];
    rows.push({ timestamp: r[0], ronde: Number(r[1]) || 1, rater: r[2], ratings: ratings, requestId: r[ridx] || "" });
  }
  return rows;
}

// Laatste rij per rater; roundFilter (optioneel) beperkt tot één ronde.
function latestPerRater_(rows, roundFilter) {
  var latest = {};
  rows.forEach(function (row) {
    if (roundFilter != null && row.ronde !== roundFilter) return;
    var prev = latest[row.rater];
    if (!prev || new Date(row.timestamp) >= new Date(prev.timestamp)) latest[row.rater] = row;
  });
  return latest;
}

function averageReceived_(latestMap, target) {
  var received = [];
  Object.keys(latestMap).forEach(function (rater) {
    var v = latestMap[rater].ratings[target];
    if (v !== "" && v !== null && v !== undefined) received.push(Number(v));
  });
  var avg = received.length ? received.reduce(function (a, b) { return a + b; }, 0) / received.length : null;
  return { average: avg, count: received.length };
}

/* ============================================================
   HTTP
   ============================================================ */

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// doGet is alleen voor handmatig testen in de browser-adresbalk (handig om een
// deployment te controleren). De site zelf gebruikt voor alles POST via doPost,
// omdat GET-verzoeken via fetch() bij Apps Script Web Apps last hebben van een
// CORS-probleem door de interne redirect (het lukt dan wel bij direct navigeren,
// maar niet vanuit JavaScript).
function doGet(e) {
  var action = e.parameter.action;
  if (action === "vote") return jsonOut_(handleVoteLookup_(e.parameter.token));
  if (action === "admin") return jsonOut_(handleAdmin_(e.parameter.password));
  return jsonOut_({ status: "ok", message: "Rating-app backend draait." });
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  if (data.action === "vote") return jsonOut_(handleVoteLookup_(data.token));
  if (data.action === "admin") return jsonOut_(handleAdmin_(data.password));
  if (data.action === "new_round") return jsonOut_(handleNewRound_(data.password));
  return jsonOut_(handleSubmit_(data));
}

function handleVoteLookup_(token) {
  var name = nameForToken_(token);
  if (!name) return { ok: false, message: "Ongeldige link." };
  var rows = readRows_();
  var latest = latestPerRater_(rows, null)[name]; // laatst bekende stem, ongeacht ronde
  return {
    ok: true,
    name: name,
    ronde: getCurrentRound_(),
    previous: latest ? latest.ratings : null,
    previousAt: latest ? latest.timestamp : null,
  };
}

function handleSubmit_(data) {
  var name = nameForToken_(data.token);
  if (!name) return { status: "error", message: "Ongeldige link." };
  var requestId = data.requestId || "";

  // Idempotent: als deze submit (herkenbaar aan requestId) al eerder is verwerkt
  // -bv. omdat het antwoord van een vorige poging de browser niet op tijd
  // bereikte en de app daarom automatisch opnieuw probeerde- voegen we geen
  // tweede rij toe, maar melden we gewoon succes.
  if (requestId) {
    var already = readRows_().some(function (r) { return r.requestId === requestId; });
    if (already) return { status: "ok" };
  }

  var sheet = getSheet_();
  var row = [new Date(), getCurrentRound_(), name];
  PLAYERS.forEach(function (p) {
    if (p === name) { row.push(""); return; }
    var v = data.ratings ? data.ratings[p] : undefined;
    row.push(v === undefined || v === null || v === "" ? "" : Number(v));
  });
  row.push(requestId);
  sheet.appendRow(row);
  return { status: "ok" };
}

function handleNewRound_(password) {
  if (!checkAdminPassword_(password)) return { ok: false, message: "Verkeerd wachtwoord." };
  var next = getCurrentRound_() + 1;
  props_().setProperty("CURRENT_ROUND", String(next));
  return { ok: true, ronde: next };
}

function handleAdmin_(password) {
  if (!checkAdminPassword_(password)) return { ok: false, message: "Verkeerd wachtwoord." };

  var rows = readRows_();
  var round = getCurrentRound_();
  var latestThisRound = latestPerRater_(rows, round);

  var voted = PLAYERS.filter(function (p) { return !!latestThisRound[p]; });
  var missing = PLAYERS.filter(function (p) { return !latestThisRound[p]; });

  var leaderboard = PLAYERS.map(function (target) {
    var stats = averageReceived_(latestThisRound, target);
    return { name: target, average: stats.average, count: stats.count };
  }).sort(function (a, b) { return (b.average === null ? -1 : b.average) - (a.average === null ? -1 : a.average); });

  var voters = Object.keys(latestThisRound).map(function (rater) {
    return { rater: rater, ratings: latestThisRound[rater].ratings, timestamp: latestThisRound[rater].timestamp };
  });

  var roundsSeen = {};
  rows.forEach(function (r) { roundsSeen[r.ronde] = true; });
  var roundHistory = Object.keys(roundsSeen).map(Number).sort(function (a, b) { return a - b; }).map(function (rnd) {
    var latestForRound = latestPerRater_(rows, rnd);
    var perPlayer = {};
    PLAYERS.forEach(function (target) {
      perPlayer[target] = averageReceived_(latestForRound, target).average;
    });
    return { ronde: rnd, averages: perPlayer };
  });

  return {
    ok: true,
    ronde: round,
    players: PLAYERS,
    voted: voted,
    missing: missing,
    leaderboard: leaderboard,
    voters: voters,
    roundHistory: roundHistory,
  };
}
