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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator
} from '@/components/ui/context-menu';
import { 
  Plus, Trash2, GripVertical, Eye, EyeOff, Palette, 
  Save, Loader2, ChevronDown, ChevronUp, Smartphone, Monitor, Undo2, Redo2, Rocket,
  Copy, Download, Upload, Maximize2, Search, ChevronsUpDown, Layers, Moon, Sun,
  ClipboardPaste, ArrowUp, ArrowDown, History, X, Tablet, ListTree, LayoutTemplate
} from 'lucide-react';
import { StoreSection, SectionType, GlobalStyles, SECTION_LABELS, DEFAULT_SECTION_SETTINGS, SectionStyles, DEFAULT_SECTION_STYLES, SECTION_TEMPLATES, VersionSnapshot } from './store-builder/types';
import StoreBuilderSections from './store-builder/StoreBuilderSections';
import StoreBuilderSectionRenderer from './store-builder/StoreBuilderSectionRenderer';
import { THEME_PRESETS } from './store-builder/StoreThemePresets';

interface HistoryState {
  sections: StoreSection[];
  globalStyles: GlobalStyles;
}

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
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [sectionSearch, setSectionSearch] = useState('');
  const [allCollapsed, setAllCollapsed] = useState(false);

  // Undo/Redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const skipHistoryRef = useRef(false);

  // NEW: Mega features state
  const [panelMode, setPanelMode] = useState<'settings' | 'navigator' | 'versions'>('settings');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('sb_dark') === '1');
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [fullscreenDevice, setFullscreenDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const copiedSettingsRef = useRef<{ type: SectionType; settings: Record<string, any>; styles?: SectionStyles } | null>(null);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [versionHistory, setVersionHistory] = useState<VersionSnapshot[]>([]);
  const [versionName, setVersionName] = useState('');
  const [addMenuTab, setAddMenuTab] = useState<'elements' | 'templates'>('elements');

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // Dark mode persist
  useEffect(() => { localStorage.setItem('sb_dark', darkMode ? '1' : '0'); }, [darkMode]);

  const pushHistory = useCallback(() => {
    if (skipHistoryRef.current) { skipHistoryRef.current = false; return; }
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ sections: JSON.parse(JSON.stringify(sections)), globalStyles: JSON.parse(JSON.stringify(globalStyles)) });
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [sections, globalStyles, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    if (!prev) return;
    skipHistoryRef.current = true;
    setSections(prev.sections);
    setGlobalStyles(prev.globalStyles);
    setHistoryIndex(i => i - 1);
    setHasChanges(true);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    if (!next) return;
    skipHistoryRef.current = true;
    setSections(next.sections);
    setGlobalStyles(next.globalStyles);
    setHistoryIndex(i => i + 1);
    setHasChanges(true);
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveDesign(); }
      if (e.key === 'Delete' && selectedSectionId && !(e.target as HTMLElement)?.closest('input, textarea')) { removeSection(selectedSectionId); }
      if (e.key === 'Escape' && fullscreenPreview) { setFullscreenPreview(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selectedSectionId, fullscreenPreview]);

  // Load design
  useEffect(() => {
    if (profile?.id) { loadDesign(); loadProducts(); }
  }, [profile?.id]);

  const loadDesign = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await supabase.from('store_designs').select('*').eq('seller_id', profile.id).maybeSingle();
    if (data) {
      setDesignId(data.id);
      setIsActive(data.is_active);
      setThemePreset(data.theme_preset || 'minimal-white');
      setGlobalStyles(data.global_styles as unknown as GlobalStyles);
      const loadedSections = (data.sections as unknown as StoreSection[]) || [];
      setSections(loadedSections);
      setHistory([{ sections: JSON.parse(JSON.stringify(loadedSections)), globalStyles: data.global_styles as unknown as GlobalStyles }]);
      setHistoryIndex(0);
      // Load version history
      const vh = (data as any).version_history;
      if (Array.isArray(vh)) setVersionHistory(vh);
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
      version_history: versionHistory as unknown as Record<string, any>[],
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

  const markChanged = () => { setHasChanges(true); pushHistory(); };

  // Section CRUD
  const addSection = (type: SectionType) => {
    const newSection: StoreSection = {
      id: `sec_${Math.random().toString(36).slice(2, 9)}`,
      type, order: sections.length, visible: true,
      settings: { ...DEFAULT_SECTION_SETTINGS[type] },
      styles: { ...DEFAULT_SECTION_STYLES },
    };
    setSections(prev => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    setShowAddMenu(false);
    markChanged();
  };

  const addFromTemplate = (templateId: string) => {
    const tpl = SECTION_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    const newSection: StoreSection = {
      ...JSON.parse(JSON.stringify(tpl.section)),
      id: `sec_${Math.random().toString(36).slice(2, 9)}`,
      order: sections.length,
    };
    setSections(prev => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    setShowAddMenu(false);
    markChanged();
    toast.success(`Added "${tpl.name}" template`);
  };

  const duplicateSection = (id: string) => {
    const source = sections.find(s => s.id === id);
    if (!source) return;
    const dup: StoreSection = {
      ...JSON.parse(JSON.stringify(source)),
      id: `sec_${Math.random().toString(36).slice(2, 9)}`,
      order: source.order + 1,
    };
    const updated = sections.map(s => s.order > source.order ? { ...s, order: s.order + 1 } : s);
    setSections([...updated, dup].sort((a, b) => a.order - b.order));
    setSelectedSectionId(dup.id);
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

  const updateSectionStyles = (id: string, updates: Partial<SectionStyles>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, styles: { ...(s.styles || DEFAULT_SECTION_STYLES), ...updates } } : s));
    markChanged();
  };

  // Move Up / Move Down
  const moveSection = (id: string, direction: 'up' | 'down') => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.id === id);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = sorted[idx].order;
    sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
    sorted[swapIdx] = { ...sorted[swapIdx], order: temp };
    setSections(sorted);
    markChanged();
  };

  // Copy / Paste Settings
  const copySettings = (id: string) => {
    const section = sections.find(s => s.id === id);
    if (!section) return;
    copiedSettingsRef.current = { type: section.type, settings: JSON.parse(JSON.stringify(section.settings)), styles: section.styles ? JSON.parse(JSON.stringify(section.styles)) : undefined };
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
    toast.success('Settings copied');
  };

  const pasteSettings = (id: string) => {
    const section = sections.find(s => s.id === id);
    if (!section || !copiedSettingsRef.current) return;
    if (copiedSettingsRef.current.type !== section.type) {
      toast.error('Can only paste to same section type');
      return;
    }
    setSections(prev => prev.map(s => s.id === id ? { ...s, settings: { ...copiedSettingsRef.current!.settings }, styles: copiedSettingsRef.current!.styles || s.styles } : s));
    markChanged();
    toast.success('Settings pasted');
  };

  // Version History
  const saveVersion = () => {
    const snapshot: VersionSnapshot = {
      id: `ver_${Math.random().toString(36).slice(2, 9)}`,
      name: versionName || `Version ${versionHistory.length + 1}`,
      timestamp: new Date().toISOString(),
      sections: JSON.parse(JSON.stringify(sections)),
      globalStyles: JSON.parse(JSON.stringify(globalStyles)),
      themePreset,
    };
    setVersionHistory(prev => [snapshot, ...prev]);
    setVersionName('');
    setHasChanges(true);
    toast.success('Version saved');
  };

  const restoreVersion = (snapshot: VersionSnapshot) => {
    setSections(snapshot.sections);
    setGlobalStyles(snapshot.globalStyles);
    setThemePreset(snapshot.themePreset);
    markChanged();
    toast.success(`Restored "${snapshot.name}"`);
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

  // Theme preset
  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setGlobalStyles(preset.globalStyles);
    setSections(preset.sections.map((s, i) => ({ ...s, id: `sec_${Math.random().toString(36).slice(2, 9)}`, order: i })));
    setThemePreset(presetId);
    setSelectedSectionId(null);
    markChanged();
  };

  // Import/Export
  const exportDesign = () => {
    const data = JSON.stringify({ globalStyles, sections, themePreset }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'store-design.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const importDesign = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.sections) setSections(data.sections);
        if (data.globalStyles) setGlobalStyles(data.globalStyles);
        if (data.themePreset) setThemePreset(data.themePreset);
        markChanged();
        toast.success('Design imported!');
      } catch { toast.error('Invalid JSON file'); }
    };
    input.click();
  };

  const publishDesign = async () => {
    // Auto-snapshot before publishing
    const snapshot: VersionSnapshot = {
      id: `ver_${Math.random().toString(36).slice(2, 9)}`,
      name: `Pre-publish ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
      sections: JSON.parse(JSON.stringify(sections)),
      globalStyles: JSON.parse(JSON.stringify(globalStyles)),
      themePreset,
    };
    const updatedVersions = [snapshot, ...versionHistory];
    setVersionHistory(updatedVersions);

    setIsActive(true);
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    setSaving(true);
    const payload = {
      seller_id: profile?.id!,
      is_active: true,
      theme_preset: themePreset,
      global_styles: globalStyles as unknown as Record<string, any>,
      sections: sections as unknown as Record<string, any>[],
      version_history: updatedVersions as unknown as Record<string, any>[],
    };
    if (designId) { await supabase.from('store_designs').update(payload).eq('id', designId); }
    else { const { data } = await supabase.from('store_designs').insert(payload).select('id').single(); if (data) setDesignId(data.id); }
    setSaving(false); setHasChanges(false);
    toast.success('🚀 Store design published!');
  };

  // Section search filter
  const filteredSectionTypes = Object.entries(SECTION_LABELS).filter(([_, info]) =>
    !sectionSearch || info.label.toLowerCase().includes(sectionSearch.toLowerCase()) || info.category.toLowerCase().includes(sectionSearch.toLowerCase())
  ) as [SectionType, typeof SECTION_LABELS[SectionType]][];

  // Group by category
  const groupedSections = filteredSectionTypes.reduce((acc, [type, info]) => {
    if (!acc[info.category]) acc[info.category] = [];
    acc[info.category].push([type, info]);
    return acc;
  }, {} as Record<string, [SectionType, typeof SECTION_LABELS[SectionType]][]>);

  // Template search
  const filteredTemplates = SECTION_TEMPLATES.filter(t =>
    !sectionSearch || t.name.toLowerCase().includes(sectionSearch.toLowerCase()) || t.category.toLowerCase().includes(sectionSearch.toLowerCase())
  );

  const darkCls = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50';
  const darkBorderCls = darkMode ? 'border-gray-700' : 'border-gray-200';
  const darkCardCls = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const darkHoverCls = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const darkToolbarCls = darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-b';

  if (loading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  // Sorted sections for rendering
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 shrink-0 ${darkToolbarCls}`}>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold">Store Builder</h2>
          {hasChanges && <Badge variant="outline" className="text-xs border-amber-300 text-amber-600 animate-pulse">Unsaved</Badge>}
          {copiedBadge && <Badge className="text-xs bg-blue-500 text-white">Copied</Badge>}
          {saving && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
          <div className="flex items-center gap-0.5 ml-2 border-l pl-2">
            <button onClick={undo} disabled={historyIndex <= 0} className={`p-1.5 rounded ${darkHoverCls} disabled:opacity-30`} title="Undo (Ctrl+Z)"><Undo2 className="w-3.5 h-3.5" /></button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className={`p-1.5 rounded ${darkHoverCls} disabled:opacity-30`} title="Redo (Ctrl+Shift+Z)"><Redo2 className="w-3.5 h-3.5" /></button>
          </div>
          {/* Panel mode toggles */}
          <div className="flex items-center gap-0.5 ml-1 border-l pl-2">
            <button onClick={() => setPanelMode('settings')} className={`p-1.5 rounded ${panelMode === 'settings' ? 'bg-emerald-100 text-emerald-700' : darkHoverCls}`} title="Settings"><Layers className="w-3.5 h-3.5" /></button>
            <button onClick={() => setPanelMode('navigator')} className={`p-1.5 rounded ${panelMode === 'navigator' ? 'bg-emerald-100 text-emerald-700' : darkHoverCls}`} title="Navigator"><ListTree className="w-3.5 h-3.5" /></button>
            <button onClick={() => setPanelMode('versions')} className={`p-1.5 rounded ${panelMode === 'versions' ? 'bg-emerald-100 text-emerald-700' : darkHoverCls}`} title="Version History"><History className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded ${previewMode === 'desktop' ? 'bg-gray-100' : ''}`}><Monitor className="w-4 h-4" /></button>
          <button onClick={() => setPreviewMode('tablet')} className={`p-1.5 rounded ${previewMode === 'tablet' ? 'bg-gray-100' : ''}`}><Tablet className="w-4 h-4" /></button>
          <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded ${previewMode === 'mobile' ? 'bg-gray-100' : ''}`}><Smartphone className="w-4 h-4" /></button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button onClick={() => setFullscreenPreview(true)} className={`p-1.5 rounded ${darkHoverCls}`} title="Fullscreen Preview"><Maximize2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-1.5 rounded ${darkHoverCls}`} title="Toggle Dark Mode">
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button onClick={importDesign} className={`p-1.5 rounded ${darkHoverCls}`} title="Import JSON"><Upload className="w-3.5 h-3.5" /></button>
          <button onClick={exportDesign} className={`p-1.5 rounded ${darkHoverCls}`} title="Export JSON"><Download className="w-3.5 h-3.5" /></button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <Button variant="outline" size="sm" onClick={() => saveDesign()} disabled={saving} className="h-7 text-xs"><Save className="w-3 h-3 mr-1" />Save</Button>
          <Button size="sm" onClick={publishDesign} className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"><Rocket className="w-3 h-3 mr-1" />Publish</Button>
        </div>
      </div>

      {/* Builder */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <div className={`h-full overflow-y-auto ${darkCls}`}>

            {/* ========== SETTINGS MODE ========== */}
            {panelMode === 'settings' && (
              <>
                {/* Theme & Global Styles */}
                <div className={`p-3 border-b ${darkBorderCls}`}>
                  <button onClick={() => setShowGlobalStyles(!showGlobalStyles)} className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" />Theme & Styles</span>
                    {showGlobalStyles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {showGlobalStyles && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <Label className="text-xs">Theme Preset</Label>
                        <div className="grid grid-cols-2 gap-1.5 mt-1">
                          {THEME_PRESETS.map(p => (
                            <button key={p.id} onClick={() => applyPreset(p.id)} className={`text-left p-2 rounded-lg border text-xs transition-all ${themePreset === p.id ? 'border-emerald-500 bg-emerald-50' : `${darkCardCls}`}`}>
                              <span className="text-lg">{p.thumbnail}</span>
                              <div className="font-medium mt-0.5">{p.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>
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
                      <div><Label className="text-xs">Heading Font</Label>
                        <Select value={globalStyles.headingFont || globalStyles.fontFamily} onValueChange={v => { setGlobalStyles(p => ({ ...p, headingFont: v })); markChanged(); }}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="Inter">Inter</SelectItem><SelectItem value="DM Sans">DM Sans</SelectItem><SelectItem value="Raleway">Raleway</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Link Color</Label><Input type="color" value={globalStyles.linkColor || globalStyles.primaryColor} onChange={e => { setGlobalStyles(p => ({ ...p, linkColor: e.target.value })); markChanged(); }} className="h-8" /></div>
                        <div><Label className="text-xs">Link Hover</Label><Input type="color" value={globalStyles.linkHoverColor || globalStyles.primaryColor} onChange={e => { setGlobalStyles(p => ({ ...p, linkHoverColor: e.target.value })); markChanged(); }} className="h-8" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Button BG</Label><Input type="color" value={globalStyles.buttonBgColor || globalStyles.primaryColor} onChange={e => { setGlobalStyles(p => ({ ...p, buttonBgColor: e.target.value })); markChanged(); }} className="h-8" /></div>
                        <div><Label className="text-xs">Button Text</Label><Input type="color" value={globalStyles.buttonTextColor || '#ffffff'} onChange={e => { setGlobalStyles(p => ({ ...p, buttonTextColor: e.target.value })); markChanged(); }} className="h-8" /></div>
                      </div>
                      <div><Label className="text-xs">Default Border Radius</Label>
                        <Select value={globalStyles.defaultBorderRadius || '8'} onValueChange={v => { setGlobalStyles(p => ({ ...p, defaultBorderRadius: v })); markChanged(); }}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="0">None</SelectItem><SelectItem value="4">Small</SelectItem><SelectItem value="8">Medium</SelectItem><SelectItem value="12">Large</SelectItem><SelectItem value="16">XL</SelectItem><SelectItem value="9999">Full</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Background Pattern</Label>
                        <Select value={globalStyles.backgroundPattern || 'none'} onValueChange={v => { setGlobalStyles(p => ({ ...p, backgroundPattern: v as any })); markChanged(); }}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="dots">Dots</SelectItem><SelectItem value="grid">Grid</SelectItem><SelectItem value="diagonal">Diagonal</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Custom CSS</Label><textarea value={globalStyles.customCSS || ''} onChange={e => { setGlobalStyles(p => ({ ...p, customCSS: e.target.value })); markChanged(); }} className="w-full text-xs font-mono p-2 border rounded-lg min-h-[60px] resize-y" placeholder="/* custom styles */" /></div>
                      <div className={`flex items-center justify-between pt-2 border-t ${darkBorderCls}`}><Label className="text-xs">Custom Design Active</Label><Switch checked={isActive} onCheckedChange={v => { setIsActive(v); markChanged(); }} /></div>
                    </div>
                  )}
                </div>

                {/* Sections List */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1"><Layers className="w-3 h-3" />Sections ({sections.length})</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setAllCollapsed(!allCollapsed); if (!allCollapsed) setSelectedSectionId(null); }} className={`p-1 rounded ${darkHoverCls}`} title="Collapse all"><ChevronsUpDown className="w-3.5 h-3.5" /></button>
                      <Button variant="outline" size="sm" onClick={() => setShowAddMenu(!showAddMenu)} className="h-6 text-xs px-2"><Plus className="w-3 h-3 mr-1" />Add</Button>
                    </div>
                  </div>

                  {/* Add Section Menu with Search + Tabs (Elements / Templates) */}
                  {showAddMenu && (
                    <div className={`mb-3 border rounded-lg shadow-lg ${darkCardCls}`}>
                      <div className={`p-2 border-b ${darkBorderCls}`}>
                        <div className="relative mb-2">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <Input value={sectionSearch} onChange={e => setSectionSearch(e.target.value)} placeholder="Search..." className="h-7 text-xs pl-7" autoFocus />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setAddMenuTab('elements')} className={`flex-1 text-xs py-1 rounded font-medium ${addMenuTab === 'elements' ? 'bg-emerald-100 text-emerald-700' : `${darkHoverCls}`}`}>
                            <Layers className="w-3 h-3 inline mr-1" />Elements
                          </button>
                          <button onClick={() => setAddMenuTab('templates')} className={`flex-1 text-xs py-1 rounded font-medium ${addMenuTab === 'templates' ? 'bg-emerald-100 text-emerald-700' : `${darkHoverCls}`}`}>
                            <LayoutTemplate className="w-3 h-3 inline mr-1" />Templates
                          </button>
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto p-1">
                        {addMenuTab === 'elements' ? (
                          Object.entries(groupedSections).map(([category, items]) => (
                            <div key={category}>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 pt-2 pb-1">{category}</div>
                              {items.map(([type, info]) => (
                                <button key={type} onClick={() => { addSection(type); setSectionSearch(''); }} className={`w-full text-left p-2 rounded ${darkHoverCls} flex items-center gap-2 text-xs`}>
                                  <span>{info.icon}</span>
                                  <div>
                                    <div className="font-medium">{info.label}</div>
                                    <div className="text-gray-400 text-[10px]">{info.description}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ))
                        ) : (
                          filteredTemplates.length > 0 ? filteredTemplates.map(tpl => (
                            <button key={tpl.id} onClick={() => { addFromTemplate(tpl.id); setSectionSearch(''); }} className={`w-full text-left p-2 rounded ${darkHoverCls} flex items-center gap-2 text-xs`}>
                              <span className="text-lg">{tpl.thumbnail}</span>
                              <div>
                                <div className="font-medium">{tpl.name}</div>
                                <div className="text-gray-400 text-[10px]">{tpl.description}</div>
                                <Badge variant="outline" className="text-[9px] mt-0.5">{tpl.category}</Badge>
                              </div>
                            </button>
                          )) : <div className="text-center text-gray-400 text-xs py-4">No templates match</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section Cards with Context Menu */}
                  <div className="space-y-1.5">
                    {sortedSections.map((section, index) => (
                      <ContextMenu key={section.id}>
                        <ContextMenuTrigger>
                          <div
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onClick={() => !allCollapsed && setSelectedSectionId(section.id === selectedSectionId ? null : section.id)}
                            className={`rounded-lg border p-2 cursor-pointer transition-all ${
                              section.id === selectedSectionId ? 'border-emerald-500 bg-emerald-50 shadow-sm' : darkCardCls
                            } ${!section.visible ? 'opacity-50' : ''} ${draggedIndex === index ? 'opacity-30' : ''}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <GripVertical className="w-3.5 h-3.5 text-gray-400 cursor-grab shrink-0" />
                              <span className="text-sm">{SECTION_LABELS[section.type]?.icon}</span>
                              <span className="text-xs font-medium flex-1 truncate">{SECTION_LABELS[section.type]?.label}</span>
                              {/* Move Up/Down */}
                              <button onClick={e => { e.stopPropagation(); moveSection(section.id, 'up'); }} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-20" title="Move Up"><ArrowUp className="w-3 h-3" /></button>
                              <button onClick={e => { e.stopPropagation(); moveSection(section.id, 'down'); }} disabled={index === sortedSections.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-20" title="Move Down"><ArrowDown className="w-3 h-3" /></button>
                              <button onClick={e => { e.stopPropagation(); duplicateSection(section.id); }} className="text-gray-400 hover:text-blue-500" title="Duplicate"><Copy className="w-3 h-3" /></button>
                              <button onClick={e => { e.stopPropagation(); toggleVisibility(section.id); }} className="text-gray-400 hover:text-gray-600">
                                {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={e => { e.stopPropagation(); removeSection(section.id); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>

                            {section.id === selectedSectionId && !allCollapsed && (
                              <div className="mt-3 pt-3 border-t" onClick={e => e.stopPropagation()}>
                                <StoreBuilderSections
                                  section={section}
                                  onUpdate={updates => updateSectionSettings(section.id, updates)}
                                  onUpdateStyles={updates => updateSectionStyles(section.id, updates)}
                                />
                              </div>
                            )}
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => duplicateSection(section.id)}><Copy className="w-3.5 h-3.5 mr-2" />Duplicate</ContextMenuItem>
                          <ContextMenuItem onClick={() => copySettings(section.id)}><Copy className="w-3.5 h-3.5 mr-2" />Copy Settings</ContextMenuItem>
                          <ContextMenuItem onClick={() => pasteSettings(section.id)} disabled={!copiedSettingsRef.current}><ClipboardPaste className="w-3.5 h-3.5 mr-2" />Paste Settings</ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem onClick={() => moveSection(section.id, 'up')} disabled={index === 0}><ArrowUp className="w-3.5 h-3.5 mr-2" />Move Up</ContextMenuItem>
                          <ContextMenuItem onClick={() => moveSection(section.id, 'down')} disabled={index === sortedSections.length - 1}><ArrowDown className="w-3.5 h-3.5 mr-2" />Move Down</ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem onClick={() => toggleVisibility(section.id)}>{section.visible ? <EyeOff className="w-3.5 h-3.5 mr-2" /> : <Eye className="w-3.5 h-3.5 mr-2" />}{section.visible ? 'Hide' : 'Show'}</ContextMenuItem>
                          <ContextMenuItem onClick={() => removeSection(section.id)} className="text-red-600"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>

                  {sections.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm mb-2">No sections yet</p>
                      <p className="text-xs">Pick a theme preset above or add sections manually</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ========== NAVIGATOR MODE (Layer Panel) ========== */}
            {panelMode === 'navigator' && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"><ListTree className="w-3.5 h-3.5" />Navigator</span>
                  <span className="text-[10px] text-gray-400">{sections.length} sections</span>
                </div>
                <div className="space-y-0.5">
                  {sortedSections.map((section, index) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => { setSelectedSectionId(section.id); setPanelMode('settings'); }}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-all ${
                        section.id === selectedSectionId ? 'bg-emerald-100 text-emerald-800 font-medium' : `${darkHoverCls}`
                      } ${!section.visible ? 'opacity-40' : ''}`}
                    >
                      <GripVertical className="w-3 h-3 text-gray-400 cursor-grab" />
                      <span>{SECTION_LABELS[section.type]?.icon}</span>
                      <span className="flex-1 truncate">{SECTION_LABELS[section.type]?.label}</span>
                      <button onClick={e => { e.stopPropagation(); toggleVisibility(section.id); }} className="opacity-60 hover:opacity-100">
                        {section.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
                {sections.length === 0 && <div className="text-center text-gray-400 text-xs py-8">No sections</div>}
              </div>
            )}

            {/* ========== VERSIONS MODE ========== */}
            {panelMode === 'versions' && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"><History className="w-3.5 h-3.5" />Version History</span>
                </div>
                <div className="flex gap-1.5 mb-3">
                  <Input value={versionName} onChange={e => setVersionName(e.target.value)} placeholder="Version name (optional)" className="h-7 text-xs flex-1" />
                  <Button variant="outline" size="sm" onClick={saveVersion} className="h-7 text-xs shrink-0"><Save className="w-3 h-3 mr-1" />Save</Button>
                </div>
                <ScrollArea className="h-[calc(100vh-260px)]">
                  <div className="space-y-1.5">
                    {versionHistory.length === 0 && <div className="text-center text-gray-400 text-xs py-8">No saved versions yet</div>}
                    {versionHistory.map(v => (
                      <div key={v.id} className={`border rounded-lg p-2.5 ${darkCardCls}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium">{v.name}</div>
                            <div className="text-[10px] text-gray-400">{new Date(v.timestamp).toLocaleString()}</div>
                            <div className="text-[10px] text-gray-400">{v.sections.length} sections</div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => restoreVersion(v)} className="h-6 text-[10px] px-2">Restore</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Preview */}
        <ResizablePanel defaultSize={70}>
          <div className="h-full bg-gray-100 overflow-y-auto flex justify-center">
            <div className={`bg-white shadow-xl transition-all duration-300 ${
              previewMode === 'mobile' ? 'max-w-[390px] mx-auto border-x' : 
              previewMode === 'tablet' ? 'max-w-[768px] mx-auto border-x' : 'w-full'
            }`} style={{ minHeight: '100%' }}>
              {globalStyles.customCSS && <style>{globalStyles.customCSS}</style>}
              {sections.filter(s => s.visible).sort((a, b) => a.order - b.order).map(section => (
                <ContextMenu key={section.id}>
                  <ContextMenuTrigger>
                    <div
                      onClick={() => setSelectedSectionId(section.id)}
                      className={`relative cursor-pointer transition-all ${section.id === selectedSectionId ? 'ring-2 ring-emerald-500 ring-offset-1' : 'hover:ring-1 hover:ring-emerald-300'}`}
                    >
                      <StoreBuilderSectionRenderer section={section} globalStyles={globalStyles} products={products} categories={categories} isPreview />
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => duplicateSection(section.id)}><Copy className="w-3.5 h-3.5 mr-2" />Duplicate</ContextMenuItem>
                    <ContextMenuItem onClick={() => copySettings(section.id)}><Copy className="w-3.5 h-3.5 mr-2" />Copy Settings</ContextMenuItem>
                    <ContextMenuItem onClick={() => pasteSettings(section.id)} disabled={!copiedSettingsRef.current}><ClipboardPaste className="w-3.5 h-3.5 mr-2" />Paste Settings</ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => toggleVisibility(section.id)}>{section.visible ? 'Hide' : 'Show'}</ContextMenuItem>
                    <ContextMenuItem onClick={() => removeSection(section.id)} className="text-red-600"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              {sections.filter(s => s.visible).length === 0 && (
                <div className="flex items-center justify-center h-full min-h-[400px] text-gray-300">
                  <div className="text-center"><p className="text-lg mb-2">Empty Store</p><p className="text-sm">Add sections from the left panel</p></div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* ========== FULLSCREEN PREVIEW OVERLAY ========== */}
      {fullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b shrink-0">
            <span className="text-sm font-semibold">Fullscreen Preview</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setFullscreenDevice('desktop')} className={`p-1.5 rounded ${fullscreenDevice === 'desktop' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Monitor className="w-4 h-4" /></button>
              <button onClick={() => setFullscreenDevice('tablet')} className={`p-1.5 rounded ${fullscreenDevice === 'tablet' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Tablet className="w-4 h-4" /></button>
              <button onClick={() => setFullscreenDevice('mobile')} className={`p-1.5 rounded ${fullscreenDevice === 'mobile' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Smartphone className="w-4 h-4" /></button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <Button variant="outline" size="sm" onClick={() => setFullscreenPreview(false)} className="h-7 text-xs"><X className="w-3 h-3 mr-1" />Close <span className="ml-1 text-gray-400 text-[10px]">ESC</span></Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto flex justify-center">
            <div className={`bg-white shadow-xl transition-all duration-300 ${
              fullscreenDevice === 'mobile' ? 'max-w-[390px] border-x' : 
              fullscreenDevice === 'tablet' ? 'max-w-[768px] border-x' : 'w-full'
            }`} style={{ minHeight: '100%' }}>
              {globalStyles.customCSS && <style>{globalStyles.customCSS}</style>}
              {sections.filter(s => s.visible).sort((a, b) => a.order - b.order).map(section => (
                <StoreBuilderSectionRenderer key={section.id} section={section} globalStyles={globalStyles} products={products} categories={categories} isPreview />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreBuilder;