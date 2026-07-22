import React from 'react';
import { X, User, Mail, Phone, Briefcase, MapPin, Clock, Shield, Monitor, Smartphone, MoreVertical } from 'lucide-react';

export const UserProfileDrawer = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">User Profile</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Cover & Avatar */}
          <div className="relative h-32 bg-indigo-600">
            <div className="absolute -bottom-12 left-6 h-24 w-24 rounded-2xl bg-white p-1 shadow-md">
              <div className="h-full w-full rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            </div>
          </div>

          <div className="mt-14 px-6">
            <h3 className="text-2xl font-bold text-slate-900">{user.firstName} {user.lastName}</h3>
            <p className="text-sm font-medium text-slate-500 flex items-center mt-1">
              <Shield className="h-4 w-4 mr-1.5 text-indigo-500" />
              {user.role} &bull; {user.department}
            </p>

            <div className="mt-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-slate-700">
                    <Mail className="h-4 w-4 mr-3 text-slate-400" />
                    {user.email}
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <Phone className="h-4 w-4 mr-3 text-slate-400" />
                    {user.phone}
                  </div>
                  <div className="flex items-center text-sm text-slate-700">
                    <Briefcase className="h-4 w-4 mr-3 text-slate-400" />
                    {user.employeeId || user.studentId || 'No ID Assigned'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Active Sessions</h4>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <Monitor className="h-5 w-5 mr-3 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">MacBook Pro (macOS)</p>
                        <p className="text-xs text-slate-500">Chrome &bull; 192.168.1.45</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Current</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <Smartphone className="h-5 w-5 mr-3 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">iPhone 14 (iOS)</p>
                        <p className="text-xs text-slate-500">App &bull; 10.0.0.12</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Recent Activity</h4>
                <div className="relative border-l-2 border-slate-200 ml-2 space-y-4 pb-4">
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1 ring-4 ring-white" />
                    <p className="text-sm font-medium text-slate-900">Logged In</p>
                    <p className="text-xs text-slate-500">Today, 08:45 AM</p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-[7px] top-1 ring-4 ring-white" />
                    <p className="text-sm font-medium text-slate-900">Updated Attendance (Grade 10-A)</p>
                    <p className="text-xs text-slate-500">Yesterday, 03:15 PM</p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-slate-300 rounded-full -left-[7px] top-1 ring-4 ring-white" />
                    <p className="text-sm font-medium text-slate-900">Password Reset Requested</p>
                    <p className="text-xs text-slate-500">Oct 12, 11:30 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
