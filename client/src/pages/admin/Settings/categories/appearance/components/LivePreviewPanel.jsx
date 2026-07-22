import React, { useMemo } from 'react';
import { Eye, Bell, Search, Menu, Home, Users, Settings as SettingsIcon } from 'lucide-react';

export const LivePreviewPanel = ({ settings }) => {
  if (!settings) return null;

  const { theme, branding, layout, typography, animations } = settings;
  const isDark = theme?.mode === 'Dark';

  // Compute CSS variables based on settings
  const previewStyles = useMemo(() => {
    let radius = '0.5rem';
    if (branding?.borderRadius === 'None') radius = '0px';
    if (branding?.borderRadius === 'Small') radius = '0.25rem';
    if (branding?.borderRadius === 'Large') radius = '1rem';

    let densityPad = '1rem';
    if (layout?.cardDensity === 'Compact') densityPad = '0.5rem';
    
    let font = 'Inter, sans-serif';
    if (typography?.fontFamily) font = typography.fontFamily;

    return {
      '--prev-primary': branding?.primaryColor || '#4f46e5',
      '--prev-sidebar': branding?.sidebarColor || '#1e293b',
      '--prev-navbar': branding?.navbarColor || '#ffffff',
      '--prev-radius': radius,
      '--prev-pad': densityPad,
      '--prev-font': font,
      '--prev-size': typography?.fontSize || '14px',
      '--prev-lh': typography?.lineHeight || '1.5',
      '--prev-transition': animations?.transitions ? 'all 0.3s ease' : 'none',
      
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      color: isDark ? '#f1f5f9' : '#0f172a',
      fontFamily: 'var(--prev-font)',
      fontSize: 'var(--prev-size)',
      lineHeight: 'var(--prev-lh)',
      transition: 'var(--prev-transition)'
    };
  }, [theme, branding, layout, typography, animations, isDark]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hidden lg:block sticky top-8">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center">
          <Eye className="h-4 w-4 mr-2 text-indigo-600" /> Live Preview
        </h3>
        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-semibold tracking-wide uppercase">
          Dynamic
        </span>
      </div>
      
      <div className="p-4 bg-slate-100 flex justify-center items-center">
        
        {/* Mock ERP Interface */}
        <div 
          className="w-full max-w-[360px] rounded-xl overflow-hidden shadow-lg border border-slate-200 relative flex flex-col h-[400px]"
          style={previewStyles}
        >
          {/* Mock Navbar */}
          <div 
            className="h-12 border-b flex items-center justify-between px-3 shrink-0"
            style={{ 
              backgroundColor: 'var(--prev-navbar)',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: isDark ? '#f1f5f9' : '#0f172a'
            }}
          >
            <div className="flex items-center space-x-2">
              <Menu className="h-4 w-4 opacity-70" />
              <div 
                className="h-6 w-6 rounded flex items-center justify-center text-white font-bold text-[10px]"
                style={{ backgroundColor: 'var(--prev-primary)' }}
              >
                ERP
              </div>
            </div>
            <div className="flex items-center space-x-3 opacity-70">
              <Search className="h-4 w-4" />
              <Bell className="h-4 w-4" />
              <div className="h-6 w-6 rounded-full bg-slate-300" />
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Mock Sidebar */}
            <div 
              className="w-14 shrink-0 flex flex-col items-center py-4 space-y-4"
              style={{ backgroundColor: 'var(--prev-sidebar)', color: '#94a3b8' }}
            >
              <Home className="h-4 w-4 text-white" />
              <Users className="h-4 w-4" />
              <SettingsIcon className="h-4 w-4" />
            </div>

            {/* Mock Content */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              
              <div>
                <h4 className="font-bold opacity-90 text-sm mb-1">{branding?.applicationName || 'ERP System'}</h4>
                <p className="text-[10px] opacity-60">Dashboard Overview</p>
              </div>

              {/* Mock Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className="bg-white p-3 shadow-sm border"
                  style={{ 
                    borderRadius: 'var(--prev-radius)',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0'
                  }}
                >
                  <div className="text-[10px] opacity-60 mb-1">Total Students</div>
                  <div className="font-bold text-lg" style={{ color: 'var(--prev-primary)' }}>1,234</div>
                </div>
                <div 
                  className="bg-white p-3 shadow-sm border"
                  style={{ 
                    borderRadius: 'var(--prev-radius)',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0'
                  }}
                >
                  <div className="text-[10px] opacity-60 mb-1">Attendance</div>
                  <div className="font-bold text-lg" style={{ color: 'var(--prev-primary)' }}>94%</div>
                </div>
              </div>

              {/* Mock Button */}
              <button 
                className="w-full py-2 text-white text-xs font-semibold mt-4"
                style={{ 
                  backgroundColor: 'var(--prev-primary)',
                  borderRadius: branding?.buttonStyle === 'Pill' ? '9999px' : branding?.buttonStyle === 'Square' ? '0px' : 'var(--prev-radius)'
                }}
              >
                Primary Action
              </button>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
