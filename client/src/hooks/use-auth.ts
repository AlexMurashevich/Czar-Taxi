import { useEffect, useState } from "react";

export function useAutoLogin() {
  const [authState, setAuthState] = useState<{
    isAdmin: boolean;
    requiresAuth: boolean;
    loading: boolean;
  }>({
    isAdmin: false,
    requiresAuth: false,
    loading: true,
  });

  const checkAuth = async () => {
    try {
      const statusResponse = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      const status = await statusResponse.json();
      
      if (!status.isAdmin && !status.requiresAuth) {
        // Development mode - try auto-login
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({})
        });
        
        if (loginResponse.ok) {
          setAuthState({ isAdmin: true, requiresAuth: false, loading: false });
          return;
        }
      }
      
      setAuthState({ 
        isAdmin: status.isAdmin, 
        requiresAuth: status.requiresAuth,
        loading: false 
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({ isAdmin: false, requiresAuth: true, loading: false });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return { ...authState, refetch: checkAuth };
}
