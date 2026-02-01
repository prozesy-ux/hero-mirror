import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, X, Check, HelpCircle } from 'lucide-react';
import ProductTypeSelector from '@/components/seller/ProductTypeSelector';
import MultiImageUploader from '@/components/seller/MultiImageUploader';
import { ProductTypeId, getProductTypeById, PRODUCT_TYPES } from '@/components/icons/ProductTypeIcons';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

const STEPS = [
  { id: 1, title: 'Choose Type', description: 'What are you selling?' },
  { id: 2, title: 'Details', description: 'Name, price, and description' },
  { id: 3, title: 'Customize', description: 'Images and settings' },
];

const popularTags = ['Digital', 'Premium', 'Instant Delivery', 'Lifetime', 'Subscription', 'API', 'Software', 'Course', 'Template', 'E-book'];

const NewProduct = () => {
  const navigate = useNavigate();
  const { profile, refreshProducts } = useSellerContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form state
  const [productType, setProductType] = useState<ProductTypeId>('digital_product');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [chatAllowed, setChatAllowed] = useState(true);
  const [requiresEmail, setRequiresEmail] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order');
    if (data) setCategories(data);
  };

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const toggleCategory = (categoryId: string) => {
    setCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!productType;
      case 2:
        return name.trim().length > 0 && parseFloat(price) >= 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate('/seller/products');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price) {
      toast.error('Name and price are required');
      return;
    }

    setSubmitting(true);
    try {
      const primaryImage = images.length > 0 ? images[0] : null;
      
      const productData = {
        seller_id: profile.id,
        name: name.trim(),
        description: description.trim() || null,
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        category_id: categoryIds[0] || null,
        category_ids: categoryIds,
        tags,
        icon_url: primaryImage,
        images,
        is_available: isAvailable,
        chat_allowed: chatAllowed,
        requires_email: requiresEmail,
        product_type: productType,
        product_metadata: {},
      };

      const { error } = await supabase
        .from('seller_products')
        .insert(productData);
      
      if (error) throw error;
      
      toast.success('Product created! Awaiting approval.');
      refreshProducts();
      navigate('/seller/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = getProductTypeById(productType);
  const SelectedIcon = selectedType.Icon;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold text-lg">New Product</h1>
              <p className="text-sm text-slate-500">Step {currentStep} of {STEPS.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="rounded-xl">
                Back
              </Button>
            )}
            {currentStep < STEPS.length ? (
              <Button 
                onClick={handleNext} 
                disabled={!canProceed()}
                className="rounded-xl bg-pink-500 hover:bg-pink-600"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={submitting || !canProceed()}
                className="rounded-xl bg-pink-500 hover:bg-pink-600"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Publish Product
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <div 
                key={step.id} 
                className={cn(
                  "flex items-center",
                  index < STEPS.length - 1 && "flex-1"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                    currentStep > step.id
                      ? "bg-emerald-500 text-white"
                      : currentStep === step.id
                        ? "bg-black text-white"
                        : "bg-slate-200 text-slate-500"
                  )}>
                    {currentStep > step.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className={cn(
                      "text-sm font-medium",
                      currentStep >= step.id ? "text-black" : "text-slate-400"
                    )}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-4",
                    currentStep > step.id ? "bg-emerald-500" : "bg-slate-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          {/* Step 1: Choose Type */}
          {currentStep === 1 && (
            <div className="p-6 lg:p-8">
              <div className="grid lg:grid-cols-5 gap-8">
                {/* Left: Info */}
                <div className="lg:col-span-2">
                  <h2 className="text-2xl font-bold text-black mb-3">
                    What are you creating?
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Choose the type that best describes your product. This helps buyers find what they're looking for.
                  </p>
                  
                  {selectedType && (
                    <div className={cn(
                      "p-4 rounded-xl border-2",
                      selectedType.color
                    )}>
                      <div className="flex items-center gap-3 mb-2">
                        <SelectedIcon className="w-8 h-8" />
                        <span className="font-semibold">{selectedType.name}</span>
                      </div>
                      <p className="text-sm text-slate-600">{selectedType.description}</p>
                    </div>
                  )}
                  
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Need help choosing?</p>
                        <p className="text-xs text-slate-500 mt-1">
                          You can always change this later. Pick what feels closest to your product.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right: Type Grid */}
                <div className="lg:col-span-3">
                  <ProductTypeSelector
                    selectedType={productType}
                    onTypeSelect={setProductType}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <div className="p-6 lg:p-8">
              <div className="grid lg:grid-cols-5 gap-8">
                {/* Left: Preview */}
                <div className="lg:col-span-2">
                  <h2 className="text-2xl font-bold text-black mb-3">
                    Product Details
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Give your product a name and set your price. You can update these anytime.
                  </p>
                  
                  {/* Mini Preview Card */}
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-3">Preview</p>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                        <SelectedIcon className="w-16 h-16 opacity-50" />
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm truncate">
                          {name || 'Your product name'}
                        </p>
                        <p className="text-lg font-bold text-black mt-1">
                          ${price || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right: Form */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Name */}
                  <div>
                    <Label className="text-sm font-semibold text-black mb-2 block">
                      Product Name *
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Ultimate Design Bundle"
                      className="rounded-xl border-slate-200 h-12 text-base"
                    />
                  </div>
                  
                  {/* Price & Stock */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-black mb-2 block">
                        Price (USD) *
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="rounded-xl border-slate-200 h-12 text-base pl-7"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-black mb-2 block">
                        Stock (optional)
                      </Label>
                      <Input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="Unlimited"
                        min="0"
                        className="rounded-xl border-slate-200 h-12 text-base"
                      />
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <Label className="text-sm font-semibold text-black mb-2 block">
                      Description
                    </Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your product..."
                      rows={4}
                      className="rounded-xl border-slate-200 text-base resize-none"
                    />
                  </div>
                  
                  {/* Categories */}
                  <div>
                    <Label className="text-sm font-semibold text-black mb-2 block">
                      Categories
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                            categoryIds.includes(cat.id)
                              ? "bg-black text-white border-black"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Customize */}
          {currentStep === 3 && (
            <div className="p-6 lg:p-8">
              <div className="grid lg:grid-cols-5 gap-8">
                {/* Left: Summary */}
                <div className="lg:col-span-2">
                  <h2 className="text-2xl font-bold text-black mb-3">
                    Final Touches
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Add images and configure settings to make your product stand out.
                  </p>
                  
                  {/* Summary Card */}
                  <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <SelectedIcon className="w-8 h-8" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Type</p>
                        <p className="font-medium">{selectedType.name}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs text-slate-500 uppercase">Product</p>
                      <p className="font-medium">{name || 'Untitled'}</p>
                      <p className="text-lg font-bold text-black">${price || '0'}</p>
                    </div>
                    {tags.length > 0 && (
                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-xs text-slate-500 uppercase mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right: Settings */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Images */}
                  <div>
                    <Label className="text-sm font-semibold text-black mb-2 block">
                      Product Images
                    </Label>
                    <MultiImageUploader
                      images={images}
                      onChange={setImages}
                      maxImages={5}
                    />
                  </div>
                  
                  {/* Tags */}
                  <div>
                    <Label className="text-sm font-semibold text-black mb-2 block">
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 p-0.5 rounded-full hover:bg-black/10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(tagInput);
                        }
                      }}
                      placeholder="Add a tag..."
                      className="rounded-xl border-slate-200 mb-2"
                    />
                    <div className="flex flex-wrap gap-1">
                      {popularTags.filter(t => !tags.includes(t)).slice(0, 6).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddTag(tag)}
                          className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Settings */}
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Available for purchase</p>
                        <p className="text-xs text-slate-500">Show this product in your store</p>
                      </div>
                      <Switch
                        checked={isAvailable}
                        onCheckedChange={setIsAvailable}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Allow chat</p>
                        <p className="text-xs text-slate-500">Let buyers message you about this product</p>
                      </div>
                      <Switch
                        checked={chatAllowed}
                        onCheckedChange={setChatAllowed}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Require email</p>
                        <p className="text-xs text-slate-500">Ask buyers for their email before purchase</p>
                      </div>
                      <Switch
                        checked={requiresEmail}
                        onCheckedChange={setRequiresEmail}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NewProduct;
