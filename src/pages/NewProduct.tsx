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
import { ArrowLeft, ArrowRight, Loader2, X, Check, Bold, Italic, Underline, Strikethrough, Quote, Link2, Image, Video, Music, ChevronDown, Undo, Redo, Package } from 'lucide-react';
import ProductTypeSelector from '@/components/seller/ProductTypeSelector';
import MultiImageUploader from '@/components/seller/MultiImageUploader';
import FileContentUploader from '@/components/seller/FileContentUploader';
import LessonBuilder from '@/components/seller/LessonBuilder';
import AvailabilityEditor from '@/components/seller/AvailabilityEditor';
import { ProductTypeId, getProductTypeById } from '@/components/icons/ProductTypeIcons';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
}

interface FileItem {
  id?: string;
  title: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  content_type: 'file' | 'link';
  external_link?: string;
  is_preview: boolean;
  display_order: number;
}

interface Lesson {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  video_duration?: number;
  content_html: string;
  attachments: { url: string; name: string; size: number }[];
  display_order: number;
  is_free_preview: boolean;
}

interface TimeSlot {
  day: string;
  start: string;
  end: string;
  enabled: boolean;
}

// Consolidated to 2 steps
const STEPS = [
  { id: 1, title: 'Type', description: 'What are you selling?' },
  { id: 2, title: 'Details', description: 'Everything about your product' },
];

const popularTags = ['Digital', 'Premium', 'Instant Delivery', 'Lifetime', 'Subscription', 'API', 'Software', 'Course', 'Template', 'E-book'];

// Product types that support instant downloads
const INSTANT_DOWNLOAD_TYPES = ['digital_product', 'ebook', 'template', 'graphics', 'audio', 'video', 'software'];
const COURSE_TYPES = ['course'];
const MEMBERSHIP_TYPES = ['membership'];
const CALL_TYPES = ['call'];
const SERVICE_TYPES = ['service', 'commission'];
const TIP_TYPES = ['coffee'];
const BUNDLE_TYPES = ['bundle'];

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
  
  // PWYW (Pay What You Want) state
  const [isPwyw, setIsPwyw] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  
  // Pre-order state
  const [isPreorder, setIsPreorder] = useState(false);
  const [releaseDate, setReleaseDate] = useState('');
  const [preorderMessage, setPreorderMessage] = useState('');
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
        // PWYW fields
        is_pwyw: isPwyw,
        min_price: isPwyw ? (parseFloat(minPrice) || 0) : 0,
        // Pre-order fields
        is_preorder: isPreorder,
        release_date: isPreorder && releaseDate ? new Date(releaseDate).toISOString() : null,
        preorder_message: isPreorder ? preorderMessage.trim() || null : null,
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
                className="rounded-md bg-black hover:bg-black/90 text-white px-6"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={submitting || !canProceed()}
                className="rounded-md bg-black hover:bg-black/90 text-white px-6"
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
                      ? "bg-black text-white"
                      : currentStep === step.id
                        ? "bg-white text-gray-900 border-2 border-black"
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
                    currentStep > step.id ? "bg-black" : "bg-gray-200"
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
                    <div className="p-4 rounded-md border border-black/20 bg-gray-50">
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

          {/* Step 2: ALL Details (Consolidated) */}
          {currentStep === 2 && (
            <div className="p-6 lg:p-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Preview */}
                <div className="lg:col-span-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Product Details
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Fill in all the details about your product.
                  </p>
                  
                  {/* Summary Card */}
                  <div className="p-4 bg-gray-50 rounded-md border border-black/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <SelectedIcon className="w-8 h-8" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Type</p>
                        <p className="font-medium text-gray-900">{selectedType.name}</p>
                      </div>
                    </div>
                    <div className="border-t border-black/10 pt-4">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Product</p>
                      <p className="font-medium text-gray-900">{name || 'Untitled'}</p>
                      <p className="text-2xl font-bold text-black">${price || '0'}</p>
                    </div>
                    {images.length > 0 && (
                      <div className="border-t border-black/10 pt-4">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-2">Preview</p>
                        <div className="aspect-square rounded-md overflow-hidden bg-gray-100">
                          <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    {tags.length > 0 && (
                      <div className="border-t border-black/10 pt-4">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <Badge key={tag} className="bg-black text-white border-0 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right: Form */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* SECTION 1: Images (FIRST) */}
                  <div>
                    <Label className="text-sm font-bold text-black uppercase tracking-wide mb-3 block">
                      Product Images
                    </Label>
                    <MultiImageUploader
                      images={images}
                      onChange={setImages}
                      maxImages={5}
                    />
                  </div>
                  
                  <div className="border-t border-black/10" />
                  
                  {/* SECTION 2: Basic Info */}
                  <div className="space-y-5">
                    <div>
                      <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
                        Name
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Ultimate Design Bundle"
                        className="w-full px-4 py-3 bg-white border-2 border-[#e673b3] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e673b3] focus:ring-opacity-20 transition-all text-gray-900"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
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
                            className="rounded-lg border-2 border-black/10 h-12 text-base pl-8 focus:border-black focus:ring-0 focus:ring-offset-0 focus:outline-none transition-colors bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
                          Stock
                        </Label>
                        <Input
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="Unlimited"
                          min="0"
                          className="rounded-lg border-2 border-black/10 h-12 text-base focus:border-black focus:ring-0 focus:ring-offset-0 focus:outline-none transition-colors bg-white"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-black/10" />
                  
                  {/* SECTION 3: Description */}
                  <div>
                    <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
                      Description
                    </Label>
                    <div className="border-2 border-black rounded-lg overflow-hidden bg-white shadow-sm">
                      {/* Black toolbar */}
                      <div className="bg-black text-white px-4 py-2 flex items-center flex-wrap gap-2 sm:gap-4 select-none">
                        {/* Format dropdown */}
                        <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-800 px-2 py-1 rounded transition-colors">
                          <span className="text-sm font-medium">Text</span>
                          <ChevronDown size={14} />
                        </div>
                        <div className="h-4 w-[1px] bg-gray-600 mx-1" />
                        {/* Formatting buttons */}
                        <div className="flex items-center gap-3">
                          <button type="button" className="hover:bg-gray-800 p-1 rounded transition-colors"><Bold size={18} /></button>
                          <button type="button" className="hover:bg-gray-800 p-1 rounded transition-colors"><Italic size={18} /></button>
                          <button type="button" className="hover:bg-gray-800 p-1 rounded transition-colors"><Underline size={18} /></button>
                          <button type="button" className="hover:bg-gray-800 p-1 rounded transition-colors"><Strikethrough size={18} /></button>
                          <button type="button" className="hover:bg-gray-800 p-1 rounded transition-colors"><Quote size={18} /></button>
                        </div>
                        <div className="h-4 w-[1px] bg-gray-600 mx-1" />
                        <div className="flex items-center gap-3">
                          <button type="button" className="hover:bg-gray-800 p-1 rounded transition-colors"><Link2 size={18} /></button>
                          <button type="button" className="hover:bg-gray-800 p-1 rounded transition-colors"><Image size={18} /></button>
                          <button type="button" className="hover:bg-gray-800 p-1 rounded transition-colors"><Video size={18} /></button>
                          <button type="button" className="hover:bg-gray-800 p-1 rounded transition-colors"><Music size={18} /></button>
                        </div>
                        <div className="h-4 w-[1px] bg-gray-600 mx-1" />
                        {/* Insert dropdown */}
                        <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-800 px-2 py-1 rounded transition-colors">
                          <span className="text-sm font-medium">Insert</span>
                          <ChevronDown size={14} />
                        </div>
                        {/* Undo/Redo on right */}
                        <div className="ml-auto flex items-center gap-3">
                          <button type="button" className="hover:bg-gray-800 p-1 rounded transition-colors text-white/60"><Undo size={18} /></button>
                          <button type="button" className="hover:bg-gray-800 p-1 rounded transition-colors text-white/60"><Redo size={18} /></button>
                        </div>
                      </div>
                      {/* Text area */}
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your product..."
                        className="w-full h-48 p-4 focus:outline-none resize-none text-gray-800 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-black/10" />
                  
                  {/* SECTION 4: Tags */}
                  <div>
                    <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="gap-1.5 pr-1.5 bg-black text-white border-0"
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
                      className="rounded-lg border-2 border-black/10 h-11 mb-3 focus:border-black focus:ring-0 transition-colors bg-white"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {popularTags.filter(t => !tags.includes(t)).slice(0, 6).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddTag(tag)}
                          className="text-xs px-3 py-1.5 border border-black/20 hover:border-black hover:bg-black hover:text-white rounded-md text-gray-600 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-black/10" />
                  
                  {/* SECTION 5: Categories */}
                  <div>
                    <Label className="text-sm font-bold text-black uppercase tracking-wide mb-2 block">
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
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-600 border-black/20 hover:border-black"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-black/10" />
                  
                  {/* SECTION 6: Pricing Options */}
                  <div>
                    <Label className="text-sm font-bold text-black uppercase tracking-wide mb-3 block">
                      Pricing Options
                    </Label>
                    <div className="space-y-3">
                      {/* Pay What You Want */}
                      <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-md border border-pink-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm text-gray-900">Pay What You Want</p>
                            <p className="text-xs text-gray-500">Let buyers choose their price</p>
                          </div>
                          <Switch
                            checked={isPwyw}
                            onCheckedChange={setIsPwyw}
                            className="data-[state=checked]:bg-pink-500"
                          />
                        </div>
                        {isPwyw && (
                          <div className="pt-2 border-t border-pink-200">
                            <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                              Minimum Price
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                              <Input
                                type="number"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                className="h-10 pl-8 rounded-md border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">
                              Buyers can pay ${minPrice || '0'} or more
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Pre-order */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm text-gray-900">Pre-order</p>
                            <p className="text-xs text-gray-500">Accept orders before product is ready</p>
                          </div>
                          <Switch
                            checked={isPreorder}
                            onCheckedChange={setIsPreorder}
                            className="data-[state=checked]:bg-blue-500"
                          />
                        </div>
                        {isPreorder && (
                          <div className="pt-2 border-t border-blue-200 space-y-3">
                            <div>
                              <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                Release Date
                              </Label>
                              <Input
                                type="date"
                                value={releaseDate}
                                onChange={(e) => setReleaseDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="h-10 rounded-md border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                Pre-order Message (optional)
                              </Label>
                              <Input
                                value={preorderMessage}
                                onChange={(e) => setPreorderMessage(e.target.value)}
                                placeholder="e.g., Expected delivery: March 2026"
                                className="h-10 rounded-md border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-black/10" />
                  
                  {/* SECTION 7: Settings */}
                  <div>
                    <Label className="text-sm font-bold text-black uppercase tracking-wide mb-3 block">
                      Settings
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-black/10">
                        <div>
                          <p className="font-medium text-sm text-gray-900">Available for purchase</p>
                          <p className="text-xs text-gray-500">Show this product in your store</p>
                        </div>
                        <Switch
                          checked={isAvailable}
                          onCheckedChange={setIsAvailable}
                          className="data-[state=checked]:bg-black"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-black/10">
                        <div>
                          <p className="font-medium text-sm text-gray-900">Allow chat</p>
                          <p className="text-xs text-gray-500">Let buyers message you</p>
                        </div>
                        <Switch
                          checked={chatAllowed}
                          onCheckedChange={setChatAllowed}
                          className="data-[state=checked]:bg-black"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-black/10">
                        <div>
                          <p className="font-medium text-sm text-gray-900">Require email</p>
                          <p className="text-xs text-gray-500">Ask buyers for their email</p>
                        </div>
                        <Switch
                          checked={requiresEmail}
                          onCheckedChange={setRequiresEmail}
                          className="data-[state=checked]:bg-black"
                        />
                      </div>
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
