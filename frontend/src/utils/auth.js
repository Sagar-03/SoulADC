import { setCookie, getCookie, removeCookie } from "./cookies";
import { emitAuthChange } from "./authEvents";


// -------------------
// Auth Utils
// -------------------

export const isAuthenticated = () => {
  const token = getCookie("token");
  const user = getCookie("user");
  if (!token || !user) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    if (payload.exp && payload.exp < currentTime) {
      logout();
      return false;
    }
    return true;
  } catch (err) {
    logout();
    return false;
  }
};

export const getAuthToken = () => getCookie("token");

export const getUser = () => {
  const user = getCookie("user");
  return user ? JSON.parse(user) : null;
};

export const getUserRole = () => getCookie("role") || "user";

export const logout = () => {
  removeCookie("token");
  removeCookie("user");
  removeCookie("role");
  removeCookie("redirectAfterLogin");
  emitAuthChange(); // 🔔 Notify all components
};

export const setAuthData = (token, user, role) => {
  setCookie("token", token);
  setCookie("user", JSON.stringify(user));
  setCookie("role", role);
  emitAuthChange(); // 🔔 Notify all components
};

// -------------------
// Redirect Helpers
// -------------------

export const setRedirectAfterLogin = (url) => {
  setCookie("redirectAfterLogin", url);
};

export const getRedirectAfterLogin = () => {
  return getCookie("redirectAfterLogin");
};

export const clearRedirectAfterLogin = () => {
  removeCookie("redirectAfterLogin");
};
