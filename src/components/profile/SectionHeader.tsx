import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  className?: string;
}

const SectionHeader = ({ title, className }: SectionHeaderProps) => {
  return (
    <div className={cn("px-4 py-3 border-b", className)}>
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );
};

export default SectionHeader;
