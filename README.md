# HoneyBook Onboarding Assistant

An AI-powered onboarding assistant that helps businesses set up their HoneyBook account by analyzing their website and conducting an intelligent conversation to gather necessary information.

## Features

- Website analysis and data extraction
- Intelligent conversation flow to gather business information
- Structured data collection for:
  - Business name and years in operation
  - Services offered
  - Social media presence
  - Client acquisition channels
  - Booking process
- Real-time information extraction and validation

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- OpenAI GPT-4 for conversation and analysis
- TailwindCSS for styling
- Vercel for deployment

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- OpenAI API key

### Environment Variables

Create a `.env.local` file in the root directory with:

```env
OPENAI_API_KEY=your_api_key_here
```

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd honeybook-onboarding
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to a Git repository
2. Import the project in Vercel
3. Set the environment variables in Vercel's project settings
4. Deploy!

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── chat/         # Chat endpoint
│   │   ├── scrape/       # Website scraping endpoint
│   │   └── knowledge/    # Knowledge extraction endpoint
│   └── page.tsx          # Main page
├── components/            # React components
│   ├── chat/             # Chat related components
│   └── onboarding/       # Onboarding flow components
├── services/             # Business logic services
│   ├── contentAnalyzer.ts # Website content analysis
│   ├── gptService.ts     # GPT interaction service
│   ├── knowledgeExtractor.ts # Knowledge extraction
│   └── webscraper.ts     # Website scraping service
└── types/                # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
