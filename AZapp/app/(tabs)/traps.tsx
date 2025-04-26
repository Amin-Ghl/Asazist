import React from 'react';
import { StyleSheet, ScrollView, View, Modal, TouchableOpacity, TextInput, ActivityIndicator, Pressable, Switch } from 'react-native';
import { Text } from '../../components/Themed';
import UserProfileCard from '../../components/UserProfileCard';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme, Theme } from '../../constants/Theme';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';

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
  last_reading?: SensorReading;
}

interface Group {
  id: number;
  name: string;
  tag: string;
  stations: Station[];
}

export default function TrapsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stationName, setStationName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_CONFIG.DEVICE_URL}/database`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Error in API response');
      }

      // Create a map of station_id to latest reading
      const latestReadings = new Map<number, SensorReading>();
      data.data.sensor_readings.forEach((reading: SensorReading) => {
        const currentLatest = latestReadings.get(reading.station_id);
        if (!currentLatest || new Date(reading.timestamp) > new Date(currentLatest.timestamp)) {
          latestReadings.set(reading.station_id, reading);
        }
      });

      // Transform API data into our group structure
      const transformedGroups: Group[] = [];
      const stationsMap = new Map<number, Station[]>();

      // Group stations by their group_id
      data.data.stations.forEach((station: Station) => {
        // Add the latest reading to the station
        station.last_reading = latestReadings.get(station.station_id);
        
        if (!stationsMap.has(station.group_id)) {
          stationsMap.set(station.group_id, []);
        }
        stationsMap.get(station.group_id)?.push(station);
      });

      // Create groups with their stations
      stationsMap.forEach((stations, groupId) => {
        transformedGroups.push({
          id: groupId,
          name: `Group ${groupId}`,
          tag: groupId.toString(),
          stations: stations.sort((a, b) => a.group_station_number - b.group_station_number)
        });
      });

      setGroups(transformedGroups.sort((a, b) => a.id - b.id));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStationStatus = (station: Station): 'active' | 'triggered' | 'inactive' => {
    if (!station.last_reading) return 'inactive';
    if (station.last_reading.mouse_present === 1) return 'triggered';
    return 'active';
  };

  const getBatteryLevel = (station: Station): number => {
    // This is a placeholder - in a real app, you'd get this from the API
    return Math.floor(Math.random() * 100);
  };

  const getLastChecked = (station: Station): string => {
    if (!station.last_reading) return 'Never';
    const timestamp = new Date(station.last_reading.timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Less than an hour ago';
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const handleGroupPress = (group: Group) => {
    setSelectedGroup(group);
    setIsModalVisible(true);
  };

  const handleGroupNamePress = (group: Group, e: any) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setGroupName(group.name);
    setIsEditingGroup(true);
  };

  const handleSaveGroup = () => {
    if (selectedGroup) {
      const updatedGroups = groups.map(g => 
        g.id === selectedGroup.id 
          ? { ...g, name: groupName }
          : g
      );
      setGroups(updatedGroups);
      setSelectedGroup(updatedGroups.find(g => g.id === selectedGroup.id) || null);
      setIsEditingGroup(false);
    }
  };

  const handleStationPress = (station: Station) => {
    setSelectedStation(station);
    setStationName(station.station_name);
    setIsModalVisible(true);
  };

  const handleSaveStation = () => {
    if (selectedStation && selectedGroup) {
      const updatedGroup = {
        ...selectedGroup,
        stations: selectedGroup.stations.map(s => 
          s.station_id === selectedStation.station_id 
            ? { ...s, station_name: stationName }
            : s
        ),
      };
      setGroups(groups.map(g => 
        g.id === updatedGroup.id 
          ? updatedGroup
          : g
      ));
      setSelectedGroup(updatedGroup);
      setSelectedStation(null);
      setStationName('');
    }
  };

  const StationDetails = ({ station }: { station: Station }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const lastReading = station.last_reading;
    
    return (
      <View style={styles.stationDetailsContainer}>
        <View style={styles.stationHeader}>
          <View style={styles.stationTitleContainer}>
            <Text style={styles.stationTitle}>Station {station.global_station_number}</Text>
            <Text style={styles.stationSubtitle}>Group {station.group_id}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: theme.status[getStationStatus(station)] }
          ]}>
            <Text style={styles.statusText}>{getStationStatus(station).toUpperCase()}</Text>
          </View>
        </View>
        
        {lastReading ? (
          <View style={styles.readingsContainer}>
            <View style={styles.readingsGrid}>
              <View style={styles.readingCard}>
                <Ionicons name="thermometer" size={24} color={theme.primary} />
                <Text style={styles.readingValue}>{lastReading.calibrated_temperature.toFixed(1)}°C</Text>
                <Text style={styles.readingLabel}>Temperature</Text>
              </View>
              <View style={styles.readingCard}>
                <Ionicons name="water" size={24} color={theme.primary} />
                <Text style={styles.readingValue}>{lastReading.calibrated_humidity.toFixed(1)}%</Text>
                <Text style={styles.readingLabel}>Humidity</Text>
              </View>
              <View style={styles.readingCard}>
                <Ionicons name="scale" size={24} color={theme.primary} />
                <Text style={styles.readingValue}>{lastReading.mouse_weight.toFixed(1)}g</Text>
                <Text style={styles.readingLabel}>Weight</Text>
              </View>
            </View>

            <View style={styles.baitSection}>
              <Text style={styles.sectionTitle}>Bait Status</Text>
              <View style={styles.baitContainer}>
                <View style={styles.baitItem}>
                  <Ionicons 
                    name={lastReading.bait1_touched ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={lastReading.bait1_touched ? theme.status.triggered : theme.status.active} 
                  />
                  <Text style={[
                    styles.baitStatus,
                    { color: lastReading.bait1_touched ? theme.status.triggered : theme.status.active }
                  ]}>
                    Bait 1: {lastReading.bait1_touched ? 'Touched' : 'Untouched'}
                  </Text>
                </View>
                <View style={styles.baitItem}>
                  <Ionicons 
                    name={lastReading.bait2_touched ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={lastReading.bait2_touched ? theme.status.triggered : theme.status.active} 
                  />
                  <Text style={[
                    styles.baitStatus,
                    { color: lastReading.bait2_touched ? theme.status.triggered : theme.status.active }
                  ]}>
                    Bait 2: {lastReading.bait2_touched ? 'Touched' : 'Untouched'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.timestampContainer}>
              <Ionicons name="time" size={16} color={theme.secondaryText} />
              <Text style={styles.timestamp}>
                Last updated: {new Date(lastReading.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="alert-circle" size={24} color={theme.secondaryText} />
            <Text style={styles.noDataText}>No sensor data available</Text>
          </View>
        )}
      </View>
    );
  };

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading traps data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.status.triggered }]}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
      <UserProfileCard 
        userName="Reza Saber"
        userEmail="rexa.saber1358@gmail.com"
          activeTraps={groups.reduce((sum, group) => sum + group.stations.length, 0)}
          catches={0}
          efficiency={0}
        />
      </View>
      
      <View style={styles.groupsContainer}>
        <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Groups</Text>
          <Text style={styles.sectionSubtitle}>{groups.length} groups • {groups.reduce((sum, group) => sum + group.stations.length, 0)} stations</Text>
        </View>
        <View style={styles.gridContainer}>
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={styles.groupCard}
            onPress={() => handleGroupPress(group)}
          >
            <View style={styles.groupInfo}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupTitleContainer}>
                <View style={styles.tagContainer}>
                  <Text style={styles.groupTag}>{group.tag}</Text>
                </View>
                <TouchableOpacity 
                      onPress={(e) => handleGroupNamePress(group, e)}
                    >
                      <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                </TouchableOpacity>
              </View>
                </View>
                
                <View style={styles.stationSummary}>
                  <View style={styles.stationCountContainer}>
                    <Ionicons name="location" size={16} color={theme.primary} />
              <Text style={styles.stationCount}>{group.stations.length} stations</Text>
            </View>
                  <View style={styles.statusContainer}>
                    {group.stations.map((station, index) => {
                      if (index >= 3) return null;
                      return (
                        <View 
                          key={station.station_id} 
                          style={[
                            styles.statusDot,
                            { backgroundColor: theme.status[getStationStatus(station)] }
                          ]} 
                        />
                      );
                    })}
                    {group.stations.length > 3 && (
                      <Text style={styles.moreStationsText}>+{group.stations.length - 3}</Text>
                    )}
                  </View>
                </View>
              </View>
          </TouchableOpacity>
        ))}
        </View>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsModalVisible(false);
          setIsEditingGroup(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              {isEditingGroup ? (
                <View style={styles.editGroupContainer}>
                  <View style={styles.tagContainer}>
                    <Text style={styles.groupTag}>{selectedGroup?.tag}</Text>
                  </View>
                  <TextInput
                    style={styles.groupNameInput}
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Enter group name"
                    placeholderTextColor={theme.secondaryText}
                  />
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveGroup}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.groupTitleContainer}>
                    <View style={styles.tagContainer}>
                      <Text style={styles.groupTag}>{selectedGroup?.tag}</Text>
                    </View>
                    <Text style={styles.modalTitle}>{selectedGroup?.name}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {!isEditingGroup && (
              selectedStation ? (
                <View style={styles.stationEditContainer}>
                  <StationDetails station={selectedStation} />
                  <TextInput
                    style={styles.stationNameInput}
                    value={stationName}
                    onChangeText={setStationName}
                    placeholder="Enter station name"
                    placeholderTextColor={theme.secondaryText}
                  />
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveStation}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={styles.stationsContainer}>
                  {selectedGroup?.stations.map((station) => (
                    <TouchableOpacity
                      key={station.station_id}
                      style={styles.stationCard}
                      onPress={() => handleStationPress(station)}
                    >
                      <StationDetails station={station} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.background,
  },
  headerContainer: {
    backgroundColor: 'rgba(0, 100, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#0064FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'column',
    gap: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text,
    textShadowColor: 'rgba(0, 100, 255, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.background,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.border,
  },
  groupsContainer: {
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 100, 255, 0.05)',
    padding: 16,
    shadowColor: '#0064FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 255, 0.1)',
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 100, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.secondaryText,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  groupCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '31%',
    shadowColor: '#0064FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 255, 0.1)',
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    marginBottom: 8,
  },
  groupTitleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  tagContainer: {
    backgroundColor: theme.tagBackground,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  groupTag: {
    backgroundColor: theme.tagBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  groupTagText: {
    color: theme.tagText,
    fontSize: 12,
    fontWeight: '500',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  stationSummary: {
    flexDirection: 'column',
    gap: 8,
  },
  stationCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stationCount: {
    fontSize: 12,
    color: theme.secondaryText,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreStationsText: {
    fontSize: 10,
    color: theme.secondaryText,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  editGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    fontSize: 18,
    color: theme.text,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.background,
  },
  stationsContainer: {
    flex: 1,
    marginTop: 16,
  },
  stationCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  stationEditContainer: {
    padding: 16,
  },
  stationNameInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
    fontSize: 16,
    color: theme.text,
  },
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 10,
    color: theme.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    padding: 20,
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.primary,
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: theme.background,
    fontWeight: 'bold',
  },
  stationDetailsContainer: {
    padding: 16,
    backgroundColor: theme.card,
    borderRadius: 12,
    marginBottom: 8,
    width: '100%',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  stationTitleContainer: {
    flex: 1,
  },
  stationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  stationSubtitle: {
    fontSize: 14,
    color: theme.secondaryText,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '600',
  },
  readingsContainer: {
    marginTop: 8,
  },
  readingsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  readingCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.background,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  readingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginVertical: 4,
  },
  readingLabel: {
    fontSize: 12,
    color: theme.secondaryText,
  },
  baitSection: {
    marginBottom: 16,
  },
  baitContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  baitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  baitStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  timestamp: {
    color: theme.secondaryText,
    fontSize: 12,
  },
  noDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
  noDataText: {
    color: theme.secondaryText,
    fontSize: 14,
    fontStyle: 'italic',
  },
  editModalContent: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
}); 