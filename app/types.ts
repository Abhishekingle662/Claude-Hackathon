export type Industry = string; // Allow any industry to be entered

export type ContentFormat = 
  | "blog"
  | "linkedin"
  | "twitter"
  | "google-ads"
  | "instagram"
  | "facebook"
  | "email"
  | "newsletter";

export interface BrandVoiceAnalysis {
  tone: string;
  style: string;
  terminology: string[];
  structure: string;
  consistencyScore?: number;
  visualStyle?: string; // Description of visual style from brand voice images
}

export interface GeneratedContent {
  format: ContentFormat;
  content: string;
  title?: string;
  consistencyScore?: number;
  imageUrl?: string; // URL of generated image (if requested)
  imagePrompt?: string; // The prompt used to generate the image
}

export interface BrandVoiceExample {
  type: "text" | "image" | "mixed";
  content: string; // text content or base64 image data
  textContent?: string; // additional text when type is "mixed" or "image"
  mimeType?: string; // for images: image/png, image/jpeg, etc.
}

export interface ContentGenerationRequest {
  topic: string;
  industry: Industry;
  formats: ContentFormat[];
  brandVoice?: BrandVoiceAnalysis;
  brandVoiceExamples?: BrandVoiceExample[] | string[]; // Supports both new format and legacy string array
}

export interface ContentGenerationResponse {
  contents: GeneratedContent[];
  brandVoiceAnalysis?: BrandVoiceAnalysis;
}

