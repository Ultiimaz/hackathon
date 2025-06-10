import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader, Send } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { useChatStore } from "../../stores/chat-store";
import { useMCPStore } from "../../stores/mcp-store";
import { ClaudeAPIService } from "../../services/claude-api";
import { useLocalization } from "../../hooks/use-localization";
import toast from "react-hot-toast";

export const ChatInterface: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isProcessingMCP, setIsProcessingMCP] = useState(false);
  const { t } = useLocalization();

  const {
    getCurrentConversation,
    addMessage,
    updateMessage,
    createConversation,
    currentConversationId,
    apiKey,
    model,
    temperature,
    maxTokens,
    isStreaming,
    setIsStreaming,
  } = useChatStore();

  const { getEnabledTools, executeCommand } = useMCPStore();

  const currentConversation = getCurrentConversation();

  // Get API key from store or environment variable
  const effectiveApiKey = apiKey || import.meta.env.VITE_CLAUDE_API_KEY || "";
  const claudeAPI = new ClaudeAPIService(effectiveApiKey);

  // Generate system prompt with available MCP tools
  const generateSystemPrompt = useCallback(() => {
    const enabledTools = getEnabledTools();

    let systemPrompt = `You are Claude, a helpful AI assistant. You have access to various tools through the Model Context Protocol (MCP) that can help you perform tasks and answer questions more effectively.`;

    if (enabledTools.length > 0) {
      systemPrompt += `\n\nAvailable MCP Tools:\n`;

      enabledTools.forEach((tool) => {
        systemPrompt += `\n**${tool.name}** (${tool.id})\n`;
        systemPrompt += `Description: ${tool.description}\n`;

        if (tool.inputSchema) {
          systemPrompt += `Input Schema:\n`;
          systemPrompt += `- Type: ${tool.inputSchema.type}\n`;

          if (tool.inputSchema.properties) {
            systemPrompt += `- Properties:\n`;
            Object.entries(tool.inputSchema.properties).forEach(
              ([key, prop]: [string, any]) => {
                const required = tool.inputSchema.required?.includes(key)
                  ? " (required)"
                  : " (optional)";
                systemPrompt += `  • ${key}${required}: ${
                  prop.description || prop.type
                }\n`;
              }
            );
          }
        }
        systemPrompt += `\n`;
      });

      systemPrompt += `\nWhen using these tools, explain what you're doing and provide helpful context to the user. You can leverage these tools to provide more accurate, up-to-date, and comprehensive responses.

To use MCP tools, use this syntax:
<mcp tool="tool-name" input={property: "value", another: "value"}> expected result </mcp>

When you use MCP tools in your response:
1. The tools will be executed automatically
2. A follow-up LLM call will be made with the tool results
3. You should integrate the results naturally into your response
4. Explain what the tool did and interpret the results for the user

Example:
<mcp tool="local-file-ops" input={operation: "write", path: "hello.txt", content: "Hello World"}> { "success": true, "message": "File written successfully" } </mcp>`;
    } else {
      systemPrompt += `\n\nCurrently, no MCP tools are connected. You can still help with general questions and tasks using your built-in knowledge.`;
    }

    return systemPrompt;
  }, [getEnabledTools]);

  // Check if user is near bottom of scroll area
  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const threshold = 100; // pixels from bottom
    const isNear =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold;
    return isNear;
  }, []);

  // Throttled scroll handler to prevent stuttering
  const handleScroll = useCallback(() => {
    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // Set user as scrolling immediately
    setUserIsScrolling(true);

    // Set user back to not scrolling after 1.5 seconds of no scroll activity
    const timeout = setTimeout(() => {
      setUserIsScrolling(false);
    }, 1500);

    setScrollTimeout(timeout);
  }, [scrollTimeout]);

  // Auto-scroll to bottom only if user is not actively scrolling
  const scrollToBottom = useCallback(() => {
    if (!userIsScrolling) {
      const container = messagesContainerRef.current;
      if (container && isNearBottom()) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    }
  }, [userIsScrolling, isNearBottom]);

  useEffect(() => {
    // Add a small delay to prevent conflicts with user scrolling
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [currentConversation?.messages, scrollToBottom]);

  useEffect(() => {
    // Create initial conversation if none exists
    if (!currentConversationId) {
      createConversation();
    }
  }, [currentConversationId, createConversation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout]);

  // Process MCP tool calls and make follow-up LLM calls
  const processMCPToolCalls = async (text: string, conversationId: string): Promise<string> => {
    const mcpRegex = /<mcp\s+tool="([^"]+)"\s+input=(\{[^}]*\}|\{[^}]*[^}]*\})>\s*([^<]*)\s*<\/mcp>/g;
    let processedText = text;
    let match;
    const toolResults: Array<{tool: string, input: any, result: any}> = [];

    // Check if there are any MCP tool calls
    const hasToolCalls = mcpRegex.test(text);
    if (hasToolCalls) {
      console.log(`🎯 [MCP Processing] Detected MCP tool calls in message`);
      setIsProcessingMCP(true);
    }

    // Reset regex for actual processing
    mcpRegex.lastIndex = 0;

    // First, execute all MCP tools and collect results
    while ((match = mcpRegex.exec(text)) !== null) {
      const [fullMatch, toolName, inputJson, expectedResult] = match;
      
      try {
        // Parse the input JSON
        const input = JSON.parse(inputJson.replace(/(\w+):/g, '"$1":'));
        
        console.log(`🔧 [MCP Tool Call] Preparing to execute: ${toolName}`);
        console.log(`   📝 Input:`, input);
        
        // Execute the MCP command
        const result = await executeCommand(toolName, input);
        
        console.log(`✅ [MCP Tool Result] Tool executed successfully: ${toolName}`);
        console.log(`   📊 Result:`, result);
        
        // Store the result for later processing
        toolResults.push({ tool: toolName, input, result });
        
        // Replace the MCP call with a placeholder for now
        processedText = processedText.replace(fullMatch, `[TOOL_RESULT_${toolResults.length - 1}]`);
        
      } catch (error) {
        console.error(`❌ [MCP Tool Error] Failed to execute tool: ${toolName}`, error);
        const errorResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        toolResults.push({ tool: toolName, input: {}, result: errorResult });
        processedText = processedText.replace(fullMatch, `[TOOL_RESULT_${toolResults.length - 1}]`);
      }
    }

    // If we have tool results, make a follow-up LLM call to integrate them
    if (toolResults.length > 0) {
      const toolContext = toolResults.map((tr, index) => 
        `Tool ${index + 1}: ${tr.tool}\nInput: ${JSON.stringify(tr.input, null, 2)}\nResult: ${JSON.stringify(tr.result, null, 2)}`
      ).join('\n\n');

      const followUpPrompt = `The user's message contained MCP tool calls that have been executed. Here are the results:

${toolContext}

Please integrate these tool results into your response and provide a helpful summary or analysis. The original message was: "${text}"

Replace the placeholders [TOOL_RESULT_X] in your response with meaningful interpretations of the tool results.`;

      try {
        console.log(`🧠 [MCP LLM Integration] Making follow-up LLM call to process tool results`);
        console.log(`   🔧 Number of tools executed: ${toolResults.length}`);
        console.log(`   📝 Tool results summary:`, toolResults.map(tr => ({ tool: tr.tool, success: tr.result.success })));
        
        // Make a follow-up LLM call to process the tool results
        const conversation = getCurrentConversation();
        const systemPrompt = generateSystemPrompt();
        
        const followUpMessages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: followUpPrompt }
        ];

        const enhancedResponse = await claudeAPI.sendMessage(followUpMessages, {
          model,
          temperature,
          maxTokens,
        });

        console.log(`✅ [MCP LLM Integration] Follow-up LLM call completed successfully`);

        // Replace placeholders with actual results in the enhanced response
        let finalResponse = enhancedResponse;
        toolResults.forEach((tr, index) => {
          const placeholder = `[TOOL_RESULT_${index}]`;
          if (finalResponse.includes(placeholder)) {
            const resultSummary = `**${tr.tool}**: ${tr.result.success ? 'Success' : 'Error'} - ${JSON.stringify(tr.result, null, 2)}`;
            finalResponse = finalResponse.replace(placeholder, resultSummary);
          }
        });

        return finalResponse;

      } catch (error) {
        console.error('Error in follow-up LLM call:', error);
        // Fallback: just show the tool results
        toolResults.forEach((tr, index) => {
          const placeholder = `[TOOL_RESULT_${index}]`;
          const resultText = `**MCP Tool: ${tr.tool}**\n\`\`\`json\n${JSON.stringify(tr.result, null, 2)}\n\`\`\``;
          processedText = processedText.replace(placeholder, resultText);
        });
        return processedText;
      } finally {
        setIsProcessingMCP(false);
      }
    }

    setIsProcessingMCP(false);
    return processedText;
  };

  const handleSendMessage = async (message: string) => {
    if (!apiKey) {
      toast.error("Please set your Claude API key in settings");
      return;
    }

    if (!currentConversationId) {
      const newConversationId = createConversation();
      if (!newConversationId) return;
    }

    const conversationId = currentConversationId!;

    // Process MCP tool calls in user message (if any)
    const processedUserMessage = await processMCPToolCalls(message, conversationId);

    // Add user message
    addMessage(conversationId, {
      role: "user",
      content: processedUserMessage,
    });

    // Prepare messages for API
    const conversation = getCurrentConversation();
    if (!conversation) return;

    // Generate system prompt with current MCP tools
    const systemPrompt = generateSystemPrompt();

    debugger;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    setIsStreaming(true);

    // Add assistant message placeholder
    addMessage(conversationId, {
      role: "assistant",
      content: "",
      streaming: true,
    });

    try {
      debugger;
      const result = await claudeAPI.sendMessage(apiMessages, {
        model,
        temperature,
        maxTokens,
      });

      // Process MCP tool calls in the response
      const processedResult = await processMCPToolCalls(result, conversationId);

      // Finalize the assistant message
      const finalConversation = getCurrentConversation();
      if (finalConversation) {
        const lastMessage =
          finalConversation.messages[finalConversation.messages.length - 1];
        if (lastMessage.role === "assistant") {
          updateMessage(conversationId, lastMessage.id, {
            content: processedResult,
            streaming: false,
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send message"
      );

      // Remove the assistant message placeholder on error
      const errorConversation = getCurrentConversation();
      if (errorConversation) {
        const lastMessage =
          errorConversation.messages[errorConversation.messages.length - 1];
        if (lastMessage.role === "assistant" && lastMessage.content === "") {
          // Remove the empty assistant message
          // Note: This is a simplified approach - in a real app you'd want a more robust error handling
        }
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStopStreaming = () => {
    setIsStreaming(false);
    // In a real implementation, you'd abort the API request here
  };

  if (!apiKey) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 max-w-md"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t("chat.errorConnecting")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please add your Claude API key in the settings to start chatting.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <Loader
            size={32}
            className="text-purple-600 animate-spin mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">
            {t("common.loading")}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 min-h-0"
        onScroll={handleScroll}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {currentConversation.messages.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t("chat.emptyState")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {t("chat.emptyStateDescription")}
                </p>

                {/* Quick Start Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 max-w-2xl mx-auto">
                  {[
                    "Help me write a Python function",
                    "Explain quantum computing",
                    "Review my code for bugs",
                    "Create a creative story",
                  ].map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage(suggestion)}
                      disabled={isStreaming}
                      className="p-4 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200"
                    >
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {suggestion}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              currentConversation.messages.map((message) => (
                <motion.div
                  key={message.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ChatMessage message={message} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isStreaming || isProcessingMCP}
          isStreaming={isStreaming}
          onStopStreaming={handleStopStreaming}
        />
        {isProcessingMCP && (
          <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">Executing MCP tools and processing results...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
