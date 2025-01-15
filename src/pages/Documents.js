import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { api } from '../config/api';
import '../styles/Documents.css';
import { useTranslation } from 'react-i18next';

const Documents = () => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]); // Document list
  const [customers, setCustomers] = useState([]); // Customer list
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
  const [sendingEmails, setSendingEmails] = useState({}); // Track email sending state for each document

  useEffect(() => {
    fetchDocuments();
    fetchCustomers(); // Fetch customers when component mounts
  }, [page]);

  // Fetch customers from backend
  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/customers');
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Failed to fetch customers.');
    }
  };

  // Fetch documents from backend
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/documents', {
        params: { page, limit: 10 },
      });
      setDocuments(response.data.documents || []);
      setTotalPages(response.data.totalPages || 1); // Total pages for pagination
    } catch (error) {
      console.error('Error fetching documents:', error);
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
      const response = await api.post('/api/documents/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(t('uploadSuccess'));
      fetchDocuments(); // Refresh document list
      setFormData({ name: '', category: '', file: null, customerId: '' }); // Reset form
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(t('uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  // Delete document
  const handleDelete = async (id) => {
    if (window.confirm(t('deleteConfirm'))) {
      try {
        await api.delete(`/api/documents/${id}`);
        alert(t('deleteSuccess'));
        fetchDocuments(); // Refresh document list
      } catch (error) {
        console.error('Error deleting document:', error);
        alert(t('deleteError'));
      }
    }
  };

  // Download document
  const handleDownload = async (id) => {
    try {
        // Direct file download
        window.open(`${api.defaults.baseURL}/api/documents/download/${id}`, '_blank');
    } catch (error) {
        console.error('Error downloading document:', error);
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

  // Send document via email
  const handleSendEmail = async (id) => {
    try {
      setSendingEmails(prev => ({ ...prev, [id]: true }));
      await api.post(`/api/documents/resend-email/${id}`);
      alert(t('emailSent'));
    } catch (error) {
      console.error('Error sending document email:', error);
      alert(t('emailError'));
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
          <h1>{t('documents')}</h1>

          {/* Search */}
          <div className="documents-actions">
            <input
              type="text"
              placeholder={t('searchDocuments')}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* Upload Form */}
          <form className="documents-form" onSubmit={handleUpload}>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              required
            >
              <option value="">{t('selectCustomer')}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
            <input
              type="text"
              name="name"
              placeholder={t('documentName')}
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
              <option value="">{t('selectCategory')}</option>
              <option value="Invoice">{t('invoice')}</option>
              <option value="Contract">{t('contract')}</option>
              <option value="Report">{t('report')}</option>
              <option value="Other">{t('other')}</option>
            </select>
            <input
              type="file"
              name="file"
              accept=".pdf,.docx"
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={isUploading}>
              <i className="fa fa-upload"></i> {isUploading ? t('uploading') : t('upload')}
            </button>
          </form>

          {/* Document List */}
          {loading ? (
            <p>{t('loading')}</p>
          ) : filteredDocuments.length > 0 ? (
            <>
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('category')}</th>
                    <th>{t('customerIdHeader')}</th>
                    <th>{t('uploadDate')}</th>
                    <th>{t('actions')}</th>
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
                        <button
                          className="download-btn"
                          onClick={() => handleDownload(doc.id)}
                        >
                          <i className="fas fa-download"></i> {t('download')}
                        </button>
                        <button
                          className="email-btn"
                          onClick={() => handleSendEmail(doc.id)}
                          disabled={sendingEmails[doc.id]}
                        >
                          {sendingEmails[doc.id] ? (
                            <>
                              <i className="fa fa-spinner fa-spin"></i> {t('sending')}
                            </>
                          ) : (
                            <>
                              <i className="fas fa-envelope"></i> {t('Send')}
                            </>
                          )}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <i className="fas fa-trash"></i> {t('delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(page - 1)} 
                  disabled={page === 1}
                >
                  {t('previous')}
                </button>
                <span>
                  {t('pageOf', { current: page, total: totalPages })}
                </span>
                <button 
                  onClick={() => handlePageChange(page + 1)} 
                  disabled={page === totalPages}
                >
                  {t('next')}
                </button>
              </div>
            </>
          ) : (
            <p>{t('noDocuments')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;