let activeRequests = 0;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(activeRequests));
};

export const startGlobalLoading = () => {
  activeRequests += 1;
  notify();
};

export const stopGlobalLoading = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  notify();
};

export const subscribeToGlobalLoading = (listener) => {
  listeners.add(listener);
  listener(activeRequests);

  return () => {
    listeners.delete(listener);
  };
};
