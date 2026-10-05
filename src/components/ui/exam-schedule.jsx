import { cn } from '@/lib/utils';
import { formatThaiDate } from '@/lib/formatDate';

// Keep each date and time range intact; allow a line break between them.
export function ExamSchedule({ date, time, className }) {
    return (<span className={cn('inline-flex flex-wrap items-baseline gap-x-1 max-w-full', className)}>
      <span className="whitespace-nowrap">{formatThaiDate(date)}</span>
      {time && <span className="whitespace-nowrap">({time})</span>}
    </span>);
}
