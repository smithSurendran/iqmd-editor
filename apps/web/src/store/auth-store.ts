import {create} from "zustand";
import {persist} from "zustand/middleware";
import {User} from "@/lib/api-client";
import Cookies from "js-cookie";
interface AuthState {
    user: User |null;
    accessToken: string | null;
    isAuthenticated: boolean;

    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
    setToken: (token: string ) => void;
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem("access_token", token);
        localStorage.setItem("user", JSON.stringify(user));
        Cookies.set("iqmd_auth_check", "1", { expires: 7, sameSite: "lax" });
        set({ user, accessToken: token, isAuthenticated: true });
      },


      clearAuth: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        Cookies.remove("iqmd_auth_check");
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setToken: (token) => {
        localStorage.setItem("access_token", token);
        set({ accessToken: token });
      },
    }),
    {
      name: "iqmd-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);