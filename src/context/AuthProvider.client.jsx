"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: async () => {},
  hydrated: false,
  isLoggingOut: false,
});

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[-.+*]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function readCookieEmployeeId() {
  const cookieCandidates = ["employeeId", "x-employee-id", "employee_id"];
  for (const name of cookieCandidates) {
    const v = getCookie(name);
    if (v) return v;
  }
  return null;
}

function parseAllowedOrigins(raw) {
  return (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function resolveParentOrigin(allowedOrigins) {
  if (!allowedOrigins || allowedOrigins.length === 0) return null;
  try {
    if (typeof document !== "undefined" && document.referrer) {
      try {
        const ref = new URL(document.referrer).origin;
        if (allowedOrigins.includes(ref)) return ref;
      } catch (e) {}
    }
  } catch (e) {}
  return allowedOrigins[0] || null;
}

function pickFirst(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null) return v;
  }
  return null;
}
function safeGet(obj, path) {
  if (!obj) return undefined;
  try {
    return path
      .split(".")
      .reduce((s, p) => (s && s[p] !== undefined ? s[p] : undefined), obj);
  } catch {
    return undefined;
  }
}

function extractDepartment(body) {
  if (!body) return null;
  return (
    pickFirst(
      safeGet(body, "department_id"),
      safeGet(body, "deptId"),
      safeGet(body, "dept_id"),
      safeGet(body, "department"),
      safeGet(body, "raw.department_id"),
      safeGet(body, "raw.deptId"),
      safeGet(body, "raw.dept_id"),
      safeGet(body, "message.department_id"),
      safeGet(body, "message.raw.department_id")
    ) ?? null
  );
}
function extractOrg(body) {
  if (!body) return null;
  return (
    pickFirst(
      safeGet(body, "org_id"),
      safeGet(body, "orgId"),
      safeGet(body, "organization_id"),
      safeGet(body, "organization.id"),
      safeGet(body, "raw.org_id"),
      safeGet(body, "raw.orgId"),
      safeGet(body, "message.org_id"),
      safeGet(body, "message.raw.org_id")
    ) ?? null
  );
}
function extractEmployeeId(body) {
  if (!body) return null;
  return (
    pickFirst(
      safeGet(body, "employeeId"),
      safeGet(body, "id"),
      safeGet(body, "employee_id"),
      safeGet(body, "empId"),
      safeGet(body, "raw.employeeId"),
      safeGet(body, "raw.employee_id"),
      safeGet(body, "message.employeeId"),
      safeGet(body, "message.raw.employeeId")
    ) ?? null
  );
}

try {
  if (
    axios &&
    axios.defaults &&
    axios.defaults.headers &&
    axios.defaults.headers.common
  ) {
    delete axios.defaults.headers.common["x-department-id"];
  }
} catch (e) {
  console.warn("Could not delete axios global header x-department-id", e);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

  const allowedIframeOrigins = useMemo(
    () => parseAllowedOrigins(process.env.NEXT_PUBLIC_ALLOWED_IFRAME_ORIGINS),
    []
  );
  const parentOriginCandidate = useMemo(
    () => resolveParentOrigin(allowedIframeOrigins),
    [allowedIframeOrigins]
  );

  useEffect(() => {
    let mounted = true;

    async function rehydrate() {
      try {
        if (!BACKEND_URL) {
          if (mounted) setHydrated(true);
          return;
        }

        const cookieEmp = readCookieEmployeeId();
        const headers = {
          "x-api-key": API_KEY || "",
          ...(cookieEmp ? { "x-employee-id": String(cookieEmp) } : {}),
        };

        const res = await fetch(`${BACKEND_URL}/me`, {
          method: "GET",
          credentials: "include",
          headers,
        });

        if (!mounted) return;

        const json = await res.json().catch(() => null);
        if (!json) {
          setUser(null);
          return;
        }

        const body = json.message ?? json;

        const department = extractDepartment(body);
        const empId = extractEmployeeId(body);
        const org = extractOrg(body);

        const serverUser = {
          id: empId,
          employeeId: empId,
          department_id: department,
          name: pickFirst(
            body.name,
            safeGet(body, "dashboard.name"),
            safeGet(body, "raw.name")
          ),
          role: pickFirst(body.role, safeGet(body, "raw.role")) ?? null,
          dashboard: body.dashboard ?? {},
          sidebarMenu: body.sidebarMenu ?? [],
          raw: body,
          orgId: org,
        };

        if (res.ok) {
          setUser(serverUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("rehydrate error", err);
        setUser(null);
      } finally {
        if (mounted) {
          setHydrated(true);
          if (typeof window !== "undefined") window.__APP_LOGGING_OUT = false;
        }
      }
    }

    rehydrate();
    return () => {
      mounted = false;
    };
  }, [BACKEND_URL, API_KEY]);

  const fetchMe = async () => {
    if (!BACKEND_URL) return null;
    try {
      const cookieEmp = readCookieEmployeeId();
      const headers = {
        "x-api-key": API_KEY || "",
        ...(cookieEmp ? { "x-employee-id": String(cookieEmp) } : {}),
      };

      const res = await fetch(`${BACKEND_URL}/me`, {
        method: "GET",
        credentials: "include",
        headers,
      });
      const json = await res.json().catch(() => null);
      const body = (json && (json.message ?? json)) || null;
      if (!body) return null;

      const department = extractDepartment(body);
      const empId = extractEmployeeId(body);
      const org = extractOrg(body);

      const serverUser = {
        id: empId,
        employeeId: empId,
        department_id: department,
        name: pickFirst(
          body.name,
          safeGet(body, "dashboard.name"),
          safeGet(body, "raw.name")
        ),
        role: pickFirst(body.role, safeGet(body, "raw.role")) ?? null,
        dashboard: body.dashboard ?? {},
        sidebarMenu: body.sidebarMenu ?? [],
        raw: body,
        orgId: org,
      };

      if (res.ok) {
        setUser(serverUser);
        return serverUser;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error("fetchMe error", err);
      return null;
    }
  };

  const login = async (serverUser, { fetchFull = true } = {}) => {
    const minimalUser = {
      id: serverUser?.id ?? serverUser?.employeeId ?? null,
      employeeId: serverUser?.employeeId ?? serverUser?.id ?? null,
      department_id: serverUser?.department_id ?? serverUser?.deptId ?? null,
      name: serverUser?.name ?? null,
      role: serverUser?.role ?? null,
      dashboard: serverUser?.dashboard ?? {},
      sidebarMenu: serverUser?.sidebarMenu ?? [],
      raw: serverUser?.raw ?? {},
    };

    setUser(minimalUser);

    if (fetchFull) {
      fetchMe().catch((e) => {
        console.warn("fetchMe after login failed:", e);
      });
    }

    return minimalUser;
  };

  const isFramed = () =>
    typeof window !== "undefined" &&
    window.parent &&
    window.parent !== window.self;

  const logout = async ({ redirect = true, reason } = {}) => {
    const notifyParent = () => {
      try {
        if (isFramed()) {
          const target = parentOriginCandidate || "*";
          window.parent.postMessage(
            {
              type: "child-logged-out",
              reason: reason ?? "unknown",
              path: "/",
            },
            target
          );
        }
      } catch (err) {
        console.warn("Failed to post child-logged-out to parent:", err);
      }
    };

    const backgroundCleanup = async () => {
      try {
        try {
          setUser(null);
        } catch (e) {
          console.warn("setUser(null) failed", e);
        }

        try {
          if (
            axios &&
            axios.defaults &&
            axios.defaults.headers &&
            axios.defaults.headers.common
          ) {
            delete axios.defaults.headers.common["x-department-id"];
          }
        } catch (e) {
          console.warn("Could not delete axios global header at logout", e);
        }

        if (BACKEND_URL) {
          try {
            await fetch(`${BACKEND_URL}/logout`, {
              method: "POST",
              credentials: "include",
              headers: {
                "x-api-key": API_KEY || "",
                "Content-Type": "application/json",
              },
            });
          } catch (err) {
            console.error("logout request failed:", err);
          }
        }
      } catch (err) {
        console.warn("backgroundCleanup error", err);
      }
    };

    if (redirect) {
      try {
        notifyParent();
        try {
          router.replace("/");
        } catch (err) {
          try {
            router.push("/");
          } catch (e) {
            console.warn("router navigation failed", e);
          }
        }
        setTimeout(() => {
          backgroundCleanup();
        }, 40);
        return;
      } catch (err) {
        console.warn("logout (redirect=true) unexpected error:", err);
      }
    }

    setIsLoggingOut(true);
    setUser(null);
    if (typeof window !== "undefined") window.__APP_LOGGING_OUT = true;

    try {
      if (BACKEND_URL) {
        await fetch(`${BACKEND_URL}/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            "x-api-key": API_KEY || "",
            "Content-Type": "application/json",
          },
        });
      }
    } catch (err) {
      console.error("logout request failed:", err);
    } finally {
      try {
        if (
          axios &&
          axios.defaults &&
          axios.defaults.headers &&
          axios.defaults.headers.common
        ) {
          delete axios.defaults.headers.common["x-department-id"];
        }
      } catch (e) {}
      if (typeof window !== "undefined") window.__APP_LOGGING_OUT = false;
      setIsLoggingOut(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, hydrated, isLoggingOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
