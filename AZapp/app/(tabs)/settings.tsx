import { StyleSheet, ScrollView, View, Switch } from 'react-native';
import { Text } from '../../components/Themed';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../../constants/Theme';

interface SettingItemProps {
  title: string;
  description: string;
  icon: string;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const { themeMode, setThemeMode, isDarkMode, theme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);

  const handleThemeChange = (value: boolean) => {
    setThemeMode(value ? 'dark' : 'light');
  };

  const SettingItem = ({ 
    title, 
    description, 
    icon, 
    onPress = () => {}, 
    showSwitch = false, 
    switchValue = false, 
    onSwitchChange = () => {} 
  }: SettingItemProps) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color={theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: theme.border, true: theme.primary }}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
      )}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Preferences</Text>
        <SettingItem
          title="Notifications"
          description="Receive alerts about trap activity"
          icon="notifications-outline"
          showSwitch
          switchValue={notifications}
          onSwitchChange={setNotifications}
        />
        <SettingItem
          title="Dark Mode"
          description="Switch between light and dark theme"
          icon="moon-outline"
          showSwitch
          switchValue={themeMode === 'dark'}
          onSwitchChange={handleThemeChange}
        />
        <SettingItem
          title="Location Services"
          description="Allow app to access your location"
          icon="location-outline"
          showSwitch
          switchValue={locationServices}
          onSwitchChange={setLocationServices}
        />
      </View>

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Account</Text>
        <SettingItem
          title="Profile"
          description="Manage your account information"
          icon="person-outline"
          onPress={() => {}}
        />
        <SettingItem
          title="Privacy"
          description="Control your privacy settings"
          icon="shield-outline"
          onPress={() => {}}
        />
      </View>

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Support</Text>
        <SettingItem
          title="Help Center"
          description="Get help with the app"
          icon="help-circle-outline"
          onPress={() => {}}
        />
        <SettingItem
          title="About"
          description="App version and information"
          icon="information-circle-outline"
          onPress={() => {}}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
}); 