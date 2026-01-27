import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CurrencySelectorProps {
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export const CurrencySelector = ({ variant = 'default', className = '' }: CurrencySelectorProps) => {
  const { selectedCurrency, setSelectedCurrency, currencies, loading } = useCurrency();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl animate-pulse ${className}`}>
        <div className="h-4 w-4 bg-slate-200 rounded" />
        <div className="h-4 w-10 bg-slate-200 rounded" />
      </div>
    );
  }

  const currentCurrency = currencies.find(c => c.code === selectedCurrency);

  // Top 6 currencies (highest priority)
  const topCurrencies = currencies.filter(c => c.priority <= 6);
  const otherCurrencies = currencies.filter(c => c.priority > 6);

  if (variant === 'minimal') {
    return (
      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
        <SelectTrigger className={`w-auto gap-1.5 bg-white border-slate-200 rounded-xl h-9 px-3 text-sm ${className}`}>
          <SelectValue>
            <span className="flex items-center gap-1.5">
              <span className="text-base">{currentCurrency?.flag}</span>
              <span className="font-medium">{selectedCurrency}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white min-w-[220px] p-0">
          <ScrollArea className="h-[320px]">
            {/* Top currencies */}
            <div className="p-1">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Popular
              </div>
              {topCurrencies.map((currency) => (
                <SelectItem 
                  key={currency.code} 
                  value={currency.code} 
                  className="cursor-pointer rounded-lg mx-1 my-0.5"
                >
                  <div className="flex items-center gap-3 py-0.5">
                    <span className="text-lg">{currency.flag}</span>
                    <div className="flex-1">
                      <span className="font-medium text-slate-800">{currency.code}</span>
                      <span className="text-slate-500 ml-2 text-xs">{currency.name}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </div>
            
            {/* Separator */}
            <div className="h-px bg-slate-100 my-1" />
            
            {/* Other currencies */}
            <div className="p-1">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                All Currencies
              </div>
              {otherCurrencies.map((currency) => (
                <SelectItem 
                  key={currency.code} 
                  value={currency.code} 
                  className="cursor-pointer rounded-lg mx-1 my-0.5"
                >
                  <div className="flex items-center gap-3 py-0.5">
                    <span className="text-lg">{currency.flag}</span>
                    <div className="flex-1">
                      <span className="font-medium text-slate-800">{currency.code}</span>
                      <span className="text-slate-500 ml-2 text-xs">{currency.name}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </div>
          </ScrollArea>
        </SelectContent>
      </Select>
    );
  }

  if (variant === 'compact') {
    return (
      <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
        <SelectTrigger className={`w-auto gap-1 bg-slate-50 border-slate-100 rounded-lg h-8 px-2 text-xs ${className}`}>
          <span className="text-sm">{currentCurrency?.flag}</span>
          <span className="font-bold">{currentCurrency?.symbol}</span>
        </SelectTrigger>
        <SelectContent className="bg-white min-w-[200px] p-0">
          <ScrollArea className="h-[280px]">
            <div className="p-1">
              {currencies.map((currency) => (
                <SelectItem 
                  key={currency.code} 
                  value={currency.code} 
                  className="cursor-pointer text-sm rounded-lg mx-1 my-0.5"
                >
                  <div className="flex items-center gap-2">
                    <span>{currency.flag}</span>
                    <span className="font-semibold">{currency.symbol}</span>
                    <span className="text-slate-600">{currency.code}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          </ScrollArea>
        </SelectContent>
      </Select>
    );
  }

  // Default variant
  return (
    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
      <SelectTrigger className={`w-[160px] bg-white border-slate-200 rounded-xl h-10 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentCurrency?.flag}</span>
          <SelectValue>
            <span className="font-semibold">{currentCurrency?.symbol}</span>
            <span className="text-slate-500 ml-1">{selectedCurrency}</span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-white p-0">
        <ScrollArea className="h-[360px]">
          {/* Top currencies */}
          <div className="p-1">
            <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Popular Currencies
            </div>
            {topCurrencies.map((currency) => (
              <SelectItem 
                key={currency.code} 
                value={currency.code} 
                className="cursor-pointer rounded-lg mx-1 my-0.5"
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-xl">{currency.flag}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{currency.symbol}</span>
                    <div>
                      <p className="font-medium">{currency.code}</p>
                      <p className="text-xs text-slate-500">{currency.name}</p>
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </div>
          
          {/* Separator */}
          <div className="h-px bg-slate-100 my-1" />
          
          {/* Other currencies */}
          <div className="p-1">
            <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              All Currencies
            </div>
            {otherCurrencies.map((currency) => (
              <SelectItem 
                key={currency.code} 
                value={currency.code} 
                className="cursor-pointer rounded-lg mx-1 my-0.5"
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-xl">{currency.flag}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{currency.symbol}</span>
                    <div>
                      <p className="font-medium">{currency.code}</p>
                      <p className="text-xs text-slate-500">{currency.name}</p>
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </div>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;
