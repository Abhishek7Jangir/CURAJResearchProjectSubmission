// Re-export ProjectGrantForm as EquipmentForm for backward compatibility
import ProjectGrantForm from './ProjectGrantForm';

export default function EquipmentForm({ approvedProjects, onSubmit, onCancel, existingRequest }) {
  return (
    <ProjectGrantForm
      approvedProjects={approvedProjects}
      onSubmit={onSubmit}
      onCancel={onCancel}
      existingRequest={existingRequest}
    />
  );
}

// Legacy code below - kept for reference
/*
function EquipmentFormLegacy({ approvedProjects, onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-gray-900 dark:text-white p-6 rounded-t-lg">
          <h3 className="text-2xl font-bold">Request Equipment Fund</h3>
          <p className="text-green-100 mt-1">Submit request for equipment purchase</p>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Project *</label>
            <select
              name="projectId"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Choose a project...</option>
              {approvedProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.id} - {project.title} (Available: ₹{project.availableBudget.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Name *</label>
            <input
              type="text"
              name="equipmentName"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., High-Performance Liquid Chromatography System"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
              <input
                type="number"
                name="quantity"
                required
                min="1"
                defaultValue="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (₹) *</label>
              <input
                type="number"
                name="unitPrice"
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Price per unit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount (₹) *</label>
              <input
                type="number"
                name="equipmentBudget"
                required
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Total cost"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Justification *</label>
            <textarea
              name="justification"
              required
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Explain why this equipment is necessary for the research project..."
            ></textarea>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The system will automatically verify if sufficient budget is available in the selected project before releasing the fund.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-gray-900 dark:text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
            >
              Submit Request
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
*/