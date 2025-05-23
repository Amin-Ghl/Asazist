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

const SettingItem = ({ 
  title, 
  description, 
  icon, 
  onPress = () => {}, 
  showSwitch = false, 
  switchValue = false, 
  onSwitchChange = () => {} 
}: SettingItemProps) => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color={theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>{description}</Text>
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
};

export default function SettingsScreen() {
  const { themeMode, setThemeMode, isDarkMode, theme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);

  const handleThemeChange = (value: boolean) => {
    setThemeMode(value ? 'dark' : 'light');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.section, { 
        backgroundColor: 'rgba(0, 100, 255, 0.05)',
        shadowColor: '#0064FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0, 100, 255, 0.1)',
      }]}>
        <Text style={[styles.sectionTitle, { 
          color: theme.text,
          textShadowColor: 'rgba(0, 100, 255, 0.3)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
        }]}>Preferences</Text>
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

      <View style={[styles.section, { 
        backgroundColor: 'rgba(0, 100, 255, 0.05)',
        shadowColor: '#0064FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0, 100, 255, 0.1)',
      }]}>
        <Text style={[styles.sectionTitle, { 
          color: theme.text,
          textShadowColor: 'rgba(0, 100, 255, 0.3)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
        }]}>Account</Text>
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

      <View style={[styles.section, { 
        backgroundColor: 'rgba(0, 100, 255, 0.05)',
        shadowColor: '#0064FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0, 100, 255, 0.1)',
      }]}>
        <Text style={[styles.sectionTitle, { 
          color: theme.text,
          textShadowColor: 'rgba(0, 100, 255, 0.3)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 10,
        }]}>Support</Text>
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
    padding: 20,
  },
  section: {
    marginBottom: 24,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 16,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 100, 255, 0.1)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 100, 255, 0.1)',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
}); 