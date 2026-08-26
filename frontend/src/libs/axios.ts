import axios, { AxiosInstance } from "axios";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export const getAccessToken = async () => {
  if (typeof window === "undefined") {
    return null; // Avoid relative fetch errors on server side
  }

  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const res = await fetch("/api/auth/get-session");
    if (res.ok) {
      const data = await res.json();
      if (data?.session?.token) {
        cachedToken = data.session.token;
        tokenExpiry = new Date(data.session.expiresAt).getTime() - 60000; // 1 minute buffer
        return cachedToken;
      }
    }
  } catch (error) {
    console.error("Failed to fetch session token", error);
  }

  return null;
};

export const clearTokenCache = () => {
  cachedToken = null;
  tokenExpiry = null;
};

const getMessageBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_MESSAGE_API_URL)
    return process.env.NEXT_PUBLIC_MESSAGE_API_URL;
  if (process.env.NEXT_PUBLIC_WS_API_URL)
    return process.env.NEXT_PUBLIC_WS_API_URL.replace(
      "ws://",
      "http://",
    ).replace("wss://", "https://");
  return "http://localhost:8001";
};

export const messageBackend = axios.create({
  baseURL: getMessageBaseUrl(),
});

const setupInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    async (config) => {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Clear cache if unauthorized so we can try getting a fresh token (e.g., after refresh)
      if (error.response?.status === 401) {
        clearTokenCache();
      }
      return Promise.reject(error);
    },
  );
};

setupInterceptors(messageBackend);
