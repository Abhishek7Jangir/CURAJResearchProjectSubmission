// src/components/NeedsAttentionPanel.jsx
import React from 'react';

const NeedsAttentionPanel = ({ projects }) => {
    // Filter for projects that are pending
    const pendingProjects = projects.filter(p => p.status === 'Pending');

    if (pendingProjects.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 h-full">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Needs Attention (Pending)</h3>
                <p className="text-gray-600">No pending projects to review.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 h-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Needs Attention (Pending)</h3>
            <ul className="space-y-3">
                {pendingProjects.map(project => (
                    <li key={project.id} className="flex items-center text-gray-700">
                        <span className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></span>
                        {project.title}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default NeedsAttentionPanel;