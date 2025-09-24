# Coach AI Chat Interface - Test Assets Guide

This project includes a mobile-first chat interface with interactive test assets including stickers, 3D animations, and photo galleries.

## 🚀 Getting Started

1. Start the server:
   ```bash
   node server.js
   ```

2. Open your browser and navigate to:
   - Main API testing interface: `http://localhost:3000/`
   - Chat interface with Rexy: `http://localhost:3000/rexy`

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

```
public/
├── image/
│   ├── stickers/        # GIF stickers (s-command)
│   ├── 3d/             # 3D animations (3d-command)
│   └── example-photo/   # Gallery photos (show-photos)
├── css/
│   ├── rexy.css        # Main chat interface styles
│   ├── message.css     # Message bubble styles
│   └── photo.css       # Photo gallery styles
└── js/
    ├── rexy.js         # Core chat functionality
    ├── test-assets.js  # Testing commands logic
    └── photo.js        # Photo gallery interactions
```
