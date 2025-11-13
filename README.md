# Zep Poke MCP v2

🧠 A secure Model Context Protocol (MCP) server for integrating Zep AI memory management into AI applications.

## Features

- **Memory Management**: Store and retrieve conversation memories across sessions
- **Semantic Search**: Search through all stored memories using natural language
- **Session Tracking**: Maintain separate memory contexts for different users/sessions
- **Type-Safe**: Built with TypeScript for robust development
- **Secure**: No API keys in code, environment variable configuration

## Prerequisites

- Node.js >= 18.0.0
- A Zep Cloud API key ([Get one here](https://www.getzep.com/))

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Dpdpdpdp0987/zep-poke-mcp-v2.git
cd zep-poke-mcp-v2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

**IMPORTANT**: Create a `.env` file in the root directory with your Zep API key:

```bash
ZEPAPIKEY=your_zep_api_key_here
```

⚠️ **Security Note**: Never commit your `.env` file or API keys to version control. The `.gitignore` file is already configured to exclude sensitive files.

### 4. Build the Project

```bash
npm run build
```

### 5. Run the MCP Server

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

## Available Tools

This MCP server provides three main tools:

### 1. `create_memory`
Store a message in a user session's memory.

**Parameters:**
- `sessionId` (string): Unique identifier for the session
- `message` (string): The message content to store
- `role` ("user" | "assistant"): Who sent the message

### 2. `get_memory`
Retrieve all memories for a specific session.

**Parameters:**
- `sessionId` (string): Session identifier to retrieve memories for

### 3. `search_memory`
Search across all memories using semantic search.

**Parameters:**
- `query` (string): Search query in natural language
- `limit` (number, optional): Maximum number of results (default: 10)

## Usage Example

Once the MCP server is running, you can connect it to MCP-compatible clients like Claude Desktop or other AI applications.

### Configuration for Claude Desktop

Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "zep-poke": {
      "command": "node",
      "args": ["/path/to/zep-poke-mcp-v2/dist/index.js"],
      "env": {
        "ZEPAPIKEY": "your_zep_api_key_here"
      }
    }
  }
}
```

## Project Structure

```
zep-poke-mcp-v2/
├── src/
│   ├── index.ts       # MCP server entry point
│   └── zepai.ts       # Zep AI integration logic
├── dist/              # Compiled JavaScript (generated)
├── .env               # Environment variables (create this yourself)
├── .gitignore         # Git ignore rules
├── package.json       # Project dependencies
├── tsconfig.json      # TypeScript configuration
├── vercel.json        # Vercel deployment config
└── README.md          # This file
```

## Deployment

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Add your Zep API key as an environment variable in Vercel:
   ```bash
   vercel env add ZEPAPIKEY
   ```
3. Deploy:
   ```bash
   vercel
   ```

**Note**: Remember to add `ZEPAPIKEY` as a secret environment variable in your Vercel project settings.

## Security Best Practices

✅ **DO:**
- Store API keys in environment variables
- Use `.env` file for local development
- Keep `.env` in `.gitignore`
- Use environment secrets in production (e.g., Vercel secrets)

❌ **DON'T:**
- Commit API keys to version control
- Share your `.env` file
- Hardcode sensitive credentials in source code

## Development

### Type Checking
```bash
npm run type-check
```

### Building
```bash
npm run build
```

## Troubleshooting

### "ZEPAPIKEY environment variable is required" Error
- Ensure you've created a `.env` file in the project root
- Verify the `.env` file contains: `ZEPAPIKEY=your_actual_api_key`
- Make sure there are no spaces around the `=` sign

### Module Not Found Errors
- Run `npm install` to ensure all dependencies are installed
- Run `npm run build` to compile TypeScript to JavaScript

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Resources

- [Zep Documentation](https://docs.getzep.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)

## Author

Daniela Mümken

---

**Built with ❤️ for the MCP community**