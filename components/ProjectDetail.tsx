import React, { useState, useEffect, useRef } from 'react';
import { Project, Task, TaskStatus, Priority, User, Attachment, ProjectMember, ProjectInvitation } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Calendar, Plus, Flag, User as UserIcon, Trash2, MoreVertical, Edit, X, MessageSquare, Send, Target, GripVertical, Paperclip, File as FileIcon, Image as ImageIcon, AlertCircle, Lock, ChevronDown, ListCheck, Ghost } from 'lucide-react';
import { Input, Textarea, UserAvatar, Tooltip, ConfirmModal, FileDropzone, UserSelect, Button, useToast, EmptyState } from './Common';

interface ProjectDetailProps {
  project: Project;
  users: User[];
  currentUser: User;
  onBack: () => void;
  onUpdateTask: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  onAddTask: (projectId: string, taskData: Omit<Task, 'id' | 'comments'>) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
  onEditProject: (projectId: string, updates: { name?: string; description?: string; team?: ProjectMember[] }) => void;
  onDeleteProject: (projectId: string) => void;
  onAddComment: (projectId: string, taskId: string, content: string, attachments?: Attachment[]) => void;
  onAddMilestone: (projectId: string, title: string, dueDate?: string) => void;
  onMoveTask: (projectId: string, taskId: string, newMilestoneId: string | undefined, targetTaskId?: string) => void;
  projectInvitations: ProjectInvitation[];
  onInviteUser: (projectId: string, userId: string, role: 'Member' | 'Viewer') => void;
  onCancelInvitation: (invitationId: string) => void;
}

const getPriorityColor = (p: Priority) => {
  switch (p) {
    case Priority.HIGH: return 'text-red-600 bg-red-50 border-red-100';
    case Priority.MEDIUM: return 'text-amber-600 bg-amber-50 border-amber-100';
    case Priority.LOW: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    default: return 'text-slate-600 bg-slate-50';
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CustomDatePicker: React.FC<{
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  align?: 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
}> = ({ value, onChange, disabled, align = 'left', className, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d));
    }
  }, [value, isOpen]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const formatted = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={className || `flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200' :
          value
            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-600'
          }`}
      >
        {children ? children : (
          <>
            <Calendar size={16} />
            <span className="text-sm font-medium">
              {value ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Due Date'}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 w-72 animate-in fade-in zoom-in-95 duration-200`}>
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="text-slate-800 font-semibold text-sm">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs text-slate-400 font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = value &&
                Number(value.split('-')[2]) === day &&
                Number(value.split('-')[1]) === viewDate.getMonth() + 1 &&
                Number(value.split('-')[0]) === viewDate.getFullYear();

              const isToday =
                day === new Date().getDate() &&
                viewDate.getMonth() === new Date().getMonth() &&
                viewDate.getFullYear() === new Date().getFullYear();

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={`
                    h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : isToday
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className="w-full mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
            >
              Clear Date
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const TaskItem: React.FC<{
  task: Task;
  projectId: string;
  users: User[];
  members: User[];
  canEdit: boolean;
  onUpdate: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  onRequestDelete: (task: Task) => void;
  onOpenComments: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent, taskId: string) => void;
  onDrop: (e: React.DragEvent, taskId: string) => void;
  isDragging: boolean;
  isDragOver: boolean;
}> = ({ task, projectId, users, members, canEdit, onUpdate, onRequestDelete, onOpenComments, onDragStart, onDragOver, onDrop, isDragging, isDragOver }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const { addToast } = useToast();

  const isDone = task.status === TaskStatus.COMPLETED;
  const assignee = users.find(u => u.id === task.assigneeId);

  // Count attachments
  const attachmentCount = task.comments.reduce((acc, c) => acc + (c.attachments?.length || 0), 0);

  useEffect(() => {
    if (!isEditingTitle) setTitleValue(task.title);
  }, [task.title, isEditingTitle]);

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (canEdit && titleValue.trim() && titleValue.trim() !== task.title) {
      onUpdate(projectId, task.id, { title: titleValue.trim() });
    } else {
      setTitleValue(task.title);
    }
  };

  const handleKeyDownTitle = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestDelete(task);
  };

  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) return;
    const newStatus = isDone ? TaskStatus.TODO : TaskStatus.COMPLETED;
    onUpdate(projectId, task.id, { status: newStatus });
    if (newStatus === TaskStatus.COMPLETED) {
      addToast('Task completed!', 'success');
    }
  };

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => canEdit && onDragStart(e, task.id)}
      onDragOver={(e) => canEdit && onDragOver(e, task.id)}
      onDrop={(e) => canEdit && onDrop(e, task.id)}
      className={`relative group bg-white p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start gap-4 ${isDone ? 'border-slate-100 bg-slate-50/50' : 'border-slate-200 hover:border-indigo-300 shadow-sm'
        } ${isDragging ? 'opacity-40 scale-[0.98] ring-2 ring-indigo-200 rotate-1 z-50' : 'opacity-100 hover:shadow-md'} `}
    >
      {/* Drop Indicator */}
      {isDragOver && !isDragging && (
        <div className="absolute -top-2.5 left-0 right-0 h-1.5 bg-indigo-500 rounded-full shadow-sm pointer-events-none z-20 animate-in fade-in duration-200"></div>
      )}

      {canEdit && (
        <div className="hidden sm:block pt-1.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
          <GripVertical size={20} />
        </div>
      )}
      <div className="flex-shrink-0 pt-1">
        <button
          onClick={toggleStatus}
          disabled={!canEdit}
          className={`transition-colors ${!canEdit ? 'cursor-not-allowed opacity-50' :
            isDone ? 'text-blue-600' : 'text-slate-300 hover:text-blue-500'
            }`}
        >
          {isDone ? <CheckCircle size={24} /> : <Circle size={24} />}
        </button>
      </div>

      <div className="flex-1 min-w-0 w-full">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            {isEditingTitle && canEdit ? (
              <Input
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDownTitle}
                className="!text-lg !font-medium !text-slate-900 !border-0 !border-b-2 !border-indigo-600 !bg-transparent !p-0 !rounded-none !focus:ring-0"
              />
            ) : (
              <h3
                onClick={() => canEdit && !isDone && setIsEditingTitle(true)}
                className={`text-lg font-medium transition-all leading-tight ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'
                  } ${canEdit && !isDone ? 'cursor-text hover:text-indigo-700' : ''}`}
              >
                {task.title}
              </h3>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          {/* Due Date - Editable */}
          {!isDone && (
            <div onClick={(e) => e.stopPropagation()}>
              <CustomDatePicker
                value={task.dueDate || ''}
                onChange={(date) => onUpdate(projectId, task.id, { dueDate: date })}
                disabled={!canEdit}
                className={`flex items-center gap-1 text-xs ${task.dueDate ? 'text-slate-500 bg-slate-100' : 'text-slate-400 hover:bg-slate-50'} px-2 py-1 rounded-md transition-colors border border-transparent ${canEdit ? 'hover:border-slate-300 cursor-pointer' : ''}`}
                children={
                  task.dueDate ? (
                    <>
                      <Calendar size={12} /> {task.dueDate}
                    </>
                  ) : (
                    canEdit ? <><Plus size={12} /> Date</> : null
                  )
                }
              />
            </div>
          )}

          {/* Priority - Editable */}
          {!isDone && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (canEdit) setIsPriorityOpen(!isPriorityOpen);
                }}
                disabled={!canEdit}
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${getPriorityColor(task.priority)} ${canEdit ? 'hover:ring-1 hover:ring-offset-1 hover:ring-slate-200 cursor-pointer' : 'cursor-default'}`}
              >
                {task.priority} Priority
              </button>
              {isPriorityOpen && canEdit && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setIsPriorityOpen(false); }}></div>
                  <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                    {[Priority.HIGH, Priority.MEDIUM, Priority.LOW].map(p => (
                      <button
                        key={p}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate(projectId, task.id, { priority: p });
                          setIsPriorityOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <div className={`w-2 h-2 rounded-full ${p === Priority.HIGH ? 'bg-red-500' : p === Priority.MEDIUM ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                        {p}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {task.comments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <MessageSquare size={12} /> {task.comments.length}
            </span>
          )}
          {attachmentCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Paperclip size={12} /> {attachmentCount}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 w-full sm:w-auto justify-end">

        {/* Comments Button - Visible to All */}
        <Tooltip content="Comments" position="top">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenComments(task); }}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <MessageSquare size={16} />
          </button>
        </Tooltip>

        {/* Assignee Selector - Only editable by Owners and Members */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canEdit && !isDone) setIsAssigneeOpen(!isAssigneeOpen);
            }}
            disabled={!canEdit || isDone}
            className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all ${assignee
              ? 'bg-white border border-slate-200 shadow-sm'
              : 'bg-slate-50 border border-dashed border-slate-300 text-slate-400'
              } ${canEdit && !isDone ? 'hover:border-indigo-400 hover:text-indigo-500 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
          >
            {assignee ? (
              <UserAvatar src={assignee.avatar} alt={assignee.name} size="sm" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                <UserIcon size={12} />
              </div>
            )}
          </button>

          {isAssigneeOpen && canEdit && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setIsAssigneeOpen(false); }}></div>
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl p-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(projectId, task.id, { assigneeId: undefined });
                    setIsAssigneeOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <UserIcon size={14} className="text-slate-400" />
                  </div>
                  <span className="text-sm text-slate-600">Unassigned</span>
                  {!task.assigneeId && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                </button>
                <div className="h-[1px] bg-slate-100 my-1"></div>
                {members.map(u => (
                  <button
                    key={u.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate(projectId, task.id, { assigneeId: u.id });
                      setIsAssigneeOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <UserAvatar src={u.avatar} alt={u.name} size="sm" className="border border-slate-200" />
                    <span className="text-sm text-slate-700 font-medium truncate">{u.name}</span>
                    {task.assigneeId === u.id && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {canEdit && (
          <Tooltip content="Delete Task" position="top">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project, users, currentUser, onBack, onUpdateTask, onAddTask, onDeleteTask,
  onEditProject, onDeleteProject, onAddComment, onAddMilestone, onMoveTask,
  projectInvitations, onInviteUser, onCancelInvitation
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  // Sidebar Swipe Logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Determine Permissions
  const memberRecord = project.team.find(m => m.userId === currentUser.id);
  const userRole = memberRecord?.role || 'Viewer';
  const isOwner = userRole === 'Owner';
  const isMember = userRole === 'Member';
  const canEdit = isOwner || isMember;
  const canManageProject = isOwner;

  // New Task State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>('');
  const [newTaskMilestoneId, setNewTaskMilestoneId] = useState<string>('');

  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isMilestoneDropdownOpen, setIsMilestoneDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Sidebar Edit State
  const [isSidebarAssigneeOpen, setIsSidebarAssigneeOpen] = useState(false);
  const [isSidebarPriorityOpen, setIsSidebarPriorityOpen] = useState(false);

  // Sidebar Milestone State
  const [isSidebarMilestoneOpen, setIsSidebarMilestoneOpen] = useState(false);
  const [isSidebarCreatingMilestone, setIsSidebarCreatingMilestone] = useState(false);
  const [sidebarNewMilestoneTitle, setSidebarNewMilestoneTitle] = useState('');
  const prevMilestonesLengthSidebarRef = useRef(project.milestones.length);

  // Milestone State
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  // Inline Milestone Creation State (Add Task Form)
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [newInlineMilestoneTitle, setNewInlineMilestoneTitle] = useState('');
  const prevMilestonesLengthRef = useRef(project.milestones.length);

  // Project Edit State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState(project.name);
  const [editProjectDesc, setEditProjectDesc] = useState(project.description);
  const [editProjectTeam, setEditProjectTeam] = useState<ProjectMember[]>([]);
  const [editUserToAddId, setEditUserToAddId] = useState('');

  // Comment Input
  const [commentInput, setCommentInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop State
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverMilestoneId, setDragOverMilestoneId] = useState<string | null>(null);

  // Delete Confirmation State
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);

  // Resolve project users
  const projectMembers = users.filter(u => project.team.some(m => m.userId === u.id));

  useEffect(() => {
    if (isEditModalOpen) {
      setEditProjectName(project.name);
      setEditProjectDesc(project.description);
      setEditProjectTeam(project.team);
      setEditUserToAddId('');
    }
  }, [project, isEditModalOpen]);

  useEffect(() => {
    if (activeTask) {
      const updatedTask = project.tasks.find(t => t.id === activeTask.id);
      if (updatedTask && updatedTask !== activeTask) {
        setActiveTask(updatedTask);
      }
    }
  }, [project.tasks]);

  // Auto-select newly created inline milestone (Add Task Form)
  useEffect(() => {
    if (project.milestones.length > prevMilestonesLengthRef.current) {
      if (isCreatingMilestone) {
        const newMilestone = project.milestones[project.milestones.length - 1];
        setNewTaskMilestoneId(newMilestone.id);
        setIsCreatingMilestone(false);
        setNewInlineMilestoneTitle('');
      }
    }
    prevMilestonesLengthRef.current = project.milestones.length;
  }, [project.milestones, isCreatingMilestone]);

  // Auto-select newly created inline milestone (Sidebar)
  useEffect(() => {
    if (project.milestones.length > prevMilestonesLengthSidebarRef.current) {
      if (isSidebarCreatingMilestone && activeTask) {
        const newMilestone = project.milestones[project.milestones.length - 1];
        onUpdateTask(project.id, activeTask.id, { milestoneId: newMilestone.id });
        setIsSidebarCreatingMilestone(false);
        setSidebarNewMilestoneTitle('');
      }
    }
    prevMilestonesLengthSidebarRef.current = project.milestones.length;
  }, [project.milestones, isSidebarCreatingMilestone, activeTask, onUpdateTask, project.id]);

  const handleOpenSidebar = (task: Task) => {
    setActiveTask(task);
    // Small delay to allow render before transition
    setTimeout(() => setIsSidebarVisible(true), 10);
  };

  const handleCloseSidebar = () => {
    setIsSidebarVisible(false);
    setTimeout(() => {
      setActiveTask(null);
    }, 300);
  };

  // Touch Handlers for Swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isRightSwipe = distance < -50;
    if (isRightSwipe) {
      handleCloseSidebar();
    }
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask(project.id, {
      title: newTaskTitle,
      description: newTaskDescription,
      status: TaskStatus.TODO,
      priority: newTaskPriority,
      dueDate: newTaskDueDate || new Date().toISOString().split('T')[0],
      assigneeId: newTaskAssigneeId || undefined,
      milestoneId: newTaskMilestoneId || undefined
    });
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDueDate('');
    setNewTaskPriority(Priority.MEDIUM);
    setNewTaskAssigneeId('');
    setNewTaskMilestoneId('');
    setIsAssigneeDropdownOpen(false);
    setIsMilestoneDropdownOpen(false);
    setIsPriorityDropdownOpen(false);
    setIsAdding(false);
  };

  const handleSaveProjectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onEditProject(project.id, {
      name: editProjectName,
      description: editProjectDesc,
      team: editProjectTeam
    });
    setIsEditModalOpen(false);
  };

  const handleAddMember = () => {
    if (editUserToAddId && !editProjectTeam.some(m => m.userId === editUserToAddId)) {
      setEditProjectTeam([...editProjectTeam, { userId: editUserToAddId, role: 'Member' }]);
      setEditUserToAddId('');
    }
  };

  const handleRemoveMember = (userId: string) => {
    setEditProjectTeam(editProjectTeam.filter(m => m.userId !== userId));
  };


  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    onAddMilestone(project.id, newMilestoneTitle, newMilestoneDate || undefined);
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
    setIsAddingMilestone(false);
  };

  const handleInlineMilestoneCreate = () => {
    if (newInlineMilestoneTitle.trim()) {
      onAddMilestone(project.id, newInlineMilestoneTitle);
    } else {
      setIsCreatingMilestone(false);
      setNewInlineMilestoneTitle('');
    }
  };

  const handleSidebarInlineMilestoneCreate = () => {
    if (sidebarNewMilestoneTitle.trim()) {
      onAddMilestone(project.id, sidebarNewMilestoneTitle);
      // The effect will handle the assignment
    } else {
      setIsSidebarCreatingMilestone(false);
      setSidebarNewMilestoneTitle('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesDropped(Array.from(e.target.files));
    }
    // Reset input value to allow selecting the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFilesDropped = (files: File[]) => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];

    files.forEach(file => {
      if (file.size <= MAX_SIZE) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
    if (invalidFiles.length > 0) {
      setRejectedFiles(prev => [...prev, ...invalidFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeRejectedFile = (index: number) => {
    setRejectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!commentInput.trim() && selectedFiles.length === 0) || !activeTask) return;

    const attachments: Attachment[] = selectedFiles.map(file => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file), // Simulate file hosting with blob URL
      type: file.type
    }));

    onAddComment(project.id, activeTask.id, commentInput, attachments);
    setCommentInput('');
    setSelectedFiles([]);
    setRejectedFiles([]);
  };

  const getPriorityButtonStyles = (p: Priority, isSelected: boolean) => {
    if (!isSelected) return 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50';
    switch (p) {
      case Priority.HIGH: return 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200 font-semibold';
      case Priority.MEDIUM: return 'bg-amber-50 border-amber-200 text-amber-700 ring-1 ring-amber-200 font-semibold';
      case Priority.LOW: return 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-1 ring-emerald-200 font-semibold';
      default: return 'bg-slate-100 border-slate-200 text-slate-700';
    }
  };

  // DnD Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTaskDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault(); // Allow drop
    if (draggingTaskId !== taskId) {
      setDragOverTaskId(taskId);
    }
  };

  const handleTaskDrop = (e: React.DragEvent, targetMilestoneId: string | undefined, targetTaskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceTaskId = e.dataTransfer.getData('taskId');

    if (sourceTaskId && sourceTaskId !== targetTaskId) {
      onMoveTask(project.id, sourceTaskId, targetMilestoneId, targetTaskId);
    }

    resetDragState();
  };

  const handleContainerDragOver = (e: React.DragEvent, milestoneId: string | undefined) => {
    e.preventDefault();
    const targetId = milestoneId || 'uncategorized';
    if (dragOverMilestoneId !== targetId) {
      setDragOverMilestoneId(targetId);
    }
  };

  const handleContainerDrop = (e: React.DragEvent, milestoneId: string | undefined) => {
    e.preventDefault();
    const sourceTaskId = e.dataTransfer.getData('taskId');

    // If we drop on the container itself (not a task), append to end
    if (sourceTaskId) {
      onMoveTask(project.id, sourceTaskId, milestoneId, undefined);
    }
    resetDragState();
  };

  const resetDragState = () => {
    setDraggingTaskId(null);
    setDragOverTaskId(null);
    setDragOverMilestoneId(null);
  };

  // Grouping Tasks
  const tasksByMilestone = project.milestones.reduce((acc, m) => {
    acc[m.id] = project.tasks.filter(t => t.milestoneId === m.id);
    return acc;
  }, {} as Record<string, Task[]>);

  const uncategorizedTasks = project.tasks.filter(t => !t.milestoneId);

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden" onDragOver={(e) => e.preventDefault()} onDrop={resetDragState}>
      {/* Confirm Delete Modal (Task) */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        onConfirm={() => {
          if (taskToDelete) {
            onDeleteTask(project.id, taskToDelete.id);
            setTaskToDelete(null);
            // If the deleted task was open in sidebar, close sidebar
            if (activeTask?.id === taskToDelete.id) {
              setActiveTask(null);
            }
          }
        }}
        onCancel={() => setTaskToDelete(null)}
        isDestructive={true}
        confirmText="Delete Task"
      />

      {/* Confirm Delete Modal (Project) */}
      <ConfirmModal
        isOpen={isDeleteProjectModalOpen}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${project.name}"? This action cannot be undone and all tasks will be lost.`}
        onConfirm={() => {
          onDeleteProject(project.id);
          setIsDeleteProjectModalOpen(false);
          setIsMenuOpen(false);
        }}
        onCancel={() => setIsDeleteProjectModalOpen(false)}
        isDestructive={true}
        confirmText="Delete Project"
      />

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Edit Project</h2>
              <Button
                variant="icon"
                onClick={() => setIsEditModalOpen(false)}
                icon={<X size={24} />}
              />
            </div>

            <form onSubmit={handleSaveProjectEdit} className="p-6 space-y-4">
              <Input
                label="Project Name"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                required
              />

              <Textarea
                label="Description"
                value={editProjectDesc}
                onChange={(e) => setEditProjectDesc(e.target.value)}
                className="h-32"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Team Members</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2 mb-3 bg-slate-50/50">
                  {editProjectTeam.map(member => {
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
                    users={users.filter(u => !editProjectTeam.some(m => m.userId === u.id) && !projectInvitations.some(inv => inv.invitedUserId === u.id))}
                    value={editUserToAddId}
                    onChange={setEditUserToAddId}
                    placeholder="Select user to add..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddMember}
                    disabled={!editUserToAddId}
                    className="px-3"
                    icon={<Plus size={16} />}
                  />
                </div>
              </div>

              {/* Pending Invitations Section */}
              {canManageProject && projectInvitations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pending Invitations</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-amber-100 rounded-xl p-2 bg-amber-50/30">
                    {projectInvitations.map(invitation => {
                      const invitedUser = users.find(u => u.id === invitation.invitedUserId);
                      if (!invitedUser) return null;
                      return (
                        <div key={invitation.id} className="flex items-center justify-between p-2 bg-white hover:bg-slate-50 border border-amber-200 rounded-lg group shadow-sm">
                          <div className="flex items-center gap-2">
                            <UserAvatar src={invitedUser.avatar} alt={invitedUser.name} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                {invitedUser.name}
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded uppercase tracking-wider">Pending</span>
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{invitation.role}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCancelInvitation(invitation.id)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all h-9 w-9"
                            title="Cancel invitation"
                            icon={<X size={20} />}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-50">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(false)}
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

      {/* Main Content - Removed conditional right margin shift */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300`}>
        {/* Header */}
        <div className="border-b border-slate-200 p-6 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="text-slate-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                {project.name}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${userRole === 'Owner' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                  userRole === 'Member' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                  {userRole} View
                </span>
              </h1>
              <p className="text-slate-500 text-sm">{project.templateType} Project</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 mr-4">
              {projectMembers.map(u => (
                <Tooltip key={u.id} content={u.name} position="bottom">
                  <UserAvatar src={u.avatar} alt={u.name} size="md" className="border-2 border-white" />
                </Tooltip>
              ))}
            </div>
            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
            <span className="text-sm font-medium text-slate-600 hidden md:block">{Math.round(project.progress)}% Complete</span>

            {/* Project Settings Menu - Owner Only */}
            {canManageProject && (
              <div className="relative ml-2">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                  <MoreVertical size={20} />
                </button>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                      <button
                        onClick={() => { setIsEditModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit size={16} className="text-slate-400" /> Edit Project
                      </button>
                      <div className="h-[1px] bg-slate-50 my-1"></div>
                      <button
                        onClick={() => setIsDeleteProjectModalOpen(true)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Delete Project
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Project Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Add Task Bar */}
            <div className="mb-8">
              {canEdit ? (
                !isAdding ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsAdding(true)}
                      className="flex-1 py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={20} /> Add Task
                    </button>
                    {canManageProject && (
                      <button
                        onClick={() => setIsAddingMilestone(true)}
                        className="px-6 py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Target size={20} /> Add Milestone
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleAddTask} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-200 fade-in relative z-30">
                    <Input
                      autoFocus
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      placeholder="What needs to be done?"
                      className="!text-lg !font-medium !text-slate-800 !mb-3 !border-0 !bg-transparent !p-0 !rounded-none !focus:ring-0 placeholder:!text-slate-400"
                    />

                    <div className="mb-4 relative">
                      <Textarea
                        value={newTaskDescription}
                        onChange={e => setNewTaskDescription(e.target.value)}
                        placeholder="Add a description..."
                        className="h-24 !bg-slate-50/50 focus:!bg-white"
                      />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 flex-wrap">
                      <CustomDatePicker
                        value={newTaskDueDate}
                        onChange={setNewTaskDueDate}
                      />

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                          className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors min-w-[140px]"
                        >
                          {newTaskAssigneeId ? (
                            <>
                              <UserAvatar src={projectMembers.find(u => u.id === newTaskAssigneeId)?.avatar} alt="assignee" size="xs" />
                              <span className="text-sm text-slate-700 font-medium truncate max-w-[100px]">
                                {projectMembers.find(u => u.id === newTaskAssigneeId)?.name.split(' ')[0]}
                              </span>
                            </>
                          ) : (
                            <>
                              <UserIcon size={16} />
                              <span className="text-sm text-slate-600 font-medium">Unassigned</span>
                            </>
                          )}
                        </button>

                        {isAssigneeDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setIsAssigneeDropdownOpen(false)}
                            ></div>
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl p-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setNewTaskAssigneeId('');
                                  setIsAssigneeDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                              >
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                  <UserIcon size={14} className="text-slate-400" />
                                </div>
                                <span className="text-sm text-slate-600">Unassigned</span>
                                {newTaskAssigneeId === '' && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                              </button>

                              <div className="h-[1px] bg-slate-100 my-1"></div>

                              {projectMembers.map(u => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    setNewTaskAssigneeId(u.id);
                                    setIsAssigneeDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                                >
                                  <UserAvatar src={u.avatar} alt={u.name} size="sm" className="border border-slate-200" />
                                  <span className="text-sm text-slate-700 font-medium truncate">{u.name}</span>
                                  {newTaskAssigneeId === u.id && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {project.milestones.length >= 0 && (
                        <div className="relative">
                          {isCreatingMilestone ? (
                            <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-indigo-500 ring-2 ring-indigo-100 min-w-[140px] animate-in fade-in zoom-in-95">
                              <Target size={16} className="text-indigo-500 shrink-0" />
                              <Input
                                autoFocus
                                value={newInlineMilestoneTitle}
                                onChange={(e) => setNewInlineMilestoneTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleInlineMilestoneCreate();
                                  } else if (e.key === 'Escape') {
                                    setIsCreatingMilestone(false);
                                    setNewInlineMilestoneTitle('');
                                  }
                                }}
                                placeholder="New Milestone"
                                className="!bg-transparent !text-sm !text-slate-800 !min-w-[80px] !p-0 !border-0 !rounded-none !focus:ring-0 placeholder:!text-slate-400"
                              />
                              <button
                                type="button"
                                onClick={handleInlineMilestoneCreate}
                                className="p-0.5 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => { setIsCreatingMilestone(false); setNewInlineMilestoneTitle(''); }}
                                className="p-0.5 hover:bg-slate-100 rounded text-slate-400 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setIsMilestoneDropdownOpen(!isMilestoneDropdownOpen)}
                                className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors min-w-[140px]"
                              >
                                <Target size={16} />
                                <span className="text-sm text-slate-600 font-medium truncate max-w-[100px]">
                                  {newTaskMilestoneId
                                    ? project.milestones.find(m => m.id === newTaskMilestoneId)?.title
                                    : 'No Milestone'}
                                </span>
                              </button>

                              {isMilestoneDropdownOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsMilestoneDropdownOpen(false)}
                                  ></div>
                                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl p-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewTaskMilestoneId('');
                                        setIsMilestoneDropdownOpen(false);
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                        <Target size={14} className="text-slate-400" />
                                      </div>
                                      <span className="text-sm text-slate-600">No Milestone</span>
                                      {newTaskMilestoneId === '' && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                                    </button>

                                    <div className="h-[1px] bg-slate-100 my-1"></div>

                                    {project.milestones.map(m => (
                                      <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                          setNewTaskMilestoneId(m.id);
                                          setIsMilestoneDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                                      >
                                        <div className="w-6 h-6 flex items-center justify-center text-slate-400">
                                          <Target size={14} />
                                        </div>
                                        <span className="text-sm text-slate-700 font-medium truncate">{m.title}</span>
                                        {newTaskMilestoneId === m.id && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                                      </button>
                                    ))}

                                    <div className="h-[1px] bg-slate-100 my-1"></div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsCreatingMilestone(true);
                                        setIsMilestoneDropdownOpen(false);
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-left text-indigo-600"
                                    >
                                      <div className="w-6 h-6 flex items-center justify-center">
                                        <Plus size={14} />
                                      </div>
                                      <span className="text-sm font-medium">Create New...</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      <div className="h-6 w-[1px] bg-slate-200 hidden md:block"></div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                          className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors min-w-[120px]"
                        >
                          <Flag size={16} />
                          <span className="text-sm text-slate-600 font-medium">{newTaskPriority}</span>
                        </button>

                        {isPriorityDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setIsPriorityDropdownOpen(false)}
                            ></div>
                            <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl border border-slate-200 shadow-xl p-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                              {[Priority.HIGH, Priority.MEDIUM, Priority.LOW].map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => {
                                    setNewTaskPriority(p);
                                    setIsPriorityDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                                >
                                  <div className={`w-2 h-2 rounded-full ${p === Priority.HIGH ? 'bg-red-500' :
                                    p === Priority.MEDIUM ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}></div>
                                  <span className="text-sm text-slate-700 font-medium">{p}</span>
                                  {newTaskPriority === p && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm hover:shadow shadow-indigo-200 transition-all"
                      >
                        Add Task
                      </button>
                    </div>
                  </form>
                )
              ) : (
                // Viewer View for Add Area
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center text-center bg-slate-50/50">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2 text-slate-400">
                    <Lock size={20} />
                  </div>
                  <p className="text-slate-600 font-medium">View Only Mode</p>
                  <p className="text-slate-400 text-sm">You don't have permission to create tasks in this project.</p>
                </div>
              )}
            </div>

            {/* Add Milestone Form */}
            {isAddingMilestone && (
              <form onSubmit={handleAddMilestone} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-200 mb-6 fade-in relative z-30">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">New Milestone</h3>
                <div className="flex gap-3 flex-col md:flex-row md:items-center">
                  <Input
                    autoFocus
                    value={newMilestoneTitle}
                    onChange={e => setNewMilestoneTitle(e.target.value)}
                    placeholder="Milestone Title (e.g. Phase 1)"
                    containerClassName="md:flex-1 md:w-auto"
                  />
                  <div className="flex items-center gap-2 flex-shrink-0 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                    <CustomDatePicker value={newMilestoneDate} onChange={setNewMilestoneDate} />
                    <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>
                    <button type="button" onClick={() => setIsAddingMilestone(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg whitespace-nowrap font-medium transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap font-medium shadow-sm hover:shadow transition-all">Save</button>
                  </div>
                </div>
              </form>
            )}

            {/* Milestones Groups */}
            {project.milestones.map(milestone => {
              const tasks = tasksByMilestone[milestone.id] || [];
              const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
              const progress = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
              const isDropTarget = dragOverMilestoneId === milestone.id;

              return (
                <div
                  key={milestone.id}
                  className={`space-y-3 transition-all rounded-xl p-2 -m-2 ${isDropTarget ? 'bg-indigo-50/50 ring-2 ring-indigo-100' : ''}`}
                  onDragOver={(e) => canEdit && handleContainerDragOver(e, milestone.id)}
                  onDrop={(e) => canEdit && handleContainerDrop(e, milestone.id)}
                >
                  <div className="flex items-center gap-3 text-slate-800">
                    <h2 className="text-lg font-bold">{milestone.title}</h2>
                    {milestone.dueDate && (
                      <span className="text-xs text-slate-500 bg-slate-200/50 px-2 py-1 rounded-md flex items-center gap-1">
                        <Calendar size={12} /> {milestone.dueDate}
                      </span>
                    )}
                    <div className="flex-1 h-[1px] bg-slate-200 mx-2"></div>
                    <span className="text-xs font-medium text-slate-500">{Math.round(progress)}%</span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>

                  {tasks.length > 0 ? (
                    tasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        projectId={project.id}
                        users={users}
                        members={projectMembers}
                        canEdit={canEdit}
                        onUpdate={onUpdateTask}
                        onRequestDelete={(t) => setTaskToDelete(t)}
                        onOpenComments={handleOpenSidebar}
                        onDragStart={handleDragStart}
                        onDragOver={handleTaskDragOver}
                        onDrop={(e, targetTaskId) => handleTaskDrop(e, milestone.id, targetTaskId)}
                        isDragging={draggingTaskId === task.id}
                        isDragOver={dragOverTaskId === task.id}
                      />
                    ))
                  ) : (
                    <EmptyState
                      className={`transition-all ${draggingTaskId ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-slate-100'}`}
                      icon={draggingTaskId ? Target : Ghost}
                      title={draggingTaskId ? "Drop task here" : "No tasks yet"}
                      description={draggingTaskId ? "" : "This milestone has no tasks. Add one or drag an existing task here."}
                    />
                  )}
                </div>
              );
            })}

            {/* Uncategorized Tasks */}
            {uncategorizedTasks.length > 0 && (
              <div
                className={`space-y-3 pt-4 transition-all rounded-xl p-2 -m-2 ${dragOverMilestoneId === 'uncategorized' ? 'bg-slate-100/50 ring-2 ring-slate-200' : ''}`}
                onDragOver={(e) => canEdit && handleContainerDragOver(e, undefined)}
                onDrop={(e) => canEdit && handleContainerDrop(e, undefined)}
              >
                <div className="flex items-center gap-3 text-slate-800">
                  <h2 className="text-lg font-bold text-slate-600">Uncategorized</h2>
                  <div className="flex-1 h-[1px] bg-slate-200 mx-2"></div>
                </div>
                {uncategorizedTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    projectId={project.id}
                    users={users}
                    members={projectMembers}
                    canEdit={canEdit}
                    onUpdate={onUpdateTask}
                    onRequestDelete={(t) => setTaskToDelete(t)}
                    onOpenComments={handleOpenSidebar}
                    onDragStart={handleDragStart}
                    onDragOver={handleTaskDragOver}
                    onDrop={(e, targetTaskId) => handleTaskDrop(e, undefined, targetTaskId)}
                    isDragging={draggingTaskId === task.id}
                    isDragOver={dragOverTaskId === task.id}
                  />
                ))}
              </div>
            )}

            {/* Empty State Drop Zone for Uncategorized if no tasks exist there and we want to allow dropping */}
            {uncategorizedTasks.length === 0 && (
              <div
                className={`pt-4 mt-4 border-t border-dashed border-slate-200 transition-all rounded-xl p-4 text-center text-sm ${dragOverMilestoneId === 'uncategorized' ? 'bg-indigo-50 ring-2 ring-indigo-200 text-indigo-600 border-indigo-300' :
                  draggingTaskId ? 'bg-slate-50 text-slate-500' : 'text-slate-400'
                  }`}
                onDragOver={(e) => canEdit && handleContainerDragOver(e, undefined)}
                onDrop={(e) => canEdit && handleContainerDrop(e, undefined)}
              >
                {draggingTaskId ? 'Drop uncategorized tasks here' : 'Uncategorized tasks will appear here'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Sidebar (Comments & Details) */}
      {activeTask && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 transition-opacity duration-300 ${isSidebarVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseSidebar}
          ></div>

          <FileDropzone
            onFilesSelected={handleFilesDropped}
            className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ease-in-out z-40 flex flex-col ${isSidebarVisible ? 'translate-x-0' : 'translate-x-full'}`}
            activeClassName=""
            overlayClassName="bg-blue-50/95 border-2 border-blue-500 border-dashed text-blue-600 z-50 rounded-none"
            message="Drop file(s) to attach to task"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className={activeTask.status === TaskStatus.COMPLETED ? "text-indigo-600" : "text-slate-300"} />
                <span className="text-xs font-mono text-slate-400">TASK-{activeTask.id.slice(-4)}</span>
              </div>
              <button onClick={handleCloseSidebar} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <Input
                  disabled={!canEdit}
                  value={activeTask.title}
                  onChange={(e) => onUpdateTask(project.id, activeTask.id, { title: e.target.value })}
                  className={`!text-xl !font-bold !text-slate-800 !bg-transparent !border-0 !border-b !border-transparent !p-0 !rounded-none !focus:ring-0 ${canEdit ? 'hover:!border-slate-200 focus:!border-indigo-500' : 'cursor-not-allowed'}`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <Textarea
                  disabled={!canEdit}
                  value={activeTask.description || ''}
                  onChange={(e) => onUpdateTask(project.id, activeTask.id, { description: e.target.value })}
                  placeholder={canEdit ? "Add a description..." : "No description."}
                  className={`mt-2 h-24 !bg-slate-50 ${!canEdit && 'cursor-not-allowed'}`}
                />
              </div>

              <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                {/* Assignee */}
                <div className="flex items-center justify-between relative">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><UserIcon size={16} /> Assignee</span>

                  <button
                    onClick={() => canEdit && setIsSidebarAssigneeOpen(!isSidebarAssigneeOpen)}
                    disabled={!canEdit}
                    className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors border border-transparent ${canEdit ? 'hover:bg-slate-100 hover:border-slate-200 cursor-pointer' : 'cursor-not-allowed opacity-70'
                      }`}
                  >
                    {activeTask.assigneeId ? (
                      <>
                        <UserAvatar src={users.find(u => u.id === activeTask.assigneeId)?.avatar} alt="assignee" size="xs" />
                        <span className="text-sm text-slate-700 font-medium truncate max-w-[120px]">{users.find(u => u.id === activeTask.assigneeId)?.name}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center"><UserIcon size={12} /></div>
                        <span className="text-sm text-slate-400">Unassigned</span>
                      </>
                    )}
                  </button>

                  {isSidebarAssigneeOpen && canEdit && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSidebarAssigneeOpen(false)}></div>
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl p-1 z-50 max-h-64 overflow-y-auto">
                        <button
                          onClick={() => {
                            onUpdateTask(project.id, activeTask.id, { assigneeId: undefined });
                            setIsSidebarAssigneeOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <UserIcon size={14} className="text-slate-400" />
                          </div>
                          <span className="text-sm text-slate-600">Unassigned</span>
                          {!activeTask.assigneeId && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                        </button>
                        <div className="h-[1px] bg-slate-100 my-1"></div>
                        {projectMembers.map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              onUpdateTask(project.id, activeTask.id, { assigneeId: u.id });
                              setIsSidebarAssigneeOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                          >
                            <UserAvatar src={u.avatar} alt={u.name} size="sm" className="border border-slate-200" />
                            <span className="text-sm text-slate-700 font-medium truncate">{u.name}</span>
                            {activeTask.assigneeId === u.id && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Milestone Selector */}
                <div className="flex items-center justify-between relative">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Target size={16} /> Milestone</span>

                  <div className="relative">
                    {isSidebarCreatingMilestone ? (
                      <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-indigo-500 ring-2 ring-indigo-100 min-w-[150px] animate-in fade-in zoom-in-95 right-0 absolute top-0 -mt-1">
                        <Target size={14} className="text-indigo-500 shrink-0" />
                        <Input
                          autoFocus
                          value={sidebarNewMilestoneTitle}
                          onChange={(e) => setSidebarNewMilestoneTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSidebarInlineMilestoneCreate();
                            } else if (e.key === 'Escape') {
                              setIsSidebarCreatingMilestone(false);
                              setSidebarNewMilestoneTitle('');
                            }
                          }}
                          placeholder="New Milestone"
                          className="!bg-transparent !text-sm !text-slate-800 !min-w-[80px] !p-0 !border-0 !rounded-none !focus:ring-0 placeholder:!text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={handleSidebarInlineMilestoneCreate}
                          className="p-0.5 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsSidebarCreatingMilestone(false); setSidebarNewMilestoneTitle(''); }}
                          className="p-0.5 hover:bg-slate-100 rounded text-slate-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => canEdit && setIsSidebarMilestoneOpen(!isSidebarMilestoneOpen)}
                          disabled={!canEdit}
                          className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors border border-transparent ${canEdit ? 'hover:bg-slate-100 hover:border-slate-200 cursor-pointer' : 'cursor-not-allowed opacity-70'
                            }`}
                        >
                          {activeTask.milestoneId ? (
                            <span className="text-sm text-slate-700 font-medium truncate max-w-[120px]">
                              {project.milestones.find(m => m.id === activeTask.milestoneId)?.title}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">No Milestone</span>
                          )}
                        </button>

                        {isSidebarMilestoneOpen && canEdit && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsSidebarMilestoneOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl p-1 z-50 max-h-64 overflow-y-auto">
                              <button
                                onClick={() => {
                                  onUpdateTask(project.id, activeTask.id, { milestoneId: undefined });
                                  setIsSidebarMilestoneOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                              >
                                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                  <Target size={14} className="text-slate-400" />
                                </div>
                                <span className="text-sm text-slate-600">No Milestone</span>
                                {!activeTask.milestoneId && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                              </button>

                              <div className="h-[1px] bg-slate-100 my-1"></div>

                              {project.milestones.map(m => (
                                <button
                                  key={m.id}
                                  onClick={() => {
                                    onUpdateTask(project.id, activeTask.id, { milestoneId: m.id });
                                    setIsSidebarMilestoneOpen(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                                >
                                  <div className="w-6 h-6 flex items-center justify-center text-slate-400">
                                    <Target size={14} />
                                  </div>
                                  <span className="text-sm text-slate-700 font-medium truncate">{m.title}</span>
                                  {activeTask.milestoneId === m.id && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                                </button>
                              ))}

                              <div className="h-[1px] bg-slate-100 my-1"></div>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSidebarCreatingMilestone(true);
                                  setIsSidebarMilestoneOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-left text-indigo-600"
                              >
                                <div className="w-6 h-6 flex items-center justify-center">
                                  <Plus size={14} />
                                </div>
                                <span className="text-sm font-medium">Create New...</span>
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Priority Selector */}
                <div className="flex items-center justify-between relative">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Flag size={16} /> Priority</span>

                  <div className="relative">
                    <button
                      onClick={() => canEdit && setIsSidebarPriorityOpen(!isSidebarPriorityOpen)}
                      disabled={!canEdit}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${getPriorityColor(activeTask.priority)} ${canEdit ? 'hover:brightness-95 cursor-pointer' : 'cursor-not-allowed opacity-80'
                        }`}
                    >
                      {activeTask.priority}
                    </button>

                    {isSidebarPriorityOpen && canEdit && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSidebarPriorityOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl border border-slate-200 shadow-xl p-1 z-50">
                          {[Priority.HIGH, Priority.MEDIUM, Priority.LOW].map((p) => (
                            <button
                              key={p}
                              onClick={() => {
                                onUpdateTask(project.id, activeTask.id, { priority: p });
                                setIsSidebarPriorityOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                            >
                              <div className={`w-2 h-2 rounded-full ${p === Priority.HIGH ? 'bg-red-500' :
                                p === Priority.MEDIUM ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}></div>
                              <span className="text-sm text-slate-700 font-medium">{p}</span>
                              {activeTask.priority === p && <CheckCircle size={14} className="ml-auto text-indigo-600" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat / Comments Section */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare size={16} className="text-slate-400" /> Activity
                </h3>

                <div className="space-y-6 mb-6">
                  {activeTask.comments.length === 0 ? (
                    <p className="text-slate-400 text-sm italic text-center py-4">No comments yet.</p>
                  ) : (
                    activeTask.comments.map(comment => {
                      const commentUser = users.find(u => u.id === comment.userId);
                      return (
                        <div key={comment.id} className="flex gap-3 group">
                          <UserAvatar src={commentUser?.avatar} alt={commentUser?.name || 'User'} size="sm" className="mt-1" />
                          <div className="flex-1">
                            <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 group-hover:border-slate-200 transition-colors">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="font-semibold text-xs text-slate-700">{commentUser?.name}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 whitespace-pre-wrap">{comment.content}</p>

                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {comment.attachments.map((att) => (
                                    <div key={att.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                                      {att.type.startsWith('image/') ? <ImageIcon size={14} className="text-indigo-500" /> : <FileIcon size={14} className="text-slate-400" />}
                                      <span className="truncate max-w-[150px]">{att.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Footer - Comment Input */}
            <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10">

              {/* Attachments Preview */}
              {(selectedFiles.length > 0 || rejectedFiles.length > 0) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs border border-indigo-100">
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <button onClick={() => removeFile(i)} className="hover:text-indigo-900"><X size={12} /></button>
                    </div>
                  ))}
                  {rejectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-red-50 text-red-700 px-2 py-1 rounded-lg text-xs border border-red-100" title="File too large (>10MB)">
                      <AlertCircle size={12} />
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <button onClick={() => removeRejectedFile(i)} className="hover:text-red-900"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendComment} className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[44px] max-h-32 py-2.5 pr-10 !text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment(e);
                      }
                    }}
                  />
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-2 bottom-2.5 text-slate-400 hover:text-indigo-600 p-1 rounded transition-colors"
                    title="Attach files"
                  >
                    <Paperclip size={16} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!commentInput.trim() && selectedFiles.length === 0}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </FileDropzone>
        </>
      )}
    </div>
  );
};