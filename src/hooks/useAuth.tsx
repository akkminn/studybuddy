import { useState, useEffect, createContext, useContext } from "react";
import {
  onAuthStateChanged,
  User,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect result error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          const newProfile = {
            uid: user.uid,
            email: user.email,
            role: "student",
            points: 0,
            streak: 0,
            lastActivity: new Date().toISOString(),
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        console.log("User closed the login popup");
      } else {
        console.error("Login error:", error);
      }
    }
  };
  
  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
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
