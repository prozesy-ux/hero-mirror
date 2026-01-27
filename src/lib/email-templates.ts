// Premium Email Templates Library - Google/Cloudflare/Fiverr Style
// Clean white/black professional design - NO AI-looking gradients

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'order' | 'wallet' | 'marketing';
  subject: string;
  variables: string[];
  icon: string;
  buttonColor: 'violet' | 'emerald' | 'blue' | 'amber' | 'red';
  html: string;
}

// Professional base template - clean white design
const wrapTemplate = (content: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uptoza</title>
</head>
<body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto;">
    <!-- Header -->
    <div style="text-align: center; padding: 32px 0;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.5px;">uptoza</h1>
    </div>
    
    <!-- Content Card -->
    <div style="background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 32px 20px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
        © ${new Date().getFullYear()} Uptoza. All rights reserved.
      </p>
      <p style="margin: 0; font-size: 11px; color: #9ca3af;">
        <a href="{{site_url}}/unsubscribe" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
        <span style="margin: 0 8px;">·</span>
        <a href="{{site_url}}/privacy" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// Simple CTA Button
const ctaButton = (text: string, url: string, color: string = '#6366f1'): string => `
<div style="text-align: center; padding: 8px 0;">
  <a href="${url}" style="display: inline-block; background-color: ${color}; color: #ffffff; padding: 14px 32px; border-radius: 6px; font-weight: 500; font-size: 14px; text-decoration: none;">${text}</a>
</div>
`;

// OTP Code Box - Premium style
const otpBox = (codeVar: string): string => `
<div style="text-align: center; padding: 24px 0;">
  <div style="display: inline-block; background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px 40px;">
    <span style="font-family: 'SF Mono', 'Fira Code', monospace; font-size: 32px; font-weight: 600; color: #1a1a1a; letter-spacing: 6px;">${codeVar}</span>
  </div>
  <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;">Copy this code to complete verification</p>
</div>
`;

// Info row
const infoRow = (label: string, value: string): string => `
<tr>
  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
    <span style="font-size: 13px; color: #6b7280;">${label}</span>
  </td>
  <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">
    <span style="font-size: 13px; color: #1a1a1a; font-weight: 500;">${value}</span>
  </td>
</tr>
`;

// ============================================
// SECURITY TEMPLATES
// ============================================

const passwordResetTemplate: EmailTemplate = {
  id: 'password_reset',
  name: 'Password Reset',
  description: 'Sent when user requests password reset',
  category: 'security',
  subject: 'Reset your password',
  variables: ['{{.ConfirmationURL}}', '{{.Email}}'],
  icon: 'key',
  buttonColor: 'violet',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #f3f4f6; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Reset your password</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        We received a request to reset the password for your account. Click the button below to create a new password.
      </p>
      ${ctaButton('Reset Password', '{{.ConfirmationURL}}')}
      <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
        This link expires in 1 hour. If you didn't request this, ignore this email.
      </p>
    </div>
  `)
};

const emailConfirmationTemplate: EmailTemplate = {
  id: 'email_confirmation',
  name: 'Email Confirmation',
  description: 'Sent to verify new email addresses',
  category: 'security',
  subject: 'Confirm your email address',
  variables: ['{{.ConfirmationURL}}', '{{.Email}}'],
  icon: 'mail',
  buttonColor: 'emerald',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #ecfdf5; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Confirm your email</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        Welcome to Uptoza! Please confirm your email address to get started with your account.
      </p>
      ${ctaButton('Confirm Email', '{{.ConfirmationURL}}', '#10b981')}
    </div>
  `)
};

const magicLinkTemplate: EmailTemplate = {
  id: 'magic_link',
  name: 'Magic Link',
  description: 'Passwordless login link',
  category: 'security',
  subject: 'Your sign-in link',
  variables: ['{{.ConfirmationURL}}', '{{.Email}}'],
  icon: 'link',
  buttonColor: 'violet',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #f3f4f6; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Sign in to Uptoza</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        Click the button below to sign in. No password needed.
      </p>
      ${ctaButton('Sign In', '{{.ConfirmationURL}}')}
      <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
        This link expires in 15 minutes and can only be used once.
      </p>
    </div>
  `)
};

const securityAlertTemplate: EmailTemplate = {
  id: 'security_alert',
  name: 'Security Alert',
  description: 'Password change or security event notification',
  category: 'security',
  subject: 'Security alert for your account',
  variables: ['{{.Email}}', '{{event_type}}', '{{event_time}}', '{{ip_address}}'],
  icon: 'shield',
  buttonColor: 'red',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #fef2f2; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Security Alert</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        We detected a security event on your account.
      </p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${infoRow('Event', '{{event_type}}')}
          ${infoRow('Time', '{{event_time}}')}
          ${infoRow('IP Address', '{{ip_address}}')}
        </table>
      </div>
      ${ctaButton('Review Account', '{{site_url}}/dashboard/profile', '#ef4444')}
      <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
        If this wasn't you, change your password immediately.
      </p>
    </div>
  `)
};

const newLoginDetectedTemplate: EmailTemplate = {
  id: 'new_login_detected',
  name: 'New Login Detected',
  description: 'Sent when user logs in from new device/location',
  category: 'security',
  subject: 'New login to your account',
  variables: ['{{.Email}}', '{{device}}', '{{location}}', '{{login_time}}', '{{ip_address}}'],
  icon: 'globe',
  buttonColor: 'amber',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #fffbeb; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">New login detected</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        Your account was accessed from a new device or location.
      </p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${infoRow('Device', '{{device}}')}
          ${infoRow('Location', '{{location}}')}
          ${infoRow('Time', '{{login_time}}')}
          ${infoRow('IP Address', '{{ip_address}}')}
        </table>
      </div>
      <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
        If this was you, no action is needed. If not, <a href="{{site_url}}/dashboard/profile" style="color: #f59e0b; text-decoration: underline;">secure your account</a>.
      </p>
    </div>
  `)
};

const otpVerificationTemplate: EmailTemplate = {
  id: 'otp_verification',
  name: 'OTP Verification',
  description: 'One-time password for verification',
  category: 'security',
  subject: 'Your verification code',
  variables: ['{{otp_code}}', '{{.Email}}'],
  icon: 'lock',
  buttonColor: 'violet',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #f3f4f6; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Your verification code</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        Enter this code to verify your identity.
      </p>
      ${otpBox('{{otp_code}}')}
      <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
        This code expires in 10 minutes. Don't share it with anyone.
      </p>
    </div>
  `)
};

// ============================================
// ORDER TEMPLATES
// ============================================

const orderPlacedTemplate: EmailTemplate = {
  id: 'order_placed',
  name: 'Order Placed',
  description: 'Confirmation when order is placed',
  category: 'order',
  subject: 'Order confirmed #{{order_id}}',
  variables: ['{{order_id}}', '{{product_name}}', '{{amount}}', '{{order_date}}'],
  icon: 'package',
  buttonColor: 'blue',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #eff6ff; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Order Confirmed</h2>
      <p style="margin: 0 0 24px 0; font-size: 13px; color: #6b7280; text-align: center;">Order #{{order_id}}</p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${infoRow('Product', '{{product_name}}')}
          ${infoRow('Amount', '₹{{amount}}')}
          ${infoRow('Date', '{{order_date}}')}
          ${infoRow('Status', '<span style="color: #f59e0b;">Pending Delivery</span>')}
        </table>
      </div>
      ${ctaButton('View Order', '{{site_url}}/dashboard/purchases', '#3b82f6')}
      <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
        You'll receive your product within 24 hours.
      </p>
    </div>
  `)
};

const orderDeliveredTemplate: EmailTemplate = {
  id: 'order_delivered',
  name: 'Order Delivered',
  description: 'Sent when order is delivered',
  category: 'order',
  subject: 'Order delivered #{{order_id}}',
  variables: ['{{order_id}}', '{{product_name}}'],
  icon: 'check',
  buttonColor: 'emerald',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #ecfdf5; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Order Delivered</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        Your order for <strong>{{product_name}}</strong> has been delivered.
      </p>
      ${ctaButton('Access Product', '{{site_url}}/dashboard/purchases', '#10b981')}
      <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
        Enjoy your purchase! <a href="{{site_url}}/review/{{order_id}}" style="color: #6b7280; text-decoration: underline;">Leave a review</a>
      </p>
    </div>
  `)
};

const sellerNewOrderTemplate: EmailTemplate = {
  id: 'seller_new_order',
  name: 'Seller New Order',
  description: 'Notifies seller of new order',
  category: 'order',
  subject: 'New order received #{{order_id}}',
  variables: ['{{order_id}}', '{{product_name}}', '{{buyer_name}}', '{{amount}}'],
  icon: 'shopping-cart',
  buttonColor: 'violet',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #f3f4f6; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">New Order Received</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        You have a new order. Please deliver within 24 hours.
      </p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${infoRow('Order', '#{{order_id}}')}
          ${infoRow('Product', '{{product_name}}')}
          ${infoRow('Buyer', '{{buyer_name}}')}
          ${infoRow('Amount', '₹{{amount}}')}
        </table>
      </div>
      ${ctaButton('Deliver Order', '{{site_url}}/seller/orders')}
      <div style="background: #fffbeb; border-radius: 6px; padding: 12px 16px; margin-top: 24px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #92400e;">
          Deliver within 24 hours to maintain your seller rating
        </p>
      </div>
    </div>
  `)
};

const orderApprovedTemplate: EmailTemplate = {
  id: 'order_approved',
  name: 'Order Approved',
  description: 'Sent to seller when order is approved',
  category: 'order',
  subject: 'Order approved - Payment released',
  variables: ['{{order_id}}', '{{product_name}}', '{{buyer_name}}', '{{amount}}'],
  icon: 'check-circle',
  buttonColor: 'emerald',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #ecfdf5; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Payment Released</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        The buyer approved your delivery. Your earnings have been credited.
      </p>
      <div style="background: #ecfdf5; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #059669;">Earnings Credited</p>
        <p style="margin: 0; font-size: 28px; font-weight: 600; color: #10b981;">+₹{{amount}}</p>
      </div>
      ${ctaButton('View Wallet', '{{site_url}}/seller/wallet', '#10b981')}
    </div>
  `)
};

// ============================================
// WALLET TEMPLATES
// ============================================

const walletTopupTemplate: EmailTemplate = {
  id: 'wallet_topup',
  name: 'Wallet Top-up',
  description: 'Confirmation of wallet credit',
  category: 'wallet',
  subject: 'Wallet credited - ₹{{amount}}',
  variables: ['{{amount}}', '{{new_balance}}', '{{payment_method}}', '{{transaction_id}}'],
  icon: 'wallet',
  buttonColor: 'emerald',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #ecfdf5; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Wallet Credited</h2>
      <div style="background: #ecfdf5; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #059669;">Amount Added</p>
        <p style="margin: 0; font-size: 32px; font-weight: 600; color: #10b981;">+₹{{amount}}</p>
      </div>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${infoRow('New Balance', '₹{{new_balance}}')}
          ${infoRow('Payment Method', '{{payment_method}}')}
          ${infoRow('Transaction ID', '{{transaction_id}}')}
        </table>
      </div>
      ${ctaButton('View Wallet', '{{site_url}}/dashboard/wallet', '#10b981')}
    </div>
  `)
};

const lowBalanceAlertTemplate: EmailTemplate = {
  id: 'low_balance_alert',
  name: 'Low Balance Alert',
  description: 'Warning when wallet balance is low',
  category: 'wallet',
  subject: 'Low wallet balance',
  variables: ['{{current_balance}}', '{{threshold}}'],
  icon: 'alert-triangle',
  buttonColor: 'amber',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #fffbeb; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Low Balance Alert</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        Your wallet balance is running low.
      </p>
      <div style="background: #fffbeb; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #92400e;">Current Balance</p>
        <p style="margin: 0; font-size: 32px; font-weight: 600; color: #f59e0b;">₹{{current_balance}}</p>
      </div>
      ${ctaButton('Top Up Now', '{{site_url}}/dashboard/wallet', '#f59e0b')}
    </div>
  `)
};

const refundProcessedTemplate: EmailTemplate = {
  id: 'refund_processed',
  name: 'Refund Processed',
  description: 'Confirmation of refund',
  category: 'wallet',
  subject: 'Refund processed - ₹{{amount}}',
  variables: ['{{amount}}', '{{order_id}}', '{{reason}}', '{{new_balance}}'],
  icon: 'refresh',
  buttonColor: 'emerald',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #ecfdf5; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Refund Processed</h2>
      <div style="background: #ecfdf5; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #059669;">Amount Refunded</p>
        <p style="margin: 0; font-size: 32px; font-weight: 600; color: #10b981;">+₹{{amount}}</p>
      </div>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${infoRow('Order', '#{{order_id}}')}
          ${infoRow('Reason', '{{reason}}')}
          ${infoRow('New Balance', '₹{{new_balance}}')}
        </table>
      </div>
      ${ctaButton('View Wallet', '{{site_url}}/dashboard/wallet', '#10b981')}
    </div>
  `)
};

const withdrawalSuccessTemplate: EmailTemplate = {
  id: 'withdrawal_success',
  name: 'Withdrawal Success',
  description: 'Confirmation when withdrawal is approved',
  category: 'wallet',
  subject: 'Withdrawal approved - ₹{{amount}}',
  variables: ['{{amount}}', '{{payment_method}}', '{{account_details}}', '{{transaction_id}}'],
  icon: 'check-circle',
  buttonColor: 'emerald',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #ecfdf5; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Withdrawal Approved</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        Your withdrawal request has been approved and is being processed.
      </p>
      <div style="background: #ecfdf5; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #059669;">Amount Withdrawn</p>
        <p style="margin: 0; font-size: 32px; font-weight: 600; color: #10b981;">₹{{amount}}</p>
      </div>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${infoRow('Payment Method', '{{payment_method}}')}
          ${infoRow('Account', '{{account_details}}')}
          ${infoRow('Reference', '{{transaction_id}}')}
        </table>
      </div>
      <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
        Funds will be credited to your account within 1-3 business days.
      </p>
    </div>
  `)
};

const withdrawalRejectedTemplate: EmailTemplate = {
  id: 'withdrawal_rejected',
  name: 'Withdrawal Rejected',
  description: 'Notification when withdrawal is rejected',
  category: 'wallet',
  subject: 'Withdrawal request rejected',
  variables: ['{{amount}}', '{{reason}}', '{{new_balance}}'],
  icon: 'x-circle',
  buttonColor: 'red',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #fef2f2; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Withdrawal Rejected</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        Your withdrawal request for ₹{{amount}} has been rejected.
      </p>
      <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 500; color: #991b1b;">Reason:</p>
        <p style="margin: 0; font-size: 14px; color: #7f1d1d;">{{reason}}</p>
      </div>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${infoRow('Requested Amount', '₹{{amount}}')}
          ${infoRow('Wallet Balance', '₹{{new_balance}}')}
        </table>
      </div>
      ${ctaButton('Contact Support', '{{site_url}}/dashboard/chat', '#ef4444')}
    </div>
  `)
};

const withdrawalSubmittedTemplate: EmailTemplate = {
  id: 'withdrawal_submitted',
  name: 'Withdrawal Submitted',
  description: 'Confirmation when withdrawal request is submitted',
  category: 'wallet',
  subject: 'Withdrawal request submitted - ₹{{amount}}',
  variables: ['{{amount}}', '{{payment_method}}', '{{account_details}}'],
  icon: 'clock',
  buttonColor: 'amber',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #fffbeb; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Withdrawal Submitted</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        Your withdrawal request is pending review by our team.
      </p>
      <div style="background: #fffbeb; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #92400e;">Pending Amount</p>
        <p style="margin: 0; font-size: 32px; font-weight: 600; color: #f59e0b;">₹{{amount}}</p>
      </div>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${infoRow('Payment Method', '{{payment_method}}')}
          ${infoRow('Account', '{{account_details}}')}
          ${infoRow('Status', '<span style="color: #f59e0b;">Pending Review</span>')}
        </table>
      </div>
      <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
        You will receive an email once your request is processed.
      </p>
    </div>
  `)
};

// ============================================
// MARKETING TEMPLATES
// ============================================

const welcomeEmailTemplate: EmailTemplate = {
  id: 'welcome_email',
  name: 'Welcome Email',
  description: 'Sent to new users after signup',
  category: 'marketing',
  subject: 'Welcome to Uptoza',
  variables: ['{{user_name}}'],
  icon: 'sparkles',
  buttonColor: 'violet',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #f3f4f6; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Welcome to Uptoza</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        Hi {{user_name}}, thanks for joining! You now have access to our digital marketplace with premium AI tools and products.
      </p>
      ${ctaButton('Start Exploring', '{{site_url}}/dashboard')}
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-top: 32px;">
        <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #1a1a1a;">Quick start:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4b5563; line-height: 1.8;">
          <li>Browse premium AI accounts</li>
          <li>Explore digital products</li>
          <li>Top up your wallet</li>
        </ul>
      </div>
    </div>
  `)
};

const proUpgradeTemplate: EmailTemplate = {
  id: 'pro_upgrade',
  name: 'Pro Upgrade',
  description: 'Confirmation of Pro plan upgrade',
  category: 'marketing',
  subject: 'Welcome to Uptoza Pro',
  variables: ['{{user_name}}'],
  icon: 'crown',
  buttonColor: 'amber',
  html: wrapTemplate(`
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #fffbeb; border-radius: 12px; line-height: 48px;">
          <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>
        </div>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Welcome to Pro</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
        You've unlocked all premium features. Enjoy unlimited access to our complete library.
      </p>
      ${ctaButton('Access Pro Features', '{{site_url}}/dashboard', '#f59e0b')}
      <div style="background: #fffbeb; border-radius: 8px; padding: 20px; margin-top: 32px;">
        <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #92400e;">Pro benefits:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #78350f; line-height: 1.8;">
          <li>Unlimited prompts access</li>
          <li>Priority support</li>
          <li>Exclusive content</li>
        </ul>
      </div>
    </div>
  `)
};

// ============================================
// EXPORT ALL TEMPLATES
// ============================================

export const emailTemplates: EmailTemplate[] = [
  // Security
  passwordResetTemplate,
  emailConfirmationTemplate,
  magicLinkTemplate,
  securityAlertTemplate,
  newLoginDetectedTemplate,
  otpVerificationTemplate,
  // Order
  orderPlacedTemplate,
  orderDeliveredTemplate,
  sellerNewOrderTemplate,
  orderApprovedTemplate,
  // Wallet
  walletTopupTemplate,
  lowBalanceAlertTemplate,
  refundProcessedTemplate,
  withdrawalSuccessTemplate,
  withdrawalRejectedTemplate,
  withdrawalSubmittedTemplate,
  // Marketing
  welcomeEmailTemplate,
  proUpgradeTemplate,
];

// Helper functions
export const getTemplateById = (id: string): EmailTemplate | undefined => {
  return emailTemplates.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: EmailTemplate['category']): EmailTemplate[] => {
  return emailTemplates.filter(t => t.category === category);
};

export const getCategoryColor = (category: EmailTemplate['category']): string => {
  const colors: Record<string, string> = {
    security: 'text-violet-400 bg-violet-500/20 border-violet-500/30',
    order: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    wallet: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    marketing: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  };
  return colors[category] || 'text-slate-400 bg-slate-500/20 border-slate-500/30';
};

export const getCategoryIcon = (category: EmailTemplate['category']): string => {
  const icons: Record<string, string> = {
    security: 'Shield',
    order: 'ShoppingCart',
    wallet: 'Wallet',
    marketing: 'Megaphone',
  };
  return icons[category] || 'Mail';
};
