import { navigate } from 'react-router-dom';

export const handleBuildError = (error) => {
  // Log the error
  console.error('Build error:', error);
  
  // Redirect to error page if in production
  if (process.env.NODE_ENV === 'production') {
    navigate('/error');
  }
};

// sHandle runtime errors that error boundary might miss
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  navigate('/error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  navigate('/error');
});