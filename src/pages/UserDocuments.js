import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { api } from '../config/api';
import '../styles/Documents.css';

const UserDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const getCustomerId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload).id;
    } catch (error) {
      return null;
    }
  };

  const customerId = getCustomerId();

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      return;
    }
    fetchUserDocuments();
  }, [customerId]);

  const fetchUserDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/documents/user/${customerId}`);
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      alert('Failed to fetch documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      window.open(`${api.defaults.baseURL}/api/documents/download/${id}`, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document.');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm) ||
      doc.category.toLowerCase().includes(searchTerm)
  );

  return (
    <div className="documents-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="documents-container">
          <h1>My Documents</h1>

          <div className="documents-actions">
            <input
              type="text"
              placeholder="Search documents"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {loading ? (
            <p>Loading documents...</p>
          ) : filteredDocuments.length > 0 ? (
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Upload Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.name}</td>
                    <td>{doc.category}</td>
                    <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="download-btn"
                        onClick={() => handleDownload(doc.id)}
                      >
                        <i className="fas fa-download"></i> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No documents found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDocuments;