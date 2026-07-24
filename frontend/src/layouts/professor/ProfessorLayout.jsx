import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, FileText, Package, ClipboardList, Landmark, FolderOpen } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Dashboard from '../../pages/professor/Dashboard';
import Projects from '../../pages/professor/Projects';
import MyProjects from '../../pages/professor/MyProjects';
import Equipment from '../../pages/professor/Equipment';
import UtilizationCertificatePage from '../../pages/professor/UtilizationCertificate';
import ProjectForm from '../../components/common/forms/ProjectForm';
import EquipmentForm from '../../components/common/forms/EquipmentForm';
import UtilizationCertificateForm from '../../components/common/forms/UtilizationCertificateForm';
import ProjectAccountForm from '../../components/common/forms/ProjectAccountForm';
import Notification from '../../components/common/Notification';
import ProjectAccounts from '../../pages/professor/ProjectAccounts';

export default function MainLayout({
  user,
  onLogout,
  notification,
  showNotification
}) {
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipmentRequest, setEditingEquipmentRequest] = useState(null);
  const [showUtilizationForm, setShowUtilizationForm] = useState(false);
  const [editingUtilizationCertificate, setEditingUtilizationCertificate] = useState(null);
  const [showProjectAccountForm, setShowProjectAccountForm] = useState(false);
  const [editingProjectAccount, setEditingProjectAccount] = useState(null);
  const [projects, setProjects] = useState([]);
  const [equipmentRequests, setEquipmentRequests] = useState([]);
  const [utilizationCertificates, setUtilizationCertificates] = useState([]);
  const [projectAccounts, setProjectAccounts] = useState([]);
  const [eligibleAccountProjects, setEligibleAccountProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Update active tab when location changes
  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const currentTab = pathParts[1] || 'dashboard';
    setActiveTab(currentTab);
  }, [location.pathname]);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
    fetchEquipment();
    fetchUtilizationCertificates();
    fetchProjectAccounts();
    fetchEligibleAccountProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('/api/projects/my-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } else {
        let message = 'Failed to fetch projects';
        try {
          const error = await res.json();
          message = error?.error || message;
        } catch (_) {
          // ignore parse errors and use fallback message
        }
        console.error(message);
        showNotification(message, 'error');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      showNotification('Unable to load projects. Please check backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUtilizationCertificates = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('/api/utilization-certificates/my-certificates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUtilizationCertificates(Array.isArray(data) ? data : []);
      } else {
        let message = 'Failed to fetch utilization certificates';
        try {
          const error = await res.json();
          message = error?.error || message;
        } catch (_) {}
        console.error(message);
        showNotification(message, 'error');
      }
    } catch (error) {
      console.error('Error fetching utilization certificates:', error);
      showNotification('Unable to load utilization certificates. Please check backend connection.', 'error');
    }
  };

  const fetchEquipment = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('/api/equipment/my-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setEquipmentRequests(Array.isArray(data) ? data : []);
      } else {
        let message = 'Failed to fetch resource allotment requests';
        try {
          const error = await res.json();
          message = error?.error || message;
        } catch (_) {
          // ignore parse errors and use fallback message
        }
        console.error(message);
        showNotification(message, 'error');
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showNotification('Unable to load resource allotments. Please check backend connection.', 'error');
    }
  };

  const handleTabChange = (tab) => {
    navigate(tab.id);
  };

  const fetchProjectAccounts = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('/api/project-accounts/my-accounts', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setProjectAccounts(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEligibleAccountProjects = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('/api/project-accounts/eligible-projects', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setEligibleAccountProjects(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  // New / updated Module 1 project submission handler
  const handleProjectSubmit = async (formData, coPis, budgetHeads, fileData, existingProjectId) => {
    try {
      const token = sessionStorage.getItem('token');

      const isResubmission = Boolean(existingProjectId);

      // Only include document fields that were actually changed on resubmission.
      // This prevents overwriting existing Cloudinary URLs with null.
      const documentsPayload = isResubmission
        ? {
            ...(fileData?.completeProposal ? { completeProposal: fileData.completeProposal } : {}),
            ...(fileData?.endorsementLetter ? { endorsementLetter: fileData.endorsementLetter } : {}),
            ...(fileData?.piCoPiUndertaking ? { piCoPiUndertaking: fileData.piCoPiUndertaking } : {}),
            ...(Array.isArray(fileData?.otherSupportingDocs) && fileData.otherSupportingDocs.length > 0
              ? { otherSupportingDocs: fileData.otherSupportingDocs }
              : {})
          }
        : {
            completeProposal: fileData?.completeProposal || null,
            endorsementLetter: fileData?.endorsementLetter || null,
            piCoPiUndertaking: fileData?.piCoPiUndertaking || null,
            otherSupportingDocs: fileData?.otherSupportingDocs || []
          };

      // Build payload matching updated backend /api/projects/submit
      const projectData = {
        title: formData.get('title'),
        fundingAgency: formData.get('fundingAgency'),
        schemeCallRefNo: formData.get('schemeCallRefNo'),
        pi: formData.get('pi'),
        piDesignation: formData.get('piDesignation'),
        piDepartment: formData.get('piDepartment'),
        coPi: coPis,
        collaboratingInstitute: formData.get('collaboratingInstitute') || null,
        projectStartDate: formData.get('projectStartDate'),
        projectEndDate: formData.get('projectEndDate'),
        totalBudget: parseFloat(formData.get('totalBudget')),
        fundingAgencyFormatFollowed: formData.get('fundingAgencyFormatFollowed'),
        aiUsagePercentage: parseFloat(formData.get('aiUsagePercentage')),
        plagiarismPercentage: parseFloat(formData.get('plagiarismPercentage')),
        summary: formData.get('summary') || '',
        budgetHeads,
        ...(Object.keys(documentsPayload).length > 0 ? { documents: documentsPayload } : {}),
        // Legacy single-file field for backend
        ...(isResubmission ? {} : { fileData: fileData?.completeProposal || null })
      };

      const endpoint = existingProjectId ? '/api/projects/resubmit' : '/api/projects/submit';
      const payload = existingProjectId
        ? { ...projectData, projectId: existingProjectId }
        : projectData;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newProject = await res.json();
        if (existingProjectId) {
          setProjects(projects.map(p => p.id === existingProjectId ? newProject : p));
          showNotification('Project updated and resubmitted successfully!');
        } else {
          setProjects([newProject, ...projects]);
          showNotification('Project submitted successfully!');
        }
        setShowNewProjectForm(false);
        setEditingProject(null);
        return true;
      } else {
        const error = await res.json();
        showNotification(error.error || 'Failed to submit project', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error submitting project:', error);
      showNotification('Failed to submit project', 'error');
      return false;
    }
  };

  // Module 3: Project Grant (Form PC) submission handler
  const handleEquipmentSubmit = async (formData, items, enclosureData, totalAmount, existingRequestId) => {
    try {
      const token = sessionStorage.getItem('token');

      const grantData = {
        equipmentRequestId: existingRequestId || undefined,
        projectId: formData.get('projectId'),
        grantType: formData.get('grantType'),
        budgetHead: formData.get('budgetHead'),
        amountSanctioned: parseFloat(formData.get('amountSanctioned')),
        availableBalance: parseFloat(formData.get('availableBalance')),
        procurementMode: formData.get('procurementMode'),
        items,
        totalAmount,
        enclosures: enclosureData,
        requestType: formData.get('requestType')
      };

      const endpoint = existingRequestId ? '/api/equipment/resubmit' : '/api/equipment/submit';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(grantData)
      });

      if (res.ok) {
        const savedRequest = await res.json();
        if (existingRequestId) {
          setEquipmentRequests(prev => prev.map(r => (r.id === existingRequestId ? savedRequest : r)));
        } else {
          setEquipmentRequests([savedRequest, ...equipmentRequests]);
        }
        setShowEquipmentForm(false);
        setEditingEquipmentRequest(null);
        showNotification(
          existingRequestId
            ? 'Project grant request resubmitted successfully.'
            : 'Project grant request submitted successfully! It will be reviewed by the approval committee.'
        );
        return true;
      } else {
        const error = await res.json();
        showNotification(error.error || 'Failed to submit project grant request', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error submitting project grant:', error);
      showNotification('Failed to submit project grant request', 'error');
      return false;
    }
  };

  const ongoingProjects = projects.filter((p) => p.status === 'Approved' && p.lifecycleStatus === 'Ongoing');
  const approvedProjects = ongoingProjects;

  const handleProjectAccountSubmit = async (payload, existingAccountId) => {
    try {
      const token = sessionStorage.getItem('token');
      const endpoint = existingAccountId ? '/api/project-accounts/resubmit' : '/api/project-accounts/submit';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || 'Failed to submit account form', 'error');
        return false;
      }
      setProjectAccounts((prev) => (existingAccountId ? prev.map((a) => (a.id === existingAccountId ? data : a)) : [data, ...prev]));
      setShowProjectAccountForm(false);
      setEditingProjectAccount(null);
      fetchProjects();
      fetchEligibleAccountProjects();
      showNotification(existingAccountId ? 'Account form resubmitted successfully' : 'Account form submitted successfully');
      return true;
    } catch (error) {
      console.error(error);
      showNotification('Failed to submit account form', 'error');
      return false;
    }
  };

  const handleViewAccountDocument = async (accountId, documentType = 'sanctionedOrder') => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`/api/project-accounts/download/${accountId}?documentType=${documentType}&mode=view`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return showNotification('Failed to open document', 'error');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch (error) {
      console.error(error);
      showNotification('Failed to open document', 'error');
    }
  };

  const handleUtilizationSubmit = async (payload, existingCertificateId) => {
    try {
      const token = sessionStorage.getItem('token');
      const endpoint = existingCertificateId
        ? '/api/utilization-certificates/resubmit'
        : '/api/utilization-certificates/submit';
      const body = existingCertificateId
        ? { ...payload, certificateId: existingCertificateId }
        : payload;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const saved = await res.json();
        if (existingCertificateId) {
          setUtilizationCertificates((prev) =>
            prev.map((c) => (c.id === existingCertificateId ? saved : c))
          );
        } else {
          setUtilizationCertificates((prev) => [saved, ...prev]);
        }
        setShowUtilizationForm(false);
        setEditingUtilizationCertificate(null);
        showNotification(
          existingCertificateId
            ? 'Utilization certificate resubmitted successfully.'
            : 'Utilization certificate submitted successfully. It has been sent to Finance Officer (Helper).'
        );
        return true;
      } else {
        const error = await res.json();
        showNotification(error.error || 'Failed to submit utilization certificate', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error submitting utilization certificate:', error);
      showNotification('Failed to submit utilization certificate', 'error');
      return false;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'my-projects', label: 'My Projects', icon: FolderOpen },
    { id: 'projects', label: 'New Proposal', icon: FileText },
    { id: 'project-accounts', label: 'Project Accounts', icon: Landmark },
    { id: 'equipment', label: 'Indent Approval', icon: Package },
    { id: 'utilization-certificate', label: 'Utilization Certificate', icon: ClipboardList }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 dark:text-gray-400 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-gray-900 mb-2">
            PI Dashboard
          </h1>
          <p className="text-gray-400 dark:text-gray-400 text-gray-600">
            Manage your research projects, resource allotments, and utilization certificates
          </p>
        </motion.div>

        {/* Navigation Tabs with animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-2 bg-gray-800/50 dark:bg-gray-800/50 bg-white/80 backdrop-blur-sm rounded-xl p-2 border border-gray-100/50 dark:border-gray-700/50 border-gray-200 shadow-2xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab)}
                  className={`relative flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    isActive
                      ? 'text-gray-100 dark:text-white'
                      : 'text-gray-400 dark:text-gray-400 text-gray-600 hover:text-gray-200 dark:hover:text-gray-200 hover:text-gray-800'
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
                  <Icon className={`relative z-10 w-5 h-5 ${isActive ? 'text-white text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-400 text-gray-600'}`} />
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
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route 
                path="dashboard" 
                element={
                  <Dashboard 
                    projects={projects} 
                    onNewProject={() => setShowNewProjectForm(true)} 
                  />
                } 
              />
              <Route 
                path="projects" 
                element={
                  <Projects 
                    projects={projects} 
                    onNewProject={() => {
                      setEditingProject(null);
                      setShowNewProjectForm(true);
                    }}
                    onEditProject={(project) => {
                      setEditingProject(project);
                      setShowNewProjectForm(true);
                    }}
                    onRequestEquipment={() => setShowEquipmentForm(true)}
                    showNotification={showNotification}
                  />
                } 
              />
              <Route
                path="my-projects"
                element={
                  <MyProjects
                    projects={projects}
                    user={user}
                    showNotification={showNotification}
                  />
                }
              />
              <Route 
                path="project-accounts"
                element={
                  <ProjectAccounts
                    accounts={projectAccounts}
                    eligibleProjects={eligibleAccountProjects}
                    onNewRequest={() => { setEditingProjectAccount(null); setShowProjectAccountForm(true); }}
                    onEditRequest={(request) => { setEditingProjectAccount(request); setShowProjectAccountForm(true); }}
                    onViewDocument={handleViewAccountDocument}
                    showNotification={showNotification}
                    onAccountUpdated={(updated) =>
                      setProjectAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
                    }
                  />
                }
              />
              <Route 
                path="equipment" 
                element={
                  <Equipment 
                    user={user}
                    equipmentRequests={equipmentRequests}
                    approvedProjects={approvedProjects}
                    onNewRequest={() => {
                      setEditingEquipmentRequest(null);
                      setShowEquipmentForm(true);
                    }}
                    onEditRequest={(request) => {
                      setEditingEquipmentRequest(request);
                      setShowEquipmentForm(true);
                    }}
                  />
                } 
              />
              <Route
                path="utilization-certificate"
                element={
                  <UtilizationCertificatePage
                    user={user}
                    certificates={utilizationCertificates}
                    approvedProjects={approvedProjects}
                    onNewRequest={() => {
                      setEditingUtilizationCertificate(null);
                      setShowUtilizationForm(true);
                    }}
                    onEditRequest={(cert) => {
                      setEditingUtilizationCertificate(cert);
                      setShowUtilizationForm(true);
                    }}
                  />
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {showNewProjectForm && (
        <ProjectForm
          user={user}
          onSubmit={handleProjectSubmit}
          onCancel={() => {
            setShowNewProjectForm(false);
            setEditingProject(null);
          }}
          project={editingProject}
        />
      )}

      {showEquipmentForm && (
        <EquipmentForm
          approvedProjects={approvedProjects}
          onSubmit={handleEquipmentSubmit}
          existingRequest={editingEquipmentRequest}
          onCancel={() => {
            setShowEquipmentForm(false);
            setEditingEquipmentRequest(null);
          }}
        />
      )}

      {showUtilizationForm && (
        <UtilizationCertificateForm
          key={editingUtilizationCertificate?.id || 'new-uc'}
          approvedProjects={approvedProjects.map((p) => ({ id: p.id, title: p.title }))}
          existingCertificate={editingUtilizationCertificate}
          onSubmit={handleUtilizationSubmit}
          onCancel={() => {
            setShowUtilizationForm(false);
            setEditingUtilizationCertificate(null);
          }}
        />
      )}
      {showProjectAccountForm && (
        <ProjectAccountForm
          approvedProjects={eligibleAccountProjects}
          existingAccount={editingProjectAccount}
          onSubmit={handleProjectAccountSubmit}
          onCancel={() => {
            setShowProjectAccountForm(false);
            setEditingProjectAccount(null);
          }}
        />
      )}
    </div>
  );
}