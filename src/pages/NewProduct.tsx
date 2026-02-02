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
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, X, Check, Bold, Italic, Underline, Strikethrough, Quote, Link2, Image, Video, Music, ChevronDown, Undo, Redo } from 'lucide-react';
import ProductTypeSelector from '@/components/seller/ProductTypeSelector';
import MultiImageUploader from '@/components/seller/MultiImageUploader';
import { ProductTypeId, getProductTypeById } from '@/components/icons/ProductTypeIcons';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

const STEPS = [
  { id: 1, title: 'Type', description: 'What are you selling?' },
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
    <div className="min-h-screen bg-[#f4f4f0]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header - Clean Gumroad style */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="p-2 rounded-md border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="font-semibold text-xl text-gray-900">New Product</h1>
              <p className="text-sm text-gray-500">Step {currentStep} of {STEPS.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="rounded-md border border-gray-200 hover:bg-gray-50 text-gray-700"
              >
                Back
              </Button>
            )}
            {currentStep < STEPS.length ? (
              <Button 
                onClick={handleNext} 
                disabled={!canProceed()}
                className="rounded-md bg-pink-500 hover:bg-pink-600 text-white px-6"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={submitting || !canProceed()}
                className="rounded-md bg-pink-500 hover:bg-pink-600 text-white px-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar - Clean minimal style */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-center gap-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep > step.id
                      ? "bg-pink-500 text-white"
                      : currentStep === step.id
                        ? "bg-white text-gray-900 border-2 border-pink-500"
                        : "bg-gray-100 text-gray-400"
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
                      currentStep >= step.id ? "text-gray-900" : "text-gray-400"
                    )}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "w-12 h-0.5",
                    currentStep > step.id ? "bg-pink-500" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Step 1: Choose Type */}
          {currentStep === 1 && (
            <div className="p-6 lg:p-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Info */}
                <div className="lg:col-span-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    What are you creating?
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Choose the type that best describes your product.
                  </p>
                  
                  {selectedType && (
                    <div className="p-4 rounded-md border border-pink-200 bg-pink-50">
                      <div className="flex items-center gap-3 mb-2">
                        <SelectedIcon className="w-8 h-8" />
                        <span className="font-medium text-gray-900">{selectedType.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{selectedType.description}</p>
                    </div>
                  )}
                </div>
                
                {/* Right: Type Grid */}
                <div className="lg:col-span-2">
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
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Preview */}
                <div className="lg:col-span-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Product Details
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Give your product a name and set your price.
                  </p>
                  
                  {/* Mini Preview Card */}
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-3">Preview</p>
                    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <SelectedIcon className="w-16 h-16 opacity-30" />
                      </div>
                      <div className="p-3 border-t border-gray-200">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {name || 'Your product name'}
                        </p>
                        <p className="text-xl font-semibold text-gray-900 mt-1">
                          ${price || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right: Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Name */}
                  <div>
                    <Label className="text-base font-medium text-gray-900 mb-2 block">
                      Name
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Ultimate Design Bundle"
                      className="rounded-lg border-2 border-gray-200 h-12 text-base focus:border-pink-500 focus:ring-0 focus:ring-offset-0 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  {/* Price & Stock */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-base font-medium text-gray-900 mb-2 block">
                        Price
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="rounded-lg border-2 border-gray-200 h-12 text-base pl-8 focus:border-pink-500 focus:ring-0 focus:ring-offset-0 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-base font-medium text-gray-900 mb-2 block">
                        Stock
                      </Label>
                      <Input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="Unlimited"
                        min="0"
                        className="rounded-lg border-2 border-gray-200 h-12 text-base focus:border-pink-500 focus:ring-0 focus:ring-offset-0 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  
                  {/* Description with Rich Text Editor */}
                  <div>
                    <Label className="text-base font-medium text-gray-900 mb-2 block">
                      Description
                    </Label>
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-pink-500 transition-colors">
                      {/* Black toolbar */}
                      <div className="bg-black px-3 py-2 flex items-center gap-1 flex-wrap">
                        {/* Format dropdown */}
                        <button type="button" className="px-3 py-1.5 text-white text-sm rounded hover:bg-white/10 flex items-center gap-1">
                          Text <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="w-px h-5 bg-gray-700 mx-1" />
                        {/* Formatting buttons */}
                        <button type="button" className="p-2 text-white rounded hover:bg-white/10"><Bold className="w-4 h-4" /></button>
                        <button type="button" className="p-2 text-white rounded hover:bg-white/10"><Italic className="w-4 h-4" /></button>
                        <button type="button" className="p-2 text-white rounded hover:bg-white/10"><Underline className="w-4 h-4" /></button>
                        <button type="button" className="p-2 text-white rounded hover:bg-white/10"><Strikethrough className="w-4 h-4" /></button>
                        <button type="button" className="p-2 text-white rounded hover:bg-white/10"><Quote className="w-4 h-4" /></button>
                        <div className="w-px h-5 bg-gray-700 mx-1" />
                        <button type="button" className="p-2 text-white rounded hover:bg-white/10"><Link2 className="w-4 h-4" /></button>
                        <button type="button" className="p-2 text-white rounded hover:bg-white/10"><Image className="w-4 h-4" /></button>
                        <button type="button" className="p-2 text-white rounded hover:bg-white/10"><Video className="w-4 h-4" /></button>
                        <button type="button" className="p-2 text-white rounded hover:bg-white/10"><Music className="w-4 h-4" /></button>
                        <div className="w-px h-5 bg-gray-700 mx-1" />
                        <button type="button" className="px-3 py-1.5 text-white text-sm rounded hover:bg-white/10 flex items-center gap-1">
                          Insert <ChevronDown className="w-3 h-3" />
                        </button>
                        {/* Undo/Redo on right */}
                        <div className="ml-auto flex items-center gap-1">
                          <button type="button" className="p-2 text-white/60 rounded hover:bg-white/10"><Undo className="w-4 h-4" /></button>
                          <button type="button" className="p-2 text-white/60 rounded hover:bg-white/10"><Redo className="w-4 h-4" /></button>
                        </div>
                      </div>
                      {/* Text area */}
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your product..."
                        rows={6}
                        className="border-0 rounded-none text-base resize-none focus:ring-0 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                  
                  {/* Categories */}
                  <div>
                    <Label className="text-base font-medium text-gray-900 mb-2 block">
                      Categories
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium border transition-colors",
                            categoryIds.includes(cat.id)
                              ? "bg-pink-500 text-white border-pink-500"
                              : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
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
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Summary */}
                <div className="lg:col-span-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Final Touches
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Add images and configure settings.
                  </p>
                  
                  {/* Summary Card */}
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-4">
                    <div className="flex items-center gap-3">
                      <SelectedIcon className="w-8 h-8" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Type</p>
                        <p className="font-medium text-gray-900">{selectedType.name}</p>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs text-gray-500 uppercase font-medium">Product</p>
                      <p className="font-medium text-gray-900">{name || 'Untitled'}</p>
                      <p className="text-2xl font-semibold text-gray-900">${price || '0'}</p>
                    </div>
                    {tags.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-xs text-gray-500 uppercase font-medium mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <Badge key={tag} className="bg-pink-500 text-white border-0 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right: Settings */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Images */}
                  <div>
                    <Label className="text-base font-medium text-gray-900 mb-2 block">
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
                    <Label className="text-base font-medium text-gray-900 mb-2 block">
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="gap-1.5 pr-1.5 bg-pink-500 text-white border-0"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 p-0.5 rounded-full hover:bg-white/20"
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
                      className="rounded-md border border-gray-300 mb-3 focus:border-pink-500 transition-colors"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {popularTags.filter(t => !tags.includes(t)).slice(0, 6).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddTag(tag)}
                          className="text-xs px-3 py-1.5 border border-gray-300 hover:border-pink-500 hover:bg-pink-500 hover:text-white rounded-md text-gray-600 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Settings */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-200">
                      <div>
                        <p className="font-medium text-sm text-gray-900">Available for purchase</p>
                        <p className="text-xs text-gray-500">Show this product in your store</p>
                      </div>
                      <Switch
                        checked={isAvailable}
                        onCheckedChange={setIsAvailable}
                        className="data-[state=checked]:bg-pink-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-200">
                      <div>
                        <p className="font-medium text-sm text-gray-900">Allow chat</p>
                        <p className="text-xs text-gray-500">Let buyers message you</p>
                      </div>
                      <Switch
                        checked={chatAllowed}
                        onCheckedChange={setChatAllowed}
                        className="data-[state=checked]:bg-pink-500"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-200">
                      <div>
                        <p className="font-medium text-sm text-gray-900">Require email</p>
                        <p className="text-xs text-gray-500">Ask buyers for their email</p>
                      </div>
                      <Switch
                        checked={requiresEmail}
                        onCheckedChange={setRequiresEmail}
                        className="data-[state=checked]:bg-pink-500"
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
