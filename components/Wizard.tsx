import React, { useState } from 'react';
import { WizardData, User } from '../types';
import { Loader2, Check, ChevronRight, Sparkles, Layout, Users, Briefcase, Plus, Mail, AlertCircle } from 'lucide-react';
import { generateProjectTasks } from '../services/geminiService';
import { Input, Textarea, UserAvatar, Skeleton } from './Common';

interface WizardProps {
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
  availableUsers: User[];
}

const PROJECT_TEMPLATES = [
  { id: 'marketing', name: 'Marketing Campaign', icon: <Sparkles size={24} /> },
  { id: 'software', name: 'Software Launch', icon: <Layout size={24} /> },
  { id: 'event', name: 'Event Planning', icon: <Users size={24} /> },
  { id: 'general', name: 'General Project', icon: <Briefcase size={24} /> },
];

export const Wizard: React.FC<WizardProps> = ({ onComplete, onCancel, availableUsers }) => {
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

  const [data, setData] = useState<WizardData>({
    name: '',
    description: '',
    template: '',
    selectedTeamIds: [],
    suggestedTasks: []
  });

  const handleNext = async () => {
    if (step === 1) {
      // Trigger AI generation after description step
      setIsGenerating(true);
      const tasks = await generateProjectTasks(data.description, data.template || 'General');
      setData(prev => ({ ...prev, suggestedTasks: tasks }));
      setIsGenerating(false);
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    
    if (!inviteEmail || !inviteEmail.includes('@')) {
        setInviteError('Please enter a valid email.');
        return;
    }

    // Check if already exists in availableUsers
    const existingUser = availableUsers.find(u => u.email.toLowerCase() === inviteEmail.toLowerCase());
    
    if (existingUser) {
        if (!data.selectedTeamIds.includes(existingUser.id)) {
            setData(prev => ({ ...prev, selectedTeamIds: [...prev.selectedTeamIds, existingUser.id] }));
            setInviteEmail('');
            return;
        } else {
            setInviteError('User is already selected.');
            return;
        }
    } else {
        // Enforce sign-up rule
        setInviteError('User not found. They must be signed up to be added.');
        return;
    }
  };

  const progress = ((step + 1) / 5) * 100;

  // Use availableUsers directly since we don't create temporary users anymore
  const allDisplayUsers = availableUsers;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6 fade-in">
            <h2 className="text-3xl font-bold text-slate-800">Let's start something new.</h2>
            <p className="text-slate-500 text-lg">What shall we call this project?</p>
            <Input
              autoFocus
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="e.g. Q4 Website Redesign"
              className="!text-2xl !p-6 border-b-2 !border-t-0 !border-l-0 !border-r-0 rounded-none focus:!ring-0 bg-transparent"
              onKeyDown={(e) => e.key === 'Enter' && data.name && handleNext()}
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 fade-in">
            <h2 className="text-3xl font-bold text-slate-800">What's the goal?</h2>
            <p className="text-slate-500 text-lg">Describe what you want to achieve. Our AI will help suggest tasks.</p>
            <Textarea
              autoFocus
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="e.g. Launch a new marketing landing page for the holiday season with A/B testing..."
              className="h-40 !text-xl !p-6"
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 fade-in">
            <h2 className="text-3xl font-bold text-slate-800">Pick a template</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROJECT_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setData({ ...data, template: t.id })}
                  className={`p-6 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                    data.template === t.id 
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100' 
                      : 'border-slate-200 hover:border-indigo-300 bg-white'
                  }`}
                >
                  <div className={`p-3 rounded-full ${data.template === t.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {t.icon}
                  </div>
                  <span className="text-lg font-medium text-slate-800">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 fade-in">
            <h2 className="text-3xl font-bold text-slate-800">Assemble your team</h2>
            
            {/* Invite Section */}
            <div className="space-y-2">
                <form onSubmit={handleInvite} className="flex gap-3 items-start">
                    <div className="flex-1 relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                        <Input 
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Search by email address..."
                            className="!pl-10"
                            error={inviteError}
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={!inviteEmail}
                        className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Add
                    </button>
                </form>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                   <AlertCircle size={12} /> Users must be signed up to be added to the project.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {allDisplayUsers.map(user => {
                const isSelected = data.selectedTeamIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      const newIds = isSelected
                        ? data.selectedTeamIds.filter(id => id !== user.id)
                        : [...data.selectedTeamIds, user.id];
                      setData({ ...data, selectedTeamIds: newIds });
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative">
                        <UserAvatar src={user.avatar} alt={user.name} size="lg" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{user.name} {user.id === 'me' && '(You)'}</p>
                      <p className="text-xs text-slate-500">{user.jobTitle}</p>
                    </div>
                    {isSelected ? (
                        <div className="ml-auto bg-indigo-600 text-white rounded-full p-1">
                             <Check size={14} />
                        </div>
                    ) : (
                        <div className="ml-auto bg-slate-100 text-slate-300 rounded-full p-1">
                             <Plus size={14} />
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 fade-in">
            <h2 className="text-3xl font-bold text-slate-800">Review & Launch</h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold">Project</h3>
                <p className="text-xl font-medium text-slate-800">{data.name}</p>
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold">Team</h3>
                <div className="flex -space-x-2 mt-2">
                  {allDisplayUsers.filter(u => data.selectedTeamIds.includes(u.id)).map(u => (
                    <UserAvatar key={u.id} src={u.avatar} alt={u.name} size="md" className="border-2 border-white" />
                  ))}
                  {data.selectedTeamIds.length === 0 && <p className="text-slate-500 italic">Just me for now</p>}
                </div>
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-500"/> Suggested Tasks ({data.suggestedTasks.length})
                </h3>
                <ul className="space-y-2">
                  {data.suggestedTasks.slice(0, 3).map(t => (
                    <li key={t.id} className="text-sm text-slate-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      {t.title}
                    </li>
                  ))}
                  {data.suggestedTasks.length > 3 && (
                     <li className="text-xs text-slate-400 pl-4">+{data.suggestedTasks.length - 3} more...</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Determine if Next button should be disabled
  const isNextDisabled = () => {
    if (step === 0 && !data.name) return true;
    if (step === 1 && !data.description) return true;
    if (step === 2 && !data.template) return true;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
      {/* Header / Progress */}
      <div className="h-2 bg-slate-200 w-full">
        <div 
          className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center space-y-6 fade-in w-full max-w-md mx-auto">
              <div className="w-full space-y-4">
                  <div className="flex items-center gap-3">
                      <Loader2 className="animate-spin text-indigo-600 shrink-0" size={24} />
                      <span className="text-indigo-700 font-medium">Consulting the AI oracle...</span>
                  </div>
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl opacity-75" />
                  <Skeleton className="h-20 w-full rounded-xl opacity-50" />
              </div>
            </div>
          ) : (
            renderStep()
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-6 bg-white border-t border-slate-200 flex justify-between items-center max-w-4xl mx-auto w-full rounded-t-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <button 
          onClick={step === 0 ? onCancel : handleBack}
          className="text-slate-500 hover:text-slate-800 px-6 py-3 font-medium transition-colors"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        
        <button
          onClick={step === 4 ? () => onComplete(data) : handleNext}
          disabled={isNextDisabled() || isGenerating}
          className={`
            flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all
            ${isNextDisabled() || isGenerating ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200'}
          `}
        >
          {step === 4 ? 'Create Project' : 'Next'}
          {!isGenerating && <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
};