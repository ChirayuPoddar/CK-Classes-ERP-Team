import React, { useState } from 'react';
import { Lock, Save } from 'lucide-react';

const MODULES = [
  'Attendance', 'Timetable', 'Students', 'Teachers', 'Subjects', 
  'Rooms', 'Reports', 'Analytics', 'Settings', 'Notifications', 
  'Audit Logs', 'Organization', 'Users & Roles'
];

const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export', 'Import'];

export const PermissionMatrix = ({ searchQuery }) => {
  const [selectedRole, setSelectedRole] = useState('Teacher');
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const [permissions, setPermissions] = useState(() => {
    const initial = {};
    MODULES.forEach(mod => {
      initial[mod] = {};
      ACTIONS.forEach(act => {
        initial[mod][act] = Math.random() > 0.5;
      });
    });
    return initial;
  });

  const handleToggle = (mod, act) => {
    setPermissions(prev => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [act]: !prev[mod][act]
      }
    }));
    setHasUnsaved(true);
  };

  const handleSave = () => {
    setHasUnsaved(false);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <Lock className="h-5 w-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configure Role Permissions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Select a role to modify its access matrix.</p>
          </div>
        </div>
        
        <div className="w-full sm:w-auto flex items-center gap-3">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          >
            <option value="Administrator">Administrator</option>
            <option value="Principal">Principal</option>
            <option value="HOD">HOD</option>
            <option value="Teacher">Teacher</option>
          </select>
          <button
            onClick={handleSave}
            disabled={!hasUnsaved}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm transition-colors ${
              hasUnsaved 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
                  ERP Module
                </th>
                {ACTIONS.map(action => (
                  <th key={action} scope="col" className="px-3 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
                    {action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {MODULES.map((module) => (
                <tr key={module} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 bg-white sticky left-0 z-0">
                    {module}
                  </td>
                  {ACTIONS.map(action => {
                    const isChecked = permissions[module][action];
                    return (
                      <td key={`${module}-${action}`} className="px-3 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggle(module, action)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
