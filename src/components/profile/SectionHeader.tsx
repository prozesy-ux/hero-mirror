import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  className?: string;
}

const SectionHeader = ({ title, className }: SectionHeaderProps) => {
  return (
    <div className={cn("px-4 py-3 bg-gray-50", className)}>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );
};

export default SectionHeader;
