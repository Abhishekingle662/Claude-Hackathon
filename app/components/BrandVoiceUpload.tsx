"use client";

import { useState, useRef } from "react";
import { BrandVoiceAnalysis, BrandVoiceExample } from "@/app/types";

interface BrandVoiceUploadProps {
  onBack: () => void;
  onComplete: (examples: BrandVoiceExample[], analysis: BrandVoiceAnalysis) => void;
  initialExamples?: BrandVoiceExample[];
}

export default function BrandVoiceUpload({ onBack, onComplete, initialExamples }: BrandVoiceUploadProps) {
  // Initialize with saved examples if they exist, otherwise use empty array
  const initializeExamples = () => {
    if (initialExamples && initialExamples.length > 0) {
      const initialized = [...initialExamples];
      while (initialized.length < 3) {
        initialized.push(null as any);
      }
      return initialized.slice(0, 3);
    }
    return [null, null, null];
  };

  const [examples, setExamples] = useState<(BrandVoiceExample | null)[]>(initializeExamples());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

  const handleTextChange = (index: number, value: string) => {
    const newExamples = [...examples];
    if (!newExamples[index]) {
      newExamples[index] = { type: 'text', content: value };
    } else {
      newExamples[index] = {
        ...newExamples[index]!,
        type: newExamples[index]!.type === 'image' ? 'mixed' : (newExamples[index]!.type === 'mixed' ? 'mixed' : 'text'),
        textContent: value,
        content: newExamples[index]!.type === 'image' || newExamples[index]!.type === 'mixed' ? newExamples[index]!.content : value
      };
    }
    setExamples(newExamples);
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    // Handle images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const newExamples = [...examples];
        const existingExample = newExamples[index];
        
        newExamples[index] = {
          type: existingExample && existingExample.textContent ? 'mixed' : 'image',
          content: base64,
          textContent: existingExample?.textContent || '',
          mimeType: file.type
        };
        setExamples(newExamples);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Handle text files
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        handleTextChange(index, text);
      };
      reader.readAsText(file);
    } else {
      // Try to read as text anyway for other file types
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        handleTextChange(index, text);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    const validExamples = examples.filter(ex => ex && ((ex.content && ex.content.trim().length > 0) || (ex.textContent && ex.textContent.trim().length > 0))) as BrandVoiceExample[];
    if (validExamples.length < 1) {
      alert("Please provide at least 1 example of your brand voice.");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Prepare examples with proper format
      const formattedExamples = validExamples.map(ex => ({
        type: ex.type,
        content: ex.content || '',
        textContent: ex.textContent || '',
        mimeType: ex.type === 'image' || ex.type === 'mixed' ? (ex.mimeType || (ex.content?.match(/data:([^;]+)/)?.[1] || 'image/png')) : undefined
      }));

      // Call API to analyze brand voice
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "dummy", // We only need brand voice analysis
          industry: "SaaS",
          formats: [],
          brandVoiceExamples: formattedExamples
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze brand voice: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.brandVoiceAnalysis) {
        onComplete(formattedExamples, data.brandVoiceAnalysis);
      } else {
        throw new Error("No brand voice analysis returned");
      }
    } catch (error) {
      console.error("Error analyzing brand voice:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("ANTHROPIC_API_KEY")) {
        alert("API key not configured. Please set ANTHROPIC_API_KEY in your .env.local file.");
      } else {
        alert(`Failed to analyze brand voice: ${errorMessage}. Please try again.`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onBack();
  };

  const removeImage = (index: number) => {
    const newExamples = [...examples];
    const existing = newExamples[index];
    if (existing && existing.textContent) {
      newExamples[index] = { type: 'text', content: existing.textContent };
    } else {
      newExamples[index] = null;
    }
    setExamples(newExamples);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating Claude Logo Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${(i * 8.33) % 100}%`,
              top: `${(i * 7) % 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${15 + (i % 5)}s`
            }}
          >
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" className="text-amber-700">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-amber-200">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="text-amber-700 hover:text-amber-800 font-medium mb-4 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'var(--font-caveat)' }}>
              Brand Voice Calibration
            </h2>
            <p className="text-gray-600">
              Upload images and/or paste text for each example. You can provide 1-3 examples (more examples = better analysis). You can combine both - upload an image and add text to explain it. Claude will analyze everything to understand your brand voice.
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {examples.map((example, index) => (
              <div key={index}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Example {index + 1} <span className="text-gray-400">(Optional)</span>
                </label>
                
                {/* File Upload Button */}
                <div className="mb-2 flex gap-2 flex-wrap">
                  <input
                    type="file"
                    ref={(el) => { fileInputRefs.current[index] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(index, file);
                      // Reset input so same file can be selected again
                      e.target.value = '';
                    }}
                    accept=".txt,.doc,.docx,.pdf,image/*"
                    className="hidden"
                    id={`file-input-${index}`}
                  />
                  <label
                    htmlFor={`file-input-${index}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg cursor-pointer transition-colors text-sm font-medium border border-amber-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Image/File
                  </label>
                  {(example && (example.type === 'image' || example.type === 'mixed')) && (
                    <button
                      onClick={() => removeImage(index)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm font-medium border border-red-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Remove Image
                    </button>
                  )}
                  {example && (
                    <span className="inline-flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                      {example.type === "image" || example.type === "mixed" ? (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                          {example.type === "mixed" ? "Image + Text" : "Image uploaded"}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          {example.textContent?.length || example.content?.length || 0} characters
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* Image Preview */}
                {(example && (example.type === 'image' || example.type === 'mixed') && example.content) && (
                  <div className="mb-2 relative">
                    <img 
                      src={example.content} 
                      alt={`Example ${index + 1}`}
                      className="max-w-full h-48 object-contain rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {/* Text Input - Always enabled */}
                <textarea
                  value={example?.textContent || (example?.type === 'text' ? example.content : '') || ''}
                  onChange={(e) => handleTextChange(index, e.target.value)}
                  placeholder={example && (example.type === 'image' || example.type === 'mixed') 
                    ? "Add text to describe or explain this image..." 
                    : "Paste text content here (blog post, article, social media post, etc.) or upload an image above"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent h-32 resize-none"
                />
                {example && example.type === 'mixed' && (
                  <p className="mt-1 text-xs text-amber-700">
                    ✓ Both image and text will be analyzed together
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || examples.filter(ex => ex && ((ex.content && ex.content.trim().length > 0) || (ex.textContent && ex.textContent.trim().length > 0))).length < 1}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center shadow-lg"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                "Analyze Brand Voice"
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-300 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Tip:</strong> You can upload an image AND add text in the same box. This helps Claude understand both your visual style and writing style. While you only need 1 example to get started, providing 2-3 examples helps Claude better understand your brand voice and produce more accurate results.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
