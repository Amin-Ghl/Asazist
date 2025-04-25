import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text } from '../../components/Themed';
import { getDatabaseData } from '../../api/database';
import { API_CONFIG } from '../../constants/config';

export default function StatisticsScreen() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getDatabaseData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const populateTestData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_CONFIG.DEVICE_URL}/populate-test-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Test data populated:', result);
      
      // Refresh the data after populating
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to populate test data');
      console.error('Error populating test data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorText}>Server URLs:</Text>
        <Text style={styles.errorText}>- Android Emulator: {API_CONFIG.ANDROID_URL}</Text>
        <Text style={styles.errorText}>- iOS Simulator: {API_CONFIG.IOS_URL}</Text>
        <Text style={styles.errorText}>- Physical Device: {API_CONFIG.DEVICE_URL}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.populateButton]} onPress={populateTestData}>
          <Text style={styles.buttonText}>Populate Test Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.reloadButton]} onPress={fetchData}>
          <Text style={styles.buttonText}>Reload Data</Text>
        </TouchableOpacity>
      </View>

      {data?.stations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stations</Text>
          {data.stations.map((station: any) => (
            <View key={station.station_id} style={styles.stationItem}>
              <Text>ID: {station.station_id}</Text>
              <Text>Group: {station.group_id}</Text>
              <Text>Global Number: {station.global_number}</Text>
            </View>
          ))}
        </View>
      )}

      {data?.sensor_readings && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sensor Readings</Text>
          {data.sensor_readings.map((reading: any, index: number) => (
            <View key={index} style={styles.readingItem}>
              <Text>Station: {reading.station_id}</Text>
              <Text>Timestamp: {new Date(reading.timestamp).toLocaleString()}</Text>
              <Text>Mouse Weight: {reading.mouse_weight} g</Text>
              <Text>Temperature: {reading.temperature}°C</Text>
              <Text>Humidity: {reading.humidity}%</Text>
              <Text>Mouse Present: {reading.mouse_present ? 'Yes' : 'No'}</Text>
              <Text>Bait 1 Touched: {reading.bait1_touched ? 'Yes' : 'No'}</Text>
              <Text>Bait 2 Touched: {reading.bait2_touched ? 'Yes' : 'No'}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  populateButton: {
    backgroundColor: '#34C759',
  },
  reloadButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stationItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  readingItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    textAlign: 'center',
  },
}); 