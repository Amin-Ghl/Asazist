import { StyleSheet, ScrollView, View, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Text } from '../../components/Themed';
import UserProfileCard from '../../components/UserProfileCard';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme, Theme } from '../../constants/Theme';
import { useTheme } from '../../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Station {
  id: string;
  name: string;
  status: 'active' | 'triggered' | 'inactive';
  lastChecked: string;
  batteryLevel: number;
}

interface Group {
  id: string;
  name: string;
  tag: string;
  stations: Station[];
}

export default function TrapsScreen() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stationName, setStationName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isEditingGroup, setIsEditingGroup] = useState(false);

  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'Group 1',
      tag: '#1',
      stations: [
        { id: '1-1', name: 'Station 1', status: 'active', lastChecked: '2 hours ago', batteryLevel: 85 },
        { id: '1-2', name: 'Station 2', status: 'triggered', lastChecked: '1 hour ago', batteryLevel: 45 },
        { id: '1-3', name: 'Station 3', status: 'inactive', lastChecked: '5 hours ago', batteryLevel: 15 },
      ],
    },
    {
      id: '2',
      name: 'Group 2',
      tag: '#2',
      stations: [
        { id: '2-1', name: 'Station 4', status: 'active', lastChecked: '3 hours ago', batteryLevel: 90 },
        { id: '2-2', name: 'Station 5', status: 'triggered', lastChecked: '30 mins ago', batteryLevel: 60 },
        { id: '2-3', name: 'Station 6', status: 'inactive', lastChecked: '1 day ago', batteryLevel: 20 },
      ],
    },
    {
      id: '3',
      name: 'Group 3',
      tag: '#3',
      stations: [
        { id: '3-1', name: 'Station 7', status: 'active', lastChecked: '4 hours ago', batteryLevel: 75 },
        { id: '3-2', name: 'Station 8', status: 'triggered', lastChecked: '2 hours ago', batteryLevel: 30 },
        { id: '3-3', name: 'Station 9', status: 'inactive', lastChecked: '3 days ago', batteryLevel: 10 },
      ],
    },
  ]);

  const handleGroupPress = (group: Group) => {
    setSelectedGroup(group);
    setIsModalVisible(true);
  };

  const handleGroupEdit = (group: Group) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setIsEditingGroup(true);
  };

  const handleSaveGroup = () => {
    if (selectedGroup) {
      const updatedGroups = groups.map(group => 
        group.id === selectedGroup.id 
          ? { ...group, name: groupName }
          : group
      );
      setGroups(updatedGroups);
      setSelectedGroup(updatedGroups.find(g => g.id === selectedGroup.id) || null);
      setIsEditingGroup(false);
    }
  };

  const handleStationPress = (station: Station) => {
    setSelectedStation(station);
    setStationName(station.name);
  };

  const handleSaveStation = () => {
    if (selectedStation && selectedGroup) {
      const updatedGroup = {
        ...selectedGroup,
        stations: selectedGroup.stations.map(station => 
          station.id === selectedStation.id 
            ? { ...station, name: stationName }
            : station
        ),
      };
      setSelectedGroup(updatedGroup);
      setSelectedStation(null);
      setStationName('');
    }
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <UserProfileCard 
        userName="Reza Saber"
        userEmail="rexa.saber1358@gmail.com"
        activeTraps={9}
        catches={12}
        efficiency={85}
      />
      
      <View style={styles.groupsContainer}>
        <Text style={styles.sectionTitle}>Groups</Text>
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={styles.groupCard}
            onPress={() => handleGroupPress(group)}
          >
            <View style={styles.groupInfo}>
              <View style={styles.groupNameContainer}>
                <View style={styles.tagContainer}>
                  <Text style={styles.groupTag}>{group.tag}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.nameContainer}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleGroupEdit(group);
                  }}
                >
                  <Text style={styles.groupName}>{group.name}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.stationCount}>{group.stations.length} stations</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.primary} />
          </TouchableOpacity>
        ))}
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
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {!isEditingGroup && (
              selectedStation ? (
                <View style={styles.stationEditContainer}>
                  <Text style={styles.stationId}>Station ID: {selectedStation.id}</Text>
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
                <View style={styles.stationsContainer}>
                  {selectedGroup?.stations.map((station) => (
                    <TouchableOpacity
                      key={station.id}
                      style={styles.stationCard}
                      onPress={() => handleStationPress(station)}
                    >
                      <View style={styles.stationInfo}>
                        <View style={styles.stationNameContainer}>
                          <Text style={styles.stationName}>{station.name}</Text>
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => handleStationPress(station)}
                          >
                            <Ionicons name="pencil" size={16} color={theme.primary} />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.stationId}>ID: {station.id}</Text>
                      </View>
                      <View style={styles.stationStatus}>
                        <Text style={[
                          styles.statusText,
                          { color: theme.status[station.status] }
                        ]}>
                          {station.status}
                        </Text>
                        <Text style={styles.batteryText}>{station.batteryLevel}%</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
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
  groupsContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 20,
  },
  groupCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  groupInfo: {
    flex: 1,
  },
  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
  },
  tagContainer: {
    backgroundColor: theme.tagBackground,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 12,
    minWidth: 36,
    alignItems: 'center',
  },
  groupTag: {
    color: theme.tagText,
    fontSize: 14,
    fontWeight: '600',
  },
  groupName: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.text,
  },
  stationCount: {
    fontSize: 14,
    color: theme.secondaryText,
    marginTop: 4,
  },
  editButton: {
    marginLeft: 8,
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.cardBackground,
    borderRadius: 20,
    padding: 24,
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
  groupTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  stationsContainer: {
    maxHeight: '80%',
  },
  stationCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  stationInfo: {
    flex: 1,
  },
  stationNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  stationId: {
    fontSize: 12,
    color: theme.secondaryText,
  },
  stationStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  batteryText: {
    fontSize: 12,
    color: theme.secondaryText,
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
}); 