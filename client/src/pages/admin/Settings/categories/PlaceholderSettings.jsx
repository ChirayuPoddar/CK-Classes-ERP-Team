import React from 'react';

export const PlaceholderSettings = ({ category }) => {
  const Icon = category.icon;

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="bg-white rounded-xl shadow-premium-1 border border-slate-200 overflow-hidden">
        <div className="px-6 py-8 sm:p-10 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-slate-50 border border-slate-100 shadow-sm mb-6">
            <Icon className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{category.title} Settings</h3>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">
            {category.description}. The architecture is ready for future implementation.
          </p>
          
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Configuration Area Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
};
