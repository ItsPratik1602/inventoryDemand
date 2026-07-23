import axios from "axios";
import { startGlobalLoading, stopGlobalLoading } from "./loading-store.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
});

// Debug API configuration
console.log('=== API Configuration ===');
console.log('Base URL:', import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1");
console.log('Environment:', import.meta.env.MODE);

api.interceptors.request.use((config) => {
  startGlobalLoading();
  const token = localStorage.getItem("token");

  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  console.log('Token exists:', !!token);
  console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    stopGlobalLoading();
    return response;
  },
  (error) => {
    stopGlobalLoading();
    console.log('API Error Response:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Message:', error.response?.data?.message);
    console.log('URL:', error.config?.url);
    console.log('Method:', error.config?.method?.toUpperCase());
    return Promise.reject(error);
  }
);

export default api;
