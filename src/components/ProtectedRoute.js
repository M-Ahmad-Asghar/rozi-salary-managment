import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase/config';

export const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'))
    || null;
  console.log("user121", supabase.auth.headers.Authorization);

  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};