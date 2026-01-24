import React, { useState } from 'react';
import { Mail, Smartphone, Monitor, Copy, Check, Eye, Shield, Key, UserPlus, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'security' | 'onboarding';
  subject: string;
  variables: string[];
  html: string;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: 'password_reset',
    name: 'Password Reset',
    description: 'Sent when a user requests to reset their password',
    icon: <Key className="w-5 h-5" />,
    category: 'security',
    subject: 'Reset Your Password - ProMPThero',
    variables: ['{{.ConfirmationURL}}', '{{.Email}}'],
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #18181b 0%, #1f1f23 100%); border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">ProMPThero</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: rgba(99, 102, 241, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px;">🔐</span>
        </div>
      </div>
      
      <h2 style="color: #fafafa; font-size: 24px; margin: 0 0 16px; text-align: center;">Reset Your Password</h2>
      
      <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
        We received a request to reset your password. Click the button below to create a new one.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{.ConfirmationURL}}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
          Reset Password
        </a>
      </div>
      
      <div style="background: #27272a; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="color: #71717a; font-size: 14px; margin: 0; text-align: center;">
          ⏱️ This link expires in <strong style="color: #fafafa;">1 hour</strong>
        </p>
      </div>
      
      <p style="color: #71717a; font-size: 14px; margin: 24px 0 0; text-align: center;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="padding: 24px 32px; border-top: 1px solid #27272a; text-align: center;">
      <p style="color: #52525b; font-size: 12px; margin: 0;">
        © 2024 ProMPThero. All rights reserved.
      </p>
      <p style="color: #52525b; font-size: 12px; margin: 8px 0 0;">
        This is an automated security email.
      </p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'email_confirmation',
    name: 'Email Confirmation',
    description: 'Sent to verify new user email addresses',
    icon: <UserPlus className="w-5 h-5" />,
    category: 'onboarding',
    subject: 'Confirm Your Email - ProMPThero',
    variables: ['{{.ConfirmationURL}}', '{{.Email}}'],
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #18181b 0%, #1f1f23 100%); border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">ProMPThero</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px;">✉️</span>
        </div>
      </div>
      
      <h2 style="color: #fafafa; font-size: 24px; margin: 0 0 16px; text-align: center;">Welcome to ProMPThero!</h2>
      
      <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
        Thanks for signing up! Please confirm your email address to get started with the best AI prompts.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{.ConfirmationURL}}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);">
          Confirm Email
        </a>
      </div>
      
      <div style="background: #27272a; border-radius: 8px; padding: 20px; margin-top: 24px;">
        <h3 style="color: #fafafa; font-size: 16px; margin: 0 0 12px;">🚀 What's next?</h3>
        <ul style="color: #a1a1aa; font-size: 14px; line-height: 22px; margin: 0; padding-left: 20px;">
          <li>Explore our premium AI prompt library</li>
          <li>Get access to ChatGPT, Midjourney, and more</li>
          <li>Boost your productivity 10x</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="padding: 24px 32px; border-top: 1px solid #27272a; text-align: center;">
      <p style="color: #52525b; font-size: 12px; margin: 0;">
        © 2024 ProMPThero. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'magic_link',
    name: 'Magic Link',
    description: 'Passwordless login link sent to users',
    icon: <Link2 className="w-5 h-5" />,
    category: 'security',
    subject: 'Your Login Link - ProMPThero',
    variables: ['{{.ConfirmationURL}}', '{{.Email}}'],
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #18181b 0%, #1f1f23 100%); border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">ProMPThero</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: rgba(99, 102, 241, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px;">🔗</span>
        </div>
      </div>
      
      <h2 style="color: #fafafa; font-size: 24px; margin: 0 0 16px; text-align: center;">Your Magic Login Link</h2>
      
      <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
        Click the button below to securely sign in to your account. No password needed!
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="{{.ConfirmationURL}}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
          Sign In Now
        </a>
      </div>
      
      <div style="background: #27272a; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="color: #71717a; font-size: 14px; margin: 0; text-align: center;">
          🔒 This link expires in <strong style="color: #fafafa;">10 minutes</strong> for security
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="padding: 24px 32px; border-top: 1px solid #27272a; text-align: center;">
      <p style="color: #52525b; font-size: 12px; margin: 0;">
        © 2024 ProMPThero. All rights reserved.
      </p>
      <p style="color: #52525b; font-size: 12px; margin: 8px 0 0;">
        If you didn't request this link, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'security_alert',
    name: 'Security Alert',
    description: 'Sent when suspicious activity is detected',
    icon: <Shield className="w-5 h-5" />,
    category: 'security',
    subject: '⚠️ Security Alert - ProMPThero',
    variables: ['{{.Email}}', '{{.Device}}', '{{.Location}}', '{{.Time}}'],
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #18181b 0%, #1f1f23 100%); border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">⚠️ Security Alert</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: rgba(239, 68, 68, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px;">🛡️</span>
        </div>
      </div>
      
      <h2 style="color: #fafafa; font-size: 24px; margin: 0 0 16px; text-align: center;">New Login Detected</h2>
      
      <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin: 0 0 24px; text-align: center;">
        We noticed a new sign-in to your ProMPThero account.
      </p>
      
      <div style="background: #27272a; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #71717a; padding: 8px 0; font-size: 14px;">Device</td>
            <td style="color: #fafafa; padding: 8px 0; font-size: 14px; text-align: right;">{{.Device}}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 8px 0; font-size: 14px; border-top: 1px solid #3f3f46;">Location</td>
            <td style="color: #fafafa; padding: 8px 0; font-size: 14px; text-align: right; border-top: 1px solid #3f3f46;">{{.Location}}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 8px 0; font-size: 14px; border-top: 1px solid #3f3f46;">Time</td>
            <td style="color: #fafafa; padding: 8px 0; font-size: 14px; text-align: right; border-top: 1px solid #3f3f46;">{{.Time}}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #fcd34d; font-size: 14px; line-height: 22px; margin: 0 0 24px; text-align: center; background: rgba(252, 211, 77, 0.1); padding: 12px; border-radius: 8px;">
        If this wasn't you, please change your password immediately.
      </p>
      
      <div style="text-align: center;">
        <a href="{{.ChangePasswordURL}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Secure My Account
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="padding: 24px 32px; border-top: 1px solid #27272a; text-align: center;">
      <p style="color: #52525b; font-size: 12px; margin: 0;">
        © 2024 ProMPThero. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
  }
];

const EmailTemplatesSection = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(emailTemplates[0]);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(selectedTemplate.html);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Template HTML copied to clipboard"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'bg-red-500/20 text-red-400';
      case 'onboarding': return 'bg-green-500/20 text-green-400';
      default: return 'bg-primary/20 text-primary';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Email Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Preview built-in email templates used by the authentication system
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Available Templates
          </h3>
          {emailTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                selectedTemplate.id === template.id
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getCategoryColor(template.category)}`}>
                  {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {template.description}
                  </p>
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Template Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-foreground">{selectedTemplate.name}</h3>
              <p className="text-sm text-muted-foreground">Subject: {selectedTemplate.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'desktop' ? 'bg-background text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Monitor size={18} />
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'mobile' ? 'bg-background text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Smartphone size={18} />
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyHtml}>
                {copied ? <Check size={16} className="mr-1" /> : <Copy size={16} className="mr-1" />}
                {copied ? 'Copied' : 'Copy HTML'}
              </Button>
            </div>
          </div>

          {/* Variables */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Variables:</span>
            {selectedTemplate.variables.map((variable) => (
              <code key={variable} className="text-xs bg-muted px-2 py-1 rounded text-primary">
                {variable}
              </code>
            ))}
          </div>

          {/* Preview Frame */}
          <div className="bg-[#0a0a0a] rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-muted-foreground">Email Preview</span>
              </div>
              <Eye size={14} className="text-muted-foreground" />
            </div>
            <div 
              className="flex justify-center p-6 overflow-auto"
              style={{ backgroundColor: '#0a0a0a' }}
            >
              <div 
                className="transition-all duration-300"
                style={{ 
                  width: viewMode === 'desktop' ? '600px' : '375px',
                  maxWidth: '100%'
                }}
              >
                <iframe
                  srcDoc={selectedTemplate.html}
                  className="w-full border-0 bg-transparent"
                  style={{ 
                    height: '600px',
                    backgroundColor: 'transparent'
                  }}
                  title="Email Preview"
                />
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-primary">
              <strong>💡 Note:</strong> These templates are built into the Lovable Cloud authentication system. 
              They are automatically sent for password resets, email confirmations, and magic link logins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatesSection;
