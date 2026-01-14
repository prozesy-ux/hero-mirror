const AsSeenIn = () => {
  return (
    <section className="border-b border-border bg-muted/50 py-6">
      <div className="mx-auto flex max-w-screen-xl flex-col items-center gap-6 px-4 md:flex-row md:justify-center md:gap-12">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          As seen in
        </span>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale md:gap-12">
          {/* The New York Times */}
          <svg className="h-5 w-auto" viewBox="0 0 184 25" fill="currentColor">
            <path d="M14.57 2.57c-.2-.2-.42-.37-.67-.5a1.93 1.93 0 0 0-1.64 0c-.25.13-.47.3-.67.5L2.57 11.6a2.07 2.07 0 0 0 0 2.83l9.02 9.02c.2.2.42.37.67.5.5.26 1.14.26 1.64 0 .25-.13.47-.3.67-.5l9.02-9.02a2.07 2.07 0 0 0 0-2.83l-9.02-9.03Z" />
            <text x="30" y="18" className="text-xs font-serif font-bold">The New York Times</text>
          </svg>

          {/* Washington Post */}
          <span className="font-serif text-lg font-medium italic text-foreground">
            The Washington Post
          </span>

          {/* Business Insider */}
          <span className="text-sm font-bold uppercase tracking-tight text-foreground">
            Business<br />Insider
          </span>

          {/* ABC */}
          <span className="text-xl font-bold text-foreground">
            <span className="mr-0.5">∎∎∎</span>ABC
          </span>

          {/* Politico */}
          <span className="text-xl font-bold uppercase tracking-tight text-foreground" style={{ fontFamily: 'Georgia, serif' }}>
            POLITICO
          </span>

          {/* TechCrunch */}
          <span className="text-xl font-bold text-foreground">
            <span className="text-green-600">T</span>C
          </span>

          {/* Fast Company */}
          <span className="text-lg font-bold uppercase text-foreground" style={{ fontFamily: 'Georgia, serif' }}>
            Fast Company
          </span>
        </div>
      </div>
    </section>
  );
};

export default AsSeenIn;
