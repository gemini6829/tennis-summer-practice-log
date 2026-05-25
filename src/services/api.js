// ============================================================
// API Service — all calls to the Google Apps Script backend
// ============================================================
// After deploying your Google Apps Script as a Web App,
// paste the URL it gives you below.
// ============================================================

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzRnF_wMQIHOjka-1Hp5jFtIF5wUtZmbJ9-902M7hZRovnE3P2Txh4WCvQSDVlobHP/exec';

// Generic POST helper
// Note: Content-Type must be text/plain to avoid CORS preflight
// with Google Apps Script. JSON payload still works fine.
async function post(body) {
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

// Log in by name
export async function loginUser({ name }) {
  return post({ action: 'login', name });
}

// Log a practice session (set override=true to replace an existing log for that date)
export async function logPractice({ name, date, practiceType, hours, override }) {
  return post({ action: 'logPractice', name, date, practiceType, hours, override });
}

// Check whether a member already has a log for a given date
export async function checkLog({ name, date }) {
  return post({ action: 'checkLog', name, date });
}

// Fetch analysis data: percentile rank, weekly hours, and 30-day daily chart data
export async function getAnalysis({ name }) {
  return post({ action: 'getAnalysis', name });
}
