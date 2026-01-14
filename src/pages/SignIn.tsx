import { useState } from "react";
import { Mail } from "lucide-react";
import signinBackground from "@/assets/signin-background.webp";
import promptheroIcon from "@/assets/prompthero-icon.png";

const SignIn = () => {
  const [email, setEmail] = useState("");

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Left Side - Background Image (2/3 width on desktop) */}
      <div className="relative hidden h-full min-h-dvh overflow-hidden lg:block lg:w-2/3">
        <img
          src={signinBackground}
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/60 via-black/60 to-gray-900/60" />
        {/* Dot Pattern */}
        <div
          className="absolute inset-0 z-10"
          style={{
            backgroundImage:
              "radial-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Welcome Text */}
        <div className="relative z-20 flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-light tracking-tight text-white drop-shadow-lg">
              Welcome to PromptHero
            </h1>
            <p className="text-xl font-medium text-white/90 drop-shadow-md">
              Your creative AI assistant
            </p>
          </div>
        </div>
        {/* Credit */}
        <div className="absolute bottom-0 left-0 z-30 p-4 text-sm text-white/70">
          By{" "}
          <a
            href="#"
            className="text-white/80 underline decoration-white/30 transition-colors hover:text-white/95 hover:decoration-white/60"
          >
            @BilboX
          </a>
        </div>
      </div>

      {/* Right Side - Sign In Form (1/3 width on desktop) */}
      <div className="flex min-h-dvh w-full flex-col items-center bg-black text-white lg:w-1/3 lg:justify-center lg:p-8">
        {/* Mobile Background */}
        <div className="relative w-full overflow-hidden lg:hidden" style={{ minHeight: "240px" }}>
          <img
            src={signinBackground}
            alt="Background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center p-8">
            <h1 className="text-2xl font-light text-white">Welcome to PromptHero</h1>
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-sm px-6 py-8 lg:px-0">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <img
              src={promptheroIcon}
              alt="PromptHero"
              className="h-16 w-16 rounded-2xl"
            />
          </div>

          {/* Title */}
          <h2 className="mb-2 text-center text-2xl font-semibold text-white">
            Sign in to PromptHero
          </h2>
          <p className="mb-8 text-center text-sm text-gray-400">
            Enter your email to get started. New users get 10 free credits!
          </p>

          {/* Google Button */}
          <button className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-transparent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-900">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-4 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-white"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-700 bg-transparent px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-0"
              />
            </div>

            <p className="text-sm text-gray-500">
              We'll send you a magic link to sign in — no password needed.
            </p>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-700"
            >
              <Mail className="h-4 w-4" />
              Continue with Email
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
