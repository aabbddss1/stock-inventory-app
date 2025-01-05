import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserDocuments = () => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/userDocuments/${localStorage.getItem('userId')}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setDocuments(response.data);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, []);

  return (
    <div>
      <h1>Your Documents</h1>
      {documents.length > 0 ? (
        <ul>
          {documents.map((doc) => (
            <li key={doc.id}>
              <a href={`http://localhost:5001/${doc.filePath}`} target="_blank" rel="noopener noreferrer">
                {doc.fileName}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No documents available.</p>
      )}
    </div>
  );
};

export default UserDocuments;