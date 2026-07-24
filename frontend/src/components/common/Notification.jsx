import React from 'react';

export default function Notification({ notification }) {
  if (!notification) return null;

  return (
    <div 
      className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-lg shadow-lg ${
        notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
      } text-gray-900 dark:text-white animate-slide-in`}
    >
      {notification.message}
    </div>
  );
}