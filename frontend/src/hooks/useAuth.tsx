import React, { createContext, useContext, useEffect, useState } from "react";

import { getErrorMessage } from "../lib/utils";
import { apiUrl } from "../lib/api";

interface AppUser {

  uid: string;
  email: string;
  role: string;
  points: number;
  streak: number;
  lastActivity: string;
}

interface AuthContextType {
  user: AppUser | null;
  profile: AppUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshProfile();
  }, []);

  const refreshProfile = async () => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
       try {
         const response = await fetch(apiUrl("/api/auth/user/"), {
           headers: { 
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
           }
         });
         
         if (response.ok) {
           const data = await response.json();
           const appUser = {
              uid: String(data.pk || data.id),
              email: data.email || "",
              role: data.role || "student",
              points: data.points || 0,
              streak: data.streak || 0,
              lastActivity: data.last_activity || new Date().toISOString()
           };
           setUser(appUser);
           setProfile(appUser);
         } else {
           // Token is invalid/expired
           setUser(null);
           setProfile(null);
           localStorage.removeItem("jwt_token");
           localStorage.removeItem("jwt_refresh_token");
         }
       } catch (error) {
         console.error("Auth fetch failed", error);
       }
    }
    setLoading(false);
  };


  const login = async () => {
    // Will be replaced with Google OAuth redirect or endpoint fetch
    console.log("Initiating Google Login via Django Backend...");
    window.location.href = apiUrl("/accounts/google/login/");
  };
  
  const loginWithEmail = async (email: string, password: string) => {
    const response = await fetch(apiUrl("/api/auth/login/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorMessage = await getErrorMessage(response);
      throw new Error(errorMessage);
    }


    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("jwt_token", data.access_token);
    } else if (data.access) {
      localStorage.setItem("jwt_token", data.access);
    }
    
    if (data.refresh_token) {
      localStorage.setItem("jwt_refresh_token", data.refresh_token);
    } else if (data.refresh) {
      localStorage.setItem("jwt_refresh_token", data.refresh);
    }

    if (data.user) {
      const appUser = {
        uid: String(data.user.pk || data.user.id),
        email: data.user.email || "",
        role: data.user.role || "student",
        points: data.user.points || 0,
        streak: data.user.streak || 0,
        lastActivity: data.user.last_activity || new Date().toISOString(),
      };
      setUser(appUser);
      setProfile(appUser);
    }
  };

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    const response = await fetch(apiUrl("/api/auth/registration/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email, 
        password1: password, 
        password2: password,
        username: name.replace(/\s+/g, '').toLowerCase() || email.split('@')[0]
      }),
    });

    if (!response.ok) {
      const errorMessage = await getErrorMessage(response);
      throw new Error(errorMessage);
    }


    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("jwt_token", data.access_token);
    } else if (data.access) {
      localStorage.setItem("jwt_token", data.access);
    }
    
    if (data.refresh_token) {
      localStorage.setItem("jwt_refresh_token", data.refresh_token);
    } else if (data.refresh) {
      localStorage.setItem("jwt_refresh_token", data.refresh);
    }

    if (data.user) {
      const appUser = {
        uid: String(data.user.pk || data.user.id),
        email: data.user.email || "",
        role: data.user.role || "student",
        points: data.user.points || 0,
        streak: data.user.streak || 0,
        lastActivity: data.user.last_activity || new Date().toISOString(),
      };
      setUser(appUser);
      setProfile(appUser);
    }
  };

  const logout = async () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("jwt_refresh_token");
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, loginWithEmail, signUpWithEmail, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
