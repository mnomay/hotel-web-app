import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAdminMe, adminLogout as logoutRequest } from '../api/client';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getAdminMe()
      .then((data) => {
        if (active) setAdmin(data);
      })
      .catch(() => {
        if (active) setAdmin(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      admin,
      loading,
      setAdmin,
      logout: async () => {
        try {
          await logoutRequest();
        } finally {
          setAdmin(null);
        }
      },
    }),
    [admin, loading],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
