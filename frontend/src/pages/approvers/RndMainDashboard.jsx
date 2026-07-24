import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ApproverLayout from '../../layouts/approvers/ApproverLayout';
import ApproverProjects from './ApproverProjects';
import ApproverEquipment from './ApproverEquipment';
import ApproverProjectAccounts from './ApproverProjectAccounts';

const RndMainDashboard = ({ user, onLogout, notification, showNotification }) => {
    return (
        <ApproverLayout
            user={user}
            onLogout={onLogout}
            notification={notification}
            showNotification={showNotification}
        >
            <Routes>
                <Route path="projects" element={<ApproverProjects user={user} showNotification={showNotification} />} />
                <Route path="project-accounts" element={<ApproverProjectAccounts user={user} showNotification={showNotification} />} />
                <Route path="equipment" element={<ApproverEquipment user={user} showNotification={showNotification} />} />
                <Route path="/" element={<Navigate to="projects" replace />} />
            </Routes>
        </ApproverLayout>
    );
};

export default RndMainDashboard;
