import { Loader2 } from "lucide-react";

interface AppLoaderProps {
  message?: string;
}

export const AppLoader = ({ message = "Loading..." }: AppLoaderProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Logo/Brand mark */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <span className="text-white text-3xl font-black">U</span>
        </div>
        
        {/* Spinner */}
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
        
        {/* Loading message */}
        <p className="text-gray-500 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

export default AppLoader;
