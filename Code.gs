const SHEET_NAMES = {
  SETTINGS: "Settings",
  ROSTER: "Roster",
  SCORES: "Scores",
  ATTEMPTS: "Attempts"
};

const VALID_TIME_LIMITS = [60, 90, 120, 150, 180, 210, 240, 270, 300];

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const settings = getOrCreateSheet_(ss, SHEET_NAMES.SETTINGS);
  const roster = getOrCreateSheet_(ss, SHEET_NAMES.ROSTER);
  const scores = getOrCreateSheet_(ss, SHEET_NAMES.SCORES);
  const attempts = getOrCreateSheet_(ss, SHEET_NAMES.ATTEMPTS);

  setupSettingsSheet_(settings);

  setHeaders_(roster, [
    "Star Card Number",
    "Student ID",
    "Last Name",
    "First Name",
    "Homeroom"
  ]);

  setHeaders_(scores, [
    "Star Card Number",
    "Student ID",
    "Last Name",
    "First Name",
    "Homeroom",
    "Flag"
  ]);

  setHeaders_(attempts, [
    "Timestamp",
    "Star Card Number",
    "Student ID",
    "Last Name",
    "First Name",
    "Homeroom",
    "Known Student",
    "Score",
    "Time Used Seconds",
    "Time Used",
    "Time Limit Seconds",
    "Time Limit",
    "Completed Before Time"
  ]);

  [settings, roster, scores, attempts].forEach(formatSheet_);

  SpreadsheetApp.getUi().alert(
    "Sheets are set up! Add your roster to the Roster tab. Change the timer in the Settings tab."
  );
}

function doGet(e) {
  try {
    const action = e.parameter.action || "test";
    const callback = e.parameter.callback;

    let result;

    if (action === "getSettings") {
      result = getSettings_();
    } else if (action === "submitScore") {
      result = submitScore_(e.parameter);
    } else {
      result = {
        ok: true,
        message: "Spark Academy Multiplication Challenge backend is working."
      };
    }

    if (callback) {
      return ContentService
        .createTextOutput(`${callback}(${JSON.stringify(result)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return jsonResponse_(result);

  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: String(err)
    });
  }
}

function getSettings_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist_(ss);

  const settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  const values = settingsSheet.getDataRange().getValues();

  let timeLimitSeconds = 180;

  for (let i = 1; i < values.length; i++) {
    const setting = String(values[i][0]).trim();
    const value = Number(values[i][1]);

    if (setting === "timeLimitSeconds") {
      timeLimitSeconds = value;
      break;
    }
  }

  if (!VALID_TIME_LIMITS.includes(timeLimitSeconds)) {
    timeLimitSeconds = 180;
  }

  return {
    ok: true,
    timeLimitSeconds,
    timeLimitFormatted: formatSeconds_(timeLimitSeconds)
  };
}

function submitScore_(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist_(ss);

  const starCardNumber = String(params.starCardNumber || params.starCardId || "").trim();

  if (!starCardNumber) {
    return {
      ok: false,
      error: "Missing Star Card Number."
    };
  }

  const score = Number(params.score);
  const timeUsedSeconds = Number(params.timeUsedSeconds || 0);
  const timeLimitSeconds = Number(params.timeLimitSeconds || getSettings_().timeLimitSeconds);
  const completedBeforeTime = String(params.completedBeforeTime || "").toLowerCase() === "true";

  if (Number.isNaN(score) || score < 0 || score > 50) {
    return {
      ok: false,
      error: "Invalid score."
    };
  }

  const rosterMatch = findRosterStudent_(ss, starCardNumber);
  const knownStudent = rosterMatch ? "YES" : "NO";

  const studentRow = rosterMatch || {
    starCardNumber,
    studentId: "",
    lastName: "",
    firstName: "",
    homeroom: "",
    flag: "UNKNOWN STAR CARD ID"
  };

  appendAttempt_(ss, {
    timestamp: new Date(),
    starCardNumber,
    studentId: studentRow.studentId,
    lastName: studentRow.lastName,
    firstName: studentRow.firstName,
    homeroom: studentRow.homeroom,
    knownStudent,
    score,
    timeUsedSeconds,
    timeLimitSeconds,
    completedBeforeTime
  });

  appendScoreAcrossRow_(ss, {
    starCardNumber,
    studentId: studentRow.studentId,
    lastName: studentRow.lastName,
    firstName: studentRow.firstName,
    homeroom: studentRow.homeroom,
    flag: knownStudent === "YES" ? "" : "UNKNOWN STAR CARD ID",
    score,
    timeUsedSeconds
  });

  return {
    ok: true,
    message: "Score saved.",
    knownStudent,
    starCardNumber,
    score,
    timeUsedSeconds,
    timeUsedFormatted: formatSeconds_(timeUsedSeconds)
  };
}

function appendAttempt_(ss, attempt) {
  const sheet = ss.getSheetByName(SHEET_NAMES.ATTEMPTS);

  sheet.appendRow([
    attempt.timestamp,
    attempt.starCardNumber,
    attempt.studentId,
    attempt.lastName,
    attempt.firstName,
    attempt.homeroom,
    attempt.knownStudent,
    attempt.score,
    attempt.timeUsedSeconds,
    formatSeconds_(attempt.timeUsedSeconds),
    attempt.timeLimitSeconds,
    formatSeconds_(attempt.timeLimitSeconds),
    attempt.completedBeforeTime ? "YES" : "NO"
  ]);
}

function appendScoreAcrossRow_(ss, data) {
  const sheet = ss.getSheetByName(SHEET_NAMES.SCORES);

  ensureScoreHeaders_(sheet);

  let rowNumber = findScoreRow_(sheet, data.starCardNumber);

  if (!rowNumber) {
    rowNumber = sheet.getLastRow() + 1;
  }

  sheet.getRange(rowNumber, 1, 1, 6).setValues([[
    data.starCardNumber,
    data.studentId,
    data.lastName,
    data.firstName,
    data.homeroom,
    data.flag
  ]]);

  const nextScoreCol = findNextScoreColumn_(sheet, rowNumber);
  const attemptNumber = Math.floor((nextScoreCol - 7) / 2) + 1;

  ensureAttemptPairHeaders_(sheet, attemptNumber, nextScoreCol);

  sheet.getRange(rowNumber, nextScoreCol).setValue(data.score);
  sheet.getRange(rowNumber, nextScoreCol + 1).setValue(formatSeconds_(data.timeUsedSeconds));

  formatSheet_(sheet);
}

function findNextScoreColumn_(sheet, rowNumber) {
  const firstAttemptCol = 7;
  const lastColumn = Math.max(sheet.getLastColumn(), firstAttemptCol);
  const width = lastColumn - firstAttemptCol + 1;
  const values = sheet.getRange(rowNumber, firstAttemptCol, 1, width).getValues()[0];

  for (let i = 0; i < values.length; i += 2) {
    const scoreCell = values[i];

    if (scoreCell === "" || scoreCell === null) {
      return firstAttemptCol + i;
    }
  }

  return firstAttemptCol + values.length;
}

function ensureScoreHeaders_(sheet) {
  const neededHeaders = [
    "Star Card Number",
    "Student ID",
    "Last Name",
    "First Name",
    "Homeroom",
    "Flag"
  ];

  const currentHeaders = sheet.getRange(1, 1, 1, 6).getValues()[0];

  let needsUpdate = false;

  for (let i = 0; i < neededHeaders.length; i++) {
    if (currentHeaders[i] !== neededHeaders[i]) {
      needsUpdate = true;
      break;
    }
  }

  if (needsUpdate) {
    sheet.getRange(1, 1, 1, neededHeaders.length).setValues([neededHeaders]);
    sheet.setFrozenRows(1);
  }
}

function ensureAttemptPairHeaders_(sheet, attemptNumber, scoreCol) {
  sheet.getRange(1, scoreCol).setValue(`Attempt ${attemptNumber} Score`);
  sheet.getRange(1, scoreCol + 1).setValue(`Attempt ${attemptNumber} Time`);
}

function findScoreRow_(sheet, starCardNumber) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return null;

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(starCardNumber).trim()) {
      return i + 2;
    }
  }

  return null;
}

function findRosterStudent_(ss, starCardNumber) {
  const rosterSheet = ss.getSheetByName(SHEET_NAMES.ROSTER);
  const rows = getDataRows_(rosterSheet);

  for (const row of rows) {
    if (String(row[0]).trim() === String(starCardNumber).trim()) {
      return {
        starCardNumber: String(row[0]).trim(),
        studentId: row[1] || "",
        lastName: row[2] || "",
        firstName: row[3] || "",
        homeroom: row[4] || "",
        flag: ""
      };
    }
  }

  return null;
}

function importRosterFromMasterRoster2627() {
  const SOURCE_SPREADSHEET_ID = "1J4ahdFT6zSIdTOuBQ917YdMxJKaoo2ogS1bWo47xiso";
  const SOURCE_SHEET_NAME = "MasterRoster2627";
  const DESTINATION_SHEET_NAME = "Roster";

  const destinationSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);

  const sourceSheet = sourceSpreadsheet.getSheetByName(SOURCE_SHEET_NAME);
  if (!sourceSheet) {
    throw new Error(`Could not find source tab named "${SOURCE_SHEET_NAME}".`);
  }

  let destinationSheet = destinationSpreadsheet.getSheetByName(DESTINATION_SHEET_NAME);
  if (!destinationSheet) {
    destinationSheet = destinationSpreadsheet.insertSheet(DESTINATION_SHEET_NAME);
  }

  const existingStarCardsByStudentId = {};
  const existingValues = destinationSheet.getDataRange().getValues();

  if (existingValues.length > 1) {
    for (let i = 1; i < existingValues.length; i++) {
      const row = existingValues[i];
      const starCardNumber = String(row[0] || "").trim();
      const studentId = String(row[1] || "").trim();

      if (studentId && starCardNumber) {
        existingStarCardsByStudentId[studentId] = starCardNumber;
      }
    }
  }

  const sourceValues = sourceSheet.getDataRange().getValues();

  if (sourceValues.length < 2) {
    throw new Error("Source roster has no student rows.");
  }

  const output = [
    ["Star Card Number", "Student ID", "Last Name", "First Name", "Homeroom"]
  ];

  for (let i = 1; i < sourceValues.length; i++) {
    const row = sourceValues[i];

    const lasid = String(row[0] || "").trim();
    const firstName = String(row[1] || "").trim();
    const lastName = String(row[2] || "").trim();
    const homeroom = String(row[3] || "").trim();
    const droppedRaw = String(row[4] || "").trim().toLowerCase();

    if (!lasid && !firstName && !lastName) {
      continue;
    }

    const isDropped =
      droppedRaw === "true" ||
      droppedRaw === "yes" ||
      droppedRaw === "y" ||
      droppedRaw === "1" ||
      droppedRaw === "dropped";

    if (isDropped) {
      continue;
    }

    const existingStarCardNumber = existingStarCardsByStudentId[lasid] || "";

    output.push([
      existingStarCardNumber,
      lasid,
      lastName,
      firstName,
      homeroom
    ]);
  }

  destinationSheet.clear();
  destinationSheet.getRange(1, 1, output.length, output[0].length).setValues(output);
  destinationSheet.setFrozenRows(1);

  destinationSheet
    .getRange(1, 1, 1, output[0].length)
    .setFontWeight("bold")
    .setBackground("#12355b")
    .setFontColor("#ffffff");

  destinationSheet.autoResizeColumns(1, output[0].length);

  SpreadsheetApp.getUi().alert(
    `Imported ${output.length - 1} active students into the Roster tab. Existing Star Card Numbers were preserved.`
  );
}

function setupSettingsSheet_(sheet) {
  sheet.clear();

  sheet.getRange(1, 1, 1, 3).setValues([[
    "setting",
    "value",
    "notes"
  ]]);

  sheet.getRange(2, 1, 1, 3).setValues([[
    "timeLimitSeconds",
    180,
    "Allowed values: 60, 90, 120, 150, 180, 210, 240, 270, 300"
  ]]);

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(VALID_TIME_LIMITS.map(String), true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(2, 2).setDataValidation(rule);
  sheet.setFrozenRows(1);
}

function ensureSheetsExist_(ss) {
  const settings = getOrCreateSheet_(ss, SHEET_NAMES.SETTINGS);
  const roster = getOrCreateSheet_(ss, SHEET_NAMES.ROSTER);
  const scores = getOrCreateSheet_(ss, SHEET_NAMES.SCORES);
  const attempts = getOrCreateSheet_(ss, SHEET_NAMES.ATTEMPTS);

  if (settings.getLastRow() === 0) {
    setupSettingsSheet_(settings);
  }

  if (roster.getLastRow() === 0) {
    setHeaders_(roster, [
      "Star Card Number",
      "Student ID",
      "Last Name",
      "First Name",
      "Homeroom"
    ]);
  }

  if (scores.getLastRow() === 0) {
    setHeaders_(scores, [
      "Star Card Number",
      "Student ID",
      "Last Name",
      "First Name",
      "Homeroom",
      "Flag"
    ]);
  }

  if (attempts.getLastRow() === 0) {
    setHeaders_(attempts, [
      "Timestamp",
      "Star Card Number",
      "Student ID",
      "Last Name",
      "First Name",
      "Homeroom",
      "Known Student",
      "Score",
      "Time Used Seconds",
      "Time Used",
      "Time Limit Seconds",
      "Time Limit",
      "Completed Before Time"
    ]);
  }
}

function getOrCreateSheet_(ss, name) {
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  return sheet;
}

function setHeaders_(sheet, headers) {
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
}

function formatSheet_(sheet) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn > 0) {
    sheet.getRange(1, 1, 1, lastColumn)
      .setFontWeight("bold")
      .setBackground("#12355b")
      .setFontColor("#ffffff");

    sheet.autoResizeColumns(1, lastColumn);
  }
}

function getDataRows_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn < 1) {
    return [];
  }

  return sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatSeconds_(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
