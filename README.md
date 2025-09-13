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

## ⚠️ Important Notes

- **All commands are case-sensitive** and must be typed exactly as shown
- **File extensions matter** (.gif for stickers/animations, .png for photos)
- **Commands work only in the Rexy chat interface** (`/rexy` route)
- **Images must exist** in the specified directories for commands to work

## 🎯 Quick Test Commands

Copy and paste these into the chat to test each feature:

```
s-hi
s-drink
3d-thinking
show-photos
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

## 🎨 Features

- **Mobile-first responsive design**
- **Real-time chat messaging**
- **Animated stickers and GIFs**
- **Fullscreen 3D animations with overlays**
- **Instagram-style photo gallery with grid view**
- **Smooth transitions and hover effects**
- **Touch-friendly interface**

---

Enjoy testing the interactive chat features! 🎉
