// services/demoData.js
export const DEMO_ACCOUNTS = {
    "900001": {
      team_info: {
        name: "Alex Tan",
        team_name: "Bukit Timah Ballers",
        entry_rank: 123456,
        overall_rank: 987654,
        points: 1245,
        total_transfers: 22,
        region_rank: 54321,
      },
      watchdog: {
        ok: true,
        alert: false,
        message: "No unavailable players in starting XI.",
        flagged_players: [],
        unavailable_count: 0,
        gameweek: 21,
      },
      triple_captain: {
        recommend: false,
        reason: "Save it. No Double Gameweek detected.",
      },
      shame: {
        type: "performance_praise",
        gw: 20,
        team_points: 58,
        average_score: 52,
        surplus: 6,
        message: "🎯 Not bad! You scored 58 points in GW20, which is 6 above average.",
        shamed: false,
      },
    },
  
    "900002": {
      team_info: {
        name: "Nur Aisyah",
        team_name: "Tampines Tacticians",
        entry_rank: 654321,
        overall_rank: 432109,
        points: 1108,
        total_transfers: 35,
        region_rank: 88888,
      },
      watchdog: {
        ok: true,
        alert: true,
        notification: "⚠️ ALERT: Haaland, Saka will likely not play this gameweek.",
        message: "Unavailable player(s) detected in starting XI.",
        flagged_players: [
          { player_id: 355, name: "Haaland", status_code: "i", status_label: "Injured" },
          { player_id: 19, name: "Saka", status_code: "d", status_label: "Doubtful" },
        ],
        unavailable_count: 2,
        gameweek: 21,
      },
      triple_captain: {
        recommend: true,
        player: "Salah",
        reason: "ACTIVATE NOW! Salah plays twice and is on fire!",
      },
      shame: {
        type: "performance_shame",
        gw: 20,
        team_points: 31,
        average_score: 52,
        deficit: 21,
        message: "🔥 YIKES! You scored 31 points in GW20, but the average was 52. You're 21 points below average! Get it together!",
        shamed: true,
      },
    },
  
    "900003": {
      team_info: {
        name: "Jason Lim",
        team_name: "Yishun YOLO FC",
        entry_rank: "N/A",
        overall_rank: "N/A",
        points: 0,
        total_transfers: 0,
        region_rank: "N/A",
      },
      watchdog: {
        ok: false,
        alert: false,
        message: "Could not fetch injury data.",
        flagged_players: [],
        unavailable_count: 0,
      },
      triple_captain: {
        recommend: false,
        reason: "Could not fetch advice.",
      },
      shame: { error: "No shame data available" },
    },
  };
  