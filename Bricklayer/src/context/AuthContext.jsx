import { createContext, useEffect, useState } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext({});


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    authService.getSession().then((session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const register = (data) => authService.signUp(data);
  const login = (email, password) => authService.signIn(email, password);
  const logout = () => authService.signOut();

  return (
    <AuthContext.Provider value={{ user, register, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};