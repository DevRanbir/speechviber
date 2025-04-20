import { useNavigate } from 'react-router-dom';

export const useErrorHandler = () => {
  const navigate = useNavigate();

  const handleError = (error) => {
    console.error('Error occurred:', error);
    navigate('/error', { replace: true });
  };

  return handleError;
};