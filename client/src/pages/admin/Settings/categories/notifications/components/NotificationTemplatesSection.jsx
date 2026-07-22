import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MessageSquare, Plus, Trash2, Edit2, X, Eye } from 'lucide-react';
import { SectionCard } from '../../../components/organization/SectionCard';
import { notificationSettingsService } from '@/services/notificationSettingsService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message content is required'),
  language: z.string().min(1, 'Language is required'),
  category: z.string().min(1, 'Category is required')
});

export const NotificationTemplatesSection = ({ initialData, sectionId, searchQuery }) => {
  const [isEditing, setIsEditing] = useState(false); // Used to expand the section like others
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: { language: 'English', category: 'General' }
  });

  const messageContent = watch('message');
  const subjectContent = watch('subject');

  const updateMutation = useMutation({
    mutationFn: (data) => notificationSettingsService.updateTemplate(editingTemplateId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationSettings'], data);
      setEditingTemplateId(null);
      reset({ language: 'English', category: 'General' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationSettingsService.deleteTemplate(id),
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationSettings'], data);
    }
  });

  const handleEditClick = (template) => {
    setEditingTemplateId(template.id);
    reset(template);
    setIsEditing(true); // Open the section
  };

  const handleCreateNew = () => {
    setEditingTemplateId('new');
    reset({ name: '', subject: '', message: '', language: 'English', category: 'General' });
    setIsEditing(true);
  };

  const isMatch = searchQuery && (
    'Notification Templates'.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'template'.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const templates = initialData || [];

  return (
    <div id={sectionId} className={isMatch ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}>
      <SectionCard
        title="Notification Templates"
        description="Manage reusable message templates with dynamic variables."
        icon={MessageSquare}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSave={() => {
          if (editingTemplateId) {
             handleSubmit((data) => updateMutation.mutate(data))();
          } else {
             setIsEditing(false);
          }
        }}
        onReset={() => {
          setEditingTemplateId(null);
          reset({ language: 'English', category: 'General' });
        }}
        isSubmitting={updateMutation.isPending}
        hasUnsavedChanges={editingTemplateId !== null && isDirty}
        hideEditButton={true} // Custom handling for this complex section
      >
        <div className="space-y-6">
          
          {!editingTemplateId && !previewTemplate && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-800">Existing Templates</h3>
                <button 
                  onClick={handleCreateNew}
                  className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="h-3 w-3 mr-1" /> New Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                  <div key={template.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-slate-900">{template.name}</h4>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">{template.category}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.subject}</p>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2 border-t border-slate-100 pt-3">
                      <button onClick={() => setPreviewTemplate(template)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Preview">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleEditClick(template)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(template.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editingTemplateId && (
            <form className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-800">
                  {editingTemplateId === 'new' ? 'Create New Template' : 'Edit Template'}
                </h3>
                <button type="button" onClick={() => setEditingTemplateId(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Template Name *</label>
                  <input type="text" {...register('name')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 text-sm bg-white" placeholder="e.g. Attendance Warning" />
                  {errors.name && <p className="mt-1 text-[10px] text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select {...register('category')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 text-sm bg-white">
                    <option value="General">General</option>
                    <option value="Attendance">Attendance</option>
                    <option value="Timetable">Timetable</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Language *</label>
                  <select {...register('language')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 text-sm bg-white">
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Title *</label>
                <input type="text" {...register('subject')} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 text-sm bg-white" placeholder="e.g. Notice regarding {{StudentName}}" />
                {errors.subject && <p className="mt-1 text-[10px] text-red-600">{errors.subject.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body *</label>
                <textarea {...register('message')} rows={5} className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 text-sm bg-white" placeholder="Type your message here... Use {{Placeholder}} for dynamic data." />
                {errors.message && <p className="mt-1 text-[10px] text-red-600">{errors.message.message}</p>}
              </div>

              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                <p className="text-xs text-blue-800 font-semibold mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {['{{StudentName}}', '{{TeacherName}}', '{{Class}}', '{{AttendancePercentage}}', '{{Date}}', '{{Period}}'].map(v => (
                    <span key={v} className="px-2 py-1 bg-white border border-blue-200 text-blue-700 rounded text-[10px] font-mono cursor-pointer select-all">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
              
            </form>
          )}

          {previewTemplate && !editingTemplateId && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl relative">
              <button onClick={() => setPreviewTemplate(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Live Preview</h3>
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                  {previewTemplate.subject.replace(/{{.*?}}/g, 'Sample Value')}
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {previewTemplate.message.replace(/{{.*?}}/g, 'Sample Value')}
                </p>
              </div>
            </div>
          )}

        </div>
      </SectionCard>
    </div>
  );
};
