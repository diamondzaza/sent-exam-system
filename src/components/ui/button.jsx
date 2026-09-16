import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground shadow-xs hover:bg-indigo-700',
            destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-rose-700',
            outline: 'border border-input bg-card shadow-xs hover:bg-secondary hover:text-secondary-foreground',
            secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-slate-200',
            ghost: 'hover:bg-secondary hover:text-secondary-foreground',
            link: 'text-primary underline-offset-4 hover:underline',
        },
        size: {
            default: 'px-4 py-2',
            sm: 'px-3 py-1.5',
            lg: 'px-5 py-2.5 text-sm',
            icon: 'size-9',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}/>;
});
Button.displayName = 'Button';
export { Button, buttonVariants };
