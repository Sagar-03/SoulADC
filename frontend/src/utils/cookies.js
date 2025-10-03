// -------------------
// Cookie Helpers
// -------------------

// Set cookie (session only unless days provided)
export const setCookie = (name, value, days) => {
  let cookieStr = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Strict; Secure`;
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    cookieStr += `; expires=${date.toUTCString()}`;
  }
  document.cookie = cookieStr;
};

export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
};

export const removeCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure`;
};
