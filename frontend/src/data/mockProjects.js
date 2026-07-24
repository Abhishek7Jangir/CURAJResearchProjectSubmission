export const initialProjects = [{
    id: 1,
    title: 'Multimodal AI for Healthcare',
    startDate: '2025-01-15',
    endDate: '2026-01-15',
    budget: 50000,
    status: 'Pending',
    currentStage: 'HOD',
    principalInvestigator: 'Dr. Aruna Sharma',
    summary: 'This project aims to develop a new AI model for diagnosing diseases from multiple imaging modalities.',
    approvalHistory: []
},
{
    id: 2,
    title: 'Quantum Computing Simulation',
    startDate: '2025-02-01',
    endDate: '2025-08-01',
    budget: 25000,
    status: 'Pending',
    currentStage: 'DEAN',
    principalInvestigator: 'Prof. Vikram Singh',
    summary: 'Simulating quantum entanglement to explore new computing paradigms.',
    fileName: 'quantum_computing_proposal.pdf',
    fileUrl: 'http://localhost:3001/api/projects/download/2',
    approvalHistory: [
        { stage: 'HOD', status: 'Approved', user: 'Dr. Head Of Dept', date: '2025-01-20', comment: 'Promising research.' }
    ]
},
{
    id: 3,
    title: 'Renewable Energy Storage',
    startDate: '2024-11-10',
    endDate: '2025-11-10',
    budget: 75000,
    status: 'Approved',
    currentStage: 'COMPLETED',
    principalInvestigator: 'Dr. Priya K.',
    summary: 'Developing a novel battery technology for grid-scale energy storage.',
    approvalHistory: [
        { stage: 'HOD', status: 'Approved', user: 'Dr. HOD', date: '2024-11-11', comment: 'Approved' },
        { stage: 'DEAN', status: 'Approved', user: 'Dr. Dean', date: '2024-11-12', comment: 'Approved' },
        { stage: 'RND', status: 'Approved', user: 'R&D Dept', date: '2024-11-13', comment: 'Approved' },
        { stage: 'FINANCE', status: 'Approved', user: 'Finance Officer', date: '2024-11-14', comment: 'Approved' },
        { stage: 'VC', status: 'Approved', user: 'Vice Chancellor', date: '2024-11-15', comment: 'Final approval granted.' }
    ]
},
{
    id: 4,
    title: 'Ancient Manuscript Digitization',
    startDate: '2024-09-01',
    endDate: '2025-09-01',
    budget: 15000,
    status: 'Rejected',
    currentStage: 'DEAN',
    principalInvestigator: 'Dr. Ramesh Gupta',
    summary: 'A proposal to digitize and archive rare manuscripts from the university library.',
    approvalHistory: [
        { stage: 'HOD', status: 'Approved', user: 'Dr. HOD', date: '2024-09-02', comment: 'Good initiative.' },
        { stage: 'DEAN', status: 'Rejected', user: 'Dr. Dean', date: '2024-09-03', comment: 'Insufficient funds for this department currently.' }
    ]
}];
