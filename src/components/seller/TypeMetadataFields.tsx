import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PRODUCT_TYPES, ProductType } from '@/lib/product-types';

interface TypeMetadataFieldsProps {
  type: string;
  metadata: Record<string, any>;
  onChange: (metadata: Record<string, any>) => void;
}

const fieldLabels: Record<string, string> = {
  // eBook
  page_count: 'Page Count',
  format: 'Format (PDF, EPUB, etc.)',
  language: 'Language',
  // Road Selfie
  pack_size: 'Number of Photos',
  locations: 'Locations (comma separated)',
  resolution: 'Resolution (e.g., 4K, HD)',
  // Digital Account
  subscription_type: 'Subscription Type',
  validity: 'Validity Period',
  warranty_days: 'Warranty (days)',
  // Software
  version: 'Version',
  platforms: 'Platforms (comma separated)',
  requirements: 'System Requirements',
  // Course
  duration_hours: 'Duration (hours)',
  lessons: 'Number of Lessons',
  level: 'Difficulty Level',
  // Template
  compatibility: 'Compatibility',
  demo_url: 'Demo URL',
  // Graphics
  dimensions: 'Dimensions',
  file_types: 'File Types',
  license: 'License Type',
  // Audio
  duration_seconds: 'Duration (seconds)',
  bpm: 'BPM',
  // Video
  fps: 'FPS',
  // Service
  delivery_days: 'Delivery Time (days)',
  revisions: 'Revisions Included',
  includes: 'What\'s Included',
};

const fieldPlaceholders: Record<string, string> = {
  page_count: '250',
  format: 'PDF',
  language: 'English',
  pack_size: '50',
  locations: 'Beach, City, Mountain',
  resolution: '4K',
  subscription_type: 'Monthly, Yearly',
  validity: '1 Year',
  warranty_days: '30',
  version: '2.1.0',
  platforms: 'Windows, Mac, Linux',
  requirements: '8GB RAM, 2GB Disk Space',
  duration_hours: '12',
  lessons: '45',
  level: 'Beginner',
  compatibility: 'WordPress 6.0+',
  demo_url: 'https://demo.example.com',
  dimensions: '4000x3000px',
  file_types: 'PNG, JPG, SVG',
  license: 'Commercial',
  duration_seconds: '180',
  bpm: '120',
  fps: '60',
  delivery_days: '3',
  revisions: '2',
  includes: 'Source files, Documentation',
};

const TypeMetadataFields = ({ type, metadata, onChange }: TypeMetadataFieldsProps) => {
  const typeConfig = PRODUCT_TYPES[type as ProductType];
  
  if (!typeConfig || !typeConfig.metadataFields.length) {
    return null;
  }

  const handleFieldChange = (field: string, value: string) => {
    // Handle array fields (comma-separated values)
    const arrayFields = ['locations', 'platforms', 'file_types'];
    let processedValue: string | string[] | number = value;
    
    if (arrayFields.includes(field) && value) {
      processedValue = value.split(',').map(v => v.trim()).filter(Boolean);
    } else if (['page_count', 'pack_size', 'warranty_days', 'duration_hours', 'lessons', 'duration_seconds', 'bpm', 'fps', 'delivery_days', 'revisions'].includes(field)) {
      processedValue = parseInt(value) || 0;
    }

    onChange({
      ...metadata,
      [field]: processedValue
    });
  };

  const getFieldValue = (field: string): string => {
    const val = metadata[field];
    if (Array.isArray(val)) {
      return val.join(', ');
    }
    return val?.toString() || '';
  };

  return (
    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <typeConfig.icon className={`w-4 h-4 ${typeConfig.textClass}`} />
        <span className="text-sm font-medium text-slate-700">
          {typeConfig.label} Details
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {typeConfig.metadataFields.map(field => (
          <div key={field} className="space-y-1">
            <Label className="text-xs text-slate-600">
              {fieldLabels[field] || field}
            </Label>
            <Input
              type={['page_count', 'pack_size', 'warranty_days', 'duration_hours', 'lessons', 'duration_seconds', 'bpm', 'fps', 'delivery_days', 'revisions'].includes(field) ? 'number' : 'text'}
              value={getFieldValue(field)}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={fieldPlaceholders[field] || ''}
              className="h-9 text-sm border-slate-200 rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TypeMetadataFields;
