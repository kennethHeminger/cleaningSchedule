from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from typing import Dict, Tuple
from fastapi.responses import PlainTextResponse

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Dictionary to store assignments
assignments: Dict[Tuple[str, str], Dict[str, bool | str]] = {}

cleaners_data = ["PM", "Paula", "Jorge", "Mel", "Bobo"]

# Get/Create the list of cleaners and units to display on the schedule page
@app.get("/schedule", response_class=HTMLResponse)
async def read_root(request: Request):
    
    units = ["50 K", "7 Serene Court", "Air 1503", "Air 1504", "Aria 1903", "Avani 906", "Avani 1204", 
        "Avani 1904", "Avani 2306", "Avani 806", "BBOP 503", "BBOP 502", "BH 16e","Sanbono 402", "BH 25a", "BH 28", 
        "Sav 600", "Sav 601", "DB 101", "DB 105", "DB 11", "DB 115", "DB 116", "DB 118", "DB 121", "DB 122", "DB 127",
        "DB 129", "DB 135", "DB 146", "DB 149", "DB 150", "DB 154", "DB 155", "DB 158", "DB 16", "DB 165", "DB 19", 
        "DB 24", "DB 29", "DB 33", "DB 35", "DB 39", "DB 42", "DB 46", "DB 48", "DB 5", "DB 6", "DB 61", "DB 66", "DB 69",
        "DB 70", "DB 76", "DB 80", "DB 81", "DB 84", "DB 85", "DB 87", "DB 98", "DB 43", "DB 44", "DB 45", "DC 18",
        "GF 66", "Neptune 512", "Oracle 12401", "Oracle 1501", "Oracle 21403", "Oracle 22101", "Oracle 11006", 
        "Oracle 21907", "Phoenician 1105", "Q1 709", "Rhapsody 1405", "Sav 512", "Sav 610", "SG 1402", "SG 1810", 
        "SG 2406", "SG 2606", "SG 2701", "SG 403", "SG 802", "Soul 905", "Spice 205", "The Star", "Swell 1032",
        "Talisman 22", "Verve 17", "Wave 1603", "Wave 2202", "Wave 2203", "Wave 2401", "Wave 2404", "TB 224", "TB 233",
        "TB 250"
    ]

    print("Assignments at render: ", assignments)

    return templates.TemplateResponse(
        request,
        "schedule.html", 
        {
            "cleaners": cleaners_data,
            "units": units,
            "assignments": assignments,
        }
    )

# add a new item to the list of cleaners
@app.post("/cleaners/add")
async def add_cleaner(name: str = Form(...)):
    cleaner_name = name.strip()
    if cleaner_name and cleaner_name not in cleaners_data:
        cleaners_data.append(cleaner_name)
    return RedirectResponse(url="/schedule", status_code=303)

# Delete a cleaner from the list of cleaners
@app.post("/cleaners/delete")
async def delete_cleaner(name: str = Form(...)):
    if name in cleaners_data:
        cleaners_data.remove(name)

        # Find all keys where cleaner name is assigned and delete them from assignments
        to_delete = [
            key for key, value in assignments.items() 
            if value == name
        ]
        for key in to_delete:
            del assignments[key]

    return RedirectResponse(url="/schedule", status_code=303)

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

    assignments[(unit, day)] = {
        "cleaner": cleaner,
        "b2b": existing_b2b,
    }
    print({"New assignment", unit, day, "->", cleaner})
    print("Assignments dict:", assignments)
    return {"okay": True, "message": f"Assigned {cleaner} to {unit} on {day}"}

@app.post("/clear")
async def clear_assignments(
    unit: str = Form(...),
    day: str = Form(...),
):
    # Remove the assignment for the specified unit and day
    assignments.pop((unit, day), None)
    print({"Cleared assignment for", unit, day})
    return {"okay": True,}

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

    return {"ok": True}
    
@app.get("/export")
async def export_schedule():
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    export_lines = []

    for cleaner in cleaners_data:
        export_lines.append(f"{cleaner}:")
        export_lines.append("")

        for day in days:
            day_units = []

            for (unit, assigned_day), assignment in assignments.items():
                if assigned_day == day and assignment["cleaner"] == cleaner:
                    line = unit
                    if assignment.get("b2b"):
                        line += " **B2B"
                    day_units.append(line)

            if day_units:
                export_lines.append(day)
                export_lines.extend(day_units)
                export_lines.append("")
            else:
                export_lines.append(day)
                export_lines.append("/")
                export_lines.append("")
        
        export_lines.append("")
        export_lines.append("-----")
        export_lines.append("")

    return PlainTextResponse("\n".join(export_lines))
                            