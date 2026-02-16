import { useState, useEffect, useCallback, useRef } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { 
  Plus, Trash2, GripVertical, Eye, EyeOff, Settings, Palette, 
  Save, Loader2, ChevronDown, ChevronUp, Smartphone, Monitor, Undo2, Redo2, Rocket
} from 'lucide-react';
import { StoreSection, SectionType, GlobalStyles, SECTION_LABELS, DEFAULT_SECTION_SETTINGS, StoreDesign } from './store-builder/types';
import StoreBuilderSections from './store-builder/StoreBuilderSections';
import StoreBuilderSectionRenderer from './store-builder/StoreBuilderSectionRenderer';
import { THEME_PRESETS } from './store-builder/StoreThemePresets';

const StoreBuilder = () => {
  const { profile } = useSellerContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [designId, setDesignId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [themePreset, setThemePreset] = useState('minimal-white');
  const [globalStyles, setGlobalStyles] = useState<GlobalStyles>({
    primaryColor: '#000000', secondaryColor: '#ffffff', backgroundColor: '#ffffff', textColor: '#111111', fontFamily: 'Inter'
  });
  const [sections, setSections] = useState<StoreSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showGlobalStyles, setShowGlobalStyles] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // Load design
  useEffect(() => {
    if (profile?.id) {
      loadDesign();
      loadProducts();
    }
  }, [profile?.id]);

  const loadDesign = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('store_designs')
      .select('*')
      .eq('seller_id', profile.id)
      .maybeSingle();

    if (data) {
      setDesignId(data.id);
      setIsActive(data.is_active);
      setThemePreset(data.theme_preset || 'minimal-white');
      setGlobalStyles(data.global_styles as unknown as GlobalStyles);
      setSections((data.sections as unknown as StoreSection[]) || []);
    }
    setLoading(false);
  };

  const loadProducts = async () => {
    if (!profile?.id) return;
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('seller_products').select('id, name, price, icon_url, category_id, sold_count').eq('seller_id', profile.id).eq('is_available', true).eq('is_approved', true),
      supabase.from('categories').select('id, name, icon, color').eq('is_active', true),
    ]);
    if (prods) setProducts(prods);
    if (cats) setCategories(cats);
  };

  // Auto-save
  useEffect(() => {
    if (hasChanges) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => saveDesign(), 2000);
    }
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [hasChanges, sections, globalStyles, themePreset, isActive]);

  const saveDesign = async () => {
    if (!profile?.id) return;
    setSaving(true);
    const payload = {
      seller_id: profile.id,
      is_active: isActive,
      theme_preset: themePreset,
      global_styles: globalStyles as unknown as Record<string, any>,
      sections: sections as unknown as Record<string, any>[],
    };

    if (designId) {
      const { error } = await supabase.from('store_designs').update(payload).eq('id', designId);
      if (error) toast.error('Failed to save');
      else { toast.success('Saved'); setHasChanges(false); }
    } else {
      const { data, error } = await supabase.from('store_designs').insert(payload).select('id').single();
      if (error) toast.error('Failed to save');
      else { setDesignId(data.id); toast.success('Saved'); setHasChanges(false); }
    }
    setSaving(false);
  };

  const markChanged = () => setHasChanges(true);

  // Section CRUD
  const addSection = (type: SectionType) => {
    const newSection: StoreSection = {
      id: `sec_${Math.random().toString(36).slice(2, 9)}`,
      type,
      order: sections.length,
      visible: true,
      settings: { ...DEFAULT_SECTION_SETTINGS[type] },
    };
    setSections(prev => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    setShowAddMenu(false);
    markChanged();
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })));
    if (selectedSectionId === id) setSelectedSectionId(null);
    markChanged();
  };

  const toggleVisibility = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
    markChanged();
  };

  const updateSectionSettings = (id: string, updates: Record<string, any>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, settings: { ...s.settings, ...updates } } : s));
    markChanged();
  };

  // Drag and drop
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newSections = [...sections];
    const [moved] = newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, moved);
    setSections(newSections.map((s, i) => ({ ...s, order: i })));
    setDraggedIndex(index);
    markChanged();
  };
  const handleDragEnd = () => setDraggedIndex(null);

  // Theme preset apply
  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setGlobalStyles(preset.globalStyles);
    setSections(preset.sections.map((s, i) => ({ ...s, id: `sec_${Math.random().toString(36).slice(2, 9)}`, order: i })));
    setThemePreset(presetId);
    setSelectedSectionId(null);
    markChanged();
  };

  const publishDesign = async () => {
    setIsActive(true);
    markChanged();
    // Force immediate save
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    setSaving(true);
    const payload = {
      seller_id: profile?.id!,
      is_active: true,
      theme_preset: themePreset,
      global_styles: globalStyles as unknown as Record<string, any>,
      sections: sections as unknown as Record<string, any>[],
    };
    if (designId) {
      await supabase.from('store_designs').update(payload).eq('id', designId);
    } else {
      const { data } = await supabase.from('store_designs').insert(payload).select('id').single();
      if (data) setDesignId(data.id);
    }
    setSaving(false);
    setHasChanges(false);
    toast.success('🚀 Store design published!');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold">Store Builder</h2>
          {hasChanges && <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 animate-pulse">Unsaved</Badge>}
          {saving && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded ${previewMode === 'desktop' ? 'bg-gray-100' : ''}`}><Monitor className="w-4 h-4" /></button>
          <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded ${previewMode === 'mobile' ? 'bg-gray-100' : ''}`}><Smartphone className="w-4 h-4" /></button>
          <Button variant="outline" size="sm" onClick={() => saveDesign()} disabled={saving}><Save className="w-3.5 h-3.5 mr-1" />Save</Button>
          <Button size="sm" onClick={publishDesign} className="bg-emerald-600 hover:bg-emerald-700"><Rocket className="w-3.5 h-3.5 mr-1" />Publish</Button>
        </div>
      </div>

      {/* Builder */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Builder */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <div className="h-full overflow-y-auto bg-gray-50">
            {/* Theme Presets */}
            <div className="p-3 border-b">
              <button onClick={() => setShowGlobalStyles(!showGlobalStyles)} className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" />Theme & Styles</span>
                {showGlobalStyles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showGlobalStyles && (
                <div className="mt-3 space-y-3">
                  {/* Preset Picker */}
                  <div>
                    <Label className="text-xs">Theme Preset</Label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      {THEME_PRESETS.map(p => (
                        <button key={p.id} onClick={() => applyPreset(p.id)} className={`text-left p-2 rounded-lg border text-xs transition-all ${themePreset === p.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <span className="text-lg">{p.thumbnail}</span>
                          <div className="font-medium mt-0.5">{p.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Global Colors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Primary</Label><Input type="color" value={globalStyles.primaryColor} onChange={e => { setGlobalStyles(p => ({ ...p, primaryColor: e.target.value })); markChanged(); }} className="h-8" /></div>
                    <div><Label className="text-xs">Secondary</Label><Input type="color" value={globalStyles.secondaryColor} onChange={e => { setGlobalStyles(p => ({ ...p, secondaryColor: e.target.value })); markChanged(); }} className="h-8" /></div>
                    <div><Label className="text-xs">Background</Label><Input type="color" value={globalStyles.backgroundColor} onChange={e => { setGlobalStyles(p => ({ ...p, backgroundColor: e.target.value })); markChanged(); }} className="h-8" /></div>
                    <div><Label className="text-xs">Text</Label><Input type="color" value={globalStyles.textColor} onChange={e => { setGlobalStyles(p => ({ ...p, textColor: e.target.value })); markChanged(); }} className="h-8" /></div>
                  </div>
                  <div><Label className="text-xs">Font Family</Label>
                    <Select value={globalStyles.fontFamily} onValueChange={v => { setGlobalStyles(p => ({ ...p, fontFamily: v })); markChanged(); }}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Inter">Inter</SelectItem><SelectItem value="DM Sans">DM Sans</SelectItem><SelectItem value="Raleway">Raleway</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {/* Active toggle */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Label className="text-xs">Custom Design Active</Label>
                    <Switch checked={isActive} onCheckedChange={v => { setIsActive(v); markChanged(); }} />
                  </div>
                </div>
              )}
            </div>

            {/* Sections List */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Sections ({sections.length})</span>
                <Button variant="outline" size="sm" onClick={() => setShowAddMenu(!showAddMenu)} className="h-6 text-xs px-2"><Plus className="w-3 h-3 mr-1" />Add</Button>
              </div>

              {/* Add Section Menu */}
              {showAddMenu && (
                <div className="mb-3 border rounded-lg bg-white p-2 max-h-60 overflow-y-auto shadow-lg">
                  {(Object.entries(SECTION_LABELS) as [SectionType, typeof SECTION_LABELS[SectionType]][]).map(([type, info]) => (
                    <button key={type} onClick={() => addSection(type)} className="w-full text-left p-2 rounded hover:bg-gray-50 flex items-center gap-2 text-xs">
                      <span>{info.icon}</span>
                      <div>
                        <div className="font-medium">{info.label}</div>
                        <div className="text-gray-400 text-[10px]">{info.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Section Cards */}
              <div className="space-y-1.5">
                {sections.sort((a, b) => a.order - b.order).map((section, index) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedSectionId(section.id === selectedSectionId ? null : section.id)}
                    className={`rounded-lg border p-2 cursor-pointer transition-all ${
                      section.id === selectedSectionId ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${!section.visible ? 'opacity-50' : ''} ${draggedIndex === index ? 'opacity-30' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-gray-400 cursor-grab shrink-0" />
                      <span className="text-sm">{SECTION_LABELS[section.type]?.icon}</span>
                      <span className="text-xs font-medium flex-1 truncate">{SECTION_LABELS[section.type]?.label}</span>
                      <button onClick={e => { e.stopPropagation(); toggleVisibility(section.id); }} className="text-gray-400 hover:text-gray-600">
                        {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); removeSection(section.id); }} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Expanded Settings */}
                    {section.id === selectedSectionId && (
                      <div className="mt-3 pt-3 border-t" onClick={e => e.stopPropagation()}>
                        <StoreBuilderSections section={section} onUpdate={updates => updateSectionSettings(section.id, updates)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {sections.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm mb-2">No sections yet</p>
                  <p className="text-xs">Pick a theme preset above or add sections manually</p>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Preview */}
        <ResizablePanel defaultSize={70}>
          <div className="h-full bg-gray-100 overflow-y-auto flex justify-center">
            <div className={`bg-white shadow-xl transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-[390px] mx-auto border-x' : 'w-full'}`} style={{ minHeight: '100%' }}>
              {sections.filter(s => s.visible).sort((a, b) => a.order - b.order).map(section => (
                <div
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`relative cursor-pointer transition-all ${section.id === selectedSectionId ? 'ring-2 ring-emerald-500 ring-offset-1' : 'hover:ring-1 hover:ring-emerald-300'}`}
                >
                  <StoreBuilderSectionRenderer
                    section={section}
                    globalStyles={globalStyles}
                    products={products}
                    categories={categories}
                    isPreview
                  />
                </div>
              ))}
              {sections.filter(s => s.visible).length === 0 && (
                <div className="flex items-center justify-center h-full min-h-[400px] text-gray-300">
                  <div className="text-center">
                    <p className="text-lg mb-2">Empty Store</p>
                    <p className="text-sm">Add sections from the left panel</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default StoreBuilder;
