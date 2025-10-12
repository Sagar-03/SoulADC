// utils/authEvents.js

const listeners = new Set();

export const onAuthChange = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const emitAuthChange = () => {
  for (const callback of listeners) {
    callback();
  }
};
