/**
 * Shared server-side authentication verification utility
 * This is the single source of truth for session validation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  role?: string;
  exp?: number;
  error?: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

/**
 * Verify a JWT token server-side and extract user claims
 * Returns user info if valid, error if invalid/expired
 */
export async function verifyAuth(authHeader: string | null): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!token || token === 'null' || token === 'undefined') {
    return { success: false, error: 'Invalid token' };
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create a client with the user's token to verify it
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the token using getClaims - this validates signature and expiry
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.error('[AuthVerify] Token verification failed:', error?.message);
      return { success: false, error: error?.message || 'Invalid or expired token' };
    }

    const user = data.user;
    
    // Extract role from app_metadata if available
    const role = user.app_metadata?.role || user.role || 'user';

    return {
      success: true,
      userId: user.id,
      email: user.email || '',
      role,
      exp: Math.floor(Date.now() / 1000) + 3600 // Approximate expiry
    };
  } catch (err) {
    console.error('[AuthVerify] Unexpected error:', err);
    return { success: false, error: 'Token verification failed' };
  }
}

/**
 * Create an authenticated Supabase client using service role
 * for trusted server-side operations
 */
export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Create a Supabase client scoped to the user's permissions
 */
export function createUserScopedClient(authHeader: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Standard CORS headers for all BFF endpoints
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Create a standard error response
 */
export function errorResponse(message: string, status: number = 401): Response {
  return new Response(
    JSON.stringify({ 
      error: message, 
      code: status === 401 ? 'UNAUTHORIZED' : status >= 500 ? 'RETRYABLE' : 'ERROR' 
    }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Create a standard success response
 */
export function successResponse(data: any): Response {
  return new Response(
    JSON.stringify({ data }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
