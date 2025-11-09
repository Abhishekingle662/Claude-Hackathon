import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ContentGenerationRequest, BrandVoiceAnalysis, GeneratedContent, Industry } from "@/app/types";

// Validate API key format
function validateApiKey(apiKey: string): boolean {
  // Anthropic API keys start with 'sk-ant-' and are base64-like strings
  return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Analyze brand voice from example content (supports text and images)
async function analyzeBrandVoice(examples: string[] | any[]): Promise<BrandVoiceAnalysis> {
  // Validate input
  if (!examples || !Array.isArray(examples) || examples.length === 0) {
    console.warn("No examples provided for brand voice analysis");
    return {
      tone: "professional",
      style: "clear and concise",
      terminology: [],
      structure: "standard"
    };
  }

  // Handle both legacy string array and new BrandVoiceExample format
  const processedExamples = examples
    .map((ex, i) => {
      if (typeof ex === 'string') {
        return { type: 'text', content: ex };
      }
      return ex;
    })
    .filter(ex => ex && (ex.content || ex.text)); // Filter out empty examples

  // Build message content with text and images
  const messageContent: any[] = [];
  
  let textPrompt = `Analyze the brand voice and writing style from these example content pieces. `;
  
  // Check if we have images
  const hasImages = processedExamples.some(ex => ex.type === 'image');
  
  if (hasImages) {
    textPrompt += `For images, analyze the visual style, color schemes, typography, layout, and overall design aesthetic. For text, analyze writing style, tone, terminology, and structure. `;
  }
  
  textPrompt += `Provide a detailed analysis in JSON format with:
- tone: The overall tone (e.g., "conversational", "professional", "data-driven")
- style: Writing style characteristics (e.g., "short paragraphs", "bullet points", "narrative")
- terminology: Array of key terms and jargon used
- structure: How content is typically structured${hasImages ? '\n- visualStyle: Visual design characteristics (e.g., "minimalist with soft pastels", "bold geometric shapes with vibrant colors", "clean modern typography with lots of whitespace")' : ''}

Examples:`;

  messageContent.push({ type: "text", text: textPrompt });

  // Add examples (text or images or mixed)
  processedExamples.forEach((ex, i) => {
    if (!ex) {
      console.warn(`Skipping empty example ${i + 1}`);
      return;
    }

    // Handle image (with optional text)
    if ((ex.type === 'image' || ex.type === 'mixed') && ex.content) {
      try {
        // Extract base64 data (remove data URL prefix if present)
        let imageData = ex.content;
        if (imageData.includes(',')) {
          imageData = imageData.split(',')[1];
        } else if (imageData.startsWith('data:')) {
          imageData = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        }
        
        // Determine media type
        let mediaType = ex.mimeType || "image/png";
        if (!mediaType && ex.content.startsWith('data:')) {
          const match = ex.content.match(/data:([^;]+)/);
          if (match) mediaType = match[1];
        }

        // Add image
        messageContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: imageData
          }
        });
        
        // Add text description if provided
        const imageText = ex.textContent || '';
        if (imageText.trim()) {
          messageContent.push({ type: "text", text: `\nExample ${i + 1} (Image with description): ${imageText}\nAnalyze both the visual style, colors, typography, design elements, AND the writing style of the description.\n` });
        } else {
          messageContent.push({ type: "text", text: `\nExample ${i + 1} (Image): Analyze the visual style, colors, typography, and design elements.\n` });
        }
      } catch (error) {
        console.error(`Error processing image example ${i + 1}:`, error);
        // Fallback to text description
        messageContent.push({ type: "text", text: `\nExample ${i + 1} (Image upload failed, please try again):\n` });
      }
    }
    
    // Handle text content (always add if present, even if there's also an image)
    if (ex.type === 'text' || ex.type === 'mixed' || !ex.type) {
      const textContent = ex.type === 'mixed' ? (ex.textContent || ex.content) : ex.content;
      if (textContent && typeof textContent === 'string' && textContent.trim()) {
        messageContent.push({ type: "text", text: `\nExample ${i + 1}${ex.type === 'mixed' ? ' (Text description for image)' : ''}:\n${textContent}\n` });
      }
    }
  });

  messageContent.push({ type: "text", text: `\nRespond with ONLY valid JSON in this format:
{
  "tone": "...",
  "style": "...",
  "terminology": ["term1", "term2", ...],
  "structure": "..."${hasImages ? ',\n  "visualStyle": "..."' : ''}
}` });

  try {
    // Use the latest available Claude model (must support vision for images)
    const model = process.env.CLAUDE_MODEL || "claude-3-7-sonnet-20250219";
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: messageContent
      }]
    });

    const content = message.content[0];
    if (content.type === "text") {
      let text = content.text.trim();
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        text = jsonMatch[1];
      }
      // Try to find JSON object in the text
      const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        text = jsonObjectMatch[0];
      }
      const analysis = JSON.parse(text);
      return analysis;
    }
  } catch (error) {
    console.error("Error analyzing brand voice:", error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }

  // Fallback
  return {
    tone: "professional",
    style: "clear and concise",
    terminology: [],
    structure: "standard"
  };
}

// Detect if user is requesting image generation
async function detectImageRequest(topic: string, brandVoiceExamples?: any[]): Promise<{
  wantsImage: boolean;
  imageOnly: boolean;
  reasoning: string;
}> {
  const hasImageInBrandVoice = brandVoiceExamples?.some(
    ex => ex && (ex.type === 'image' || ex.type === 'mixed')
  );

  const imageKeywords = [
    'image', 'visual', 'graphic', 'picture', 'photo', 'illustration',
    'design', 'artwork', 'poster', 'banner', 'infographic', 'thumbnail',
    'cover image', 'hero image', 'feature image', 'create an image',
    'generate an image', 'make an image', 'show me', 'visualize'
  ];

  const topicLower = topic.toLowerCase();
  const containsImageKeyword = imageKeywords.some(keyword => topicLower.includes(keyword));

  // Also check brand voice text descriptions for image keywords
  const brandVoiceTextHasImageKeyword = brandVoiceExamples?.some(ex => {
    if (!ex) return false;
    const textToCheck = (ex.textContent || ex.content || '').toLowerCase();
    return imageKeywords.some(keyword => textToCheck.includes(keyword));
  }) ?? false;

  // Check if they want ONLY an image (no text content)
  const imageOnlyKeywords = [
    'just an image', 'only an image', 'only image', 'just image',
    'image only', 'no text', 'without text', 'skip the text',
    'just the visual', 'only the visual', 'only visual'
  ];
  const imageOnly = imageOnlyKeywords.some(keyword => topicLower.includes(keyword));

  const wantsImage = containsImageKeyword || (hasImageInBrandVoice ?? false) || brandVoiceTextHasImageKeyword;

  let reasoning = '';
  if (imageOnly) {
    reasoning = 'User explicitly requested image only, no text content';
  } else if (containsImageKeyword) {
    reasoning = 'Topic contains image-related keywords';
  } else if (brandVoiceTextHasImageKeyword) {
    reasoning = 'Brand voice text description mentions image-related keywords';
  } else if (hasImageInBrandVoice) {
    reasoning = 'Brand voice calibration includes images, suggesting visual style preference';
  }

  return { wantsImage, imageOnly, reasoning };
}

// Extract visual style from brand voice analysis
function extractVisualStyle(brandVoice?: BrandVoiceAnalysis, brandVoiceExamples?: any[]): string {
  let visualStyle = '';

  // Check if brand voice already has visual style
  if (brandVoice?.visualStyle) {
    return brandVoice.visualStyle;
  }

  // Try to infer from examples
  const hasImages = brandVoiceExamples?.some(ex => ex && (ex.type === 'image' || ex.type === 'mixed'));
  if (hasImages) {
    // Default visual style based on tone if we have image examples
    const tone = brandVoice?.tone || 'professional';
    visualStyle = `${tone} style with clean, modern design`;
  }

  return visualStyle;
}

// Note: This function has been removed since we're using Claude-only approach
// Image prompts are generated by Claude and provided to the user

// Use Claude to generate SVG image code directly
async function generateSVGImage(
  topic: string,
  brandVoice?: BrandVoiceAnalysis,
  visualStyle?: string,
  brandVoiceExamples?: any[]
): Promise<string> {
  try {
    // Extract additional context from brand voice examples
    let imageContext = '';
    if (brandVoiceExamples) {
      const textExamples = brandVoiceExamples
        .filter(ex => ex && (ex.textContent || ex.content))
        .map(ex => ex.textContent || ex.content)
        .join('\n');

      if (textExamples) {
        imageContext = `\n\nUser's description of what they want in the image:\n${textExamples}`;
      }
    }

    let svgRequest = `You are a professional graphic designer and illustrator creating an SVG image. Create a professional, meaningful SVG image for: "${topic}"

${imageContext}

CRITICAL DESIGN PHILOSOPHY:
Analyze the request and choose the appropriate style:

**ILLUSTRATIVE STYLE** (for scenes, people, objects, physical things):
- Use when request mentions: people, classroom, office, objects, products, scenes, environments, characters
- Create actual visual representations using SVG shapes
- Draw people using simple geometric shapes (circles for heads, rectangles/rounded shapes for bodies, lines for limbs)
- Include environmental details (desks, computers, windows, plants, furniture, etc.)
- Use depth and perspective with overlapping shapes and size variation
- Add shadows and highlights for dimension using opacity and gradients
- Minimal or no text labels - let the visual tell the story
- Example: "people in classroom" → Draw 5-6 figure silhouettes sitting at desks, teacher figure at board, chalkboard with simple drawings, windows on wall

**INFOGRAPHIC STYLE** (for concepts, processes, data, abstract ideas):
- Use when request mentions: process, steps, growth, comparison, timeline, hierarchy, flow, strategy, funnel
- Create diagrams with clear labels and text
- Use arrows, connectors, and flow indicators
- Show progression and relationships
- Include explanatory text for each element
- Example: "business growth stages" → Staircase with labeled steps and descriptions

TECHNICAL REQUIREMENTS:
- Generate ONLY valid SVG code (starting with <svg and ending with </svg>)
- Use a 1200x630 viewBox (standard social media image size)
- Use professional warm color schemes (amber/brown tones like #C4A484, #A68968, #D4B896 preferred, but adapt to content)
- For illustrations: Use varied shapes (circles, ellipses, paths, polygons, lines) to create recognizable forms
- For people: Simple geometric style - circle heads (r="20-30"), rounded rectangle bodies, stick or simple limbs
- For infographics: Include clear, readable text labels (font-size 18-24 for body, 32-48 for titles)
- Add depth with gradients, shadows, opacity
- Use <defs> for reusable elements (gradients, patterns, shadows)
- Make compositions balanced and visually appealing`;

    if (visualStyle) {
      svgRequest += `\n- Visual Style to match: ${visualStyle}`;
    } else if (brandVoice) {
      svgRequest += `\n- Tone: ${brandVoice.tone}, Style: ${brandVoice.style}`;
    }

    svgRequest += `\n\nEXAMPLES BY TYPE:

ILLUSTRATIVE (Visual Scenes):
- "team meeting" → Draw 4-5 people silhouettes (circles for heads, simple bodies) around a rectangular table, one standing, laptop shapes on table
- "classroom with students" → Teacher figure at front near board, 6-8 student figures at desk shapes, window rectangles on wall, door
- "coffee shop scene" → Counter shape, barista figure behind it, 2-3 customer figures, cup shapes, plant shapes, menu board
- "startup office" → 3-4 desk rectangles with computer shapes, people figures working, whiteboard shape with squiggles, plant shapes, modern look
- "gym workout" → 3-4 figure silhouettes in exercise poses, equipment shapes (weights, mats), mirror rectangles on wall

INFOGRAPHIC (Diagrams & Concepts):
- "customer journey map" → Path with 5 labeled stages, icons at each point, arrows connecting them
- "sales funnel" → Inverted pyramid with 4 sections labeled "Awareness → Interest → Decision → Action" with numbers
- "product timeline" → Horizontal line with 6 milestone circles and dates above
- "feature comparison" → Two columns with checkmarks and X marks comparing items
- "business growth stages" → Ascending staircase with 5 steps, each labeled and with metrics

Remember:
- If it's a PHYSICAL SCENE (people, places, things you can see/touch) → ILLUSTRATIVE style with minimal text
- If it's a CONCEPT/PROCESS/DATA (abstract ideas, flows, comparisons) → INFOGRAPHIC style with clear labels

Generate ONLY the SVG code, no explanations or markdown. Start directly with <svg.`;

    const model = process.env.CLAUDE_MODEL || "claude-3-7-sonnet-20250219";
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 4000, // Increased for more detailed SVGs
      messages: [{
        role: "user",
        content: svgRequest
      }]
    });

    const content = message.content[0];
    if (content.type === "text") {
      let svgCode = content.text.trim();

      // Clean up any markdown code blocks
      svgCode = svgCode.replace(/```svg\n?/g, '').replace(/```\n?/g, '');

      // Ensure it starts with <svg
      if (!svgCode.startsWith('<svg')) {
        const svgMatch = svgCode.match(/<svg[\s\S]*<\/svg>/);
        if (svgMatch) {
          svgCode = svgMatch[0];
        }
      }

      return svgCode;
    }
  } catch (error) {
    console.error("Error generating SVG image:", error);
  }

  // Fallback to a simple placeholder SVG
  return `<svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:rgb(196,164,132);stop-opacity:1" />
        <stop offset="100%" style="stop-color:rgb(166,137,104);stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#grad)"/>
    <text x="600" y="315" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle">${topic}</text>
  </svg>`;
}

// Generate content for a specific format
async function generateContentForFormat(
  topic: string,
  industry: Industry,
  format: string,
  brandVoice?: BrandVoiceAnalysis
): Promise<GeneratedContent | null> {
  const formatInstructions: Record<string, string> = {
    blog: "Write a comprehensive blog post (800-1200 words) that is SEO-optimized with a clear introduction, body sections, and conclusion.",
    linkedin: "Write 3 LinkedIn posts (varying angles: thought leadership, stats-focused, question-based). Each should be engaging and professional.",
    twitter: "Write 5 Twitter posts (bite-sized insights from the topic). Each should be concise, engaging, and under 280 characters.",
    "google-ads": "Write 3 Google Ad variations for A/B testing. Include headlines and descriptions following Google Ads best practices.",
    instagram: "Write 3 Instagram post captions with relevant hashtags. Each should be engaging, visually descriptive, and include a call-to-action.",
    facebook: "Write 3 Facebook posts with varying formats (text-only, link preview style, question-based). Each should encourage engagement.",
    email: "Write a professional email campaign with subject line, preheader text, and body content optimized for email marketing.",
    newsletter: "Write a newsletter-style content piece with a compelling subject line, introduction, main content sections, and a clear call-to-action."
  };

  let brandVoiceContext = "";
  if (brandVoice) {
    brandVoiceContext = `\n\nBrand Voice Guidelines:
- Tone: ${brandVoice.tone}
- Style: ${brandVoice.style}
- Key Terminology: ${brandVoice.terminology.join(", ")}
- Structure: ${brandVoice.structure}

Match this brand voice exactly in your writing.`;
  }

  const prompt = `You are a professional content writer creating marketing content for ${industry} companies.

Topic: ${topic}
Industry: ${industry}
Format: ${formatInstructions[format]}

${brandVoiceContext}

Generate high-quality, engaging content that:
1. Is tailored specifically for the ${industry} industry
2. Uses relevant examples and terminology from that industry
3. Provides real value to the target audience
4. ${brandVoice ? "Matches the brand voice guidelines above exactly" : "Uses a professional, engaging tone"}

${format === "blog" ? "Include a compelling title at the beginning." : ""}
${format === "linkedin" ? "Number each post (1, 2, 3) and clearly separate them." : ""}
${format === "twitter" ? "Number each tweet (1, 2, 3, 4, 5) and clearly separate them." : ""}
${format === "google-ads" ? "Format as: Headline 1 / Description 1, then Headline 2 / Description 2, etc." : ""}
${format === "instagram" ? "Number each caption (1, 2, 3) and include relevant hashtags. Make them visually descriptive." : ""}
${format === "facebook" ? "Number each post (1, 2, 3) and clearly separate them. Include engagement hooks." : ""}
${format === "email" ? "Format as: Subject Line / Preheader / Body Content" : ""}
${format === "newsletter" ? "Include: Subject Line / Introduction / Main Sections / Call-to-Action" : ""}

Generate the content now:`;

  try {
    // Use the latest available Claude model
    const model = process.env.CLAUDE_MODEL || "claude-3-7-sonnet-20250219";
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const content = message.content[0];
    if (content.type === "text") {
      // Calculate a simple consistency score if brand voice exists
      let consistencyScore = undefined;
      if (brandVoice && brandVoice.terminology && brandVoice.terminology.length > 0) {
        // Simple heuristic: check if terminology appears in content
        const contentText = content.text.toLowerCase();
        const matchingTerms = brandVoice.terminology.filter(term => 
          contentText.includes(term.toLowerCase())
        ).length;
        consistencyScore = Math.min(95, 70 + (matchingTerms / brandVoice.terminology.length) * 25);
      } else if (brandVoice) {
        // If brand voice exists but no terminology, give a base score
        consistencyScore = 75;
      }

      return {
        format: format as any,
        content: content.text,
        consistencyScore
      };
    }
  } catch (error) {
    console.error(`Error generating ${format} content:`, error);
    
    // Handle specific Anthropic API errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as any;
      console.error(`Anthropic API Error for ${format}:`, {
        status: apiError.status,
        message: apiError.message,
        type: apiError.error?.type,
        details: apiError.error
      });
      
      // Return specific error messages for different error types
      if (apiError.status === 401 || (apiError.error && apiError.error.type === 'authentication_error')) {
        return {
          format: format as any,
          content: `❌ Authentication Error: ${apiError.error?.message || 'Invalid API key'}. Please check your ANTHROPIC_API_KEY in Vercel environment variables.`
        };
      } else if (apiError.status === 400 || (apiError.error && apiError.error.type === 'invalid_request_error')) {
        return {
          format: format as any,
          content: `❌ Request Error: ${apiError.error?.message || 'Invalid request'}. Please try again with different parameters.`
        };
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Full error for ${format}:`, {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    // Return a more helpful error message
    return {
      format: format as any,
      content: `❌ Error generating ${format} content: ${errorMessage}. Please check your API key and try again.`
    };
  }
  
  // Fallback return
  return {
    format: format as any,
    content: `Error generating ${format} content. Please try again.`
  };
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY is not configured");
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Please set it in your .env.local file." },
        { status: 500 }
      );
    }

    if (!validateApiKey(apiKey)) {
      console.error("Invalid ANTHROPIC_API_KEY format:", apiKey.substring(0, 10) + "...");
      return NextResponse.json(
        { error: "Invalid ANTHROPIC_API_KEY format. Please check your API key." },
        { status: 500 }
      );
    }

    const body: ContentGenerationRequest = await request.json();
    const { topic, industry, formats, brandVoiceExamples } = body;

    // Support both new format (BrandVoiceExample[]) and legacy format (string[])
    let examplesToUse: any[] = [];
    if (brandVoiceExamples) {
      if (Array.isArray(brandVoiceExamples) && brandVoiceExamples.length > 0) {
        if (typeof brandVoiceExamples[0] === 'string') {
          // Legacy format: string array
          examplesToUse = (brandVoiceExamples as string[]).map(ex => ({ type: 'text', content: ex }));
        } else {
          // New format: BrandVoiceExample array
          examplesToUse = brandVoiceExamples as any[];
        }
      }
    }

    // If only brand voice analysis is requested (no formats), just analyze and return
    if (examplesToUse && examplesToUse.length > 0 && (!formats || formats.length === 0)) {
      const brandVoice = await analyzeBrandVoice(examplesToUse);
      return NextResponse.json({
        contents: [],
        brandVoiceAnalysis: brandVoice
      });
    }

    // Otherwise, validate required fields for content generation
    if (!topic || !industry || !formats || formats.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: topic, industry, and at least one format are required" },
        { status: 400 }
      );
    }

    // Analyze brand voice if examples provided
    let brandVoice: BrandVoiceAnalysis | undefined;
    if (examplesToUse && examplesToUse.length > 0) {
      brandVoice = await analyzeBrandVoice(examplesToUse);
    } else if (body.brandVoice) {
      brandVoice = body.brandVoice;
    }

    // Detect if user wants image generation
    const imageRequest = await detectImageRequest(topic, examplesToUse);
    console.log('Image request detection:', imageRequest);

    // Handle SVG image generation (Claude-only approach)
    let generatedSVG: string | undefined;

    if (imageRequest.wantsImage) {
      // Extract visual style from brand voice
      const visualStyle = extractVisualStyle(brandVoice, examplesToUse);
      console.log('Visual style extracted:', visualStyle);

      // Generate SVG image using Claude (pass brand voice examples for context)
      const svgCode = await generateSVGImage(topic, brandVoice, visualStyle, examplesToUse);
      generatedSVG = svgCode;
      console.log('Generated SVG image:', svgCode.substring(0, 200) + '...');
    }

    // If user wants ONLY an image, return it without text content
    if (imageRequest.imageOnly && generatedSVG) {
      // URL encode the SVG for data URI
      const encodedSVG = encodeURIComponent(generatedSVG)
        .replace(/'/g, '%27')
        .replace(/"/g, '%22');

      return NextResponse.json({
        contents: [{
          format: 'image' as any,
          content: 'SVG image generated successfully',
          title: 'Generated Image',
          imageUrl: `data:image/svg+xml,${encodedSVG}`
        }],
        brandVoiceAnalysis: brandVoice
      });
    }

    // Generate content for all requested formats
    const generationPromises = formats.map(format =>
      generateContentForFormat(topic, industry, format, brandVoice)
    );

    const results = await Promise.all(generationPromises);
    let contents = results.filter((content): content is GeneratedContent => content !== null);

    // If SVG image was generated, attach it to the first content piece
    if (generatedSVG && contents.length > 0) {
      // URL encode the SVG for data URI
      const encodedSVG = encodeURIComponent(generatedSVG)
        .replace(/'/g, '%27')
        .replace(/"/g, '%22');

      // Attach encoded SVG as data URL to first content piece (typically blog or main content)
      contents[0] = {
        ...contents[0],
        imageUrl: `data:image/svg+xml,${encodedSVG}`
      };
    }

    return NextResponse.json({
      contents,
      brandVoiceAnalysis: brandVoice
    });
  } catch (error) {
    console.error("Error in generate route:", error);
    
    // Handle specific error types
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as any;
      
      if (apiError.status === 401) {
        return NextResponse.json(
          { 
            error: `Authentication failed: ${apiError.error?.message || 'Invalid API key'}. Please verify your ANTHROPIC_API_KEY in Vercel environment variables.`,
            details: "Make sure your API key starts with 'sk-ant-' and has the correct format."
          },
          { status: 401 }
        );
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Full error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      body: error instanceof Error ? undefined : error
    });
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

