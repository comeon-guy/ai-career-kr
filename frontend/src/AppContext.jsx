import { createContext, useContext } from "react";

export const AppContext = createContext(null);

export function useAppContext() {
  const v = useContext(AppContext);
  if (!v) throw new Error("useAppContext must be used within AppContext.Provider");
  return v;
}
