document.addEventListener('DOMContentLoaded', function() {
    // Logout functionality
    document.querySelector('.btn-logout')?.addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/logout';
        }
    });

    // Time slot click handler
    document.querySelectorAll('.time-slot:not(.booked)').forEach(slot => {
        slot.addEventListener('click', function() {
            const roomName = this.closest('.room-card').querySelector('.room-name').textContent;
            const time = this.textContent;
            if (confirm(`Book ${roomName} at ${time}?`)) {
                this.classList.add('booked');
                // Here you would typically make an API call to book the room
                alert('Room booked successfully!');
            }
        });
    });
});