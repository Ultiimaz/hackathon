# MCP Tool + LLM Integration Demo

## Overview
The application now supports executing MCP (Model Context Protocol) tools and automatically making follow-up LLM calls to integrate the results into the conversation.

## How It Works

### 1. Tool Execution Flow
1. User or Assistant includes MCP tool syntax in a message
2. System detects MCP tool calls using regex pattern
3. Tools are executed automatically
4. A follow-up LLM call is made with tool results
5. LLM integrates the results into a natural response

### 2. MCP Tool Syntax
```
<mcp tool="tool-name" input={property: "value", another: "value"}> expected result </mcp>
```

### 3. Example Usage

#### File Operations
```
<mcp tool="local-file-ops" input={operation: "write", path: "hello.txt", content: "Hello World"}> { "success": true, "message": "File written successfully" } </mcp>
```

#### Web Search
```
<mcp tool="brave-search" input={query: "artificial intelligence", count: 5}> { "success": true, "results": [...] } </mcp>
```

#### Git Operations
```
<mcp tool="git-operations" input={command: "status"}> { "success": true, "output": "..." } </mcp>
```

## Features

### Visual Indicators
- Loading spinner shows when MCP tools are executing
- Chat input is disabled during tool execution
- Status message: "Executing MCP tools and processing results..."

### Tool Integration
- Tools execute with realistic delays (0.5-1.5 seconds)
- Rich response data with timestamps and metadata
- Error handling with fallback to raw tool results
- Support for multiple tool calls in a single message

### LLM Enhancement
- Follow-up LLM call processes tool results
- Natural language interpretation of tool outputs
- Context-aware responses that explain what happened
- Seamless integration with conversation flow

## Supported Tools

### @modelcontextprotocol/server-filesystem
- **local-file-ops**: Read, write, and list files
- Operations: read, write, list
- Rich metadata in responses

### @modelcontextprotocol/server-brave-search
- **brave-search**: Web search functionality
- Simulated search results with titles, URLs, snippets

### mcp-server-git
- **git-operations**: Git repository management
- Execute git commands with output

### Generic Tools
- **generic-mcp-tool**: Fallback for unknown MCP servers
- Basic input/output handling

## Testing the Implementation

1. **Add a Local MCP Server**:
   - Open the MCP Tools panel
   - Add a new Local Server
   - Use command: `@modelcontextprotocol/server-filesystem`
   - Start the server

2. **Test Tool Execution**:
   ```
   <mcp tool="local-file-ops" input={operation: "write", path: "test.txt", content: "Hello from MCP!"}> success </mcp>
   ```

3. **Observe the Flow**:
   - Tool execution indicator appears
   - Tool executes (with delay)
   - Follow-up LLM call processes results
   - Natural response with integrated tool output

## Implementation Details

### Key Files Modified
- `src/components/chat/chat-interface.tsx`: Main MCP processing logic
- `src/stores/mcp-store.ts`: Tool execution and server management
- `src/types/mcp.ts`: MCP type definitions

### Processing Pipeline
1. **Detection**: Regex finds MCP tool calls
2. **Execution**: Tools run with `executeCommand()`
3. **LLM Integration**: Follow-up call with tool context
4. **Response**: Natural language response with tool results

This implementation provides a seamless way to integrate MCP tools with LLM conversations, making tool execution feel natural and contextual.