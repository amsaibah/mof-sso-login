// Login Form Handler
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
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

// Load and display documents in table
async function loadDocuments() {
    try {
        const res = await fetch('/documents');
        const documents = await res.json();

        const tbody = document.getElementById('documents-table-body');
        tbody.innerHTML = ''; // Clear existing rows

        documents.forEach(doc => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>MOF-DOC-${String(doc.id).padStart(4, '0')}</td>
                <td>${doc.title}</td>
                <td>${doc.type}</td>
                <td>
                    <select class="status-select" onchange="updateStatus(${doc.id}, this.value)">
                        <option value="draft" ${doc.status === 'draft' ? 'selected' : ''}>Draft</option>
                        <option value="pending" ${doc.status === 'pending' ? 'selected' : ''}>Pending Approval</option>
                        <option value="approved" ${doc.status === 'approved' ? 'selected' : ''}>Approved</option>
                        <option value="rejected" ${doc.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                </td>
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

// Helper to capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Handle status update
async function updateStatus(documentId, newStatus) {
    try {
        const response = await fetch('/update-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: documentId, status: newStatus })
        });

        const result = await response.json();

        if (result.success) {
            alert('Status updated successfully');
            loadDocuments(); // refresh table
        } else {
            alert('Failed to update status: ' + result.message);
        }
    } catch (error) {
        console.error('Status update error:', error);
        alert('Server error while updating status');
    }
}

// Load documents on page load
window.addEventListener('DOMContentLoaded', loadDocuments);

// Open modal
document.getElementById('new-document-btn').addEventListener('click', () => {
    document.getElementById('document-modal').style.display = 'block';
});

// Close modal
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('document-modal').style.display = 'none';
        document.getElementById('document-form').reset();
    });
});

// Handle new document upload
document.getElementById('document-form').addEventListener('submit', async function(e) {
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
            loadDocuments(); // refresh table
        } else {
            alert('Upload failed: ' + result.message);
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading document');
    }
});
