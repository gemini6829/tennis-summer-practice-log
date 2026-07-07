# Summer Practice Log 2026 — Setup Guide

Follow these steps in order. The whole setup takes about 15–20 minutes.

---

## PART 1 — Google Sheet & Backend (Required for Both Versions)

### Step 1: Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **New Spreadsheet**.
2. Name it something like **"Summer Practice Log 2026"**.
3. Copy the **Spreadsheet ID** from the URL:
   - The URL looks like: `https://docs.google.com/spreadsheets/d/`**`1aBcDeFgHiJkLmNoPqRsTuVwXyZ`**`/edit`
   - The bold part between `/d/` and `/edit` is your ID.
4. Keep this tab open — you'll come back to it.

---

### Step 2: Open the Apps Script Editor

1. In your Google Sheet, click **Extensions → Apps Script**.
2. A new tab opens with a code editor.

---

### Step 3: Paste the Backend Code

1. Delete all existing code in the editor.
2. Open `google-apps-script/Code.gs` from this project and copy all of it.
3. Paste it into the Apps Script editor.
4. Find this line near the top:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
   ```
5. Replace `YOUR_SPREADSHEET_ID` with the ID you copied in Step 1.
6. Save (Ctrl+S / Cmd+S).

---

### Step 4: Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set the following:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** and authorize when prompted.
5. Copy the **Web app URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

> **Important:** Any time you edit `Code.gs`, you must create a **new deployment** (not update existing) and replace the URL in both versions.

---

### Step 5: Add Members to the Roster

1. In your Google Sheet, open the **Users** tab (created automatically on first login).
2. Add each member's first name in column A, one per row.
3. Members log in using exactly this name — spelling and capitalisation must match.

> If two members share a first name, add a last initial for both (e.g. "Alex J" and "Alex T").

---

## PART 2 — Web Version (`web/`)

### Step 6: Add the Script URL

1. Open `web/index.html` in a text editor.
2. Near the top of the `<script>` block, find:
   ```javascript
   const API_URL = '...';
   ```
3. Replace the URL with the one you copied in Step 4.
4. Save the file.

---

### Step 7: Deploy to Netlify

1. Go to [netlify.com/drop](https://netlify.com/drop).
2. Drag and drop `web/index.html` onto the page.
3. Netlify gives you a URL instantly — share this with your team.

To update the site later (e.g. after a new Apps Script deployment), drag and drop the updated file onto your site's Netlify dashboard.

---

## PART 3 — App Version (`app/`)

### Step 8: Install Prerequisites

- **Node.js** — Download from [nodejs.org](https://nodejs.org) (LTS version).
- **Expo Go** — Install from the App Store on the team's iPhones.

---

### Step 9: Add the Script URL

1. Open `app/src/services/api.js` in a text editor.
2. Find:
   ```javascript
   const SCRIPT_URL = '...';
   ```
3. Replace the URL with the one you copied in Step 4.
4. Save the file.

---

### Step 10: Install Dependencies & Start the App

Open a Terminal, navigate to the `app/` folder, and run:

```bash
cd path/to/TennisProject/app
npm install
npx expo start
```

A QR code will appear in your terminal.

---

### Step 11: Open on iPhone

1. Open the **Camera app** and point it at the QR code.
2. Tap the notification to open in **Expo Go**.

> Your iPhone and computer must be on the **same Wi-Fi network**.

---

### Distributing the App to the Team

**Option A — Easiest (requires Expo Go):**
Share the QR code. Teammates install Expo Go and scan it.

**Option B — Standalone app (no Expo Go needed):**
Requires an Apple Developer account ($99/year). Run `npx eas build --platform ios` and distribute via TestFlight.

---

## How Data Is Stored in Google Sheets

### Users tab
| Name  |
|-------|
| Alex  |
| Jamie |

### Practice Logs tab
A grid with members as rows and dates as columns. Each cell contains that member's practice summary for that day, e.g.:
```
1 hr coach rachel, 2 hrs ata, School Practice
```

### Stats tab
A grid with members as rows and weeks (Mon–Sun) as columns. Rebuilt automatically every hour. Shows total hours per member per week.

---

## Troubleshooting

**"Name not found" on login**
- Check that the name in the Users sheet matches exactly what the member typed (spelling and capitalisation).

**"Connection error"**
- Confirm the URL in `api.js` / `index.html` matches the deployed Web App URL exactly.
- Confirm the Apps Script is deployed with "Who has access: Anyone".

**Code.gs changes not taking effect**
- You must create a **new deployment** after any code change — editing an existing deployment does not update the live URL.

**App won't load from QR code**
- Make sure your iPhone and computer are on the same Wi-Fi network.
- Try entering the URL shown in the terminal manually in the Expo Go app.
