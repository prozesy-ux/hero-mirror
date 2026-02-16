import { StoreSection, SectionType, SECTION_LABELS } from './types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface Props {
  section: StoreSection;
  onUpdate: (settings: Record<string, any>) => void;
}

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
    <div><Label className="text-xs">BG Image URL</Label><Input value={section.settings.bgImage || ''} onChange={e => onUpdate({ bgImage: e.target.value })} className="h-8 text-sm" placeholder="https://..." /></div>
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

const FAQSettings = ({ section, onUpdate }: Props) => {
  const items = section.settings.items || [];
  const updateItem = (i: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[i] = { ...newItems[i], [field]: value };
    onUpdate({ items: newItems });
  };
  const addItem = () => onUpdate({ items: [...items, { question: '', answer: '' }] });
  const removeItem = (i: number) => onUpdate({ items: items.filter((_: any, idx: number) => idx !== i) });
  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
      {items.map((item: any, i: number) => (
        <div key={i} className="border rounded-lg p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Q{i + 1}</span>
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
          </div>
          <Input value={item.question} onChange={e => updateItem(i, 'question', e.target.value)} placeholder="Question" className="h-7 text-xs" />
          <Textarea value={item.answer} onChange={e => updateItem(i, 'answer', e.target.value)} placeholder="Answer" className="text-xs min-h-[50px]" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="w-full h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Add FAQ</Button>
    </div>
  );
};

const VideoSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
    <div><Label className="text-xs">Video URL</Label><Input value={section.settings.videoUrl || ''} onChange={e => onUpdate({ videoUrl: e.target.value })} className="h-8 text-sm" placeholder="https://youtube.com/watch?v=..." /></div>
  </div>
);

const TestimonialsSettings = ({ section, onUpdate }: Props) => {
  const items = section.settings.items || [];
  const updateItem = (i: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[i] = { ...newItems[i], [field]: value };
    onUpdate({ items: newItems });
  };
  const addItem = () => onUpdate({ items: [...items, { name: '', text: '', rating: 5 }] });
  const removeItem = (i: number) => onUpdate({ items: items.filter((_: any, idx: number) => idx !== i) });
  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
      {items.map((item: any, i: number) => (
        <div key={i} className="border rounded-lg p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Review {i + 1}</span>
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
          </div>
          <Input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Name" className="h-7 text-xs" />
          <Textarea value={item.text} onChange={e => updateItem(i, 'text', e.target.value)} placeholder="Review text" className="text-xs min-h-[40px]" />
          <div><Label className="text-xs">Rating</Label>
            <Select value={String(item.rating || 5)} onValueChange={v => updateItem(i, 'rating', parseInt(v))}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{[5,4,3,2,1].map(r => <SelectItem key={r} value={String(r)}>{r} ⭐</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="w-full h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Add Review</Button>
    </div>
  );
};

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

const StatsSettings = ({ section, onUpdate }: Props) => {
  const items = section.settings.items || [];
  const updateItem = (i: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[i] = { ...newItems[i], [field]: value };
    onUpdate({ items: newItems });
  };
  const addItem = () => onUpdate({ items: [...items, { label: '', value: '', icon: '📊' }] });
  const removeItem = (i: number) => onUpdate({ items: items.filter((_: any, idx: number) => idx !== i) });
  return (
    <div className="space-y-3">
      {items.map((item: any, i: number) => (
        <div key={i} className="border rounded-lg p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Stat {i + 1}</span>
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Input value={item.icon} onChange={e => updateItem(i, 'icon', e.target.value)} placeholder="📊" className="h-7 text-xs" />
            <Input value={item.value} onChange={e => updateItem(i, 'value', e.target.value)} placeholder="1000+" className="h-7 text-xs" />
            <Input value={item.label} onChange={e => updateItem(i, 'label', e.target.value)} placeholder="Label" className="h-7 text-xs" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="w-full h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Add Stat</Button>
    </div>
  );
};

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

const GenericSettings = ({ section, onUpdate }: Props) => (
  <div className="space-y-3">
    <div><Label className="text-xs">Title</Label><Input value={section.settings.title || ''} onChange={e => onUpdate({ title: e.target.value })} className="h-8 text-sm" /></div>
  </div>
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
};

const StoreBuilderSections = ({ section, onUpdate }: Props) => {
  const Component = SETTINGS_MAP[section.type] || GenericSettings;
  return <Component section={section} onUpdate={onUpdate} />;
};

export default StoreBuilderSections;
