import { supabase } from "@/integrations/supabase/client";
import { emailTemplates, EmailTemplate } from "./email-templates";

export type EmailTemplateId = EmailTemplate['id'];

interface SendEmailOptions {
  templateId: EmailTemplateId;
  to: string;
  variables: Record<string, string>;
}

/**
 * Renders a template by replacing {{variable}} placeholders with actual values
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, value);
  }
  return rendered;
}

/**
 * Gets the subject line with variables replaced
 */
export function getRenderedSubject(templateId: EmailTemplateId, variables: Record<string, string>): string {
  const template = emailTemplates.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  return renderTemplate(template.subject, variables);
}

/**
 * Gets the HTML body with variables replaced
 */
export function getRenderedHtml(templateId: EmailTemplateId, variables: Record<string, string>): string {
  const template = emailTemplates.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  return renderTemplate(template.html, variables);
}

/**
 * Gets sample variables for testing a template
 */
export function getSampleVariables(templateId: string): Record<string, string> {
  const sampleData: Record<string, Record<string, string>> = {
    // Security templates
    password_reset: {
      '{{.ConfirmationURL}}': 'https://uptoza.com/reset?token=sample123',
      '{{.Email}}': 'user@example.com',
    },
    email_confirmation: {
      '{{.ConfirmationURL}}': 'https://uptoza.com/confirm?token=sample123',
      '{{.Email}}': 'user@example.com',
    },
    magic_link: {
      '{{.ConfirmationURL}}': 'https://uptoza.com/magic?token=sample123',
      '{{.Email}}': 'user@example.com',
    },
    security_alert: {
      '{{.Email}}': 'user@example.com',
      event_type: 'Password Changed',
      event_time: new Date().toLocaleString(),
      ip_address: '192.168.1.1',
    },
    new_login_detected: {
      '{{.Email}}': 'user@example.com',
      device: 'Chrome on Windows',
      location: 'Mumbai, India',
      login_time: new Date().toLocaleString(),
      ip_address: '192.168.1.1',
    },
    
    // Order templates
    order_placed: {
      order_id: 'ORD-TEST-001',
      product_name: 'Premium ChatGPT Prompt Pack',
      amount: '299',
      order_date: new Date().toLocaleDateString(),
    },
    order_delivered: {
      order_id: 'ORD-TEST-001',
      product_name: 'Premium ChatGPT Prompt Pack',
    },
    order_approved: {
      order_id: 'ORD-TEST-001',
      product_name: 'Premium ChatGPT Prompt Pack',
      buyer_name: 'John Doe',
      amount: '250',
    },
    seller_new_order: {
      order_id: 'ORD-TEST-001',
      product_name: 'Premium ChatGPT Prompt Pack',
      buyer_name: 'John Doe',
      amount: '299',
    },
    
    // Wallet templates
    wallet_topup: {
      amount: '500',
      new_balance: '1,500',
      payment_method: 'Razorpay',
      transaction_id: 'TXN-TEST-001',
    },
    low_balance_alert: {
      current_balance: '50',
      threshold: '100',
    },
    refund_processed: {
      amount: '299',
      order_id: 'ORD-TEST-001',
      reason: 'Product not as described',
      new_balance: '799',
    },
    withdrawal_success: {
      amount: '1,000',
      payment_method: 'Bank Transfer',
      account_details: '****1234',
      transaction_id: 'WTH-TEST-001',
    },
    
    // Marketing templates
    welcome_email: {
      user_name: 'John',
    },
    pro_upgrade: {
      user_name: 'John',
    },
    special_offer: {
      user_name: 'John',
      discount: '50',
      offer_code: 'SAVE50',
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    },
  };

  return sampleData[templateId] || {};
}

/**
 * Sends an email using the configured email provider
 */
export async function sendEmail({ templateId, to, variables }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const template = emailTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Add common variables
    const allVariables = {
      site_url: window.location.origin,
      current_year: new Date().getFullYear().toString(),
      ...variables,
    };

    const subject = renderTemplate(template.subject, allVariables);
    const html = renderTemplate(template.html, allVariables);

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        template_id: templateId,
        to,
        subject,
        html,
        variables: allVariables,
      },
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Checks the health of the email configuration
 */
export async function checkEmailHealth(): Promise<{
  healthy: boolean;
  config: {
    worker_url: boolean;
    email_secret: boolean;
    from_address: string | null;
  };
  worker_reachable: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('email-health');
    
    if (error) {
      return {
        healthy: false,
        config: { worker_url: false, email_secret: false, from_address: null },
        worker_reachable: false,
        error: error.message,
      };
    }
    
    return data;
  } catch (error: any) {
    return {
      healthy: false,
      config: { worker_url: false, email_secret: false, from_address: null },
      worker_reachable: false,
      error: error.message,
    };
  }
}

/**
 * Helper to send order confirmation email to buyer
 */
export async function sendOrderConfirmationEmail(
  buyerEmail: string,
  orderDetails: {
    orderId: string;
    productName: string;
    amount: string;
    sellerName: string;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    templateId: 'order_placed',
    to: buyerEmail,
    variables: {
      user_name: buyerEmail.split('@')[0],
      order_id: orderDetails.orderId,
      product_name: orderDetails.productName,
      order_amount: orderDetails.amount,
      seller_name: orderDetails.sellerName,
    },
  });
}

/**
 * Helper to send new order notification to seller
 */
export async function sendSellerOrderNotification(
  sellerEmail: string,
  orderDetails: {
    orderId: string;
    productName: string;
    amount: string;
    buyerName: string;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    templateId: 'seller_new_order',
    to: sellerEmail,
    variables: {
      seller_name: sellerEmail.split('@')[0],
      order_id: orderDetails.orderId,
      product_name: orderDetails.productName,
      order_amount: orderDetails.amount,
      buyer_name: orderDetails.buyerName,
    },
  });
}

/**
 * Helper to send wallet top-up confirmation
 */
export async function sendWalletTopupEmail(
  userEmail: string,
  topupDetails: {
    amount: string;
    newBalance: string;
    transactionId: string;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    templateId: 'wallet_topup',
    to: userEmail,
    variables: {
      user_name: userEmail.split('@')[0],
      topup_amount: topupDetails.amount,
      new_balance: topupDetails.newBalance,
      transaction_id: topupDetails.transactionId,
    },
  });
}
