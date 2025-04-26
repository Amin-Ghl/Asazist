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
    
    const response = await fetch(`${API_BASE_URL}/database`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Server responded with status:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched data');
    return data;
  } catch (error: any) {
    console.error('Fetch error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
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
        const response = await fetch(`${url}/database`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Successfully fetched data from alternative URL');
          return data;
        }
      } catch (altError) {
        console.error('Alternative URL failed:', url, altError);
      }
    }
    
    throw new Error('Failed to connect to any server. Please check your network connection and ensure the server is running.');
  }
} 