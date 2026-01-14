import { Check, Rocket, Sparkles, Database, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import promptGeneratorsImg from "@/assets/prompt-generators.jpg";
import megaDatabaseImg from "@/assets/mega-prompts-database.jpg";
import leonardoAiImg from "@/assets/leonardo-ai-database.jpg";
import photorealEbookImg from "@/assets/photoreal-ebook.jpg";
import canvaWebsiteImg from "@/assets/canva-prompts-website.jpg";
import aiInfluencersImg from "@/assets/ai-influencers.jpg";
import uniqueKeywordsImg from "@/assets/unique-keywords.jpg";
import bonusProductsImg from "@/assets/bonus-products.jpg";

const bundleItems = [
  {
    number: 1,
    title: "Prompt Generators",
    image: promptGeneratorsImg,
    features: [
      "100's of Engineers",
      "Lifetime Access",
      "Nonstop Updates",
      "Generate for Anything",
      "AI Image Generators",
      "10X Prompt Upgrades"
    ]
  },
  {
    number: 2,
    title: "Mega Database",
    image: megaDatabaseImg,
    features: [
      "5,000+ Prompts",
      "Lifetime Access",
      "Nonstop Updates",
      "Immaculately Organized",
      "Every Category",
      "AI Images"
    ]
  },
  {
    number: 3,
    title: "Leonardo AI Database",
    image: leonardoAiImg,
    features: [
      "2,000+ Prompts",
      "Lifetime Access",
      "Nonstop Updates",
      "Models, Presets, Tags",
      "Includes all Images",
      "Prompt Generators"
    ]
  },
  {
    number: 4,
    title: "PhotoReal Ebook",
    image: photorealEbookImg,
    features: [
      "250+ Pages",
      "Lifetime Access",
      "Nonstop Updates",
      "PDF & Digital File",
      "Cinematic, Documentary",
      "Animated, Pixar"
    ]
  },
  {
    number: 5,
    title: "Prompts Website",
    image: canvaWebsiteImg,
    features: [
      "100+ Pages",
      "Built in Canva",
      "Monetize it",
      "AI Images/Video",
      "Prompt Generators",
      "Many Categories"
    ]
  },
  {
    number: 6,
    title: "AI Influencers",
    image: aiInfluencersImg,
    features: [
      "Hundreds of Prompts",
      "Generators",
      "Best Looking Influencers",
      "Immaculately Organized",
      "Every Style",
      "Unique Keywords"
    ]
  },
  {
    number: 7,
    title: "Unique Keywords",
    image: uniqueKeywordsImg,
    features: [
      "Unique Keywords/Styles",
      "Cameras/Lenses",
      "Generators",
      "Photographers/Artists",
      "Directors/Cinema",
      "Weekly Updates"
    ]
  },
  {
    number: 8,
    title: "Bonus Products",
    image: bonusProductsImg,
    features: [
      "Unreleased Databases",
      "First Access to Products",
      "Beta test new products",
      "First Access to Whop",
      "Free, Future Products",
      "Tons of Updates"
    ]
  }
];

const newUpdates = [
  "1,000s+ New Prompts",
  "New Category: Influencers",
  "New Category: Freepik Images",
  "New Category: AI Video",
  "New Category: ChatGPT Prompts"
];

const whatYouGet = [
  { icon: "🎨", text: "AI Art: Midjourney, Leonardo AI, Firefly, DALL-E" },
  { icon: "🤖", text: "Prompt Engineers (Prompts that generate prompts)" },
  { icon: "🪄", text: "Prompt Styling" },
  { icon: "📱", text: "AI Influencers" },
  { icon: "🏆", text: "Freepik Prompts" },
  { icon: "🧰", text: "Interfaces" },
  { icon: "🎯", text: "SEO" },
  { icon: "✏️", text: "Content Creation" },
  { icon: "📋", text: "Blogging" },
  { icon: "📢", text: "Marketing" },
  { icon: "🍿", text: "Act As Prompts" },
  { icon: "🔌", text: "Prompts for Plugins" },
  { icon: "💰", text: "Finance" },
  { icon: "💼", text: "Business" },
  { icon: "🏃‍♂️", text: "New prompts added daily or weekly" }
];

const BundleSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Updates Banner */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 rounded-2xl p-8 border border-primary/30">
            <div className="flex items-center gap-3 mb-6">
              <Rocket className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">New Updates Just Added</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {newUpdates.map((update, index) => (
                <div key={index} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-5 h-5 text-primary" />
                  <span>{update}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Never Need Prompts Again */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <Sparkles className="w-4 h-4 mr-2" />
            THE GIFT THAT KEEPS GIVING
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Never Need Prompts Again
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Hundreds of hours spent creating the best user-friendly, highly productive, structured, 
            and organized database you'll find. Easily find any prompt with filters, views, tabs, tags, and galleries.
          </p>
          
          {/* What You'll Get */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {whatYouGet.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2"
              >
                <span>{item.icon}</span>
                <span className="text-left">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Everything Bundle Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 text-lg px-4 py-2">
            <Gift className="w-5 h-5 mr-2" />
            Or Get it all ($279 Value)
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            THE EVERYTHING BUNDLE
          </h2>
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-2xl text-muted-foreground line-through">$329</span>
            <span className="text-5xl font-bold text-primary">$89</span>
          </div>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl">
            <Zap className="w-6 h-6 mr-2" />
            Get The Everything Bundle
          </Button>
        </div>

        {/* Bundle Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {bundleItems.map((item) => (
            <div 
              key={item.number}
              className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
            >
              {/* Image */}
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  {item.number}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-foreground mb-4">{item.title}</h3>
                <ul className="space-y-2">
                  {item.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 max-w-4xl mx-auto border border-primary/20">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              🚀 Do You Want Everything? Get it all with The Everything Bundle.
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="w-5 h-5 text-primary" />
                <span>10,000+ Prompts</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Constant Updates</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Gift className="w-5 h-5 text-primary" />
                <span>Lifetime Access</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-5 h-5 text-primary" />
                <span>Instant Delivery</span>
              </div>
            </div>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl">
              Get The Everything Bundle - $89
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BundleSection;
