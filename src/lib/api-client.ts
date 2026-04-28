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

    if (config.data instanceof FormData) {
      const headers = config.headers as unknown as {
        delete?: (key: string) => void;
        [key: string]: unknown;
      };

      if (typeof headers.delete === "function") {
        headers.delete("Content-Type");
        headers.delete("content-type");
      } else {
        delete headers["Content-Type"];
        delete headers["content-type"];
      }
    }
  }

  return config;
});