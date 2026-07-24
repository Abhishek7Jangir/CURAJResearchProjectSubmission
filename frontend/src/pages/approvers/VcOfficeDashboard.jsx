import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ApproverLayout from '../../layouts/approvers/ApproverLayout';
import ApproverEquipment from './ApproverEquipment';

const VcOfficeDashboard = ({ user, onLogout, notification, showNotification }) => {
    return (
        <ApproverLayout
            user={user}
            onLogout={onLogout}
            notification={notification}
            showNotification={showNotification}
            hideProjectsTab
            hideProjectAccountsTab
        >
            <Routes>
                <Route path="equipment" element={<ApproverEquipment user={user} showNotification={showNotification} />} />
                <Route path="/" element={<Navigate to="equipment" replace />} />
            </Routes>
        </ApproverLayout>
    );
};

export default VcOfficeDashboard;
