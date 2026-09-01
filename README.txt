Spark Academy Multiplication Challenge - Current Code Package

Files:
- index.html: main student website
- styles.css: visual styling
- app.js: front-end logic, JSONP connection to Google Apps Script, local dashboard, badges
- Code.gs: Google Apps Script backend for Settings, Roster, Scores, Attempts, and roster import

What this version does:
- Students sign in with Star Card ID.
- The Star Card ID saves locally on the device.
- Students complete 50 unique multiplication facts from 0x0 through 10x10.
- Teacher-controlled timer comes from Google Sheet Settings tab.
- Allowed time limits: 60, 90, 120, 150, 180, 210, 240, 270, 300 seconds.
- Students get results, percent, time used, correct answers, and badges.
- Student dashboard remains local for now.
- Scores export to Google Sheets using Google Apps Script.
- Scores tab stores one row per Star Card Number with Attempt 1 Score/Time, Attempt 2 Score/Time, etc.
- Attempts tab stores a behind-the-scenes log.
- Unknown Star Card IDs are still recorded and flagged.
- Roster can be imported from MasterRoster2627 while preserving manually entered Star Card Numbers.

Important deployment note:
After changing Code.gs, saving is not enough. In Apps Script, go to Deploy > Manage deployments > Edit pencil > Version: New version > Deploy.

Important GitHub note:
After changing index.html, styles.css, app.js, or spark-logo.png, commit/upload the changes to GitHub. Then hard refresh the live site.

Direct backend tests:
1. Basic test:
   WEB_APP_URL
2. Settings test:
   WEB_APP_URL?action=getSettings
3. Score test:
   WEB_APP_URL?action=submitScore&starCardNumber=TEST123&score=42&timeUsedSeconds=155&timeLimitSeconds=180&completedBeforeTime=true

If the site still uses 3:00 after changing Settings, first test WEB_APP_URL?action=getSettings.
If that test does not show the new timer, redeploy the Apps Script as a new version.
