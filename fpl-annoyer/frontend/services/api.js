import axios from "axios";

// 🚨 CRITICAL: Replace this with your Backend Laptop's IP Address
// Run 'ipconfig' (Windows) or 'ifconfig' (Mac) to find it.
// Do NOT use 'localhost' or '127.0.0.1' - it won't work on the phone.
const API_URL = "http://172.20.10.2:8000";

export const verifyTeam = async (teamId) => {
  try {
    // Calls your backend endpoint: GET /verify/{teamId}
    const response = await axios.get(`${API_URL}/verify/${teamId}`);

    // Assumes your backend returns { valid: true, name: "..." }
    return response.data;
  } catch (error) {
    console.error("Connection Error:", error);
    return { valid: false };
  }
};

export const getTeamInfo = async (teamId) => {
  try {
    // Calls your backend endpoint: GET /team-info/{teamId}
    const response = await axios.get(`${API_URL}/team-info/${teamId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching team info:", error);
    throw error;
  }
};

export const getTeamStatus = async (teamId) => {
  try {
    // Calls your backend endpoint: GET /status/{teamId}
    const response = await axios.get(`${API_URL}/status/${teamId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching team status:", error);
    throw error;
  }
};

export const getPerformanceShame = async (teamId) => {
  try {
    // Calls your backend endpoint: GET /shame/{teamId}
    const response = await axios.get(`${API_URL}/shame/${teamId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching performance shame:", error);
    return null;
  }
};

export const getTripleCaptainAdvice = async (teamId) => {
  try {
    // Calls your backend endpoint: GET /triple-captain/{teamId}
    const response = await axios.get(`${API_URL}/triple-captain/${teamId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching triple captain advice:", error);
    return { recommend: false, reason: "Could not fetch advice." };
  }
};

export const getInjuryWatchdog = async (teamId) => {
  try {
    // Calls your backend endpoint: GET /watchdog/{teamId}
    const response = await axios.get(`${API_URL}/watchdog/${teamId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching injury watchdog:", error);
    return {
      ok: false,
      alert: false,
      message: "Could not fetch injury data.",
      flagged_players: [],
      unavailable_count: 0,
    };
  }
};
