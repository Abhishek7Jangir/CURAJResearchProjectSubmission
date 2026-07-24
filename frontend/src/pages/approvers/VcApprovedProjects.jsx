import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

export default function VcApprovedProjects({ showNotification }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  useEffect(() => {
    const run = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch('/api/projects/approved-summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showNotification?.(err?.error || 'Failed to load approved projects', 'error');
          setRows([]);
          return;
        }
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        showNotification?.('Failed to load approved projects', 'error');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const years = useMemo(() => {
    const values = new Set(rows.map((r) => new Date(r.submittedDate || Date.now()).getFullYear()).filter(Boolean));
    return ['All', ...Array.from(values).sort((a, b) => b - a)];
  }, [rows]);

  const departments = useMemo(() => {
    const values = new Set(rows.map((r) => r.department).filter(Boolean));
    return ['All', ...Array.from(values).sort()];
  }, [rows]);

  const tableRows = useMemo(() => {
    return rows.filter((r) => {
      const dt = new Date(r.submittedDate || Date.now());
      const yearOk = yearFilter === 'All' || String(dt.getFullYear()) === String(yearFilter);
      const monthOk = monthFilter === 'All' || String(dt.getMonth() + 1) === String(monthFilter);
      const deptOk = departmentFilter === 'All' || r.department === departmentFilter;
      return yearOk && monthOk && deptOk;
    });
  }, [rows, yearFilter, monthFilter, departmentFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-3 py-2 rounded bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 shadow-sm">
          {years.map((y) => <option key={String(y)} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
        </select>
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="px-3 py-2 rounded bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 shadow-sm">
          <option value="All">All Months</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-3 py-2 rounded bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 shadow-sm">
          {departments.map((d) => <option key={d || 'All'} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-800 dark:text-gray-300">
            <tr>
              <th className="text-left px-6 py-3">Project ID</th>
              <th className="text-left px-6 py-3">Title</th>
              <th className="text-left px-6 py-3">PI</th>
              <th className="text-right px-6 py-3">Total Budget</th>
              <th className="text-right px-6 py-3">Expenditure</th>
              <th className="text-right px-6 py-3">Balance</th>
              <th className="text-left px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tableRows.map((p) => (
              <tr key={p.id} className="text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-900/40">
                <td className="px-6 py-3">{p.id}</td>
                <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white">{p.title}</td>
                <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{p.pi}</td>
                <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300">₹{Number(p.totalBudget || 0).toLocaleString('en-IN')}</td>
                <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300">₹{Number(p.expenditure || 0).toLocaleString('en-IN')}</td>
                <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300">₹{Number(p.balance || 0).toLocaleString('en-IN')}</td>
                <td className="px-6 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.statusLabel === 'Completed' ? 'bg-green-100 text-green-700 border border-green-600/20 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40' : 'bg-blue-100 text-blue-700 border border-blue-600/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40'}`}>
                    {p.statusLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

