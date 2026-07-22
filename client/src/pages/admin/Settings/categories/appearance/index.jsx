import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appearanceSettingsService } from '@/services/appearanceSettingsService';

import { LivePreviewPanel } from './components/LivePreviewPanel';
import { ThemeSection } from './components/ThemeSection';
import { BrandingSection } from './components/BrandingSection';
import { LayoutSection } from './components/LayoutSection';
import { DashboardCustomizationSection } from './components/DashboardCustomizationSection';
import { TablePreferencesSection } from './components/TablePreferencesSection';
import { TypographySection } from './components/TypographySection';
import { AnimationsSection } from './components/AnimationsSection';
import { LanguageLocalizationSection } from './components/LanguageLocalizationSection';
import { AccessibilitySection } from './components/AccessibilitySection';
import { UserPersonalizationSection } from './components/UserPersonalizationSection';
import { ResetOptionsSection } from './components/ResetOptionsSection';

export const AppearanceSettings = ({ searchQuery }) => {
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['appearanceSettings'],
    queryFn: appearanceSettingsService.getSettings
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-1/4 mb-8"></div>
        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-xl w-full" />)}
          </div>
          <div className="w-1/3 hidden lg:block">
            <div className="h-96 bg-slate-100 rounded-xl w-full sticky top-8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Appearance & Personalization</h2>
        <p className="text-sm text-slate-500 mt-1">
          Customize the look and feel of the ERP. Organization settings apply globally, while personalization applies to your account.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <ThemeSection initialData={initialData?.theme} sectionId="theme" searchQuery={searchQuery} />
          <BrandingSection initialData={initialData?.branding} sectionId="branding" searchQuery={searchQuery} />
          <LayoutSection initialData={initialData?.layout} sectionId="layout" searchQuery={searchQuery} />
          <DashboardCustomizationSection initialData={initialData?.dashboard} sectionId="dashboard" searchQuery={searchQuery} />
          <TablePreferencesSection initialData={initialData?.table} sectionId="table" searchQuery={searchQuery} />
          <TypographySection initialData={initialData?.typography} sectionId="typography" searchQuery={searchQuery} />
          <AnimationsSection initialData={initialData?.animations} sectionId="animations" searchQuery={searchQuery} />
          <LanguageLocalizationSection initialData={initialData?.language} sectionId="language" searchQuery={searchQuery} />
          <AccessibilitySection initialData={initialData?.accessibility} sectionId="accessibility" searchQuery={searchQuery} />
          <UserPersonalizationSection initialData={initialData?.personalization} sectionId="personalization" searchQuery={searchQuery} />
          <ResetOptionsSection sectionId="reset" searchQuery={searchQuery} />
        </div>

        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 sticky top-8">
          <LivePreviewPanel settings={initialData} />
        </div>
      </div>

    </div>
  );
};
