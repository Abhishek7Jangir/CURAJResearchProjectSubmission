import React from 'react';
import { LogOut } from 'lucide-react';
const uniLogo = "/University_logo.png"

// Header component - now uses the same design as Navbar for consistency
export default function Header({ user, onLogout }) {
  return (
    <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-blue-900 dark:to-indigo-800 text-gray-900 dark:text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center flex-row">
          <div className='flex items-center'>
            <img src={uniLogo} alt="University Logo" className="w-16 h-16 mr-4" />
            <div>
              <h1 className="text-2xl font-bold">Central University of Rajasthan</h1>
              <p className="text-blue-200 text-sm">Research Fund Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {user && (
              <div className="text-right">
                <div className="font-semibold">{user.name}</div>
                <div className="text-sm text-blue-200">{user.role}</div>
              </div>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}