function confirmDelete(cleanerName) {
    return confirm(`Remove ${cleanerName} and all their data?`);
}

document.addEventListener('DOMContentLoaded', function() {
    const dayCells = document.querySelectorAll('.day-cell');
    const popup = document.getElementById('day-action-popup');
    const popupTitle = document.getElementById('popup-title');
    const cleanerSelect = document.getElementById('popup-cleaner-select');

    const exportButton = document.getElementById('export-button');
    const exportOutput = document.getElementById('export-output');
    const settingsModal = document.getElementById('cleaner-settings-modal');
    const settingsNameInput = document.getElementById('cleaner-settings-name');
    const settingsTitle = document.getElementById('cleaner-settings-title');
    const jumpInput = document.getElementById('jump-to-date');
    
    if (jumpInput) {
        jumpInput.addEventListener('change', function() {
            window.location.href = `/?week_start=${jumpInput.value}`;
        });
    }
    let activeCell = null;

    dayCells.forEach(cell => {
        cell.addEventListener('click', function() {
            activeCell = cell;
            const unit = cell.getAttribute('data-unit');
            const day = cell.getAttribute('data-day');
            popupTitle.textContent = `Assign Cleaner for ${unit} on ${day}`;

            fetch(`/cleaners/available?day=${day}`)
                .then(response => response.json())
                .then(data => {
                    // Handle the available cleaners data
                    cleanerSelect.innerHTML = ''; 
                    // Clear existing options
                    data.cleaners.forEach(name => {
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        cleanerSelect.appendChild(option);
                    })
                });

            popup.style.display = 'block';
        });
    });

    if (exportButton) {
        exportButton.addEventListener('click', function() {
            const currentWeekStart = jumpInput.value;

        fetch(`/export?week_start=${currentWeekStart}`)
        .then(response => response.text())
        .then(text => {
            exportOutput.textContent = text;
            exportOutput.style.display = 'block';
        })
        .catch(() => {
            alert("Failed to load export.");
        });
        })
        
    }

    popup.addEventListener('click', function(event) {
        const action = event.target.dataset.action;
        if (!action || !activeCell) return;

        if (action === 'needs-cleaning') {
            activeCell.classList.add('needs-cleaning');
            activeCell.classList.remove('assigned', 'b2b');
            activeCell.textContent = "Needs Cleaning";
        

            const unit = activeCell.getAttribute('data-unit');
            const day = activeCell.getAttribute('data-day');

            fetch('/assign-needs-cleaning', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    unit: unit,
                    day: day,
                }),
            });
        }
    
        else if (action === 'assign-cleaner') {
            const cleanerName = cleanerSelect.value;
            if (!cleanerName) {
                alert("Please select a cleaner.");
                return;
            }

            // Update UI
            const wasB2B = activeCell.textContent.includes("**B2B") ||
            activeCell.classList.contains('b2b');
            const wasVacant = activeCell.textContent.includes("(Vacant)") ||
            activeCell.classList.contains('vacant');
    
            let newText = cleanerName;
            if (wasB2B) newText += " **B2B";
            if (wasVacant) newText += " (Vacant)";

    
            activeCell.textContent = newText
            activeCell.classList.add('assigned');
            activeCell.classList.remove('needs-cleaning');
            if (wasB2B) activeCell.classList.add('b2b');
            if (wasVacant) activeCell.classList.add('vacant');

            // Get unit and day from the active cell
            const unit = activeCell.getAttribute('data-unit');
            const day = activeCell.getAttribute('data-day');

            // Send assignment to the server
            fetch('/assign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    unit: unit,
                    day: day,
                    cleaner: cleanerName
                })
            }).then(response => {
                if (!response.ok) {
                    alert("Failed to assign cleaner.");
                }
            });
        }

        else if (action === "clear"){
            //Clear UI
            console.log("Clear button Clicked!")
            activeCell.textContent = "-";
            activeCell.classList.remove('assigned', 'needs-cleaning', 'b2b', 'vacant');

            const unit = activeCell.getAttribute('data-unit');
            const day = activeCell.getAttribute('data-day');

            fetch('/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    unit: unit,
                    day: day,
                }),
            }).then(response => {
                if (!response.ok) {
                    alert("Failed to clear assignment")
                }
            })
        }

        else if (action === 'b2b') {
            const currentText = activeCell.textContent.trim();

            if (!currentText || currentText === "-" || currentText === ""){

                // No assignment yet
                activeCell.textContent =" Needs Cleaning **B2B";
                activeCell.classList.add('needs-cleaning', 'b2b');
            } else {

                // Cleaner already assigned
                if (!currentText.includes("**B2B")){
                    activeCell.textContent = currentText + " **B2B";
                }
                activeCell.classList.add('b2b');
            }

            const unit = activeCell.getAttribute('data-unit');
            const day = activeCell.getAttribute('data-day');

            fetch('/mark-b2b', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    unit: unit,
                    day: day,
                    auto_needs_cleaning: (!currentText || currentText === "-"
                        || currentText === "").toString(),
                }),
            }).then(response => {
                if (!response.ok) {
                    alert("Failed to mark B2B");
                }
            })
        }

        else if (action === 'vacant') {
            const currentText = activeCell.textContent.trim();

            if (!currentText || currentText === "-" || currentText === ""){

                // No assignment yet
                activeCell.textContent =" Needs Cleaning (Vacant)";
                activeCell.classList.add('needs-cleaning', 'vacant');
            } else {

                // Cleaner already assigned
                if (!currentText.includes("(Vacant)")){
                    activeCell.textContent = currentText + " (Vacant)";
                }
                activeCell.classList.add('vacant');
            }

            const unit = activeCell.getAttribute('data-unit');
            const day = activeCell.getAttribute('data-day');

            fetch('/mark-vacant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    unit: unit,
                    day: day,
                    auto_needs_cleaning: (!currentText || currentText === "-"
                        || currentText === "").toString(),
                }),
            }).then(response => {
                if (!response.ok) {
                    alert("Failed to mark vacant");
                }
            })
        }

        if (action === 'needs-cleaning' ||
            action === 'b2b' ||
            action === 'vacant' ||
            action === 'assign-cleaner' || 
            action === 'clear' ||
            action === 'cancel') {
                popup.style.display = 'none';
                activeCell = null;
            }
    });
    
});
    