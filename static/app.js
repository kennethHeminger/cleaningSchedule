function confirmDelete(cleanerName) {
    return confirm(`Remove ${cleanerName} and all their data?`);
}

document.addEventListener('DOMContentLoaded', function() {
    const dayCells = document.querySelectorAll('.day-cell');
    const popup = document.getElementById('day-action-popup');
    const popupTitle = document.getElementById('popup-title');
    const cleanerSelect = document.getElementById('popup-cleaner-select');

    let activeCell = null;

    dayCells.forEach(cell => {
        cell.addEventListener('click', function() {
            activeCell = cell;
            const unit = cell.getAttribute('data-unit');
            const day = cell.getAttribute('data-day');
            popupTitle.textContent = `Assign Cleaner for ${unit} on ${day}`;
            popup.style.display = 'block';
        });
    });

    popup.addEventListener('click', function(event) {
        const action = event.target.dataset.action;
        if (!action || !activeCell) return;

        if (action === 'needs-cleaning') {
            activeCell.classList.add('needs-cleaning');
            activeCell.textContent = "Needs Cleaning";
        } 
    
        else if (action === 'assign-cleaner') {
            const cleanerName = cleanerSelect.value;
            if (!cleanerName) {
                alert("Please select a cleaner.");
                return;
            }
            activeCell.textContent = cleanerName;
            activeCell.classList.add('assigned');
        }
        if (action === 'needs-cleaning' ||
            action === 'assign-cleaner' || 
            action === 'cancel') {
                popup.style.display = 'none';
                activeCell = null;
            }
        });
    });
    