import { useEffect, useState } from 'react';

interface LoadingBarProps {
  loading: boolean;
}

export const LoadingBar = ({ loading }: LoadingBarProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (loading) {
      setProgress(10);
      const timer = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      return () => clearInterval(timer);
    } else {
      setProgress(100);
      const hideTimer = setTimeout(() => setProgress(0), 200);
      return () => clearTimeout(hideTimer);
    }
  }, [loading]);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[100]">
      <div 
        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
