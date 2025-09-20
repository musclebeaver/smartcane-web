/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthAPI } from "@/lib/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("sc_access") || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("sc_refresh") || "");
  const [me, setMe] = useState(null);

  const saveTokens = useCallback((a, r) => {
    setAccessToken(a || "");
    setRefreshToken(r || "");
    if (a) localStorage.setItem("sc_access", a); else localStorage.removeItem("sc_access");
    if (r) localStorage.setItem("sc_refresh", r); else localStorage.removeItem("sc_refresh");
  }, []);

  const logout = useCallback(() => {
    saveTokens("", "");
    setMe(null);
  }, [saveTokens]);

  const loadMe = useCallback(async () => {
    if (!accessToken) {
      setMe(null);
      return;
    }
    try {
      const data = await AuthAPI.me(accessToken);
      setMe(data);
    } catch {
      if (refreshToken) {
        try {
          const ref = await AuthAPI.refresh(refreshToken);
          saveTokens(ref.accessToken, ref.refreshToken);
          const data2 = await AuthAPI.me(ref.accessToken);
          setMe(data2);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    }
  }, [accessToken, refreshToken, logout, saveTokens]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const value = useMemo(
    () => ({ accessToken, refreshToken, me, saveTokens, logout, reloadMe: loadMe }),
    [accessToken, refreshToken, me, saveTokens, logout, loadMe]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
