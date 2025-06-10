# Claude API Chat Interface with MCP Protocol Support

A modern, production-ready chat interface for Claude AI with Model Context Protocol (MCP) tools integration. Built with React, TypeScript, and Tailwind CSS.

## Features

- 🤖 **Claude AI Integration** - Direct integration with Claude API
- 🔧 **MCP Tools Support** - Connect and use Model Context Protocol tools
- 💬 **Real-time Chat** - Streaming responses with beautiful animations
- 🌙 **Dark/Light Mode** - Automatic theme switching with system preference
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 💾 **Conversation Management** - Save, export, and import chat history
- ⚙️ **Customizable Settings** - Adjust model parameters and preferences
- 🌍 **Internationalization** - Built-in localization support

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Claude API key from Anthropic

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd claude-api-mcp-chat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your Claude API key to `.env`:
```env
VITE_CLAUDE_API_KEY=your_claude_api_key_here
```

5. Start the development server:
```bash
npm run dev:full
```

This will start both the proxy server (port 3001) and the Vite development server (port 5173).

## Scripts

- `npm run dev` - Start Vite development server only
- `npm run dev:full` - Start both proxy server and Vite dev server
- `npm run build` - Build for production
- `npm run server` - Start proxy server only
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Architecture

### Frontend (React + TypeScript)
- **Components**: Modular UI components with Framer Motion animations
- **Stores**: Zustand for state management with persistence
- **Services**: API service layer for Claude integration
- **Types**: Full TypeScript support with proper type definitions

### Backend Proxy
- **Express Server**: Handles CORS and API key security
- **Vercel Functions**: Serverless deployment support
- **Streaming Support**: Real-time response streaming

### MCP Integration
- **Protocol Support**: Full Model Context Protocol implementation
- **Tool Management**: Connect, configure, and use external tools
- **Real-time Status**: Live connection monitoring

## Configuration

### Claude API Settings
- **Model Selection**: Choose between Claude 3 variants
- **Temperature**: Control response creativity (0-1)
- **Max Tokens**: Set response length limits
- **Streaming**: Real-time response delivery

### MCP Tools
- **Connection Management**: Add/remove MCP servers
- **Tool Discovery**: Automatic tool detection
- **Enable/Disable**: Granular tool control

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

3. Ensure your hosting supports:
   - Node.js serverless functions (for API proxy)
   - Environment variables
   - SPA routing

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_CLAUDE_API_KEY` | Your Claude API key from Anthropic | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Create an issue for bug reports
- 💡 Submit feature requests via GitHub issues
- 📖 Check the documentation for common questions

## Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- [Model Context Protocol](https://modelcontextprotocol.io) for tool integration
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Framer Motion](https://framer.com/motion) for animations