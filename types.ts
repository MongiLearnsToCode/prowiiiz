
export enum TaskStatus {
  TODO = 'Todo',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export type ProjectRole = 'Owner' | 'Member' | 'Viewer';

export interface User {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string; // Renamed from 'role' to avoid confusion with project permissions
  email: string;
  isPending?: boolean; // Added to track invited users
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface Milestone {
  id: string;
  title: string;
  dueDate?: string;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string;
  dueDate?: string;
  priority: Priority;
  milestoneId?: string;
  comments: Comment[];
}

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  invitedUserId: string;
  invitedBy: string;
  role: ProjectRole;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  templateType: string;
  tasks: Task[];
  milestones: Milestone[];
  team: ProjectMember[]; // Changed from teamIds: string[]
  createdAt: string;
  progress: number; // 0-100
}

export interface WizardData {
  name: string;
  description: string;
  template: string;
  selectedTeamIds: string[];
  suggestedTasks: Task[];
}

export enum AppView {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  WIZARD = 'WIZARD',
  PROJECT_DETAIL = 'PROJECT_DETAIL',
}
