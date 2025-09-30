// Authentication utility functions
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  
  if (!token || !user) {
    return false;
  }
  
  try {
    // Basic JWT validation - check if token is not expired
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp < currentTime) {
      // Token is expired, clear storage
      logout();
      return false;
    }
    
    return true;
  } catch (error) {
    // Invalid token format, clear storage
    logout();
    return false;
  }
};

export const getAuthToken = () => {
  return localStorage.getItem("token");
};

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getUserRole = () => {
  return localStorage.getItem("role") || "user";
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
};

export const setAuthData = (token, user, role) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("role", role);
};