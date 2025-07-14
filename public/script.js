// ========== LOGIN FORM HANDLER ==========
document.getElementById('loginForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email.endsWith('@mofth.onmicrosoft.com')) {
        alert('Please use your @mofth.onmicrosoft.com email address');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.success) {
            window.location.href = '/portal.html';
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Server error. Try again later.');
    }
});


// ========== DOCUMENT MANAGEMENT ==========
async function loadDocuments() {
    try {
        const res = await fetch('/documents');
        const documents = await res.json();

        const tbody = document.getElementById('documents-table-body');
        if (!tbody) return;

        tbody.innerHTML = ''; // Clear existing rows

        documents.forEach(doc => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>MOF-DOC-${String(doc.id).padStart(4, '0')}</td>
                <td>${doc.title}</td>
                <td>${doc.type}</td>
                <td><span class="status-badge status-${doc.status}">${capitalize(doc.status)}</span></td>
                <td>${new Date(doc.updated_at).toLocaleDateString()}</td>
                <td>
                    <a class="action-btn view-btn" href="${doc.file_path}" target="_blank">View</a>
                    <button class="action-btn delete-btn" onclick="deleteDocument(${doc.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function deleteDocument(id) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
        const response = await fetch(`/documents/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Document deleted successfully');
            loadDocuments();
        } else {
            alert('Delete failed: ' + result.message);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting document');
    }
}

document.getElementById('document-form')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const form = document.getElementById('document-form');
    const formData = new FormData(form);

    try {
        const response = await fetch('/upload-document', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Document uploaded successfully');
            document.getElementById('document-modal').style.display = 'none';
            form.reset();
            loadDocuments();
        } else {
            alert('Upload failed: ' + result.message);
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading document');
    }
});

document.getElementById('new-document-btn')?.addEventListener('click', () => {
    document.getElementById('document-modal').style.display = 'block';
});

document.querySelectorAll('.close-modal')?.forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('document-modal').style.display = 'none';
        document.getElementById('document-form')?.reset();
    });
});


// ========== LEAVE REQUEST FORM HANDLER ==========
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


// ========== LOAD EMPLOYEE NAME ==========
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


// ========== PAGE LOAD INITIALIZER ==========
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('documents-table-body')) {
        loadDocuments();
    }

    if (document.getElementById('employeeName')) {
        loadEmployeeName();
    }
});
