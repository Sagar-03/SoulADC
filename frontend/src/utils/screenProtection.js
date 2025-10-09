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

  // 🔑 Allow only A–Z, 0–9, and Enter key
  preventKeyboardScreenCapture() {
    const allowKeys = new Set();

    // Numbers (0-9)
    for (let i = 48; i <= 57; i++) allowKeys.add(i);
    // Alphabets (A-Z)
    for (let i = 65; i <= 90; i++) allowKeys.add(i);
    // Enter
    allowKeys.add(13);

    const blockKeys = (e) => {
      if (!allowKeys.has(e.keyCode)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.showWarning(`Key "${e.key}" is disabled`);
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
