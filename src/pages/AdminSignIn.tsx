import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import signinBackground from "@/assets/signin-background.webp";
import promptheroIcon from "@/assets/prompthero-icon.png";

const adminSignInSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(100),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

type AdminSignInForm = z.infer<typeof adminSignInSchema>;

const AdminSignIn = () => {
  const navigate = useNavigate();
  const { signIn } = useAuthContext();

  const [form, setForm] = useState<AdminSignInForm>({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => "Admin Sign In", []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = adminSignInSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setSubmitting(true);
    
    // Convert username to email format for Supabase auth
    // If username doesn't contain @, append a domain
    const loginEmail = parsed.data.username.includes('@') 
      ? parsed.data.username 
      : `${parsed.data.username}@admin.local`;
    
    const { data: authData, error } = await signIn(loginEmail, parsed.data.password);

    if (error) {
      setSubmitting(false);
      toast.error("Invalid username or password");
      return;
    }

    // Ensure session is established before role check (helps in some browsers)
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id || authData?.user?.id;

    if (!userId) {
      setSubmitting(false);
      toast.error("Login failed - no user ID");
      return;
    }

    // Verify admin role (retry once if the session hasn't propagated yet)
    const runAdminCheck = async () =>
      supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });

    let { data: isAdminRole, error: roleError } = await runAdminCheck();
    if (roleError) {
      await new Promise((r) => setTimeout(r, 250));
      ({ data: isAdminRole, error: roleError } = await runAdminCheck());
    }

    setSubmitting(false);

    if (roleError) {
      toast.error("Couldn't verify admin access. Please try again.");
      return;
    }

    if (isAdminRole !== true) {
      await supabase.auth.signOut();
      toast.error("Access denied. This login is for administrators only.");
      return;
    }

    toast.success("Admin access verified!");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Left Side - Background Image */}
      <div className="relative hidden h-full min-h-dvh overflow-hidden lg:block lg:w-2/3">
        <img
          src={signinBackground}
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/60 via-black/60 to-gray-900/60" />
        <div
          className="absolute inset-0 z-10"
          style={{
            backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-light tracking-tight text-white drop-shadow-lg">{title}</h1>
            <p className="text-xl font-medium text-white/90 drop-shadow-md">
              Authorized admins only
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex min-h-dvh w-full flex-col items-center bg-black text-white lg:w-1/3 lg:justify-center lg:p-8">
        {/* Mobile Background */}
        <div className="relative w-full overflow-hidden lg:hidden" style={{ minHeight: "180px" }}>
          <img
            src={signinBackground}
            alt="Background"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center p-8">
            <h1 className="text-2xl font-light text-white">{title}</h1>
          </div>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center px-6 py-8 lg:px-0">
          <div className="mb-8 flex justify-center">
            <div className="overflow-hidden rounded-2xl bg-white p-0.5 shadow-xl shadow-black/20">
              <img src={promptheroIcon} alt="PromptHero" className="h-14 w-14 rounded-xl" />
            </div>
          </div>

          <div className="w-full rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                    placeholder="admin"
                    className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>Sign In</>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-500">
              This page is for admins only. If you are a user, please use the normal sign in page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignIn;
