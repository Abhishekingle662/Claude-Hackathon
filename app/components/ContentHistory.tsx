"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HistoryItem {
  id: string;
  topic: string;
  industry: string;
  formats: string[];
  timestamp: number;
  content: any[];
}

interface ContentItem {
  format: string;
  title?: string;
  content: string;
}

export default function ContentHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [viewingContent, setViewingContent] = useState(false);

  useEffect(() => {
    // Load history from localStorage
    try {
      const savedHistory = localStorage.getItem('contentHistory');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      localStorage.removeItem('contentHistory');
      setHistory([]);
    }
  };

  const deleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem('contentHistory', JSON.stringify(updatedHistory));
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewContent = (item: HistoryItem) => {
    setSelectedItem(item);
    setViewingContent(true);
  };

  const formatContentForDisplay = (content: ContentItem) => {
    console.log('Formatting content:', content.format, content.content.length);
    const lines = content.content.split('\n');
    
    if (content.format === 'email' || content.format === 'newsletter') {
      // Enhanced formatting for email/newsletter content
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        
        if (trimmed === '') return '<div class="h-3"></div>';
        
        // Section headers with colons
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.includes(':')) {
          return `<div class="mt-6 mb-3 pb-2 border-b border-gray-200"><h3 class="font-bold text-lg text-amber-700">${trimmed.replace(/\*\*/g, '')}</h3></div>`;
        }
        
        // Bold headers
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return `<h4 class="font-bold text-base mt-4 mb-2 text-gray-800">${trimmed.replace(/\*\*/g, '')}</h4>`;
        }
        
        // Bullet points with emoji
        if (trimmed.startsWith('•') || trimmed.startsWith('✅') || trimmed.startsWith('🛰️') || trimmed.startsWith('🚀') || trimmed.startsWith('🌌')) {
          const emoji = trimmed.charAt(0);
          const text = trimmed.substring(1).trim();
          return `<div class="ml-4 mb-2 flex items-start gap-2"><span class="text-amber-600 font-bold">${emoji}</span><span class="text-gray-800">${text}</span></div>`;
        }
        
        // Dash bullet points
        if (trimmed.startsWith('- ')) {
          return `<div class="ml-4 mb-2 flex items-start gap-2"><span class="text-amber-600 font-bold">•</span><span class="text-gray-800">${trimmed.substring(2).trim()}</span></div>`;
        }
        
        // Italic text in asterisks
        if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
          return `<p class="italic text-gray-600 my-3 pl-4 border-l-2 border-amber-300">${trimmed.replace(/^\*|\*$/g, '')}</p>`;
        }
        
        // Call-to-action buttons
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          return `<div class="my-4"><span class="inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-medium border border-amber-300">${trimmed}</span></div>`;
        }
        
        // Separators and footers
        if (trimmed.startsWith('---') || trimmed.includes('Unsubscribe') || trimmed.includes('Update Preferences')) {
          return `<div class="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">${trimmed}</div>`;
        }
        
        return `<p class="mb-3 text-gray-800 leading-relaxed">${trimmed}</p>`;
      }).join('');
      
      // Process bold text in final formatted content
      return formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    }
    
    if (content.format === 'blog') {
      // Blog formatting with markdown support
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        
        if (trimmed === '') return '<div class="h-4"></div>';
        
        // H1 headers
        if (trimmed.startsWith('# ')) {
          return `<h1 class="text-3xl font-bold mt-8 mb-4 text-gray-900">${trimmed.substring(2).trim()}</h1>`;
        }
        // H2 headers
        if (trimmed.startsWith('## ')) {
          return `<h2 class="text-2xl font-bold mt-6 mb-3 text-gray-800">${trimmed.substring(3).trim()}</h2>`;
        }
        // H3 headers
        if (trimmed.startsWith('### ')) {
          return `<h3 class="text-xl font-bold mt-5 mb-2 text-gray-800">${trimmed.substring(4).trim()}</h3>`;
        }
        
        // Code blocks
        if (trimmed.startsWith('```')) {
          return '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>';
        }
        if (trimmed.endsWith('```')) {
          return '</code></pre>';
        }
        
        // Bold text
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return `<p class="font-bold text-gray-900 my-2">${trimmed.replace(/\*\*/g, '')}</p>`;
        }
        
        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return `<li class="ml-6 mb-1 text-gray-800">${trimmed.substring(2).trim()}</li>`;
        }
        
        return `<p class="mb-3 text-gray-800 leading-relaxed text-justify">${trimmed}</p>`;
      }).join('');
      
      // Process bold text in final formatted content
      return formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    }
    
    if (content.format === 'facebook') {
      // Facebook posts with sections and emphasis
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        
        if (trimmed === '') return '<div class="h-3"></div>';
        
        // Post section headers
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.includes('POST')) {
          return `<h4 class="font-bold text-lg mt-4 mb-2 text-gray-800">${trimmed.replace(/\*\*/g, '')}</h4>`;
        }
        
        // Numbered sections (like "1. TEXT-ONLY POST")
        if (/^\d+\..*POST/.test(trimmed)) {
          return `<div class="mt-6 mb-4 pb-3 border-b-2 border-amber-300"><p class="font-bold text-amber-700 text-lg">${trimmed}</p></div>`;
        }
        
        // Separators
        if (trimmed === '---') {
          return '<div class="my-6 border-t-2 border-gray-300"></div>';
        }
        
        // Emoji lines
        if (trimmed.match(/^[🚀🛰️🌌📱💻👇👨👩]+/)) {
          return `<p class="my-3 text-lg text-gray-800">${trimmed}</p>`;
        }
        
        // Hashtags
        if (trimmed.startsWith('#')) {
          return `<p class="text-blue-600 font-medium mt-3">${trimmed}</p>`;
        }
        
        // Bold all caps or emphasized text
        if (trimmed.toUpperCase() === trimmed && trimmed.length > 10) {
          return `<p class="font-bold text-gray-900 my-2 tracking-wide">${trimmed}</p>`;
        }
        
        return `<p class="mb-2 text-gray-800 leading-relaxed">${trimmed}</p>`;
      }).join('');
      
      // Process bold text in final formatted content  
      return formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    }
    
    if (content.format === 'linkedin') {
      // LinkedIn posts with professional formatting
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        
        if (trimmed === '') return '<div class="h-4"></div>';
        
        // Numbered sections
        if (/^\d+\..*Post/.test(trimmed)) {
          return `<div class="mt-6 mb-4"><p class="font-bold text-lg text-gray-900">${trimmed}</p></div>`;
        }
        
        // Separators
        if (trimmed === '---') {
          return '<div class="my-6 border-t-2 border-gray-300"></div>';
        }
        
        // Bold headers
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return `<p class="font-bold text-lg mt-4 mb-2 text-gray-900">${trimmed.replace(/\*\*/g, '')}</p>`;
        }
        
        // Bullet points
        if (trimmed.startsWith('•') || trimmed.startsWith('✅') || trimmed.startsWith('→')) {
          return `<p class="ml-4 mb-2 text-gray-800">${trimmed}</p>`;
        }
        
        // Links
        if (trimmed.includes('[Link')) {
          return `<p class="text-blue-600 font-medium my-2">${trimmed}</p>`;
        }
        
        return `<p class="mb-2 text-gray-800 leading-relaxed">${trimmed}</p>`;
      }).join('');
      return formatted;
    }
    
    if (content.format === 'twitter') {
      // Twitter posts - each numbered tweet
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        
        if (trimmed === '') return '<div class="h-3"></div>';
        
        // Tweet numbers
        if (/^\*\*\d+\.\*\*/.test(trimmed)) {
          return `<div class="mt-4 mb-3 pb-3 border-b border-gray-300"><p class="font-bold text-gray-700">${trimmed.replace(/\*\*/g, '')}</p></div>`;
        }
        
        // Hashtags - style them
        if (trimmed.startsWith('#')) {
          return `<p class="text-blue-500 font-medium mb-2">${trimmed}</p>`;
        }
        
        return `<p class="mb-2 text-gray-800">${trimmed}</p>`;
      }).join('');
      return formatted;
    }
    
    if (content.format === 'instagram') {
      // Instagram posts with captions
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        
        if (trimmed === '') return '<div class="h-4"></div>';
        
        // Section markers
        if (/^\*\*\d+\.\*\*/.test(trimmed)) {
          return `<div class="mt-6 mb-3"><p class="font-bold text-lg text-gray-900">${trimmed.replace(/\*\*/g, '')}</p></div>`;
        }
        
        // Separators
        if (trimmed === '---') {
          return '<div class="my-4 border-t-2 border-gray-300"></div>';
        }
        
        // Hashtag sections
        if (trimmed.startsWith('#')) {
          return `<p class="text-blue-600 font-medium flex-wrap">${trimmed}</p>`;
        }
        
        return `<p class="mb-2 text-gray-800 leading-relaxed">${trimmed}</p>`;
      }).join('');
      return formatted;
    }
    
    // Default formatting with bold text support
    let formatted = content.content.replace(/\n/g, '<br>');
    // Convert **text** to <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    return formatted;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  // Content Viewer Modal
  if (viewingContent && selectedItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => {
                setViewingContent(false);
                setSelectedItem(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all text-gray-700 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to History
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{selectedItem.topic}</h1>
              <p className="text-gray-600">
                <span className="font-medium">Industry:</span> {selectedItem.industry} • 
                <span className="ml-2">{formatDate(selectedItem.timestamp)}</span>
              </p>
            </div>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {selectedItem.content.map((contentItem: any, idx: number) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-sm font-medium capitalize">
                        {contentItem.format.replace('-', ' ')}
                      </span>
                      {contentItem.title && (
                        <h3 className="font-semibold text-gray-900">{contentItem.title}</h3>
                      )}
                    </div>
                    {/* Copy button in header */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(contentItem.content);
                        // You could add a toast notification here
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <div 
                      className="content-display formatted-content space-y-2"
                      style={{
                        lineHeight: '1.6',
                        fontSize: '14px'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: formatContentForDisplay(contentItem) 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 bg-clip-text text-transparent mb-4" style={{ fontFamily: 'var(--font-caveat)' }}>
            Content History
          </h1>
          <p className="text-xl text-gray-700">
            Your previously generated content campaigns
          </p>
        </div>

        {/* Actions */}
        {history.length > 0 && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={clearHistory}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
            >
              Clear All History
            </button>
          </div>
        )}

        {/* History Items */}
        {history.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-amber-200">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No content history yet</h3>
            <p className="text-gray-500 mb-6">
              Generate your first content campaign to see it appear here
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white rounded-lg font-medium transition-all"
            >
              Create Content
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-amber-200 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.topic}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Industry:</span> {item.industry}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(item.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete this item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Format Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.formats.map((format, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium"
                    >
                      {format}
                    </span>
                  ))}
                </div>

                {/* Content Count */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {item.content.length} pieces of content generated
                  </span>
                  <button 
                    onClick={() => viewContent(item)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    View Content
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Custom styles for better content formatting */}
      <style dangerouslySetInnerHTML={{
        __html: `
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
