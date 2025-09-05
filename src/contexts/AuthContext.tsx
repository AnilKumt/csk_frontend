import axios from "axios";
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";

// Define user roles
export type UserRole =
  | "owner"
  | "admin"
  | "sales_manager"
  | "team_lead"
  | "agent"
  | "site_incharge"
  | "contractor"
  | "accountant"
  | "customer_purchased"
  | "customer_prospect"
  | "public_user";

// Define the user structure
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  address: string;
  department: string;
  avatar?: string;
  updatedAt: Date;
  createdAt: Date;
  lastLogin: Date;
}

// Define the context structure
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isUnauthorized: boolean;
  setIsUnauthorized: React.Dispatch<React.SetStateAction<Boolean>>;
}

export const getCsrfToken = async () => {
  const response = await axios.get(
    `${import.meta.env.VITE_URL}/api/csrf-token`,
    {
      withCredentials: true,
    }
  );
  return response.data.csrfToken;
};

// Create the context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: async () => {},
  logout: async () => {}, // Make async
  isAuthenticated: false,
  isUnauthorized: false,
  setIsUnauthorized: () => {},
});

// Create the provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // gets the logged in user
  const fetchLoggedInUser = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_URL}/api/user/getLoggedInUser`,
        { withCredentials: true }
      );
      setUser(data);
    } catch (error) {
      if (error.response?.status === 401) {
        setUser(null);
        setIsUnauthorized(true);
      } else {
        console.log("failed to load logged in user ", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    fetchLoggedInUser();
  }, []);

  // Login function

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_URL}/api/user/login`,
        { email, password },
        { withCredentials: true }
      );
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error("Invalid email or password");
      } else {
        toast.error("An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Make async
    try {
      await axios.post(
        `${import.meta.env.VITE_URL}/api/user/logout`,
        {},
        { withCredentials: true }
      );
      setUser(null);
      toast.info("You have been logged out");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        isUnauthorized,
        setIsUnauthorized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook for using the auth context
export const useAuth = () => useContext(AuthContext);
