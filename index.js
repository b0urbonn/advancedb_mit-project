const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'new_password',
  database: process.env.DB_NAME || 'lab_management',
};

// Database connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database tables
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create students table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS students (
        student_id VARCHAR(20) PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        course VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create lab_entries table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lab_entries (
        entry_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(20) NOT NULL,
        entry_time_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        entry_time_out TIMESTAMP NULL,
        description VARCHAR(200) DEFAULT 'Lab Use',
        FOREIGN KEY (student_id) REFERENCES students(student_id)
      )
    `);

    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

// API Endpoints

// Get all lab entries with student information
app.get('/api/lab-entries', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        le.entry_id,
        le.student_id,
        s.student_name AS Student_Name,
        le.entry_time_in AS Entry_TimeIn,
        le.entry_time_out AS Entry_TimeOut,
        le.description AS Description
      FROM lab_entries le
      JOIN students s ON le.student_id = s.student_id
      ORDER BY le.entry_time_in DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new lab entry
app.post('/api/lab-entry', async (req, res) => {
  const { student_id } = req.body;
  
  try {
    // Check if student exists
    const [student] = await pool.execute(
      'SELECT * FROM students WHERE student_id = ?',
      [student_id]
    );

    if (student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if student has an active lab entry
    const [activeEntry] = await pool.execute(
      'SELECT * FROM lab_entries WHERE student_id = ? AND entry_time_out IS NULL',
      [student_id]
    );

    if (activeEntry.length > 0) {
      // If active entry exists, update time_out
      await pool.execute(
        'UPDATE lab_entries SET entry_time_out = CURRENT_TIMESTAMP WHERE student_id = ? AND entry_time_out IS NULL',
        [student_id]
      );
      res.json({ message: 'Lab exit recorded successfully' });
    } else {
      // Create new entry
      await pool.execute(
        'INSERT INTO lab_entries (student_id) VALUES (?)',
        [student_id]
      );
      res.json({ message: 'Lab entry recorded successfully' });
    }
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add student (utility endpoint)
app.post('/api/students', async (req, res) => {
  const { student_id, student_name, course } = req.body;
  
  try {
    await pool.execute(
      'INSERT INTO students (student_id, student_name, course) VALUES (?, ?, ?)',
      [student_id, student_name, course]
    );
    res.json({ message: 'Student added successfully' });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student details
app.get('/api/students/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE student_id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`Server running on port ${PORT}`);
});