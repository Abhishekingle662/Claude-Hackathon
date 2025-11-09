"use client";

import { useState } from "react";
import { Industry, ContentFormat, GeneratedContent, BrandVoiceAnalysis, BrandVoiceExample } from "@/app/types";
import BrandVoiceUpload from "./BrandVoiceUpload";
import ContentDashboard from "./ContentDashboard";

export default function ContentStudio() {
  const [topic, setTopic] = useState("");
  const [industry, setIndustry] = useState<Industry>("");
  const [industrySuggestions, setIndustrySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<ContentFormat[]>(["blog"]);
  const [brandVoiceExamples, setBrandVoiceExamples] = useState<BrandVoiceExample[]>([]);
  const [brandVoice, setBrandVoice] = useState<BrandVoiceAnalysis | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<"input" | "brand-voice" | "results">("input");

  const industryOptions = [
    "FinTech",
    "HealthTech",
    "SaaS",
    "Software Engineering",
    "E-commerce",
    "EdTech",
    "Real Estate",
    "Marketing",
    "Consulting",
    "Manufacturing",
    "Retail",
    "Hospitality",
    "Transportation",
    "Energy",
    "Agriculture"
  ];

  const handleIndustryChange = (value: string) => {
    setIndustry(value);
    if (value.length > 0) {
      const filtered = industryOptions.filter(opt => 
        opt.toLowerCase().includes(value.toLowerCase())
      );
      setIndustrySuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setIndustrySuggestions([]);
    }
  };

  const selectIndustry = (value: string) => {
    setIndustry(value);
    setShowSuggestions(false);
    setIndustrySuggestions([]);
  };

  const formats: { value: ContentFormat; label: string; description: string }[] = [
    { value: "blog", label: "Blog Post", description: "800-1200 words, SEO-optimized" },
    { value: "linkedin", label: "LinkedIn Posts", description: "3 posts with varying angles" },
    { value: "twitter", label: "Twitter Posts", description: "5 bite-sized insights" },
    { value: "instagram", label: "Instagram Posts", description: "3 captions with hashtags" },
    { value: "facebook", label: "Facebook Posts", description: "3 posts with engagement hooks" },
    { value: "google-ads", label: "Google Ads", description: "3 variations for A/B testing" },
    { value: "email", label: "Email Campaign", description: "Subject line, preheader, and body" },
    { value: "newsletter", label: "Newsletter", description: "Complete newsletter with sections" }
  ];

  const toggleFormat = (format: ContentFormat) => {
    setSelectedFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim() || !industry.trim() || selectedFormats.length === 0) {
      alert("Please enter a topic, industry, and select at least one content format.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          industry: industry.trim(),
          formats: selectedFormats,
          brandVoiceExamples: brandVoiceExamples.length > 0 ? brandVoiceExamples : undefined,
          brandVoice: brandVoice || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate content: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setGeneratedContent(data.contents);
      if (data.brandVoiceAnalysis) {
        setBrandVoice(data.brandVoiceAnalysis);
      }
      setStep("results");
    } catch (error) {
      console.error("Error generating content:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("ANTHROPIC_API_KEY")) {
        alert("API key not configured. Please set ANTHROPIC_API_KEY in your .env.local file. See README for setup instructions.");
      } else {
        alert(`Failed to generate content: ${errorMessage}. Please try again.`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackFromBrandVoice = () => {
    setStep("input");
  };

  const handleBackToInput = () => {
    // Keep all data intact, just go back to input screen
    setStep("input");
  };

  const handleNewContent = () => {
    // Clear everything for a fresh start
    setStep("input");
    setGeneratedContent([]);
    setTopic("");
    setIndustry("");
    setSelectedFormats(["blog"]);
    setBrandVoiceExamples([]);
    setBrandVoice(null);
  };

  if (step === "brand-voice") {
    return (
      <BrandVoiceUpload
        onBack={handleBackFromBrandVoice}
        onComplete={(examples, analysis) => {
          setBrandVoiceExamples(examples);
          setBrandVoice(analysis);
          setStep("input");
        }}
        initialExamples={brandVoiceExamples}
      />
    );
  }

  if (step === "results") {
    return (
      <ContentDashboard
        topic={topic}
        industry={industry}
        contents={generatedContent}
        brandVoice={brandVoice}
        onRegenerate={handleGenerate}
        onBackToInput={handleBackToInput}
        onNewContent={handleNewContent}
      />
    );
  }

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

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 bg-clip-text text-transparent mb-4 animate-gradient" style={{ fontFamily: 'var(--font-caveat)' }}>
            AI Content Studio
          </h1>
          <p className="text-xl text-gray-700 font-medium">
            Transform a single idea into a complete multi-channel marketing campaign
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6 border border-amber-200">
          {/* Topic Input */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., How AI is transforming fraud detection in banking"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent text-lg transition-all"
            />
          </div>

          {/* Industry Selection */}
          <div className="mb-8 relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Client Industry
            </label>
            <div className="relative">
              <input
                type="text"
                value={industry}
                onChange={(e) => handleIndustryChange(e.target.value)}
                onFocus={() => {
                  if (industry.length > 0) {
                    handleIndustryChange(industry);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Enter any industry (e.g., FinTech, Software Engineering, Healthcare)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent text-lg transition-all"
                list="industry-suggestions"
              />
              {showSuggestions && industrySuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {industrySuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectIndustry(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-amber-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Type any industry name - suggestions will appear as you type
            </p>
          </div>

          {/* Content Format Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Content Formats
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => toggleFormat(format.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedFormats.includes(format.value)
                      ? "border-purple-500 bg-amber-50 shadow-md"
                      : "border-gray-200 hover:border-purple-300 hover:bg-amber-50/50"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedFormats.includes(format.value)}
                      onChange={() => {}}
                      className="mr-3 w-5 h-5 text-amber-700 focus:ring-amber-600"
                    />
                    <span className="font-semibold text-gray-900">
                      {format.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    {format.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Brand Voice Section */}
          <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-300">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Brand Voice Calibration
              </label>
              {brandVoice ? (
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Voice calibrated
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  Optional
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Upload files or paste 2-3 examples of existing content to learn your brand voice
            </p>
            <button
              onClick={() => setStep("brand-voice")}
              className="px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white rounded-lg text-sm font-medium transition-all shadow-md"
            >
              {brandVoice ? "Update Brand Voice" : "Calibrate Brand Voice"}
            </button>
            {brandVoice && (
              <div className="mt-3 text-xs text-gray-600 space-y-1">
                <p><strong>Tone:</strong> {brandVoice.tone}</p>
                <p><strong>Style:</strong> {brandVoice.style}</p>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex gap-4">
            {generatedContent.length > 0 && (
              <button
                onClick={() => setStep("results")}
                className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all flex items-center justify-center text-lg shadow-lg border-2 border-gray-300"
              >
                ← Back to Generated Content
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim() || selectedFormats.length === 0}
              className={`${generatedContent.length > 0 ? 'flex-1' : 'w-full'} py-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-800 hover:via-amber-700 hover:to-amber-800 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-lg transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Content...
                </>
              ) : (
                generatedContent.length > 0 ? "Regenerate Content" : "Generate Content"
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg p-6 shadow-lg">
          <h3 className="font-semibold text-amber-950 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            How it works
          </h3>
          <ul className="text-sm text-amber-900 space-y-1">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Enter your topic and select content formats
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Optionally calibrate brand voice with examples
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Generate complete content suite in 30-60 seconds
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Review, refine, and export your content
            </li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
