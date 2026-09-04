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
    
    const unitSettingsModal = document.getElementById('unit-settings-modal');
    const unitSettingsOriginalName = document.getElementById('unit-settings-original-name')
    const unitSettingsNameInput = document.getElementById('unit-settings-name');
    const unitSettingsTitle = document.getElementById('unit-settings-title');

    if (jumpInput) {
        jumpInput.addEventListener('change', function() {
            window.location.href = `/?week_start=${jumpInput.value}`;
        });
    }

    document.querySelectorAll('.cleaner-name').forEach(nameEl => {
        nameEl.addEventListener('click', function() {
            const item = nameEl.closest('.cleaner-item');
            const name = item.dataset.name;
            const availability = item.dataset.availability ? item.dataset.availability.split(',') : [];

            settingsNameInput.value = name;
            settingsTitle.textContent = `Edit: ${name}`;


            document.querySelectorAll('#cleaner-settings-form input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = availability.includes(checkbox.value);
            });

            settingsModal.style.display = 'flex';
        });
    });

    document.getElementById('delete-cleaner-settings').addEventListener('click', function() {
        if (!confirm(`Remove ${settingsNameInput.value} and all their data?`)) {
            return;
        }
        
            fetch('/cleaners/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    name: settingsNameInput.value,
                }),
            }).then(response => {
                if (response.ok) {
                    window.location.reload();
                } else {
                    alert("Failed to delete cleaner.");
                }
            });
    });

    document.getElementById('save-cleaner-settings').addEventListener('click', function() {
        const checked = [...document.querySelectorAll
            ('#cleaner-settings-form input[type="checkbox"]:checked')].map(cb => cb.value);

        const params = new URLSearchParams();
        params.append('name', settingsNameInput.value);
        checked.forEach(day => params.append('availability', day));

        fetch('/cleaners/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params, 
        }).then(response => {
            if (response.ok) {
                window.location.reload();
            } else {
                alert("Failed to save cleaner settings.");
            }
        });
    });

    document.getElementById('cancel-cleaner-settings').addEventListener('click', function() {
        settingsModal.style.display = 'none';
    });
    let activeCell = null;

    document.querySelectorAll('.unit-name').forEach(unitEl => {
        unitEl.addEventListener('click', function() {
            const unit = unitEl.dataset.unit;
            const eligible = unitEl.dataset.eligible ? unitEl.dataset.eligible.split(',') : [];

            unitSettingsOriginalName.value = unit;
            unitSettingsNameInput.value = unit;
            unitSettingsTitle.textContent = `Edit: ${unit}`;

            document.querySelectorAll('#unit-settings-form input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = eligible.includes(checkbox.value);
            });

            unitSettingsModal.style.display = 'flex';
        });
    });
        
    document.getElementById('cancel-unit-settings').addEventListener('click', function() {
        unitSettingsModal.style.display = 'none';
    });

    document.getElementById('save-unit-settings').addEventListener('click', function() {
        const oldName = unitSettingsOriginalName.value;
        const newName = unitSettingsNameInput.value.trim();
        const checked = [...document.querySelectorAll
            ('#unit-settings-form input[type="checkbox"]:checked')].map
            (cb => cb.value);

        const renameThenUpdate = async () => {
            if (newName !== oldName) {
                const renameParams = new URLSearchParams();
                renameParams.append('old_name', oldName);
                renameParams.append('new_name', newName);
                await fetch('/units/rename', { method: 'POST', headers: 
                    { 'Content-Type': 'application/x-www-form-urlencoded' }, body: renameParams });
            }

            const cleanerParams = new URLSearchParams();
            cleanerParams.append('name', newName);
            checked.forEach(c => cleanerParams.append('eligible_cleaners', c));
            await fetch('/units/update-cleaners', { method: 'POST', headers: {
                'Content-Type': 'application/x-www-form-urlencoded' }, body: cleanerParams });

                window.location.reload();
            };

        renameThenUpdate();
    });

    document.getElementById('delete-unit-settings').addEventListener('click', function() {
    
        const unit = unitSettingsOriginalName.value;
        if (!confirm(`Delete unit "${unit}" and all its assignments?`)) return;

        fetch('/units/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ name: unit }),
        }).then(response => {
            if (response.ok) window.location.reload();
            else alert("Failed to delete unit.");
        });
    });
    
    dayCells.forEach(cell => {
        cell.addEventListener('click', function() {
            activeCell = cell;
            const unit = cell.getAttribute('data-unit');
            const day = cell.getAttribute('data-day');
            popupTitle.textContent = `Assign Cleaner for ${unit} on ${day}`;

            const unitEl = document.querySelector(`[data-unit="${unit}"].unit-name`);
            const eligibleCleaners = unitEl && unitEl.dataset.eligible
                ? unitEl.dataset.eligible.split(',')
                : null;

            fetch(`/cleaners/available?day=${day}`)
                .then(response => response.json())
                .then(data => {
                    cleanerSelect.innerHTML = '';

                    const filtered = eligibleCleaners
                        ? data.cleaners.filter(name => eligibleCleaners.includes(name))
                        : data.cleaners;

                    filtered.forEach(name => {
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        cleanerSelect.appendChild(option);
                    });
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
        });
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

            const wasB2B = activeCell.textContent.includes("**B2B") ||
                activeCell.classList.contains('b2b');
            const wasVacant = activeCell.textContent.includes("(Vacant)") ||
                activeCell.classList.contains('vacant');

            let newText = cleanerName;
            if (wasB2B) newText += " **B2B";
            if (wasVacant) newText += " (Vacant)";

            activeCell.textContent = newText;
            activeCell.classList.add('assigned');
            activeCell.classList.remove('needs-cleaning');
            if (wasB2B) activeCell.classList.add('b2b');
            if (wasVacant) activeCell.classList.add('vacant');

            const unit = activeCell.getAttribute('data-unit');
            const day = activeCell.getAttribute('data-day');

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

        else if (action === "clear") {
            console.log("Clear button Clicked!");
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
                    alert("Failed to clear assignment");
                }
            });
        }

        else if (action === 'b2b') {
            const currentText = activeCell.textContent.trim();

            if (!currentText || currentText === "-" || currentText === "") {
                activeCell.textContent = " Needs Cleaning **B2B";
                activeCell.classList.add('needs-cleaning', 'b2b');
            } else {
                if (!currentText.includes("**B2B")) {
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
            });
        }

        else if (action === 'vacant') {
            const currentText = activeCell.textContent.trim();

            if (!currentText || currentText === "-" || currentText === "") {
                activeCell.textContent = " Needs Cleaning (Vacant)";
                activeCell.classList.add('needs-cleaning', 'vacant');
            } else {
                if (!currentText.includes("(Vacant)")) {
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
            });
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