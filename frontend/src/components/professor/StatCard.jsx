// src/components/StatCard.jsx
import React from 'react';

// 1. Accept 'icon' as a prop
const StatCard = ({ title, value, color, icon }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
            {/* 2. Render the 'icon' prop here */}
            <div className={`p-3 rounded-full text-gray-900 dark:text-white ${color}`}>
                {icon}
            </div>
            <div className="ml-4">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-500 uppercase">{title}</div>
                <div className="text-3xl font-bold text-gray-900">{value}</div>
            </div>
        </div>
    </div>
);

export default StatCard;