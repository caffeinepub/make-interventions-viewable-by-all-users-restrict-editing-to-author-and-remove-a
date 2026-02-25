import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AppBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'pending';
  className?: string;
}

export default function AppBadge({ children, variant = 'default', className }: AppBadgeProps) {
  const variantStyles = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  if (variant === 'success' || variant === 'warning' || variant === 'pending') {
    return (
      <Badge className={cn(variantStyles[variant], className)}>
        {children}
      </Badge>
    );
  }

  return (
    <Badge variant={variant} className={className}>
      {children}
    </Badge>
  );
}
