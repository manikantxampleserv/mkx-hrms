import axios from "axios";

/**
 * Create the axios instance
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Add a request interceptor to attach JWT auth token
 */
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const userTimezone =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "Asia/Kolkata";
    if (userTimezone) {
      config.headers["x-timezone"] = userTimezone;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Add a response interceptor to handle session expiration
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
