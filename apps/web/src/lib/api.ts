import axios, {AxiosInstance, InternalAxiosRequestConfig} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

// - Attach access token to every request if it exists
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if(typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if(token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

let isRefreshing = false;
let failedQueue: Array<{resolve: (token?: string) => void, reject: (err?: unknown) => void}> = [];

function processQueue(error: unknown, token: string | null = null) {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
    failedQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only retry once, only on 401, skip the refresh endpoint itself
        if ( error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== "/auth/refresh" && !originalRequest.url?.includes("/auth/login")    ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const {data} = await api.post("/auth/refresh");
                const newToken = data.access_token;
                localStorage.setItem("access_token", newToken);
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
        
    }
);

export default api;