import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Dimensions, useWindowDimensions } from 'react-native';
import { Text } from '../../components/Themed';
import { getDatabaseData } from '../../api/database';
import { API_CONFIG } from '../../constants/config';
import { LineChart, PieChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/Theme';

interface SensorReading {
  id: number;
  station_id: number;
  mouse_weight: number;
  raw_temperature: number;
  raw_humidity: number;
  calibrated_temperature: number;
  calibrated_humidity: number;
  mouse_present: number;
  bait1_touched: number;
  bait2_touched: number;
  timestamp: string;
}

interface Station {
  station_id: number;
  group_id: number;
  global_station_number: number;
  group_station_number: number;
  station_name: string;
}

interface ModelOutput {
  station_id: string;
  timestamp: string;
  food_recommendation: string;
  mouse_probability: number;
}

interface DatabaseData {
  stations: Station[];
  sensor_readings: SensorReading[];
  model_outputs: ModelOutput[];
}

export default function StatisticsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();
  const [data, setData] = useState<DatabaseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getDatabaseData();
      if (result && result.data) {
        setData(result.data);
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const processTemperatureData = () => {
    if (!data?.sensor_readings || data.sensor_readings.length === 0) return null;
    
    const sortedReadings = [...data.sensor_readings]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-12); // Last 12 readings
    
    return {
      labels: sortedReadings.map(r => new Date(r.timestamp).getHours() + ':00'),
      datasets: [{
        data: sortedReadings.map(r => r.calibrated_temperature),
        color: () => theme.primary,
        strokeWidth: 2
      }],
      legend: ['Temperature (°C)']
    };
  };

  const processHumidityData = () => {
    if (!data?.sensor_readings || data.sensor_readings.length === 0) return null;
    
    const sortedReadings = [...data.sensor_readings]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-12); // Last 12 readings
    
    return {
      labels: sortedReadings.map(r => new Date(r.timestamp).getHours() + ':00'),
      datasets: [{
        data: sortedReadings.map(r => r.calibrated_humidity),
        color: () => theme.secondary,
        strokeWidth: 2
      }],
      legend: ['Humidity (%)']
    };
  };

  const processMouseActivity = () => {
    if (!data?.sensor_readings || data.sensor_readings.length === 0) return [];
    
    const total = data.sensor_readings.length;
    const mousePresent = data.sensor_readings.filter(r => r.mouse_present === 1).length;
    
    return [
      {
        name: 'Mouse Detected',
        population: mousePresent,
        color: theme.status.triggered,
        legendFontColor: theme.text,
      },
      {
        name: 'No Activity',
        population: total - mousePresent,
        color: theme.status.active,
        legendFontColor: theme.text,
      }
    ];
  };

  const processBaitData = () => {
    if (!data?.sensor_readings || data.sensor_readings.length === 0) return null;
    
    const bait1Touched = data.sensor_readings.filter(r => r.bait1_touched === 1).length;
    const bait2Touched = data.sensor_readings.filter(r => r.bait2_touched === 1).length;
    const total = data.sensor_readings.length;
    
    return {
      labels: ['Bait 1', 'Bait 2'],
      datasets: [{
        data: [
          (bait1Touched / total) * 100,
          (bait2Touched / total) * 100,
        ],
        colors: [
          (opacity = 1) => theme.primary,
          (opacity = 1) => theme.secondary,
        ]
      }]
    };
  };

  const processStationActivity = () => {
    if (!data?.stations || data.stations.length === 0) return { data: [0] };
    
    const activeStations = data.stations.filter(s => 
      data.sensor_readings?.some(r => 
        r.station_id === s.station_id && 
        new Date(r.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
      )
    ).length;
    
    return {
      data: [activeStations / data.stations.length]
    };
  };

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(${isDarkMode ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForLabels: {
      fontSize: 10,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
    },
    decimalPlaces: 1,
    style: {
      borderRadius: 16,
    },
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 20,
  };

  const temperatureData = processTemperatureData();
  const humidityData = processHumidityData();
  const mouseActivityData = processMouseActivity();
  const baitData = processBaitData();
  const stationActivityData = processStationActivity();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.status.triggered }]}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {data?.sensor_readings && data.sensor_readings.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Temperature Trend</Text>
              <View style={styles.chartContainer}>
                {temperatureData && (
                  <LineChart
                    data={temperatureData}
                    width={width - 56}
                    height={220}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(0, 100, 255, ${opacity})`,
                      fillShadowGradient: theme.primary,
                      fillShadowGradientOpacity: 0.3,
                    }}
                    bezier
                    style={styles.chart}
                    withDots={true}
                    withInnerLines={true}
                    withOuterLines={true}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    segments={5}
                  />
                )}
              </View>
            </View>
          )}

          {data?.sensor_readings && data.sensor_readings.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Humidity Trend</Text>
              <View style={styles.chartContainer}>
                {humidityData && (
                  <LineChart
                    data={humidityData}
                    width={width - 56}
                    height={220}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                      fillShadowGradient: theme.secondary,
                      fillShadowGradientOpacity: 0.3,
                    }}
                    bezier
                    style={styles.chart}
                    withDots={true}
                    withInnerLines={true}
                    withOuterLines={true}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    segments={5}
                  />
                )}
              </View>
            </View>
          )}

          {data?.sensor_readings && data.sensor_readings.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Mouse Activity Distribution</Text>
              <View style={styles.chartContainer}>
                <PieChart
                  data={mouseActivityData}
                  width={width - 56}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                  center={[0, 0]}
                  absolute
                />
              </View>
            </View>
          )}

          {data?.sensor_readings && data.sensor_readings.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Bait Effectiveness (%)</Text>
              <View style={styles.chartContainer}>
                {baitData && (
                  <BarChart
                    data={baitData}
                    width={width - 56}
                    height={220}
                    chartConfig={{
                      ...chartConfig,
                      barPercentage: 0.7,
                      decimalPlaces: 0,
                      fillShadowGradient: theme.primary,
                      fillShadowGradientOpacity: 0.3,
                      propsForLabels: {
                        fontSize: 12,
                        fontWeight: '500',
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                      },
                    }}
                    style={styles.chart}
                    yAxisSuffix="%"
                    yAxisLabel=""
                    fromZero
                    withInnerLines={false}
                    showBarTops={false}
                    withCustomBarColorFromData={true}
                    flatColor={true}
                    segments={5}
                    showValuesOnTopOfBars={true}
                  />
                )}
              </View>
            </View>
          )}

          {data?.stations && data.stations.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Station Activity (24h)</Text>
              <View style={styles.chartContainer}>
                <ProgressChart
                  data={stationActivityData}
                  width={width - 56}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  hideLegend={false}
                />
              </View>
            </View>
          )}

          {data?.model_outputs && data.model_outputs.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Latest Model Predictions</Text>
              {data.model_outputs.slice(0, 5).map((output, index) => (
                <View key={index} style={styles.predictionItem}>
                  <Text style={[styles.stationText, { color: theme.text }]}>
                    Station {output.station_id}
                  </Text>
                  <Text style={[styles.recommendationText, { color: theme.primary }]}>
                    {output.food_recommendation || 'No recommendation'}
                  </Text>
                  <Text style={[styles.probabilityText, { color: theme.secondary }]}>
                    {(output.mouse_probability * 100).toFixed(1)}% probability
                  </Text>
                  <Text style={[styles.timestampText, { color: theme.secondaryText }]}>
                    {new Date(output.timestamp).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {(!data?.sensor_readings || data.sensor_readings.length === 0) && (!data?.model_outputs || data.model_outputs.length === 0) && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
                No data available. Pull to refresh or check your connection.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0064FF',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  predictionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  stationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationText: {
    fontSize: 14,
    marginTop: 4,
  },
  probabilityText: {
    fontSize: 14,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 