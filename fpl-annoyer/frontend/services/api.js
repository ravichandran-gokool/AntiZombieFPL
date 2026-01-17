import axios from "axios";

// 🚨 CRITICAL: Replace this with your Backend Laptop's IP Address
// Run 'ipconfig' (Windows) or 'ifconfig' (Mac) to find it.
// Do NOT use 'localhost' or '127.0.0.1' - it won't work on the phone.
const API_URL = "http://172.20.10.3:8000";

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
