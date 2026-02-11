import React from 'react';
import { ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { HelpArticle as HelpArticleType } from '@/data/help-docs';

interface HelpArticleProps {
  article: HelpArticleType;
  onBack: () => void;
  relatedArticles: HelpArticleType[];
  onArticleClick: (slug: string) => void;
}

const roleColors: Record<string, string> = {
  seller: 'bg-blue-100 text-blue-800',
  buyer: 'bg-green-100 text-green-800',
  admin: 'bg-purple-100 text-purple-800',
  general: 'bg-gray-100 text-gray-800',
};

const HelpArticleView: React.FC<HelpArticleProps> = ({ article, onBack, relatedArticles, onArticleClick }) => {
  const [feedback, setFeedback] = React.useState<'yes' | 'no' | null>(null);

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <span className="text-muted-foreground text-sm">/ {article.category}</span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="secondary" className={roleColors[article.role]}>
          {article.role}
        </Badge>
        <span className="text-xs text-muted-foreground">Article #{article.id}</span>
      </div>

      {/* Content */}
      <article
        className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-code:bg-black/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-black/5 prose-pre:text-sm"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-8 pt-6 border-t border-black/10">
        {article.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-black/5 rounded text-xs text-muted-foreground">{tag}</span>
        ))}
      </div>

      {/* Feedback */}
      <div className="mt-8 pt-6 border-t border-black/10">
        <p className="text-sm font-medium mb-3">Was this article helpful?</p>
        <div className="flex gap-2">
          <Button
            variant={feedback === 'yes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedback('yes')}
            className="gap-1"
          >
            <ThumbsUp className="h-3.5 w-3.5" /> Yes
          </Button>
          <Button
            variant={feedback === 'no' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedback('no')}
            className="gap-1"
          >
            <ThumbsDown className="h-3.5 w-3.5" /> No
          </Button>
        </div>
        {feedback && (
          <p className="text-xs text-muted-foreground mt-2">Thanks for your feedback!</p>
        )}
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-8 pt-6 border-t border-black/10">
          <h3 className="text-sm font-semibold mb-3">Related Articles</h3>
          <div className="space-y-2">
            {relatedArticles.map(ra => (
              <button
                key={ra.slug}
                onClick={() => onArticleClick(ra.slug)}
                className="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                → {ra.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpArticleView;
