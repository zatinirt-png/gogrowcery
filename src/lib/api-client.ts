import axios from "axios";
import { getAccessToken } from "@/features/auth/storage";
import { env } from "@/lib/env";

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});