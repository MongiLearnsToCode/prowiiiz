import React, { useState, useEffect } from 'react';
import { Project, User, AppView, WizardData, Task, TaskStatus, Priority, Milestone, Comment, ProjectRole, Attachment, ProjectInvitation } from './types';
import { Wizard } from './components/Wizard';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { Auth } from './components/Auth';
import { ToastProvider, useToast } from './components/Common';
import { useAuth } from './hooks/useAuth';
import * as db from './services/database';

const AppContent: React.FC = () => {
  const { user, loading: authLoading, signUp, signIn, signOut } = useAuth();
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [projectInvitations, setProjectInvitations] = useState<Record<string, ProjectInvitation[]>>({});
  const [userInvitations, setUserInvitations] = useState<ProjectInvitation[]>([]);
  const { addToast } = useToast();

  // Load users once on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Load projects and invitations when user is authenticated
  useEffect(() => {
    if (user) {
      loadProjects();
      loadUserInvitations();
    } else {
      setProjects([]);
      setUserInvitations([]);
      setProjectInvitations({});
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const allUsers = await db.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadProjects = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userProjects = await db.getProjects(user.id);
      setProjects(userProjects);

      // Load invitations for each project
      const invitationsMap: Record<string, ProjectInvitation[]> = {};
      for (const project of userProjects) {
        const invitations = await db.getProjectInvitations(project.id);
        invitationsMap[project.id] = invitations;
      }
      setProjectInvitations(invitationsMap);
    } catch (error) {
      console.error('Error loading projects:', error);
      addToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUserInvitations = async () => {
    if (!user) return;

    try {
      const invitations = await db.getUserInvitations(user.id);
      setUserInvitations(invitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  // Auth Handlers
  const handleSignUp = async (name: string, email: string, password: string) => {
    const result = await signUp(name, email, password);
    if (result.success) {
      addToast(`Welcome, ${name}!`, 'success');
    }
    return result;
  };

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.success) {
      addToast('Welcome back!', 'success');
    }
    return result;
  };

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      setView(AppView.AUTH);
      addToast('Logged out successfully', 'info');
    }
  };

  // Project Handlers
  const handleCreateProject = async (data: WizardData) => {
    if (!user) return;

    setLoading(true);
    try {
      // Create project in database
      const newProject = await db.createProject(
        data.name,
        data.description,
        data.template,
        user.id,
        data.selectedTeamIds
      );

      // Add suggested tasks
      for (const task of data.suggestedTasks) {
        await db.createTask(newProject.id, task);
      }

      // Reload projects
      await loadProjects();
      setView(AppView.DASHBOARD);
      addToast(`Project "${data.name}" created!`, 'success');
    } catch (error) {
      console.error('Error creating project:', error);
      addToast('Failed to create project', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setView(AppView.PROJECT_DETAIL);
  };

  const handleEditProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      await db.updateProject(projectId, updates);
      await loadProjects();
      addToast('Project updated successfully', 'success');
    } catch (error) {
      console.error('Error updating project:', error);
      addToast('Failed to update project', 'error');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await db.deleteProject(projectId);
      await loadProjects();
      setView(AppView.DASHBOARD);
      setSelectedProjectId(null);
      addToast('Project deleted', 'info');
    } catch (error) {
      console.error('Error deleting project:', error);
      addToast('Failed to delete project', 'error');
    }
  };

  const handleUpdateTask = async (projectId: string, taskId: string, updates: Partial<Task>) => {
    try {
      await db.updateTask(taskId, updates);
      await loadProjects();
    } catch (error) {
      console.error('Error updating task:', error);
      addToast('Failed to update task', 'error');
    }
  };

  const handleAddTask = async (projectId: string, taskData: Omit<Task, 'id' | 'comments'>) => {
    try {
      await db.createTask(projectId, taskData);
      await loadProjects();
      addToast('Task added', 'success');
    } catch (error) {
      console.error('Error adding task:', error);
      addToast('Failed to add task', 'error');
    }
  };

  const handleDeleteTask = async (projectId: string, taskId: string) => {
    try {
      await db.deleteTask(taskId);
      await loadProjects();
      addToast('Task deleted', 'info');
    } catch (error) {
      console.error('Error deleting task:', error);
      addToast('Failed to delete task', 'error');
    }
  };

  const handleAddComment = async (projectId: string, taskId: string, content: string, attachments: Attachment[] = []) => {
    if (!user) return;

    try {
      await db.createComment(taskId, user.id, content, attachments);
      await loadProjects();
    } catch (error) {
      console.error('Error adding comment:', error);
      addToast('Failed to add comment', 'error');
    }
  };

  const handleAddMilestone = async (projectId: string, title: string, dueDate?: string) => {
    try {
      await db.createMilestone(projectId, title, dueDate);
      await loadProjects();
      addToast('Milestone created', 'success');
    } catch (error) {
      console.error('Error creating milestone:', error);
      addToast('Failed to create milestone', 'error');
    }
  };

  const handleMoveTask = async (projectId: string, taskId: string, newMilestoneId: string | undefined, targetTaskId?: string) => {
    try {
      // For now, just update the milestone
      await db.updateTask(taskId, { milestoneId: newMilestoneId });
      await loadProjects();
    } catch (error) {
      console.error('Error moving task:', error);
      addToast('Failed to move task', 'error');
    }
  };

  // Invitation Handlers
  const handleInviteUser = async (projectId: string, userId: string, role: 'Member' | 'Viewer') => {
    if (!user) return;

    try {
      await db.createProjectInvitation(projectId, userId, user.id, role);

      // Reload project invitations
      const invitations = await db.getProjectInvitations(projectId);
      setProjectInvitations(prev => ({ ...prev, [projectId]: invitations }));

      addToast('Invitation sent', 'success');
    } catch (error: any) {
      console.error('Error inviting user:', error);
      addToast(error.message || 'Failed to send invitation', 'error');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await db.cancelProjectInvitation(invitationId);

      // Reload all project invitations
      await loadProjects();

      addToast('Invitation canceled', 'info');
    } catch (error) {
      console.error('Error canceling invitation:', error);
      addToast('Failed to cancel invitation', 'error');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await db.acceptProjectInvitation(invitationId);

      // Reload projects and invitations
      await loadProjects();
      await loadUserInvitations();

      addToast('Invitation accepted! Project added to your dashboard', 'success');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      addToast('Failed to accept invitation', 'error');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await db.declineProjectInvitation(invitationId);

      // Reload invitations
      await loadUserInvitations();

      addToast('Invitation declined', 'info');
    } catch (error) {
      console.error('Error declining invitation:', error);
      addToast('Failed to decline invitation', 'error');
    }
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!user) {
    return <Auth onSignUp={handleSignUp} onSignIn={handleSignIn} />;
  }

  const renderView = () => {
    switch (view) {
      case AppView.WIZARD:
        return (
          <Wizard
            onComplete={handleCreateProject}
            onCancel={() => setView(AppView.DASHBOARD)}
            availableUsers={users.filter(u => u.id !== user.id)}
          />
        );

      case AppView.PROJECT_DETAIL:
        const activeProject = projects.find(p => p.id === selectedProjectId);
        if (!activeProject) return <div>Project not found</div>;
        return (
          <ProjectDetail
            project={activeProject}
            users={users}
            currentUser={user}
            onBack={() => setView(AppView.DASHBOARD)}
            onUpdateTask={handleUpdateTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onAddComment={handleAddComment}
            onAddMilestone={handleAddMilestone}
            onMoveTask={handleMoveTask}
            projectInvitations={projectInvitations[activeProject.id] || []}
            onInviteUser={handleInviteUser}
            onCancelInvitation={handleCancelInvitation}
          />
        );

      case AppView.DASHBOARD:
      default:
        return (
          <Dashboard
            currentUser={user}
            projects={projects}
            users={users}
            onNewProject={() => setView(AppView.WIZARD)}
            onSelectProject={handleSelectProject}
            onLogout={handleLogout}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            userInvitations={userInvitations}
            onAcceptInvitation={handleAcceptInvitation}
            onDeclineInvitation={handleDeclineInvitation}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {renderView()}
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;