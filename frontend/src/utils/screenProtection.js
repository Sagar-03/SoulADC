// Screen Protection Utilities - Prevent Screenshots & Screen Recording

class ScreenProtection {
  constructor() {
    this.warningCount = 0;
    this.maxWarnings = 3;
    this.isRecordingDetected = false;
  }

  // Initialize all protection mechanisms
  initialize() {
    this.preventScreenshots();
    this.detectScreenRecording();
    this.preventKeyboardScreenCapture();
    this.preventContextMenu();
    this.detectDevTools();
    this.addWatermark();
    this.preventPrintScreen();
    this.detectMediaRecorder();
  }

  // Prevent right-click context menu
  preventContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showWarning('Right-click is disabled for security purposes');
      return false;
    }, false);
  }

  // Prevent keyboard shortcuts for screenshots
  preventKeyboardScreenCapture() {
    document.addEventListener('keydown', (e) => {
      // Prevent Print Screen
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        navigator.clipboard.writeText('');
        this.showWarning('Screenshots are not allowed on this platform');
        return false;
      }

      // Prevent Windows Snipping Tool (Win + Shift + S)
      if (e.metaKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        this.showWarning('Screen capture is not allowed');
        return false;
      }

      // Prevent Mac screenshots (Cmd + Shift + 3/4/5)
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        this.showWarning('Screenshots are not allowed');
        return false;
      }

      // Prevent Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        this.showWarning('Printing is disabled');
        return false;
      }

      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (DevTools)
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
      ) {
        e.preventDefault();
        this.showWarning('Developer tools are disabled');
        return false;
      }
    }, true);

    // Additional keyboard event blocking
    document.addEventListener('keyup', (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        navigator.clipboard.writeText('');
        e.preventDefault();
        return false;
      }
    }, true);
  }

  // Prevent PrintScreen by clearing clipboard
  preventPrintScreen() {
    // Monitor clipboard changes
    setInterval(() => {
      try {
        navigator.clipboard.writeText('').catch(() => {});
      } catch (e) {
        // Silent fail
      }
    }, 100);
  }

  // Detect screen recording via Screen Capture API
  detectScreenRecording() {
    // Detect getDisplayMedia API usage
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      
      navigator.mediaDevices.getDisplayMedia = async (...args) => {
        this.showCriticalWarning('Screen recording detected! This action is prohibited.');
        this.isRecordingDetected = true;
        
        // Block the recording
        throw new Error('Screen recording is not allowed on this platform');
      };
    }

    // Detect getUserMedia with screen sharing
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        if (constraints?.video?.mandatory?.chromeMediaSource === 'screen') {
          this.showCriticalWarning('Screen recording detected and blocked!');
          throw new Error('Screen recording is not allowed');
        }
        return originalGetUserMedia.call(navigator.mediaDevices, constraints);
      };
    }

    // Check for active media streams periodically
    setInterval(() => {
      this.checkActiveMediaStreams();
    }, 2000);
  }

  // Detect MediaRecorder API usage
  detectMediaRecorder() {
    if (window.MediaRecorder) {
      const OriginalMediaRecorder = window.MediaRecorder;
      
      window.MediaRecorder = function(...args) {
        console.warn('MediaRecorder blocked');
        throw new Error('Recording is not allowed on this platform');
      };
      
      window.MediaRecorder.isTypeSupported = OriginalMediaRecorder.isTypeSupported.bind(OriginalMediaRecorder);
    }
  }

  // Check for active media streams
  checkActiveMediaStreams() {
    // This is a heuristic check - exact detection of external recording tools is not possible
    // But we can detect browser-based recording
    if (document.hidden || document.visibilityState === 'hidden') {
      // User might be using screen recording software
      // We can't detect external tools, but we can make it harder
    }
  }

  // Prevent screenshots via CSS and document properties
  preventScreenshots() {
    // Add CSS to prevent screenshots (browser-level, limited effectiveness)
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      body {
        -webkit-touch-callout: none !important;
      }

      /* Prevent screenshot on some browsers */
      @media print {
        body {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Detect DevTools
  detectDevTools() {
    // Method 1: Console detection
    const element = new Image();
    let devtoolsOpen = false;
    
    Object.defineProperty(element, 'id', {
      get: () => {
        devtoolsOpen = true;
        this.showWarning('Developer tools detected. Please close them.');
        return '';
      }
    });

    setInterval(() => {
      devtoolsOpen = false;
      console.log('%c', element);
      console.clear();
    }, 1000);

    // Method 2: Window size detection
    const threshold = 160;
    setInterval(() => {
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        this.showWarning('Developer tools detected');
      }
    }, 500);

    // Method 3: Debugger trap
    setInterval(() => {
      const start = performance.now();
      // debugger; // Uncomment in production
      const end = performance.now();
      if (end - start > 100) {
        this.showWarning('Developer tools detected');
      }
    }, 1000);
  }

  // Add dynamic watermark with user info
  addWatermark() {
    const watermarkContainer = document.createElement('div');
    watermarkContainer.id = 'screen-protection-watermark';
    watermarkContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999999;
      overflow: hidden;
    `;

    // Create multiple watermarks
    for (let i = 0; i < 50; i++) {
      const watermark = document.createElement('div');
      const timestamp = new Date().toISOString();
      const sessionId = this.generateSessionId();
      
      watermark.textContent = `PROTECTED CONTENT • ${timestamp} • ${sessionId}`;
      watermark.style.cssText = `
        position: absolute;
        color: rgba(169, 140, 106, 0.03);
        font-size: 14px;
        font-weight: bold;
        transform: rotate(-45deg);
        white-space: nowrap;
        user-select: none;
        pointer-events: none;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
      `;
      
      watermarkContainer.appendChild(watermark);
    }

    document.body.appendChild(watermarkContainer);

    // Prevent watermark removal
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach((node) => {
            if (node.id === 'screen-protection-watermark') {
              document.body.appendChild(watermarkContainer);
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: false });
  }

  // Generate unique session ID
  generateSessionId() {
    return 'USER-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  // Show warning message
  showWarning(message) {
    this.warningCount++;
    
    // Create warning toast
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      padding: 20px 30px;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 1000000;
      font-weight: 600;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
      max-width: 350px;
    `;
    warning.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">⚠️</span>
        <div>
          <div style="font-weight: 700; margin-bottom: 5px;">Security Alert</div>
          <div style="font-size: 13px; opacity: 0.95;">${message}</div>
        </div>
      </div>
    `;

    document.body.appendChild(warning);

    setTimeout(() => {
      warning.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => warning.remove(), 300);
    }, 4000);

    // If too many warnings, take action
    if (this.warningCount >= this.maxWarnings) {
      this.showCriticalWarning('Multiple security violations detected. Page will reload.');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }

  // Show critical warning
  showCriticalWarning(message) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10000000;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      flex-direction: column;
      gap: 20px;
    `;
    overlay.innerHTML = `
      <div style="font-size: 80px;">🚨</div>
      <div>${message}</div>
      <div style="font-size: 16px; opacity: 0.8; max-width: 500px;">
        This platform's content is protected. Unauthorized recording or screenshots are strictly prohibited.
      </div>
    `;
    
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
    }, 5000);
  }

  // Visibility change detection
  monitorVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // User switched tab - might be screen recording
        console.log('Tab hidden - potential recording activity');
      }
    });
  }

  // Blur sensitive content on focus loss
  blurOnFocusLoss() {
    window.addEventListener('blur', () => {
      document.body.style.filter = 'blur(20px)';
    });

    window.addEventListener('focus', () => {
      document.body.style.filter = 'none';
    });
  }
}

// Export singleton instance
const screenProtection = new ScreenProtection();
export default screenProtection;
