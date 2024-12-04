// src/pages/Documents.js
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import '../styles/Documents.css';

const Documents = () => {
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: 'Invoice_001.pdf',
      category: 'Invoice',
      uploadDate: '2024-11-18',
    },
    {
      id: 2,
      name: 'Contract_ABC.docx',
      category: 'Contract',
      uploadDate: '2024-11-15',
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    file: null,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Add or update document
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedDocument) {
      // Update document
      const updatedDocuments = documents.map((doc) =>
        doc.id === selectedDocument.id
          ? { ...formData, id: doc.id, uploadDate: doc.uploadDate }
          : doc
      );
      setDocuments(updatedDocuments);
      setSelectedDocument(null);
    } else {
      // Add new document
      const newDocument = {
        ...formData,
        id: Date.now(),
        uploadDate: new Date().toISOString().split('T')[0],
      };
      setDocuments([...documents, newDocument]);
    }

    setFormData({ name: '', category: '', file: null });
  };

  // Edit document
  const handleEdit = (document) => {
    setSelectedDocument(document);
    setFormData({
      name: document.name,
      category: document.category,
      file: null,
    });
  };

  // Delete document
  const handleDelete = (id) => {
    const updatedDocuments = documents.filter((doc) => doc.id !== id);
    setDocuments(updatedDocuments);
  };

  // Download document (simulation)
  const handleDownload = (document) => {
    alert(`Downloading: ${document.name}`);
  };

  // Search functionality
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
  };

  return (
    <div className="documents-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="documents-container">
          <h1>Documents</h1>

          {/* Search and Upload */}
          <div className="documents-actions">
            <input
              type="text"
              placeholder="Search by document name"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* Add/Edit Document Form */}
          <form className="documents-form" onSubmit={handleSubmit}>
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
              accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
              onChange={handleChange}
              required={!selectedDocument}
            />
            <button type="submit">
              {selectedDocument ? 'Update Document' : 'Upload Document'}
            </button>
          </form>

          {/* Documents List Table */}
          <table className="documents-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Category</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents
                .filter((doc) =>
                  doc.name.toLowerCase().includes(searchTerm)
                )
                .map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.name}</td>
                    <td>{doc.category}</td>
                    <td>{doc.uploadDate}</td>
                    <td>
                      <button onClick={() => handleDownload(doc)}>Download</button>
                      <button onClick={() => handleEdit(doc)}>Edit</button>
                      <button onClick={() => handleDelete(doc.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Documents;
