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

Required deployment access settings:
The deployment must be set to "Execute as: Me" and "Who has access: Anyone" (not
"Anyone with Google account"). Students load the site anonymously from GitHub Pages,
so if access is restricted to Google accounts, both the Settings timer and score
saving will silently fail. This is the most common cause of "the site still shows
3:00" or "my score didn't save."

Important GitHub note:
After changing index.html, styles.css, app.js, or spark-logo.png, commit/upload the changes to GitHub. Then hard refresh the live site.
spark-logo.png must be committed to the same folder as index.html - it is not
included in this code package and will show as a broken image if missing.

Cross-device student dashboard:
"View My Dashboard" now asks the Apps Script backend for that Star Card ID's full
attempt history (action=getHistory) instead of relying only on the device's local
storage. This means a student can enter their Star Card ID on any computer and see
their real best score, best 50/50 time, score history chart, and most-missed facts.
If the server can't be reached, the dashboard falls back to whatever is saved on
that device and shows a small note that it's showing local-only data.
Note: because there is still no login/password, anyone who knows a Star Card ID can
view that student's dashboard from any device. This matches the existing design
(no authentication anywhere in the app) but is worth knowing as a trade-off.
Note: the "3 attempts" / "10 attempts" streak badges are still based on attempts
made on the current device only, not the student's full cross-device history.

Fact-family practice drills:
Buttons for "2s" through "10s" appear on the home screen, below Start
Challenge / View My Dashboard / Change Star Card ID, but ONLY for the
families a teacher has turned on. Each one is an 80-question, 3-minute
(teacher-adjustable) drill that only uses facts involving that number, e.g.
"2s" only draws from 2x0-2x10 and 0x2-10x2 (21 unique facts total). Since 80
questions is more than the 21 available facts, repeats are unavoidable and
intentional here (unlike the main 50-question challenge) - the app spreads
them as evenly as possible and avoids placing the same fact twice in a row.

Fact-family drills now have their own tabs (named "2s" through "10s") in the
Google Sheet - one row per attempt, same layout as the Attempts tab. They are
separate from the main challenge's Scores/Attempts tabs and don't count
toward badges; only the main 50-question challenge earns badges.

Each family's personal-best score (and, on ties, fastest time) shows in a
"Fact Family Records" section at the bottom of the student dashboard, e.g.
"2s record: 60/80 in 2:30" - only for families the student has actually
attempted at least once. This section appears on the dashboard even if the
student hasn't taken the main 50-question challenge yet, since it's tracked
independently.

Controlling fact-family drills from the Settings tab:
- factFamilyTimeLimitSeconds: time limit for all fact-family drills (shared
  across all of them, separate from the main challenge's timeLimitSeconds).
  Same allowed values: 60, 90, 120, 150, 180, 210, 240, 270, 300.
- show2s, show3s, ... show10s: set to TRUE to make that family's button
  visible to students, FALSE to hide it. All default to FALSE, so nothing
  shows up until a teacher turns it on.
These rows are added automatically to your existing Settings tab, and the
"2s"-"10s" sheet tabs are created automatically, the next time any request
reaches the backend (no need to run setupSheets again).

Scores tab column order:
The Scores tab now inserts each new attempt into the leftmost attempt column
(column G), pushing that student's older attempts to the right. Headers are
labeled by recency - "Most Recent Score/Time", "2nd Most Recent Score/Time",
"3rd Most Recent Score/Time", and so on - since a column's slot position now
reflects recency rather than a fixed attempt number.

One-time step after updating to this version:
If you already have students with 2+ attempts saved from before this change,
run migrateScoresToNewestFirst() once from the Apps Script editor (select it
from the function dropdown, then click Run). This reorders each existing
row's older attempts to match the new newest-first layout. It's safe to run
more than once. New submissions from that point on will insert correctly
without needing to run it again.
- Score submissions are now protected by a server-side lock (LockService), so
  many students submitting at the exact same moment (e.g. everyone's timer running
  out together) can no longer overwrite each other's row in the Scores tab.
- The JSONP request timeout was increased from 10 to 20 seconds to tolerate Apps
  Script "cold start" delays right after a redeploy.
- The Attempts tab now has a "Missed Facts" column. Existing sheets are migrated
  automatically the next time a score is submitted - no manual setup needed.

Direct backend tests:
1. Basic test:
   WEB_APP_URL
2. Settings test:
   WEB_APP_URL?action=getSettings
3. Score test:
   WEB_APP_URL?action=submitScore&starCardNumber=TEST123&score=42&timeUsedSeconds=155&timeLimitSeconds=180&completedBeforeTime=true
4. History test (used by the student dashboard):
   WEB_APP_URL?action=getHistory&starCardNumber=TEST123

If the site still uses 3:00 after changing Settings, first test WEB_APP_URL?action=getSettings.
If that test does not show the new timer, redeploy the Apps Script as a new version.
