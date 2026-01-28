const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Fetch image from URL and convert to base64
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ImageSearchBot/1.0)',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binary);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return { base64, mimeType: contentType };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let image: string;
    let mimeType: string;

    // Handle both direct base64 and URL input
    if (body.imageUrl) {
      console.log('[ImageSearch] Fetching image from URL:', body.imageUrl);
      const result = await fetchImageAsBase64(body.imageUrl);
      image = result.base64;
      mimeType = result.mimeType;
    } else if (body.image) {
      image = body.image;
      mimeType = body.mimeType || 'image/jpeg';
    } else {
      return new Response(
        JSON.stringify({ error: 'No image or imageUrl provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI Gateway with Gemini for image analysis
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('[ImageSearch] Analyzing image with AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and identify what product, service, or AI tool it represents. Focus on:
1. Brand name or product name visible
2. Type of product (AI account, subscription, digital service)
3. Key identifying features

Return ONLY a short search query (2-5 words) that would find this product in a marketplace. 
Examples: "ChatGPT Plus", "Midjourney subscription", "Claude Pro account"

If you cannot identify a specific product, return a general category like "AI assistant" or "image generator".
Do not include any explanation, just the search query.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ImageSearch] AI Gateway error:', errorText);
      throw new Error('AI analysis failed');
    }

    const data = await response.json();
    const searchQuery = data.choices?.[0]?.message?.content?.trim() || '';

    // Clean up the response
    const cleanedQuery = searchQuery
      .replace(/^["']|["']$/g, '')
      .replace(/\n/g, ' ')
      .trim();

    console.log('[ImageSearch] Result:', cleanedQuery);

    return new Response(
      JSON.stringify({ 
        searchQuery: cleanedQuery,
        success: true 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    );
  } catch (error) {
    console.error('[ImageSearch] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Image analysis failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
