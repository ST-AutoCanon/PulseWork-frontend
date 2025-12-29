"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import HolidayCalendar from "../HolidayCalendar/HolidayCalendar.client";
import Notifications from "./Notifications.client";
import ReactDOM from "react-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCalendarAlt,
  faPowerOff,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";
import "./Topbar.css";
import { useAuth } from "../../context/AuthProvider.client";

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

function MobileTopbar(props) {
  const {
    userName,
    userRole,
    avatar,
    orgName,
    notificationCount,
    showCalendar,
    setShowCalendar,
    showNotifications,
    setShowNotifications,
    handleNotificationClick,
    handleCalendarToggle,
    fetchNotificationCount,
    logout,
    portalRoot,
    calToggleRef,
    notifRef,
    onLogout,
  } = props;

  return (
    <div className="mobile-topbar-v2">
      <div className="mobile-header-colored">
        <div className="mobile-org-card">
          <span>{String(orgName || "").toUpperCase()}</span>
        </div>
      </div>

      <div className="mobile-main-row">
        <div className="mobile-profile-card">
          {avatar ? (
            <img src={avatar} alt="Profile" className="mobile-avatar" />
          ) : (
            <div className="mobile-avatar-placeholder">
              <span>{userName.charAt(0)}</span>
            </div>
          )}
          <div className="mobile-user-info">
            <div className="mobile-user-name">{userName}</div>
            <div className="mobile-user-role">{userRole}</div>
          </div>
        </div>

        <div className="mobile-action-buttons">
          <button
            ref={notifRef}
            onClick={handleNotificationClick}
            className="mobile-action-btn"
            aria-label="Notifications"
          >
            <FontAwesomeIcon icon={faBell} />
            {notificationCount > 0 && (
              <span className="mobile-badge">{notificationCount}</span>
            )}
          </button>

          <button
            ref={calToggleRef}
            onClick={handleCalendarToggle}
            className="mobile-action-btn"
            aria-label="Calendar"
          >
            <FontAwesomeIcon icon={faCalendarAlt} />
          </button>

          <button
            onClick={onLogout}
            className="mobile-action-btn mobile-logout-btn"
            aria-label="Logout"
          >
            <FontAwesomeIcon icon={faPowerOff} />
          </button>
        </div>
      </div>

      <Notifications
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        onRead={() => fetchNotificationCount()}
      />
      {showCalendar &&
        (portalRoot ? (
          ReactDOM.createPortal(
            <div className="mobile-calendar-overlay">
              <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
            </div>,
            portalRoot
          )
        ) : (
          <div className="mobile-calendar-inline">
            <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
          </div>
        ))}
    </div>
  );
}

export default function Topbar() {
  const router = useRouter();
  const { user, logout, hydrated } = useAuth();

  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState(" ");
  const [userRole, setUserRole] = useState(" ");
  const [notificationCount, setNotificationCount] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [orgName, setOrgName] = useState("Loading...");

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const allowedIframeOrigins = useMemo(
    () => parseAllowedOrigins(process.env.NEXT_PUBLIC_ALLOWED_IFRAME_ORIGINS),
    []
  );

  const parentOriginCandidate = useMemo(
    () => resolveParentOrigin(allowedIframeOrigins),
    [allowedIframeOrigins]
  );

  useEffect(() => {
    try {
      router?.prefetch?.("/");
    } catch (e) {}
  }, [router]);

  useEffect(() => {}, [hydrated, user]);

  const meId = user?.employeeId ?? user?.id ?? null;
  const headers = meId
    ? { "x-api-key": API_KEY || "", "x-employee-id": meId }
    : { "x-api-key": API_KEY || "" };

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      setUserName(user.name || " ");
      setUserRole(user.role || " ");
    } else {
      setUserName(" ");
      setUserRole(" ");
    }
  }, [hydrated, user]);

  const fetchNotificationCount = useCallback(() => {
    if (!hydrated || !BACKEND_URL || !meId) return;
    axios
      .get(`${BACKEND_URL}/api/notifications`, {
        withCredentials: true,
        headers,
      })
      .then((res) => {
        const list = res?.data?.notifications || res?.data?.message || [];
        setNotificationCount(
          Array.isArray(list) ? list.length : list?.length || 0
        );
      })
      .catch((err) => console.error("Error fetching notification count", err));
  }, [BACKEND_URL, meId, headers, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 60000);
    return () => clearInterval(interval);
  }, [fetchNotificationCount, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      setAvatar(null);
      setOrgName("Loading...");
      return;
    }

    let mounted = true;
    let objectUrl = null;

    const defaultAvatar = (role, gender) =>
      role === "Admin"
        ? "/images/admin-avatar.png"
        : gender === "Female"
        ? "/images/female-avatar.jpeg"
        : "/images/male-avatar.jpeg";

    const defaultPath = defaultAvatar(
      user?.role,
      user?.gender ?? user?.dashboard?.gender
    );

    const normalizeInputUrl = (maybe) => {
      if (!maybe) return null;
      if (Array.isArray(maybe))
        return maybe.length > 0 ? normalizeInputUrl(maybe[0]) : null;
      if (typeof maybe === "object") {
        return maybe.url || maybe.path || maybe.file || null;
      }
      if (typeof maybe === "string") {
        const s = maybe.trim();
        if (!s) return null;
        try {
          const parsed = JSON.parse(decodeURIComponent(s));
          return normalizeInputUrl(Array.isArray(parsed) ? parsed[0] : parsed);
        } catch {
          return s;
        }
      }
      return null;
    };

    const buildFetchUrl = (url) => {
      const u = normalizeInputUrl(url);
      if (!u) return null;
      if (/^https?:\/\//i.test(u)) return u;
      const base = BACKEND_URL.replace(/\/+$/g, "");
      return u.startsWith("/docs")
        ? `${base}${u}`
        : `${base}/docs${u.startsWith("/") ? u : `/${u}`}`;
    };

    const dashboard = user?.dashboard ?? {};
    const photoUrl = dashboard.photoUrl ?? dashboard.photo_url ?? null;

    if (!user) {
      setAvatar(defaultPath);
      setOrgName("Unknown Organization");
      return;
    }

    const fetchPhoto = async () => {
      if (!photoUrl) return mounted && setAvatar(defaultPath);
      const fetchUrl = buildFetchUrl(photoUrl);
      if (!fetchUrl) return mounted && setAvatar(defaultPath);

      try {
        const resp = await axios.get(fetchUrl, {
          withCredentials: true,
          headers,
          responseType: "blob",
        });
        if (!mounted) return;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(resp.data);
        setAvatar(objectUrl);
      } catch {
        mounted && setAvatar(defaultPath);
      }
    };

    fetchPhoto();

    (async () => {
      const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
      if (!orgId || !BACKEND_URL) return setOrgName("Unknown Organization");
      try {
        const resp = await axios.get(`${BACKEND_URL}/org/${orgId}`, {
          withCredentials: true,
          headers: { "x-api-key": API_KEY || "", "x-employee-id": meId || "0" },
        });
        setOrgName(
          resp?.data?.subdomain
            ? String(resp.data.subdomain)
            : "Unknown Organization"
        );
      } catch {
        setOrgName("Unknown Organization");
      }
    })();

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [hydrated, user, BACKEND_URL, API_KEY, meId]);

  const portalRoot =
    typeof document !== "undefined"
      ? document.getElementById("portal-root")
      : null;
  const wrapperRef = useRef(null);
  const notifRef = useRef(null);
  const calToggleRef = useRef(null);

  const getCalendarNode = () => {
    if (portalRoot) {
      const node = portalRoot.querySelector(
        ".desktop-calendar-overlay, .mobile-calendar-overlay, .calendar-dropdown-inline"
      );
      if (node) return node;
    }
    return document.querySelector(
      ".calendar-dropdown-inline, .mobile-calendar-overlay, .desktop-calendar-overlay"
    );
  };

  useEffect(() => {
    const onClick = (e) => {
      if (!showCalendar) return;
      const calendarNode = getCalendarNode();
      const target = e.target;
      if (calendarNode?.contains(target)) return;
      if (calToggleRef.current?.contains(target)) return;
      if (notifRef.current?.contains(target)) return;
      setShowCalendar(false);
      setPendingNotifications(false);
    };

    const onEsc = (e) =>
      e.key === "Escape" &&
      showCalendar &&
      (setShowCalendar(false), setPendingNotifications(false));

    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showCalendar, portalRoot]);

  const handleNotificationClick = () => {
    fetchNotificationCount();
    if (pendingNotifications) return;
    if (showCalendar) {
      setPendingNotifications(true);
      setShowCalendar(false);
      return;
    }
    setShowNotifications((v) => !v);
  };

  const handleNotificationKeyDown = (e) =>
    e.key === "Enter" && handleNotificationClick();

  useEffect(() => {
    if (pendingNotifications && !showCalendar) {
      setShowNotifications(true);
      setPendingNotifications(false);
    }
  }, [pendingNotifications, showCalendar]);

  const handleCalendarToggle = () => {
    if (showNotifications) setShowNotifications(false);
    setPendingNotifications(false);
    setShowCalendar((s) => !s);
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleLogout = async () => {
    try {
      router.replace("/");
      await logout({ redirect: true, reason: "user-initiated" });
    } catch (err) {
      console.warn("logout error (child)", err);
      try {
        router.replace("/");
      } catch (e) {}
    }
  };

  const mobileProps = {
    userName,
    userRole,
    avatar,
    orgName,
    notificationCount,
    showCalendar,
    setShowCalendar,
    showNotifications,
    setShowNotifications,
    handleNotificationClick,
    handleCalendarToggle,
    fetchNotificationCount,
    logout,
    portalRoot,
    calToggleRef,
    notifRef,
    onLogout: handleLogout,
  };

  return isMobile ? (
    <MobileTopbar {...mobileProps} />
  ) : (
    <div className="topbar1" ref={wrapperRef}>
      <div className="profile-section">
        {avatar ? (
          <img src={avatar} alt="Profile" className="profile-img" />
        ) : (
          <div className="profile-placeholder" />
        )}
        <div className="profile-info">
          <span className="profile-namedash">{userName}</span>
          <span className="profile-designation">{userRole}</span>
        </div>
      </div>

      <div className="org-name-section">
        <div className="org-name-text">
          {userRole !== "SuperAdmin" && (
            <span>{String(orgName || "").toUpperCase()}</span>
          )}
        </div>
      </div>

      <div className="icon-section">
        <div
          className="notification-icon"
          role="button"
          tabIndex={0}
          ref={notifRef}
          onClick={handleNotificationClick}
          onKeyDown={handleNotificationKeyDown}
        >
          <FontAwesomeIcon icon={faBell} className="fa-icon" />
          {notificationCount > 0 && (
            <span className="notification-badge">{notificationCount}</span>
          )}
        </div>

        <Notifications
          visible={showNotifications}
          onClose={() => setShowNotifications(false)}
          onRead={() => fetchNotificationCount()}
        />

        <div
          role="button"
          tabIndex={0}
          aria-label="Toggle calendar"
          className="calendar-toggle"
          ref={calToggleRef}
          onClick={handleCalendarToggle}
          onKeyDown={(e) => e.key === "Enter" && handleCalendarToggle()}
        >
          <FontAwesomeIcon icon={faCalendarAlt} className="fa-icon" />
        </div>

        {showCalendar &&
          (portalRoot ? (
            ReactDOM.createPortal(
              <div className="desktop-calendar-overlay">
                <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
              </div>,
              portalRoot
            )
          ) : (
            <div className="calendar-dropdown-inline">
              <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
            </div>
          ))}

        <div
          role="button"
          tabIndex={0}
          onClick={handleLogout}
          onKeyDown={(e) => e.key === "Enter" && handleLogout()}
          onMouseEnter={() => {
            try {
              router?.prefetch?.("/");
            } catch {}
          }}
          onTouchStart={() => {
            try {
              router?.prefetch?.("/");
            } catch {}
          }}
        >
          <FontAwesomeIcon icon={faPowerOff} className="fa-icon" />
        </div>
      </div>
    </div>
  );
}
