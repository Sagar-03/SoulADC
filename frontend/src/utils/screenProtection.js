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
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showWarning("Right-click is disabled for security purposes");
      return false;
    });
  }

  // 🔑 Block screenshot-related key combos only, never block inside input fields
  preventKeyboardScreenCapture() {
    const blockKeys = (e) => {
      // Never block keys when user is typing in an input, textarea, or select
      const tag = e.target?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        e.target?.isContentEditable
      ) {
        return;
      }

      // Block Print Screen (44)
      if (e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        this.showWarning("Screenshots are disabled for security purposes");
        return false;
      }

      // Block Windows + Shift + S (Snipping Tool)
      if (e.shiftKey && e.metaKey && e.key === "s") {
        e.preventDefault();
        this.showWarning("Screenshots are disabled for security purposes");
        return false;
      }
    };

    // Listen at multiple levels
    document.addEventListener("keydown", blockKeys, { capture: true });
    window.addEventListener("keydown", blockKeys, { capture: true });
    document.body.addEventListener("keydown", blockKeys, { capture: true });
  }

  // (Keeping rest of your existing methods unchanged...)
  
  preventPrintScreen() { /* same as your code */ }
  detectScreenRecording() { /* same as your code */ }
  detectMediaRecorder() { /* same as your code */ }
  checkActiveMediaStreams() { /* same as your code */ }
  preventScreenshots() { /* same as your code */ }
  detectDevTools() { /* same as your code */ }
  addWatermark() { /* same as your code */ }
  generateSessionId() { /* same as your code */ }
  showWarning(message) { /* same as your code */ }
  showCriticalWarning(message) { /* same as your code */ }
  monitorVisibility() { /* same as your code */ }
  blurOnFocusLoss() { /* same as your code */ }
}

// Export singleton
const screenProtection = new ScreenProtection();
export default screenProtection;
