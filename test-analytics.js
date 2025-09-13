// Simple test script to verify analytics endpoints
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

// Test credentials (from seed data)
const testCredentials = {
  username: "admin1",
  password: "admin123",
};

async function testAnalytics() {
  try {
    console.log("🔐 Logging in...");

    // Login to get token
    const loginResponse = await axios.post(
      `${BASE_URL}/auth/admin/login`,
      testCredentials
    );
    const token = loginResponse.data.data.token;

    console.log("✅ Login successful");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    console.log("\n📊 Testing Analytics Endpoints...\n");

    // Test dashboard stats
    console.log("1. Testing Dashboard Stats...");
    const dashboardResponse = await axios.get(
      `${BASE_URL}/reports/dashboard?period=today`,
      { headers }
    );
    console.log(
      "✅ Dashboard Stats:",
      JSON.stringify(dashboardResponse.data.data.stats.overview, null, 2)
    );

    // Test daily stats
    console.log("\n2. Testing Daily Stats...");
    const dailyResponse = await axios.get(
      `${BASE_URL}/reports/daily?date=2024-01-15`,
      { headers }
    );
    console.log(
      "✅ Daily Stats:",
      JSON.stringify(dailyResponse.data.data.stats, null, 2)
    );

    // Test weekly stats
    console.log("\n3. Testing Weekly Stats...");
    const weeklyResponse = await axios.get(`${BASE_URL}/reports/weekly`, {
      headers,
    });
    console.log(
      "✅ Weekly Stats:",
      JSON.stringify(weeklyResponse.data.data.stats, null, 2)
    );

    // Test monthly stats
    console.log("\n4. Testing Monthly Stats...");
    const monthlyResponse = await axios.get(
      `${BASE_URL}/reports/monthly?month=1&year=2024`,
      { headers }
    );
    console.log(
      "✅ Monthly Stats:",
      JSON.stringify(monthlyResponse.data.data.stats, null, 2)
    );

    // Test KPI summary
    console.log("\n5. Testing KPI Summary...");
    const kpiResponse = await axios.get(
      `${BASE_URL}/reports/kpi?period=month`,
      { headers }
    );
    console.log(
      "✅ KPI Summary:",
      JSON.stringify(kpiResponse.data.data.kpi.operational, null, 2)
    );

    // Test custom report
    console.log("\n6. Testing Custom Report...");
    const customResponse = await axios.get(
      `${BASE_URL}/reports/custom?startDate=2024-01-01&endDate=2024-01-31&reportType=revenue`,
      { headers }
    );
    console.log(
      "✅ Custom Report:",
      JSON.stringify(customResponse.data.data.report, null, 2)
    );

    console.log("\n🎉 All analytics endpoints working successfully!");
  } catch (error) {
    console.error(
      "❌ Error testing analytics:",
      error.response?.data || error.message
    );
  }
}

// Run the test
testAnalytics();
