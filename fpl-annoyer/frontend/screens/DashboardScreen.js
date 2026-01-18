/**
 * Dashboard Screen - Displays team information and status
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Vibration,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, FONTS } from "../constants/theme";
import {
  getPerformanceShame,
  getTripleCaptainAdvice,
  getInjuryWatchdog,
} from "../services/api";
import * as Haptics from "expo-haptics";

import * as Notifications from "expo-notifications";

const INJURY_NOTIF_ID_KEY = "injury_hourly_notif_id";
const SHAME_WEEKLY_NOTIF_ID_KEY = "shame_weekly_notif_id";
const TC_WEEKLY_NOTIF_ID_KEY = "tc_weekly_notif_id";

const WEEK_SECONDS = 7 * 24 * 60 * 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function DashboardScreen({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState(null);
  const [shameNotification, setShameNotification] = useState(null);
  const [tripleCaptainAdvice, setTripleCaptainAdvice] = useState(null);
  const [injuryData, setInjuryData] = useState(null);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  // Really annoying vibration pattern: long vibrate, short pause, repeat multiple times
  const triggerAnnoyingVibration = () => {
    console.log("🔔 Triggering annoying vibration pattern...");

    // Pattern: 0ms delay, then 400ms vibrate, 200ms pause, 400ms vibrate, etc.
    // This creates 5 strong vibrations with short pauses - very annoying!
    const annoyingPattern = [0, 400, 200, 400, 200, 400, 200, 400, 200, 400];

    if (Platform.OS === "android") {
      // Android: pattern format works well
      Vibration.vibrate(annoyingPattern, false);
    } else {
      // iOS: Use expo-haptics for better haptic feedback
      // Create a REALLY annoying pattern with mixed haptic types and longer delays
      const triggerSequentialHaptics = async () => {
        try {
          // Use NotificationFeedbackStyle.Error for maximum intensity
          // Then mix with Heavy impacts for variety - this creates a very noticeable pattern

          // Start with a strong notification error haptic
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Heavy impact
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Another notification error
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Heavy impact
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Final strong notification error
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );

          console.log("✅ Haptic pattern completed");
        } catch (error) {
          // Fallback to basic vibration if haptics fails
          console.log("❌ Haptics error:", error);
          // Try fallback with basic vibration pattern
          Vibration.vibrate([0, 500, 300, 500, 300, 500]);
        }
      };

      triggerSequentialHaptics();
    }
  };

  useEffect(() => {
    (async () => {
      await ensureAndroidChannel(); // ✅ add this
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission is not granted");
      }
    })();

    // Set up notification listener for when notifications are received
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📬 Notification received:", notification);
        // Trigger annoying vibration when notification is received
        triggerAnnoyingVibration();
      });

    // Also listen for when notifications are tapped/responded to
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification tapped:", response);
        // Trigger haptics when user taps notification too
        triggerAnnoyingVibration();
      });

    loadDashboardData();

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // const triggerNotification = async () => {
  //   const {status} = await Notifications.getPermissionsAsync();
  //   if(status !== 'granted'){
  //     Alert.alert("Permission denied");
  //     return;
  //   }

  // await Notifications.scheduleNotificationAsync({
  //   content: {
  //     title: "Hello",
  //     body: "Notification triggered from button press",
  //   },
  //   trigger: null,
  // });
  // };

  const ensureAndroidChannel = async () => {
    if (Platform.OS !== "android") return;

    // Really annoying vibration pattern: long vibrate, short pause, repeat multiple times
    const annoyingPattern = [0, 400, 200, 400, 200, 400, 200, 400, 200, 400];

    await Notifications.setNotificationChannelAsync("injury-alerts", {
      name: "Injury Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: annoyingPattern,
      enableVibrate: true,
    });
  };

  const cancelInjuryReminder = async () => {
    const existingId = await AsyncStorage.getItem(INJURY_NOTIF_ID_KEY);
    if (!existingId) return;

    try {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    } catch (e) {
      console.log("Failed to cancel scheduled injury notification:", e);
    } finally {
      await AsyncStorage.removeItem(INJURY_NOTIF_ID_KEY);
    }
  };

  const scheduleHourlyInjuryReminder = async (teamId, injuries) => {
    // Only schedule if the API response is ok and there's an alert
    if (!injuries?.ok || !injuries.alert || !injuries.flagged_players?.length) {
      await cancelInjuryReminder();
      return;
    }

    // Avoid duplicates: cancel previous, then schedule fresh (keeps message current)
    await cancelInjuryReminder();

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    const topNames = injuries.flagged_players
      .slice(0, 3)
      .map((p) => p.name)
      .join(", ");
    const extraCount = Math.max(0, injuries.flagged_players.length - 3);
    const moreText = extraCount > 0 ? ` +${extraCount} more` : "";

    const body =
      `${injuries.unavailable_count} player(s) injured in your XI! (GW ${injuries.gameweek}): ` +
      `${topNames}${moreText}. I WON'T STOP TILL YOU FIX YOUR TEAM!!!`;

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🤬 FIX YOUR FPL TEAM!!!",
        body,
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: "injury-alerts" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60,
        repeats: true,
      },
    });

    await AsyncStorage.setItem(INJURY_NOTIF_ID_KEY, notifId);
  };

  const cancelWeeklyNotif = async (storageKey) => {
    const existingId = await AsyncStorage.getItem(storageKey);
    if (!existingId) return;

    try {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    } catch (e) {
      console.log("Failed to cancel scheduled notification:", e);
    } finally {
      await AsyncStorage.removeItem(storageKey);
    }
  };

  const scheduleWeeklyShameReminder = async (teamId, shame) => {
    // Only remind weekly if you're currently "shamed"
    if (!shame || shame.error || !shame.shamed) {
      await cancelWeeklyNotif(SHAME_WEEKLY_NOTIF_ID_KEY);
      return;
    }

    await cancelWeeklyNotif(SHAME_WEEKLY_NOTIF_ID_KEY);

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📉 Performance Shame (Weekly)",
        body:
          shame.message || "You're below average. Consider fixing your team!",
        sound: "default",
        data: { type: "shame", teamId },
        ...(Platform.OS === "android" ? { channelId: "injury-alerts" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: WEEK_SECONDS,
        repeats: true,
      },
    });

    await AsyncStorage.setItem(SHAME_WEEKLY_NOTIF_ID_KEY, notifId);
  };

  const scheduleWeeklyTripleCaptainReminder = async (teamId, tcAdvice) => {
    // Only remind weekly if recommendation is true
    if (!tcAdvice || !tcAdvice.recommend) {
      await cancelWeeklyNotif(TC_WEEKLY_NOTIF_ID_KEY);
      return;
    }

    await cancelWeeklyNotif(TC_WEEKLY_NOTIF_ID_KEY);

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    const player = tcAdvice.player
      ? ` Use Triple Captain on ${tcAdvice.player}.`
      : "";
    const reason = tcAdvice.reason ? ` ${tcAdvice.reason}` : "";

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🧠 Triple Captain Tip (Weekly)",
        body: `${reason}${player}`.trim(),
        sound: "default",
        data: { type: "triple_captain", teamId },
        ...(Platform.OS === "android" ? { channelId: "injury-alerts" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: WEEK_SECONDS,
        repeats: true,
      },
    });

    await AsyncStorage.setItem(TC_WEEKLY_NOTIF_ID_KEY, notifId);
  };

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
      await scheduleWeeklyShameReminder(id, shame);

      // Fetch triple captain advice
      const tcAdvice = await getTripleCaptainAdvice(id);
      setTripleCaptainAdvice(tcAdvice);
      await scheduleWeeklyTripleCaptainReminder(id, tcAdvice);

      // Fetch injury watchdog data
      const injuries = await getInjuryWatchdog(id);
      console.log("injuries:", injuries);
      console.log("flagged_players length:", injuries?.flagged_players?.length);
      setInjuryData(injuries);
      setInjuryData(injuries);
      await scheduleHourlyInjuryReminder(id, injuries);
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
    await cancelInjuryReminder();
    await cancelWeeklyNotif(SHAME_WEEKLY_NOTIF_ID_KEY);
    await cancelWeeklyNotif(TC_WEEKLY_NOTIF_ID_KEY);
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
        <Text style={styles.headerTitle}>FPL NAGBOT</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Section 1 - Injuries */}
      <View style={styles.notificationCard}>
        <Text style={styles.notificationTitle}>🔔 Injuries</Text>
        {injuryData && injuryData.ok ? (
          <View
            style={[
              styles.notificationContent,
              {
                backgroundColor: injuryData.alert
                  ? "rgba(220, 53, 69, 0.1)"
                  : "rgba(40, 167, 69, 0.1)",
              },
            ]}
          >
            {injuryData.alert && injuryData.flagged_players.length > 0 ? (
              <>
                <Text style={styles.injuryAlertMessage}>
                  🏥 Hospital FC Team List
                </Text>
                <Text style={styles.injurySubMessage}>
                  Gameweek {injuryData.gameweek}
                </Text>
                <View style={styles.injuredPlayersList}>
                  {injuryData.flagged_players.map((player, index) => (
                    <View
                      key={player.player_id || index}
                      style={styles.playerItem}
                    >
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{player.name}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                player.status_code === "i"
                                  ? "rgba(220, 53, 69, 0.3)"
                                  : player.status_code === "d"
                                  ? "rgba(255, 193, 7, 0.3)"
                                  : "rgba(108, 117, 125, 0.3)",
                            },
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {player.status_label}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
                <Text style={styles.injuryActionText}>
                  Fix your team now! 🚨
                </Text>
              </>
            ) : (
              <View>
                <Text style={styles.injuryGoodMessage}>
                  ✅ All clear! No unavailable players in your starting XI.
                </Text>
                <Text style={styles.injurySubMessage}>
                  Gameweek {injuryData.gameweek}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.placeholderText}>
            {injuryData && !injuryData.ok
              ? injuryData.message || "Could not fetch injury data."
              : "Loading injury data..."}
          </Text>
        )}
      </View>

      {/* Notification Section 2 */}
      <View style={styles.notificationCard}>
        <Text style={styles.notificationTitle}>📈 Triple or Nothing</Text>
        {tripleCaptainAdvice ? (
          <View
            style={[
              styles.notificationContent,
              {
                backgroundColor: tripleCaptainAdvice.recommend
                  ? "rgba(255, 193, 7, 0.1)"
                  : "rgba(108, 117, 125, 0.1)",
              },
            ]}
          >
            <Text style={styles.tcMessage}>{tripleCaptainAdvice.reason}</Text>
            {tripleCaptainAdvice.recommend && tripleCaptainAdvice.player && (
              <View style={styles.playerRecommendation}>
                <Text style={styles.playerLabel}>Recommended Player:</Text>
                <Text style={styles.playerName}>
                  {tripleCaptainAdvice.player}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.placeholderText}>
            Loading triple captain advice...
          </Text>
        )}
      </View>

      {/* Notification Section 3 */}
      <View style={styles.notificationCard}>
        <Text style={styles.notificationTitle}>🏆 Stinky players</Text>
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
    marginTop: 20,
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
  tcMessage: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: "500",
  },
  playerRecommendation: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  playerLabel: {
    color: COLORS.textSub,
    fontSize: 11,
    marginBottom: 4,
  },
  playerName: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: "bold",
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
  injuryAlertMessage: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: "600",
  },
  injuryGoodMessage: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: "500",
  },
  injurySubMessage: {
    color: COLORS.textSub,
    fontSize: 11,
    marginBottom: 12,
  },
  injuredPlayersList: {
    marginTop: 8,
    marginBottom: 12,
  },
  playerItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  playerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  injuryActionText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "center",
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
