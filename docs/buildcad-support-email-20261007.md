# BuildCAD 官方支持邮件草稿

状态：**尚未发送**。用户已授权发送脱敏复现材料；当前 Gmail 连接要求重新授权。以下正文不含密钥、令牌、账户资料或项目源码。

收件人：hello@buildcad.ai

主题：MCP render_preview returns “fetch failed” for minimal llmcad geometry

---

Hello BuildCAD Support,

We are integrating your official Streamable HTTP MCP endpoint, `https://buildcad.ai/api/mcp`, into a local application. OAuth authorization and tool discovery work, but `render_preview` consistently returns a tool error rather than an image.

Could you investigate the server-side rendering failure and confirm whether there are any additional documented prerequisites for rendering?

## Reproduction

1. Initialize an authenticated MCP session and send the initialized notification.
2. List tools successfully. The returned tools are `list_designs`, `get_design_code`, `render_preview`, and `save_design`.
3. Call `render_preview` with these arguments:

```json
{
  "code": "from llmcad import Box\nresult = Box(10, 10, 10)",
  "views": ["iso"]
}
```

The tool returns:

```json
{
  "content": [{"type": "text", "text": "fetch failed"}],
  "isError": true
}
```

Expected: a PNG preview of the box. Actual: only the error text, with zero image blocks.

## Observations

- Tests around **2026-10-07 18:47, UTC+8** negotiated MCP protocol `2025-06-18`. The minimal box call took approximately 5.73 seconds before returning the above error.
- An additional test included an explicit snapshot call: `from llmcad import Box, snapshot`, `result = Box(10, 20, 30)`, and `snapshot(result, "mcp_probe", views=["iso"])`. This also returned the same error. That test took approximately 7.27 seconds including session establishment.
- Earlier tests around **2026-10-07 16:22, UTC+8**, including an independent raw HTTP/JSON-RPC implementation negotiating `2025-03-26`, received HTTP 200/SSE with the same tool-level error. Deliberately invalid Python also returned `fetch failed`, rather than a Python syntax error.
- A later end-to-end test around **18:52, UTC+8** submitted a simple hollow-cylinder request through the application. It reached `render_preview` and again returned the same error, with zero images and no browser JavaScript errors.
- The minimal box tests bypassed our language model and frontend. We did not call `save_design`, perform automatic retries, or send proprietary design code.
- The returned tool schema requires only `code`; `views` is optional. We did not find a documented requirement to create or save a design before previewing.

We cannot determine from the generic error whether the failure involves a rendering dependency, network access, service configuration, or an account-specific prerequisite. Please check the MCP/rendering execution logs for the times above and advise on the supported resolution. If an additional account identifier is necessary, please specify what you need and an appropriate secure channel; we will not send access tokens or API keys by email.

Thank you.
