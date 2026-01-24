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
