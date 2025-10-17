# Indian Investment Platform

A comprehensive financial education and investment platform tailored for the Indian market, similar to Investopedia but focused on Indian financial instruments, regulations, and market conditions.

## Features

- **Educational Content**: Comprehensive articles about Indian financial markets, investment strategies, and regulations
- **Financial Tools**: Calculators for SIP, EMI, tax planning, and retirement planning
- **Product Comparison**: Compare loans, credit cards, and brokers
- **Market Data**: Real-time Indian market indices and news
- **Affiliate Integration**: Seamless integration with financial product providers

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB, Redis
- **Authentication**: JWT-based authentication
- **Deployment**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB
- Redis
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd indian-investment-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using Docker

1. For development:
```bash
docker-compose -f docker-compose.dev.yml up
```

2. For production:
```bash
docker-compose up
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # Reusable React components
├── lib/                # Utility libraries
├── config/             # Configuration files
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.