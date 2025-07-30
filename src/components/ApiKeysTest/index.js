import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress, Card, CardContent } from '@mui/material';
import { initializeEnvironment } from '../../services/environmentService';
import { API_KEY_NAMES } from '../../services/apiKeysService';
import apiKeysService from '../../services/apiKeysService';

/**
 * API Keys Test Component
 * 
 * This component helps test and verify that API keys are properly loaded from Firebase.
 * Use this component during setup to ensure everything is working correctly.
 */
const ApiKeysTest = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);

  const testApiKeys = async () => {
    setLoading(true);
    setError(null);
    setResults({});

    try {
      // Initialize environment service
      await initializeEnvironment();
      
      const testResults = {};
      
      // Test each API key
      for (const [keyName, keyId] of Object.entries(API_KEY_NAMES)) {
        try {
          const value = await apiKeysService.getApiKey(keyId);
          testResults[keyId] = {
            status: value ? 'success' : 'empty',
            value: value ? `${value.substring(0, 10)}...` : 'No value found',
            error: null
          };
        } catch (err) {
          testResults[keyId] = {
            status: 'error',
            value: null,
            error: err.message
          };
        }
      }
      
      setResults(testResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'empty': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success': return '✅ Loaded';
      case 'empty': return '⚠️ Empty';
      case 'error': return '❌ Error';
      default: return '🔄 Testing';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        🔑 API Keys Test
      </Typography>
      
      <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
        This tool helps verify that your API keys are properly configured in Firebase Firestore.
      </Typography>

      <Button 
        variant="contained" 
        onClick={testApiKeys} 
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
        {loading ? 'Testing...' : 'Test API Keys'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Error initializing environment service:</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {Object.keys(results).length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Test Results:
          </Typography>
          
          {Object.entries(results).map(([keyId, result]) => (
            <Card key={keyId} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" component="div">
                    {keyId}
                  </Typography>
                  <Alert 
                    severity={getStatusColor(result.status)} 
                    sx={{ py: 0, px: 2 }}
                  >
                    {getStatusText(result.status)}
                  </Alert>
                </Box>
                
                {result.value && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Value: {result.value}
                  </Typography>
                )}
                
                {result.error && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Error: {result.error}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Setup Instructions:
            </Typography>
            <Typography variant="body2" paragraph>
              1. Go to Firebase Console → Firestore Database
            </Typography>
            <Typography variant="body2" paragraph>
              2. Create a collection called "api-keys"
            </Typography>
            <Typography variant="body2" paragraph>
              3. For each API key above, create a document with the key name as document ID
            </Typography>
            <Typography variant="body2" paragraph>
              4. Add a field "value" with your actual API key
            </Typography>
            <Typography variant="body2">
              5. Make sure your Firestore security rules allow authenticated users to read the api-keys collection
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ApiKeysTest;
