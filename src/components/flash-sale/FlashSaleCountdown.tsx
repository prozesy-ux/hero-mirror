import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashSaleCountdownProps {
  endsAt: string;
  className?: string;
  onExpire?: () => void;
}

const FlashSaleCountdown = ({ endsAt, className, onExpire }: FlashSaleCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endTime = new Date(endsAt).getTime();
      const now = Date.now();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        onExpire?.();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endsAt, onExpire]);

  if (timeLeft.expired) {
    return (
      <div className={cn('text-xs text-slate-500', className)}>
        Sale ended
      </div>
    );
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Timer className="h-3.5 w-3.5 text-red-500" />
      <div className="flex items-center gap-0.5 font-mono text-xs font-bold">
        <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded">
          {formatNumber(timeLeft.hours)}
        </span>
        <span className="text-slate-400">:</span>
        <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded">
          {formatNumber(timeLeft.minutes)}
        </span>
        <span className="text-slate-400">:</span>
        <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded">
          {formatNumber(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
};

export default FlashSaleCountdown;
