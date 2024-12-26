import React from 'react';
import '../styles/Notifications.css';

const Notifications = ({ notifications }) => {
  return (
    <div className="notifications-container">
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <p>No new notifications</p>
      ) : (
        <ul>
          {notifications.map((notification, index) => (
            <li key={index}>{notification.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
