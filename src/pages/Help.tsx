import React, { useMemo, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Menu, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { HELP_CATEGORIES, HELP_ARTICLES } from '@/data/help-docs';
import HelpSearch from '@/components/help/HelpSearch';
import HelpSidebar from '@/components/help/HelpSidebar';
import HelpCategoryCard from '@/components/help/HelpCategoryCard';
import HelpArticleView from '@/components/help/HelpArticle';
import SEOHead from '@/components/seo/SEOHead';
import uptозаLogo from '@/assets/uptoza-logo-new.png';

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

  // Filter articles
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

  // Active article
  const activeArticle = useMemo(() => {
    if (!activeArticleSlug) return null;
    return HELP_ARTICLES.find(a => a.slug === activeArticleSlug) || null;
  }, [activeArticleSlug]);

  // Related articles
  const relatedArticles = useMemo(() => {
    if (!activeArticle) return [];
    return HELP_ARTICLES
      .filter(a => a.categorySlug === activeArticle.categorySlug && a.slug !== activeArticle.slug)
      .slice(0, 5);
  }, [activeArticle]);

  // Filtered categories
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

  return (
    <>
      <SEOHead
        title="Help Center — Uptoza Documentation"
        description="Find answers to all your questions about Uptoza. Browse 134 articles covering seller guides, buyer help, product types, payments, and more."
      />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black text-white border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
            {/* Mobile menu */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10">
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

            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-white/70" />
              <span className="text-sm font-medium text-white/90 hidden sm:inline">Help Center</span>
            </div>

            <div className="flex-1 flex justify-center">
              <HelpSearch value={searchQuery} onChange={setSearch} />
            </div>

            <Link to="/" className="text-xs text-white/60 hover:text-white transition-colors hidden sm:inline">
              ← Back to Uptoza
            </Link>
          </div>
        </header>

        {/* Role filter tabs */}
        <div className="border-b border-black/10 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1 py-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'seller', label: 'Seller' },
                { key: 'buyer', label: 'Buyer' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setRole(tab.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    roleFilter === tab.key
                      ? 'bg-black text-white'
                      : 'text-muted-foreground hover:bg-black/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
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
                  <h2 className="text-lg font-semibold mb-1">
                    Search results for "{searchQuery}"
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">{filteredArticles.length} articles found</p>
                  <div className="space-y-3">
                    {filteredArticles.map(article => (
                      <button
                        key={article.slug}
                        onClick={() => setArticle(article.slug)}
                        className="block w-full text-left p-4 rounded-xl border border-black/10 hover:border-black/20 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">{article.category}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            article.role === 'seller' ? 'bg-blue-100 text-blue-700' :
                            article.role === 'buyer' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{article.role}</span>
                        </div>
                        <h3 className="text-sm font-medium text-foreground">{article.title}</h3>
                      </button>
                    ))}
                    {filteredArticles.length === 0 && (
                      <p className="text-center text-muted-foreground py-12">No articles found matching your search.</p>
                    )}
                  </div>
                </div>
              ) : activeCategorySlug ? (
                <div>
                  <h2 className="text-lg font-semibold mb-1">
                    {HELP_CATEGORIES.find(c => c.slug === activeCategorySlug)?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {filteredArticles.length} articles
                  </p>
                  <div className="space-y-2">
                    {filteredArticles.map(article => (
                      <button
                        key={article.slug}
                        onClick={() => setArticle(article.slug)}
                        className="block w-full text-left px-4 py-3 rounded-lg border border-black/10 hover:border-black/20 hover:shadow-sm transition-all"
                      >
                        <h3 className="text-sm font-medium text-foreground">{article.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {article.tags.join(' · ')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Uptoza Help Center</h1>
                    <p className="text-muted-foreground mt-1">
                      Find answers to your questions. Browse {HELP_ARTICLES.length} articles across {HELP_CATEGORIES.length} categories.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Help;
