import React, { useMemo, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Menu, Search, Facebook, Linkedin, Twitter, Youtube, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { HELP_CATEGORIES, HELP_ARTICLES } from '@/data/help-docs';
import HelpSearch from '@/components/help/HelpSearch';
import HelpSidebar from '@/components/help/HelpSidebar';
import HelpCategoryCard from '@/components/help/HelpCategoryCard';
import HelpArticleView from '@/components/help/HelpArticle';
import SEOHead from '@/components/seo/SEOHead';
import uptозаLogo from '@/assets/uptoza-logo-new.png';

const POPULAR_TAGS = ['auto-delivery', 'wallet', 'products', 'orders', 'courses'];

const NAV_SHORTCUTS = [
  { label: 'Getting Started', slug: 'getting-started' },
  { label: 'Products', slug: 'product-types' },
  { label: 'Payments', slug: 'wallet-payouts' },
  { label: 'Orders', slug: 'sales-orders' },
  { label: 'Troubleshooting', slug: 'troubleshooting' },
];

const Help: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeArticleSlug = searchParams.get('article');
  const activeCategorySlug = searchParams.get('category');
  const searchQuery = searchParams.get('q') || '';
  const roleFilter = searchParams.get('role') || 'all';

  const setArticle = useCallback((slug: string) => {
    setSearchParams({ article: slug });
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }, [setSearchParams]);

  const setCategory = useCallback((slug: string) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
    setSidebarOpen(false);
  }, [setSearchParams]);

  const setSearch = useCallback((q: string) => {
    if (q) {
      setSearchParams({ q });
    } else {
      const newParams: Record<string, string> = {};
      if (activeCategorySlug) newParams.category = activeCategorySlug;
      setSearchParams(newParams);
    }
  }, [setSearchParams, activeCategorySlug]);

  const setRole = useCallback((role: string) => {
    const newParams: Record<string, string> = {};
    if (role !== 'all') newParams.role = role;
    if (activeCategorySlug) newParams.category = activeCategorySlug;
    if (searchQuery) newParams.q = searchQuery;
    setSearchParams(newParams);
  }, [setSearchParams, activeCategorySlug, searchQuery]);

  const filteredArticles = useMemo(() => {
    let arts = HELP_ARTICLES;
    if (roleFilter !== 'all') {
      arts = arts.filter(a => a.role === roleFilter || a.role === 'general');
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      arts = arts.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q)) ||
        a.content.toLowerCase().includes(q)
      );
    }
    if (activeCategorySlug && !activeArticleSlug && !searchQuery) {
      arts = arts.filter(a => a.categorySlug === activeCategorySlug);
    }
    return arts.sort((a, b) => a.order - b.order);
  }, [roleFilter, searchQuery, activeCategorySlug, activeArticleSlug]);

  const activeArticle = useMemo(() => {
    if (!activeArticleSlug) return null;
    return HELP_ARTICLES.find(a => a.slug === activeArticleSlug) || null;
  }, [activeArticleSlug]);

  const relatedArticles = useMemo(() => {
    if (!activeArticle) return [];
    return HELP_ARTICLES
      .filter(a => a.categorySlug === activeArticle.categorySlug && a.slug !== activeArticle.slug)
      .slice(0, 5);
  }, [activeArticle]);

  const filteredCategories = useMemo(() => {
    if (roleFilter === 'all') return HELP_CATEGORIES;
    return HELP_CATEGORIES.filter(c => c.role === roleFilter || c.role === 'general');
  }, [roleFilter]);

  const categoryArticleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredArticles.forEach(a => {
      counts[a.categorySlug] = (counts[a.categorySlug] || 0) + 1;
    });
    return counts;
  }, [filteredArticles]);

  const sidebarContent = (
    <HelpSidebar
      categories={HELP_CATEGORIES}
      articles={HELP_ARTICLES}
      activeCategory={activeCategorySlug}
      activeArticle={activeArticleSlug}
      onCategoryClick={setCategory}
      onArticleClick={setArticle}
    />
  );

  const showHero = !activeArticle && !activeCategorySlug && !searchQuery;

  return (
    <>
      <SEOHead
        title="Help Center — Uptoza Documentation"
        description="Find answers to all your questions about Uptoza. Browse 134 articles covering seller guides, buyer help, product types, payments, and more."
      />

      <div className="min-h-screen bg-white">
        {/* Header — White Upwork-style */}
        <header className="bg-white border-b border-[#e4ebe4] sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo + divider + Help Center */}
              <div className="flex items-center gap-3">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden text-[#001e00] hover:bg-[#f7f7f7]">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-4 overflow-y-auto">
                    {sidebarContent}
                  </SheetContent>
                </Sheet>

                <Link to="/" className="shrink-0">
                  <img src={uptозаLogo} alt="Uptoza" className="h-7" />
                </Link>
                <span className="text-[#d5e0d5] text-2xl font-light mx-1 hidden sm:inline">|</span>
                <span className="text-[#001e00] text-base font-medium hidden sm:inline">Help Center</span>
              </div>

              {/* Desktop nav links */}
              <nav className="hidden lg:flex items-center">
                {NAV_SHORTCUTS.map(n => (
                  <button
                    key={n.slug}
                    onClick={() => setCategory(n.slug)}
                    className="px-3 py-2 text-sm text-[#001e00] hover:bg-[#f7f7f7] rounded transition"
                  >
                    {n.label}
                  </button>
                ))}
              </nav>

              {/* Right section */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const el = document.getElementById('help-search-input');
                    el?.focus();
                  }}
                  className="hidden lg:flex items-center justify-center w-10 h-10 text-[#001e00] hover:bg-[#f7f7f7] rounded-full transition"
                >
                  <Search className="h-5 w-5" />
                </button>
                <Link
                  to="/signin"
                  className="hidden lg:block px-5 py-2 bg-[#14A800] text-white text-sm font-medium rounded-full hover:bg-[#108a00] transition"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section — Green gradient */}
        {showHero && (
          <section className="relative bg-gradient-to-br from-[#001e00] via-[#0d3b0d] to-[#14A800] text-white overflow-hidden">
            <div className="relative max-w-[1600px] mx-auto px-6 py-20 lg:py-28">
              <div className="max-w-3xl">
                <p className="text-xl font-medium mb-3 text-white/90">Help Center</p>
                <h1 className="text-5xl lg:text-6xl font-semibold mb-8 text-white leading-tight">
                  Find solutions fast.
                </h1>
                <p className="text-lg mb-8 text-white/80">
                  Search hundreds of articles on Uptoza Help
                </p>

                {/* Hero search bar */}
                <div className="max-w-2xl mb-8">
                  <HelpSearch value={searchQuery} onChange={setSearch} variant="hero" />
                </div>

                {/* Popular tags */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-white/70">Popular:</span>
                  {POPULAR_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSearch(tag)}
                      className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm text-white hover:bg-white/25 transition border border-white/20"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Non-hero search bar (when in article/category/search view) */}
        {!showHero && (
          <div className="bg-[#f7f7f7] border-b border-[#e4ebe4]">
            <div className="max-w-[1600px] mx-auto px-6 py-4">
              <HelpSearch value={searchQuery} onChange={setSearch} variant="compact" />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="max-w-[1600px] mx-auto px-6 py-16">
          {activeArticle || activeCategorySlug || searchQuery ? (
            <div className="flex gap-6">
              {/* Desktop sidebar */}
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
                  {sidebarContent}
                </div>
              </aside>

              {/* Content area */}
              <main className="flex-1 min-w-0">
                {activeArticle ? (
                  <HelpArticleView
                    article={activeArticle}
                    onBack={() => {
                      if (activeArticle.categorySlug) {
                        setCategory(activeArticle.categorySlug);
                      } else {
                        setCategory('');
                      }
                    }}
                    relatedArticles={relatedArticles}
                    onArticleClick={setArticle}
                  />
                ) : searchQuery ? (
                  <div>
                    <h2 className="text-lg font-semibold mb-1 text-[#001e00]">
                      Search results for "{searchQuery}"
                    </h2>
                    <p className="text-sm text-[#5e6d55] mb-6">{filteredArticles.length} articles found</p>
                    <div className="space-y-3">
                      {filteredArticles.map(article => (
                        <button
                          key={article.slug}
                          onClick={() => setArticle(article.slug)}
                          className="block w-full text-left p-4 rounded-lg border border-[#d5e0d5] hover:border-[#14A800] hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-[#5e6d55]">{article.category}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              article.role === 'seller' ? 'bg-blue-100 text-blue-700' :
                              article.role === 'buyer' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>{article.role}</span>
                          </div>
                          <h3 className="text-sm font-medium text-[#001e00]">{article.title}</h3>
                        </button>
                      ))}
                      {filteredArticles.length === 0 && (
                        <p className="text-center text-[#5e6d55] py-12">No articles found matching your search.</p>
                      )}
                    </div>
                  </div>
                ) : activeCategorySlug ? (
                  <div>
                    <h2 className="text-lg font-semibold mb-1 text-[#001e00]">
                      {HELP_CATEGORIES.find(c => c.slug === activeCategorySlug)?.name}
                    </h2>
                    <p className="text-sm text-[#5e6d55] mb-6">
                      {filteredArticles.length} articles
                    </p>
                    <div className="space-y-2">
                      {filteredArticles.map(article => (
                        <button
                          key={article.slug}
                          onClick={() => setArticle(article.slug)}
                          className="block w-full text-left px-4 py-3 rounded-lg border border-[#d5e0d5] hover:border-[#14A800] hover:shadow-md transition-all"
                        >
                          <h3 className="text-sm font-medium text-[#001e00]">{article.title}</h3>
                          <p className="text-xs text-[#5e6d55] mt-0.5 line-clamp-1">
                            {article.tags.join(' · ')}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </main>
            </div>
          ) : (
            /* Landing — Category grid with tabs */
            <div>
              <h2 className="text-4xl font-semibold mb-10 text-[#001e00]">
                Choose an account type for personalized help
              </h2>

              {/* Underline-style role tabs */}
              <div className="border-b border-[#e4ebe4] mb-12">
                <div className="flex gap-8">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'seller', label: 'Seller' },
                    { key: 'buyer', label: 'Buyer' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setRole(tab.key)}
                      className={`pb-4 text-lg font-medium border-b-2 transition ${
                        roleFilter === tab.key
                          ? 'border-[#14A800] text-[#001e00]'
                          : 'border-transparent text-[#5e6d55] hover:text-[#001e00]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4-column category grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.map(cat => (
                  <HelpCategoryCard
                    key={cat.slug}
                    category={cat}
                    articleCount={categoryArticleCounts[cat.slug] || 0}
                    onClick={() => setCategory(cat.slug)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — Dark green */}
        <footer className="bg-[#001e00] text-white mt-20">
          <div className="max-w-[1600px] mx-auto px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
              <div>
                <h3 className="font-semibold mb-5 text-[#d5e0d5] text-sm uppercase tracking-wide">For Sellers</h3>
                <ul className="space-y-3 text-sm">
                  <li><button onClick={() => setCategory('seller-account-setup')} className="text-white hover:text-[#14A800] transition">Getting started as a seller</button></li>
                  <li><button onClick={() => setCategory('creating-products')} className="text-white hover:text-[#14A800] transition">Creating products</button></li>
                  <li><button onClick={() => setCategory('auto-delivery')} className="text-white hover:text-[#14A800] transition">Auto-delivery system</button></li>
                  <li><button onClick={() => setCategory('wallet-payouts')} className="text-white hover:text-[#14A800] transition">Wallet & payouts</button></li>
                  <li><button onClick={() => setCategory('marketing')} className="text-white hover:text-[#14A800] transition">Marketing tools</button></li>
                  <li><button onClick={() => setCategory('analytics')} className="text-white hover:text-[#14A800] transition">Analytics & insights</button></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-5 text-[#d5e0d5] text-sm uppercase tracking-wide">For Buyers</h3>
                <ul className="space-y-3 text-sm">
                  <li><button onClick={() => setCategory('buyer-guide')} className="text-white hover:text-[#14A800] transition">Browsing marketplace</button></li>
                  <li><button onClick={() => setCategory('buyer-wallet')} className="text-white hover:text-[#14A800] transition">Payments & wallet</button></li>
                  <li><button onClick={() => setCategory('chat-communication')} className="text-white hover:text-[#14A800] transition">Chat with sellers</button></li>
                  <li><button onClick={() => setCategory('troubleshooting')} className="text-white hover:text-[#14A800] transition">Troubleshooting</button></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-5 text-[#d5e0d5] text-sm uppercase tracking-wide">Resources</h3>
                <ul className="space-y-3 text-sm">
                  <li><button onClick={() => setCategory('')} className="text-white hover:text-[#14A800] transition">Help & support</button></li>
                  <li><Link to="/" className="text-white hover:text-[#14A800] transition">Back to Uptoza</Link></li>
                  <li><Link to="/marketplace" className="text-white hover:text-[#14A800] transition">Marketplace</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-5 text-[#d5e0d5] text-sm uppercase tracking-wide">Company</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link to="/" className="text-white hover:text-[#14A800] transition">About us</Link></li>
                  <li><Link to="/terms" className="text-white hover:text-[#14A800] transition">Terms of Service</Link></li>
                  <li><Link to="/privacy" className="text-white hover:text-[#14A800] transition">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>

            {/* Social links */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 py-8 border-t border-[#0d3b0d]">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#d5e0d5]">Follow Us</span>
                <div className="flex gap-2">
                  {[Facebook, Linkedin, Twitter, Youtube, Instagram].map((Icon, i) => (
                    <a key={i} href="#" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#0d3b0d] transition">
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-8 border-t border-[#0d3b0d] text-sm text-[#d5e0d5]">
              <p>© 2024 - 2026 Uptoza. All rights reserved.</p>
              <div className="flex flex-wrap gap-6">
                <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
                <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Help;
