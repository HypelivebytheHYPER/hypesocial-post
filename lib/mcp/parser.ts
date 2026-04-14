export function parseToolCalls(
  content: string
): Array<{ name: string; arguments: Record<string, unknown> }> | undefined {
  const toolCalls: Array<{ name: string; arguments: Record<string, unknown> }> =
    [];
  const regex = /<tool_call>(.*?)<\/?tool_call>/gs;
  let match;

  while ((match = regex.exec(content)) !== null) {
    try {
      const matchText = match[1];
      if (!matchText) continue;
      const toolCall = JSON.parse(matchText.trim());
      if (toolCall.name) {
        toolCalls.push({
          name: toolCall.name,
          arguments: toolCall.arguments || {},
        });
      }
    } catch (e) {
      console.error("[MCP] Failed to parse tool call:", match[1]);
    }
  }

  return toolCalls.length > 0 ? toolCalls : undefined;
}
