# Rexy Chat - React Version

This is a React.js version of the Rexy chat application, converted from the original HTML/JavaScript implementation.

## Features

- **Chat Interface**: Modern React-based chat UI with message bubbles
- **Netomi Integration**: AI-powered responses via Netomi API
- **3D Animations**: Rexy character animations for welcome, thinking, and interactions
- **Photo Support**: Camera and photo gallery integration
- **GTM Tracking**: Google Tag Manager integration for analytics
- **Responsive Design**: Mobile-first responsive design
- **Real-time Communication**: Socket.IO integration for real-time updates

## Project Structure

```
src/
├── components/          # React components
│   ├── ChatContainer.js    # Main chat container
│   ├── ChatHeader.js       # Header with Rexy avatar and Coach branding
│   ├── ChatMessages.js     # Messages display area
│   ├── ChatInput.js        # Input area with photo options
│   ├── Message.js          # Individual message component
│   ├── ConnectionErrorOverlay.js
│   ├── PhotoOptionsPopup.js
│   └── ImagePreview.js
├── hooks/              # Custom React hooks
│   ├── useNetomiIntegration.js  # Netomi API integration
│   ├── useAnimationManager.js   # 3D animation management
│   └── useGTMManager.js        # Google Tag Manager integration
├── styles/             # CSS stylesheets
│   ├── App.css
│   ├── Message.css
│   └── ChatInput.css
└── utils/              # Utility functions
```

## Key Components

### ChatContainer
Main container component that manages:
- Message state
- Netomi integration
- Animation management
- GTM tracking

### useNetomiIntegration Hook
Handles:
- Server connection testing
- Message sending to Netomi API
- Conversation ID management
- Webhook response handling

### useAnimationManager Hook
Manages:
- Welcome animations
- Thinking animations (random triggers)
- Watch reel animations
- Animation overlays

### useGTMManager Hook
Provides:
- GTM event tracking
- Message send/receive tracking
- Content interaction tracking
- Error tracking
- Session management

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Build for production:
```bash
npm run build
```

## API Integration

The React app integrates with the existing server.js backend:
- `/api/netomi/test-connection` - Test server connection
- `/api/netomi/process-message` - Send messages to Netomi
- Socket.IO for real-time webhook responses

## Assets

The app uses the same image assets as the original:
- `/image/3d/` - 3D Rexy animations
- `/image/coach/` - Coach branding
- `/image/ui-icon/` - UI icons

## Differences from Original

1. **Component-based Architecture**: Modular React components instead of monolithic HTML
2. **State Management**: React hooks for state management instead of global variables
3. **Event Handling**: React event system instead of direct DOM manipulation
4. **Styling**: CSS modules approach with component-specific styles
5. **Type Safety**: Better error handling and type checking

## Browser Support

- Modern browsers with ES6+ support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design for all screen sizes

## Development

The app maintains the same functionality as the original while providing:
- Better maintainability
- Component reusability
- Modern React patterns
- Improved performance
- Better developer experience
