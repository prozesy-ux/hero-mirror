import { useFloatingChat } from '@/contexts/FloatingChatContext';
import FloatingChatBox from './FloatingChatBox';
import FloatingSupportChatBox from './FloatingSupportChatBox';

const FloatingChatWidget = () => {
  const { sessions } = useFloatingChat();

  if (sessions.length === 0) return null;

  // Separate minimized and expanded sessions
  const minimizedSessions = sessions.filter(s => s.isMinimized);
  const expandedSessions = sessions.filter(s => !s.isMinimized);

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-[60] flex flex-col items-end gap-3">
      {/* Expanded chat boxes - stack vertically if multiple */}
      <div className="flex flex-col gap-3">
        {expandedSessions.map((session) => (
          session.type === 'support' 
            ? <FloatingSupportChatBox key={session.id} session={session} />
            : <FloatingChatBox key={session.id} session={session} />
        ))}
      </div>

      {/* Minimized chat bubbles - horizontal row */}
      {minimizedSessions.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end max-w-[300px]">
          {minimizedSessions.map((session) => (
            session.type === 'support'
              ? <FloatingSupportChatBox key={session.id} session={session} />
              : <FloatingChatBox key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FloatingChatWidget;
