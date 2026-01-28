import { ChevronDown, Package, Store, FolderOpen, Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SearchScope = 'all' | 'products' | 'sellers' | 'categories';

interface SearchScopeSelectorProps {
  value: SearchScope;
  onChange: (scope: SearchScope) => void;
  className?: string;
}

const scopeOptions: { value: SearchScope; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Layers className="h-4 w-4" /> },
  { value: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> },
  { value: 'sellers', label: 'Sellers', icon: <Store className="h-4 w-4" /> },
  { value: 'categories', label: 'Categories', icon: <FolderOpen className="h-4 w-4" /> },
];

export function SearchScopeSelector({ value, onChange, className }: SearchScopeSelectorProps) {
  const selectedOption = scopeOptions.find(opt => opt.value === value);

  return (
    <Select value={value} onValueChange={(v) => onChange(v as SearchScope)}>
      <SelectTrigger className={`w-[110px] h-9 border-r-0 rounded-r-none bg-muted/50 focus:ring-0 ${className}`}>
        <div className="flex items-center gap-1.5">
          {selectedOption?.icon}
          <SelectValue placeholder="All" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-popover border border-border shadow-lg z-[60]">
        {scopeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
