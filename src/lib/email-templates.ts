// Premium Email Templates Library - Fiverr/Google Style Design
// Uses dark SaaS aesthetic with gradient accents

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

// Base template wrapper with premium dark design
const wrapTemplate = (
  content: string,
  headerGradient: string = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProMPThero</title>
</head>
<body style="margin: 0; padding: 40px 20px; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto;">
    <!-- Premium Header with Gradient -->
    <div style="background: ${headerGradient}; border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <h1 style="color: white; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">ProMPThero</h1>
    </div>
    
    <!-- Content Card -->
    <div style="background: linear-gradient(135deg, #18181b 0%, #1f1f23 100%); padding: 40px; border-left: 1px solid #27272a; border-right: 1px solid #27272a;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="background: #0f0f0f; padding: 24px; border-radius: 0 0 16px 16px; border: 1px solid #27272a; border-top: 0; text-align: center;">
      <p style="color: #52525b; font-size: 12px; margin: 0 0 8px 0;">© 2024 ProMPThero. All rights reserved.</p>
      <p style="color: #52525b; font-size: 11px; margin: 0;">
        <a href="{{site_url}}/unsubscribe" style="color: #6366f1; text-decoration: none;">Unsubscribe</a> • 
        <a href="{{site_url}}/privacy" style="color: #6366f1; text-decoration: none;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// Icon circle component
const iconCircle = (emoji: string, bgColor: string = 'rgba(99, 102, 241, 0.2)'): string => `
  <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: ${bgColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
    <span style="font-size: 40px; line-height: 1;">${emoji}</span>
  </div>
`;

// CTA Button component
const ctaButton = (text: string, url: string, gradient: string = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', shadowColor: string = 'rgba(99, 102, 241, 0.4)'): string => `
  <div style="text-align: center; margin: 32px 0;">
    <a href="${url}" style="display: inline-block; background: ${gradient}; color: white; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 8px 24px ${shadowColor};">
      ${text}
    </a>
  </div>
`;

// Info box component
const infoBox = (content: string): string => `
  <div style="background: #27272a; border-radius: 12px; padding: 16px; margin-top: 24px;">
    ${content}
  </div>
`;

// Detail row component
const detailRow = (label: string, value: string): string => `
  <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #3f3f46;">
    <span style="color: #a1a1aa; font-size: 14px;">${label}</span>
    <span style="color: white; font-size: 14px; font-weight: 500;">${value}</span>
  </div>
`;

// ============================================
// SECURITY TEMPLATES
// ============================================

const passwordResetTemplate: EmailTemplate = {
  id: 'password_reset',
  name: 'Password Reset',
  description: 'Sent when user requests password reset',
  category: 'security',
  subject: 'Reset Your Password - ProMPThero',
  variables: ['{{.ConfirmationURL}}', '{{.Email}}'],
  icon: '🔐',
  buttonColor: 'violet',
  html: wrapTemplate(`
    ${iconCircle('🔐', 'rgba(99, 102, 241, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 16px 0;">Reset Your Password</h2>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 8px 0;">
      We received a request to reset the password for your account.
    </p>
    <p style="color: #71717a; text-align: center; font-size: 14px; margin: 0;">
      Click the button below to create a new password.
    </p>
    ${ctaButton('Reset Password', '{{.ConfirmationURL}}')}
    ${infoBox(`
      <p style="color: #71717a; font-size: 14px; margin: 0; text-align: center;">
        ⏱️ This link expires in <strong style="color: white;">1 hour</strong>
      </p>
    `)}
    <p style="color: #52525b; font-size: 12px; text-align: center; margin-top: 24px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `)
};

const emailConfirmationTemplate: EmailTemplate = {
  id: 'email_confirmation',
  name: 'Email Confirmation',
  description: 'Sent to verify new email addresses',
  category: 'security',
  subject: 'Confirm Your Email - ProMPThero',
  variables: ['{{.ConfirmationURL}}', '{{.Email}}'],
  icon: '✉️',
  buttonColor: 'emerald',
  html: wrapTemplate(`
    ${iconCircle('✉️', 'rgba(16, 185, 129, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 16px 0;">Verify Your Email</h2>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 8px 0;">
      Welcome to ProMPThero! Please confirm your email address to get started.
    </p>
    ${ctaButton('Confirm Email', '{{.ConfirmationURL}}', 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 'rgba(16, 185, 129, 0.4)')}
    ${infoBox(`
      <p style="color: #71717a; font-size: 14px; margin: 0; text-align: center;">
        🎉 You're just one click away from accessing <strong style="color: white;">10,000+ premium prompts</strong>
      </p>
    `)}
  `, 'linear-gradient(135deg, #10b981 0%, #059669 100%)')
};

const magicLinkTemplate: EmailTemplate = {
  id: 'magic_link',
  name: 'Magic Link',
  description: 'Passwordless login link',
  category: 'security',
  subject: 'Your Magic Login Link - ProMPThero',
  variables: ['{{.ConfirmationURL}}', '{{.Email}}'],
  icon: '🔗',
  buttonColor: 'violet',
  html: wrapTemplate(`
    ${iconCircle('🔗', 'rgba(99, 102, 241, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 16px 0;">Your Magic Login Link</h2>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0;">
      Click the button below to sign in instantly. No password needed!
    </p>
    ${ctaButton('Sign In Now', '{{.ConfirmationURL}}')}
    ${infoBox(`
      <p style="color: #71717a; font-size: 14px; margin: 0; text-align: center;">
        🔒 This link expires in <strong style="color: white;">15 minutes</strong> and can only be used once.
      </p>
    `)}
  `)
};

const securityAlertTemplate: EmailTemplate = {
  id: 'security_alert',
  name: 'Security Alert',
  description: 'Password change or security event notification',
  category: 'security',
  subject: '🔒 Security Alert - ProMPThero',
  variables: ['{{.Email}}', '{{event_type}}', '{{event_time}}', '{{ip_address}}'],
  icon: '🛡️',
  buttonColor: 'red',
  html: wrapTemplate(`
    ${iconCircle('🛡️', 'rgba(239, 68, 68, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 16px 0;">Security Alert</h2>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 24px 0;">
      We detected a security event on your account.
    </p>
    <div style="background: #27272a; border-radius: 12px; padding: 20px; border-left: 4px solid #ef4444;">
      ${detailRow('Event', '{{event_type}}')}
      ${detailRow('Time', '{{event_time}}')}
      ${detailRow('IP Address', '{{ip_address}}')}
    </div>
    ${ctaButton('Review Account', '{{site_url}}/dashboard/profile', 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 'rgba(239, 68, 68, 0.4)')}
    <p style="color: #71717a; font-size: 13px; text-align: center; margin-top: 24px;">
      If this wasn't you, please change your password immediately.
    </p>
  `, 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)')
};

const newLoginDetectedTemplate: EmailTemplate = {
  id: 'new_login_detected',
  name: 'New Login Detected',
  description: 'Sent when user logs in from new device/location',
  category: 'security',
  subject: '📍 New Login to Your Account - ProMPThero',
  variables: ['{{.Email}}', '{{device}}', '{{location}}', '{{login_time}}', '{{ip_address}}'],
  icon: '📍',
  buttonColor: 'amber',
  html: wrapTemplate(`
    ${iconCircle('📍', 'rgba(245, 158, 11, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 16px 0;">New Login Detected</h2>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 24px 0;">
      Your account was accessed from a new device or location.
    </p>
    <div style="background: #27272a; border-radius: 12px; padding: 20px;">
      ${detailRow('Device', '{{device}}')}
      ${detailRow('Location', '{{location}}')}
      ${detailRow('Time', '{{login_time}}')}
      ${detailRow('IP Address', '{{ip_address}}')}
    </div>
    ${infoBox(`
      <p style="color: #71717a; font-size: 14px; margin: 0; text-align: center;">
        ✅ If this was you, no action is needed.
      </p>
    `)}
    <p style="color: #f59e0b; font-size: 13px; text-align: center; margin-top: 24px;">
      ⚠️ If this wasn't you, <a href="{{site_url}}/dashboard/profile" style="color: #f59e0b; text-decoration: underline;">secure your account</a> immediately.
    </p>
  `, 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')
};

// ============================================
// ORDER TEMPLATES
// ============================================

const orderPlacedTemplate: EmailTemplate = {
  id: 'order_placed',
  name: 'Order Placed',
  description: 'Confirmation when order is placed',
  category: 'order',
  subject: '📦 Order Confirmed #{{order_id}} - ProMPThero',
  variables: ['{{order_id}}', '{{product_name}}', '{{amount}}', '{{order_date}}'],
  icon: '📦',
  buttonColor: 'blue',
  html: wrapTemplate(`
    ${iconCircle('📦', 'rgba(59, 130, 246, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 8px 0;">Order Confirmed!</h2>
    <p style="color: #3b82f6; text-align: center; font-size: 14px; font-weight: 600; margin: 0 0 24px 0;">
      Order #{{order_id}}
    </p>
    <div style="background: #27272a; border-radius: 12px; padding: 20px;">
      ${detailRow('Product', '{{product_name}}')}
      ${detailRow('Amount', '₹{{amount}}')}
      ${detailRow('Date', '{{order_date}}')}
      ${detailRow('Status', '<span style="color: #10b981;">Pending Delivery</span>')}
    </div>
    ${ctaButton('View Order Details', '{{site_url}}/dashboard/purchases', 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 'rgba(59, 130, 246, 0.4)')}
    ${infoBox(`
      <p style="color: #71717a; font-size: 14px; margin: 0; text-align: center;">
        📧 You'll receive your product within <strong style="color: white;">24 hours</strong>
      </p>
    `)}
  `, 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')
};

const orderDeliveredTemplate: EmailTemplate = {
  id: 'order_delivered',
  name: 'Order Delivered',
  description: 'Sent when order is delivered',
  category: 'order',
  subject: '✅ Order Delivered #{{order_id}} - ProMPThero',
  variables: ['{{order_id}}', '{{product_name}}'],
  icon: '✅',
  buttonColor: 'emerald',
  html: wrapTemplate(`
    ${iconCircle('✅', 'rgba(16, 185, 129, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 8px 0;">Order Delivered!</h2>
    <p style="color: #10b981; text-align: center; font-size: 14px; font-weight: 600; margin: 0 0 24px 0;">
      Order #{{order_id}}
    </p>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 24px 0;">
      Your order for <strong style="color: white;">{{product_name}}</strong> has been delivered successfully!
    </p>
    ${ctaButton('Access Your Product', '{{site_url}}/dashboard/purchases', 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 'rgba(16, 185, 129, 0.4)')}
    ${infoBox(`
      <p style="color: #71717a; font-size: 14px; margin: 0; text-align: center;">
        ⭐ Love it? <a href="{{site_url}}/review/{{order_id}}" style="color: #10b981; text-decoration: underline;">Leave a review</a>
      </p>
    `)}
  `, 'linear-gradient(135deg, #10b981 0%, #059669 100%)')
};

const orderApprovedTemplate: EmailTemplate = {
  id: 'order_approved',
  name: 'Order Approved',
  description: 'Sent to seller when order is approved',
  category: 'order',
  subject: '⭐ Your Order Was Approved! - ProMPThero',
  variables: ['{{order_id}}', '{{product_name}}', '{{buyer_name}}', '{{amount}}'],
  icon: '⭐',
  buttonColor: 'amber',
  html: wrapTemplate(`
    ${iconCircle('⭐', 'rgba(245, 158, 11, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 16px 0;">Order Approved!</h2>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 24px 0;">
      Great news! Your product delivery has been approved by the buyer.
    </p>
    <div style="background: #27272a; border-radius: 12px; padding: 20px;">
      ${detailRow('Order', '#{{order_id}}')}
      ${detailRow('Product', '{{product_name}}')}
      ${detailRow('Buyer', '{{buyer_name}}')}
      ${detailRow('Earnings', '<span style="color: #10b981;">+₹{{amount}}</span>')}
    </div>
    ${ctaButton('View Earnings', '{{site_url}}/seller/wallet', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 'rgba(245, 158, 11, 0.4)')}
  `, 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')
};

const sellerNewOrderTemplate: EmailTemplate = {
  id: 'seller_new_order',
  name: 'Seller New Order',
  description: 'Notifies seller of new order',
  category: 'order',
  subject: '🛒 New Order Received! - ProMPThero',
  variables: ['{{order_id}}', '{{product_name}}', '{{buyer_name}}', '{{amount}}'],
  icon: '🛒',
  buttonColor: 'violet',
  html: wrapTemplate(`
    ${iconCircle('🛒', 'rgba(99, 102, 241, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 16px 0;">New Order Received!</h2>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 24px 0;">
      You've received a new order. Please deliver within 24 hours.
    </p>
    <div style="background: #27272a; border-radius: 12px; padding: 20px;">
      ${detailRow('Order', '#{{order_id}}')}
      ${detailRow('Product', '{{product_name}}')}
      ${detailRow('Buyer', '{{buyer_name}}')}
      ${detailRow('Amount', '₹{{amount}}')}
    </div>
    ${ctaButton('Deliver Order', '{{site_url}}/seller/orders', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 'rgba(99, 102, 241, 0.4)')}
    ${infoBox(`
      <p style="color: #f59e0b; font-size: 14px; margin: 0; text-align: center;">
        ⏱️ Deliver within <strong style="color: white;">24 hours</strong> to maintain your seller rating
      </p>
    `)}
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
  subject: '💰 Wallet Credited - ProMPThero',
  variables: ['{{amount}}', '{{new_balance}}', '{{payment_method}}', '{{transaction_id}}'],
  icon: '💰',
  buttonColor: 'emerald',
  html: wrapTemplate(`
    ${iconCircle('💰', 'rgba(16, 185, 129, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 16px 0;">Wallet Credited!</h2>
    <p style="color: #10b981; text-align: center; font-size: 32px; font-weight: 700; margin: 0 0 24px 0;">
      +₹{{amount}}
    </p>
    <div style="background: #27272a; border-radius: 12px; padding: 20px;">
      ${detailRow('New Balance', '₹{{new_balance}}')}
      ${detailRow('Payment Method', '{{payment_method}}')}
      ${detailRow('Transaction ID', '{{transaction_id}}')}
    </div>
    ${ctaButton('View Wallet', '{{site_url}}/dashboard/wallet', 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 'rgba(16, 185, 129, 0.4)')}
  `, 'linear-gradient(135deg, #10b981 0%, #059669 100%)')
};

const lowBalanceAlertTemplate: EmailTemplate = {
  id: 'low_balance_alert',
  name: 'Low Balance Alert',
  description: 'Warning when wallet balance is low',
  category: 'wallet',
  subject: '⚠️ Low Wallet Balance - ProMPThero',
  variables: ['{{current_balance}}', '{{threshold}}'],
  icon: '⚠️',
  buttonColor: 'amber',
  html: wrapTemplate(`
    ${iconCircle('⚠️', 'rgba(245, 158, 11, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 16px 0;">Low Balance Alert</h2>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 24px 0;">
      Your wallet balance is running low.
    </p>
    <div style="background: linear-gradient(135deg, #27272a 0%, #1f1f23 100%); border-radius: 16px; padding: 24px; text-align: center; border: 1px solid #f59e0b30;">
      <p style="color: #71717a; font-size: 14px; margin: 0 0 8px 0;">Current Balance</p>
      <p style="color: #f59e0b; font-size: 36px; font-weight: 700; margin: 0;">₹{{current_balance}}</p>
    </div>
    ${ctaButton('Top Up Now', '{{site_url}}/dashboard/wallet', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 'rgba(245, 158, 11, 0.4)')}
  `, 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')
};

const refundProcessedTemplate: EmailTemplate = {
  id: 'refund_processed',
  name: 'Refund Processed',
  description: 'Confirmation of refund',
  category: 'wallet',
  subject: '💸 Refund Processed - ProMPThero',
  variables: ['{{amount}}', '{{order_id}}', '{{reason}}', '{{new_balance}}'],
  icon: '💸',
  buttonColor: 'blue',
  html: wrapTemplate(`
    ${iconCircle('💸', 'rgba(59, 130, 246, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 16px 0;">Refund Processed</h2>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 24px 0;">
      Your refund has been processed and credited to your wallet.
    </p>
    <div style="background: #27272a; border-radius: 12px; padding: 20px;">
      ${detailRow('Refund Amount', '<span style="color: #10b981;">+₹{{amount}}</span>')}
      ${detailRow('Order ID', '#{{order_id}}')}
      ${detailRow('Reason', '{{reason}}')}
      ${detailRow('New Balance', '₹{{new_balance}}')}
    </div>
    ${ctaButton('View Wallet', '{{site_url}}/dashboard/wallet', 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 'rgba(59, 130, 246, 0.4)')}
  `, 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')
};

const withdrawalCompleteTemplate: EmailTemplate = {
  id: 'withdrawal_complete',
  name: 'Withdrawal Complete',
  description: 'Confirmation of withdrawal',
  category: 'wallet',
  subject: '🏦 Withdrawal Complete - ProMPThero',
  variables: ['{{amount}}', '{{bank_name}}', '{{account_last4}}', '{{transaction_id}}'],
  icon: '🏦',
  buttonColor: 'violet',
  html: wrapTemplate(`
    ${iconCircle('🏦', 'rgba(99, 102, 241, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 16px 0;">Withdrawal Complete</h2>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 24px 0;">
      Your withdrawal has been processed successfully.
    </p>
    <div style="background: #27272a; border-radius: 12px; padding: 20px;">
      ${detailRow('Amount', '₹{{amount}}')}
      ${detailRow('Bank', '{{bank_name}}')}
      ${detailRow('Account', '****{{account_last4}}')}
      ${detailRow('Transaction ID', '{{transaction_id}}')}
    </div>
    ${ctaButton('View Transaction History', '{{site_url}}/seller/wallet', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 'rgba(99, 102, 241, 0.4)')}
    ${infoBox(`
      <p style="color: #71717a; font-size: 14px; margin: 0; text-align: center;">
        💳 Funds will reflect in your account within <strong style="color: white;">2-3 business days</strong>
      </p>
    `)}
  `)
};

// ============================================
// MARKETING TEMPLATES
// ============================================

const welcomeEmailTemplate: EmailTemplate = {
  id: 'welcome_email',
  name: 'Welcome Email',
  description: 'Sent after successful registration',
  category: 'marketing',
  subject: '🎉 Welcome to ProMPThero! - Let\'s Get Started',
  variables: ['{{user_name}}'],
  icon: '🎉',
  buttonColor: 'violet',
  html: wrapTemplate(`
    ${iconCircle('🎉', 'rgba(99, 102, 241, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 8px 0;">Welcome, {{user_name}}!</h2>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 24px 0;">
      You now have access to the world's largest collection of AI prompts.
    </p>
    
    <!-- Feature highlights -->
    <div style="background: #27272a; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 24px; margin-right: 12px;">📚</span>
        <div>
          <p style="color: white; font-size: 14px; font-weight: 600; margin: 0;">10,000+ Premium Prompts</p>
          <p style="color: #71717a; font-size: 12px; margin: 0;">ChatGPT, Midjourney, DALL-E & more</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 24px; margin-right: 12px;">🤖</span>
        <div>
          <p style="color: white; font-size: 14px; font-weight: 600; margin: 0;">AI Account Access</p>
          <p style="color: #71717a; font-size: 12px; margin: 0;">Premium AI tools at unbeatable prices</p>
        </div>
      </div>
      <div style="display: flex; align-items: center;">
        <span style="font-size: 24px; margin-right: 12px;">🛒</span>
        <div>
          <p style="color: white; font-size: 14px; font-weight: 600; margin: 0;">Seller Marketplace</p>
          <p style="color: #71717a; font-size: 12px; margin: 0;">Buy & sell digital products</p>
        </div>
      </div>
    </div>
    
    ${ctaButton('Explore Prompts', '{{site_url}}/dashboard')}
  `)
};

const proUpgradeTemplate: EmailTemplate = {
  id: 'pro_upgrade',
  name: 'Pro Plan Upgrade',
  description: 'Welcome to Pro membership',
  category: 'marketing',
  subject: '👑 Welcome to Pro! - ProMPThero',
  variables: ['{{user_name}}', '{{plan_name}}', '{{expiry_date}}'],
  icon: '👑',
  buttonColor: 'amber',
  html: wrapTemplate(`
    ${iconCircle('👑', 'rgba(245, 158, 11, 0.2)')}
    <h2 style="color: #fafafa; text-align: center; font-size: 24px; margin: 0 0 8px 0;">You're Now Pro!</h2>
    <p style="color: #f59e0b; text-align: center; font-size: 14px; font-weight: 600; margin: 0 0 24px 0;">
      {{plan_name}} Active
    </p>
    <p style="color: #a1a1aa; text-align: center; line-height: 1.6; margin: 0 0 24px 0;">
      Congratulations, {{user_name}}! You now have unlimited access to all premium features.
    </p>
    
    <!-- Pro benefits -->
    <div style="background: linear-gradient(135deg, #27272a 0%, #1f1f23 100%); border-radius: 12px; padding: 20px; border: 1px solid #f59e0b30;">
      <p style="color: #f59e0b; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">✨ Your Pro Benefits</p>
      <div style="color: #a1a1aa; font-size: 14px; line-height: 2;">
        ✅ Unlimited prompt access<br>
        ✅ Priority support<br>
        ✅ Early access to new features<br>
        ✅ Exclusive Pro-only prompts<br>
        ✅ No ads
      </div>
    </div>
    
    ${ctaButton('Explore Pro Features', '{{site_url}}/dashboard', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 'rgba(245, 158, 11, 0.4)')}
    
    <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 24px;">
      Your Pro membership is valid until <strong style="color: white;">{{expiry_date}}</strong>
    </p>
  `, 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)')
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
  // Order
  orderPlacedTemplate,
  orderDeliveredTemplate,
  orderApprovedTemplate,
  sellerNewOrderTemplate,
  // Wallet
  walletTopupTemplate,
  lowBalanceAlertTemplate,
  refundProcessedTemplate,
  withdrawalCompleteTemplate,
  // Marketing
  welcomeEmailTemplate,
  proUpgradeTemplate,
];

export const getTemplateById = (id: string): EmailTemplate | undefined => {
  return emailTemplates.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: EmailTemplate['category']): EmailTemplate[] => {
  return emailTemplates.filter(t => t.category === category);
};

export const getCategoryColor = (category: EmailTemplate['category']): string => {
  const colors: Record<EmailTemplate['category'], string> = {
    security: 'bg-red-500/20 text-red-400 border-red-500/30',
    order: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    wallet: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    marketing: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  };
  return colors[category];
};

export const getCategoryIcon = (category: EmailTemplate['category']): string => {
  const icons: Record<EmailTemplate['category'], string> = {
    security: '🔒',
    order: '📦',
    wallet: '💰',
    marketing: '📣',
  };
  return icons[category];
};
