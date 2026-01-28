import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  verifyAuth, 
  corsHeaders, 
  errorResponse, 
  successResponse,
  createServiceClient
} from '../_shared/auth-verify.ts';

/**
 * Validate Session Edge Function - Enterprise Grade
 * 
 * Server-side validation of JWT tokens. This is the source of truth
 * for session health and replaces client-side localStorage checks.
 * 
 * CRITICAL: Implements 12-hour grace period
 * - If token is expired but within 12 hours of expiry, return shouldRefresh=true
 * - Client should attempt refreshSession() and continue
 * - NEVER force logout within 12 hours of original login
 * 
 * Returns:
 * - valid: boolean - Whether the session is valid (or within grace period)
 * - userId: string - The authenticated user's ID
 * - email: string - The user's email
 * - isAdmin: boolean - Whether the user has admin role
 * - isSeller: boolean - Whether the user is a verified seller
 * - profileExists: boolean - Whether a profile exists for this user
 * - exp: number - Token expiry timestamp
 * - shouldRefresh: boolean - Client should refresh their token
 * - graceWindow: boolean - Within 12-hour grace period
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const authResult = await verifyAuth(authHeader);

    const now = Date.now();
    const tokenExpMs = authResult.exp ? authResult.exp * 1000 : 0;
    const twelveHoursMs = 12 * 60 * 60 * 1000;

    // Check if within 12-hour grace period even if token is "expired"
    if (!authResult.success || !authResult.userId) {
      console.log('[ValidateSession] Auth verification failed:', authResult.error);
      
      // If we have an expiry timestamp, check grace period
      if (tokenExpMs > 0) {
        const msSinceExpiry = now - tokenExpMs;
        
        if (msSinceExpiry < twelveHoursMs && msSinceExpiry > 0) {
          // Token expired but within 12-hour grace window
          console.log('[ValidateSession] Token expired but within 12h grace window');
          
          return new Response(
            JSON.stringify({ 
              data: {
                valid: true,
                shouldRefresh: true,
                graceWindow: true,
                hoursRemaining: Math.floor((twelveHoursMs - msSinceExpiry) / (60 * 60 * 1000)),
                message: 'Token expired but within grace period - please refresh'
              }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Truly expired (beyond grace period) or invalid
      return new Response(
        JSON.stringify({ 
          data: {
            valid: false, 
            error: authResult.error,
            code: 'INVALID_SESSION',
            sessionExpired: true
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

    // Check if token is near expiry (within 10 minutes) - suggest refresh
    const tenMinutesMs = 10 * 60 * 1000;
    const shouldRefresh = tokenExpMs > 0 && (tokenExpMs - now) < tenMinutesMs;

    console.log(`[ValidateSession] User ${authResult.userId} validated - admin: ${hasAdmin}, seller: ${isSeller}, shouldRefresh: ${shouldRefresh}`);

    return successResponse({
      valid: true,
      userId: authResult.userId,
      email: authResult.email,
      isAdmin: hasAdmin === true,
      isSeller: isSeller === true,
      profileExists: !!profile,
      exp: authResult.exp,
      shouldRefresh,
      graceWindow: false,
      validatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ValidateSession] Unexpected error:', error);
    return errorResponse('Validation failed', 500);
  }
});
