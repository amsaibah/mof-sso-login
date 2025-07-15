// Sample car booking data
        let bookings = [
            {
                id: "CB001",
                vehicleType: "Toyota Corolla",
                licensePlate: "MOF-1234",
                bookingDate: "2024-01-15",
                duration: "Full Day",
                destination: "Central Bank, Dhaka",
                purpose: "Official Meeting with Governor",
                status: "approved",
                bookedBy: "Ahmad Rahman",
                department: "Finance",
                pickupTime: "09:00",
                passengers: 3
            },
            {
                id: "CB002",
                vehicleType: "Honda Civic",
                licensePlate: "MOF-5678",
                bookingDate: "2024-01-16",
                duration: "Half Day",
                destination: "Ministry of Planning",
                purpose: "Document Submission",
                status: "pending",
                bookedBy: "Sarah Ahmed",
                department: "Planning",
                pickupTime: "10:00",
                passengers: 2
            },
            {
                id: "CB003",
                vehicleType: "Toyota Hiace",
                licensePlate: "MOF-9012",
                bookingDate: "2024-01-17",
                duration: "Full Day",
                destination: "Chittagong Regional Office",
                purpose: "Field Inspection and Audit",
                status: "completed",
                bookedBy: "Mohammad Ali",
                department: "Audit",
                pickupTime: "08:00",
                passengers: 8
            },
            {
                id: "CB004",
                vehicleType: "Toyota Prado",
                licensePlate: "MOF-3456",
                bookingDate: "2024-01-18",
                duration: "Multi-Day",
                destination: "Sylhet Division Office",
                purpose: "Regional Conference",
                status: "rejected",
                bookedBy: "Fatema Khatun",
                department: "Administration",
                pickupTime: "07:00",
                passengers: 5
            }
        ];

        // Modal functionality
        const modal = document.getElementById('booking-modal');
        const newBookingBtn = document.getElementById('new-booking-btn');
        const closeModalBtns = document.querySelectorAll('.close-modal');
        const bookingForm = document.getElementById('booking-form');

        newBookingBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            // Set minimum date to today
            document.getElementById('booking-date').min = new Date().toISOString().split('T')[0];
        });

        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Form submission
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(bookingForm);
            const newBooking = {
                id: 'CB' + String(bookings.length + 1).padStart(3, '0'),
                vehicleType: getVehicleTypeName(formData.get('vehicleType')),
                licensePlate: 'MOF-' + Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
                bookingDate: formData.get('bookingDate'),
                duration: getDurationName(formData.get('duration')),
                destination: formData.get('destination'),
                purpose: formData.get('purpose'),
                status: 'pending',
                bookedBy: 'Fatematus Shaheba',
                department: 'IT Department',
                pickupTime: formData.get('pickupTime'),
                passengers: formData.get('passengers') || 1
            };

            bookings.unshift(newBooking);
            renderBookings();
            modal.style.display = 'none';
            bookingForm.reset();
            
            alert('Booking submitted successfully! Your booking ID is: ' + newBooking.id);
        });

        function getVehicleTypeName(type) {
            const types = {
                'sedan': 'Toyota Corolla',
                'suv': 'Toyota Prado',
                'van': 'Toyota Hiace',
                'bus': 'Coaster Bus'
            };
            return types[type] || type;
        }

        function getDurationName(duration) {
            const durations = {
                'half-day': 'Half Day',
                'full-day': 'Full Day',
                'multi-day': 'Multi-Day'
            };
            return durations[duration] || duration;
        }

        // Render bookings table
        function renderBookings(bookingsToRender = bookings) {
            const tbody = document.getElementById('bookings-table-body');
            tbody.innerHTML = '';

            bookingsToRender.forEach(booking => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${booking.id}</td>
                    <td>${booking.vehicleType}</td>
                    <td>${booking.licensePlate}</td>
                    <td>${booking.bookingDate}</td>
                    <td>${booking.duration}</td>
                    <td>${booking.destination}</td>
                    <td>${booking.purpose}</td>
                    <td><span class="status-badge status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td>
                    <td>
                        <button class="action-btn view-btn" onclick="viewBooking('${booking.id}')">View</button>
                        <button class="action-btn edit-btn" onclick="editBooking('${booking.id}')">Edit</button>
                        <button class="action-btn cancel-btn" onclick="cancelBooking('${booking.id}')">Cancel</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Search and filter functionality
        function filterBookings() {
            const searchTerm = document.getElementById('booking-search').value.toLowerCase();
            const vehicleTypeFilter = document.getElementById('vehicle-type').value;
            const statusFilter = document.getElementById('booking-status').value;

            const filtered = bookings.filter(booking => {
                const matchesSearch = booking.vehicleType.toLowerCase().includes(searchTerm) ||
                                    booking.destination.toLowerCase().includes(searchTerm) ||
                                    booking.purpose.toLowerCase().includes(searchTerm) ||
                                    booking.id.toLowerCase().includes(searchTerm);
                
                const matchesVehicleType = vehicleTypeFilter === 'all' || 
                                          booking.vehicleType.toLowerCase().includes(vehicleTypeFilter);
                
                const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

                return matchesSearch && matchesVehicleType && matchesStatus;
            });

            renderBookings(filtered);
        }

        // Event listeners for filters
        document.getElementById('booking-search').addEventListener('input', filterBookings);
        document.getElementById('vehicle-type').addEventListener('change', filterBookings);
        document.getElementById('booking-status').addEventListener('change', filterBookings);
        document.getElementById('search-btn').addEventListener('click', filterBookings);

        // Action functions
        function viewBooking(id) {
            const booking = bookings.find(b => b.id === id);
            if (booking) {
                alert(`Booking Details:\n\nID: ${booking.id}\nVehicle: ${booking.vehicleType}\nDate: ${booking.bookingDate}\nDestination: ${booking.destination}\nPurpose: ${booking.purpose}\nStatus: ${booking.status}\nBooked by: ${booking.bookedBy}\nDepartment: ${booking.department}`);
            }
        }

        function editBooking(id) {
            alert('Edit functionality would open a form to modify booking details.');
        }

        function cancelBooking(id) {
            if (confirm('Are you sure you want to cancel this booking?')) {
                const bookingIndex = bookings.findIndex(b => b.id === id);
                if (bookingIndex !== -1) {
                    bookings[bookingIndex].status = 'rejected';
                    renderBookings();
                    alert('Booking cancelled successfully.');
                }
            }
        }

        // Initialize
        renderBookings();