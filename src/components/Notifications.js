import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCircleCheck, faSpinner, faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import '../styles/Notifications.css';

const Notifications = ({ notifications }) => {
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <FontAwesomeIcon icon={faCircleCheck} className="status-icon completed" />;
      case 'pending':
        return <FontAwesomeIcon icon={faSpinner} className="status-icon pending" />;
      case 'cancelled':
        return <FontAwesomeIcon icon={faTimes} className="status-icon cancelled" />;
      case 'processing':
        return <FontAwesomeIcon icon={faSpinner} className="status-icon processing spin" />;
      default:
        return <FontAwesomeIcon icon={faExclamationTriangle} className="status-icon" />;
    }
  };

  const formatDate = (date) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return notificationDate.toLocaleDateString();
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>
          <FontAwesomeIcon icon={faBell} className="notification-bell" />
          Notifications
        </h2>
        {notifications.length > 0 && (
          <span className="notification-count">{notifications.length}</span>
        )}
      </div>
      
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <p className="no-notifications">No new notifications</p>
        ) : (
          <ul>
            {notifications.map((notification, index) => (
              <li 
                key={notification.id || index} 
                className={`notification-item ${notification.isRead ? 'read' : 'unread'} ${notification.type === 'status_change' ? 'status-notification' : ''}`}
              >
                <div className="notification-content">
                  {notification.type === 'status_change' && (
                    <div className="status-indicator">
                      {getStatusIcon(notification.status)}
                    </div>
                  )}
                  <div className="notification-message">
                    <p>{notification.message}</p>
                    <span className="notification-time">{formatDate(notification.date)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
