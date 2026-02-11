import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, X, Check, Package } from 'lucide-react';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ProductTypeSelector from '@/components/seller/ProductTypeSelector';
import MultiImageUploader from '@/components/seller/MultiImageUploader';
import FileContentUploader from '@/components/seller/FileContentUploader';
import LessonBuilder from '@/components/seller/LessonBuilder';
import AvailabilityEditor from '@/components/seller/AvailabilityEditor';
import { ProductTypeId, getProductTypeById } from '@/components/icons/ProductTypeIcons';
import { cn } from '@/lib/utils';
import CardCustomizer from '@/components/seller/CardCustomizer';
import { CardSettings } from '@/components/marketplace/card-types';

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
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const isEditMode = !!productId;
  const { profile, refreshProducts } = useSellerContext();
  const [currentStep, setCurrentStep] = useState(isEditMode ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(isEditMode || !!duplicateId);
  
  // Form state
  const [productType, setProductType] = useState<ProductTypeId>('digital_product');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
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

  // Content state (files, lessons, availability)
  const [files, setFiles] = useState<FileItem[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [callDuration, setCallDuration] = useState(30);

  // Card appearance overrides
  const [cardOverrides, setCardOverrides] = useState<Partial<CardSettings>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  // Load product data for edit or duplicate mode
  useEffect(() => {
    const loadId = productId || duplicateId;
    if (!loadId) return;
    
    const loadProduct = async () => {
      setLoadingProduct(true);
      const { data, error } = await supabase
        .from('seller_products')
        .select('*')
        .eq('id', loadId)
        .single();
      
      if (error || !data) {
        toast.error('Failed to load product');
        navigate('/seller/products');
        return;
      }
      
      setProductType((data as any).product_type || 'digital_product');
      setName(duplicateId ? `${data.name} (Copy)` : data.name);
      setDescription(data.description || '');
      setPrice(String(data.price || ''));
      setOriginalPrice(String((data as any).original_price || ''));
      setStock(String(data.stock || ''));
      setCategoryIds((data as any).category_ids || (data.category_id ? [data.category_id] : []));
      setTags((data as any).tags || []);
      setImages((data as any).images || []);
      setIsAvailable(data.is_available);
      setChatAllowed(data.chat_allowed !== false);
      setIsPwyw((data as any).is_pwyw || false);
      setMinPrice(String((data as any).min_price || ''));
      setIsPreorder((data as any).is_preorder || false);
      setReleaseDate((data as any).release_date ? new Date((data as any).release_date).toISOString().split('T')[0] : '');
      setPreorderMessage((data as any).preorder_message || '');
      setRequiresEmail((data as any).requires_email || false);

      // Load content data (files, lessons)
      const { data: contentData } = await supabase
        .from('product_content')
        .select('*')
        .eq('product_id', loadId)
        .order('display_order');

      if (contentData) {
        const fileItems: FileItem[] = contentData
          .filter((c: any) => c.content_type === 'file' || c.content_type === 'link')
          .map((c: any) => ({
            id: c.id,
            title: c.title || c.file_name || '',
            file_url: c.file_url || '',
            file_name: c.file_name || '',
            file_size: c.file_size || 0,
            file_type: c.file_type || '',
            content_type: c.content_type as 'file' | 'link',
            external_link: c.external_link || '',
            is_preview: c.is_preview || false,
            display_order: c.display_order || 0,
          }));
        if (fileItems.length > 0) setFiles(fileItems);
      }

      // Load lessons from course_lessons table
      const { data: lessonData } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('product_id', loadId)
        .order('display_order');

      if (lessonData && lessonData.length > 0) {
        setLessons(lessonData.map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description || '',
          video_url: l.video_url || '',
          video_duration: l.video_duration,
          content_html: l.content_html || '',
          attachments: (l.attachments as any[]) || [],
          display_order: l.display_order || 0,
          is_free_preview: l.is_free_preview || false,
        })));
      }

      // Load availability from product_metadata
      const metadata = (data as any).product_metadata || {};
      if (metadata.time_slots) setTimeSlots(metadata.time_slots);
      if (metadata.call_duration) setCallDuration(metadata.call_duration);
      if (metadata.card_overrides) setCardOverrides(metadata.card_overrides);
      
      setLoadingProduct(false);
    };
    
    loadProduct();
  }, [productId, duplicateId]);

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

  const buildProductData = (isDraft: boolean) => {
    const primaryImage = images.length > 0 ? images[0] : null;
    return {
      seller_id: profile.id,
      name: name.trim(),
      description: description.trim() || null,
      price: parseFloat(price) || 0,
      original_price: originalPrice ? (parseFloat(originalPrice) || null) : null,
      stock: parseInt(stock) || 0,
      category_id: categoryIds[0] || null,
      category_ids: categoryIds,
      tags,
      icon_url: primaryImage,
      images,
      is_available: isDraft ? false : isAvailable,
      is_approved: false, // Always reset to pending on create/edit
      chat_allowed: chatAllowed,
      requires_email: requiresEmail,
      product_type: productType,
      product_metadata: ((() => {
        const meta: Record<string, any> = {};
        if (CALL_TYPES.includes(productType)) {
          meta.time_slots = timeSlots;
          meta.call_duration = callDuration;
        }
        if (Object.keys(cardOverrides).length > 0) {
          meta.card_overrides = cardOverrides;
        }
        return JSON.parse(JSON.stringify(meta));
      })()) as any,
      is_pwyw: isPwyw,
      min_price: isPwyw ? (parseFloat(minPrice) || 0) : 0,
      is_preorder: isPreorder,
      release_date: isPreorder && releaseDate ? new Date(releaseDate).toISOString() : null,
      preorder_message: isPreorder ? preorderMessage.trim() || null : null,
    };
  };

  const saveProduct = async (isDraft: boolean) => {
    if (!name.trim() || !price) {
      toast.error('Name and price are required');
      return;
    }

    setSubmitting(true);
    try {
      const productData = buildProductData(isDraft);
      let savedProductId = productId;

      if (isEditMode && productId) {
        const { error } = await supabase
          .from('seller_products')
          .update(productData)
          .eq('id', productId);
        if (error) throw error;
      } else {
        const { data: insertedProduct, error } = await supabase
          .from('seller_products')
          .insert(productData)
          .select('id')
          .single();
        if (error) throw error;
        savedProductId = insertedProduct.id;
      }

      // Save files to product_content
      if (savedProductId && INSTANT_DOWNLOAD_TYPES.includes(productType) && files.length > 0) {
        if (isEditMode) {
          await supabase.from('product_content').delete().eq('product_id', savedProductId).in('content_type', ['file', 'link']);
        }
        const contentRows = files.map((f, i) => ({
          product_id: savedProductId!,
          content_type: f.content_type,
          title: f.title,
          file_url: f.file_url || null,
          file_name: f.file_name || null,
          file_size: f.file_size || null,
          file_type: f.file_type || null,
          external_link: f.external_link || null,
          is_preview: f.is_preview,
          display_order: i,
        }));
        await supabase.from('product_content').insert(contentRows);
      }

      // Save lessons to course_lessons
      if (savedProductId && COURSE_TYPES.includes(productType) && lessons.length > 0) {
        if (isEditMode) {
          await supabase.from('course_lessons').delete().eq('product_id', savedProductId);
        }
        const lessonRows = lessons.map((l, i) => ({
          product_id: savedProductId!,
          title: l.title,
          description: l.description || null,
          video_url: l.video_url || null,
          video_duration: l.video_duration || null,
          content_html: l.content_html || null,
          attachments: l.attachments || [],
          display_order: i,
          is_free_preview: l.is_free_preview,
        }));
        await supabase.from('course_lessons').insert(lessonRows);
      }

      if (isDraft) {
        toast.success('Product saved as draft!');
      } else {
        toast.success(isEditMode ? 'Product updated! Sent for review.' : 'Product created! Awaiting approval.');
      }
      refreshProducts();
      navigate('/seller/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => saveProduct(false);
  const handleSaveDraft = () => saveProduct(true);

  const selectedType = getProductTypeById(productType);
  const SelectedIcon = selectedType.Icon;
  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-[#f4f4f0] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
              <h1 className="font-semibold text-xl text-gray-900">{isEditMode ? 'Edit Product' : 'New Product'}</h1>
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
              <>
                <Button 
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={submitting || !canProceed()}
                  className="rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 px-5"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Package className="w-4 h-4 mr-2" />
                  )}
                  Save as Draft
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={submitting || !canProceed()}
                  className="rounded-md bg-black hover:bg-black/90 text-white px-6"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditMode ? 'Saving...' : 'Publishing...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {isEditMode ? 'Save & Submit for Review' : 'Publish'}
                    </>
                  )}
                </Button>
              </>
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
        <div className="bg-white rounded border">
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
                    <div className="p-6 rounded border bg-gray-50">
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
                  <div className="p-6 bg-gray-50 rounded border space-y-4">
                    <div className="flex items-center gap-3">
                      <SelectedIcon className="w-8 h-8" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Type</p>
                        <p className="font-medium text-gray-900">{selectedType.name}</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Product</p>
                      <p className="font-medium text-gray-900">{name || 'Untitled'}</p>
                      <p className="text-2xl font-bold text-black">${price || '0'}</p>
                    </div>
                    {images.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-2">Preview</p>
                        <div className="aspect-square rounded-md overflow-hidden bg-gray-100">
                          <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    {tags.length > 0 && (
                      <div className="border-t pt-4">
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
                    <Label className="text-base text-slate-700 mb-3 block">
                      Product Images
                    </Label>
                    <MultiImageUploader
                      images={images}
                      onChange={setImages}
                      maxImages={5}
                    />
                  </div>
                  
                  <div className="border-t" />
                  
                  {/* SECTION 2: Basic Info */}
                  <div className="space-y-5">
                    <div>
                      <Label className="text-base text-slate-700 mb-2 block">
                        Name
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Ultimate Design Bundle"
                        className="w-full px-4 py-3 bg-white border rounded h-12 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all text-slate-900"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-base text-slate-700 mb-2 block">
                          Price
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                          <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="rounded border h-12 text-base pl-8 focus:ring-1 focus:ring-slate-400 focus:outline-none transition-colors bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-base text-slate-700 mb-2 block">
                          Compare-at Price
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                          <Input
                            type="number"
                            value={originalPrice}
                            onChange={(e) => setOriginalPrice(e.target.value)}
                            placeholder="Optional"
                            min="0"
                            step="0.01"
                            className="rounded border h-12 text-base pl-8 focus:ring-1 focus:ring-slate-400 focus:outline-none transition-colors bg-white"
                          />
                        </div>
                        {originalPrice && parseFloat(originalPrice) > 0 && parseFloat(price) > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            {Math.round((1 - parseFloat(price) / parseFloat(originalPrice)) * 100)}% off
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-base text-slate-700 mb-2 block">
                          Stock
                        </Label>
                        <Input
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="Unlimited"
                          min="0"
                          className="rounded border h-12 text-base focus:ring-1 focus:ring-slate-400 focus:outline-none transition-colors bg-white"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t" />
                  
                  {/* SECTION 3: Description */}
                  <div>
                    <Label className="text-base text-slate-700 mb-2 block">
                      Description
                    </Label>
                    <RichTextEditor
                      value={description}
                      onChange={setDescription}
                      placeholder="Describe your product..."
                    />
                  </div>
                  
                  {/* SECTION 3.5: Content/Files (type-specific) */}
                  {INSTANT_DOWNLOAD_TYPES.includes(productType) && (
                    <>
                      <div className="border-t" />
                      <div>
                        <Label className="text-base text-slate-700 mb-3 block">
                          Product Files
                        </Label>
                        <p className="text-sm text-slate-500 mb-3">
                          Upload the files buyers will receive after purchase
                        </p>
                        <FileContentUploader
                          files={files}
                          onChange={setFiles}
                          sellerId={profile?.id || ''}
                          maxFiles={20}
                        />
                      </div>
                    </>
                  )}
                  
                  {COURSE_TYPES.includes(productType) && (
                    <>
                      <div className="border-t" />
                      <div>
                        <Label className="text-base text-slate-700 mb-3 block">
                          Course Lessons
                        </Label>
                        <p className="text-sm text-slate-500 mb-3">
                          Build your course curriculum
                        </p>
                        <LessonBuilder
                          lessons={lessons}
                          onChange={setLessons}
                          sellerId={profile?.id || ''}
                        />
                      </div>
                    </>
                  )}

                  {CALL_TYPES.includes(productType) && (
                    <>
                      <div className="border-t" />
                      <div>
                        <Label className="text-base text-slate-700 mb-3 block">
                          Availability
                        </Label>
                        <p className="text-sm text-slate-500 mb-3">
                          Set your available time slots for calls
                        </p>
                        <AvailabilityEditor
                          slots={timeSlots}
                          onChange={setTimeSlots}
                          duration={callDuration}
                          onDurationChange={setCallDuration}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="border-t" />
                  
                  {/* SECTION 4: Tags */}
                  <div>
                    <Label className="text-base text-slate-700 mb-2 block">
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
                      className="rounded border h-11 mb-3 focus:ring-1 focus:ring-slate-400 transition-colors bg-white"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {popularTags.filter(t => !tags.includes(t)).slice(0, 6).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddTag(tag)}
                          className="text-xs px-3 py-1.5 border hover:border-slate-400 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t" />
                  
                  {/* SECTION 5: Categories */}
                  <div>
                    <Label className="text-base text-slate-700 mb-2 block">
                      Categories
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={cn(
                            "px-4 py-2 rounded text-sm font-medium border transition-colors",
                            categoryIds.includes(cat.id)
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t" />
                  
                  {/* SECTION 6: Pricing Options */}
                  <div>
                    <Label className="text-base text-slate-700 mb-3 block">
                      Pricing Options
                    </Label>
                    <div className="space-y-3">
                      {/* Pay What You Want */}
                      <div className="p-6 bg-white rounded border">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm text-slate-900">Pay What You Want</p>
                            <p className="text-xs text-slate-500">Let buyers choose their price</p>
                          </div>
                          <Switch
                            checked={isPwyw}
                            onCheckedChange={setIsPwyw}
                            className="data-[state=checked]:bg-slate-900"
                          />
                        </div>
                        {isPwyw && (
                          <div className="pt-3 border-t">
                            <Label className="text-xs font-medium text-slate-700 mb-1.5 block">
                              Minimum Price
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                              <Input
                                type="number"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                className="h-10 pl-8 rounded border focus:ring-1 focus:ring-slate-400"
                              />
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5">
                              Buyers can pay ${minPrice || '0'} or more
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Pre-order */}
                      <div className="p-6 bg-white rounded border">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm text-slate-900">Pre-order</p>
                            <p className="text-xs text-slate-500">Accept orders before product is ready</p>
                          </div>
                          <Switch
                            checked={isPreorder}
                            onCheckedChange={setIsPreorder}
                            className="data-[state=checked]:bg-slate-900"
                          />
                        </div>
                        {isPreorder && (
                          <div className="pt-3 border-t space-y-3">
                            <div>
                              <Label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                Release Date
                              </Label>
                              <Input
                                type="date"
                                value={releaseDate}
                                onChange={(e) => setReleaseDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="h-10 rounded border focus:ring-1 focus:ring-slate-400"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                Pre-order Message (optional)
                              </Label>
                              <Input
                                value={preorderMessage}
                                onChange={(e) => setPreorderMessage(e.target.value)}
                                placeholder="e.g., Expected delivery: March 2026"
                                className="h-10 rounded border focus:ring-1 focus:ring-slate-400"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t" />
                  
                  {/* SECTION 6.5: Card Appearance */}
                  <div>
                    <Label className="text-base text-slate-700 mb-3 block">
                      Card Appearance
                    </Label>
                    <p className="text-sm text-slate-500 mb-3">
                      Customize how this product card looks in your store
                    </p>
                    <CardCustomizer
                      settings={cardOverrides}
                      onChange={setCardOverrides}
                      mode="product"
                    />
                  </div>

                  <div className="border-t" />
                  <div>
                    <Label className="text-base text-slate-700 mb-3 block">
                      Settings
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded border">
                        <div>
                          <p className="font-medium text-sm text-slate-900">Available for purchase</p>
                          <p className="text-xs text-slate-500">Show this product in your store</p>
                        </div>
                        <Switch
                          checked={isAvailable}
                          onCheckedChange={setIsAvailable}
                          className="data-[state=checked]:bg-slate-900"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded border">
                        <div>
                          <p className="font-medium text-sm text-slate-900">Allow chat</p>
                          <p className="text-xs text-slate-500">Let buyers message you</p>
                        </div>
                        <Switch
                          checked={chatAllowed}
                          onCheckedChange={setChatAllowed}
                          className="data-[state=checked]:bg-slate-900"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded border">
                        <div>
                          <p className="font-medium text-sm text-slate-900">Require email</p>
                          <p className="text-xs text-slate-500">Ask buyers for their email</p>
                        </div>
                        <Switch
                          checked={requiresEmail}
                          onCheckedChange={setRequiresEmail}
                          className="data-[state=checked]:bg-slate-900"
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
