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
  ScrollView,
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>FPL NAGBOT</Text>
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

          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>How to find your team ID?</Text>

            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>1.</Text>
              <Text style={styles.stepText}>
                Log in to the <Text style={styles.boldText}>FPL website</Text>{" "}
                on your browser.
              </Text>
            </View>

            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>2.</Text>
              <Text style={styles.stepText}>
                Click on the <Text style={styles.boldText}>"Points"</Text> tab.
              </Text>
            </View>

            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>3.</Text>
              <Text style={styles.stepText}>Look at the URL address bar.</Text>
            </View>

            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>4.</Text>
              <Text style={styles.stepText}>
                Your ID is the number after{" "}
                <Text style={styles.highlightText}>/entry/</Text>.
              </Text>
            </View>

            <View style={styles.exampleContainer}>
              <Text style={styles.exampleLabel}>• Example:</Text>
              <View style={styles.exampleUrl}>
                <Text style={styles.exampleText}>.../entry/</Text>
                <Text style={styles.exampleId}>827463</Text>
                <Text style={styles.exampleText}>/event/...</Text>
              </View>
            </View>
          </View>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark, // Uses Theme
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444",
  },
  guideContainer: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.accent,
    marginBottom: 15,
    textAlign: "center",
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.accent,
    marginRight: 8,
    minWidth: 20,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#ddd",
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "bold",
    color: COLORS.white,
  },
  highlightText: {
    backgroundColor: "#444",
    color: COLORS.accent,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: "monospace",
  },
  exampleContainer: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  exampleLabel: {
    fontSize: 14,
    color: COLORS.textSub,
    marginBottom: 8,
  },
  exampleUrl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  exampleText: {
    fontSize: 13,
    color: COLORS.textSub,
    fontFamily: "monospace",
  },
  exampleId: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.accent,
    backgroundColor: "#444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: "monospace",
    marginHorizontal: 2,
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
