/**
 * Blur Protection Utility
 * Prevents screenshots and screen recordings by blurring the screen when suspicious keys are pressed
 */

let blurTimeout = null;
let activeBlurLayer = null;

/**
 * Apply blur overlay to the entire screen
 * @param {number} duration - Duration in milliseconds to keep the blur active
 * @param {string} message - Optional message to display during blur
 */
export const applyBlur = (duration = 15000, message = null) => {
  // BLUR OVERLAY
  let blurLayer = document.getElementById("blur-protect-layer");

  if (!blurLayer) {
    blurLayer = document.createElement("div");
    blurLayer.id = "blur-protect-layer";
    blurLayer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
      background: rgba(0, 0, 0, 0.5);
      z-index: 999999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    document.body.appendChild(blurLayer);
    activeBlurLayer = blurLayer;

    // Add warning message if provided
    if (message) {
      const messageDiv = document.createElement("div");
      messageDiv.style.cssText = `
        color: white;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        padding: 30px;
        background: rgba(255, 59, 48, 0.9);
        border-radius: 15px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        pointer-events: none;
        user-select: none;
      `;
      messageDiv.textContent = message;
      blurLayer.appendChild(messageDiv);
    }
  }

  // Force reflow to ensure transition works
  void blurLayer.offsetWidth;
  blurLayer.style.opacity = "1";

  // Clear any existing timeout
  if (blurTimeout) {
    clearTimeout(blurTimeout);
  }

  // Remove blur after specified duration
  blurTimeout = setTimeout(() => {
    if (blurLayer && blurLayer.parentNode) {
      blurLayer.style.opacity = "0";
      setTimeout(() => {
        if (blurLayer && blurLayer.parentNode) {
          blurLayer.remove();
          activeBlurLayer = null;
        }
      }, 300);
    }
  }, duration);

  // Log the protection event
  console.warn(`Screen protection activated for ${duration / 1000} seconds`);
};

/**
 * Remove blur immediately
 */
export const removeBlur = () => {
  if (blurTimeout) {
    clearTimeout(blurTimeout);
    blurTimeout = null;
  }

  const blurLayer = document.getElementById("blur-protect-layer");
  if (blurLayer && blurLayer.parentNode) {
    blurLayer.style.opacity = "0";
    setTimeout(() => {
      if (blurLayer && blurLayer.parentNode) {
        blurLayer.remove();
        activeBlurLayer = null;
      }
    }, 300);
  }
};

/**
 * Enhanced keyboard event handler for content protection
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Object} options - Configuration options
 */
export const handleProtectionKeyPress = (e, options = {}) => {
  const {
    allowedKeys = ["Space"], // Keys that won't trigger blur
    printScreenDuration = 30000, // 30 seconds for Print Screen
    defaultDuration = 15000, // 15 seconds for other keys
    pauseContent = null, // Function to pause content (video/audio)
    showMessage = true // Whether to show warning message
  } = options;

  // Check if key is in allowed list
  if (allowedKeys.includes(e.code)) {
    return;
  }

  // Handle Print Screen key - multiple detection methods
  if (e.code === "PrintScreen" || e.key === "PrintScreen" || e.keyCode === 44 || e.which === 44) {
    e.preventDefault();
    if (pauseContent) pauseContent();
    applyBlur(
      printScreenDuration,
      showMessage ? "⚠️ Screenshot Detected - Content Paused" : null
    );
    console.warn("Print Screen key detected - Protection activated for 30 seconds");
    
    // Store blur timestamp to persist across refreshes
    sessionStorage.setItem('blurProtectionActive', Date.now().toString());
    sessionStorage.setItem('blurProtectionDuration', printScreenDuration.toString());
    
    return;
  }

  // Handle Windows + Shift + S (Windows Snipping Tool)
  if ((e.metaKey || e.key === "Meta" || e.ctrlKey) && e.shiftKey && e.code === "KeyS") {
    e.preventDefault();
    if (pauseContent) pauseContent();
    applyBlur(
      printScreenDuration,
      showMessage ? "⚠️ Screenshot Tool Detected - Content Paused" : null
    );
    console.warn("Snipping tool detected - Protection activated for 30 seconds");
    
    // Store blur timestamp to persist across refreshes
    sessionStorage.setItem('blurProtectionActive', Date.now().toString());
    sessionStorage.setItem('blurProtectionDuration', printScreenDuration.toString());
    
    return;
  }

  // Check for other suspicious key combinations
  const suspiciousKeys = [
    "F12", // Developer tools
    "F11", // Some screenshot tools
    "Insert", // Can be used for screenshots
  ];

  if (suspiciousKeys.includes(e.code)) {
    e.preventDefault();
    if (pauseContent) pauseContent();
    applyBlur(
      defaultDuration,
      showMessage ? "⚠️ Suspicious Activity Detected" : null
    );
    console.warn(`Suspicious key detected: ${e.code} - Protection activated`);
    return;
  }

  // For all other non-allowed keys (except standard control keys)
  // Don't blur for common navigation/control keys
  const navigationKeys = [
    "Tab", "Enter", "Escape", "Backspace",
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "Home", "End", "PageUp", "PageDown",
    "Shift", "Control", "Alt", "Meta",
    "CapsLock", "NumLock", "ScrollLock"
  ];

  if (!navigationKeys.includes(e.code) && !navigationKeys.includes(e.key)) {
    // Apply shorter blur for regular keys to prevent false positives
    applyBlur(
      10000, // 10 seconds for regular keys
      showMessage ? "⚠️ Content Protected" : null
    );
    console.warn(`Non-allowed key detected: ${e.code} - Protection activated`);
  }
};

/**
 * Setup protection for a component
 * @param {Object} options - Configuration options
 * @returns {Function} Cleanup function
 */
export const setupBlurProtection = (options = {}) => {
  const handleKeyDown = (e) => handleProtectionKeyPress(e, options);

  // Check if blur should be active from previous session (after page refresh)
  const checkPersistentBlur = () => {
    const blurActiveTime = sessionStorage.getItem('blurProtectionActive');
    const blurDuration = sessionStorage.getItem('blurProtectionDuration');
    
    if (blurActiveTime && blurDuration) {
      const elapsed = Date.now() - parseInt(blurActiveTime);
      const duration = parseInt(blurDuration);
      
      if (elapsed < duration) {
        // Blur should still be active
        const remainingTime = duration - elapsed;
        console.warn(`Restoring blur protection - ${remainingTime / 1000} seconds remaining`);
        applyBlur(remainingTime, "⚠️ Protection Active - Screenshot Attempt Detected");
        
        // Pause content if function provided
        if (options.pauseContent) {
          setTimeout(() => options.pauseContent(), 100);
        }
      } else {
        // Blur expired, clean up
        sessionStorage.removeItem('blurProtectionActive');
        sessionStorage.removeItem('blurProtectionDuration');
      }
    }
  };

  // Monitor for visibility change (user switching tabs or windows during screenshot)
  let visibilityChangeCount = 0;
  let lastVisibilityChange = Date.now();
  
  const handleVisibilityChange = () => {
    const now = Date.now();
    
    // If user switches away and back quickly, it might be a screenshot attempt
    if (document.hidden) {
      lastVisibilityChange = now;
    } else {
      const timeDiff = now - lastVisibilityChange;
      
      // Quick tab switching (less than 2 seconds) could indicate screenshot
      if (timeDiff < 2000) {
        visibilityChangeCount++;
        
        if (visibilityChangeCount >= 3) {
          console.warn("Suspicious activity: Rapid tab switching detected");
          applyBlur(
            options.defaultDuration || 15000,
            "⚠️ Suspicious Activity Detected"
          );
          if (options.pauseContent) options.pauseContent();
          visibilityChangeCount = 0;
        }
      } else {
        visibilityChangeCount = 0;
      }
    }
  };

  // Detect focus loss (another common screenshot indicator)
  const handleBlur = () => {
    const blurTime = Date.now();
    
    setTimeout(() => {
      if (document.hasFocus()) {
        const focusLostDuration = Date.now() - blurTime;
        
        // Very brief focus loss can indicate screenshot tools
        if (focusLostDuration < 500) {
          console.warn("Brief focus loss detected - possible screenshot");
        }
      }
    }, 100);
  };

  // Check for persistent blur on initialization
  checkPersistentBlur();

  window.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("keyup", handleKeyDown, true); // Some browsers only catch keyup for PrintScreen
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", handleBlur);

  // Return cleanup function
  return () => {
    window.removeEventListener("keydown", handleKeyDown, true);
    window.removeEventListener("keyup", handleKeyDown, true);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("blur", handleBlur);
    removeBlur();
  };
};

// Additional security measures
export const additionalProtection = () => {
  // Detect context menu (right-click)
  const preventContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  // Detect developer tools opening
  let devtoolsOpen = false;
  const detectDevTools = () => {
    const threshold = 160;
    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        applyBlur(30000, "⚠️ Developer Tools Detected");
      }
    } else {
      devtoolsOpen = false;
    }
  };

  // Monitor clipboard for screenshot detection
  const handleCopy = (e) => {
    // Check if clipboard contains image data (possible screenshot)
    if (e.clipboardData && e.clipboardData.types) {
      const hasImage = e.clipboardData.types.some(type => 
        type.includes('image') || type === 'Files'
      );
      
      if (hasImage) {
        console.warn("Image data detected in clipboard - possible screenshot");
        applyBlur(30000, "⚠️ Screenshot Detected via Clipboard");
        
        // Store in session storage
        sessionStorage.setItem('blurProtectionActive', Date.now().toString());
        sessionStorage.setItem('blurProtectionDuration', '30000');
      }
    }
  };

  // Listen for paste events which might indicate clipboard screenshot
  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.items) {
      for (let item of e.clipboardData.items) {
        if (item.type.indexOf('image') !== -1) {
          console.warn("Image pasted - screenshot may have been taken");
          applyBlur(30000, "⚠️ Screenshot Activity Detected");
          
          // Store in session storage
          sessionStorage.setItem('blurProtectionActive', Date.now().toString());
          sessionStorage.setItem('blurProtectionDuration', '30000');
          break;
        }
      }
    }
  };

  // Monitor for Print Screen via window focus/blur patterns
  let lastFocusTime = Date.now();
  const handleWindowFocus = () => {
    lastFocusTime = Date.now();
  };

  const handleWindowBlur = () => {
    const blurDuration = Date.now() - lastFocusTime;
    
    // Very brief window blur can indicate Print Screen
    if (blurDuration < 1000) {
      console.warn("Brief window blur - possible Print Screen");
    }
  };

  document.addEventListener("contextmenu", preventContextMenu);
  document.addEventListener("copy", handleCopy);
  document.addEventListener("paste", handlePaste);
  window.addEventListener("focus", handleWindowFocus);
  window.addEventListener("blur", handleWindowBlur);
  
  const devToolsInterval = setInterval(detectDevTools, 1000);

  // Cleanup function
  return () => {
    document.removeEventListener("contextmenu", preventContextMenu);
    document.removeEventListener("copy", handleCopy);
    document.removeEventListener("paste", handlePaste);
    window.removeEventListener("focus", handleWindowFocus);
    window.removeEventListener("blur", handleWindowBlur);
    clearInterval(devToolsInterval);
  };
};

export default {
  applyBlur,
  removeBlur,
  handleProtectionKeyPress,
  setupBlurProtection,
  additionalProtection
};
