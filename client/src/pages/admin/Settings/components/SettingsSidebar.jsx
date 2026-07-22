import React from 'react';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

export const SettingsSidebar = ({ 
  categories, 
  activeCategoryId, 
  onSelectCategory,
  searchQuery
}) => {
  // Filter categories based on search query (if any)
  const filteredCategories = categories.filter(category => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return category.title.toLowerCase().includes(lowerQuery) || 
           category.description.toLowerCase().includes(lowerQuery);
  });

  return (
    <div className="w-full md:w-64 shrink-0 h-full overflow-y-auto border-r border-slate-200 bg-slate-50/50 p-4">
      <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4 px-3">
        Settings Menu
      </h3>
      
      {filteredCategories.length === 0 ? (
        <div className="text-sm text-slate-500 px-3 py-4 text-center">
          No categories match your search.
        </div>
      ) : (
        <nav className="space-y-1">
          {filteredCategories.map((category) => {
            const isActive = category.id === activeCategoryId;
            const Icon = category.icon;
            
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group text-left",
                  isActive 
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60" 
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-md transition-colors",
                  isActive ? "bg-indigo-50 text-indigo-600" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm border border-slate-100"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="truncate flex-1">{category.title}</span>
                
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="w-1 h-4 bg-indigo-600 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};
