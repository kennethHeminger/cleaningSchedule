# Cleaning Schedule App

A lightweight web app for managing and assigning cleaners to units across a weekly schedule. Built with **FastAPI**, server-rendered HTML via **Jinja2**, and vanilla JavaScript on the frontend.

## Features

- **Weekly schedule grid** — view and manage cleaner assignments per unit, per day.
- **Assign cleaners** — click a day cell to open a popup and assign a cleaner from a dropdown list.
- **Mark as Back-to-Back (B2B)** — flag a unit/day as needing a same-day turnover clean.
- **Mark as Vacant** — flag a unit/day as vacant, allowing a cleaner to enter at any time that day.
- **Needs Cleaning** — mark a unit/day as needing cleaning without assigning a specific cleaner yet.
- **Clear assignments** — remove an assignment for a specific unit/day.
- **Add/remove cleaners** — manage the list of active cleaners.
- **Export schedule** — generate a plain-text export of the full week's schedule, grouped by cleaner, with B2B and Vacant markers.

## Tech Stack

- **Backend:** FastAPI, Uvicorn
- **Templating:** Jinja2
- **Frontend:** HTML, CSS, vanilla JavaScript (no frameworks)
- **Data storage:** In-memory Python dictionary (assignments reset on server restart)

## Project Structure

cleaningSchedule/
├── main.py                # FastAPI app and routes
├── templates/
│   └── schedule.html      # Main schedule page template
├── static/
│   ├── app.js             # Frontend interactivity (popups, fetch calls)
│   └── styles.css         # Styling
├── .gitignore
└── README.md

## Setup

### 1. Clone the repository

git clone <your-repo-url>
cd cleaningSchedule

### 2. Create and activate a virtual environment

python3 -m venv .venv
source .venv/bin/activate

### 3. Install dependencies

pip install fastapi uvicorn jinja2 python-multipart

### 4. Run the app

uvicorn main:app --reload

The app will be available at http://127.0.0.1:8000/

## API Routes

| Method | Route | Description |
|---|---|---|
| GET | / | Renders the schedule page |
| POST | /cleaners/add | Adds a new cleaner |
| POST | /cleaners/delete | Removes a cleaner and their assignments |
| POST | /assign | Assigns a cleaner to a unit/day |
| POST | /clear | Clears an assignment for a unit/day |
| POST | /mark-b2b | Marks a unit/day as Back-to-Back |
| POST | /mark-vacant | Marks a unit/day as Vacant |
| GET | /export | Exports the full schedule as plain text |

## Notes

- Assignment data is stored **in memory** — restarting the server clears all schedule data. For persistence across restarts, consider adding a JSON file or database backend.
- __pycache__/ and virtual environment folders are excluded from version control via .gitignore.

## Future Improvements

- Persist assignments to a database (e.g. SQLite) instead of in-memory storage.
- Add authentication for multi-user access.
- Add cleaner information i.e. availability, max cleans per day