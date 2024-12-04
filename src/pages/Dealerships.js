// src/pages/Dealerships.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import '../styles/Dealerships.css';

const Dealerships = () => {
  const [dealerships, setDealerships] = useState([]);
  const [formData, setFormData] = useState({ name: '', location: '' });

  // Fetch dealerships from backend
  useEffect(() => {
    const fetchDealerships = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/dealerships');
        setDealerships(response.data);
      } catch (error) {
        console.error('Error fetching dealerships:', error);
      }
    };

    fetchDealerships();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add a dealership
  const handleAddDealership = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/dealerships/add', formData);
      setDealerships([...dealerships, response.data]);
      setFormData({ name: '', location: '' }); // Reset form
    } catch (error) {
      console.error('Error adding dealership:', error);
    }
  };

  // Delete a dealership
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/dealerships/${id}`);
      setDealerships(dealerships.filter((dealership) => dealership._id !== id));
    } catch (error) {
      console.error('Error deleting dealership:', error);
    }
  };

  return (
    <div className="dealerships-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="dealerships-container">
          <h1>Dealerships</h1>

          {/* Form to Add Dealership */}
          <form className="dealerships-form" onSubmit={handleAddDealership}>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
              required
            />
            <button type="submit">Add Dealership</button>
          </form>

          {/* List of Dealerships */}
          <div className="dealerships-list">
            {dealerships.map((dealership) => (
              <div key={dealership._id} className="dealership-card">
                <h3>{dealership.name}</h3>
                <p>{dealership.location}</p>
                <button onClick={() => handleDelete(dealership._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dealerships;
