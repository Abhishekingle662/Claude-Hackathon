# AI Content Studio

**BluePeak Marketing's AI-Powered Content Creation Platform**

Transform a single content idea into a complete, multi-channel marketing campaign in minutes instead of days.

## 🚀 Features

- **Multi-Format Content Generation**: Create blog posts, LinkedIn posts, Twitter threads, and Google Ads simultaneously
- **AI Image Generation**: Claude directly generates professional SVG images within the application
- **Intelligent Image Detection**: System automatically detects when users want images based on keywords or brand voice
- **Brand Voice Calibration**: Upload text AND images to teach Claude your brand's voice and visual style
- **Visual Style Matching**: Generated images match your brand's visual aesthetic from calibration examples
- **Industry-Specific Content**: Tailored content for FinTech, HealthTech, SaaS, and more
- **Brand Consistency Scoring**: See how well generated content matches your brand voice
- **Fast Generation**: Complete content suite with images in 30-60 seconds
- **Export Capabilities**: Download content for use in your marketing tools
- **Claude-Only Solution**: No additional API keys required - everything powered by Claude!

## 🛠️ Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up API Key**
   - Copy `.env.local.example` to `.env.local`
   - Get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
   - Add your API key to `.env.local`:
     ```
     ANTHROPIC_API_KEY=your_anthropic_api_key_here
     ```
   - That's it! No other API keys needed.

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

1. **Enter Your Topic**: Describe what content you want to create
2. **Select Industry**: Choose your client's industry for tailored content
3. **Choose Formats**: Select which content types you need (blog, LinkedIn, Twitter, Google Ads)
4. **Calibrate Brand Voice** (Optional): Upload 2-3 examples of existing content to match your brand's style
5. **Generate**: Click "Generate Content" and wait 30-60 seconds
6. **Review & Export**: Review all generated content, check consistency scores, and export what you need

## 🎯 Problem Solved

**Before**: 8-10 hours to create a complete content package
- 3 hours for blog post
- 2 hours for LinkedIn adaptation
- 2 hours for Twitter posts
- 1-2 hours for ad copy variations

**After**: 35 minutes total
- 5 minutes setup
- 30-60 seconds generation
- 30 minutes review

**Result**: 17x faster content production

## 🏗️ Tech Stack

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern, responsive styling
- **Anthropic Claude API**: AI content generation
- **React Hooks**: State management

## 📁 Project Structure

```
content-studio/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts          # Claude API integration
│   ├── components/
│   │   ├── ContentStudio.tsx     # Main application component
│   │   ├── BrandVoiceUpload.tsx  # Brand voice calibration
│   │   └── ContentDashboard.tsx  # Results display
│   ├── types.ts                  # TypeScript type definitions
│   ├── page.tsx                  # Home page
│   └── layout.tsx                # Root layout
└── README.md
```

## 🎨 Key Features Explained

### Brand Voice Calibration
Upload 1-3 examples of your existing content (text, images, or both). Claude analyzes:
- **Text Content**:
  - Writing tone (conversational, professional, data-driven, etc.)
  - Style characteristics (paragraph length, structure, formatting)
  - Key terminology and industry jargon
  - Content structure patterns
- **Visual Content** (if images provided):
  - Visual style and design aesthetic
  - Color schemes and palettes
  - Typography choices
  - Layout and composition patterns

This analysis is then applied to all generated content to maintain consistency across both text and visuals.

### AI Image Generation (SVG)
The system automatically detects when you want images and generates them directly:
- **Keyword Detection**: Mentions of "image", "visual", "graphic", "illustration", etc.
- **Brand Voice Images**: If you upload images during brand voice calibration
- **Smart Generation**:
  - Generate image only (e.g., "create an image of a tech startup office")
  - Generate image + content (e.g., "blog post about AI with an image")
  - Generate content only (default when no image keywords detected)

**How it works:**
1. Claude analyzes your topic and brand voice (including visual style from uploaded images)
2. Claude generates professional SVG (vector graphics) code
3. The image is rendered directly in your content
4. SVG images are:
   - **Scalable** - Look perfect at any size
   - **Lightweight** - Fast loading
   - **Editable** - Can be customized in design tools
   - **Professional** - Perfect for marketing materials

**Benefits:**
- ✅ No extra API keys or services needed
- ✅ Images appear instantly in the application
- ✅ Professional, scalable vector graphics
- ✅ Matches your brand's visual style automatically
- ✅ 100% Claude-powered solution

### Multi-Format Generation
Generate multiple content types simultaneously:
- **Blog Posts**: 800-1200 words, SEO-optimized
- **LinkedIn Posts**: 3 posts with varying angles (thought leadership, stats-focused, question-based)
- **Twitter Posts**: 5 bite-sized insights
- **Google Ads**: 3 variations for A/B testing

### Brand Consistency Scoring
Each generated piece receives a consistency score (0-100%) based on:
- Use of brand-specific terminology
- Tone matching
- Style adherence

## 🚢 Deployment

This app can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Any Node.js hosting platform**

Make sure to set the `ANTHROPIC_API_KEY` environment variable in your deployment platform.

## 📝 License

This project was created for the Claude Hackathon Challenge: Revitalizing BluePeak Marketing.

## 🤝 Contributing

This is a hackathon project. Feel free to fork and extend!

---

**Built with ❤️ for BluePeak Marketing**
