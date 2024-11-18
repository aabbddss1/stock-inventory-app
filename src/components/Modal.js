// src/components/Modal.js
import React from 'react';
import '../styles/Modal.css';

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null; // Do not render the modal if it's not open

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="close-button">X</button>
        {children}
      </div>
    </div>
  );
}

export default Modal;
