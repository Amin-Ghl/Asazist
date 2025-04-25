import { Platform } from 'react-native';
import { API_CONFIG } from '../constants/config';

// Select the appropriate API URL based on platform
const API_BASE_URL = Platform.select({
  android: API_CONFIG.ANDROID_URL,
  ios: API_CONFIG.IOS_URL,
  default: API_CONFIG.DEVICE_URL,
});

export async function getDatabaseData() {
  try {
    console.log('Attempting to fetch data from:', API_BASE_URL);
    
    // First try a simple connection test
    try {
      const testResponse = await fetch(`${API_BASE_URL}/database`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!testResponse.ok) {
        console.error('Server responded with status:', testResponse.status);
        const errorText = await testResponse.text();
        console.error('Error response:', errorText);
        throw new Error(`Server error: ${testResponse.status} - ${errorText}`);
      }
      
      const data = await testResponse.json();
      console.log('Successfully fetched data');
      return data;
    } catch (fetchError: any) {
      console.error('Fetch error details:', {
        message: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack,
      });
      
      // Try alternative URLs if the primary one fails
      const alternativeUrls = [
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        API_CONFIG.DEVICE_URL
      ];
      
      for (const url of alternativeUrls) {
        if (url === API_BASE_URL) continue;
        
        try {
          console.log('Trying alternative URL:', url);
          const response = await fetch(`${url}/database`);
          if (response.ok) {
            const data = await response.json();
            console.log('Success with alternative URL:', url);
            return data;
          }
        } catch (altError) {
          console.log('Failed with alternative URL:', url);
        }
      }
      
      throw new Error(`Could not connect to server. Tried: ${API_BASE_URL} and alternatives`);
    }
  } catch (error: any) {
    console.error('Final error:', error);
    throw new Error(`Failed to connect to server: ${error.message || 'Unknown error'}`);
  }
} 