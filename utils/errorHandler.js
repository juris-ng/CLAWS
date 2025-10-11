import { Alert } from 'react-native';

export const ErrorHandler = {
  // Handle and log errors
  handle: (error, context = 'Unknown') => {
    console.error(`[${context}] Error:`, error);
    
    // Log to error tracking service (e.g., Sentry)
    // Sentry.captureException(error);
    
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      context,
    };
  },

  // Show user-friendly error message
  showError: (error, title = 'Error') => {
    const message = typeof error === 'string' 
      ? error 
      : error?.message || 'An unexpected error occurred';
    
    Alert.alert(title, message, [{ text: 'OK' }]);
  },

  // Handle network errors specifically
  handleNetworkError: (error) => {
    if (!error.message) {
      Alert.alert(
        'Network Error',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } else {
      ErrorHandler.showError(error, 'Network Error');
    }
  },

  // Handle database errors
  handleDatabaseError: (error, operation = 'database operation') => {
    console.error(`Database error during ${operation}:`, error);
    
    let message = 'Unable to complete the operation. Please try again.';
    
    if (error.code === '23505') {
      message = 'This record already exists.';
    } else if (error.code === '23503') {
      message = 'Cannot complete operation due to existing dependencies.';
    } else if (error.code === '42P01') {
      message = 'Database configuration error. Please contact support.';
    }
    
    Alert.alert('Database Error', message, [{ text: 'OK' }]);
  },

  // Wrap async functions with error handling
  wrapAsync: (fn, context) => {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return ErrorHandler.handle(error, context);
      }
    };
  },
};
