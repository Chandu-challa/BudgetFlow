"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("accessToken");
            if (token) {
                try {
                    await fetchProfile();
                }
                catch (error) {
                    const err = error;
                    console.error("Token verification failed:", err);
                    logout();
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);
    async function fetchProfile() {
        try {
            const response = await api.get("auth/profile/");
            setUser(response.data);
        }
        catch (error) {
            const err = error;
            throw err;
        }
    }
    const login = async (usernameOrEmail, password) => {
        setLoading(true);
        try {
            // SimpleJWT takes 'username' (which our custom backend matches against email or username)
            const response = await api.post("auth/login/", {
                username: usernameOrEmail,
                password: password,
            });
            localStorage.setItem("accessToken", response.data.access);
            localStorage.setItem("refreshToken", response.data.refresh);
            await fetchProfile();
            router.push("/dashboard");
        }
        catch (error) {
            const err = error;
            setLoading(false);
            throw new Error(err.response?.data?.detail || "Invalid login credentials");
        }
        finally {
            setLoading(false);
        }
    };
    const register = async (data) => {
        setLoading(true);
        try {
            await api.post("auth/register/", data);
            setLoading(false);
        }
        catch (error) {
            const err = error;
            setLoading(false);
            const errors = err.response?.data;
            const errMsg = errors ? Object.values(errors).flat().join(" ") : "Registration failed";
            throw new Error(errMsg);
        }
    };
    function logout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        window.location.href = "/login";
    }
    const updateProfile = async (formData) => {
        try {
            const response = await api.patch("auth/profile/", formData, {
                headers: {
                    "Content-Type": formData instanceof FormData ? "multipart/form-data" : "application/json",
                },
            });
            setUser(response.data);
        }
        catch (error) {
            const err = error;
            throw new Error(err.response?.data?.detail || "Failed to update profile");
        }
    };
    // Protect Pages
    useEffect(() => {
        const publicPages = ["/login", "/register", "/forgot-password", "/reset-password"];
        const isPublic = publicPages.some(page => pathname.startsWith(page));
        if (!loading) {
            if (!user && !isPublic) {
                window.location.href = "/login";
            }
            else if (user && isPublic) {
                router.push("/dashboard");
            }
        }
    }, [user, loading, pathname, router]);
    return (<AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated: !!user,
            login,
            register,
            logout,
            fetchProfile,
            updateProfile,
        }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
