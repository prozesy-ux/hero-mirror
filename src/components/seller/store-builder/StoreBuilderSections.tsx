import { StoreSection, SectionType, SECTION_LABELS, SectionStyles, DEFAULT_SECTION_STYLES } from './types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, Palette, Layout, Settings2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  section: StoreSection;
  onUpdate: (settings: Record<string, any>) => void;
  onUpdateStyles?: (styles: Partial<SectionStyles>) => void;
}

// ===== SHARED SECTION STYLES PANEL =====
const SectionStylesPanel = ({ section, onUpdateStyles }: { section: StoreSection; onUpdateStyles?: (styles: Partial<SectionStyles>) => void }) => {
  const styles = section.styles || DEFAULT_SECTION_STYLES;
  const update = (partial: Partial<SectionStyles>) => onUpdateStyles?.(partial);

  return (
    <div className="space-y-3 pt-3 border-t">
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase">
          <span className="flex items-center gap-1"><Layout className="w-3 h-3" />Spacing</span><ChevronDown className="w-3 h-3" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[10px]">Pad Top (px)</Label><Input type="number" value={styles.padding?.top || '48'} onChange={e => update({ padding: { ...styles.padding, top: e.target.value } })} className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">Pad Bottom</Label><Input type="number" value={styles.padding?.bottom || '48'} onChange={e => update({ padding: { ...styles.padding, bottom: e.target.value } })} className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">Pad Left</Label><Input type="number" value={styles.padding?.left || '24'} onChange={e => update({ padding: { ...styles.padding, left: e.target.value } })} className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">Pad Right</Label><Input type="number" value={styles.padding?.right || '24'} onChange={e => update({ padding: { ...styles.padding, right: e.target.value } })} className="h-7 text-xs" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[10px]">Margin Top</Label><Input type="number" value={styles.margin?.top || '0'} onChange={e => update({ margin: { ...styles.margin, top: e.target.value } })} className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">Margin Bottom</Label><Input type="number" value={styles.margin?.bottom || '0'} onChange={e => update({ margin: { ...styles.margin, bottom: e.target.value } })} className="h-7 text-xs" /></div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase">
          <span className="flex items-center gap-1"><Palette className="w-3 h-3" />Background</span><ChevronDown className="w-3 h-3" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <div className="flex items-center justify-between"><Label className="text-[10px]">Gradient</Label><Switch checked={styles.backgroundGradient?.enabled || false} onCheckedChange={v => update({ backgroundGradient: { ...styles.backgroundGradient, enabled: v } })} /></div>
          {styles.backgroundGradient?.enabled && (
            <div className="grid grid-cols-3 gap-1">
              <div><Label className="text-[10px]">From</Label><Input type="color" value={styles.backgroundGradient?.from || '#fff'} onChange={e => update({ backgroundGradient: { ...styles.backgroundGradient, from: e.target.value } })} className="h-7" /></div>
              <div><Label className="text-[10px]">To</Label><Input type="color" value={styles.backgroundGradient?.to || '#f3f4f6'} onChange={e => update({ backgroundGradient: { ...styles.backgroundGradient, to: e.target.value } })} className="h-7" /></div>
              <div><Label className="text-[10px]">Direction</Label>
                <Select value={styles.backgroundGradient?.direction || '180deg'} onValueChange={v => update({ backgroundGradient: { ...styles.backgroundGradient, direction: v } })}>
                  <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="0deg">↑</SelectItem><SelectItem value="90deg">→</SelectItem><SelectItem value="180deg">↓</SelectItem><SelectItem value="270deg">←</SelectItem><SelectItem value="135deg">↘</SelectItem><SelectItem value="45deg">↗</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div><Label className="text-[10px]">BG Image URL</Label><Input value={styles.backgroundImage?.url || ''} onChange={e => update({ backgroundImage: { ...styles.backgroundImage, url: e.target.value } })} className="h-7 text-xs" placeholder="https://..." /></div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase">
          <span className="flex items-center gap-1"><Settings2 className="w-3 h-3" />Border & Shadow</span><ChevronDown className="w-3 h-3" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <div><Label className="text-[10px]">Width</Label><Input type="number" value={styles.border?.width || '0'} onChange={e => update({ border: { ...styles.border, width: e.target.value } })} className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">Color</Label><Input type="color" value={styles.border?.color || '#e5e7eb'} onChange={e => update({ border: { ...styles.border, color: e.target.value } })} className="h-7" /></div>
            <div><Label className="text-[10px]">Style</Label>
              <Select value={styles.border?.style || 'solid'} onValueChange={v => update({ border: { ...styles.border, style: v } })}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="solid">Solid</SelectItem><SelectItem value="dashed">Dashed</SelectItem><SelectItem value="dotted">Dotted</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-[10px]">Border Radius (px)</Label><Input type="number" value={styles.borderRadius || '0'} onChange={e => update({ borderRadius: e.target.value })} className="h-7 text-xs" /></div>
          <div><Label className="text-[10px]">Box Shadow</Label>
            <Select value={styles.boxShadow || 'none'} onValueChange={v => update({ boxShadow: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="0 1px 3px rgba(0,0,0,0.1)">Small</SelectItem>
                <SelectItem value="0 4px 6px rgba(0,0,0,0.1)">Medium</SelectItem>
                <SelectItem value="0 10px 25px rgba(0,0,0,0.15)">Large</SelectItem>
                <SelectItem value="0 20px 50px rgba(0,0,0,0.2)">XL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase">
          <span>Animation & Advanced</span><ChevronDown className="w-3 h-3" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <div><Label className="text-[10px]">Scroll Animation</Label>
            <Select value={styles.animation || 'none'} onValueChange={v => update({ animation: v as any })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem><SelectItem value="fade-in">Fade In</SelectItem><SelectItem value="slide-up">Slide Up</SelectItem>
                <SelectItem value="slide-left">Slide Left</SelectItem><SelectItem value="slide-right">Slide Right</SelectItem><SelectItem value="zoom-in">Zoom In</SelectItem><SelectItem value="bounce">Bounce</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between"><Label className="text-[10px]">Full Width</Label><Switch checked={styles.fullWidth !== false} onCheckedChange={v => update({ fullWidth: v })} /></div>
          <div className="space-y-1">
            <Label className="text-[10px]">Responsive Visibility</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={styles.responsiveVisibility?.desktop !== false} onChange={e => update({ responsiveVisibility: { ...styles.responsiveVisibility, desktop: e.target.checked } })} />Desktop</label>
              <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={styles.responsiveVisibility?.tablet !== false} onChange={e => update({ responsiveVisibility: { ...styles.responsiveVisibility, tablet: e.target.checked } })} />Tablet</label>
              <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={styles.responsiveVisibility?.mobile !== false} onChange={e => update({ responsiveVisibility: { ...styles.responsiveVisibility, mobile: e.target.checked } })} />Mobile</label>
            </div>
          </div>
          <div><Label className="text-[10px]">Custom CSS Class</Label><Input value={styles.customClass || ''} onChange={e => update({ customClass: e.target.value })} className="h-7 text-xs font-mono" placeholder="my-custom-class" /></div>
          <div><Label className="text-[10px]">Section ID / Anchor</Label><Input value={styles.sectionId || ''} onChange={e => update({ sectionId: e.target.value })} className="h-7 text-xs font-mono" placeholder="my-section" /></div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// ===== EXISTING SETTINGS =====

const HeroSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Heading</Label><Input value={section.settings.heading || ''} onChange={e => onUpdate({ heading: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Subheading</Label><Input value={section.settings.subheading || ''} onChange={e => onUpdate({ subheading: e.target.value })} className="h-8 text-sm" /></div>
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">BG Color</Label><Input type="color" value={section.settings.bgColor || '#000000'} onChange={e => onUpdate({ bgColor: e.target.value })} className="h-8" /></div>
      <div><Label className="text-xs">Text Color</Label><Input type="color" value={section.settings.textColor || '#ffffff'} onChange={e => onUpdate({ textColor: e.target.value })} className="h-8" /></div>
    </div>
    <div><Label className="text-xs">CTA Text</Label><Input value={section.settings.ctaText || ''} onChange={e => onUpdate({ ctaText: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">CTA Link</Label><Input value={section.settings.ctaLink || ''} onChange={e => onUpdate({ ctaLink: e.target.value })} className="h-8 text-sm" placeholder="#products" /></div>
    <div><Label className="text-xs">BG Image URL</Label><Input value={section.settings.bgImage || ''} onChange={e => onUpdate({ bgImage: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Text Align</Label>
      <Select value={section.settings.textAlign || 'center'} onValueChange={v => onUpdate({ textAlign: v })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
      </Select>
    </div>
  </div>
);

const ProductGridSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Columns</Label>
      <Select value={String(section.settings.columns || 3)} onValueChange={v => onUpdate({ columns: parseInt(v) })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem><SelectItem value="4">4</SelectItem></SelectContent>
      </Select>
    </div>
    <div className="flex items-center justify-between"><Label className="text-xs">Show Filters</Label><Switch checked={section.settings.showFilters !== false} onCheckedChange={v => onUpdate({ showFilters: v })} /></div>
  </div>
);

const AboutSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Text</Label><Textarea value={section.settings.text || ''} onChange={e => onUpdate({ text: e.target.value })} className="text-sm min-h-[80px]" /></div>
    <div><Label className="text-xs">Image URL</Label><Input value={section.settings.imageUrl || ''} onChange={e => onUpdate({ imageUrl: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Image Position</Label>
      <Select value={section.settings.imagePosition || 'right'} onValueChange={v => onUpdate({ imagePosition: v })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
      </Select>
    </div>
  </div>
);

const ItemListSettings = ({ section, onUpdate, itemLabel, fields }: Props & { itemLabel: string; fields: { key: string; label: string; type?: string }[] }) => {
  const items = section.settings.items || [];
  const updateItem = (i: number, field: string, value: any) => { const n = [...items]; n[i] = { ...n[i], [field]: value }; onUpdate({ items: n }); };
  const addItem = () => onUpdate({ items: [...items, fields.reduce((acc, f) => ({ ...acc, [f.key]: f.type === 'number' ? 0 : '' }), {})] });
  const removeItem = (i: number) => onUpdate({ items: items.filter((_: any, idx: number) => idx !== i) });
  return (
    <div className="space-y-3">
      {section.settings.title !== undefined && <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>}
      {items.map((item: any, i: number) => (
        <div key={i} className="border rounded-lg p-2 space-y-1.5">
          <div className="flex items-center justify-between"><span className="text-xs font-medium">{itemLabel} {i + 1}</span><button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button></div>
          {fields.map(f => (
            <div key={f.key}>
              <Label className="text-[10px]">{f.label}</Label>
              {f.type === 'textarea' ? <Textarea value={item[f.key] || ''} onChange={e => updateItem(i, f.key, e.target.value)} className="text-xs min-h-[40px]" /> :
                f.type === 'number' ? <Input type="number" value={item[f.key] || 0} onChange={e => updateItem(i, f.key, parseFloat(e.target.value))} className="h-7 text-xs" /> :
                  f.type === 'color' ? <Input type="color" value={item[f.key] || '#3b82f6'} onChange={e => updateItem(i, f.key, e.target.value)} className="h-7" /> :
                    <Input value={item[f.key] || ''} onChange={e => updateItem(i, f.key, e.target.value)} className="h-7 text-xs" />}
            </div>
          ))}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="w-full h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Add {itemLabel}</Button>
    </div>
  );
};

const FAQSettings = (props: Props) => <ItemListSettings {...props} itemLabel="FAQ" fields={[{ key: 'question', label: 'Question' }, { key: 'answer', label: 'Answer', type: 'textarea' }]} />;

const VideoSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Video URL</Label><Input value={section.settings.videoUrl || ''} onChange={e => onUpdate({ videoUrl: e.target.value })} className="h-8 text-sm" placeholder="https://youtube.com/watch?v=..." /></div>
  </div>
);

const TestimonialsSettings = (props: Props) => <ItemListSettings {...props} itemLabel="Review" fields={[{ key: 'name', label: 'Name' }, { key: 'text', label: 'Review', type: 'textarea' }, { key: 'rating', label: 'Rating (1-5)', type: 'number' }]} />;

const CTASettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Heading</Label><Input value={section.settings.heading || ''} onChange={e => onUpdate({ heading: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Subheading</Label><Input value={section.settings.subheading || ''} onChange={e => onUpdate({ subheading: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Button Text</Label><Input value={section.settings.buttonText || ''} onChange={e => onUpdate({ buttonText: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Button Link</Label><Input value={section.settings.buttonLink || ''} onChange={e => onUpdate({ buttonLink: e.target.value })} className="h-8 text-sm" /></div>
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">BG Color</Label><Input type="color" value={section.settings.bgColor || '#000000'} onChange={e => onUpdate({ bgColor: e.target.value })} className="h-8" /></div>
      <div><Label className="text-xs">Text Color</Label><Input type="color" value={section.settings.textColor || '#ffffff'} onChange={e => onUpdate({ textColor: e.target.value })} className="h-8" /></div>
    </div>
  </div>
);

const StatsSettings = (props: Props) => <ItemListSettings {...props} itemLabel="Stat" fields={[{ key: 'icon', label: 'Icon' }, { key: 'value', label: 'Value' }, { key: 'label', label: 'Label' }]} />;

const DividerSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Height (px)</Label><Input type="number" value={section.settings.height || 40} onChange={e => onUpdate({ height: parseInt(e.target.value) || 40 })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Style</Label>
      <Select value={section.settings.style || 'line'} onValueChange={v => onUpdate({ style: v })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="line">Line</SelectItem><SelectItem value="space">Space Only</SelectItem></SelectContent>
      </Select>
    </div>
  </div>
);

const CustomTextSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Content (HTML)</Label><Textarea value={section.settings.content || ''} onChange={e => onUpdate({ content: e.target.value })} className="text-sm min-h-[100px] font-mono" /></div>
    <div><Label className="text-xs">Text Align</Label>
      <Select value={section.settings.textAlign || 'left'} onValueChange={v => onUpdate({ textAlign: v })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
      </Select>
    </div>
  </div>
);

// ===== NEW 20 SETTINGS =====

const CountdownTimerSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">End Date</Label><Input type="datetime-local" value={section.settings.endDate || ''} onChange={e => onUpdate({ endDate: e.target.value })} className="h-8 text-sm" /></div>
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">BG Color</Label><Input type="color" value={section.settings.bgColor || '#ef4444'} onChange={e => onUpdate({ bgColor: e.target.value })} className="h-8" /></div>
      <div><Label className="text-xs">Text Color</Label><Input type="color" value={section.settings.textColor || '#ffffff'} onChange={e => onUpdate({ textColor: e.target.value })} className="h-8" /></div>
    </div>
    <div><Label className="text-xs">On Expire</Label>
      <Select value={section.settings.expireAction || 'hide'} onValueChange={v => onUpdate({ expireAction: v })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="hide">Hide Section</SelectItem><SelectItem value="show_zeros">Show 00:00</SelectItem></SelectContent>
      </Select>
    </div>
  </div>
);

const PricingTableSettings = ({ section, onUpdate }: Props) => {
  const plans = section.settings.plans || [];
  const updatePlan = (i: number, field: string, value: any) => { const n = [...plans]; n[i] = { ...n[i], [field]: value }; onUpdate({ plans: n }); };
  const updateFeature = (pi: number, fi: number, value: string) => { const n = [...plans]; n[pi].features[fi] = value; onUpdate({ plans: n }); };
  const addFeature = (pi: number) => { const n = [...plans]; n[pi].features = [...(n[pi].features || []), '']; onUpdate({ plans: n }); };
  const addPlan = () => onUpdate({ plans: [...plans, { name: 'Plan', price: '$0', period: '/mo', features: ['Feature'], recommended: false, ctaText: 'Get Started', ctaLink: '#' }] });
  const removePlan = (i: number) => onUpdate({ plans: plans.filter((_: any, idx: number) => idx !== i) });
  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
      {plans.map((plan: any, i: number) => (
        <div key={i} className="border rounded-lg p-2 space-y-1.5">
          <div className="flex items-center justify-between"><span className="text-xs font-medium">{plan.name}</span><button onClick={() => removePlan(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button></div>
          <Input value={plan.name} onChange={e => updatePlan(i, 'name', e.target.value)} placeholder="Plan name" className="h-7 text-xs" />
          <div className="grid grid-cols-2 gap-1">
            <Input value={plan.price} onChange={e => updatePlan(i, 'price', e.target.value)} placeholder="$29" className="h-7 text-xs" />
            <Input value={plan.period} onChange={e => updatePlan(i, 'period', e.target.value)} placeholder="/mo" className="h-7 text-xs" />
          </div>
          <div className="flex items-center justify-between"><Label className="text-[10px]">Recommended</Label><Switch checked={plan.recommended} onCheckedChange={v => updatePlan(i, 'recommended', v)} /></div>
          <Input value={plan.badge || ''} onChange={e => updatePlan(i, 'badge', e.target.value)} placeholder="Badge (e.g. Popular)" className="h-7 text-xs" />
          <div className="space-y-1">
            {(plan.features || []).map((f: string, fi: number) => (
              <Input key={fi} value={f} onChange={e => updateFeature(i, fi, e.target.value)} className="h-7 text-xs" />
            ))}
            <Button variant="ghost" size="sm" onClick={() => addFeature(i)} className="h-6 text-[10px] w-full"><Plus className="w-3 h-3 mr-1" />Feature</Button>
          </div>
          <Input value={plan.ctaText} onChange={e => updatePlan(i, 'ctaText', e.target.value)} placeholder="CTA text" className="h-7 text-xs" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addPlan} className="w-full h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Add Plan</Button>
    </div>
  );
};

const ImageSliderSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Images (one URL per line)</Label><Textarea value={(section.settings.images || []).join('\n')} onChange={e => onUpdate({ images: e.target.value.split('\n').filter(Boolean) })} className="text-xs min-h-[80px] font-mono" placeholder="https://..." /></div>
    <div className="flex items-center justify-between"><Label className="text-xs">Autoplay</Label><Switch checked={section.settings.autoplay !== false} onCheckedChange={v => onUpdate({ autoplay: v })} /></div>
    <div><Label className="text-xs">Interval (ms)</Label><Input type="number" value={section.settings.interval || 4000} onChange={e => onUpdate({ interval: parseInt(e.target.value) })} className="h-8 text-sm" /></div>
    <div className="flex items-center justify-between"><Label className="text-xs">Show Dots</Label><Switch checked={section.settings.showDots !== false} onCheckedChange={v => onUpdate({ showDots: v })} /></div>
    <div className="flex items-center justify-between"><Label className="text-xs">Show Arrows</Label><Switch checked={section.settings.showArrows !== false} onCheckedChange={v => onUpdate({ showArrows: v })} /></div>
    <div><Label className="text-xs">Height (px)</Label><Input type="number" value={section.settings.height || 400} onChange={e => onUpdate({ height: parseInt(e.target.value) })} className="h-8 text-sm" /></div>
  </div>
);

const FlipBoxSettings = (props: Props) => <ItemListSettings {...props} itemLabel="Flip Card" fields={[
  { key: 'frontTitle', label: 'Front Title' }, { key: 'frontIcon', label: 'Front Icon' }, { key: 'frontBg', label: 'Front BG', type: 'color' },
  { key: 'backTitle', label: 'Back Title' }, { key: 'backText', label: 'Back Text', type: 'textarea' }, { key: 'backCtaText', label: 'CTA Text' }, { key: 'backCtaLink', label: 'CTA Link' },
]} />;

const IconBoxGridSettings = (props: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Columns</Label>
      <Select value={String(props.section.settings.columns || 4)} onValueChange={v => props.onUpdate({ columns: parseInt(v) })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem><SelectItem value="4">4</SelectItem></SelectContent>
      </Select>
    </div>
    <ItemListSettings {...props} itemLabel="Icon Box" fields={[{ key: 'icon', label: 'Icon/Emoji' }, { key: 'title', label: 'Title' }, { key: 'description', label: 'Description' }]} />
  </div>
);

const ProgressBarSettings = (props: Props) => <ItemListSettings {...props} itemLabel="Bar" fields={[{ key: 'label', label: 'Label' }, { key: 'value', label: 'Value (%)', type: 'number' }, { key: 'color', label: 'Color', type: 'color' }]} />;
const TabsSettings = (props: Props) => <ItemListSettings {...props} itemLabel="Tab" fields={[{ key: 'label', label: 'Tab Label' }, { key: 'title', label: 'Title' }, { key: 'content', label: 'Content', type: 'textarea' }]} />;
const AccordionSettings = (props: Props) => <ItemListSettings {...props} itemLabel="Item" fields={[{ key: 'title', label: 'Title' }, { key: 'content', label: 'Content', type: 'textarea' }]} />;

const BeforeAfterSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Before Image URL</Label><Input value={section.settings.beforeImage || ''} onChange={e => onUpdate({ beforeImage: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">After Image URL</Label><Input value={section.settings.afterImage || ''} onChange={e => onUpdate({ afterImage: e.target.value })} className="h-8 text-sm" /></div>
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">Before Label</Label><Input value={section.settings.beforeLabel || 'Before'} onChange={e => onUpdate({ beforeLabel: e.target.value })} className="h-8 text-sm" /></div>
      <div><Label className="text-xs">After Label</Label><Input value={section.settings.afterLabel || 'After'} onChange={e => onUpdate({ afterLabel: e.target.value })} className="h-8 text-sm" /></div>
    </div>
  </div>
);

const MarqueeSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Items (one per line)</Label><Textarea value={(section.settings.items || []).join('\n')} onChange={e => onUpdate({ items: e.target.value.split('\n').filter(Boolean) })} className="text-xs min-h-[60px]" /></div>
    <div><Label className="text-xs">Speed (seconds)</Label><Input type="number" value={section.settings.speed || 30} onChange={e => onUpdate({ speed: parseInt(e.target.value) })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Direction</Label>
      <Select value={section.settings.direction || 'left'} onValueChange={v => onUpdate({ direction: v })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent>
      </Select>
    </div>
    <div className="flex items-center justify-between"><Label className="text-xs">Pause on Hover</Label><Switch checked={section.settings.pauseOnHover !== false} onCheckedChange={v => onUpdate({ pauseOnHover: v })} /></div>
  </div>
);

const LogoGridSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Logo URLs (one per line)</Label><Textarea value={(section.settings.logos || []).join('\n')} onChange={e => onUpdate({ logos: e.target.value.split('\n').filter(Boolean) })} className="text-xs min-h-[60px] font-mono" /></div>
    <div><Label className="text-xs">Columns</Label>
      <Select value={String(section.settings.columns || 4)} onValueChange={v => onUpdate({ columns: parseInt(v) })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="3">3</SelectItem><SelectItem value="4">4</SelectItem><SelectItem value="5">5</SelectItem><SelectItem value="6">6</SelectItem></SelectContent>
      </Select>
    </div>
    <div className="flex items-center justify-between"><Label className="text-xs">Grayscale</Label><Switch checked={section.settings.grayscale !== false} onCheckedChange={v => onUpdate({ grayscale: v })} /></div>
  </div>
);

const MapSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Google Maps Embed URL</Label><Input value={section.settings.embedUrl || ''} onChange={e => onUpdate({ embedUrl: e.target.value })} className="h-8 text-sm" placeholder="https://www.google.com/maps/embed?..." /></div>
    <div><Label className="text-xs">Height (px)</Label><Input type="number" value={section.settings.height || 400} onChange={e => onUpdate({ height: parseInt(e.target.value) })} className="h-8 text-sm" /></div>
  </div>
);

const ContactFormSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Subtitle</Label><Input value={section.settings.subtitle || ''} onChange={e => onUpdate({ subtitle: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Submit Button Text</Label><Input value={section.settings.submitText || ''} onChange={e => onUpdate({ submitText: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Success Message</Label><Input value={section.settings.successMessage || ''} onChange={e => onUpdate({ successMessage: e.target.value })} className="h-8 text-sm" /></div>
  </div>
);

const NewsletterSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Subtitle</Label><Input value={section.settings.subtitle || ''} onChange={e => onUpdate({ subtitle: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Placeholder</Label><Input value={section.settings.placeholder || ''} onChange={e => onUpdate({ placeholder: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Button Text</Label><Input value={section.settings.buttonText || ''} onChange={e => onUpdate({ buttonText: e.target.value })} className="h-8 text-sm" /></div>
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">BG Color</Label><Input type="color" value={section.settings.bgColor || '#000'} onChange={e => onUpdate({ bgColor: e.target.value })} className="h-8" /></div>
      <div><Label className="text-xs">Text Color</Label><Input type="color" value={section.settings.textColor || '#fff'} onChange={e => onUpdate({ textColor: e.target.value })} className="h-8" /></div>
    </div>
  </div>
);

const TeamSettings = (props: Props) => <ItemListSettings {...props} itemLabel="Member" fields={[{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'image', label: 'Image URL' }]} />;
const TimelineSettings = (props: Props) => <ItemListSettings {...props} itemLabel="Step" fields={[{ key: 'year', label: 'Year/Date' }, { key: 'title', label: 'Title' }, { key: 'description', label: 'Description', type: 'textarea' }]} />;
const AnimatedCounterSettings = (props: Props) => <ItemListSettings {...props} itemLabel="Counter" fields={[{ key: 'value', label: 'Value', type: 'number' }, { key: 'suffix', label: 'Suffix' }, { key: 'label', label: 'Label' }, { key: 'icon', label: 'Icon' }]} />;

const AlertBannerSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Message</Label><Input value={section.settings.message || ''} onChange={e => onUpdate({ message: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Type</Label>
      <Select value={section.settings.type || 'promo'} onValueChange={v => onUpdate({ type: v })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="info">Info</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="success">Success</SelectItem><SelectItem value="promo">Promo</SelectItem></SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div><Label className="text-xs">BG Color</Label><Input type="color" value={section.settings.bgColor || '#fef3c7'} onChange={e => onUpdate({ bgColor: e.target.value })} className="h-8" /></div>
      <div><Label className="text-xs">Text Color</Label><Input type="color" value={section.settings.textColor || '#92400e'} onChange={e => onUpdate({ textColor: e.target.value })} className="h-8" /></div>
    </div>
    <div><Label className="text-xs">Link Text</Label><Input value={section.settings.linkText || ''} onChange={e => onUpdate({ linkText: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Link URL</Label><Input value={section.settings.linkUrl || ''} onChange={e => onUpdate({ linkUrl: e.target.value })} className="h-8 text-sm" /></div>
    <div className="flex items-center justify-between"><Label className="text-xs">Dismissible</Label><Switch checked={section.settings.dismissible !== false} onCheckedChange={v => onUpdate({ dismissible: v })} /></div>
  </div>
);

const BlockquoteSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Quote</Label><Textarea value={section.settings.quote || ''} onChange={e => onUpdate({ quote: e.target.value })} className="text-sm min-h-[60px]" /></div>
    <div><Label className="text-xs">Author</Label><Input value={section.settings.author || ''} onChange={e => onUpdate({ author: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Author Title</Label><Input value={section.settings.authorTitle || ''} onChange={e => onUpdate({ authorTitle: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Variant</Label>
      <Select value={section.settings.variant || 'large'} onValueChange={v => onUpdate({ variant: v })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="large">Large</SelectItem><SelectItem value="small">Small</SelectItem></SelectContent>
      </Select>
    </div>
    <div className="flex items-center justify-between"><Label className="text-xs">Decorative Marks</Label><Switch checked={section.settings.decorative !== false} onCheckedChange={v => onUpdate({ decorative: v })} /></div>
  </div>
);

const VideoPlaylistSettings = (props: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={props.section.settings.title || ''} onChange={e => props.onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Layout</Label>
      <Select value={props.section.settings.layout || 'sidebar'} onValueChange={v => props.onUpdate({ layout: v })}>
        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="sidebar">Sidebar</SelectItem><SelectItem value="stacked">Stacked</SelectItem></SelectContent>
      </Select>
    </div>
    <ItemListSettings {...props} itemLabel="Video" fields={[{ key: 'title', label: 'Title' }, { key: 'url', label: 'Video URL' }, { key: 'thumbnail', label: 'Thumbnail URL' }]} />
  </div>
);

const GenericSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3"><div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div></div>
);

const SETTINGS_MAP: Record<SectionType, React.FC<Props>> = {
  hero: HeroSettings,
  featured_products: GenericSettings,
  product_grid: ProductGridSettings,
  about: AboutSettings,
  faq: FAQSettings,
  video: VideoSettings,
  gallery: GenericSettings,
  testimonials: TestimonialsSettings,
  cta: CTASettings,
  stats: StatsSettings,
  social_links: GenericSettings,
  category_showcase: GenericSettings,
  trust_badges: GenericSettings,
  divider: DividerSettings,
  custom_text: CustomTextSettings,
  // New 20
  countdown_timer: CountdownTimerSettings,
  pricing_table: PricingTableSettings,
  image_slider: ImageSliderSettings,
  flip_box: FlipBoxSettings,
  icon_box_grid: IconBoxGridSettings,
  progress_bar: ProgressBarSettings,
  tabs: TabsSettings,
  accordion: AccordionSettings,
  before_after: BeforeAfterSettings,
  marquee: MarqueeSettings,
  logo_grid: LogoGridSettings,
  map: MapSettings,
  contact_form: ContactFormSettings,
  newsletter: NewsletterSettings,
  team: TeamSettings,
  timeline: TimelineSettings,
  animated_counter: AnimatedCounterSettings,
  alert_banner: AlertBannerSettings,
  blockquote: BlockquoteSettings,
  video_playlist: VideoPlaylistSettings,
};

const StoreBuilderSections = ({ section, onUpdate, onUpdateStyles }: Props) => {
  const Component = SETTINGS_MAP[section.type] || GenericSettings;
  return (
    <div>
      <Component section={section} onUpdate={onUpdate} />
      <SectionStylesPanel section={section} onUpdateStyles={onUpdateStyles} />
    </div>
  );
};

export default StoreBuilderSections;
