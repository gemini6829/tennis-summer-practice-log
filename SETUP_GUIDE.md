# Tennis Tracker — Setup Guide

Follow these steps in order. The whole setup takes about 15–20 minutes.

---

## PART 1 — Set Up Your Google Sheet & Backend Script

### Step 1: Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **New Spreadsheet**.
2. Name it something like **"Tennis Tracker"**.
3. Copy the **Spreadsheet ID** from the URL:
   - The URL looks like: `https://docs.google.com/spreadsheets/d/`**`1aBcDeFgHiJkLmNoPqRsTuVwXyZ`**`/edit`
   - The bold part between `/d/` and `/edit` is your ID.
4. Keep this tab open — you'll come back to it.

> The script will automatically create two sheets: **"Users"** and **"Practice Logs"** the first time they're needed.

---

### Step 2: Open the Apps Script Editor

1. In your Google Sheet, click the menu: **Extensions → Apps Script**.
2. A new tab opens with a code editor showing a default `myFunction`.

---

### Step 3: Paste in the Backend Code

1. **Delete all** the existing code in the editor.
2. Open the file `google-apps-script/Code.gs` from this project.
3. **Copy all of it** and paste it into the Apps Script editor.
4. Find this line near the top:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
   ```
5. Replace `YOUR_SPREADSHEET_ID` with the ID you copied in Step 1.
6. Click the **💾 Save** button (or press Ctrl+S / Cmd+S).

---

### Step 4: Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
3. Fill in the settings:
   - **Description:** Tennis Tracker API
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Google will ask you to **authorize** the app — click through and allow access.
6. After deploying, you'll see a **Web app URL**. It looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
7. **Copy this URL** — you'll need it in Part 2.

> ⚠️ Any time you change the Code.gs script, you must create a **new deployment** (not update — create new) to apply the changes. Then update the URL in the app.

---

## PART 2 — Set Up the React Native App

### Step 5: Install Prerequisites

If you don't have these installed, install them first:

1. **Node.js** — Download from [nodejs.org](https://nodejs.org) (LTS version).
2. **Expo Go app on your iPhone** — Search "Expo Go" in the App Store and install it.

---

### Step 6: Add Your Script URL to the App

1. Open the file `src/services/api.js` in a text editor.
2. Find this line:
   ```javascript
   const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
   ```
3. Replace the placeholder with the Web App URL you copied in Step 4.
4. Save the file.

---

### Step 7: Install Dependencies & Start the App

Open a **Terminal** (Mac) or **Command Prompt** (Windows), navigate to the `tennis-tracker` folder, and run:

```bash
# Navigate to the project folder
cd path/to/tennis-tracker

# Install all dependencies
npm install

# Start the development server
npx expo start
```

A QR code will appear in your terminal.

---

### Step 8: Open on Your iPhone

1. Open the **Camera app** on your iPhone and point it at the QR code.
2. Tap the notification that appears to open in **Expo Go**.
3. The app will load on your phone!

> Make sure your iPhone and computer are on the **same Wi-Fi network**.

---

## PART 3 — Distributing to Your Team

Once the app is working, your teammates can run it on their phones in one of two ways:

**Option A — Development (easiest, for small teams):**
- Share the QR code with teammates.
- Everyone installs **Expo Go** on their iPhone.
- Open the QR code — they're in!

**Option B — Standalone app (no Expo Go needed):**
- This requires an Apple Developer account ($99/year) and Xcode on a Mac.
- Run `npx eas build --platform ios` and follow the Expo EAS build guide.
- This creates a real `.ipa` file you can share via TestFlight.

---

## How the Data Looks in Google Sheets

### "Users" sheet (columns: Name, Email, Phone, Password, Registered At)
| Name       | Email           | Phone        | Password  | Registered At     |
|------------|-----------------|--------------|-----------|-------------------|
| Alex Jones | alex@email.com  | 5551234567   | tennis123 | 2024-01-15 9:30am |

### "Practice Logs" sheet (columns: Member Name, Date, Practice Type, Hours, Details, Logged At)
| Member Name | Date       | Practice Type   | Hours | Details              | Logged At         |
|-------------|------------|-----------------|-------|----------------------|-------------------|
| Alex Jones  | 2024-01-15 | Private Lesson  | 1.5   | Worked on backhand   | 2024-01-15 6:05pm |

---

## Troubleshooting

**"Connection error" in the app**
- Double-check the URL in `src/services/api.js` matches exactly what Google gave you.
- Make sure the Apps Script is deployed with "Anyone" access.

**Changes to Code.gs not working**
- You must create a **new deployment** after any code changes, and update the URL in the app.

**App won't scan QR code**
- Make sure iPhone and computer are on the same Wi-Fi network.
- Try typing the URL shown in terminal manually into the Expo Go app.

**"Username already taken" on registration**
- Each member must use a unique name. Try first name + last initial (e.g., "AlexJ").
