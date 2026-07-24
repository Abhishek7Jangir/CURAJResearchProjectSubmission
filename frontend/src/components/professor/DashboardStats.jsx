// src/components/DashboardStats.jsx
import React from 'react';
import StatCard from './StatCard';
import { FaRegClock, FaRegCheckCircle, FaRegTimesCircle } from 'react-icons/fa';

const DashboardStats = ({ pending, approved, rejected }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
                title="Pending Projects"
                value={pending}
                color="bg-yellow-500"
                icon={<FaRegClock className="h-6 w-6" />}
            />
            <StatCard
                title="Approved Projects"
                value={approved}
                color="bg-green-500"
                icon={<FaRegCheckCircle className="h-6 w-6" />}
            />
            <StatCard
                title="Rejected Projects"
                value={rejected}
                color="bg-red-500"
                icon={<FaRegTimesCircle className="h-6 w-6" />}
            />
        </div>
    );
};

export default DashboardStats;