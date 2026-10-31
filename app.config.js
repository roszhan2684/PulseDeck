// Extends app.json. EXPO_WEB_BASE_URL lets the web build live under a sub-path (e.g. /demo on the marketing site).
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, ...(process.env.EXPO_WEB_BASE_URL ? { baseUrl: process.env.EXPO_WEB_BASE_URL } : {}) },
});
