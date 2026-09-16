import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const badgeVariants = cva('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors', {
    variants: {
        variant: {
            default: 'border-transparent bg-primary text-primary-foreground',
            secondary: 'border-transparent bg-secondary text-secondary-foreground',
            destructive: 'border-transparent bg-destructive text-destructive-foreground',
            outline: 'text-foreground',
            success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
            info: 'border-indigo-200 bg-indigo-50 text-indigo-800',
            warning: 'border-amber-200 bg-amber-50 text-amber-800',
            purple: 'border-purple-200 bg-purple-50 text-purple-800',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});
function Badge({ className, variant, ...props }) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props}/>;
}
export { Badge, badgeVariants };
