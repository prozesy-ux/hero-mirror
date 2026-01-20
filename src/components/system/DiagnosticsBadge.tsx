import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { testLocalStorageAccess, countSupabaseKeys, getLastRefreshTime } from '@/lib/session-utils';

const DiagnosticsBadge = () => {
  const { session, loading } = useAuthContext();
  const [diagnostics, setDiagnostics] = useState({
    storageOk: true,
    sbKeyCount: 0,
    lastRefresh: null as string | null
  });
  
  useEffect(() => {
    const updateDiagnostics = () => {
      setDiagnostics({
        storageOk: testLocalStorageAccess(),
        sbKeyCount: countSupabaseKeys(),
        lastRefresh: getLastRefreshTime()
      });
    };
    
    updateDiagnostics();
    
    // Update diagnostics periodically
    const interval = setInterval(updateDiagnostics, 5000);
    return () => clearInterval(interval);
  }, [session]);
  
  // Only show in development
  if (import.meta.env.PROD) return null;
  
  return (
    <div className="fixed bottom-2 left-2 z-50 bg-black/80 text-white text-[10px] p-2 rounded font-mono space-y-0.5 select-none pointer-events-none">
      <div>Auth: {loading ? '⏳' : session ? '✅' : '❌'}</div>
      <div>Storage: {diagnostics.storageOk ? '✅' : '❌'}</div>
      <div>SB Keys: {diagnostics.sbKeyCount}</div>
      {diagnostics.lastRefresh && <div>Expires: {diagnostics.lastRefresh}</div>}
    </div>
  );
};

export default DiagnosticsBadge;
