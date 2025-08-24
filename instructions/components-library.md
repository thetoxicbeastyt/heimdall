# Components Library - Reusable Patterns

## Base Component Imports
```typescript
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
```

## Layout Components

### 1. Page Container
```tsx
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn(
      "min-h-screen relative",
      className
    )}>
      <GradientBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
```

### 2. Section Header
```tsx
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        {description && (
          <p className="text-white/70 text-lg">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

### 3. Grid Layout
```tsx
interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 4 | 6 | 8;
  className?: string;
}

export function Grid({ children, cols = 3, gap = 6, className }: GridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  };
  
  const gapClass = `gap-${gap}`;
  
  return (
    <div className={cn(
      "grid",
      gridCols[cols],
      gapClass,
      className
    )}>
      {children}
    </div>
  );
}
```

## Form Components

### 4. Form Field
```tsx
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ 
  label, 
  error, 
  required, 
  children, 
  className 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-white/90">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}
```

### 5. Search Input with Debounce
```tsx
interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  delay?: number;
  className?: string;
}

export function SearchInput({ 
  placeholder = "Search...", 
  onSearch, 
  delay = 300,
  className 
}: SearchInputProps) {
  const [value, setValue] = useState('');
  const debouncedSearch = useDebounce(onSearch, delay);
  
  useEffect(() => {
    if (value.trim()) {
      debouncedSearch(value);
    }
  }, [value, debouncedSearch]);
  
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 h-5 w-5" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="
          w-full pl-10 pr-4 py-3
          backdrop-blur-xl bg-white/10 dark:bg-gray-900/10
          border border-white/20 rounded-lg
          text-white placeholder-white/50
          focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20
          transition-all duration-300
        "
      />
    </div>
  );
}
```

## Card Components

### 6. ModuleCard
```tsx
'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ModuleCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  isActive: boolean
  comingSoon?: boolean
  className?: string
}

export function ModuleCard({
  title,
  description,
  icon,
  href,
  isActive,
  comingSoon = false,
  className
}: ModuleCardProps) {
  const CardWrapper = comingSoon ? 'div' : Link

  return (
    <CardWrapper
      href={comingSoon ? undefined : href}
      className={cn(
        'group relative block',
        className
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-lg p-6 h-48',
          'backdrop-blur-xl bg-white/10 dark:bg-gray-900/10',
          'border border-white/20',
          'transition-all duration-300',
          !comingSoon && 'hover:border-white/40 hover:scale-[1.02] cursor-pointer',
          comingSoon && 'cursor-not-allowed opacity-75',
          isActive && !comingSoon && 'shadow-lg shadow-white/10'
        )}
      >
        {/* Icon container */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'p-3 rounded-lg',
              'backdrop-blur-xl bg-white/20 dark:bg-gray-900/20',
              'border border-white/30',
              'transition-all duration-300',
              !comingSoon && 'group-hover:bg-white/30 group-hover:border-white/50'
            )}
          >
            <div className="text-white/90 text-xl">
              {icon}
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex flex-col gap-2">
            {comingSoon && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-xl bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                Coming Soon
              </span>
            )}
            {isActive && !comingSoon && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-xl bg-green-500/20 text-green-300 border border-green-400/30">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white group-hover:text-white transition-colors">
            {title}
          </h3>
          <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>

        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        {/* Active glow effect */}
        {isActive && !comingSoon && (
          <div className="absolute inset-0 rounded-lg ring-1 ring-white/20 pointer-events-none" />
        )}
      </div>
    </CardWrapper>
  )
}
```

#### ModuleCard Usage Examples

```tsx
import { PlayCircle, Download, Search, Settings, Users, BarChart3 } from 'lucide-react'
import { ModuleCard } from '@/components/ui/ModuleCard'

// Active module
<ModuleCard
  title="Media Manager"
  description="Search, stream, and download content from your debrid services with an intuitive interface."
  icon={<PlayCircle className="h-6 w-6" />}
  href="/media-manager"
  isActive={true}
/>

// Coming soon module
<ModuleCard
  title="Torrent Downloader"
  description="Direct torrent management and download queue with progress tracking and notifications."
  icon={<Download className="h-6 w-6" />}
  href="/downloader"
  isActive={false}
  comingSoon={true}
/>

// Inactive module
<ModuleCard
  title="Advanced Search"
  description="Enhanced search capabilities with filters, sorting, and cross-platform results."
  icon={<Search className="h-6 w-6" />}
  href="/advanced-search"
  isActive={false}
/>

// Grid of modules
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <ModuleCard
    title="Media Manager"
    description="Search and stream content from debrid services"
    icon={<PlayCircle className="h-6 w-6" />}
    href="/media-manager"
    isActive={true}
  />
  <ModuleCard
    title="Settings"
    description="Configure your debrid accounts and preferences"
    icon={<Settings className="h-6 w-6" />}
    href="/settings"
    isActive={false}
  />
  <ModuleCard
    title="User Management"
    description="Manage user accounts and permissions"
    icon={<Users className="h-6 w-6" />}
    href="/users"
    isActive={false}
    comingSoon={true}
  />
</div>
```

### 7. Media Card
```tsx
interface MediaCardProps {
  title: string;
  year?: number;
  poster?: string;
  quality?: string;
  size?: string;
  seeders?: number;
  onClick?: () => void;
  className?: string;
}

export function MediaCard({ 
  title, 
  year, 
  poster, 
  quality, 
  size, 
  seeders, 
  onClick,
  className 
}: MediaCardProps) {
  return (
    <div 
      className={cn(
        `backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 
         border border-white/20 rounded-lg overflow-hidden
         hover:border-white/40 hover:scale-[1.02]
         transition-all duration-300 cursor-pointer`,
        className
      )}
      onClick={onClick}
    >
      {poster && (
        <div className="aspect-[2/3] relative">
          <img 
            src={poster} 
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {quality && (
            <GlassBadge 
              className="absolute top-2 right-2" 
              variant="success"
            >
              {quality}
            </GlassBadge>
          )}
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate">{title}</h3>
        {year && (
          <p className="text-white/70 text-sm">{year}</p>
        )}
        {(size || seeders) && (
          <div className="flex justify-between items-center mt-2 text-xs text-white/50">
            {size && <span>{size}</span>}
            {seeders && (
              <span className="flex items-center gap-1">
                <Upload className="h-3 w-3" />
                {seeders}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 7. Stats Card
```tsx
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  className 
}: StatsCardProps) {
  return (
    <div className={cn(
      `backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 
       border border-white/20 rounded-lg p-6`,
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          {change && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm",
              change.type === 'increase' ? "text-green-400" : "text-red-400"
            )}>
              {change.type === 'increase' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(change.value)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="text-white/50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Navigation Components

### 8. Tab Navigation
```tsx
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TabNavigation({ 
  tabs, 
  activeTab, 
  onChange, 
  className 
}: TabNavigationProps) {
  return (
    <div className={cn(
      "backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-1",
      className
    )}>
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
              activeTab === tab.id
                ? "bg-white/20 text-white border border-white/30"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 9. Breadcrumb Navigation
```tsx
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-white/50" />
          )}
          {item.href ? (
            <Link 
              href={item.href}
              className="text-white/70 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-white font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
```

## Feedback Components

### 10. Toast Notification
```tsx
interface ToastProps {
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ 
  title, 
  description, 
  type, 
  onClose, 
  duration = 5000 
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);
  
  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />
  };
  
  const colors = {
    success: 'border-green-400/30 bg-green-500/20 text-green-300',
    error: 'border-red-400/30 bg-red-500/20 text-red-300',
    warning: 'border-yellow-400/30 bg-yellow-500/20 text-yellow-300',
    info: 'border-blue-400/30 bg-blue-500/20 text-blue-300'
  };
  
  return (
    <div className={cn(
      "backdrop-blur-xl border rounded-lg p-4 max-w-sm",
      colors[type]
    )}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1 min-w-0">
          <p className="font-medium">{title}</p>
          {description && (
            <p className="text-sm mt-1 opacity-90">{description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

## Data Display Components

### 11. Data Table
```tsx
interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  loading, 
  className 
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <GlassSkeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  return (
    <div className={cn(
      "backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg overflow-hidden",
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className="text-left px-6 py-4 text-sm font-medium text-white/90"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-white/5 transition-colors">
                {columns.map((column) => (
                  <td
                    key={column.key as string}
                    className="px-6 py-4 text-sm text-white/80"
                  >
                    {column.render 
                      ? column.render(item[column.key], item)
                      : String(item[column.key])
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 12. Empty State
```tsx
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  icon, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "text-center py-12 px-4",
      className
    )}>
      {icon && (
        <div className="text-white/30 mb-4 flex justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      {description && (
        <p className="text-white/70 mb-6">{description}</p>
      )}
      {action && (
        <GlassButton onClick={action.onClick}>
          {action.label}
        </GlassButton>
      )}
    </div>
  );
}
```

## Usage Examples

### Complete Search Page
```tsx
export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query, activeTab],
    queryFn: () => searchMedia({ query, type: activeTab }),
    enabled: !!query
  });
  
  const tabs = [
    { id: 'all', label: 'All', icon: <Grid3X3 className="h-4 w-4" /> },
    { id: 'movies', label: 'Movies', icon: <Film className="h-4 w-4" /> },
    { id: 'tv', label: 'TV Shows', icon: <Monitor className="h-4 w-4" /> }
  ];
  
  return (
    <PageContainer>
      <SectionHeader 
        title="Media Search"
        description="Search and stream content from debrid services"
      />
      
      <div className="space-y-6">
        <SearchInput 
          placeholder="Search for movies, TV shows..."
          onSearch={setQuery}
        />
        
        <TabNavigation 
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        
        {isLoading ? (
          <Grid cols={3}>
            {Array.from({ length: 6 }).map((_, i) => (
              <GlassCardSkeleton key={i} />
            ))}
          </Grid>
        ) : data?.length > 0 ? (
          <Grid cols={3}>
            {data.map((item) => (
              <MediaCard key={item.id} {...item} />
            ))}
          </Grid>
        ) : query ? (
          <EmptyState
            title="No results found"
            description={`No content found for "${query}"`}
            icon={<Search className="h-12 w-12" />}
          />
        ) : null}
      </div>
    </PageContainer>
  );
}
```