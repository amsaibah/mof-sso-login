document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const datePicker = document.getElementById('booking-date');
    const refreshBtn = document.getElementById('refresh-btn');
    const roomsContainer = document.getElementById('rooms-container');
    const bookingModal = document.getElementById('booking-modal');
    const bookingForm = document.getElementById('booking-form');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    
    // Current user and selected date
    let currentUser = {};
    let selectedDate = new Date();
    
    // Initialize date picker
    flatpickr(datePicker, {
        dateFormat: 'Y-m-d',
        defaultDate: selectedDate,
        minDate: 'today',
        onChange: function(selectedDates) {
            selectedDate = selectedDates[0];
            loadRooms();
        }
    });
    
    // Load user info
    async function loadUserInfo() {
        try {
            const response = await fetch('/user-info');
            if (response.ok) {
                currentUser = await response.json();
                document.getElementById('username').textContent = currentUser.name;
                document.getElementById('department').textContent = currentUser.department || 'General';
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }
    
    // Load meeting rooms
    async function loadRooms() {
        try {
            const dateStr = formatDate(selectedDate);
            roomsContainer.innerHTML = '<p>Loading rooms...</p>';
            
            const response = await fetch('/meeting-rooms');
            if (!response.ok) throw new Error('Failed to load rooms');
            
            const rooms = await response.json();
            roomsContainer.innerHTML = '';
            
            if (rooms.length === 0) {
                roomsContainer.innerHTML = '<p>No meeting rooms available.</p>';
                return;
            }
            
            // Load availability for each room
            for (const room of rooms) {
                await loadRoomAvailability(room, dateStr);
            }
        } catch (error) {
            console.error('Error loading rooms:', error);
            roomsContainer.innerHTML = `<p>Error loading rooms: ${error.message}</p>`;
        }
    }
    
    // Load availability for a specific room
    async function loadRoomAvailability(room, dateStr) {
        try {
            const response = await fetch(`/room-availability/${room.id}?date=${dateStr}`);
            if (!response.ok) throw new Error('Failed to load availability');
            
            const bookings = await response.json();
            renderRoomCard(room, bookings, dateStr);
        } catch (error) {
            console.error(`Error loading availability for room ${room.id}:`, error);
            renderRoomCard(room, [], dateStr);
        }
    }
    
    // Render a room card
    function renderRoomCard(room, bookings, dateStr) {
        const card = document.createElement('div');
        card.className = 'room-card';
        
        // Convert bookings to time slots
        const bookedSlots = bookings.map(b => ({
            start: b.start_time,
            end: b.end_time
        }));
        
        // Generate time slots (every 30 minutes from 8AM to 6PM)
        const timeSlots = [];
        for (let hour = 8; hour < 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const isBooked = bookedSlots.some(slot => 
                    timeStr >= slot.start && timeStr < slot.end
                );
                
                timeSlots.push({
                    time: timeStr,
                    booked: isBooked
                });
            }
        }
        
        card.innerHTML = `
            <h3 class="room-name">${room.name}</h3>
            <div class="room-details">${room.capacity} people • ${room.description || ''}</div>
            <div class="time-slots" id="slots-${room.id}">
                ${timeSlots.slice(0, 4).map(slot => `
                    <div class="time-slot ${slot.booked ? 'booked' : ''}" 
                         data-time="${slot.time}"
                         onclick="${slot.booked ? '' : `openBookingModal(${room.id}, '${room.name}', '${dateStr}', '${slot.time}')`}">
                        ${formatTime(slot.time)}
                    </div>
                `).join('')}
            </div>
            <a href="#" class="more-link" onclick="showAllSlots(${room.id}, event)">More</a>
        `;
        
        roomsContainer.appendChild(card);
    }
    
    // Open booking modal
    function openBookingModal(roomId, roomName, date, startTime) {
        document.getElementById('modal-room-id').value = roomId;
        document.getElementById('modal-room-name').textContent = `Book ${roomName}`;
        document.getElementById('modal-booking-date').value = date;
        document.getElementById('modal-start-time').value = startTime;
        
        // Set end time to 30 minutes after start time
        const [hours, minutes] = startTime.split(':');
        const endTime = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
        endTime.setMinutes(endTime.getMinutes() + 30);
        document.getElementById('modal-end-time').value = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
        
        bookingModal.style.display = 'block';
    }
    
    // Submit booking form
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const roomId = document.getElementById('modal-room-id').value;
        const date = document.getElementById('modal-booking-date').value;
        const startTime = document.getElementById('modal-start-time').value;
        const endTime = document.getElementById('modal-end-time').value;
        
        try {
            const response = await fetch('/book-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId,
                    bookingDate: date,
                    startTime,
                    endTime
                })
            });
            
            const result = await response.json();
            if (response.ok) {
                alert('Room booked successfully!');
                bookingModal.style.display = 'none';
                loadRooms();
            } else {
                alert(`Booking failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert('Error booking room. Please try again.');
        }
    });
    
    // Close modal
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            bookingModal.style.display = 'none';
        });
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', loadRooms);
    
    // Logout
    document.querySelector('.btn-logout')?.addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/logout';
        }
    });
    
    // Helper functions
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    function formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${period}`;
    }
    
    // Initialize
    loadUserInfo();
    loadRooms();
    
    // Global functions
    window.showAllSlots = function(roomId, event) {
        event.preventDefault();
        alert('Full schedule view would be implemented here');
        // In a complete implementation, this would show all time slots for the room
    };
});