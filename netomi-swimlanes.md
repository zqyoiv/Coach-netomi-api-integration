# Netomi API Integration - Data Flow Swimlanes

This document shows the complete data flow from client applications through the Node.js server to the Netomi platform.

## Swimlanes.io Format

```swimlanes-io
title: Netomi API Integration Data Flow

// Define the participants/swimlanes (left to right order)
FE UI: Frontend UI Application
Node.js Server: Node.js Server
Netomi: Netomi Platform
Webhook: Webhook Handler

// 1. Server Startup and Token Management
note over Node.js Server: 🚀 Server Startup Process
Node.js Server -> Netomi: POST /v1/auth/generate-token\n(x-channel, x-virtual-agent-id headers)
Netomi -> Node.js Server: {token, expires_in}
Node.js Server -> Node.js Server: Store serverAuthToken\nSetup 23-hour auto-refresh

// 2. Client Connection and Authentication
note over FE UI, Node.js Server: 🔌 Initial Connection
FE UI -> Node.js Server: WebSocket connection
Node.js Server -> FE UI: connection confirmed\n{socketId}

FE UI -> Node.js Server: socket.emit('authenticate')\n{authToken, clientInfo}
Node.js Server -> FE UI: socket.emit('authenticated')\n{success: true}

// 3. Token Request Flow
note over FE UI, Node.js Server: 🎫 Token Request
FE UI -> Node.js Server: GET /api/netomi/generate-token
alt Token Valid
  Node.js Server -> FE UI: 200 {token, expires_in}\n(read-only access)
else Token Expired
  Node.js Server -> FE UI: 503 "retry in a few seconds"
end

// 4. Message Processing Flow
note over FE UI, Netomi: 💬 Message Processing
FE UI -> Node.js Server: POST /api/netomi/process-message\n{messageData: {\n  conversationId,\n  messagePayload: {text, messageId},\n  userDetails: {userId},\n  origin: "rexy-chat"\n}, clientSocketId}

note over Node.js Server: 🗺️ Conversation Mapping
Node.js Server -> Node.js Server: Map conversationId → socketId\nStore in conversationToSocket Map

Node.js Server -> Netomi: POST /v1/conversations/process-message\nHeaders:\n- x-auth-token: serverAuthToken\n- x-channel: CHAT\n- x-virtual-agent-id\n- x-integration-channel: NETOMI_WEB_WIDGET\nBody: messageData

Netomi -> Node.js Server: 200 Acknowledgment\n{status: "accepted", requestId}
Node.js Server -> FE UI: 200 {ok: true, data: acknowledgment}

// 5. Webhook Response Flow (Async)
note over Netomi, Webhook: 🪝 Async AI Response
Netomi -> Webhook: POST /webhook/netomi\nAuthorization: Bearer {WEBHOOK_BEARER_TOKEN}\nBody: {\n  requestPayload: {conversationId},\n  response: {ai_message, attachments}\n}

note over Webhook: 🔐 Security Validation
Webhook -> Webhook: Verify Bearer token\nOptional signature verification

note over Webhook, Node.js Server: 🎯 Targeted Delivery Processing
Webhook -> Node.js Server: Extract conversationId\nFind socketId from conversationToSocket\nLocate client in connectedClients

Node.js Server -> FE UI: socket.emit('webhook_update', {\n  type: 'webhook_update',\n  message: response,\n  deliveryId\n})\n(ONLY to matching client)

FE UI -> Node.js Server: Acknowledgment received

// 6. Data Storage and Management
note over Node.js Server: 📊 Data Persistence
Node.js Server -> Node.js Server: Store in conversations Map:\nconversationId → [{timestamp, payload, type}]
Node.js Server -> Node.js Server: Store in webhookMessages Array:\n[{timestamp, data, headers, source}]
Node.js Server -> Node.js Server: Update connectedClients Map:\nsocketId → {socket, authToken, conversationIds}

// 7. Auto Token Refresh (Background)
note over Node.js Server, Netomi: 🔄 Auto Token Refresh (Every 23 hours)
loop Every 23 hours
  Node.js Server -> Netomi: POST /v1/auth/generate-token
  Netomi -> Node.js Server: New {token, expires_in}
  Node.js Server -> Node.js Server: Update serverAuthToken\nUpdate serverTokenExpiry
end

// 8. Error Handling and Cleanup
note over FE UI, Node.js Server: 🧹 Connection Cleanup
FE UI -> Node.js Server: WebSocket disconnect
Node.js Server -> Node.js Server: Remove from connectedClients\nClean conversationToSocket mappings\nCleanup conversation references

// 9. Additional API Endpoints
note over FE UI, Node.js Server: 📋 Additional Operations
FE UI -> Node.js Server: GET /api/conversations/{id}
Node.js Server -> FE UI: {conversationId, messages: [...]}

FE UI -> Node.js Server: GET /api/conversations
Node.js Server -> FE UI: {conversations: {id: {messageCount, lastActivity}}}

FE UI -> Node.js Server: GET /api/webhook-messages
Node.js Server -> FE UI: {messages: recent_webhook_logs}

note over FE UI, Netomi: 🔄 Token Refresh API
FE UI -> Node.js Server: POST /api/netomi/refresh-token\n{refreshToken}
Node.js Server -> Netomi: POST /v1/auth/refresh-token
Netomi -> Node.js Server: New token data
Node.js Server -> FE UI: {ok: true, data: token_data}
```

## Key Data Structures

### Server-side Storage Maps
```
connectedClients: Map<socketId, {
  socket: WebSocket,
  authToken: string,
  authenticated: boolean,
  connectedAt: timestamp,
  conversationIds: Set<string>
}>

conversationToSocket: Map<conversationId, socketId>

conversations: Map<conversationId, [{
  timestamp: number,
  payload: object,
  type: 'webhook_response' | 'user_message'
}]>

webhookMessages: Array<{
  timestamp: number,
  data: object,
  headers: object,
  source: 'webhook_endpoint'
}>

pendingRequests: Map<requestId, {
  resolve: function,
  reject: function,
  timestamp: number
}>
```

### Message Data Structure
```json
{
  "conversationId": "chat-uuid-here",
  "messagePayload": {
    "text": "User message content",
    "label": "",
    "messageId": "message-uuid",
    "timestamp": 1640995200000,
    "hideMessage": false
  },
  "userDetails": {
    "userId": "rexy-chat-user"
  },
  "origin": "rexy-chat",
  "eventType": "message",
  "additionalAttributes": {
    "CUSTOM_ATTRIBUTES": {}
  }
}
```

### Webhook Response Structure
```json
{
  "requestPayload": {
    "conversationId": "chat-uuid-here"
  },
  "response": {
    "text": "AI response text",
    "attachments": [
      {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [...]
        }
      }
    ]
  },
  "requestId": "request-uuid"
}
```

## Security Features

### 🔐 Authentication Layers
1. **Server Token Management**: 23-hour auto-refresh, client read-only access
2. **Webhook Security**: Bearer token validation, optional signature verification
3. **Client Isolation**: Conversation-specific delivery, no broadcasting
4. **Connection Tracking**: Automatic cleanup on disconnect

### 🎯 Targeted Delivery System
1. **Conversation Mapping**: Each conversationId mapped to specific socketId
2. **Client Isolation**: Webhook responses delivered only to originating client
3. **No Broadcasting**: Never sends messages to all connected clients
4. **Cleanup Mechanisms**: Automatic removal of stale mappings

## Performance Optimizations

### 📊 In-Memory Storage
- **Development**: Maps and Arrays for fast access
- **Production Ready**: Redis recommended for scalability

### 🔄 Connection Management
- **Heartbeat**: 25s ping interval, 60s timeout tolerance
- **Retry Logic**: Webhook delivery with acknowledgment tracking
- **Auto-reconnection**: Socket.IO built-in reconnection handling

### ⚡ Async Processing
- **Non-blocking**: Immediate acknowledgment, async webhook delivery
- **Promise Tracking**: Pending requests map for webhook correlation
- **Timeout Handling**: 30s default timeout for webhook responses
