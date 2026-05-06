import axios, { type InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "@/features/auth/storage";
import { env } from "@/lib/env";
import { startGlobalLoading } from "@/lib/global-loading";

type LoadingAwareConfig = InternalAxiosRequestConfig & {
  __stopGlobalLoading?: () => void;
  skipGlobalLoading?: boolean;
  __skipGlobalLoading?: boolean;
};

export type ApiRequestConfig = Partial<LoadingAwareConfig> & {
  params?: Record<string, unknown>;
  headers?: Record<string, unknown>;
};

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config: LoadingAwareConfig) => {
    if (typeof window !== "undefined") {
      const shouldSkipGlobalLoading =
        config.skipGlobalLoading === true || config.__skipGlobalLoading === true;

      if (!shouldSkipGlobalLoading) {
        config.__stopGlobalLoading = startGlobalLoading("Memuat data...");
      }

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
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as LoadingAwareConfig;
    config.__stopGlobalLoading?.();

    return response;
  },
  (error) => {
    const config = error?.config as LoadingAwareConfig | undefined;
    config?.__stopGlobalLoading?.();

    return Promise.reject(error);
  }
);