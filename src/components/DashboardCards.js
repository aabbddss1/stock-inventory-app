// src/components/DashboardCards.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faTruck, faShoppingCart, faClipboardList, faWarehouse, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import AddCustomer from '../pages/AddCustomer';
import AddSupplier from '../pages/AddSupplier';
import '../styles/DashboardCards.css';

function DashboardCards() {
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);

  const cardsData = [
    { title: "Add Customer", icon: faUserPlus, onClick: () => setIsAddCustomerModalOpen(true) },
    { title: "Add Suppliers", icon: faTruck, onClick: () => setIsAddSupplierModalOpen(true) },
    { title: "Sales", icon: faShoppingCart },
    { title: "Orders", icon: faClipboardList },
    { title: "Inventory", icon: faWarehouse },
    { title: "Mails", icon: faEnvelope },
  ];

  return (
    <div className="dashboard-cards">
      {cardsData.map((card, index) => (
        <div key={index} className="dashboard-card" onClick={card.onClick}>
          <FontAwesomeIcon icon={card.icon} className="card-main-icon" />
          <h4>{card.title}</h4>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </div>
      ))}

      {/* Add Customer Modal */}
      <Modal isOpen={isAddCustomerModalOpen} onClose={() => setIsAddCustomerModalOpen(false)}>
        <AddCustomer />
      </Modal>

      {/* Add Supplier Modal */}
      <Modal isOpen={isAddSupplierModalOpen} onClose={() => setIsAddSupplierModalOpen(false)}>
        <AddSupplier />
      </Modal>
    </div>
  );
}

export default DashboardCards;
