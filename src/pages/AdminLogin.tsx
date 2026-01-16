import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      // After login, Admin.tsx will check isAdmin and redirect appropriately
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Admin Icon */}
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-purple-500/10 rounded-sm">
            <Shield className="w-10 h-10 text-purple-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-white text-center mb-2">
          Admin Access
        </h1>
        <p className="text-zinc-500 text-center text-sm mb-8">
          Sign in with your admin credentials
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-11 pr-11 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Back Link */}
        <p className="text-center mt-6 text-zinc-500 text-sm">
          Not an admin?{" "}
          <button
            onClick={() => navigate("/signin")}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Go to user login
          </button>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
