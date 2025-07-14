document.addEventListener('DOMContentLoaded', function () {
    const datePicker = document.getElementById('booking-date');
    const refreshBtn = document.getElementById('refresh-btn');
    const roomsContainer = document.getElementById('rooms-container');
    const bookingModal = document.getElementById('booking-modal');
    const bookingForm = document.getElementById('booking-form');
    const closeModalButtons = document.querySelectorAll('.close-modal');

    let currentUser = {};
    let selectedDate = new Date();

    flatpickr(datePicker, {
        dateFormat: 'Y-m-d',
        defaultDate: selectedDate,
        minDate: 'today',
        onChange: function (selectedDates) {
            selectedDate = selectedDates[0];
            loadRooms();
        }
    });

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

            for (const room of rooms) {
                await loadRoomAvailability(room, dateStr);
            }

            loadMyBookings();
        } catch (error) {
            console.error('Error loading rooms:', error);
            roomsContainer.innerHTML = `<p>Error loading rooms: ${error.message}</p>`;
        }
    }

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

    function renderRoomCard(room, bookings, dateStr) {
        const card = document.createElement('div');
        card.className = 'room-card';

        const bookedSlots = bookings.map(b => ({
            start: b.start_time,
            end: b.end_time
        }));

        const timeSlots = [];
        for (let hour = 8; hour <= 16; hour++) {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            if (timeStr === "12:00") continue; // Skip lunch time

            const isBooked = bookedSlots.some(slot =>
                timeStr >= slot.start && timeStr < slot.end
            );

            timeSlots.push({ time: timeStr, booked: isBooked });
        }

        card.innerHTML = `
            <h3 class="room-name">${room.name}</h3>
            <div class="room-details">${room.capacity} people • ${room.description || ''}</div>
            <div class="time-slots" id="slots-${room.id}">
                ${timeSlots.map(slot => `
                    <div class="time-slot ${slot.booked ? 'booked' : ''}" 
                         data-room-id="${room.id}" 
                         data-room-name="${room.name}" 
                         data-date="${dateStr}" 
                         data-time="${slot.time}">
                        ${formatTime(slot.time)}
                    </div>
                `).join('')}
            </div>
        `;

        const slotElements = card.querySelectorAll('.time-slot:not(.booked)');
        slotElements.forEach(slotEl => {
            slotEl.addEventListener('click', () => {
                const roomId = slotEl.dataset.roomId;
                const roomName = slotEl.dataset.roomName;
                const date = slotEl.dataset.date;
                const time = slotEl.dataset.time;
                openBookingModal(roomId, roomName, date, time);
            });
        });

        roomsContainer.appendChild(card);
    }

    function openBookingModal(roomId, roomName, date, startTime) {
        document.getElementById('modal-room-id').value = roomId;
        document.getElementById('modal-room-name').textContent = `Book ${roomName}`;
        document.getElementById('modal-booking-date').value = date;
        document.getElementById('modal-start-time').value = startTime;

        const [hours, minutes] = startTime.split(':');
        const endTime = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
        endTime.setMinutes(endTime.getMinutes() + 60);
        document.getElementById('modal-end-time').value =
            `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

        bookingModal.style.display = 'block';
    }

    bookingForm.addEventListener('submit', async function (e) {
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
            if (response.ok && result.success) {
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

    async function loadMyBookings() {
        const container = document.getElementById('my-bookings-container');
        try {
            const res = await fetch('/my-bookings');
            if (!res.ok) throw new Error('Could not fetch bookings');
            const bookings = await res.json();

            if (bookings.length === 0) {
                container.innerHTML = '<p>You have no upcoming bookings.</p>';
                return;
            }

            container.innerHTML = bookings.map(b => `
                <div style="background:#f0f4fa; padding:10px; margin-bottom:10px; border-radius:6px;">
                    <strong>${b.room_name}</strong> — 
                    ${b.booking_date} from ${b.start_time} to ${b.end_time}
                </div>
            `).join('');
        } catch (err) {
            console.error(err);
            container.innerHTML = '<p>Error loading your bookings.</p>';
        }
    }

    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            bookingModal.style.display = 'none';
        });
    });

    refreshBtn.addEventListener('click', loadRooms);

    document.querySelector('.btn-logout')?.addEventListener('click', function () {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/logout';
        }
    });

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

    loadUserInfo();
    loadRooms();
});
