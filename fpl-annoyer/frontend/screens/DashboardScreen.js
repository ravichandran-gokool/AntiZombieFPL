/**
 * Dashboard Screen - Displays team information and status
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, FONTS } from "../constants/theme";
import { getPerformanceShame } from "../services/api";

export default function DashboardScreen({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState(null);
  const [shameNotification, setShameNotification] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Get the team ID from storage
      const id = await AsyncStorage.getItem("user_team_id");
      if (!id) {
        throw new Error("No team ID found");
      }
      setTeamId(id);

      // Fetch performance shame notification
      const shame = await getPerformanceShame(id);
      setShameNotification(shame);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      Alert.alert("Error", "Failed to load team data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user_team_id");
    await AsyncStorage.removeItem("user_team_name");
    onLogout();
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bgDark,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ color: COLORS.white, marginTop: 10 }}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FPL MANAGER</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Section 1 */}
      <View style={styles.notificationCard}>
        <Text style={styles.notificationTitle}>🔔 Injuries</Text>
        <Text style={styles.placeholderText}>
          Notifications from teammates about player injuries and roster changes
        </Text>
      </View>

      {/* Notification Section 2 */}
      <View style={styles.notificationCard}>
        <Text style={styles.notificationTitle}>📈 Tokens</Text>
        <Text style={styles.placeholderText}>
          Updates when teammates make transfers or roster changes
        </Text>
      </View>

      {/* Notification Section 3 */}
      <View style={styles.notificationCard}>
        <Text style={styles.notificationTitle}>🏆 Shit players</Text>
        {shameNotification && !shameNotification.error ? (
          <View
            style={[
              styles.notificationContent,
              {
                backgroundColor: shameNotification.shamed
                  ? "rgba(220, 53, 69, 0.1)"
                  : "rgba(40, 167, 69, 0.1)",
              },
            ]}
          >
            <Text style={styles.shameMessage}>{shameNotification.message}</Text>
            <View style={styles.scoreComparison}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Your Score</Text>
                <Text style={styles.scoreValue}>
                  {shameNotification.team_points}
                </Text>
              </View>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Average</Text>
                <Text style={styles.scoreValue}>
                  {shameNotification.average_score}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholderText}>
            Updates when teammates make transfers or roster changes
          </Text>
        )}
      </View>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Text style={styles.refreshButtonText}>Refresh Notifications</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: FONTS.headerSize,
    fontWeight: "bold",
    color: COLORS.accent,
    textTransform: "uppercase",
  },
  logoutButton: {
    color: "#dc3545",
    fontSize: 14,
    fontWeight: "600",
  },
  notificationCard: {
    backgroundColor: COLORS.bgCard,
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    minHeight: 120,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.accent,
    marginBottom: 12,
  },
  placeholderText: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 18,
  },
  notificationContent: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  shameMessage: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: "500",
  },
  scoreComparison: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  scoreBox: {
    alignItems: "center",
    padding: 8,
  },
  scoreLabel: {
    color: COLORS.textSub,
    fontSize: 11,
    marginBottom: 4,
  },
  scoreValue: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: "bold",
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});
