import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useErrorBoundary = () => {
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error) => {
      console.error('Caught runtime error:', error);
      setHasError(true);
      navigate('/error', { replace: true });
    };

    // Handle runtime errors
    window.addEventListener('error', handleError);
    // Handle promise rejections
    window.addEventListener('unhandledrejection', handleError);
    // Handle network errors
    window.addEventListener('offline', () => handleError(new Error('Network connection lost')));

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
      window.removeEventListener('offline', handleError);
    };
  }, [navigate]);

  return hasError;
};