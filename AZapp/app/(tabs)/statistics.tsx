import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text } from '../../components/Themed';
import { getDatabaseData } from '../../api/database';
import { API_CONFIG } from '../../constants/config';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
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
    
    // Set up automatic refresh every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
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

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(${isDarkMode ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForLabels: {
      fontSize: 12,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
    },
    decimalPlaces: 1,
    formatYLabel: (value: string) => parseFloat(value).toFixed(1),
    style: {
      borderRadius: 16,
    },
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 20,
  };

  const processTemperatureData = () => {
    if (!data?.sensor_readings || data.sensor_readings.length === 0) return null;
    
    // Get readings from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const lastMonthReadings = data.sensor_readings.filter(reading => 
      new Date(reading.timestamp) >= thirtyDaysAgo
    );

    // Group readings by date and calculate daily averages
    const dailyAverages = lastMonthReadings.reduce((acc, reading) => {
      const date = new Date(reading.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!acc[date]) {
        acc[date] = { sum: 0, count: 0 };
      }
      acc[date].sum += reading.calibrated_temperature;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

    // Convert to array of averages and sort by date
    const averages = Object.entries(dailyAverages)
      .map(([date, { sum, count }]) => ({
        date,
        average: sum / count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Only show every third date to prevent overcrowding
    const filteredAverages = averages.filter((_, index) => index % 3 === 0);
    
    return {
      labels: filteredAverages.map(a => a.date.split('-').slice(1).join('/')), // MM/DD format
      datasets: [{
        data: filteredAverages.map(a => Number(a.average.toFixed(1))),
        color: () => theme.primary,
        strokeWidth: 2
      }],
      legend: ['Average Temperature (°C)']
    };
  };

  const processHumidityData = () => {
    if (!data?.sensor_readings || data.sensor_readings.length === 0) return null;
    
    // Get readings from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const lastMonthReadings = data.sensor_readings.filter(reading => 
      new Date(reading.timestamp) >= thirtyDaysAgo
    );

    // Group readings by date and calculate daily averages
    const dailyAverages = lastMonthReadings.reduce((acc, reading) => {
      const date = new Date(reading.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!acc[date]) {
        acc[date] = { sum: 0, count: 0 };
      }
      acc[date].sum += reading.calibrated_humidity;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

    // Convert to array of averages and sort by date
    const averages = Object.entries(dailyAverages)
      .map(([date, { sum, count }]) => ({
        date,
        average: sum / count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Only show every third date to prevent overcrowding
    const filteredAverages = averages.filter((_, index) => index % 3 === 0);
    
    return {
      labels: filteredAverages.map(a => a.date.split('-').slice(1).join('/')), // MM/DD format
      datasets: [{
        data: filteredAverages.map(a => Number(a.average.toFixed(1))),
        color: () => theme.secondary,
        strokeWidth: 2
      }],
      legend: ['Average Humidity (%)']
    };
  };

  const processMouseActivity = () => {
    if (!data?.sensor_readings || data.sensor_readings.length === 0) return [];
    
    // Since data only comes in when mice touch traps, we can analyze the patterns
    const activityByDay = data.sensor_readings.reduce((acc, reading) => {
      const day = new Date(reading.timestamp).getDay();
      if (!acc[day]) {
        acc[day] = { count: 0 };
      }
      acc[day].count += 1;
      return acc;
    }, {} as Record<number, { count: number }>);

    // Calculate total readings
    const totalReadings = data.sensor_readings.length;
    
    // Define distinct colors for each day
    const dayColors = [
      '#FF6B6B', // Sunday - Red
      '#4ECDC4', // Monday - Teal
      '#45B7D1', // Tuesday - Blue
      '#96CEB4', // Wednesday - Green
      '#FFEEAD', // Thursday - Yellow
      '#D4A5A5', // Friday - Pink
      '#9B59B6', // Saturday - Purple
    ];
    
    // Calculate distribution by day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const distribution = days.map((dayName, dayIndex) => {
      const count = activityByDay[dayIndex]?.count || 0;
      const percentage = (count / totalReadings) * 100;
      return {
        name: `% ${dayName} `,
        population: Number(percentage.toFixed(1)),
        color: dayColors[dayIndex],
        legendFontColor: theme.text,
      };
    });
    
    return distribution;
  };

  const processBaitData = () => {
    if (!data?.sensor_readings || data.sensor_readings.length === 0) return null;
    
    // Calculate bait effectiveness by day of week
    const baitByDay = data.sensor_readings.reduce((acc, reading) => {
      const day = new Date(reading.timestamp).getDay();
      if (!acc[day]) {
        acc[day] = { total: 0, bait1: 0, bait2: 0 };
      }
      acc[day].total += 1;
      if (reading.bait1_touched === 1) acc[day].bait1 += 1;
      if (reading.bait2_touched === 1) acc[day].bait2 += 1;
      return acc;
    }, {} as Record<number, { total: number; bait1: number; bait2: number }>);

    // Calculate overall averages
    const totalReadings = data.sensor_readings.length;
    const bait1Touched = data.sensor_readings.filter(r => r.bait1_touched === 1).length;
    const bait2Touched = data.sensor_readings.filter(r => r.bait2_touched === 1).length;
    
    return {
      labels: ['Bait 1', 'Bait 2'],
      datasets: [{
        data: [
          Number(((bait1Touched / totalReadings) * 100).toFixed(1)),
          Number(((bait2Touched / totalReadings) * 100).toFixed(1)),
        ],
        colors: [
          (opacity = 1) => theme.primary,
          (opacity = 1) => theme.secondary,
        ]
      }]
    };
  };

  const temperatureData = processTemperatureData();
  const humidityData = processHumidityData();
  const mouseActivityData = processMouseActivity();
  const baitData = processBaitData();

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
                    height={280}
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
                    height={280}
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
              <View style={styles.pieChartContainer}>
                {mouseActivityData.length > 0 && (
                  <PieChart
                    data={mouseActivityData}
                    width={width - 56}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                    style={styles.chart}
                  />
                )}
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
                      decimalPlaces: 1,
                      formatYLabel: (value: string) => parseFloat(value).toFixed(1),
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

          {(!data?.sensor_readings || data.sensor_readings.length === 0) && (
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
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 220,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
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