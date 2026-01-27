import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  verifyAuth, 
  corsHeaders, 
  errorResponse, 
  successResponse,
  createServiceClient
} from '../_shared/auth-verify.ts';

/**
 * Validate Session Edge Function
 * 
 * Server-side validation of JWT tokens. This is the source of truth
 * for session health and replaces client-side localStorage checks.
 * 
 * Returns:
 * - valid: boolean - Whether the session is valid
 * - userId: string - The authenticated user's ID
 * - email: string - The user's email
 * - isAdmin: boolean - Whether the user has admin role
 * - profileExists: boolean - Whether a profile exists for this user
 * - exp: number - Token expiry timestamp
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const authResult = await verifyAuth(authHeader);

    if (!authResult.success || !authResult.userId) {
      console.log('[ValidateSession] Auth verification failed:', authResult.error);
      return new Response(
        JSON.stringify({ 
          data: {
            valid: false, 
            error: authResult.error,
            code: 'INVALID_SESSION'
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service client for privileged operations
    const supabase = createServiceClient();
    
    // Fetch minimal profile data to confirm user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email')
      .eq('user_id', authResult.userId)
      .maybeSingle();

    if (profileError) {
      console.error('[ValidateSession] Profile fetch error:', profileError);
    }

    // Check admin role server-side using the has_role function
    const { data: hasAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: authResult.userId, _role: 'admin' });

    if (roleError) {
      console.error('[ValidateSession] Role check error:', roleError);
    }

    // Check seller status
    const { data: isSeller, error: sellerError } = await supabase
      .rpc('is_seller', { _user_id: authResult.userId });

    if (sellerError) {
      console.error('[ValidateSession] Seller check error:', sellerError);
    }

    console.log(`[ValidateSession] User ${authResult.userId} validated - admin: ${hasAdmin}, seller: ${isSeller}`);

    return successResponse({
      valid: true,
      userId: authResult.userId,
      email: authResult.email,
      isAdmin: hasAdmin === true,
      isSeller: isSeller === true,
      profileExists: !!profile,
      exp: authResult.exp,
      validatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ValidateSession] Unexpected error:', error);
    return errorResponse('Validation failed', 500);
  }
});
