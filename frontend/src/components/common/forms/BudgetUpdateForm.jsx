import React, { useState } from 'react';

export default function BudgetUpdateForm({ project, onClose, showNotification }) {
  const [newBudget, setNewBudget] = useState(project?.totalBudget || 0);
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!project) return null;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = [];
    for (const f of selectedFiles) {
      if (f.size > 10 * 1024 * 1024) {
        alert(`File "${f.name}" exceeds 10MB and will be skipped.`);
      } else {
        validFiles.push(f);
      }
    }
    setFiles(validFiles);
  };

  const convertFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newBudget || Number(newBudget) <= 0) {
      alert('Please enter a valid positive new total budget.');
      return;
    }
    if (!reason.trim()) {
      alert('Reason is required to request a budget update.');
      return;
    }
    const currentBudget = project.totalBudget || 0;
    if (Number(newBudget) === currentBudget) {
      alert('New budget must be different from current budget.');
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert('You are not logged in.');
        setSubmitting(false);
        return;
      }

      let supportingDocs = [];
      if (files.length > 0) {
        supportingDocs = await Promise.all(files.map(convertFileToBase64));
      }

      const res = await fetch('/api/projects/request-budget-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: project.id || project._id,
          newTotalBudget: Number(newBudget),
          reason: reason.trim(),
          supportingDocs
        })
      });

      if (res.ok) {
        if (showNotification) {
          showNotification('Budget update request sent to R&D Main.', 'success');
        } else {
          alert('Budget update request sent to R&D Main.');
        }
        onClose();
      } else {
        const error = await res.json();
        if (showNotification) {
          showNotification(error.error || 'Failed to request budget update', 'error');
        } else {
          alert(error.error || 'Failed to request budget update');
        }
      }
    } catch (err) {
      console.error('Budget update request error:', err);
      if (showNotification) {
        showNotification('Failed to request budget update', 'error');
      } else {
        alert('Failed to request budget update due to a network error.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-gray-900 dark:text-white p-5 rounded-t-lg z-10">
          <h3 className="text-xl font-bold">Request Budget Update</h3>
          <p className="text-purple-100 text-sm mt-1">
            Project: {project.title} (Current: ₹{(project.totalBudget || 0).toLocaleString('en-IN')})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Total Budget (₹) *
            </label>
            <input
              type="number"
              min="0"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justification / Reason *
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Explain why the project budget needs to be updated..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supporting Documents (PDF/DOCX, optional)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              multiple
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {files.length > 0 && (
              <ul className="mt-2 text-sm text-gray-700 list-disc list-inside space-y-1">
                {files.map((f, idx) => (
                  <li key={idx}>{f.name}</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Max 10MB per file.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-gray-900 dark:text-white py-2.5 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

