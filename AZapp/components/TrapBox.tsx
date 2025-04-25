import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/Colors";

interface Trap {
  name: string;
  status: 'active' | 'triggered' | 'inactive';
  lastChecked: string;
  batteryLevel: number;
}

interface TrapBoxProps {
  trap: Trap;
  onDelete: () => void;
}

export default function TrapBox({ trap, onDelete }: TrapBoxProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50"; // Green
      case "triggered":
        return "#F44336"; // Red
      case "inactive":
        return "#9E9E9E"; // Gray
      default:
        return COLORS.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return "checkmark-circle";
      case "triggered":
        return "alert-circle";
      case "inactive":
        return "power";
      default:
        return "help-circle";
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level > 75) return "battery-full";
    if (level > 50) return "battery-half";
    if (level > 20) return "battery-low";
    return "battery-dead";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusIndicator}>
          <Ionicons name={getStatusIcon(trap.status)} size={16} color={getStatusColor(trap.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(trap.status) }]}>
            {trap.status.charAt(0).toUpperCase() + trap.status.slice(1)}
          </Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <Text style={styles.trapName}>{trap.name}</Text>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.infoText}>{trap.lastChecked}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name={getBatteryIcon(trap.batteryLevel)} size={16} color={COLORS.secondary} />
          <Text style={styles.infoText}>{trap.batteryLevel}%</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.detailsButton}>
        <Text style={styles.detailsText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  deleteButton: {
    padding: 4,
  },
  trapName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  infoContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginLeft: 4,
  },
  detailsButton: {
    backgroundColor: COLORS.background,
    borderRadius: 5,
    padding: 8,
    alignItems: "center",
  },
  detailsText: {
    color: COLORS.primary,
    fontWeight: "500",
  },
}); 