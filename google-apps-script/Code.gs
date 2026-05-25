// ============================================================
// Tennis Practice Tracker — Google Apps Script Backend v4
// ============================================================
// UPGRADE NOTE: Practice Logs is now a member × date grid.
// Stats tab is now a member × week grid (Mon–Sun).
// If you have an old "Practice Logs" or "Stats" sheet in an
// incompatible format, delete them before redeploying so the
// new structure is built fresh.
//
// After editing: Deploy → New deployment (not Manage),
// then paste the new URL into src/services/api.js line 8.
// ============================================================

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';

// ---- Router ------------------------------------------------

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { action } = data;
    if (action === 'login')       return loginUser(data);
    if (action === 'checkLog')    return checkExistingLog(data);
    if (action === 'logPractice') return logPracticeSession(data);
    if (action === 'getAnalysis') return getAnalysis(data);
    return respond({ success: false, message: 'Unknown action: ' + action });
  } catch (err) {
    return respond({ success: false, message: 'Server error: ' + err.toString() });
  }
}

// ---- Login (coach-managed roster) --------------------------
//
// The coach adds member first names directly to the Users sheet.
// Members type their first name in the app — no self-registration.

function loginUser(data) {
  const { name } = data;
  if (!name || !name.trim())
    return respond({ success: false, message: 'Please enter your name.' });

  const sheet = getOrCreateSheet('Users', ['Name']);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const rName = String(rows[i][0] || '').trim();
    if (rName.toLowerCase() === name.trim().toLowerCase())
      return respond({ success: true, user: { name: rName } });
  }
  return respond({ success: false, message: 'Name not found. Ask your coach to add you to the log.' });
}

// ---- Practice Logs grid (members × dates) ------------------
//
//   Row 1 : "Member / Date" | date1 | date2 | date3 | ...  (chronological)
//   Col A : member1 | member2 | ...
//   Cells : practice summary text
//
// Date headers are stored as plain text (setNumberFormat '@') to prevent
// Google Sheets from auto-converting them to Date objects on read-back.
// Weekend columns are shaded light blue.
// New date columns are inserted in chronological order, not just appended.

function getLogsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Practice Logs');
  if (!sheet) {
    sheet = ss.insertSheet('Practice Logs');
    sheet.getRange(1,1).setValue('Member / Date').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(1);
    sheet.setColumnWidth(1, 160);
  }
  return sheet;
}

function getMemberRow(sheet, name) {
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const names = sheet.getRange(2, 1, last - 1, 1).getValues().flat();
  const idx = names.findIndex(n => n === name);
  return idx >= 0 ? idx + 2 : null;
}

function getOrCreateMemberRow(sheet, name) {
  let row = getMemberRow(sheet, name);
  if (!row) {
    row = Math.max(sheet.getLastRow() + 1, 2);
    sheet.getRange(row, 1).setValue(name).setFontWeight('bold');
  }
  return row;
}

// Google Sheets auto-converts "YYYY-MM-DD" strings to Date objects on read.
// This helper always returns a "YYYY-MM-DD" string (or null for empty/invalid).
function cellToDateStr(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const s = String(val).trim();
  return s || null;
}

function getDateCol(sheet, dateStr) {
  const last = sheet.getLastColumn();
  if (last < 2) return null;
  const dates = sheet.getRange(1, 2, 1, last - 1).getValues()[0];
  const target = String(dateStr).trim();
  const idx = dates.findIndex(d => cellToDateStr(d) === target);
  return idx >= 0 ? idx + 2 : null;
}

// Insert (or find) the column for dateStr, keeping all date columns in
// chronological order.  Uses insertColumnBefore so existing data and
// formatting shift correctly without any re-write.
function getOrCreateDateCol(sheet, dateStr) {
  const col = getDateCol(sheet, dateStr);
  if (col) return col;

  const lastCol = sheet.getLastColumn();
  const target  = String(dateStr).trim();
  let newCol;

  if (lastCol < 2) {
    // No date columns yet
    newCol = 2;
  } else {
    const existingDates = sheet.getRange(1, 2, 1, lastCol - 1).getValues()[0];
    let insertBefore = -1;
    for (let i = 0; i < existingDates.length; i++) {
      const ds = cellToDateStr(existingDates[i]) || '';
      if (target < ds) {
        insertBefore = i + 2; // 1-based sheet column
        break;
      }
    }

    if (insertBefore === -1) {
      // dateStr is >= all existing dates — append at right
      newCol = lastCol + 1;
    } else {
      // Shift later columns right so dateStr lands in sorted position
      sheet.insertColumnBefore(insertBefore);
      newCol = insertBefore;
    }
  }

  const hCell = sheet.getRange(1, newCol);
  hCell.setNumberFormat('@');   // keep as plain text
  hCell.setValue(dateStr).setFontWeight('bold');
  sheet.setColumnWidth(newCol, 140);

  // Google Sheets inherits the background of the left-neighbour column when
  // inserting.  Always clear first so a non-weekend column next to a
  // weekend column doesn't accidentally pick up the blue shading.
  const colRows = Math.max(sheet.getLastRow(), 50);
  sheet.getRange(1, newCol, colRows, 1).setBackground(null);

  // Now apply weekend shading only where it actually belongs (0 = Sun, 6 = Sat)
  const parsedDate = new Date(target + 'T12:00:00');
  const dow = isNaN(parsedDate.getTime()) ? -1 : parsedDate.getDay();
  if (dow === 0 || dow === 6) {
    sheet.getRange(1, newCol, colRows, 1).setBackground('#BBDEFB');
  }

  return newCol;
}

function checkExistingLog(data) {
  const { name, date } = data;
  const sheet = getLogsSheet();
  const memberRow = getMemberRow(sheet, name);
  if (!memberRow) return respond({ success: true, exists: false });
  const dateCol = getDateCol(sheet, date);
  if (!dateCol) return respond({ success: true, exists: false });
  const val = sheet.getRange(memberRow, dateCol).getValue();
  return respond({ success: true, exists: val !== '' && val != null });
}

function logPracticeSession(data) {
  const { name, date, practiceType, hours, details, override } = data;
  const sheet = getLogsSheet();
  const memberRow = getOrCreateMemberRow(sheet, name);

  // Reject duplicates unless override flag is set
  if (!override) {
    const existCol = getDateCol(sheet, date);
    if (existCol) {
      const existing = sheet.getRange(memberRow, existCol).getValue();
      if (existing !== '' && existing != null)
        return respond({ success: false, duplicate: true,
          message: 'You already have a log for this date.' });
    }
  }

  // getOrCreateDateCol may insert a column, shifting later columns right.
  // Always call it AFTER the duplicate check (which uses getDateCol, not index).
  const dateCol = getOrCreateDateCol(sheet, date);
  const content = practiceType || '—';

  const cell = sheet.getRange(memberRow, dateCol);
  cell.setValue(content).setWrap(true).setVerticalAlignment('top');

  updateStats();
  return respond({ success: true, message: 'Practice logged!',
    totalHours: parseFloat(hours) || 0 });
}

// ---- Stats tab (Member × Week grid) ------------------------
//
//   Row 1 : "Member" | "May 19–25, 2026" | "May 26 – Jun 1, 2026" | ...
//   Col A : member names
//   Cells : total hours that member practiced in that Mon–Sun week
//
// The entire sheet is rebuilt from Practice Logs on every log submission
// so it is always accurate and in chronological order.

function updateStats() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let stats = ss.getSheetByName('Stats');
  if (!stats) stats = ss.insertSheet('Stats');

  const logs      = getLogsSheet();
  const lastLogCol = logs.getLastColumn();
  const lastLogRow = logs.getLastRow();

  if (lastLogCol < 2 || lastLogRow < 2) return;

  // All date strings from the Practice Logs header row
  const rawDates = logs.getRange(1, 2, 1, lastLogCol - 1).getValues()[0];
  const allDates = rawDates.map(d => cellToDateStr(d)); // null if invalid

  // All member names (rows 2+)
  const allNames = logs.getRange(2, 1, lastLogRow - 1, 1).getValues()
    .flat().filter(n => n !== '');

  if (!allNames.length) return;

  // Collect all distinct week-start dates (Monday's "YYYY-MM-DD")
  const weekSet = new Set();
  allDates.forEach(ds => {
    if (!ds) return;
    const d = new Date(ds + 'T12:00:00');
    if (!isNaN(d.getTime())) weekSet.add(getWeekStart(d).toISOString().slice(0, 10));
  });
  const weeks = Array.from(weekSet).sort(); // chronological

  if (!weeks.length) return;

  // Build header row: "Member" then one column per week
  const headerRow = ['Member', ...weeks.map(w => formatWeekHeader(w))];

  // Build data rows: for each member, sum hours per week
  const dataRows = allNames.map(name => {
    const mRow = getMemberRow(logs, name);
    const weekHours = {};

    if (mRow) {
      const rowData = logs.getRange(mRow, 2, 1, lastLogCol - 1).getValues()[0];
      for (let i = 0; i < allDates.length; i++) {
        const ds = allDates[i];
        if (!ds) continue;
        const d = new Date(ds + 'T12:00:00');
        if (isNaN(d.getTime())) continue;
        const wk = getWeekStart(d).toISOString().slice(0, 10);
        weekHours[wk] = (weekHours[wk] || 0) +
          extractTotalHours(String(rowData[i] || ''));
      }
    }

    return [name, ...weeks.map(w => Math.round((weekHours[w] || 0) * 10) / 10)];
  });

  // Write everything (clear first so stale columns are removed)
  stats.clearContents();
  const allRows  = [headerRow, ...dataRows];
  const numCols  = headerRow.length;
  const numRows  = allRows.length;
  stats.getRange(1, 1, numRows, numCols).setValues(allRows);
  stats.getRange(1, 1, 1, numCols).setFontWeight('bold');
  stats.setFrozenRows(1);
  stats.setFrozenColumns(1);
  stats.setColumnWidth(1, 160);
  for (let c = 2; c <= numCols; c++) stats.setColumnWidth(c, 110);
}

// Format a week's Monday date string as "MMM D–D, YYYY" or "MMM D – MMM D, YYYY"
function formatWeekHeader(mondayStr) {
  const monday = new Date(mondayStr + 'T12:00:00');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
  const mMon = months[monday.getMonth()];
  const mSun = months[sunday.getMonth()];
  const yMon = monday.getFullYear();
  const ySun = sunday.getFullYear();

  if (yMon !== ySun)
    return `${mMon} ${monday.getDate()}, ${yMon} – ${mSun} ${sunday.getDate()}, ${ySun}`;
  if (mMon === mSun)
    return `${mMon} ${monday.getDate()}–${sunday.getDate()}, ${yMon}`;
  return `${mMon} ${monday.getDate()} – ${mSun} ${sunday.getDate()}, ${yMon}`;
}

// ---- Analysis endpoint -------------------------------------

function getAnalysis(data) {
  const { name } = data;
  const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
  const logs = ss.getSheetByName('Practice Logs');
  const empty = { success: true, memberDailyData: [], percentile: 0, weeklyHours: 0 };
  if (!logs || logs.getLastColumn() < 2) return respond(empty);

  const lastCol   = logs.getLastColumn();
  const lastRow   = logs.getLastRow();
  const dates     = logs.getRange(1, 2, 1, lastCol - 1).getValues()[0];
  const today     = new Date();
  const thirtyAgo = new Date(today); thirtyAgo.setDate(today.getDate() - 29);

  // Week window: Monday 00:00:00 → Sunday 23:59:59
  // Using 23:59:59 on weekEnd is critical — practice dates are stored at noon
  // so midnight Sunday would exclude Sunday logs entirely.
  const weekStart = getWeekStart(today);
  const weekEnd   = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const allNames = lastRow >= 2
    ? logs.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(n => n !== '')
    : [];

  // Weekly hours per member (for percentile)
  const weeklyMap = {};
  for (const mName of allNames) {
    const mRow = getMemberRow(logs, mName);
    if (!mRow) continue;
    const row = logs.getRange(mRow, 2, 1, lastCol - 1).getValues()[0];
    let wh = 0;
    for (let i = 0; i < dates.length; i++) {
      const ds = cellToDateStr(dates[i]);
      if (!ds) continue;
      const d = new Date(ds + 'T12:00:00');
      if (isNaN(d.getTime())) continue;
      if (d >= weekStart && d <= weekEnd)
        wh += extractTotalHours(String(row[i] || ''));
    }
    weeklyMap[mName] = wh;
  }

  const myHours    = weeklyMap[name] || 0;
  const allHours   = Object.values(weeklyMap);
  const lessCount  = allHours.filter(h => h < myHours).length;
  const percentile = allHours.length > 1
    ? Math.round(lessCount / (allHours.length - 1) * 100) : 100;

  // Per-day data for line graph (last 30 days)
  const memberRow       = getMemberRow(logs, name);
  const memberDailyData = [];
  if (memberRow) {
    const row = logs.getRange(memberRow, 2, 1, lastCol - 1).getValues()[0];
    for (let i = 0; i < dates.length; i++) {
      const ds = cellToDateStr(dates[i]);
      if (!ds) continue;
      const d = new Date(ds + 'T12:00:00');
      if (isNaN(d.getTime())) continue;
      if (d >= thirtyAgo && d <= today) {
        const cell = String(row[i] || '');
        memberDailyData.push({
          date: ds,
          hours: extractTotalHours(cell),
          hasTournament: extractTournamentHours(cell) > 0,
        });
      }
    }
    memberDailyData.sort((a, b) => a.date.localeCompare(b.date));
  }

  return respond({ success: true, memberDailyData, percentile, weeklyHours: myHours });
}

// ---- Helpers -----------------------------------------------

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

function getColumnValues(sheet, col) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, col, last - 1, 1).getValues().flat().filter(v => v !== '');
}

// Returns the Monday of the week containing `date`, at 00:00:00.
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

// Sum all hour values in a cell string.
// Handles both the new inline format ("1 hr coach rachel, 3 hrs ata")
// and the old parenthesised format ("Private Lesson (2 hrs)") for
// backward compatibility with any existing cells.
function extractTotalHours(cell) {
  if (!cell) return 0;
  return [...cell.matchAll(/\b(\d+\.?\d*)\s*hrs?\b/g)]
    .reduce((s, m) => s + parseFloat(m[1]), 0);
}

// Extract tournament hours specifically.
function extractTournamentHours(cell) {
  if (!cell) return 0;
  const m = cell.match(/Tournament\s*\((\d+\.?\d*)\s*hrs?\)/);
  return m ? parseFloat(m[1]) : 0;
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
