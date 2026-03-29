import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    checkUserAuth();
    
    // Subscribe to auth state changes
    const { data: { subscription } } = authAPI.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        // Check if user is admin
        const adminClaim = session.user.user_metadata?.is_admin || false;
        setIsAdmin(adminClaim);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await authAPI.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        const adminClaim = currentUser.user_metadata?.is_admin || false;
        setIsAdmin(adminClaim);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthError(error.message);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await authAPI.logout();
      if (error) throw new Error(error);
      
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setAuthError(null);
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError(error.message);
    }
  };

  const login = async (email, password) => {
    try {
      setAuthError(null);
      const { user: newUser, error } = await authAPI.login(email, password);
      
      if (error) {
        setAuthError(error);
        return { success: false, error };
      }
      
      setUser(newUser);
      setIsAuthenticated(true);
      const adminClaim = newUser?.user_metadata?.is_admin || false;
      setIsAdmin(adminClaim);
      
      return { success: true };
    } catch (error) {
      const message = error.message || 'Login failed';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const register = async (email, password, metadata = {}) => {
    try {
      setAuthError(null);
      const { user: newUser, error } = await authAPI.register(email, password, metadata);
      
      if (error) {
        setAuthError(error);
        return { success: false, error };
      }
      
      setUser(newUser);
      setIsAuthenticated(true);
      setIsAdmin(false);
      
      return { success: true };
    } catch (error) {
      const message = error.message || 'Registration failed';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      authError,
      isAdmin,
      logout,
      login,
      register,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
