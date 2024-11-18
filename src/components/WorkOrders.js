// src/components/WorkOrders.js
import React from 'react';
import '../styles/WorkOrders.css';

function WorkOrders() {
  return (
    <div className="work-orders">
      <h2>Work Orders</h2>
      <div className="filters">
        <span>Filters</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Category</span>
        <span>Assigned to</span>
      </div>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Category</th>
            <th>Assigned to</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Air Handler Inspection</td>
            <td><span className="status open">Open</span></td>
            <td><span className="priority medium">Medium</span></td>
            <td>HVAC</td>
            <td>Sam Samuel</td>
          </tr>
          <tr>
            <td>Roof Leaking</td>
            <td><span className="status open">Open</span></td>
            <td><span className="priority critical">Critical</span></td>
            <td>Roofing</td>
            <td>Sam Samuel</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default WorkOrders;
