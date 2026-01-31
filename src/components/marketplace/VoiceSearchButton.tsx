import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VoiceSearchButtonProps {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function VoiceSearchButton({
  isListening,
  isSupported,
  error,
  onStart,
  onStop,
  className,
  size = 'icon',
}: VoiceSearchButtonProps) {
  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size={size}
              disabled
              className={cn('text-muted-foreground/50 min-w-[36px] min-h-[36px]', className)}
            >
              <MicOff className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice search not supported in this browser</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={isListening ? 'default' : 'ghost'}
            size={size}
            onClick={isListening ? onStop : onStart}
            className={cn(
              'transition-all duration-200 min-w-[36px] min-h-[36px]',
              isListening && 'bg-red-500 hover:bg-red-600 text-white animate-pulse',
              !isListening && 'text-black/50 hover:text-black hover:bg-black/5',
              error && 'text-red-500',
              className
            )}
          >
            {isListening ? (
              <div className="relative">
                <Mic className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-white animate-ping" />
              </div>
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isListening ? 'Click to stop listening' : error || 'Voice search (click to speak)'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
