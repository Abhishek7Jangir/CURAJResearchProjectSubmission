import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import ApproverLayout from '../../layouts/approvers/ApproverLayout';
import ApproverProjects from './ApproverProjects';
import ApproverEquipment from './ApproverEquipment';
import ApproverUtilizationCertificate from './ApproverUtilizationCertificate';

const ucTab = [
    { id: 'utilization-certificate', label: 'Utilization Certificate', icon: ClipboardList, path: '/utilization-certificate' }
];

const RegistrarDashboard = ({ user, onLogout, notification, showNotification }) => {
    return (
        <ApproverLayout
            user={user}
            onLogout={onLogout}
            notification={notification}
            showNotification={showNotification}
            extraTabs={ucTab}
            hideProjectAccountsTab
        >
            <Routes>
                <Route path="projects" element={<ApproverProjects user={user} showNotification={showNotification} />} />
                <Route path="equipment" element={<ApproverEquipment user={user} showNotification={showNotification} />} />
                <Route path="utilization-certificate" element={<ApproverUtilizationCertificate user={user} showNotification={showNotification} />} />
                <Route path="/" element={<Navigate to="projects" replace />} />
            </Routes>
        </ApproverLayout>
    );
};

export default RegistrarDashboard;
