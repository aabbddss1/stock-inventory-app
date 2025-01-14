import React from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { useTranslation } from 'react-i18next';
import '../styles/HelpCenter.css';

function HelpCenter() {
  const { t } = useTranslation();
  
  const adminFeatures = [
    {
      title: 'Inventory Management',
      description: 'Manage your product inventory, add new products, update quantities, and track stock levels. You can export inventory data to Excel and search through products.',
      features: [
        'Add new products with name, category, quantity, and price',
        'Edit existing product details',
        'Search products by name or category',
        'Export inventory data to Excel',
        'Track stock levels and get low stock alerts'
      ]
    },
    {
      title: 'Customer Management',
      description: 'Manage customer accounts and their information. View customer details, edit profiles, and handle customer-related operations.',
      features: [
        'Add new customers with contact information',
        'Edit customer profiles',
        'View customer order history',
        'Delete customer accounts when necessary',
        'Search customers by name or email'
      ]
    },
    {
      title: 'Supplier Management',
      description: 'Handle all supplier-related operations, including adding new suppliers and managing existing ones.',
      features: [
        'Add new suppliers with contact details',
        'Edit supplier information',
        'View supplier history',
        'Manage supplier relationships',
        'Track supplier performance'
      ]
    },
    {
      title: 'Sales & Orders',
      description: 'Track and manage all sales operations and order processing within the system.',
      features: [
        'View sales dashboard with key metrics',
        'Track orders by status (Pending, Approved, On Process, Completed)',
        'Export sales data to Excel or PDF',
        'View sales analytics and charts',
        'Monitor sales performance'
      ]
    },
    {
      title: 'Document Management',
      description: 'Handle all document-related operations including uploads, downloads, and sharing.',
      features: [
        'Upload various document types (PDF, Word)',
        'Categorize documents by type',
        'Search through documents',
        'Send documents via email',
        'Manage document access permissions'
      ]
    },
    {
      title: 'Dealership Management',
      description: 'Manage dealership locations and their operations within the system.',
      features: [
        'Add new dealership locations',
        'Manage dealership information',
        'Track dealership performance',
        'View dealership inventory',
        'Handle dealership-specific operations'
      ]
    },
    {
      title: 'Financial Management',
      description: 'Handle financial aspects including receivables and payables.',
      features: [
        'Manage accounts receivable',
        'Track accounts payable',
        'Generate financial reports',
        'Export financial data',
        'Monitor payment status'
      ]
    }
  ];

  return (
    <div className="help-center-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="help-center-container">
          <h1>{t('helpCenter')}</h1>
          
          <div className="help-sections">
            {adminFeatures.map((section, index) => (
              <div key={index} className="help-section">
                <h2>{section.title}</h2>
                <p className="section-description">{section.description}</p>
                <div className="feature-list">
                  <h3>Key Features:</h3>
                  <ul>
                    {section.features.map((feature, featureIndex) => (
                      <li key={featureIndex}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpCenter; 