import { supabase } from '../lib/supabase';
import { Project, Task, Milestone, Comment, Attachment, User, ProjectRole, TaskStatus, Priority, ProjectInvitation } from '../types';

// Helper function to convert database row to Project with team
const dbToProject = async (row: any): Promise<Project> => {
    // Get team members
    const { data: teamData } = await supabase
        .from('project_members')
        .select('user_id, role')
        .eq('project_id', row.id);

    return {
        id: row.id,
        name: row.name,
        description: row.description,
        templateType: row.template_type,
        progress: row.progress,
        team: teamData?.map(tm => ({ userId: tm.user_id, role: tm.role as ProjectRole })) || [],
        tasks: [], // Will be loaded separately
        milestones: [], // Will be loaded separately
        createdAt: row.created_at
    };
};

// Helper to convert task from database
const dbToTask = (row: any): Task => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as Priority,
    assigneeId: row.assignee_id,
    dueDate: row.due_date,
    milestoneId: row.milestone_id,
    comments: [] // Will be loaded separately when needed
});

// Helper to convert milestone from database
const dbToMilestone = (row: any): Milestone => ({
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date
});

// ============ PROJECTS ============

export const getProjects = async (userId: string): Promise<Project[]> => {
    try {
        // Get all projects where user is a member
        const { data: memberData, error: memberError } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', userId);

        if (memberError) throw memberError;

        const projectIds = memberData?.map(m => m.project_id) || [];

        if (projectIds.length === 0) return [];

        // Get project details
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .in('id', projectIds)
            .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        // Convert to Project type with team info
        const projectsWithTeam = await Promise.all(
            (projects || []).map(p => dbToProject(p))
        );

        // Get tasks for all projects
        const { data: allTasks } = await supabase
            .from('tasks')
            .select('*')
            .in('project_id', projectIds)
            .order('position', { ascending: true });

        // Get milestones for all projects
        const { data: allMilestones } = await supabase
            .from('milestones')
            .select('*')
            .in('project_id', projectIds)
            .order('created_at', { ascending: true });

        // Attach tasks and milestones to projects
        return projectsWithTeam.map(project => ({
            ...project,
            tasks: (allTasks || [])
                .filter(t => t.project_id === project.id)
                .map(dbToTask),
            milestones: (allMilestones || [])
                .filter(m => m.project_id === project.id)
                .map(dbToMilestone)
        }));
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
    try {
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error) throw error;
        if (!project) return null;

        const projectWithTeam = await dbToProject(project);

        // Get tasks
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('position', { ascending: true });

        // Get milestones
        const { data: milestones } = await supabase
            .from('milestones')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        return {
            ...projectWithTeam,
            tasks: (tasks || []).map(dbToTask),
            milestones: (milestones || []).map(dbToMilestone)
        };
    } catch (error) {
        console.error('Error fetching project:', error);
        throw error;
    }
};

export const createProject = async (
    name: string,
    description: string,
    templateType: string,
    createdBy: string,
    teamMemberIds: string[] = []
): Promise<Project> => {
    try {
        // Create project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
                name,
                description,
                template_type: templateType,
                created_by: createdBy,
                progress: 0
            })
            .select()
            .single();

        if (projectError) throw projectError;

        // Add creator as owner
        const teamMembers = [
            { project_id: project.id, user_id: createdBy, role: 'Owner' },
            ...teamMemberIds.map(userId => ({
                project_id: project.id,
                user_id: userId,
                role: 'Member' as ProjectRole
            }))
        ];

        const { error: teamError } = await supabase
            .from('project_members')
            .insert(teamMembers);

        if (teamError) throw teamError;

        return await dbToProject(project);
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
};

export const updateProject = async (
    projectId: string,
    updates: { name?: string; description?: string; progress?: number }
): Promise<void> => {
    try {
        const updateData: any = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.progress !== undefined) updateData.progress = updates.progress;

        const { error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', projectId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
};

export const deleteProject = async (projectId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
};

// ============ TASKS ============

export const getTasks = async (projectId: string): Promise<Task[]> => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('position', { ascending: true });

        if (error) throw error;

        return (data || []).map(dbToTask);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
};

export const createTask = async (
    projectId: string,
    taskData: Omit<Task, 'id' | 'comments'>
): Promise<Task> => {
    try {
        // Get max position
        const { data: maxPos } = await supabase
            .from('tasks')
            .select('position')
            .eq('project_id', projectId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const position = (maxPos?.position || 0) + 1;

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                project_id: projectId,
                title: taskData.title,
                description: taskData.description,
                status: taskData.status,
                priority: taskData.priority,
                assignee_id: taskData.assigneeId,
                due_date: taskData.dueDate,
                milestone_id: taskData.milestoneId,
                position
            })
            .select()
            .single();

        if (error) throw error;

        return dbToTask(data);
    } catch (error) {
        console.error('Error creating task:', error);
        throw error;
    }
};

export const updateTask = async (
    taskId: string,
    updates: Partial<Task>
): Promise<void> => {
    try {
        const updateData: any = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.priority !== undefined) updateData.priority = updates.priority;
        if (updates.assigneeId !== undefined) updateData.assignee_id = updates.assigneeId;
        if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
        if (updates.milestoneId !== undefined) updateData.milestone_id = updates.milestoneId;

        const { error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', taskId);

        if (error) throw error;

        // Update project progress
        const { data: task } = await supabase
            .from('tasks')
            .select('project_id')
            .eq('id', taskId)
            .single();

        if (task) {
            await updateProjectProgress(task.project_id);
        }
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        // Get project_id before deleting
        const { data: task } = await supabase
            .from('tasks')
            .select('project_id')
            .eq('id', taskId)
            .single();

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;

        // Update project progress
        if (task) {
            await updateProjectProgress(task.project_id);
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};

export const moveTask = async (
    taskId: string,
    milestoneId: string | undefined,
    targetPosition: number
): Promise<void> => {
    try {
        const { error } = await supabase
            .from('tasks')
            .update({
                milestone_id: milestoneId,
                position: targetPosition
            })
            .eq('id', taskId);

        if (error) throw error;
    } catch (error) {
        console.error('Error moving task:', error);
        throw error;
    }
};

// ============ MILESTONES ============

export const getMilestones = async (projectId: string): Promise<Milestone[]> => {
    try {
        const { data, error } = await supabase
            .from('milestones')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map(dbToMilestone);
    } catch (error) {
        console.error('Error fetching milestones:', error);
        throw error;
    }
};

export const createMilestone = async (
    projectId: string,
    title: string,
    dueDate?: string,
    description?: string
): Promise<Milestone> => {
    try {
        const { data, error } = await supabase
            .from('milestones')
            .insert({
                project_id: projectId,
                title,
                due_date: dueDate,
                description
            })
            .select()
            .single();

        if (error) throw error;

        return dbToMilestone(data);
    } catch (error) {
        console.error('Error creating milestone:', error);
        throw error;
    }
};

export const updateMilestone = async (
    milestoneId: string,
    updates: Partial<Milestone>
): Promise<void> => {
    try {
        const updateData: any = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;

        const { error } = await supabase
            .from('milestones')
            .update(updateData)
            .eq('id', milestoneId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating milestone:', error);
        throw error;
    }
};

export const deleteMilestone = async (milestoneId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('milestones')
            .delete()
            .eq('id', milestoneId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting milestone:', error);
        throw error;
    }
};

// ============ COMMENTS ============

export const getComments = async (taskId: string): Promise<Comment[]> => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select(`
        *,
        attachments (*)
      `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map(comment => ({
            id: comment.id,
            userId: comment.user_id,
            content: comment.content,
            createdAt: comment.created_at,
            attachments: comment.attachments?.map((a: any) => ({
                id: a.id,
                name: a.name,
                url: a.url,
                type: a.type
            })) || []
        }));
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
};

export const createComment = async (
    taskId: string,
    userId: string,
    content: string,
    attachments: Attachment[] = []
): Promise<Comment> => {
    try {
        const { data: comment, error: commentError } = await supabase
            .from('comments')
            .insert({
                task_id: taskId,
                user_id: userId,
                content
            })
            .select()
            .single();

        if (commentError) throw commentError;

        // Add attachments if any
        if (attachments.length > 0) {
            const { error: attachError } = await supabase
                .from('attachments')
                .insert(
                    attachments.map(a => ({
                        comment_id: comment.id,
                        name: a.name,
                        url: a.url,
                        type: a.type
                    }))
                );

            if (attachError) throw attachError;
        }

        return {
            id: comment.id,
            userId: comment.user_id,
            content: comment.content,
            createdAt: comment.created_at,
            attachments
        };
    } catch (error) {
        console.error('Error creating comment:', error);
        throw error;
    }
};

export const updateComment = async (
    commentId: string,
    content: string
): Promise<void> => {
    try {
        const { error } = await supabase
            .from('comments')
            .update({ content })
            .eq('id', commentId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating comment:', error);
        throw error;
    }
};

export const deleteComment = async (commentId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
};

// ============ TEAM MANAGEMENT ============

export const getProjectMembers = async (projectId: string): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('project_members')
            .select(`
        user_id,
        role,
        profiles (*)
      `)
            .eq('project_id', projectId);

        if (error) throw error;

        return (data || []).map((member: any) => ({
            id: member.profiles.id,
            name: member.profiles.name,
            email: member.profiles.email,
            avatar: member.profiles.avatar,
            jobTitle: member.profiles.job_title
        }));
    } catch (error) {
        console.error('Error fetching project members:', error);
        throw error;
    }
};

export const addProjectMember = async (
    projectId: string,
    userId: string,
    role: ProjectRole = 'Member'
): Promise<void> => {
    try {
        const { error } = await supabase
            .from('project_members')
            .insert({
                project_id: projectId,
                user_id: userId,
                role
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error adding project member:', error);
        throw error;
    }
};

export const updateMemberRole = async (
    projectId: string,
    userId: string,
    role: ProjectRole
): Promise<void> => {
    try {
        const { error } = await supabase
            .from('project_members')
            .update({ role })
            .eq('project_id', projectId)
            .eq('user_id', userId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating member role:', error);
        throw error;
    }
};

export const removeProjectMember = async (
    projectId: string,
    userId: string
): Promise<void> => {
    try {
        const { error } = await supabase
            .from('project_members')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', userId);

        if (error) throw error;
    } catch (error) {
        console.error('Error removing project member:', error);
        throw error;
    }
};

// ============ PROFILES ============

export const getProfile = async (userId: string): Promise<User | null> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        if (!data) return null;

        return {
            id: data.id,
            name: data.name,
            email: data.email,
            avatar: data.avatar,
            jobTitle: data.job_title
        };
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
};

export const getAllUsers = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        return (data || []).map(profile => ({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar,
            jobTitle: profile.job_title
        }));
    } catch (error) {
        console.error('Error fetching all users:', error);
        throw error;
    }
};

export const updateProfile = async (
    userId: string,
    updates: { name?: string; jobTitle?: string; avatar?: string }
): Promise<void> => {
    try {
        const updateData: any = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.jobTitle !== undefined) updateData.job_title = updates.jobTitle;
        if (updates.avatar !== undefined) updateData.avatar = updates.avatar;

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

export const searchUsers = async (query: string): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10);

        if (error) throw error;

        return (data || []).map(profile => ({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar,
            jobTitle: profile.job_title
        }));
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
};

// ============ HELPERS ============

const updateProjectProgress = async (projectId: string): Promise<void> => {
    try {
        const { data: tasks } = await supabase
            .from('tasks')
            .select('status')
            .eq('project_id', projectId);

        if (!tasks || tasks.length === 0) {
            await supabase
                .from('projects')
                .update({ progress: 0 })
                .eq('id', projectId);
            return;
        }

        const completed = tasks.filter(t => t.status === 'Completed').length;
        const progress = Math.round((completed / tasks.length) * 100);

        await supabase
            .from('projects')
            .update({ progress })
            .eq('id', projectId);
    } catch (error) {
        console.error('Error updating project progress:', error);
    }
};

// ============ PROJECT INVITATIONS ============

export const createProjectInvitation = async (
    projectId: string,
    invitedUserId: string,
    invitedBy: string,
    role: ProjectRole = 'Member'
): Promise<ProjectInvitation> => {
    try {
        // Check if user is already a member
        const { data: existingMember } = await supabase
            .from('project_members')
            .select('id')
            .eq('project_id', projectId)
            .eq('user_id', invitedUserId)
            .single();

        if (existingMember) {
            throw new Error('User is already a member of this project');
        }

        // Check if there's already a pending invitation
        const { data: existingInvitation } = await supabase
            .from('project_invitations')
            .select('id')
            .eq('project_id', projectId)
            .eq('invited_user_id', invitedUserId)
            .eq('status', 'pending')
            .single();

        if (existingInvitation) {
            throw new Error('User already has a pending invitation to this project');
        }

        const { data, error } = await supabase
            .from('project_invitations')
            .insert({
                project_id: projectId,
                invited_user_id: invitedUserId,
                invited_by: invitedBy,
                role,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            projectId: data.project_id,
            invitedUserId: data.invited_user_id,
            invitedBy: data.invited_by,
            role: data.role as ProjectRole,
            status: data.status,
            createdAt: data.created_at
        };
    } catch (error) {
        console.error('Error creating invitation:', error);
        throw error;
    }
};

export const getProjectInvitations = async (projectId: string): Promise<ProjectInvitation[]> => {
    try {
        const { data, error } = await supabase
            .from('project_invitations')
            .select('*')
            .eq('project_id', projectId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(inv => ({
            id: inv.id,
            projectId: inv.project_id,
            invitedUserId: inv.invited_user_id,
            invitedBy: inv.invited_by,
            role: inv.role as ProjectRole,
            status: inv.status,
            createdAt: inv.created_at
        }));
    } catch (error) {
        console.error('Error fetching project invitations:', error);
        throw error;
    }
};

export const getUserInvitations = async (userId: string): Promise<ProjectInvitation[]> => {
    try {
        const { data, error } = await supabase
            .from('project_invitations')
            .select('*')
            .eq('invited_user_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(inv => ({
            id: inv.id,
            projectId: inv.project_id,
            invitedUserId: inv.invited_user_id,
            invitedBy: inv.invited_by,
            role: inv.role as ProjectRole,
            status: inv.status,
            createdAt: inv.created_at
        }));
    } catch (error) {
        console.error('Error fetching user invitations:', error);
        throw error;
    }
};

export const acceptProjectInvitation = async (invitationId: string): Promise<void> => {
    try {
        // Get invitation details
        const { data: invitation, error: invError } = await supabase
            .from('project_invitations')
            .select('*')
            .eq('id', invitationId)
            .eq('status', 'pending')
            .single();

        if (invError) throw invError;
        if (!invitation) throw new Error('Invitation not found or already processed');

        // Add user to project
        const { error: memberError } = await supabase
            .from('project_members')
            .insert({
                project_id: invitation.project_id,
                user_id: invitation.invited_user_id,
                role: invitation.role
            });

        if (memberError) throw memberError;

        // Update invitation status
        const { error: updateError } = await supabase
            .from('project_invitations')
            .update({ status: 'accepted' })
            .eq('id', invitationId);

        if (updateError) throw updateError;
    } catch (error) {
        console.error('Error accepting invitation:', error);
        throw error;
    }
};

export const declineProjectInvitation = async (invitationId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('project_invitations')
            .update({ status: 'declined' })
            .eq('id', invitationId);

        if (error) throw error;
    } catch (error) {
        console.error('Error declining invitation:', error);
        throw error;
    }
};

export const cancelProjectInvitation = async (invitationId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('project_invitations')
            .delete()
            .eq('id', invitationId)
            .eq('status', 'pending');

        if (error) throw error;
    } catch (error) {
        console.error('Error canceling invitation:', error);
        throw error;
    }
};
