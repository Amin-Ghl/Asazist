import { StyleSheet, Text, View, TouchableOpacity, Image, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/Colors";

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
  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Image 
          source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }} 
          style={styles.profileImage} 
        />
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeTraps}</Text>
          <Text style={styles.statLabel}>Active Traps</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{catches}</Text>
          <Text style={styles.statLabel}>Catches</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{efficiency}%</Text>
          <Text style={styles.statLabel}>Efficiency</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.viewProfileButton}
        onPress={() => Linking.openURL('https://asazist.com/login-register')}
      >
        <Text style={styles.viewProfileText}>View Profile</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
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
    borderColor: COLORS.primary,
  },
  profileInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.lightGray,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
  },
  viewProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  viewProfileText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
    marginRight: 4,
  },
}); 