// Browser detection utility
// Use isChrome() to check if the user is on Chrome
// Use getBrowserName() for display/logging purposes

export function isChrome() {
  const ua = navigator.userAgent.toLowerCase();
  const hasChrome = ua.includes("chrome");
  const isEdge = ua.includes("edg");
  const isOpera = ua.includes("opr") || ua.includes("opera");
  // Chrome is chrome but NOT Edge or Opera (both include "chrome" in UA)
  return hasChrome && !isEdge && !isOpera;
}

export function getBrowserName() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("edg")) return "Edge";
  if (ua.includes("opr") || ua.includes("opera")) return "Opera";
  if (ua.includes("chrome")) return "Chrome";
  if (ua.includes("safari")) return "Safari";
  if (ua.includes("firefox")) return "Firefox";
  return "Unknown";
}
