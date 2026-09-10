import axios from "axios";
const API_BASE_URL = "http://localhost:8000/api/";
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});
// Request Interceptor: Attach Access Token
api.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));
// Response Interceptor: Handle Token Refresh on 401
api.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
            const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
            if (!refreshToken) {
                throw new Error("No refresh token");
            }
            // Call refresh endpoint
            const response = await axios.post(`${API_BASE_URL}auth/refresh/`, {
                refresh: refreshToken,
            });
            const newAccess = response.data.access;
            if (typeof window !== "undefined") {
                localStorage.setItem("accessToken", newAccess);
            }
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return api(originalRequest);
        }
        catch (refreshError) {
            // Clear tokens and redirect to login
            if (typeof window !== "undefined") {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.href = "/login";
            }
            return Promise.reject(refreshError);
        }
    }
    return Promise.reject(error);
});
