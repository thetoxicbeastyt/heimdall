# Design System - Frosted Glass Components

## Core Design Principles

### Frosted Glass Aesthetic
The entire application follows a frosted glass design language with the following characteristics:
- **Transparency**: Semi-transparent backgrounds with blur effects
- **Depth**: Layered elements with subtle shadows and glows
- **Consistency**: Unified visual language across all components
- **Accessibility**: Maintains contrast ratios and readability

## Base Glass Effect
```css
backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20
```

## Color Palette

### Glass Backgrounds
- Light mode: `bg-white/10`
- Dark mode: `bg-gray-900/10`
- Hover state: `bg-white/20` or `bg-gray-900/20`
- Active state: `bg-white/30` or `bg-gray-900/30`

### Borders & Overlays
- Default border: `border-white/20`
- Hover border: `border-white/40`
- Focus border: `border-white/60`
- Dividers: `border-white/10`

### Text Colors
- Primary text: `text-white/90`
- Secondary text: `text-white/70`
- Muted text: `text-white/50`
- Error text: `text-red-400`
- Success text: `text-green-400`

## Component Library

### 1. Glass Card
```tsx
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, className = "", hover = true, glow = false }: GlassCardProps) {
  return (
    <div className={`
      backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 
      border border-white/20 rounded-lg p-6
      ${hover ? 'hover:border-white/40 hover:scale-[1.02]' : ''}
      ${glow ? 'shadow-lg shadow-white/10' : ''}
      transition-all duration-300
      ${className}
    `}>
      {children}
    </div>
  );
}
```

### 2. Glass Button
```tsx
interface GlassButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

export function GlassButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false 
}: GlassButtonProps) {
  const baseClasses = `
    backdrop-blur-xl border rounded-lg font-medium
    transition-all duration-300 disabled:opacity-50
    focus:outline-none focus:ring-2 focus:ring-white/50
  `;
  
  const variants = {
    primary: 'bg-white/20 border-white/40 hover:bg-white/30 text-white',
    secondary: 'bg-white/10 border-white/20 hover:bg-white/20 text-white/90',
    ghost: 'bg-transparent border-transparent hover:bg-white/10 text-white/70'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### 3. Glass Input
```tsx
interface GlassInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'search';
  icon?: React.ReactNode;
}

export function GlassInput({ 
  placeholder, 
  value, 
  onChange, 
  type = 'text', 
  icon 
}: GlassInputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`
          w-full backdrop-blur-xl bg-white/10 dark:bg-gray-900/10
          border border-white/20 rounded-lg px-4 py-3
          ${icon ? 'pl-10' : ''}
          text-white placeholder-white/50
          focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20
          transition-all duration-300
        `}
      />
    </div>
  );
}
```

### 4. Glass Modal
```tsx
interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function GlassModal({ isOpen, onClose, title, children, size = 'md' }: GlassModalProps) {
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/50" 
        onClick={onClose}
      />
      <div className={`
        relative w-full ${sizes[size]}
        backdrop-blur-xl bg-white/10 dark:bg-gray-900/10
        border border-white/20 rounded-xl p-6
        shadow-2xl shadow-black/25
      `}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
```

### 5. Glass Navigation
```tsx
export function GlassNavbar() {
  return (
    <nav className="
      sticky top-0 z-40 h-16
      backdrop-blur-xl bg-white/10 dark:bg-gray-900/10
      border-b border-white/20
    ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Navigation content */}
        </div>
      </div>
    </nav>
  );
}
```

### 6. Glass Badge
```tsx
interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

export function GlassBadge({ children, variant = 'default', size = 'sm' }: GlassBadgeProps) {
  const variants = {
    default: 'bg-white/20 text-white',
    success: 'bg-green-500/20 text-green-300 border-green-400/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    error: 'bg-red-500/20 text-red-300 border-red-400/30'
  };
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };
  
  return (
    <span className={`
      inline-flex items-center rounded-full
      backdrop-blur-xl border border-white/20
      font-medium
      ${variants[variant]}
      ${sizes[size]}
    `}>
      {children}
    </span>
  );
}
```

### 7. Glass Loading Skeleton
```tsx
export function GlassSkeleton({ className }: { className?: string }) {
  return (
    <div className={`
      animate-pulse backdrop-blur-xl bg-white/5 dark:bg-gray-900/5
      rounded-lg ${className}
    `} />
  );
}

export function GlassCardSkeleton() {
  return (
    <div className="backdrop-blur-xl bg-white/5 dark:bg-gray-900/5 border border-white/10 rounded-lg p-6">
      <GlassSkeleton className="h-4 w-3/4 mb-2" />
      <GlassSkeleton className="h-3 w-1/2 mb-4" />
      <GlassSkeleton className="h-20 w-full" />
    </div>
  );
}
```

## Layout Patterns

### Container Layouts
```css
/* Full width with padding */
.container-full {
  @apply w-full px-4 sm:px-6 lg:px-8;
}

/* Centered with max width */
.container-centered {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* Grid layouts */
.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}
```

### Spacing Scale
- xs: 4px (space-1)
- sm: 8px (space-2)
- md: 16px (space-4)
- lg: 24px (space-6)
- xl: 32px (space-8)
- 2xl: 48px (space-12)

### Animation Patterns
```css
/* Standard transitions */
.glass-transition {
  @apply transition-all duration-300 ease-in-out;
}

/* Hover scale */
.glass-hover {
  @apply hover:scale-[1.02] transform-gpu;
}

/* Focus states */
.glass-focus {
  @apply focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-0;
}
```

## Usage Guidelines

1. **Consistency**: Always use the base glass effect classes
2. **Contrast**: Ensure text remains readable on glass backgrounds
3. **Performance**: Use `transform-gpu` for smooth animations
4. **Accessibility**: Maintain focus states and keyboard navigation
5. **Responsive**: Test all components on mobile devices
6. **Dark Mode**: Design works in both light and dark themes