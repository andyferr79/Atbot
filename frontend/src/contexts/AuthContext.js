import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebaseConfig";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseToken, setFirebaseToken] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken(true);
        setFirebaseToken(token);
        localStorage.setItem("firebaseToken", token);
        localStorage.setItem("user_id", user.uid);
      } else {
        setFirebaseToken(null);
        localStorage.removeItem("firebaseToken");
        localStorage.removeItem("user_id");
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { currentUser, firebaseToken };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
