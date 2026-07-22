import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { organizationService } from '@/services/organizationService';

// Import Sections
import { ProfileSection } from './ProfileSection';
import { ContactSection } from './ContactSection';
import { AddressSection } from './AddressSection';
import { AcademicSection } from './AcademicSection';
import { BrandingSection } from './BrandingSection';
import { SocialSection } from './SocialSection';
import { StatisticsSection } from './StatisticsSection';
import { HolidaySection } from './HolidaySection';
import { SystemInfoSection } from './SystemInfoSection';

export const OrganizationSettings = ({ category, setHasUnsavedChanges, searchQuery }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['organizationSettings'],
    queryFn: organizationService.getOrganizationData,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 h-64 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center">
        <h3 className="text-lg font-semibold text-red-600">Failed to load organization settings</h3>
        <p className="text-slate-500 mt-2">Please check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900">Organization Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Centralized configuration for all institution-wide information, branding, and academic rules.
        </p>
      </div>

      <div className="space-y-8">
        <ProfileSection 
          initialData={data?.profile} 
          sectionId="section-profile" 
          searchQuery={searchQuery}
        />
        
        <ContactSection 
          initialData={data?.contact} 
          sectionId="section-contact" 
          searchQuery={searchQuery}
        />
        
        <AddressSection 
          initialData={data?.address} 
          sectionId="section-address" 
          searchQuery={searchQuery}
        />
        
        <AcademicSection 
          initialData={data?.academic} 
          sectionId="section-academic" 
          searchQuery={searchQuery}
        />
        
        <BrandingSection 
          initialData={data?.branding} 
          sectionId="section-branding" 
          searchQuery={searchQuery}
        />
        
        <SocialSection 
          initialData={data?.social} 
          sectionId="section-social" 
          searchQuery={searchQuery}
        />
        
        {/* Read-only sections */}
        <StatisticsSection 
          sectionId="section-statistics" 
          searchQuery={searchQuery}
        />
        
        <HolidaySection 
          sectionId="section-holiday" 
          searchQuery={searchQuery}
        />
        
        <SystemInfoSection 
          sectionId="section-systeminfo" 
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
};
