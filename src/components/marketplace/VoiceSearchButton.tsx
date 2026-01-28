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
              className={cn('text-muted-foreground/50', className)}
            >
              <MicOff className="h-4 w-4" />
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
              'transition-all duration-200',
              isListening && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-pulse',
              error && 'text-destructive',
              className
            )}
          >
            {isListening ? (
              <div className="relative">
                <Mic className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white animate-ping" />
              </div>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isListening ? 'Click to stop' : error || 'Voice search'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
