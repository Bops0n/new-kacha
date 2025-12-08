"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { WEBSITE_SETTING_DEFINITION } from "../utils/setting";
import LoadingSpinner from "../components/LoadingSpinner";

const WebsiteSettingsContext = createContext<any>(null);

export function WebsiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<WEBSITE_SETTING_DEFINITION | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(setSettings);
  }, []);

  if (!settings) return <LoadingSpinner/>;

  return (
    <WebsiteSettingsContext.Provider value={settings}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
}

export function useWebsiteSettings() {
  return useContext(WebsiteSettingsContext);
}
