// Logout functionality
document.querySelector('.btn-logout').addEventListener('click', function () {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('mof_authenticated');
        localStorage.removeItem('mof_userEmail');
        window.location.href = 'index.html';
    }
});

// Navigation click events
document.getElementById('doc-management-link').addEventListener('click', function () {
    window.location.href = 'document_management.html';
});
