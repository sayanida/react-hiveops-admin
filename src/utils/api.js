/*
api.js
	Helper for creating Axios clients.
	•	Read API base URL from localStorage and set it for requests
	•	Reject requests if the base URL is not set; log and re-throw response errors
	•	Export adminApi and staffApi for different endpoints
	
  Notes: Standardizes API access and error handling
*/

import axios from "axios";

function createApiClient(storageKey) {
  const client = axios.create({
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    const base = localStorage.getItem(storageKey) || "";
    if (!base) return Promise.reject(new Error("Set API base URL first."));
    config.baseURL = base.replace(/\/$/, "");
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
