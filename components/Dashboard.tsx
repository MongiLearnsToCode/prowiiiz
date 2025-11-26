import React, { useState, useMemo, useEffect } from 'react';
import { Project, User, ProjectMember, ProjectInvitation } from '../types';
import { Plus, Clock, CheckCircle2, ArrowUpRight, Folder, Shield, Users, Eye, LogOut, LayoutGrid, List, ChevronDown, Edit, Trash2, X, ClipboardList, Mail, Check, XCircle } from 'lucide-react';
import { UserAvatar, Tooltip, ConfirmModal, Input, Textarea, UserSelect, Button, EmptyState } from './Common';

interface DashboardProps {
  currentUser: User;
  projects: Project[];
  users: User[];
  onNewProject: () => void;
  onSelectProject: (projectId: string) => void;
  onLogout: () => void;
  onEditProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: (projectId: string) => void;
  userInvitations: ProjectInvitation[];
  onAcceptInvitation: (invitationId: string) => void;
  onDeclineInvitation: (invitationId: string) => void;
}

type DashboardTab = 'ALL' | 'OWNER' | 'MEMBER' | 'VIEWER';

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, projects, users, onNewProject, onSelectProject, onLogout, onEditProject, onDeleteProject, userInvitations, onAcceptInvitation, onDeclineInvitation }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('ALL');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Edit & Delete State
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Team Edit State
  const [editTeam, setEditTeam] = useState<ProjectMember[]>([]);
  const [userToAddId, setUserToAddId] = useState('');

  // Initialize viewMode from localStorage to persist user preference
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prowiiiz_view_mode');
      return (saved === 'GRID' || saved === 'LIST') ? saved : 'GRID';
    }
    return 'GRID';
  });

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('prowiiiz_view_mode', viewMode);
  }, [viewMode]);

  // Filter projects visible to the user
  const myProjects = useMemo(() => {
    return projects.filter(p => p.team.some(m => m.userId === currentUser.id));
  }, [projects, currentUser.id]);

  // Filter by specific role
  const filteredProjects = useMemo(() => {
    if (activeTab === 'ALL') return myProjects;

    // Explicit mapping ensures precise role checking
    const targetRole =
      activeTab === 'OWNER' ? 'Owner' :
        activeTab === 'MEMBER' ? 'Member' :
          activeTab === 'VIEWER' ? 'Viewer' : '';

    return myProjects.filter(p => {
      const member = p.team.find(m => m.userId === currentUser.id);
      return member?.role === targetRole;
    });
  }, [myProjects, activeTab, currentUser.id]);

  const totalTasks = filteredProjects.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = filteredProjects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'Completed').length, 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToEdit(project);
    setEditName(project.name);
    setEditDesc(project.description);
    setEditTeam(project.team);
    setUserToAddId('');
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
  };

  const handleAddMember = () => {
    if (userToAddId && !editTeam.some(m => m.userId === userToAddId)) {
      setEditTeam([...editTeam, { userId: userToAddId, role: 'Member' }]);
      setUserToAddId('');
    }
  };

  const handleRemoveMember = (userId: string) => {
    setEditTeam(editTeam.filter(m => m.userId !== userId));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectToEdit) {
      onEditProject(projectToEdit.id, {
        name: editName,
        description: editDesc,
        team: editTeam
      });
      setProjectToEdit(null);
    }
  };

  const renderTabButton = (tab: DashboardTab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
          : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
        }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 fade-in relative">
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (projectToDelete) {
            onDeleteProject(projectToDelete.id);
            setProjectToDelete(null);
          }
        }}
        onCancel={() => setProjectToDelete(null)}
        isDestructive={true}
        confirmText="Delete Project"
      />

      {/* Edit Project Modal */}
      {projectToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setProjectToEdit(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Edit Project</h2>
              <Button
                variant="icon"
                onClick={() => setProjectToEdit(null)}
                icon={<X size={24} />}
              />
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <Input
                label="Project Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <Textarea
                label="Description"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="h-32"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Team Members</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2 mb-3 bg-slate-50/50">
                  {editTeam.map(member => {
                    const user = users.find(u => u.id === member.userId);
                    if (!user) return null;
                    const isMe = user.id === currentUser.id;
                    return (
                      <div key={member.userId} className="flex items-center justify-between p-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-lg group shadow-sm">
                        <div className="flex items-center gap-2">
                          <UserAvatar src={user.avatar} alt={user.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                              {user.name} {isMe && <span className="text-xs text-slate-400 font-normal">(You)</span>}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{member.role}</p>
                          </div>
                        </div>
                        {member.role !== 'Owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all h-9 w-9"
                            title="Remove member"
                            icon={<X size={20} />}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-2">
                  <UserSelect
                    users={users.filter(u => !editTeam.some(m => m.userId === u.id))}
                    value={userToAddId}
                    onChange={setUserToAddId}
                    placeholder="Select user to add..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddMember}
                    disabled={!userToAddId}
                    className="px-3"
                    icon={<Plus size={16} />}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-50">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setProjectToEdit(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hello, {currentUser.name}</h1>
          <p className="text-slate-500">Overview of your workspace.</p>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all group"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">{currentUser.name}</p>
              <p className="text-xs text-slate-500">{currentUser.jobTitle}</p>
            </div>
            <UserAvatar src={currentUser.avatar} alt={currentUser.name} size="lg" className="border-2 border-white shadow-sm group-hover:ring-2 group-hover:ring-indigo-100 transition-all" />
            <ChevronDown size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-4 py-2 border-b border-slate-50 mb-1 md:hidden">
                  <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.jobTitle}</p>
                </div>

                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account</p>
                  <p className="text-sm text-slate-600 truncate font-medium">{currentUser.email}</p>
                </div>

                <div className="h-[1px] bg-slate-100 my-1"></div>

                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Row (Dynamic based on filtered view) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Folder size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Projects ({activeTab === 'ALL' ? 'Total' : activeTab})</p>
              <p className="text-2xl font-bold text-slate-800">{filteredProjects.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Completion Rate</p>
              <p className="text-2xl font-bold text-slate-800">{completionRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Pending Tasks</p>
              <p className="text-2xl font-bold text-slate-800">{totalTasks - completedTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap gap-3">
          {renderTabButton('ALL', 'All Projects', <Folder size={16} />)}
          {renderTabButton('OWNER', 'Managed (Admin)', <Shield size={16} />)}
          {renderTabButton('MEMBER', 'Assigned (Member)', <Users size={16} />)}
          {renderTabButton('VIEWER', 'Observing (Viewer)', <Eye size={16} />)}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onNewProject}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md shadow-indigo-200 transition-all text-sm"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-2 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-2 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Pending Invitations Section */}
      {userInvitations.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Project Invitations</h2>
              <p className="text-sm text-slate-600">You have {userInvitations.length} pending {userInvitations.length === 1 ? 'invitation' : 'invitations'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userInvitations.map(invitation => {
              const project = projects.find(p => p.id === invitation.projectId);
              const inviter = users.find(u => u.id === invitation.invitedBy);

              return (
                <div key={invitation.id} className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-sm mb-1">{project?.name || 'Project'}</h3>
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{project?.description || 'No description'}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <UserAvatar src={inviter?.avatar || ''} alt={inviter?.name || 'User'} size="xs" />
                        <span>Invited by <span className="font-medium">{inviter?.name || 'Unknown'}</span></span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-wider shrink-0">
                      {invitation.role}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onAcceptInvitation(invitation.id)}
                      className="flex-1 text-xs py-2"
                      icon={<Check size={14} />}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onDeclineInvitation(invitation.id)}
                      className="flex-1 text-xs py-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      icon={<XCircle size={14} />}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects Display */}
      <div>
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={`No ${activeTab.toLowerCase() === 'all' ? '' : activeTab.toLowerCase()} projects found`}
            description={activeTab === 'OWNER' || activeTab === 'ALL'
              ? "Get started by creating a new project to track tasks and collaborate with your team."
              : "You haven't been assigned this role on any projects yet."
            }
            action={
              (activeTab === 'OWNER' || activeTab === 'ALL') && (
                <button onClick={onNewProject} className="text-indigo-600 font-medium hover:underline">
                  Start a new project
                </button>
              )
            }
          />
        ) : (
          <div className={viewMode === 'GRID' ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "flex flex-col gap-4"}>
            {filteredProjects.map(project => {
              const myRole = project.team.find(m => m.userId === currentUser.id)?.role;
              const isOwner = myRole === 'Owner';

              if (viewMode === 'GRID') {
                // GRID VIEW: Uses flex-col and mt-auto to ensure footer (progress bar) always aligns at bottom
                return (
                  <div
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col"
                  >
                    {/* Top Content (Wrapper for flex alignment) */}
                    <div className="flex-1">
                      {/* Action Buttons & Role Badge Area */}
                      <div className="absolute top-0 right-0 p-4 flex items-center gap-2">
                        {/* Actions for All (Permissions checked on click/hover) - Always visible now */}
                        <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-100 z-10">
                          <Tooltip content={isOwner ? "Edit Project" : "Permission required: Owner"} position="bottom">
                            <button
                              onClick={(e) => isOwner && handleEditClick(e, project)}
                              disabled={!isOwner}
                              className={`p-1.5 rounded-md transition-colors ${isOwner
                                  ? 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                                  : 'text-slate-300 cursor-not-allowed'
                                }`}
                            >
                              <Edit size={14} />
                            </button>
                          </Tooltip>
                          <Tooltip content={isOwner ? "Delete Project" : "Permission required: Owner"} position="bottom">
                            <button
                              onClick={(e) => isOwner && handleDeleteClick(e, project)}
                              disabled={!isOwner}
                              className={`p-1.5 rounded-md transition-colors ${isOwner
                                  ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                                  : 'text-slate-300 cursor-not-allowed'
                                }`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </Tooltip>
                        </div>

                        {/* Role Badge - Only shown in 'ALL' view */}
                        {activeTab === 'ALL' && (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${myRole === 'Owner' ? 'bg-indigo-100 text-indigo-700' :
                              myRole === 'Member' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>
                            {myRole}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-start mb-4 pr-28">
                        <div>
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full uppercase tracking-wide">
                            {project.templateType}
                          </span>
                          <h3 className="text-xl font-bold text-slate-800 mt-2 group-hover:text-indigo-600 transition-colors">
                            {project.name}
                          </h3>
                        </div>
                      </div>

                      <p className="text-slate-500 text-sm mb-6 line-clamp-2">
                        {project.description}
                      </p>
                    </div>

                    {/* Bottom Footer (Pinned to bottom via flex layout) */}
                    <div className="space-y-3 mt-auto">
                      <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>Progress</span>
                        <span className="font-medium">{Math.round(project.progress)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                        <div className="flex -space-x-2">
                          {project.team.slice(0, 3).map(member => (
                            <Tooltip key={member.userId} content={`${member.role}: ${member.userId}`} position="top">
                              <UserAvatar
                                src={`https://picsum.photos/seed/${member.userId}/100`}
                                alt="member"
                                size="md"
                                className="border-2 border-white"
                              />
                            </Tooltip>
                          ))}
                          {project.team.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs text-slate-500">
                              +{project.team.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 flex items-center gap-1">
                          {project.tasks.length} Tasks
                          <ArrowUpRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // LIST VIEW - Using CSS Grid for perfect table-like alignment across rows
                return (
                  <div
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group grid grid-cols-1 md:grid-cols-12 items-center gap-4 md:gap-6"
                  >
                    {/* Section 1: Info (Col 1-6) */}
                    <div className="md:col-span-6 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wide shrink-0">
                          {project.templateType}
                        </span>
                        {activeTab === 'ALL' && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${myRole === 'Owner' ? 'bg-indigo-50 text-indigo-700' :
                              myRole === 'Member' ? 'bg-emerald-50 text-emerald-700' :
                                'bg-amber-50 text-amber-700'
                            }`}>
                            {myRole}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                        {project.name}
                      </h3>
                      <p className="text-slate-500 text-sm truncate">
                        {project.description}
                      </p>
                    </div>

                    {/* Section 2: Progress (Col 7-9) */}
                    <div className="md:col-span-3 w-full flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span>{Math.round(project.progress)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Section 3: Team & Stats & Actions (Col 10-12) */}
                    <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map(member => (
                          <UserAvatar
                            key={member.userId}
                            src={`https://picsum.photos/seed/${member.userId}/100`}
                            alt="member"
                            size="sm"
                            className="border-2 border-white"
                          />
                        ))}
                        {project.team.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-500">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-sm text-slate-400 flex items-center gap-1 min-w-[70px] justify-end">
                          {project.tasks.length} Tasks
                        </div>

                        {/* Action Buttons for List View - Always visible */}
                        <div className="flex gap-1 pl-2 border-l border-slate-100">
                          <Tooltip content={isOwner ? "Edit" : "Permission required: Owner"} position="top">
                            <button
                              onClick={(e) => isOwner && handleEditClick(e, project)}
                              disabled={!isOwner}
                              className={`p-1.5 rounded-md transition-colors ${isOwner
                                  ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                                  : 'text-slate-200 cursor-not-allowed'
                                }`}
                            >
                              <Edit size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip content={isOwner ? "Delete" : "Permission required: Owner"} position="top">
                            <button
                              onClick={(e) => isOwner && handleDeleteClick(e, project)}
                              disabled={!isOwner}
                              className={`p-1.5 rounded-md transition-colors ${isOwner
                                  ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-slate-200 cursor-not-allowed'
                                }`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
};