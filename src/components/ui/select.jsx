import * as React from 'react';
import { cn } from '@/lib/utils';
/**
 * Styled native <select> — keeps the app's existing form semantics
 * (value/onChange) while matching the shadcn Input styling.
 */
const Select = React.forwardRef(({ className, ...props }, ref) => {
    return (<select ref={ref} className={cn('flex w-full appearance-none rounded-lg border border-input bg-card bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat px-3 py-2 pr-8 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}/>);
});
Select.displayName = 'Select';
export { Select };
