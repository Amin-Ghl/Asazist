import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text } from '../../components/Themed';
import { getDatabaseData } from '../../api/database';
import { API_CONFIG } from '../../constants/config';

interface ModelOutput {
  station_id: string;
  timestamp: string;
  food_recommendation: string;
  mouse_probability: number;
}

interface DatabaseData {
  model_outputs: ModelOutput[];
}

export default function StatisticsScreen() {
  const [data, setData] = useState<DatabaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getDatabaseData();
      if (result?.data) {
        setData({ model_outputs: result.data.model_outputs || [] });
      } else {
        throw new Error('No data received from server');
      }
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

      {data?.model_outputs && data.model_outputs.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Model Predictions ({data.model_outputs.length})</Text>
          {data.model_outputs.map((output, index) => (
            <View key={index} style={styles.modelItem}>
              <Text style={styles.itemTitle}>Station: {output.station_id}</Text>
              <Text>Time: {new Date(output.timestamp).toLocaleString()}</Text>
              
              <View style={styles.modelData}>
                <View style={styles.modelColumn}>
                  <Text style={styles.modelLabel}>Food Recommendation:</Text>
                  <Text style={styles.foodRecommendation}>
                    {output.food_recommendation || 'No recommendation'}
                  </Text>
                </View>
                
                <View style={styles.modelColumn}>
                  <Text style={styles.modelLabel}>Mouse Probability:</Text>
                  <Text style={styles.probabilityText}>
                    {((output.mouse_probability ?? 0) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No model predictions available</Text>
          <Text style={styles.emptyStateSubtext}>Try refreshing or check your connection</Text>
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
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  modelItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
  },
  modelData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modelColumn: {
    flex: 1,
  },
  modelLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  foodRecommendation: {
    color: '#34C759',
    fontWeight: 'bold',
  },
  probabilityText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    color: '#666',
    textAlign: 'center',
  },
}); 