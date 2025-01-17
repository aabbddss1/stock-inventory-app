import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { api } from '../config/api';
import '../styles/Documents.css';

const UserDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingEmails, setSendingEmails] = useState({});

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

  // Send document via email
  const handleSendEmail = async (id) => {
    try {
      setSendingEmails(prev => ({ ...prev, [id]: true }));
      await api.post(`/api/documents/resend-email/${id}`);
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending document email:', error);
      alert('Failed to send email.');
    } finally {
      setSendingEmails(prev => ({ ...prev, [id]: false }));
    }
  };

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
                      <button
                        className="email-btn"
                        onClick={() => handleSendEmail(doc.id)}
                        disabled={sendingEmails[doc.id]}
                      >
                        {sendingEmails[doc.id] ? (
                          <>
                            <i className="fa fa-spinner fa-spin"></i> Sending...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-envelope"></i> Send
                          </>
                        )}
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