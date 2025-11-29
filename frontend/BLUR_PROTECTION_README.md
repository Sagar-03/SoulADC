# Blur Protection System

## Overview
Advanced content protection system that prevents screenshots and screen recordings by detecting suspicious keyboard activity and blurring the screen when potential capture attempts are detected.

## Features

### 🔒 Screenshot Prevention
- **Print Screen Detection**: Automatically pauses content and blurs screen for 30 seconds
- **Snipping Tool Detection**: Detects Windows + Shift + S combinations
- **Custom Duration**: Configurable blur duration for different key events

### 🎯 Smart Key Detection
- **Allowed Keys**: Space bar allowed for normal interaction
- **Suspicious Keys**: F12, F11, Insert keys trigger protection
- **Navigation Safe**: Arrow keys, Tab, Enter, Escape won't trigger blur
- **Regular Keys**: Other keys apply 10-second protection to prevent false positives

### 🛡️ Additional Security
- **Right-Click Prevention**: Context menu disabled on protected content
- **Developer Tools Detection**: Monitors for DevTools opening
- **Visual Feedback**: Warning messages during protection activation
- **Auto-Pause**: Video content automatically pauses when screenshot detected

## Implementation

### Files Structure
```
frontend/
├── src/
│   ├── utils/
│   │   └── blurProtection.js          # Core protection utility
│   ├── Components/
│   │   ├── VideoPlayer/
│   │   │   ├── ProtectedVideoPlayer.jsx   # Protected video wrapper
│   │   │   └── DocumentViewer.jsx          # Protected document viewer
```

### Protected Components

#### 1. Video Player
Location: `frontend/src/Components/VideoPlayer/ProtectedVideoPlayer.jsx`

**Features:**
- Blur protection during video playback
- Auto-pause on screenshot attempts
- 30-second blur for Print Screen
- 15-second blur for suspicious keys
- 10-second blur for regular keys

**Usage:**
```jsx
<ProtectedVideoPlayer
  show={true}
  videoSrc="video-url"
  videoTitle="Video Title"
  onHide={handleClose}
/>
```

#### 2. Document Viewer
Location: `frontend/src/Components/VideoPlayer/DocumentViewer.jsx`

**Features:**
- Blur protection for PDF/document viewing
- Same key detection as video player
- No auto-pause (documents don't play)
- Context menu disabled

**Usage:**
```jsx
// Accessed via route: /documents/:courseId/view/:documentId
```

## Protection Utility API

### Core Functions

#### `applyBlur(duration, message)`
Applies blur overlay to entire screen.

**Parameters:**
- `duration` (number): Duration in milliseconds (default: 15000)
- `message` (string): Optional warning message to display

**Example:**
```javascript
import { applyBlur } from '../../utils/blurProtection';

applyBlur(30000, '⚠️ Screenshot Detected');
```

#### `setupBlurProtection(options)`
Sets up keyboard protection for a component.

**Parameters:**
- `options` (object):
  - `allowedKeys` (array): Keys that won't trigger blur (default: `["Space"]`)
  - `printScreenDuration` (number): Blur duration for Print Screen (default: 30000ms)
  - `defaultDuration` (number): Blur duration for suspicious keys (default: 15000ms)
  - `pauseContent` (function): Function to pause content when blur activates
  - `showMessage` (boolean): Whether to show warning messages (default: true)

**Returns:** Cleanup function

**Example:**
```javascript
import { setupBlurProtection } from '../../utils/blurProtection';

useEffect(() => {
  const cleanup = setupBlurProtection({
    allowedKeys: ["Space", "ArrowUp", "ArrowDown"],
    printScreenDuration: 30000,
    defaultDuration: 15000,
    pauseContent: () => video.pause(),
    showMessage: true
  });

  return cleanup;
}, []);
```

#### `additionalProtection()`
Enables extra security measures.

**Features:**
- Context menu (right-click) prevention
- Developer tools detection
- Auto-blur when DevTools detected

**Returns:** Cleanup function

**Example:**
```javascript
import { additionalProtection } from '../../utils/blurProtection';

useEffect(() => {
  const cleanup = additionalProtection();
  return cleanup;
}, []);
```

#### `removeBlur()`
Manually removes blur overlay.

**Example:**
```javascript
import { removeBlur } from '../../utils/blurProtection';

removeBlur();
```

## Key Detection Logic

### Allowed Keys (No Blur)
- `Space` - Normal interaction
- `Tab`, `Enter`, `Escape`, `Backspace` - Navigation
- `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` - Navigation
- `Home`, `End`, `PageUp`, `PageDown` - Navigation
- `Shift`, `Control`, `Alt`, `Meta` - Modifier keys
- `CapsLock`, `NumLock`, `ScrollLock` - Lock keys

### Screenshot Detection (30s Blur)
- `PrintScreen` - Print Screen key
- `Meta + Shift + S` - Windows Snipping Tool
- Pauses content automatically

### Suspicious Keys (15s Blur)
- `F12` - Developer tools
- `F11` - Screenshot tools
- `Insert` - Can be used for screenshots

### Regular Keys (10s Blur)
- Any other non-navigation keys
- Shorter duration to prevent false positives

## Integration Guide

### Adding Protection to New Component

1. **Import the utility:**
```javascript
import { setupBlurProtection, additionalProtection } from '../../utils/blurProtection';
```

2. **Add useEffect hook:**
```javascript
useEffect(() => {
  if (!isActive) return;

  // Setup blur protection
  const cleanupBlur = setupBlurProtection({
    allowedKeys: ["Space"],
    printScreenDuration: 30000,
    defaultDuration: 15000,
    pauseContent: handlePause,
    showMessage: true
  });

  // Setup additional protection
  const cleanupExtra = additionalProtection();

  return () => {
    cleanupBlur();
    cleanupExtra();
  };
}, [isActive]);
```

3. **Implement pause handler (if needed):**
```javascript
const handlePause = () => {
  // Pause your content
  video.pause();
  // or audio.pause();
  // or setIsPlaying(false);
};
```

## Customization

### Changing Blur Duration
Edit `blurProtection.js`:
```javascript
// Default durations
printScreenDuration: 30000,    // 30 seconds
defaultDuration: 15000,        // 15 seconds
regularKeyDuration: 10000      // 10 seconds
```

### Modifying Allowed Keys
```javascript
const cleanup = setupBlurProtection({
  allowedKeys: ["Space", "Enter", "ArrowUp", "ArrowDown"],
  // ... other options
});
```

### Custom Warning Messages
```javascript
applyBlur(15000, "🔒 Custom Warning Message");
```

### Styling Blur Overlay
Edit in `blurProtection.js` → `applyBlur()` function:
```javascript
backdrop-filter: blur(25px);           // Blur intensity
background: rgba(0, 0, 0, 0.5);       // Overlay darkness
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Blur Effect | ✅ | ✅ | ✅ | ✅ |
| Key Detection | ✅ | ✅ | ✅ | ✅ |
| Context Menu Block | ✅ | ✅ | ✅ | ✅ |
| DevTools Detection | ✅ | ⚠️ | ⚠️ | ✅ |

⚠️ = Partially supported

## Security Notes

### What This DOES Protect Against:
- ✅ Print Screen key captures
- ✅ Snipping Tool (Windows + Shift + S)
- ✅ Some third-party screenshot tools
- ✅ Right-click "Save as"
- ✅ Browser DevTools inspection

### What This CANNOT Protect Against:
- ❌ External camera recording
- ❌ Hardware screen capture devices
- ❌ Mobile phone photos
- ❌ Virtual machines with different input
- ❌ Advanced screen recording software with low-level hooks
- ❌ Modified browsers

**Important:** This is a deterrent system, not an absolute prevention mechanism. Determined users with advanced tools may still find ways to capture content.

## Testing

### Manual Test Cases

1. **Print Screen Test:**
   - Open protected video/document
   - Press Print Screen
   - Verify: Screen blurs for 30 seconds, content pauses

2. **Snipping Tool Test:**
   - Open protected content
   - Press Windows + Shift + S
   - Verify: Screen blurs, warning shown

3. **Regular Key Test:**
   - Open protected content
   - Press any letter key
   - Verify: Brief blur (10 seconds)

4. **Allowed Key Test:**
   - Open protected content
   - Press Space bar
   - Verify: No blur, normal interaction

5. **DevTools Test:**
   - Open protected content
   - Press F12 to open DevTools
   - Verify: Screen blurs

## Troubleshooting

### Blur Not Activating
- Check browser console for errors
- Ensure component is mounted when protection activates
- Verify `show` or `isActive` prop is true

### False Positives
- Adjust `allowedKeys` array to include more keys
- Reduce blur duration for `regularKeyDuration`

### Performance Issues
- Reduce blur intensity in CSS
- Increase detection interval for DevTools check
- Disable additional protection if not needed

## Future Enhancements

- [ ] Machine learning-based recording detection
- [ ] Watermarking system
- [ ] User activity logging
- [ ] Analytics dashboard for protection events
- [ ] Mobile device detection
- [ ] Custom blur patterns per content type

## Support

For issues or questions:
1. Check console logs for protection events
2. Review this documentation
3. Test in different browsers
4. Check for JavaScript errors

## Changelog

### Version 1.0.0 (Current)
- Initial implementation
- Video player protection
- Document viewer protection
- Core blur protection utility
- Print Screen detection
- Snipping Tool detection
- DevTools detection
- Context menu prevention
