import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const App = () => {
  const [studentId, setStudentId] = useState('');
  const [labEntries, setLabEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('day'); // 'day', 'month', 'all'

  const fetchLabEntries = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/lab-entries');
      setLabEntries(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  }, []);

  useEffect(() => {
    fetchLabEntries();
  }, [fetchLabEntries]);

  const filterEntries = useCallback(() => {
    let filtered = [...labEntries];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.Student_Name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    if (filterType === 'day') {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.Entry_TimeIn).toISOString().split('T')[0];
        return entryDate === filterDate;
      });
    } else if (filterType === 'month') {
      filtered = filtered.filter(entry => {
        const entryMonth = new Date(entry.Entry_TimeIn).toISOString().slice(0, 7);
        const filterMonth = filterDate.slice(0, 7);
        return entryMonth === filterMonth;
      });
    }

    setFilteredEntries(filtered);
  }, [labEntries, searchQuery, filterDate, filterType]);

  useEffect(() => {
    filterEntries();
  }, [filterEntries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/lab-entry', { student_id: studentId });
      setStudentId('');
      fetchLabEntries();
    } catch (error) {
      console.error('Error submitting entry:', error);
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: 'minmax(250px, 300px) 1fr',
        alignItems: 'start'
      }}>
        {/* Student ID Input Section */}
        <div style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: 'white'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Enter Student ID</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Student ID"
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Submit
            </button>
          </form>
        </div>

        {/* Lab Records Section */}
        <div style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: 'white'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Lab Entry Records</h2>
          
          {/* Filters */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                <option value="day">Daily</option>
                <option value="month">Monthly</option>
                <option value="all">All Records</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '12px', backgroundColor: '#f8f9fa' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px', backgroundColor: '#f8f9fa' }}>Time In</th>
                  <th style={{ textAlign: 'left', padding: '12px', backgroundColor: '#f8f9fa' }}>Time Out</th>
                  <th style={{ textAlign: 'left', padding: '12px', backgroundColor: '#f8f9fa' }}>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px' }}>{entry.Student_Name}</td>
                    <td style={{ padding: '12px' }}>{new Date(entry.Entry_TimeIn).toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      {entry.Entry_TimeOut 
                        ? new Date(entry.Entry_TimeOut).toLocaleString() 
                        : '---'}
                    </td>
                    <td style={{ padding: '12px' }}>{entry.Description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEntries.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#666'
              }}>
                No records found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;