const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2');

const multer = require('multer');
const uploadFolder = path.join(__dirname, 'public/uploads');
const fs = require('fs');

const app = express();
const PORT = 3000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       
    password: '',       
    database: 'mof_sso'
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log('Connected to MySQL DB');
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'mof-secret-key',
    resave: false,
    saveUninitialized: true,
}));
app.use(express.static(path.join(__dirname, 'public')));

// Login route (no DB check, just email pattern + password length)
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email.endsWith('@mofth.onmicrosoft.com')) {
        return res.json({ success: false, message: 'Use @mofth.onmicrosoft.com email only' });
    }

    if (!password || password.length < 8) {
        return res.json({ success: false, message: 'Password must be at least 8 characters' });
    }

    req.session.user = {
        email,
        name: email.split('@')[0].split('.').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' '), // Convert "john.doe" to "John Doe"
        department: 'General'
    };

    return res.json({ success: true });
});

// Auth-protected portal route
app.get('/portal.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/index.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});


app.get('/user-info', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    res.json(req.session.user);
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/index.html');
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Ensure upload folder exists
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

// Multer config
const storage = multer.diskStorage({
    destination: uploadFolder,
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const filename = `${file.fieldname}-${timestamp}${ext}`;
        cb(null, filename);
    }
});
const upload = multer({ storage });

// Upload route
app.post('/upload-document', upload.single('document'), (req, res) => {
    const { title, type, description } = req.body;
    const filePath = `/uploads/${req.file.filename}`;
    const createdBy = req.session.user?.email || 'system';

    const sql = `
        INSERT INTO documents (title, type, status, description, file_path, created_by, created_at, updated_at)
        VALUES (?, ?, 'draft', ?, ?, ?, NOW(), NOW())
    `;
    const values = [title, type, description, filePath, createdBy];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Upload DB error:', err);
            return res.status(500).json({ success: false, message: 'Upload failed' });
        }
        res.json({ success: true, message: 'Document uploaded successfully' });
    });
});

app.get('/documents', (req, res) => {
    db.query('SELECT * FROM documents ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Fetch error:', err);
            return res.status(500).json({ success: false, message: 'Failed to load documents' });
        }
        res.json(results);
    });
});

app.post('/update-status', async (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
        return res.status(400).json({ success: false, message: 'Missing data' });
    }

    try {
        const [result] = await db.execute(
            'UPDATE documents SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 1) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Document not found' });
        }
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// delete route
app.delete('/documents/:id', (req, res) => {
    const documentId = req.params.id;
    
    db.query('DELETE FROM documents WHERE id = ?', [documentId], (err, result) => {
        if (err) {
            console.error('Delete error:', err);
            return res.status(500).json({ success: false, message: 'Delete failed' });
        }
        
        if (result.affectedRows === 0) {
            return res.json({ success: false, message: 'Document not found' });
        }
        
        res.json({ success: true, message: 'Document deleted successfully' });
    });
});

app.use(express.static(path.join(__dirname, 'public')));

//route to leave_request.html
app.get('/leave_request.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/index.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'leave_request.html'));
});

// Leave Request Endpoints
app.post('/submit-leave', (req, res) => {
    console.log("POST /submit-leave called");
    console.log("Session user:", req.session.user);
    console.log("Request body:", req.body);

    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }

    const { leaveType, fromDate, toDate, message } = req.body;
    const employeeEmail = req.session.user.email;

    const sql = `
        INSERT INTO leave_requests 
        (employee_email, leave_type, from_date, to_date, message, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', NOW())
    `;
    
    db.query(sql, [employeeEmail, leaveType, fromDate, toDate, message], (err, result) => {
        if (err) {
            console.error('Leave submission error:', err);
            return res.status(500).json({ success: false, message: 'Leave submission failed' });
        }

        console.log('Leave request inserted:', result);
        res.json({ success: true, message: 'Leave request submitted successfully' });
    });
});

app.get('/user-info', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    res.json({
        email: req.session.user.email,
        name: req.session.user.name || req.session.user.email.split('@')[0]
    });
});

// Meeting Room Endpoints
app.get('/meeting-rooms', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    db.query('SELECT * FROM meeting_rooms', (err, rooms) => {
        if (err) {
            console.error('Error fetching rooms:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rooms);
    });
});

app.get('/room-availability/:roomId', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { roomId } = req.params;
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
    }

    const sql = `
        SELECT start_time, end_time 
        FROM room_bookings 
        WHERE room_id = ? 
        AND booking_date = ? 
        AND status = 'approved'
    `;
    
    db.query(sql, [roomId, date], (err, bookings) => {
        if (err) {
            console.error('Error fetching bookings:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(bookings);
    });
});

app.post('/book-room', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { roomId, bookingDate, startTime, endTime } = req.body;
    const userEmail = req.session.user.email;

    // Validate time slot (30 minutes minimum)
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const duration = (end - start) / (1000 * 60); // in minutes
    
    if (duration < 30) {
        return res.status(400).json({ error: 'Minimum booking duration is 30 minutes' });
    }

    // Check for existing bookings
    const checkSql = `
        SELECT id 
        FROM room_bookings 
        WHERE room_id = ? 
        AND booking_date = ? 
        AND (
            (start_time < ? AND end_time > ?) OR
            (start_time >= ? AND start_time < ?) OR
            (end_time > ? AND end_time <= ?)
        )
        AND status != 'rejected'
    `;
    
    db.query(checkSql, [roomId, bookingDate, endTime, startTime, startTime, endTime, startTime, endTime], 
        (err, conflicts) => {
            if (err) {
                console.error('Error checking conflicts:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (conflicts.length > 0) {
                return res.status(409).json({ error: 'Time slot already booked' });
            }

            // Insert new booking
            const insertSql = `
                INSERT INTO room_bookings 
                (room_id, user_email, booking_date, start_time, end_time, status)
                VALUES (?, ?, ?, ?, ?, 'pending')
            `;
            
            db.query(insertSql, [roomId, userEmail, bookingDate, startTime, endTime], (err, result) => {
                if (err) {
                    console.error('Error creating booking:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ success: true, bookingId: result.insertId });
            });
        });
});

app.get('/my-bookings', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const sql = `
        SELECT rb.*, mr.name AS room_name
        FROM room_bookings rb
        JOIN meeting_rooms mr ON rb.room_id = mr.id
        WHERE rb.user_email = ?
        ORDER BY rb.booking_date DESC, rb.start_time
    `;

    db.query(sql, [req.session.user.email], (err, results) => {
        if (err) {
            console.error('Error fetching my bookings:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.delete('/cancel-booking/:id', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }

    const bookingId = req.params.id;
    const userEmail = req.session.user.email;

    const sql = `
        DELETE FROM room_bookings 
        WHERE id = ? AND user_email = ?
    `;

    db.query(sql, [bookingId, userEmail], (err, result) => {
        if (err) {
            console.error('Error cancelling booking:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found or unauthorized' });
        }

        res.json({ success: true, message: 'Booking cancelled successfully' });
    });
});
