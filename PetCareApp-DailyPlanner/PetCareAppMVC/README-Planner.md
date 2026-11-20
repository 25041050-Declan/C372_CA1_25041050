# Daily Care Planner
Use Node.js 20+ and MySQL 8. In a fresh database, run db.sql, db-lesson08-extension.sql, then planner.sql in MySQL Workbench. If the original app and booking tables already exist, run only planner.sql. Do not rerun the base setup on a database containing work you want to keep.

Open this folder in VS Code. In PowerShell set your local MySQL password with `$env:DB_PASSWORD = Read-Host 'MySQL password'` (and set DB_USER if you do not use root). Run `npm ci`, then `node app.js`. Open http://localhost:3000, sign up or log in, add a pet, and select Daily Care Planner. Dates and times use Singapore time.
