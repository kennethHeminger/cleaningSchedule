from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from typing import Dict, Tuple
from fastapi.responses import PlainTextResponse
from datetime import date, timedelta
from pathlib import Path
import json

DATA_FILE = Path("assignments.json")

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Load assignments from the JSON file if it exists
def save_assignments():
    serializable = {
        f"{unit}|{day}": value for (unit, day), value in assignments.items()
    }
    DATA_FILE.write_text(json.dumps(serializable, indent=2))

# Load assignments from the JSON file if it exists
def load_assignments():
    if DATA_FILE.exists():
        raw = json.loads(DATA_FILE.read_text())
        for key, value in raw.items():
            unit, day = key.split("|", 1)
            assignments[(unit, day)] = value    

# Get the dates for the week starting from the reference date
def get_week_dates(reference_date: date) -> list[date]:
    monday = reference_date - timedelta(days=reference_date.weekday())
    return[monday + timedelta(days=i) for i in range (7)]

# Dictionary to store assignments
assignments: Dict[Tuple[str, str], Dict[str, bool | str]] = {}
load_assignments()

cleaners_data: Dict[str, Dict] ={
    "PM": {"availability": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]},
    "Paula": {"availability": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]},
    "Jorge": {"availability": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]},
    "Mel": {"availability": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]},
}

units_data: Dict[str, Dict] = {
    unit: {"eligible_cleaners": list (cleaners_data.keys())}
    for unit in ["7 Serene Court", "Air 1503", "Air 1504", "Aria 1903", "Avani 906", "Avani 1204", "Avani 1904", "Avani 2306", "Avani 806", "BBOP 503", "BBOP 502", "BH 16e","Sanbono 402", "BH 25a", "BH 28", "Sav 600", "Sav 601", "DB 101", "DB 105", "DB 11", "DB 115", "DB 116", "DB 118", "DB 121", "DB 122", "DB 127","DB 129", "DB 135", "DB 146", "DB 149", "DB 150", "DB 154", "DB 155", "DB 158", "DB 16", "DB 165", "DB 19", "DB 24", "DB 25", "DB 29", "DB 33", "DB 35", "DB 39", "DB 42", "DB 46", "DB 48", "DB 5", "DB 6", "DB 61", "DB 66", "DB 69", "DB 70", "DB 76", "DB 80", "DB 81", "DB 84", "DB 85", "DB 87", "DB 98", "DB 43", "DB 44", "DB 45", "DC 18","GF 66", "Neptune 512", "Oracle 12401", "Oracle 1501", "Oracle 21403", "Oracle 22101", "Oracle 11006", "Oracle 21907", "Phoenician 1105", "Q1 709", "Rhapsody 1405", "Sav 512", "Sav 610", "SG 1402", "SG 1810", "SG 2406", "SG 2606", "SG 2701", "SG 403", "SG 802", "Soul 905", "Spice 205", "The Star", "Swell 1032","Talisman 22", "Verve 17", "Wave 1603", "Wave 2202", "Wave 2203", "Wave 2401", "Wave 2404", "TB 224", "TB 233", "TB 250"]
}

UNITS_FILE = Path("units.json")

def save_units():
    UNITS_FILE.write_text(json.dumps(units_data, indent=2))

def load_units():
    global units_data
    if UNITS_FILE.exists():
        units_data = json.loads(UNITS_FILE.read_text())

load_units()



# Get/Create the list of cleaners and units to display on the schedule page
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request, week_start: str | None = None):
    
    if week_start:
        ref_date = date.fromisoformat(week_start)
    else:
        ref_date = date.today()

    assignments_lookup = {
        f"{unit}|{day}": value for (unit, day), value in assignments.items()
    }

    week_dates = get_week_dates(ref_date)
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    days = [
        {"name": name, "date": d.isoformat(), "display":
         d.strftime("%b %d")}
         for name, d in zip(day_names, week_dates)
    ]

    prev_week = (week_dates[0] - timedelta (days=7)).isoformat()
    next_week = (week_dates[0] + timedelta (days=7)).isoformat()


    print("Assignments at render: ", assignments)

    return templates.TemplateResponse(
        request,
        "schedule.html", 
        {
            "cleaners": cleaners_data,
            "units": units_data,
            "assignments": assignments,
            "assignments_lookup": assignments_lookup,
            "days": days,
            "prev_week": prev_week,
            "next_week":  next_week,
            "week_start": week_dates[0].isoformat(),
        }
    )

# add a new item to the list of cleaners
@app.post("/cleaners/add")
async def add_cleaner(name: str = Form(...)):
    cleaner_name = name.strip()
    if cleaner_name and cleaner_name not in cleaners_data:
        cleaners_data[cleaner_name] = {"availability": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
    return RedirectResponse(url="/", status_code=303)

# Delete a cleaner from the list of cleaners
@app.post("/cleaners/delete")
async def delete_cleaner(name: str = Form(...)):
    if name in cleaners_data:
        del cleaners_data[name]
    
        # Find all keys where cleaner name is assigned and delete them from assignments
        to_delete = [
            key for key, value in assignments.items() 
            if value.get("cleaner") == name
        ]
        for key in to_delete:
            del assignments[key]
        save_assignments()
    return RedirectResponse(url="/", status_code=303)

# Update the availability of a cleaner
@app.post("/cleaners/update")
async def update_cleaner(
        name: str = Form([]),
        availability: list[str] = Form([])):
    if name in cleaners_data:
        cleaners_data[name]["availability"] = availability
    return RedirectResponse(url="/", status_code=303)

# Get the list of available cleaners for a specific unit and day
@app.get("/cleaners/available")
async def available_cleaners(day: str):
    day_obj = date.fromisoformat(day)
    day_abbr = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day_obj.weekday()]
    available = [
        name for name, data in cleaners_data.items()
        if day_abbr in data.get("availability", [])
    ]
    return {"cleaners": available}

# Assign a cleaner to a specific unit and day
@app.post("/assign")
async def assign_cleaner(
    unit: str = Form(...), 
    day: str = Form(...), 
    cleaner: str = Form(...)
):
    
    key = (unit, day)

    existing = assignments.get(key)
    existing_b2b = existing["b2b"] if existing and "b2b" in existing else False
    existing_vacant = existing.get("vacant", False) if existing else False

    assignments[(unit, day)] = {
        "cleaner": cleaner,
        "b2b": existing_b2b,
        "vacant": existing_vacant
    }
    save_assignments()
    return {"okay": True, "message": f"Assigned {cleaner} to {unit} on {day}"}

# Mark a unit and day as "Needs Cleaning"
@app.post("/assign-needs-cleaning")
async def assign_needs_cleaning(unit: str = Form(...), day: str = Form(...)):
    assignments[(unit, day)] = {"cleaner": "Needs Cleaning", "b2b": False, "vacant": False}
    save_assignments()
    print(f"Marked Needs Cleaning: {unit} {day}")
    return {"ok": True}

# Clear the assignment for a specific unit and day
@app.post("/clear")
async def clear_assignments(
    unit: str = Form(...),
    day: str = Form(...),
):
    # Remove the assignment for the specified unit and day
    assignments.pop((unit, day), None)
    save_assignments()

    print({"Cleared assignment for", unit, day})
    return {"okay": True,}

# Mark a unit and day as B2B (Back-to-Back)
@app.post("/mark-b2b")
async def mark_b2b(
    unit: str = Form(...),
    day: str = Form(...),
    auto_needs_cleaning: str = Form("false"),
):
    key = (unit, day)
    is_auto_needs_cleaning = auto_needs_cleaning.lower() == "true"

    if key in assignments:
        assignments[key]["b2b"] = True
        print("Marked B2B:", unit, day, "->", assignments[key])

    else:
        assignments[key] = {
            "cleaner": "Needs Cleaning",
            "b2b": True,
            }
        print("Created Needs Cleaning B2B assignment:", unit, day, "->", assignments[key])

    save_assignments()
    return {"ok": True}

# Mark a unit and day as Vacant
@app.post("/mark-vacant")
async def mark_vacant(
    unit: str = Form(...),
    day: str = Form(...),
    auto_needs_cleaning: str = Form("false"),
):
    key = (unit, day)
    is_auto_needs_cleaning = auto_needs_cleaning.lower() == "true"

    if key in assignments:
        assignments[key]["vacant"] = True
        print("Marked Vacant:", unit, day, "->", assignments[key])

    else:
        assignments[key] = {
            "cleaner": "Needs Cleaning",
            "vacant": True,
            "b2b": False,
            }
        print("Created Needs Cleaning Vacant assignment:", unit, day, "->", assignments[key])

    save_assignments()
    return {"ok": True}

# Rename a unit in the list of units  
@app.post("/units/rename")
async def rename_unit(old_name: str = Form(...), new_name: str = Form(...)):
    if old_name in units_data and new_name and new_name not in units_data:
        units_data[new_name] = units_data.pop(old_name)
        
        for (unit, day), value in list(assignments.items()):
            if unit == old_name:
                assignments[(new_name, day)] = assignments.pop((unit, day))
        save_units()
        save_assignments()
        return RedirectResponse(url="/", status_code=303)

# Delete a unit from the list of units
@app.post("/units/delete")
async def delete_unit(name: str = Form(...)):
    if name in units_data:
        del units_data[name]
        
        to_delete = [
            key for key in assignments.keys() 
            if key[0] == name
        ]
        for key in to_delete:
            del assignments[key]
        save_units()
        save_assignments()
    return RedirectResponse(url="/", status_code=303)

#Update the eligible cleaners for a specific unit
@app.post("/units/update-cleaners")
async def update_unit_cleaners(name: str = Form(...), eligible_cleaners: list[str] = Form([])):
    if name in units_data:
        units_data[name]["eligible_cleaners"] = eligible_cleaners
        save_units()
    return RedirectResponse(url="/", status_code=303)

@app.get("/units/available-cleaners")
async def available_cleaners(unit: str):
    eligible = units_data.get(unit, {}).get("eligible_cleaners", [])
    return {"cleaners": eligible}

# Print text of schedule    
@app.get("/export")
async def export_schedule(week_start: str | None = None):
    ref_date = date.fromisoformat(week_start) if week_start else date.today()
    week_dates = get_week_dates(ref_date)
    day_abbrs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    def ordinal(n: int) -> str:
        if 11 <= n % 100 <= 13:
            suffix = "th"
        else:
            suffix = {1: "st", 2: "nd"}.get(n % 10, "th")
        return f"{n}{suffix}"

    export_lines = []
    all_cleaners = list(cleaners_data.keys()) + ["To Assign"]

    for cleaner in all_cleaners:
        export_lines.append(f"{cleaner}:")
        export_lines.append("")

        for day_abbr, day_date in zip(day_abbrs, week_dates):
            day_key = day_date.isoformat()
            day_label = f"{day_abbr} {ordinal(day_date.day)}"
            day_units = []

            for (unit, assigned_day), assignment in assignments.items():
                if assigned_day != day_key:
                    continue

                is_match = (
                    assignment ["cleaner"] == cleaner
                    if cleaner != "To Assign"
                    else assignment ["cleaner"] == "Needs Cleaning"
                )

                if is_match:
                    line = unit
                    if assignment.get("b2b"):
                        line += " **B2B"
                    if assignment.get("vacant"):
                        line += " (vacant)"
                    day_units.append(line)

            if day_units:
                export_lines.append(day_label)
                export_lines.extend(day_units)
                export_lines.append("")
            else:
                export_lines.append(day_label)
                export_lines.append("/")
                export_lines.append("")
        
        export_lines.append("")
        export_lines.append("----------------------------------")
        export_lines.append("")

    return PlainTextResponse("\n".join(export_lines))
                            