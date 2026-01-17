import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./screens/LoginScreen"; // Notice the new path
import DashboardScreen from "./screens/DashboardScreen";
import { COLORS } from "./constants/theme";

// Placeholder Dashboard (We will build this in Phase 2)
const DashboardScreen = ({ onLogout }) => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.bgDark,
    }}
  >
    <Text style={{ color: COLORS.white, fontSize: 20 }}>
      Dashboard (Coming Soon)
    </Text>
    <Text style={{ color: COLORS.accent, marginTop: 20 }} onPress={onLogout}>
      Tap to Logout
    </Text>
  </View>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const id = await AsyncStorage.getItem("user_team_id");
      if (id) setIsLoggedIn(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user_team_id");
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bgDark,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <>
      {isLoggedIn ? (
        <DashboardScreen onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </>
  );
}
