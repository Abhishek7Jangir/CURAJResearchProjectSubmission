import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Package, Landmark } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Notification from '../../components/common/Notification';

const ApproverLayout = ({ user, onLogout, notification, showNotification, children, extraTabs = [], hideProjectsTab = false, hideProjectAccountsTab = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(() => {
        const path = location.pathname;
        if (path.includes('/utilization-certificate')) return 'utilization-certificate';
        if (path.includes('/project-accounts')) return 'project-accounts';
        return path.includes('/equipment') ? 'equipment' : 'projects';
    });

    // Update active tab when route changes
    useEffect(() => {
        const path = location.pathname;
        const extra = extraTabs.find((t) => path.includes(t.path));
        if (extra) setActiveTab(extra.id);
        else if (path.includes('/equipment')) setActiveTab('equipment');
        else if (path.includes('/project-accounts')) setActiveTab('project-accounts');
        else setActiveTab('projects');
    }, [location.pathname]);

    const tabs = [
        ...(hideProjectsTab ? [] : [{ id: 'projects', label: 'Projects', icon: FileText, path: '/projects' }]),
        ...(hideProjectAccountsTab ? [] : [{ id: 'project-accounts', label: 'Project Accounts', icon: Landmark, path: '/project-accounts' }]),
        { id: 'equipment', label: 'Indent Approval', icon: Package, path: '/equipment' },
        ...extraTabs
    ];

    const handleTabChange = (tab) => {
        setActiveTab(tab.id);
        // Get base path (e.g., /hod-dashboard, /dean-dashboard, etc.)
        const pathParts = location.pathname.split('/');
        const basePath = pathParts.slice(0, 2).join('/'); // Gets /hod-dashboard or /dean-dashboard
        navigate(`${basePath}${tab.path}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-900">
            <Navbar user={user} onLogout={onLogout} />
            <Notification notification={notification} />

            <main className="max-w-screen-2xl mx-auto px-6 py-8">
                {/* Header with animated title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {user.role} Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Review and approve research project applications and resource allotment
                    </p>
                </motion.div>

                {/* Navigation Tabs with animations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="flex gap-2 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 border border-gray-200 dark:border-gray-700/50 shadow-lg">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab)}
                                    className={`relative flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                                        isActive
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    <Icon className={`relative z-10 w-5 h-5 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                                    <span className="relative z-10">{tab.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Page Content with fade animation */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default ApproverLayout;

