import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, 
  faTruck, 
  faShoppingCart, 
  faClipboardList, 
  faWarehouse, 
  faEnvelope, 
  faBell, 
  faListCheck, 
  faListAlt 
} from '@fortawesome/free-solid-svg-icons';
import Modal from './Modal';
import AddCustomer from '../pages/AddCustomer';
import AddSupplier from '../pages/AddSupplier';
import axios from 'axios'; // Axios for API calls
import '../styles/DashboardCards.css';

function DashboardCards() {
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);

  // State for dynamic data
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    // Fetch dynamic data for dashboard cards
    const fetchData = async () => {
      try {
        const ordersResponse = await axios.get('http://localhost:5001/api/orders');
        const notificationsResponse = await axios.get('http://localhost:5001/api/notifications');

        setTotalOrders(ordersResponse.data.length);
        setPendingOrders(ordersResponse.data.filter(order => order.status === 'Pending').length);
        setNotifications(notificationsResponse.data.length);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const cardsData = [
    { title: `${totalOrders} Orders`, icon: faListAlt, description: `total orders in the system.` },
    { title: `${pendingOrders} Pending`, icon: faListCheck, description: ` orders are pending.` },
    { title: "Notifications", icon: faBell, description: `${notifications} notifications available.` },
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
          <p>{card.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}</p>
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
