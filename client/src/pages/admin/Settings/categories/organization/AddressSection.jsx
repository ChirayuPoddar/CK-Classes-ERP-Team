import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin, Navigation } from 'lucide-react';
import { SectionCard } from '../../components/organization/SectionCard';
import { organizationService } from '@/services/organizationService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const addressSchema = z.object({
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  postalCode: z.string().min(4, 'Valid postal code is required'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional()
});

export const AddressSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData || {}
  });

  const lat = watch('latitude');
  const lng = watch('longitude');
  const hasCoordinates = lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0;

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => organizationService.updateOrganizationSection('address', data),
    onSuccess: (data) => {
      queryClient.setQueryData(['organizationSettings'], data);
      setIsEditing(false);
      reset(data.address);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const handleReset = () => {
    reset(initialData);
  };

  const isMatch = searchQuery && (
    'Address'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'Location'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Official Address"
        description="Primary physical location and map coordinates."
        icon={MapPin}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={handleSubmit(onSubmit)}
        onReset={handleReset}
        isSubmitting={mutation.isPending}
        hasUnsavedChanges={isDirty}
      >
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address Line 1 *</label>
              <input
                type="text"
                {...register('addressLine1')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.addressLine1 && <p className="mt-1 text-sm text-red-600">{errors.addressLine1.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address Line 2</label>
              <input
                type="text"
                {...register('addressLine2')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">City *</label>
              <input
                type="text"
                {...register('city')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">State / Province *</label>
              <input
                type="text"
                {...register('state')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Country *</label>
              <input
                type="text"
                {...register('country')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Postal / ZIP Code *</label>
              <input
                type="text"
                {...register('postalCode')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>}
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                <Navigation className="h-4 w-4 mr-2 text-indigo-500" />
                Map Coordinates
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    {...register('latitude')}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    {...register('longitude')}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              {hasCoordinates && (
                <div className="mt-6 w-full h-48 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Map Preview available for {lat}, {lng}</p>
                    <p className="text-xs text-slate-400 mt-1">(Google Maps API integration required)</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};
