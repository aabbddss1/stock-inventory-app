import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import axios from 'axios';
import '../styles/Documents.css';

const Documents = () => {
  const [documents, setDocuments] = useState([]); // Document list
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    file: null,
    customerId: '',
  }); // Form data for uploads
  const [searchTerm, setSearchTerm] = useState(''); // Search input state
  const [loading, setLoading] = useState(true); // Loading state
  const [isUploading, setIsUploading] = useState(false); // Uploading state
  const [page, setPage] = useState(1); // Current page
  const [totalPages, setTotalPages] = useState(1); // Total pages for pagination

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

  useEffect(() => {
    fetchDocuments();
  }, [page]);

  // Fetch documents from backend
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/documents`, {
        params: { page, limit: 10 },
      });
      setDocuments(response.data.documents || []);
      setTotalPages(response.data.totalPages || 1); // Total pages for pagination
    } catch (error) {
      console.error('Error fetching documents:', error.response?.data || error.message);
      alert('Failed to fetch documents.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      const file = files[0];
      if (file && !['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        alert('Only PDF and Word documents are allowed.');
        return;
      }
      setFormData({ ...formData, file });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Upload document to the backend
  const handleUpload = async (e) => {
    e.preventDefault();
    const uploadFormData = new FormData();
    uploadFormData.append('name', formData.name);
    uploadFormData.append('category', formData.category);
    uploadFormData.append('customerId', formData.customerId);
    uploadFormData.append('file', formData.file);

    try {
      setIsUploading(true);
      const response = await axios.post(`${API_BASE_URL}/api/documents/upload`, uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Document uploaded successfully!');
      fetchDocuments(); // Refresh document list
      setFormData({ name: '', category: '', file: null, customerId: '' }); // Reset form
    } catch (error) {
      console.error('Error uploading document:', error.response?.data || error.message);
      alert('Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete document
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/documents/${id}`);
        alert('Document deleted successfully!');
        fetchDocuments(); // Refresh document list
      } catch (error) {
        console.error('Error deleting document:', error.response?.data || error.message);
        alert('Failed to delete document.');
      }
    }
  };

  // Download document
  const handleDownload = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/documents/download/${id}`);
      const signedUrl = response.data.signedUrl;

      // Trigger file download
      const link = document.createElement('a');
      link.href = signedUrl;
      link.target = '_blank';
      link.download = ''; // Optional: Set a custom filename here
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading document:', error.response?.data || error.message);
      alert('Failed to download document.');
    }
  };

  // Search documents
  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Filter documents based on search term
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm) ||
      doc.category.toLowerCase().includes(searchTerm)
  );

  // Handle Pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="documents-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="documents-container">
          <h1>Documents</h1>

          {/* Search */}
          <div className="documents-actions">
            <input
              type="text"
              placeholder="Search documents"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* Upload Form */}
          <form className="documents-form" onSubmit={handleUpload}>
            <input
              type="text"
              name="customerId"
              placeholder="Customer ID"
              value={formData.customerId}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="name"
              placeholder="Document Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              <option value="Invoice">Invoice</option>
              <option value="Contract">Contract</option>
              <option value="Report">Report</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="file"
              name="file"
              accept=".pdf,.docx"
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>

          {/* Document List */}
          {loading ? (
            <p>Loading documents...</p>
          ) : filteredDocuments.length > 0 ? (
            <>
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Customer ID</th>
                    <th>Upload Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.name}</td>
                      <td>{doc.category}</td>
                      <td>{doc.customer_id}</td>
                      <td>{new Date(doc.upload_date).toLocaleDateString()}</td>
                      <td>
                        <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                        <button onClick={() => handleDelete(doc.id)}>Delete</button>
                        <button onClick={() => handleDownload(doc.id)}>Download</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="pagination">
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                  Next
                </button>
              </div>
            </>
          ) : (
            <p>No documents found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;