# Rexy Chat - React Application

A mobile-first chat interface built with React.js, featuring real-time communication with Netomi AI, interactive 3D animations, photo galleries, and comprehensive GTM tracking.

## 🏗️ Architecture

- **Frontend**: React.js (located in `src/`)
- **Backend**: Node.js + Express + Socket.IO (in `server.js`)
- **Build Output**: Production-ready files in `build/`
- **Legacy Version**: Original HTML/JS version in `public/` (for reference)

## 🚀 Quick Start

### Development Mode (with Hot Reload)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```
   This runs both the React dev server and Node.js backend on port 3000.

3. **Open your browser:**
   - React app: `http://localhost:3000/`
   - Rexy chat: `http://localhost:3000/rexy`

### Production Mode

1. **Build the React app:**
   ```bash
   npm run build
   ```
   This creates optimized production files in the `build/` directory.

2. **Start the production server:**
   ```bash
   node server.js
   ```

3. **Access the app:**
   - Production app: `http://localhost:3000/`
   - Rexy chat: `http://localhost:3000/rexy`
   - Legacy HTML version: `http://localhost:3000/rexy-legacy`

## 🌐 Public Access with LocalTunnel

To make your local server accessible from the internet (for webhook testing with Netomi):

### 🚀 Complete Setup Steps:

1. **Install LocalTunnel** (if not already installed):
   ```bash
   npm install -g localtunnel
   ```

2. **Start your HTTP server:**
   ```bash
   npm run start
   # or
   node server.js
   ```

3. **In another terminal, start LocalTunnel:**
   ```bash
   lt --port 3000 --subdomain rexy-netomi
   ```

### 🌐 Your Public URLs will be:

- **Main site**: `https://rexy-netomi.loca.lt`
- **Webhook endpoint**: `https://rexy-netomi.loca.lt/webhook/netomi`
- **Webhook info**: `https://rexy-netomi.loca.lt/webhook/info`

### 📋 CURL Command for Netomi Team:

```bash
curl -X POST "https://rexy-netomi.loca.lt/webhook/netomi" -H "Authorization: Bearer netomi-webhook-66f1dca1b5a5442667effe2be71e1ad2cbb3a249602582ba3f283efc2ab1ef42" -H "Content-Type: application/json" -d "{\"test\": \"webhook\"}"
```

### ⚠️ Important Notes:

1. **Keep the terminal open** - LocalTunnel runs as long as the terminal is active
2. **First visit** to the URL may show a LocalTunnel landing page - click "Continue"
3. **Free subdomain** - anyone can use `rexy-netomi` if you're not using it
4. **HTTP server** works better with LocalTunnel (no SSL certificate issues)

### 🎯 For Netomi Team Configuration:

```
Webhook URL: https://rexy-netomi.loca.lt/webhook/netomi
Method: POST
Authentication: Bearer Token
Authorization Header: Bearer netomi-webhook-66f1dca1b5a5442667effe2be71e1ad2cbb3a249602582ba3f283efc2ab1ef42
Content-Type: application/json
```

## 🐛 Debug Logging

The application has two independent debug logging systems that can be toggled on/off:

### 🖥️ Client-Side Debug (React/Browser)

**Location:** `src/utils/debug.js`

**Control:**
- **Via Code:** Edit `DEBUG_MODE` constant in `src/utils/debug.js`
  ```javascript
  const DEBUG_MODE = true;  // Enable debug logs
  const DEBUG_MODE = false; // Disable debug logs
  ```

**At Runtime (Browser Console):**
```javascript
// Enable debug logging
window.debugLogger.enable();

// Disable debug logging
window.debugLogger.disable();

// Check current state
window.debugLogger.isEnabled(); // returns true/false
```

**What Gets Logged:**
- Component lifecycle events
- User interactions
- Message send/receive
- Animation triggers
- GTM events
- API responses

**Console Output Examples:**
```
✅ Welcome animation ready - page can start showing content
✅ All assets preloaded (6/6)
[ChatContainer] Processing real-time webhook update
[AnimationManager] 3D Animation decision: userChatCount=3, showAnimation=true
🏷️ GTM Event: message_send
```

### 🖧 Server-Side Debug (Node.js)

**Location:** `utils/server-debug.js`

**Control:**
- **Via Environment Variable:** Set `SERVER_DEBUG` in `.env` file
  ```bash
  # Enable debug logs (default)
  SERVER_DEBUG=true
  
  # Disable debug logs
  SERVER_DEBUG=false
  ```

**At Runtime (Server Console):**
```javascript
// In server.js, you can call:
debug.enable();   // Enable debug logging
debug.disable();  // Disable debug logging
```

**What Gets Logged:**
- Server startup
- Token generation/refresh
- Webhook processing
- Socket.IO connections
- API requests
- Conversation routing

**Console Output Examples:**
```
✅ Server debug logging ENABLED
⚠️  HTTP server enabled (no SSL certificates found - OK for local development)
[Server Token] Initializing token system...
[Server Token] Token generated and saved successfully
🌐 Netomi HTTP Server listening on http://localhost:3000
[Socket.IO] Client connected: abc123xyz
[Process Message] Using server-managed token for all requests
[Routing] conversationId chat-456 mapped to socket abc123xyz
[Netomi Webhook] Payload response received
```

### 🎛️ Debug Configuration Matrix

| Environment | Client Debug | Server Debug | Reason |
|-------------|--------------|--------------|---------|
| **Local Development** | `true` | `true` | Need detailed logs for debugging |
| **Staging** | `true` | `true` | Testing and verification |
| **Production** | `false` | `false` | Reduce noise, improve performance |
| **Troubleshooting** | `true` | `true` | Temporarily enable for diagnostics |

### 📝 Important Notes

- **Errors are always shown** regardless of debug settings
- Client debug affects browser console only
- Server debug affects server terminal/logs only
- Both can be controlled independently
- No rebuild required when changing server debug flag (`.env` only)
- Rebuild required when changing client debug flag (`src/utils/debug.js`)

## 🎮 Testing Interactive Features

### 🎭 Stickers

**How to use:** Type `s-[sticker_name]` in the chat input and press Enter

**Available stickers** (located in `public/image/stickers/`):
- `s-drink` - Shows drink.gif
- `s-hi` - Shows hi.gif  
- `s-[any_sticker_name]` - Looks for `[sticker_name].gif`

**Example:**
```
Type: s-drink
Result: Bot sends the drink sticker animation
```

### 🎬 3D Animations

**How to use:** Type `3d-[animation_name]` in the chat input and press Enter

**Available animations** (located in `public/image/3d/`):
- `3d-thinking` - Shows `Rexy_Thinking.gif` fullscreen overlay for 5 seconds
- **Wait Animation**: When waiting for responses, randomly shows one of: `Rexy_Thinking.gif`, `Rexy_Receivephoto.gif`, or `Rexy_Searching.gif`
- `3d-[any_animation_name]` - Looks for `Rexy_[animation_name].gif`

**Example:**
```
Type: 3d-thinking
Result: Fullscreen thinking animation with semi-transparent overlay
```

### 📸 Photo Gallery

**How to use:** Type `show-photos` in the chat input and press Enter

**Features:**
- Shows a stack of 3 photos from `public/image/example-photo/`
- Photos: `photo1.png`, `photo2.png`, `photo3.png`
- Interactive Instagram-style gallery experience

**Navigation Flow:**
1. **Type `show-photos`** → Creates stacked photos in chat
2. **Click the photo stack** → Opens 2-column grid gallery view
3. **Click individual photo** → Opens fullscreen view
4. **Use navigation arrows (‹ ›)** → Browse between photos in fullscreen
5. **Click X button:**
   - From fullscreen → Returns to gallery view
   - From gallery → Returns to chat

**Example:**
```
Type: show-photos
Result: Bot sends a stack of 3 rotated photos that you can click to explore
```


## 🏗️ Project Structure

### React Application (Current)

```
src/
├── components/              # React components
│   ├── ChatContainer.js     # Main chat container
│   ├── ChatMessages.js      # Message list
│   ├── Message.js           # Individual message
│   ├── ChatInput.js         # User input
│   ├── ChatHeader.js        # Chat header
│   ├── PhotoOverlay.js      # Fullscreen photo viewer
│   ├── VideoOverlay.js      # Fullscreen video player
│   └── ConnectionErrorOverlay.js
├── hooks/                   # Custom React hooks
│   ├── useNetomiIntegration.js  # Netomi API integration
│   ├── useAnimationManager.js   # 3D animations
│   ├── useAssetPreloader.js     # Asset preloading
│   └── useGTMManager.js         # Google Tag Manager
├── contexts/
│   └── SocketContext.js     # Socket.IO context
├── styles/                  # CSS stylesheets
│   ├── App.css
│   ├── Message.css
│   ├── ChatInput.css
│   └── PhotoOverlay.css
├── utils/                   # Utility functions
│   ├── debug.js             # Client-side debug logger
│   ├── sanitizer.js         # HTML sanitization (XSS protection)
│   └── helpers.js
├── App.js                   # Root React component
└── index.js                 # Entry point

build/                       # Production build output
└── [Compiled React app]

server.js                    # Node.js + Express + Socket.IO backend

utils/
├── server-debug.js          # Server-side debug logger
└── log-sanitizer.js         # Log sanitization (security)

public/                      # Static assets & legacy version
├── image/
│   ├── stickers/            # GIF stickers
│   ├── 3d/                  # 3D animations
│   └── example-photo/       # Gallery photos
├── css/                     # Legacy CSS
├── js/                      # Legacy JavaScript
└── rexy.html               # Legacy HTML version
```

### Key Directories

- **`src/`** - React application source code
- **`build/`** - Production-ready compiled React app
- **`public/`** - Static assets and legacy HTML version
- **`server.js`** - Backend server with API and webhook handling
- **`utils/`** - Server-side utilities (debug, sanitization)

## ✨ Features

### Core Features
- 💬 **Real-time Chat** - Socket.IO powered live messaging
- 🤖 **Netomi AI Integration** - Intelligent chatbot responses
- 🎭 **Interactive Stickers** - Animated GIF stickers
- 🎬 **3D Animations** - Fullscreen thinking/loading animations
- 📸 **Photo Gallery** - Instagram-style photo viewer
- 🎥 **Video Support** - Fullscreen video player with thumbnails
- 📊 **Message Carousels** - Horizontal scrolling image galleries

### Advanced Features
- 🔄 **Asset Preloading** - Preload 3D animations for instant display
- 📈 **GTM Integration** - Comprehensive Google Tag Manager tracking
- 🔐 **Security Hardening**:
  - XSS protection with DOMPurify
  - Format string sanitization
  - Input validation
  - HTTPS support
- 🐛 **Debug System** - Toggle-able logging for client and server
- 🔌 **Webhook Support** - Real-time webhook handling from Netomi
- 💾 **Session Management** - Persistent conversation IDs

### UI/UX Features
- 📱 **Mobile-First Design** - Optimized for mobile devices
- ⚡ **Fast Load Times** - Optimized React build
- 🎨 **Modern Interface** - Clean, intuitive chat UI
- 🔔 **Typing Indicators** - Animated dots while waiting for response
- 🖼️ **Click-to-Expand** - Fullscreen image and video viewing
- 🔄 **Auto-scroll** - Smart scroll to latest messages

## 🛠️ Technologies

### Frontend
- **React.js** - UI framework
- **Socket.IO Client** - Real-time communication
- **DOMPurify** - XSS protection
- **Google Tag Manager** - Analytics tracking
- **CSS3** - Styling and animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web server framework
- **Socket.IO** - WebSocket server
- **Netomi API** - AI chatbot integration
- **HTTPS/HTTP** - Secure/insecure protocols

### Development
- **Create React App** - React toolchain
- **CRACO** - Build configuration
- **ES6 Modules** - Modern JavaScript
- **Environment Variables** - Configuration management

## 📦 Environment Variables

Create a `.env` file in the project root:

```bash
# Netomi API Configuration
NETOMI_CHANNEL_REF_ID=your_channel_ref_id
NETOMI_VIRTUAL_AGENT_ID=your_virtual_agent_id
NETOMI_ENDPOINT_URL=https://demo.netomi.com/api

# Webhook Configuration
WEBHOOK_BEARER_TOKEN=your_webhook_bearer_token

# Server Configuration
PORT=3000

# Debug Configuration
SERVER_DEBUG=true  # Set to 'false' to disable server debug logs
```

## 🔒 Security Features

- ✅ **XSS Protection** - DOMPurify sanitizes all bot HTML content
- ✅ **Log Injection Prevention** - User input sanitized before logging
- ✅ **Input Validation** - ConversationID format validation
- ✅ **HTTPS Support** - Automatic SSL certificate detection
- ✅ **X-Powered-By Hidden** - Server information exposure prevented
- ✅ **Bearer Token Auth** - Webhook authentication required

## 📚 Additional Documentation

- `documentation/gtm-implementation.md` - GTM tracking specification
- `documentation/xss-security-review.md` - XSS security analysis
- `documentation/FORMAT_STRING_SECURITY_REVIEW.md` - Format string vulnerability review
- `utils/server-debug.js` - Server debug logger documentation
- `src/utils/debug.js` - Client debug logger documentation

## 🤝 Contributing

When making changes:
1. Test in both development and production modes
2. Verify debug logging works correctly
3. Check for linting errors
4. Test with real Netomi webhooks
5. Verify GTM events are firing correctly

## 📝 License

[Your License Here]
