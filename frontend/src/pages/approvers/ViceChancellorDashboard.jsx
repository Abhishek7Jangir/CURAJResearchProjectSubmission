import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ApproverLayout from '../../layouts/approvers/ApproverLayout';
import ApproverEquipment from './ApproverEquipment';
import VcApprovedProjects from './VcApprovedProjects';

const ViceChancellorDashboard = ({ user, onLogout, notification, showNotification }) => {
    return (
        <ApproverLayout
            user={user}
            onLogout={onLogout}
            notification={notification}
            showNotification={showNotification}
            hideProjectAccountsTab
        >
            <Routes>
                <Route path="projects" element={<VcApprovedProjects showNotification={showNotification} />} />
                <Route path="equipment" element={<ApproverEquipment user={user} showNotification={showNotification} />} />
                <Route path="/" element={<Navigate to="projects" replace />} />
            </Routes>
        </ApproverLayout>
    );
};

export default ViceChancellorDashboard;
