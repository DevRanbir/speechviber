# Firebase API Keys Setup Guide

This guide will help you set up your API keys in Firebase Firestore instead of using environment variables.

## Overview

The application now fetches API keys from Firebase Firestore instead of using `.env` files. This provides several benefits:

- **Centralized Configuration**: Manage all API keys from Firebase Console
- **Real-time Updates**: Keys can be updated without redeployment
- **Secure Caching**: Keys are cached locally for performance
- **Fallback Support**: Still works with process.env as backup

## Firebase Firestore Structure

You need to create a collection called `api-keys` in your Firebase Firestore with the following structure:

```
Collection: api-keys
├── Document: REACT_APP_GROQ_API_KEY_1
│   └── Field: value (string) = "your_groq_api_key_1_here"
├── Document: REACT_APP_GROQ_API_KEY_2
│   └── Field: value (string) = "your_groq_api_key_2_here"
├── Document: REACT_APP_GOOGLE_API_KEY
│   └── Field: value (string) = "your_google_api_key_here"
├── Document: REACT_APP_SPEECH_API_KEY
│   └── Field: value (string) = "your_speech_api_key_here"
└── Document: REACT_APP_GROQ_API_URL
    └── Field: value (string) = "https://api.groq.com/openai/v1/chat/completions"
```

## Step-by-Step Setup Instructions

### 1. Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `speechviber`
3. Navigate to **Firestore Database** from the left sidebar

### 2. Create the API Keys Collection

1. Click **"Start collection"** (if this is your first collection) or **"Add collection"**
2. Enter collection ID: `api-keys`
3. Click **"Next"**

### 3. Add API Key Documents

For each API key, create a document:

#### Document 1: REACT_APP_GROQ_API_KEY_1
1. Document ID: `REACT_APP_GROQ_API_KEY_1`
2. Field name: `value`
3. Field type: `string`
4. Field value: Your actual Groq API Key 1
5. Click **"Save"**

#### Document 2: REACT_APP_GROQ_API_KEY_2
1. Document ID: `REACT_APP_GROQ_API_KEY_2`
2. Field name: `value`
3. Field type: `string`
4. Field value: Your actual Groq API Key 2
5. Click **"Save"**

#### Document 3: REACT_APP_GOOGLE_API_KEY
1. Document ID: `REACT_APP_GOOGLE_API_KEY`
2. Field name: `value`
3. Field type: `string`
4. Field value: Your actual Google API Key
5. Click **"Save"**

#### Document 4: REACT_APP_SPEECH_API_KEY
1. Document ID: `REACT_APP_SPEECH_API_KEY`
2. Field name: `value`
3. Field type: `string`
4. Field value: Your actual Speech API Key
5. Click **"Save"**

#### Document 5: REACT_APP_GROQ_API_URL
1. Document ID: `REACT_APP_GROQ_API_URL`
2. Field name: `value`
3. Field type: `string`
4. Field value: `https://api.groq.com/openai/v1/chat/completions`
5. Click **"Save"**

### 4. Set Firestore Security Rules

Make sure your Firestore security rules allow reading the api-keys collection. Here's a basic rule:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read API keys
    match /api-keys/{document} {
      allow read: if request.auth != null;
    }
    
    // Your other rules...
  }
}
```

**Important**: This allows any authenticated user to read API keys. For production, you might want more restrictive rules.

## How It Works

### 1. Service Architecture

- **ApiKeysService**: Fetches and caches keys from Firestore
- **EnvironmentService**: Provides process.env-like interface
- **Utility Functions**: Easy-to-use functions for components

### 2. Caching Strategy

- Keys are cached for 30 minutes
- Real-time updates via Firestore listeners
- Fallback to process.env if Firebase fails
- Memory-only storage (secure)

### 3. Usage in Components

Components can now use:

```javascript
import { getGroqApiKey1, getGroqApiKey2 } from '../../utils/apiKeys';

// Async usage (recommended)
const apiKey = await getGroqApiKey1();

// Sync usage (uses cache)
const apiKey = getGroqApiKey1Synch();
```

## Migration Status

The following components have been updated to use the new system:

- ✅ **AIMentor**: Updated to use new API key service
- ⚠️ **Other components**: Still need to be updated

### To Update Other Components

Replace instances of:
```javascript
const API_KEY = process.env.REACT_APP_GROQ_API_KEY_2;
```

With:
```javascript
import { getGroqApiKey2Synch } from '../../utils/apiKeys';
const getApiKey = () => getGroqApiKey2Synch();
```

Then replace usage:
```javascript
// Old
'Authorization': `Bearer ${API_KEY}`

// New  
'Authorization': `Bearer ${getApiKey()}`
```

## Testing

1. **Clear your .env file** (or rename it temporarily)
2. **Add the keys to Firebase** as described above
3. **Start the application**
4. **Check browser console** for initialization messages
5. **Test a feature** that uses API keys (like AIMentor)

## Troubleshooting

### Common Issues

1. **"API keys not found"**
   - Check Firestore collection name is exactly `api-keys`
   - Verify document IDs match exactly
   - Check Firestore security rules

2. **"Permission denied"**
   - Update Firestore security rules
   - Ensure user is authenticated

3. **Keys not loading**
   - Check browser console for errors
   - Verify Firebase config is correct
   - Check network tab for Firestore requests

### Debug Mode

Add this to see what's happening:

```javascript
// In browser console
localStorage.setItem('DEBUG_API_KEYS', 'true');
```

## Security Considerations

1. **Firestore Rules**: Restrict access appropriately
2. **Key Rotation**: Easy to update keys in Firebase Console
3. **Audit Trail**: Firestore provides access logs
4. **Cache Expiry**: Keys expire from cache after 30 minutes

## Benefits of This Approach

1. **No Redeployment**: Update keys without rebuilding
2. **Real-time Updates**: Changes propagate immediately
3. **Better Security**: No keys in source code or build artifacts
4. **Easy Management**: Single place to manage all keys
5. **Fallback Support**: Still works with .env files as backup

## Next Steps

1. Add API keys to Firebase Firestore using the instructions above
2. Test the AIMentor component to verify it works
3. Gradually update other components to use the new system
4. Remove keys from .env file once everything is working
