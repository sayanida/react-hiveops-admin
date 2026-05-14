/*
api.js
	Helper for creating Axios clients.
	•	Read API base URL from localStorage and set it for requests
	•	Reject requests if the base URL is not set; log and re-throw response errors
	•	Export adminApi and staffApi for different endpoints
	
  Notes: Standardizes API access and error handling
*/

import axios from "axios";

function resolveBaseUrl(storageKeys, fallbackBase = "") {
  const keys = Array.isArray(storageKeys) ? storageKeys : [storageKeys];

  for (const key of keys) {
    const base = localStorage.getItem(key);
    if (base) return base.replace(/\/$/, "");
  }

  return fallbackBase ? fallbackBase.replace(/\/$/, "") : "";
}

function createApiClient(storageKeys, fallbackBase = "") {
  const client = axios.create({
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    const base = resolveBaseUrl(storageKeys, fallbackBase);

    if (!base) {
      return Promise.reject(new Error("Set API base URL first."));
    }

    config.baseURL = base;
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      console.error("API error:", err.response?.status, err.message);
      return Promise.reject(err);
    },
  );

  return client;
}

export const adminApi = createApiClient("timeclock_api_base");
export const staffApi = createApiClient("farm_staff_api_base");

// Auth can use whichever base has already been configured.
// Fallback keeps local dev moving if nothing was set yet.
export const authApi = createApiClient(
  ["timeclock_api_base", "farm_staff_api_base"],
  "http://localhost:8080",
);

export async function loginUser(payload) {
  const { data } = await authApi.post("/auth/login", payload);
  return data;
}
