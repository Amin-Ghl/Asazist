import { StyleSheet, Text, View, TouchableOpacity, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

interface UserProfileCardProps {
  userName?: string;
  userEmail?: string;
  activeTraps?: number;
  catches?: number;
  efficiency?: number;
}

export default function UserProfileCard({
  userName = "John Doe",
  userEmail = "john.doe@example.com",
  activeTraps = 3,
  catches = 12,
  efficiency = 85
}: UserProfileCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.card, shadowColor: theme.shadowColor }]}>
      <View style={styles.profileSection}>
        <Image 
          source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }} 
          style={[styles.profileImage, { borderColor: theme.primary }]} 
        />
        <View style={styles.profileInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
          <Text style={[styles.userEmail, { color: theme.secondaryText }]}>{userEmail}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{activeTraps}</Text>
          <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Active Traps</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{catches}</Text>
          <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Catches</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{efficiency}%</Text>
          <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Efficiency</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.viewProfileButton}
        onPress={() => Linking.openURL('https://asazist.com/login-register')}
      >
        <Text style={[styles.viewProfileText, { color: theme.primary }]}>View Profile</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
  },
  profileInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
  },
  viewProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
}); 