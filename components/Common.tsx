import React, { useState, useEffect, useRef, ReactNode, useContext, createContext } from 'react';
import { X, Upload, AlertTriangle, Check, AlertCircle, File as FileIcon, ChevronDown, Loader2, Info } from 'lucide-react';

// --- Toast System ---
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-in slide-in-from-right-full fade-in duration-300 flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-600' :
              toast.type === 'error' ? 'bg-red-600' :
              'bg-slate-800'
            }`}
          >
            {toast.type === 'success' && <Check size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            {toast.type === 'info' && <Info size={16} />}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// --- Skeleton Component ---
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

// --- Empty State Component ---
export const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}> = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl animate-in fade-in duration-500 ${className}`}>
    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
      <Icon size={32} className="text-slate-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
    <p className="text-slate-500 max-w-sm mb-6 text-sm">{description}</p>
    {action}
  </div>
);

// --- Avatar Component ---
interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  title?: string; // passed through for Tooltip wrapping
}

export const UserAvatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', className = '', title }) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-12 h-12 text-base',
    xxl: 'w-14 h-14 text-lg'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 select-none ${className}`}
      title={title}
    >
      {!hasError && src ? (
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover" 
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="font-bold text-slate-500">{getInitials(alt)}</span>
      )}
    </div>
  );
};

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  isLoading, 
  className = '', 
  disabled,
  type = 'button',
  ...props 
}, ref) => {
  const baseStyles = "font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500/20";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 border border-transparent",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    danger: "bg-white text-red-600 border border-slate-200 hover:bg-red-50 hover:border-red-200",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-700 bg-transparent",
    outline: "border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50",
    icon: "text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg" // specific for close buttons etc
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  // Icon variant overrides padding usually, but allow size override
  const appliedSize = variant === 'icon' ? '' : sizes[size];

  return (
    <button 
      ref={ref}
      type={type}
      className={`${baseStyles} ${variants[variant]} ${appliedSize} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" size={16} /> : icon}
      {children}
    </button>
  );
});
Button.displayName = 'Button';

// --- Input Component ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', containerClassName = '', ...props }, ref) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-3 py-2 rounded-lg border outline-none transition-all ${
          error 
            ? 'border-red-300 focus:border-red-500 bg-red-50' 
            : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 bg-white'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});
Input.displayName = 'Input';

// --- Textarea Component ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className = '', containerClassName = '', ...props }, ref) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <textarea
        ref={ref}
        className={`w-full p-3 rounded-lg border outline-none transition-all resize-none ${
          error 
            ? 'border-red-300 focus:border-red-500 bg-red-50' 
            : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 bg-white'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});
Textarea.displayName = 'Textarea';

// --- Tooltip Component ---
interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', delay = 300 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<any>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
  };

  return (
    <div className="relative flex items-center" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 ${
          position === 'top' ? '-top-8 left-1/2 -translate-x-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'
        }`}>
          {content}
          <div className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
            position === 'top' ? 'top-full border-t-slate-800' : 'bottom-full border-b-slate-800'
          }`}></div>
        </div>
      )}
    </div>
  );
};

// --- Confirm Modal Component ---
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, 
  confirmText = "Confirm", cancelText = "Cancel", isDestructive = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500">{message}</p>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-center">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium text-white shadow-md transition-all ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- File Dropzone Component ---
interface FileDropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onFilesSelected: (files: File[]) => void;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  overlayClassName?: string;
  message?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ 
  onFilesSelected, 
  children, 
  className = '', 
  activeClassName = '', 
  overlayClassName = '',
  message = 'Drop to attach',
  ...props
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Essential to allow dropping
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative transition-all ${className} ${isDragOver ? activeClassName : ''}`}
      {...props}
    >
      {children}
      {isDragOver && (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none animate-in fade-in ${overlayClassName || 'bg-indigo-50/90 border-2 border-dashed border-indigo-500'}`}>
          <div className="text-center p-4">
            <Upload size={32} className="mx-auto mb-3 opacity-75" />
            <p className="font-bold text-lg opacity-90">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- User Select Component ---
interface UserOption {
  id: string;
  name: string;
  avatar: string;
}

interface UserSelectProps {
  users: UserOption[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  className?: string;
}

export const UserSelect: React.FC<UserSelectProps> = ({ users, value, onChange, placeholder = "Select user...", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const selectedUser = users.find(u => u.id === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm hover:border-slate-300 focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 transition-all h-9"
      >
        {selectedUser ? (
          <div className="flex items-center gap-2">
            <UserAvatar src={selectedUser.avatar} alt={selectedUser.name} size="sm" />
            <span className="text-slate-700 font-medium">{selectedUser.name}</span>
          </div>
        ) : (
          <span className="text-slate-400 pl-1">{placeholder}</span>
        )}
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
          {users.length === 0 ? (
             <div className="p-3 text-xs text-slate-400 text-center">No users available</div>
          ) : (
             users.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    onChange(user.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 hover:bg-slate-50 transition-colors text-left group border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar src={user.avatar} alt={user.name} size="sm" />
                    <span className="text-sm text-slate-700">{user.name}</span>
                  </div>
                  {value === user.id && <Check size={14} className="text-indigo-600" />}
                </button>
             ))
          )}
        </div>
      )}
    </div>
  );
};