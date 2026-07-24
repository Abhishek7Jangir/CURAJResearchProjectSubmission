import React from 'react';
import { User } from 'lucide-react';

export default function Login({ onLogin }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const name = e.target.name.value;
      const designation = e.target.designation.value;
      onLogin({ email, name, role: designation }); // Passing designation as role
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-blue-900 dark:to-indigo-800 text-gray-900 dark:text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Central University of Rajasthan</h1>
          <p className="text-blue-200 mt-1">Research Fund Management System</p>
        </div>
      </div>
      
      <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-xl border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Faculty Login</h2>
          <p className="text-gray-600 mt-2">Access Research Fund Management Portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="your.email@curaj.ac.in"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
            <select
              name="designation"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Professor">Professor</option>
              <option value="HOD">HOD</option>
              <option value="DEAN">DEAN</option>
              <option value="R&D_HELPER">R&D Office</option>
              <option value="R&D_MAIN">R&D</option>
              <option value="FINANCE_OFFICER_HELPER">Finance Office</option>
              <option value="FINANCE_OFFICER_MAIN">Finance Officer</option>
              <option value="REGISTRAR">Registrar</option>
              <option value="VC_OFFICE">VC Office</option>
              <option value="VC">Vice Chancellor</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white dark:bg-gray-600 dark:text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-gray-700 transition-all shadow-md"
          >
            Login to Portal
          </button>
        </form>
      </div>
    </div>
  );
}