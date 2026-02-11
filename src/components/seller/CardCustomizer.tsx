import { useState } from 'react';
import { CardSettings, DEFAULT_CARD_SETTINGS } from '@/components/marketplace/card-types';
import { CARD_STYLE_PRESETS, STYLE_KEYS } from '@/components/marketplace/card-styles';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Check } from 'lucide-react';

interface CardCustomizerProps {
  settings: CardSettings | Partial<CardSettings>;
  onChange: (settings: CardSettings | Partial<CardSettings>) => void;
  mode?: 'store' | 'product';
}

const BORDER_OPTIONS: { value: CardSettings['borderRadius']; label: string }[] = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
];

const CardCustomizer = ({ settings, onChange, mode = 'store' }: CardCustomizerProps) => {
  const [useDefaults, setUseDefaults] = useState<Record<string, boolean>>({});

  const update = (key: keyof CardSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const toggleDefault = (key: string) => {
    const next = !useDefaults[key];
    setUseDefaults(prev => ({ ...prev, [key]: next }));
    if (next) {
      update(key as keyof CardSettings, DEFAULT_CARD_SETTINGS[key as keyof CardSettings]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Style Presets */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Card Style</Label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STYLE_KEYS.map(key => {
            const preset = CARD_STYLE_PRESETS[key];
            const isActive = settings.style === key;
            return (
              <button
                key={key}
                onClick={() => update('style', key)}
                className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                  isActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isActive && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
                <div className="text-xs font-bold mb-0.5">{preset.name}</div>
                <div className="text-[10px] text-slate-500 leading-tight">{preset.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Button Text */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-sm font-semibold">Button Text</Label>
          {mode === 'product' && (
            <button onClick={() => toggleDefault('buttonText')} className="text-xs text-slate-500 hover:text-slate-700">
              {useDefaults.buttonText ? '✓ Using default' : 'Use default'}
            </button>
          )}
        </div>
        <Input
          value={settings.buttonText}
          onChange={(e) => update('buttonText', e.target.value)}
          placeholder="Buy"
          className="h-9"
          disabled={mode === 'product' && useDefaults.buttonText}
        />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Button Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.buttonColor}
              onChange={(e) => update('buttonColor', e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <Input value={settings.buttonColor} onChange={(e) => update('buttonColor', e.target.value)} className="h-8 text-xs flex-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Button Text</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={settings.buttonTextColor} onChange={(e) => update('buttonTextColor', e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
            <Input value={settings.buttonTextColor} onChange={(e) => update('buttonTextColor', e.target.value)} className="h-8 text-xs flex-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Price Color</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={settings.accentColor} onChange={(e) => update('accentColor', e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
            <Input value={settings.accentColor} onChange={(e) => update('accentColor', e.target.value)} className="h-8 text-xs flex-1" />
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Border Radius</Label>
        <div className="flex gap-2">
          {BORDER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('borderRadius', opt.value)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                settings.borderRadius === opt.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Show Rating</Label>
          <Switch checked={settings.showRating} onCheckedChange={(v) => update('showRating', v)} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Show Seller Name</Label>
          <Switch checked={settings.showSellerName} onCheckedChange={(v) => update('showSellerName', v)} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Show Badge</Label>
          <Switch checked={settings.showBadge} onCheckedChange={(v) => update('showBadge', v)} />
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Preview</Label>
        <div className="bg-slate-50 rounded-xl p-4 flex justify-center">
          <div className="w-56">
            <div className={`overflow-hidden ${
              CARD_STYLE_PRESETS[settings.style]?.container || ''
            } ${settings.borderRadius === 'sharp' ? 'rounded-none' : settings.borderRadius === 'pill' ? 'rounded-3xl' : 'rounded-xl'}`}>
              <div className="aspect-[4/3] bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                <span className="text-slate-400 text-xs">Product Image</span>
              </div>
              <div className="p-3">
                <div className={`text-sm mb-1 ${CARD_STYLE_PRESETS[settings.style]?.title || 'font-semibold'}`}>Sample Product</div>
                {settings.showSellerName && <p className="text-xs text-slate-500 mb-2">by Your Store</p>}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold" style={{ color: settings.accentColor }}>$29</span>
                  {settings.showRating && <span className="text-xs text-slate-400">★ 4.8</span>}
                </div>
                <button
                  className={`w-full py-2 text-sm font-semibold ${
                    settings.borderRadius === 'sharp' ? 'rounded-none' : settings.borderRadius === 'pill' ? 'rounded-full' : 'rounded-lg'
                  }`}
                  style={{ backgroundColor: settings.buttonColor, color: settings.buttonTextColor }}
                >
                  {settings.buttonText || 'Buy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardCustomizer;
