import toast from 'react-hot-toast';

/**
 * Show success toast
 * @param {string} message - Success message
 */
export const showSuccess = (message) => {
  toast.success(message);
};

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {Error} error - Optional error object for logging
 */
export const showError = (message, error = null) => {
  if (error) {
    console.error('Error:', error);
  }

  // Extract error message from different formats
  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    message ||
    'An unexpected error occurred';

  toast.error(errorMessage);
};

/**
 * Show loading toast
 * @param {string} message - Loading message
 * @returns {string} toastId - ID for dismissing the toast
 */
export const showLoading = (message) => {
  return toast.loading(message);
};

/**
 * Dismiss a toast by ID
 * @param {string} toastId - Toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Show promise toast (auto handles loading, success, error)
 * @param {Promise} promise - Promise to track
 * @param {Object} messages - Messages for each state
 */
export const showPromise = (promise, messages = {}) => {
  return toast.promise(promise, {
    loading: messages.loading || 'Processing...',
    success: messages.success || 'Success!',
    error: messages.error || 'Something went wrong',
  });
};

/**
 * Show info toast
 * @param {string} message - Info message
 */
export const showInfo = (message) => {
  toast(message, {
    icon: 'ℹ️',
  });
};

const toastUtils = {
  success: showSuccess,
  error: showError,
  loading: showLoading,
  dismiss: dismissToast,
  promise: showPromise,
  info: showInfo,
};

export default toastUtils;
