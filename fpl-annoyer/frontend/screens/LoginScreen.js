/**
 * This is the frontend for the login screen
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, FONTS } from "../constants/theme"; // Import your theme
import { verifyTeam } from "../services/api";

export default function LoginScreen({ onLogin }) {
  const [fplId, setFplId] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (!fplId) {
      Alert.alert("Oi!", "You need to enter an ID. I can't guess it.");
      return;
    }

    setLoading(true);

    try {
      // PHASE 2: REAL BACKEND VERIFICATION
      // 1. Ask the backend if this ID exists
      const data = await verifyTeam(fplId);

      console.log(data);
      if (data.valid) {
        // 2. If valid, save the ID (and name if available) to phone storage
        await AsyncStorage.setItem("user_team_id", fplId);

        // Optional: Save name for the dashboard
        if (data.name) {
          await AsyncStorage.setItem("user_team_name", data.name);
        }

        // 3. Move to the Dashboard
        onLogin();
      } else {
        // 4. If invalid, yell at the user
        Alert.alert(
          "Invalid ID",
          "That team doesn't exist. Are you hallucinating?"
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Could not connect to server. Is your backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>FPL MANAGER</Text>
        <Text style={styles.subtitle}>
          Enter your Team ID to start the suffering.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. 123456"
          placeholderTextColor={COLORS.textSub}
          keyboardType="numeric"
          value={fplId}
          onChangeText={setFplId}
          maxLength={10}
        />

        <Text style={styles.helperText}>
          (Found in your browser URL: fantasy.premierleague.com/entry/
          <Text style={{ fontWeight: "bold", color: COLORS.white }}>
            XXXXXX
          </Text>
          /history)
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Start Managing</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark, // Uses Theme
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.bgCard, // Uses Theme
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: COLORS.accent, // Uses Theme (Green Glow)
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: FONTS.headerSize,
    fontWeight: "bold",
    color: COLORS.accent, // Uses Theme
    marginBottom: 10,
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#ddd",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#333",
    color: COLORS.white,
    padding: 15,
    borderRadius: 8,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  helperText: {
    color: COLORS.textSub,
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: COLORS.primary, // Uses Theme
    width: "100%",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});
