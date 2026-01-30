import { ChevronDown, Sparkles, Users } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo and Nav */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <a href="/" className="text-lg font-bold tracking-tight text-foreground">
            Uptoza
          </a>

          {/* Main Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="/marketplace"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Sparkles className="h-4 w-4" />
              Marketplace
            </a>
            <button className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              Academy
              <ChevronDown className="h-3 w-3" />
            </button>
            <a
              href="#"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              Pricing
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Users className="h-4 w-4" />
              Community
            </a>
          </nav>
        </div>

        {/* Sign In Button */}
        <a
          href="/signin"
          className="rounded-md border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Sign in
        </a>
      </div>

      {/* Secondary Nav - Categories */}
      <div className="border-t border-border/50">
        <div className="mx-auto max-w-screen-2xl overflow-x-auto px-4">
          <nav className="flex items-center gap-1 py-2">
            {[
              "Featured",
              "Hot",
              "New",
              "Top",
              "Video",
              "SeedEdit",
              "Nano Banana",
              "FLUX",
              "Sora",
              "Veo",
              "ChatGPT Image",
              "Midjourney",
              "Stable Diffusion",
              "Portraits",
              "Photography",
              "Anime",
              "Fashion",
              "Concept Art",
              "Architecture",
              "Landscapes",
            ].map((item) => (
              <a
                key={item}
                href="#"
                className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
