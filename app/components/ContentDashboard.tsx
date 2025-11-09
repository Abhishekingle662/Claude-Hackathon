"use client";

import { useState } from "react";
import { GeneratedContent, BrandVoiceAnalysis } from "@/app/types";

interface ContentDashboardProps {
  topic: string;
  industry: string;
  contents: GeneratedContent[];
  brandVoice: BrandVoiceAnalysis | null;
  onRegenerate: () => void;
  onBackToInput: () => void;
  onNewContent: () => void;
}

export default function ContentDashboard({
  topic,
  industry,
  contents,
  brandVoice,
  onRegenerate,
  onBackToInput,
  onNewContent
}: ContentDashboardProps) {
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const formatLabels: Record<string, string> = {
    blog: "Blog Post",
    linkedin: "LinkedIn Posts",
    twitter: "Twitter Posts",
    instagram: "Instagram Posts",
    facebook: "Facebook Posts",
    "google-ads": "Google Ads",
    email: "Email Campaign",
    newsletter: "Newsletter"
  };

  const handleExport = (content: GeneratedContent) => {
    const blob = new Blob([content.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${content.format}-${topic.slice(0, 20)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatContentForDisplay = (content: GeneratedContent) => {
    const lines = content.content.split('\n');
    
    if (content.format === 'email' || content.format === 'newsletter') {
      // Enhanced formatting for email content
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        
        // Empty lines
        if (trimmed === '') {
          return '<div class="h-3"></div>';
        }
        
        // Main section headers (bold with colon)
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.includes(':')) {
          const headerText = trimmed.replace(/\*\*/g, '');
          return `<div class="mt-6 mb-3 pb-2 border-b border-gray-200">
            <h3 class="font-bold text-lg text-amber-700">${headerText}</h3>
          </div>`;
        }
        
        // Bold headers without colons
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return `<h4 class="font-bold text-base mt-4 mb-2 text-gray-800">${trimmed.replace(/\*\*/g, '')}</h4>`;
        }
        
        // Bullet points
        if (trimmed.startsWith('•') || trimmed.startsWith('✅')) {
          return `<div class="ml-4 mb-2 flex items-start gap-2">
            <span class="text-amber-600 font-bold mt-1">${trimmed.charAt(0)}</span>
            <span class="text-gray-800">${trimmed.substring(1).trim()}</span>
          </div>`;
        }
        
        // Italic text (quotes or emphasis)
        if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
          return `<p class="italic text-gray-600 my-3 pl-4 border-l-2 border-amber-300">${trimmed.replace(/^\*|\*$/g, '')}</p>`;
        }
        
        // Call-to-action links or buttons
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          return `<div class="my-4">
            <span class="inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-medium border border-amber-300">${trimmed}</span>
          </div>`;
        }
        
        // Footer/disclaimer text
        if (trimmed.startsWith('---') || trimmed.includes('Unsubscribe') || trimmed.includes('Update Preferences')) {
          return `<div class="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">${trimmed}</div>`;
        }
        
        // Signature or closing
        if (trimmed.includes('P.S.') || trimmed.includes('Keep ') || trimmed.includes('Best,') || trimmed.includes('[Your Name]')) {
          return `<p class="mt-4 text-gray-700 font-medium">${trimmed}</p>`;
        }
        
        // Regular paragraphs
        return `<p class="mb-3 text-gray-800 leading-relaxed">${trimmed}</p>`;
      }).join('');
      
      return formatted;
    }
    
    if (content.format === 'blog') {
      // Blog post formatting
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        
        if (trimmed === '') {
          return '<div class="h-4"></div>';
        }
        
        // Headers
        if (trimmed.startsWith('# ')) {
          return `<h1 class="text-2xl font-bold mt-6 mb-4 text-gray-900">${trimmed.substring(2)}</h1>`;
        }
        if (trimmed.startsWith('## ')) {
          return `<h2 class="text-xl font-bold mt-5 mb-3 text-gray-800">${trimmed.substring(3)}</h2>`;
        }
        if (trimmed.startsWith('### ')) {
          return `<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800">${trimmed.substring(4)}</h3>`;
        }
        
        // Bold text
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return `<p class="font-bold mb-3 text-gray-800">${trimmed.replace(/\*\*/g, '')}</p>`;
        }
        
        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return `<li class="mb-1 ml-4 text-gray-800">${trimmed.substring(2)}</li>`;
        }
        
        return `<p class="mb-3 text-gray-800 leading-relaxed">${trimmed}</p>`;
      }).join('');
      
      return formatted;
    }
    
    // Social media posts (Twitter, LinkedIn, Instagram, Facebook)
    if (['twitter', 'linkedin', 'instagram', 'facebook'].includes(content.format)) {
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        
        if (trimmed === '') return '<div class="h-3"></div>';
        
        // Section headers (numbered like "1. TEXT-ONLY POST")
        if (/^\d+\./.test(trimmed) && trimmed.length > 5) {
          return `<div class="mt-6 mb-4 pb-3 border-b-2 border-amber-300"><p class="font-bold text-amber-700 text-lg">${trimmed}</p></div>`;
        }
        
        // Bold text sections
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return `<p class="font-bold text-gray-900 my-2">${trimmed.replace(/\*\*/g, '')}</p>`;
        }
        
        // Separators
        if (trimmed === '---') {
          return '<div class="my-6 border-t-2 border-gray-300"></div>';
        }
        
        // Hashtags
        if (trimmed.startsWith('#')) {
          return `<p class="text-blue-600 font-medium mb-2">${trimmed}</p>`;
        }
        
        // Emoji lines
        if (trimmed.match(/^[🚀🛰️🌌📱💻👇👨👩🎯✅📊🔹→🤔]+/)) {
          return `<p class="my-3 text-gray-800">${trimmed}</p>`;
        }
        
        // Bullet points
        if (trimmed.startsWith('•') || trimmed.startsWith('✅') || trimmed.startsWith('→')) {
          return `<p class="ml-4 mb-2 text-gray-800">${trimmed}</p>`;
        }
        
        // Mentions
        if (trimmed.includes('@')) {
          return `<p class="mb-2 text-gray-800">${trimmed.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>')}</p>`;
        }
        
        return `<p class="mb-2 text-gray-800 leading-relaxed">${trimmed}</p>`;
      }).join('');
      
      return formatted;
    }
    
    // Default formatting for other content types
    return content.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const handleExportImage = (imageUrl: string) => {
    // Decode the SVG from the data URI
    let svgContent = imageUrl;
    if (imageUrl.startsWith('data:image/svg+xml,')) {
      svgContent = decodeURIComponent(imageUrl.replace('data:image/svg+xml,', ''));
    }

    // Create a blob with the SVG content
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.slice(0, 20)}-image.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getConsistencyColor = (score?: number) => {
    if (!score) return "text-gray-500";
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
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

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6 border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'var(--font-caveat)', color: 'black' }}>
                Generated Content
              </h1>
              <p className="text-gray-600">
                <strong>Topic:</strong> {topic} | <strong>Industry:</strong> {industry}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBackToInput();
                }}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all shadow-md border-2 border-gray-300"
              >
                ← Edit & Regenerate
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNewContent();
                }}
                className="px-6 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white rounded-lg font-medium transition-all shadow-md"
              >
                🆕 New Content
              </button>
            </div>
          </div>

          {brandVoice && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg p-4">
              <h3 className="font-semibold text-amber-950 mb-2">Brand Voice Applied</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-amber-800 font-medium">Tone:</span>
                  <p className="text-amber-950">{brandVoice.tone}</p>
                </div>
                <div>
                  <span className="text-amber-800 font-medium">Style:</span>
                  <p className="text-amber-950">{brandVoice.style}</p>
                </div>
                <div>
                  <span className="text-amber-800 font-medium">Key Terms:</span>
                  <p className="text-amber-950">{brandVoice.terminology.slice(0, 3).join(", ")}</p>
                </div>
                <div>
                  <span className="text-amber-800 font-medium">Structure:</span>
                  <p className="text-amber-950">{brandVoice.structure}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contents.map((content, index) => (
            <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-black">
                    {formatLabels[content.format] || content.format}
                  </h2>
                  {content.consistencyScore !== undefined && (
                    <span className={`text-sm font-semibold ${getConsistencyColor(content.consistencyScore)}`}>
                      {content.consistencyScore}% Match
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport(content)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement regenerate for single content
                      onRegenerate();
                    }}
                    disabled={regeneratingIndex === index}
                    className="px-3 py-1 text-sm bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white rounded transition-all disabled:opacity-50 shadow-md"
                  >
                    {regeneratingIndex === index ? "Regenerating..." : "Regenerate"}
                  </button>
                </div>
              </div>

              {/* Display generated image if available */}
              {content.imageUrl && (
                <div className="mb-4">
                  <div className="relative rounded-lg overflow-hidden shadow-lg border-2 border-amber-300 bg-gray-50 p-4">
                    {content.imageUrl.startsWith('data:image/svg+xml') || content.imageUrl.startsWith('<svg') ? (
                      // Render SVG directly
                      <div
                        className="w-full cursor-pointer"
                        style={{ maxHeight: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        onClick={() => setExpandedImage(content.imageUrl!)}
                        dangerouslySetInnerHTML={{
                          __html: content.imageUrl.startsWith('<svg')
                            ? content.imageUrl
                            : decodeURIComponent(content.imageUrl.replace('data:image/svg+xml,', ''))
                        }}
                      />
                    ) : (
                      // Fallback to img tag for other image types
                      <img
                        src={content.imageUrl}
                        alt={content.title || "AI Generated Image"}
                        className="w-full h-auto cursor-pointer"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                        onClick={() => setExpandedImage(content.imageUrl!)}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 italic">
                      AI-Generated Image by Claude
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedImage(content.imageUrl!)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                      >
                        🔍 View Full
                      </button>
                      <button
                        onClick={() => handleExportImage(content.imageUrl!)}
                        className="px-3 py-1 text-xs bg-amber-100 hover:bg-purple-200 rounded text-amber-800 transition-colors"
                      >
                        ⬇️ Export Image
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="prose max-w-none">
                {content.format === "google-ads" ? (
                  <div className="space-y-8">
                    {content.content.split(/---+/).map((adBlock, idx) => {
                      const lines = adBlock.trim().split(/\r?\n/).filter(Boolean);
                      const title = lines[0]?.replace(/\*\*(.*?)\*\*/, '$1');
                      const headlines = lines.filter(l => l.startsWith('**Headline')).map(l => l.replace(/\*\*Headline \d:\*\* /, ''));
                      const descriptions = lines.filter(l => l.startsWith('**Description')).map(l => l.replace(/\*\*Description \d:\*\* /, ''));
                      return (
                        <div key={idx} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                          {title && <h3 className="font-bold text-lg mb-2 text-amber-800">{title}</h3>}
                          <div className="mb-2">
                            <span className="font-semibold text-gray-700">Headlines:</span>
                            <ul className="list-disc ml-6 text-black">
                              {headlines.map((h, i) => <li key={i}>{h}</li>)}
                            </ul>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Descriptions:</span>
                            <ul className="list-disc ml-6 text-black">
                              {descriptions.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : content.format === "email" || content.format === "newsletter" ? (
                  <div 
                    className="formatted-content"
                    dangerouslySetInnerHTML={{ 
                      __html: formatContentForDisplay(content) 
                    }}
                  />
                ) : content.format === "blog" || content.format === "linkedin" || content.format === "facebook" || content.format === "instagram" || content.format === "twitter" ? (
                  <div 
                    className="formatted-content prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: formatContentForDisplay(content) 
                    }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-black leading-relaxed">
                    {content.content}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Footer */}
        <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-amber-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent mb-1">
                {contents.length}
              </div>
              <div className="text-sm text-gray-600">Content Pieces Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent mb-1">
                ~60s
              </div>
              <div className="text-sm text-gray-600">Generation Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent mb-1">
                17x
              </div>
              <div className="text-sm text-gray-600">Faster Than Manual</div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex flex-col bg-white rounded-xl shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">AI-Generated Image</h3>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportImage(expandedImage);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  ⬇️ Download SVG
                </button>
                <button
                  onClick={() => setExpandedImage(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div
              className="flex-1 overflow-auto p-8 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {expandedImage.startsWith('data:image/svg+xml') || expandedImage.startsWith('<svg') ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: expandedImage.startsWith('<svg')
                      ? expandedImage
                      : decodeURIComponent(expandedImage.replace('data:image/svg+xml,', ''))
                  }}
                />
              ) : (
                <img
                  src={expandedImage}
                  alt="Expanded view"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          .animate-float {
            animation: float 20s ease-in-out infinite;
          }
          .formatted-content h1, .formatted-content h2, .formatted-content h3, .formatted-content h4 {
            line-height: 1.3;
          }
          .formatted-content p {
            line-height: 1.6;
          }
          .formatted-content ul, .formatted-content ol {
            padding-left: 1rem;
          }
          .formatted-content li {
            margin-bottom: 0.25rem;
          }
          .formatted-content strong {
            font-weight: 600;
            color: #374151;
          }
          .formatted-content em {
            font-style: italic;
            color: #6B7280;
          }
        `
      }} />
    </div>
  );
}
