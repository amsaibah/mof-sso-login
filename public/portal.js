// Logout functionality
document.querySelector('.btn-logout')?.addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        // Changed from localStorage to proper session logout
        window.location.href = '/logout';
    }
});

// Navigation click events
document.getElementById('doc-management-link')?.addEventListener('click', function() {
    window.location.href = 'document_management.html';
});

// Add click handler for Meeting Rooms
document.querySelector('.nav-item:nth-child(4)')?.addEventListener('click', function() {
    window.location.href = 'meeting_rooms.html';
});

//Add click handlers for all navigation items
const navItems = document.querySelectorAll('.side-nav .nav-item');
navItems.forEach(item => {
    item.addEventListener('click', function() {
        // Remove active class from all items
        navItems.forEach(navItem => navItem.classList.remove('active'));
        // Add active class to clicked item
        this.classList.add('active');
        
        // Navigation logic
        const icon = this.querySelector('i');
        if (icon) {
            switch(icon.classList[1]) {
                case 'fa-folder':
                    window.location.href = 'document_management.html';
                    break;
                case 'fa-calendar-alt':
                    window.location.href = 'leave_request.html';
                    break;
                case 'fa-door-open':
                    window.location.href = 'meeting_rooms.html';
                    break;
                case 'fa-car':
                    window.location.href = 'car_booking.html'; // You'll need to create this
                    break;
                case 'fa-archive':
                    window.location.href = 'document_storage.html'; // You'll need to create this
                    break;
                // Add other cases as needed
            }
        }
    });
});