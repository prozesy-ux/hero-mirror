const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI Gateway with Gemini for image analysis
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
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
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${image}`,
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
      console.error("AI Gateway error:", errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const searchQuery = data.choices?.[0]?.message?.content?.trim() || "";

    // Clean up the response - remove quotes and extra whitespace
    const cleanedQuery = searchQuery
      .replace(/^["']|["']$/g, '')
      .replace(/\n/g, ' ')
      .trim();

    console.log("Image analysis result:", cleanedQuery);

    return new Response(
      JSON.stringify({ 
        searchQuery: cleanedQuery,
        success: true 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
        } 
      }
    );
  } catch (error) {
    console.error("Image search error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Image analysis failed", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
