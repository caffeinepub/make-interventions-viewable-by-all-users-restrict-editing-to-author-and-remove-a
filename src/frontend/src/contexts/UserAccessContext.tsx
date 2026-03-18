import { createContext, useContext } from "react";

interface UserAccessContextValue {
  isAdmin: boolean;
}

const UserAccessContext = createContext<UserAccessContextValue>({
  isAdmin: false,
});

export function UserAccessProvider({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <UserAccessContext.Provider value={{ isAdmin }}>
      {children}
    </UserAccessContext.Provider>
  );
}

export function useUserAccess() {
  return useContext(UserAccessContext);
}
