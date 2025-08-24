# Heimdall - Debrid Media Manager

A beautiful, modern debrid media management application built with Next.js 14, featuring a stunning frosted glass design aesthetic and seamless integration with popular debrid services.

## 🌟 Features

- **Frosted Glass UI**: Modern, elegant interface with backdrop blur effects
- **Debrid Integration**: Support for Real-Debrid, AllDebrid, and Premiumize
- **Media Search**: Powerful search across multiple torrent sources
- **Stream & Download**: Direct streaming and download capabilities
- **Dark/Light Mode**: Full theme support with next-themes
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: Live data with Supabase subscriptions
- **Type Safety**: Full TypeScript implementation with strict mode

## 🚀 Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with frosted glass design system
- **Components**: shadcn/ui with custom glass components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Query + Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository

To check your versions:
```bash
node --version
npm --version
git --version
```

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/heimdall.git
cd heimdall
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Debrid Service API Keys (Server-side only)
REAL_DEBRID_API_KEY=your_real_debrid_api_key
ALLDEBRID_API_KEY=your_alldebrid_api_key
PREMIUMIZE_API_KEY=your_premiumize_api_key

# TMDB API (for movie/TV metadata)
TMDB_API_KEY=your_tmdb_api_key

# Security
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Optional: Redis for caching
REDIS_URL=your_redis_connection_string
```

### 4. Supabase Setup

#### Option A: Use Supabase Cloud (Recommended)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API to get your project URL and anon key
4. Copy the values to your `.env.local` file

#### Option B: Self-hosted Supabase

1. Install Docker and Docker Compose
2. Run the Supabase CLI:
```bash
npx supabase init
npx supabase start
```

### 5. Database Schema

Run the SQL schema to set up your database tables:

```bash
# If using Supabase CLI
npx supabase db reset

# Or manually run the SQL in your Supabase SQL editor
```

Copy and run the contents of `lib/supabase/schema.sql` in your Supabase SQL editor.

### 6. API Keys Setup

#### Real-Debrid API Key
1. Go to [Real-Debrid API](https://real-debrid.com/apitoken)
2. Generate a new API token
3. Add it to your `.env.local` file

#### AllDebrid API Key
1. Go to [AllDebrid API](https://alldebrid.fr/apikeys)
2. Generate a new API key
3. Add it to your `.env.local` file

#### TMDB API Key
1. Go to [The Movie Database](https://www.themoviedb.org/settings/api)
2. Create an account and request an API key
3. Add it to your `.env.local` file

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## 📁 Project Structure

```
heimdall/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── ui/               # UI components
│   └── shared/           # Shared components
├── lib/                   # Utility libraries
│   ├── debrid/           # Debrid service integrations
│   ├── supabase/         # Database client and types
│   └── utils.ts          # Utility functions
├── instructions/          # Development documentation
└── public/               # Static assets
```

## 🎨 Design System

The application uses a custom frosted glass design system. Key design tokens:

- **Primary Glass**: `backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20`
- **Hover States**: `hover:border-white/40 hover:scale-[1.02]`
- **Active States**: `shadow-lg shadow-white/10`
- **Transitions**: `transition-all duration-300`

For detailed component usage, see `instructions/design-system.md`.

## 🔌 API Integration

### Debrid Services

The application proxies all debrid API calls through Next.js API routes to keep API keys secure:

- **Search**: `POST /api/media/search`
- **Stream**: `POST /api/media/stream`
- **Download**: `POST /api/media/download`

### Rate Limits

Default rate limits per endpoint:
- Authentication: 5 requests/minute
- Search: 10 requests/minute  
- Streaming: 3 requests/minute
- General API: 20 requests/minute

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1280px

## ⚡ Performance Optimizations

- **Image Optimization**: Using Next.js `next/image`
- **Code Splitting**: Dynamic imports for heavy components
- **Caching**: Redis caching for API responses
- **Bundle Analysis**: Run `npm run analyze` to analyze bundle size

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Type Checking
```bash
npm run type-check
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Docker

```bash
# Build the Docker image
docker build -t heimdall .

# Run the container
docker run -p 3000:3000 heimdall
```

### Manual Deployment

```bash
npm run build
npm start
```

## 🔧 Configuration

### Theme Customization

Edit `tailwind.config.js` to customize colors and design tokens:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Custom color palette
      },
      backdropBlur: {
        // Custom blur values
      }
    }
  }
}
```

### API Rate Limiting

Configure rate limits in `lib/rate-limiter.ts`:

```javascript
const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute'
})
```

## 🐛 Troubleshooting

### Common Issues

**Issue**: Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: TypeScript errors
```bash
# Check TypeScript configuration
npm run type-check
```

**Issue**: Supabase connection errors
- Verify environment variables are correct
- Check Supabase project status
- Ensure database schema is up to date

**Issue**: Debrid API errors
- Verify API keys are valid and not expired
- Check API key permissions
- Ensure rate limits are not exceeded

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Follow the established patterns in `.cursorrules`
- Use TypeScript strict mode
- Follow the frosted glass design system
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `instructions/` folder
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🚧 Roadmap

- [ ] Enhanced search filters and sorting
- [ ] Torrent management and queuing
- [ ] User preferences and profiles  
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and insights

## ⚙️ Advanced Configuration

### Custom Components

Create new frosted glass components following the pattern:

```tsx
export function CustomComponent() {
  return (
    <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 rounded-lg p-6">
      {/* Component content */}
    </div>
  )
}
```

### Environment Specific Configs

- **Development**: Uses `.env.local`
- **Production**: Set environment variables in your hosting platform
- **Testing**: Uses `.env.test` (if present)

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.