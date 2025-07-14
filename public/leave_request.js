document.getElementById('leaveRequestForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const leaveType = document.getElementById('leaveType').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const message = document.getElementById('message').value;

    if (new Date(toDate) < new Date(fromDate)) {
        alert('End date cannot be before start date');
        return;
    }

    try {
        const response = await fetch('/submit-leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leaveType, fromDate, toDate, message })
        });

        const result = await response.json();
        if (result.success) {
            alert('Leave request submitted successfully!');
            window.location.href = 'portal.html';
        } else {
            alert('Submission failed: ' + result.message);
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('Error submitting leave request');
    }
});

async function loadEmployeeName() {
    try {
        const response = await fetch('/user-info');
        if (response.ok) {
            const user = await response.json();
            const nameInput = document.getElementById('employeeName');
            if (nameInput) {
                nameInput.value = user.name;
            }
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('employeeName')) {
        loadEmployeeName();
    }
});
