import { Switch } from "@/components/ui/switch";

interface StatusToggleCardProps {
  isOnline: boolean;
  onToggle: (value: boolean) => void;
  loading?: boolean;
}

const StatusToggleCard = ({ isOnline, onToggle, loading = false }: StatusToggleCardProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Set status
        </h3>
      </div>
      
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              {isOnline && (
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-50" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Online status</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isOnline 
                  ? "You'll appear online to others" 
                  : "You'll appear offline to others"
                }
              </p>
            </div>
          </div>
          
          <Switch
            checked={isOnline}
            onCheckedChange={onToggle}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default StatusToggleCard;
