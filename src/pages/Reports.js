import React, { useState } from 'react';
import { Card, Row, Col, Button, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faWarehouse, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import '../styles/Reports.css';
import { useTranslation } from 'react-i18next';

function Reports() {
  const { t } = useTranslation();
  const [activeReport, setActiveReport] = useState('sales');

  const reportCards = [
    {
      title: 'Sales Reports',
      icon: faChartLine,
      type: 'sales',
      description: 'View detailed sales analytics and trends'
    },
    {
      title: 'Customer Reports',
      icon: faUsers,
      type: 'customers',
      description: 'Analyze customer behavior and demographics'
    },
    {
      title: 'Inventory Reports',
      icon: faWarehouse,
      type: 'inventory',
      description: 'Track inventory levels and movements'
    },
    {
      title: 'Order Reports',
      icon: faFileAlt,
      type: 'orders',
      description: 'Monitor order status and history'
    }
  ];

  const renderReportContent = () => {
    return (
      <Card className="mt-4">
        <Card.Body>
          <h4>{reportCards.find(card => card.type === activeReport)?.title}</h4>
          <div className="report-filters mb-3">
            <Button variant="outline-primary" className="me-2">Last 7 Days</Button>
            <Button variant="outline-primary" className="me-2">Last 30 Days</Button>
            <Button variant="outline-primary">Custom Range</Button>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Description</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>2024-01-20</td>
                <td>Sample Report Data</td>
                <td>$1,234</td>
                <td>Completed</td>
              </tr>
              {/* Add more rows as needed */}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="reports-page">
      <Sidebar />
      <div className="main-content">
        <TopNavbar />
        <div className="reports-container">
          <h1 className="page-title">Reports Dashboard</h1>
          
          <Row className="report-cards">
            {reportCards.map((card, index) => (
              <Col md={3} key={index}>
                <Card 
                  className={`report-card ${activeReport === card.type ? 'active' : ''}`}
                  onClick={() => setActiveReport(card.type)}
                >
                  <Card.Body>
                    <div className="report-card-icon">
                      <FontAwesomeIcon icon={card.icon} />
                    </div>
                    <Card.Title>{card.title}</Card.Title>
                    <Card.Text>{card.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
}

export default Reports; 