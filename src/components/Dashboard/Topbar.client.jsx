

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
  faBirthdayCake,
  faGift,
} from "@fortawesome/free-solid-svg-icons";
import "./Topbar.css";
import { useAuth } from "../../context/AuthProvider.client";

function parseAllowedOrigins(raw) {
  return (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const formatOrgName = (name) => {
  return (name || "")
    .toLowerCase()
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
};

function resolveParentOrigin(allowedOrigins) {
  if (!allowedOrigins || allowedOrigins.length === 0) {
    return null;
  }

  try {
    if (
      typeof document !== "undefined" &&
      document.referrer
    ) {
      try {
        const ref = new URL(document.referrer).origin;

        if (allowedOrigins.includes(ref)) {
          return ref;
        }
      } catch (e) {}
    }
  } catch (e) {}

  return allowedOrigins[0] || null;
}

/* -------------------------------------------------------------------------- */
/* Celebration helpers                                                        */
/* -------------------------------------------------------------------------- */

function getCelebrationName(item) {
  return (
    item?.full_name ||
    item?.fullName ||
    item?.name ||
    item?.employee_name ||
    item?.employeeName ||
    [item?.first_name, item?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Employee"
  );
}

function getOrdinalSuffix(number) {
  const n = Number(number);

  if (n % 100 >= 11 && n % 100 <= 13) {
    return "th";
  }

  switch (n % 10) {
    case 1:
      return "st";

    case 2:
      return "nd";

    case 3:
      return "rd";

    default:
      return "th";
  }
}

function createCelebrationText(item) {
  if (!item) return null;

  if (item.message) {
    return item.message;
  }

  const name = getCelebrationName(item);

  const type = String(
    item.type ||
      item.celebration_type ||
      item.celebrationType ||
      ""
  )
    .trim()
    .toLowerCase();

  if (
    type === "work_anniversary" ||
    type === "work anniversary" ||
    type === "work-anniversary" ||
    type === "anniversary"
  ) {
    const years = Number(
      item.completed_years ??
        item.completedYears ??
        item.years_completed ??
        item.years ??
        0
    );

    const suffix = getOrdinalSuffix(years);

    return `Today is ${name}'s ${years}${suffix} Work Anniversary. Wish them!`;
  }

  return `Today is ${name}'s Birthday. Wish them!`;
}

function getCelebrationIcon(item) {
  const type = String(
    item?.type ||
      item?.celebration_type ||
      item?.celebrationType ||
      ""
  )
    .trim()
    .toLowerCase();

  if (
    type === "work_anniversary" ||
    type === "work anniversary" ||
    type === "work-anniversary" ||
    type === "anniversary"
  ) {
    return faGift;
  }

  return faBirthdayCake;
}

/* -------------------------------------------------------------------------- */
/* Celebration banner                                                         */
/* -------------------------------------------------------------------------- */

function CelebrationPill({ celebration }) {
  if (!celebration) return null;

  const name = getCelebrationName(celebration);

  const type = String(
    celebration?.type ||
      celebration?.celebration_type ||
      celebration?.celebrationType ||
      ""
  )
    .trim()
    .toLowerCase();

  const isAnniversary =
    type === "work_anniversary" ||
    type === "work anniversary" ||
    type === "work-anniversary" ||
    type === "anniversary";

  if (isAnniversary) {
    const years = Number(
      celebration.completed_years ??
        celebration.completedYears ??
        celebration.years_completed ??
        celebration.years ??
        0
    );

    return (
      <div
        className="celebration-pill-anniversary"
        title={`${name}'s ${years} ${
          years === 1 ? "Year" : "Years"
        } with Us`}
      >
        <span className="pill-sparkle pill-sparkle-1">
          ✨
        </span>

        <span className="pill-sparkle pill-sparkle-2">
          ✦
        </span>

        <div className="pill-icon">🎉</div>

        <span className="pill-name">
          {name} • {years}{" "}
          {years === 1 ? "Year" : "Years"} with Us
        </span>

        <span className="pill-sparkle pill-sparkle-3">
          ✨
        </span>
      </div>
    );
  }

  return (
    <div
      className="celebration-pill-birthday"
      title={`${name}'s Birthday Today`}
    >
      <span className="pill-sparkle pill-sparkle-1">
        ✨
      </span>

      <span className="pill-sparkle pill-sparkle-2">
        ✦
      </span>

      <div className="pill-icon">🎂</div>

      <span className="pill-name">
        {name} • Birthday Today!
      </span>

      <span className="pill-sparkle pill-sparkle-3">
        ✨
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile Topbar                                                              */
/* -------------------------------------------------------------------------- */

function MobileTopbar(props) {
  const {
    userName,
    userRole,
    avatar,
    orgName,
    celebration,
    notificationCount,
    showCalendar,
    setShowCalendar,
    showNotifications,
    setShowNotifications,
    handleNotificationClick,
    handleCalendarToggle,
    fetchNotificationCount,
    portalRoot,
    calToggleRef,
    notifRef,
    onLogout,
  } = props;

  return (
    <div className="mobile-topbar-v2">
      {/* Organization name always remains visible */}
      <div className="mobile-header-colored">
        <div className="mobile-org-card">
          <span>
            {formatOrgName(orgName)}
          </span>
        </div>

        {/* Only OTHER employees' celebrations are passed here */}
        {celebration && (
          <div className="mobile-celebration-wrapper">
            <CelebrationPill
              celebration={celebration}
            />
          </div>
        )}
      </div>

      <div className="mobile-main-row">
        <div className="mobile-profile-card">
          {avatar ? (
            <img
              src={avatar}
              alt="Profile"
              className="mobile-avatar"
            />
          ) : (
            <div className="mobile-avatar-placeholder">
              <span>
                {userName?.charAt(0)?.toUpperCase() ||
                  "U"}
              </span>
            </div>
          )}

          <div className="mobile-user-info">
            <div className="mobile-user-name">
              {userName}
            </div>

            <div className="mobile-user-role">
              {userRole}
            </div>
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
              <span className="mobile-badge">
                {notificationCount}
              </span>
            )}
          </button>

          <button
            ref={calToggleRef}
            onClick={handleCalendarToggle}
            className="mobile-action-btn"
            aria-label="Calendar"
          >
            <FontAwesomeIcon
              icon={faCalendarAlt}
            />
          </button>

          <button
            onClick={onLogout}
            className="mobile-action-btn mobile-logout-btn"
            aria-label="Logout"
          >
            <FontAwesomeIcon
              icon={faPowerOff}
            />
          </button>
        </div>
      </div>

      <Notifications
        visible={showNotifications}
        onClose={() =>
          setShowNotifications(false)
        }
        onRead={() =>
          fetchNotificationCount()
        }
      />

      {showCalendar &&
        (portalRoot ? (
          ReactDOM.createPortal(
            <div className="mobile-calendar-overlay">
              <HolidayCalendar
                closeCalendar={() =>
                  setShowCalendar(false)
                }
              />
            </div>,
            portalRoot
          )
        ) : (
          <div className="mobile-calendar-inline">
            <HolidayCalendar
              closeCalendar={() =>
                setShowCalendar(false)
              }
            />
          </div>
        ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Topbar                                                                */
/* -------------------------------------------------------------------------- */

export default function Topbar() {
  const router = useRouter();

  const {
    user,
    logout,
    hydrated,
  } = useAuth();

  const [isMobile, setIsMobile] =
    useState(false);

  const [userName, setUserName] =
    useState(" ");

  const [userRole, setUserRole] =
    useState(" ");

  const [notificationCount, setNotificationCount] =
    useState(0);

  const [showCalendar, setShowCalendar] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [pendingNotifications, setPendingNotifications] =
    useState(false);

  const [avatar, setAvatar] =
    useState(null);

  const [orgName, setOrgName] =
    useState("Loading...");

  /* Celebration */
  const [celebrations, setCelebrations] =
    useState([]);

  const [celebrationIndex, setCelebrationIndex] =
    useState(0);

  const API_KEY =
    process.env.NEXT_PUBLIC_API_KEY;

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL;

  const allowedIframeOrigins = useMemo(
    () =>
      parseAllowedOrigins(
        process.env
          .NEXT_PUBLIC_ALLOWED_IFRAME_ORIGINS
      ),
    []
  );

  const parentOriginCandidate = useMemo(
    () =>
      resolveParentOrigin(
        allowedIframeOrigins
      ),
    [allowedIframeOrigins]
  );

  useEffect(() => {
    try {
      router?.prefetch?.("/");
    } catch (e) {}
  }, [router]);

  /* ---------------------------------------------------------------------- */
  /* Current employee                                                        */
  /* ---------------------------------------------------------------------- */

  const meId =
    user?.employeeId ??
    user?.employee_id ??
    user?.id ??
    user?.raw?.employeeId ??
    user?.raw?.employee_id ??
    user?.raw?.id ??
    null;

  const orgId =
    user?.orgId ??
    user?.org_id ??
    user?.raw?.org_id ??
    user?.organisation_id ??
    user?.organization_id ??
    user?.raw?.organisation_id ??
    user?.raw?.organization_id ??
    user?.raw?.orgId ??
    null;

  const email =
    user?.email ??
    user?.raw?.email ??
    user?.dashboard?.email ??
    user?.employee_email ??
    user?.raw?.employee_email ??
    null;

  const headers = meId
    ? {
        "x-api-key": API_KEY || "",
        "x-employee-id": meId,
        ...(orgId
          ? { "x-org-id": orgId }
          : {}),
      }
    : {
        "x-api-key": API_KEY || "",
        ...(orgId
          ? { "x-org-id": orgId }
          : {}),
      };

  /* ---------------------------------------------------------------------- */
  /* User information                                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!hydrated) return;

    if (user) {
      setUserName(
        user.name || " "
      );

      setUserRole(
        user.role || " "
      );
    } else {
      setUserName(" ");
      setUserRole(" ");
    }
  }, [hydrated, user]);

  /* ---------------------------------------------------------------------- */
  /* Notifications                                                          */
  /* ---------------------------------------------------------------------- */

  const fetchNotificationCount =
    useCallback(() => {
      if (
        !hydrated ||
        !BACKEND_URL ||
        !meId
      ) {
        return;
      }

      const headersLocal = {
        "x-api-key": API_KEY || "",
      };

      if (meId) {
        headersLocal[
          "x-employee-id"
        ] = meId;
      }

      if (orgId) {
        headersLocal[
          "x-org-id"
        ] = orgId;
      }

      const url =
        `${BACKEND_URL.replace(
          /\/+$/,
          ""
        )}/api/notifications` +
        (orgId
          ? `?orgId=${encodeURIComponent(
              orgId
            )}`
          : "");

      axios
        .get(url, {
          withCredentials: true,
          headers: headersLocal,
        })
        .then((res) => {
          const list =
            res?.data?.notifications ||
            res?.data?.message ||
            [];

          setNotificationCount(
            Array.isArray(list)
              ? list.length
              : list?.length || 0
          );
        })
        .catch((err) => {
          console.error(
            "Error fetching notification count",
            err
          );
        });
    }, [
      BACKEND_URL,
      API_KEY,
      meId,
      orgId,
      hydrated,
    ]);

  useEffect(() => {
    if (!hydrated) return;

    fetchNotificationCount();

    const interval = setInterval(
      fetchNotificationCount,
      60000
    );

    return () =>
      clearInterval(interval);
  }, [
    fetchNotificationCount,
    hydrated,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Birthday / Work Anniversary                                            */
  /* ---------------------------------------------------------------------- */

  const fetchCelebrations =
    useCallback(async () => {
      if (
        !hydrated ||
        !BACKEND_URL ||
        !email ||
        !orgId
      ) {
        setCelebrations([]);
        setCelebrationIndex(0);
        return;
      }

      try {
        const url =
          `${BACKEND_URL.replace(
            /\/+$/,
            ""
          )}/api/employee/birthday/${encodeURIComponent(
            email
          )}`;

        const response =
          await axios.get(url, {
            withCredentials: true,
            headers: {
              "x-api-key":
                API_KEY || "",

              "x-employee-id":
                meId || "0",

              "x-org-id": orgId,
            },
          });

        const data =
          response?.data || {};

        /* Expected:
         *
         * {
         *   myCelebrations: [],
         *   otherCelebrations: []
         * }
         */

        const others = Array.isArray(
          data.otherCelebrations
        )
          ? data.otherCelebrations
          : Array.isArray(
              data.other_celebrations
            )
            ? data.other_celebrations
            : Array.isArray(
                data?.data?.otherCelebrations
              )
              ? data.data
                  .otherCelebrations
              : Array.isArray(
                  data?.data
                    ?.other_celebrations
                )
                ? data.data
                    .other_celebrations
                : [];

        /* -------------------------------------------------------------- */
        /* IMPORTANT                                                       */
        /* -------------------------------------------------------------- */

        const currentEmail = String(
          email || ""
        )
          .trim()
          .toLowerCase();

        const currentId = String(
          meId || ""
        ).trim();

        const filteredOthers =
          others.filter((item) => {
            const itemEmail =
              String(
                item?.email ??
                  item?.employee_email ??
                  item?.employeeEmail ??
                  ""
              )
                .trim()
                .toLowerCase();

            const itemId =
              String(
                item?.employee_id ??
                  item?.employeeId ??
                  item?.emp_id ??
                  item?.empId ??
                  item?.user_id ??
                  item?.userId ??
                  item?.id ??
                  ""
              ).trim();

            const isSelf =
              item?.is_self === true ||
              item?.is_self === 1 ||
              item?.is_self === "1" ||
              String(
                item?.is_self ?? ""
              ).toLowerCase() ===
                "true" ||
              item?.isSelf === true ||
              item?.isSelf === 1 ||
              item?.isSelf === "1" ||
              String(
                item?.isSelf ?? ""
              ).toLowerCase() ===
                "true";

            if (isSelf) {
              return false;
            }

            if (
              currentEmail &&
              itemEmail &&
              currentEmail ===
                itemEmail
            ) {
              return false;
            }

            if (
              currentId &&
              itemId &&
              currentId === itemId
            ) {
              return false;
            }

            return true;
          });

        console.log(
          "Topbar other celebrations:",
          filteredOthers
        );

        setCelebrations(
          filteredOthers
        );

        setCelebrationIndex(0);
      } catch (error) {
        console.error(
          "Error fetching birthday/work anniversary:",
          error
        );

        setCelebrations([]);
        setCelebrationIndex(0);
      }
    }, [
      hydrated,
      BACKEND_URL,
      API_KEY,
      email,
      orgId,
      meId,
    ]);

  useEffect(() => {
    if (!hydrated) return;

    fetchCelebrations();

    const interval = setInterval(
      fetchCelebrations,
      60 * 60 * 1000
    );

    return () =>
      clearInterval(interval);
  }, [
    fetchCelebrations,
    hydrated,
  ]);

  useEffect(() => {
    if (
      celebrations.length <= 1
    ) {
      return;
    }

    const interval = setInterval(
      () => {
        setCelebrationIndex(
          (current) =>
            (current + 1) %
            celebrations.length
        );
      },
      8000
    );

    return () =>
      clearInterval(interval);
  }, [
    celebrations.length,
  ]);

  const currentCelebration =
    celebrations.length > 0
      ? celebrations[
          celebrationIndex %
            celebrations.length
        ]
      : null;

  /* ---------------------------------------------------------------------- */
  /* Avatar + Organization                                                  */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!hydrated) {
      setAvatar(null);
      setOrgName("Loading...");
      return;
    }

    let mounted = true;
    let objectUrl = null;

    const defaultAvatar = (
      role,
      gender
    ) =>
      role === "Admin"
        ? "/images/admin-avatar.png"
        : gender === "Female"
          ? "/images/female-avatar.jpeg"
          : "/images/male-avatar.jpeg";

    const defaultPath =
      defaultAvatar(
        user?.role,
        user?.gender ??
          user?.dashboard?.gender
      );

    const normalizeInputUrl =
      (maybe) => {
        if (!maybe) return null;

        if (Array.isArray(maybe)) {
          return maybe.length > 0
            ? normalizeInputUrl(
                maybe[0]
              )
            : null;
        }

        if (
          typeof maybe ===
          "object"
        ) {
          if (
            typeof maybe.url ===
              "string" &&
            maybe.url
          ) {
            return maybe.url;
          }

          if (
            typeof maybe.path ===
              "string" &&
            maybe.path
          ) {
            return maybe.path;
          }

          if (
            typeof maybe.file ===
              "string" &&
            maybe.file
          ) {
            return maybe.file;
          }

          if (
            typeof maybe.photoUrl ===
              "string" &&
            maybe.photoUrl
          ) {
            return maybe.photoUrl;
          }

          if (
            typeof maybe.photo_url ===
              "string" &&
            maybe.photo_url
          ) {
            return maybe.photo_url;
          }

          if (
            typeof maybe.avatar ===
              "string" &&
            maybe.avatar
          ) {
            return maybe.avatar;
          }

          if (
            typeof maybe.image ===
              "string" &&
            maybe.image
          ) {
            return maybe.image;
          }

          if (
            Object.keys(maybe)
              .length === 0
          ) {
            return null;
          }

          for (const k of [
            "link",
            "href",
            "download",
          ]) {
            if (
              typeof maybe[k] ===
                "string" &&
              maybe[k]
            ) {
              return maybe[k];
            }
          }

          return null;
        }

        if (
          typeof maybe ===
          "string"
        ) {
          const s =
            maybe.trim();

          if (!s) return null;

          try {
            const parsed =
              JSON.parse(s);

            return normalizeInputUrl(
              Array.isArray(
                parsed
              )
                ? parsed[0]
                : parsed
            );
          } catch {
            return s;
          }
        }

        try {
          return String(
            maybe
          );
        } catch {
          return null;
        }
      };

    const buildFetchUrl = (
      url
    ) => {
      const u =
        normalizeInputUrl(url);

      if (!u) return null;

      if (
        /^https?:\/\//i.test(
          u
        )
      ) {
        return u;
      }

      const base =
        BACKEND_URL.replace(
          /\/+$/g,
          ""
        );

      return u.startsWith(
        "/docs"
      )
        ? `${base}${u}`
        : `${base}/docs${
            u.startsWith("/")
              ? u
              : `/${u}`
          }`;
    };

    const dashboard =
      user?.dashboard ?? {};

    const photoUrl =
      dashboard.photoUrl ||
      dashboard.photo_url ||
      user?.photoUrl ||
      user?.photo_url ||
      user?.raw?.photoUrl ||
      user?.raw?.photo_url ||
      null;

    if (!user) {
      setAvatar(
        defaultPath
      );

      setOrgName(
        "Unknown Organization"
      );

      return;
    }

    const fetchPhoto =
      async () => {
        if (!photoUrl) {
          if (mounted) {
            setAvatar(
              defaultPath
            );
          }

          return;
        }

        const fetchUrl =
          buildFetchUrl(
            photoUrl
          );

        if (!fetchUrl) {
          if (mounted) {
            setAvatar(
              defaultPath
            );
          }

          return;
        }

        try {
          const resp =
            await axios.get(
              fetchUrl,
              {
                withCredentials: true,
                headers,
                responseType:
                  "blob",
              }
            );

          if (!mounted) return;

          if (objectUrl) {
            URL.revokeObjectURL(
              objectUrl
            );
          }

          objectUrl =
            URL.createObjectURL(
              resp.data
            );

          setAvatar(
            objectUrl
          );
        } catch {
          if (mounted) {
            setAvatar(
              defaultPath
            );
          }
        }
      };

    fetchPhoto();

    (async () => {
      const currentOrgId =
        user?.orgId ??
        user?.org_id ??
        user?.raw?.org_id ??
        user?.organisation_id ??
        user?.organization_id ??
        user?.raw
          ?.organisation_id ??
        user?.raw
          ?.organization_id ??
        null;

      if (
        !currentOrgId ||
        !BACKEND_URL
      ) {
        setOrgName(
          "Unknown Organization"
        );

        return;
      }

      try {
        const resp =
          await axios.get(
            `${BACKEND_URL}/org/${currentOrgId}`,
            {
              withCredentials: true,

              headers: {
                "x-api-key":
                  API_KEY || "",

                "x-employee-id":
                  meId || "0",

                "x-org-id":
                  currentOrgId,
              },
            }
          );

        if (!mounted) return;

        setOrgName(
          resp?.data
            ?.subdomain
            ? String(
                resp.data
                  .subdomain
              )
            : resp?.data?.name
              ? String(
                  resp.data.name
                )
              : "Unknown Organization"
        );
      } catch {
        if (mounted) {
          setOrgName(
            "Unknown Organization"
          );
        }
      }
    })();

    return () => {
      mounted = false;

      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl
        );
      }
    };
  }, [
    hydrated,
    user,
    BACKEND_URL,
    API_KEY,
    meId,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Calendar                                                               */
  /* ---------------------------------------------------------------------- */

  const portalRoot =
    typeof document !==
    "undefined"
      ? document.getElementById(
          "portal-root"
        )
      : null;

  const wrapperRef =
    useRef(null);

  const notifRef =
    useRef(null);

  const calToggleRef =
    useRef(null);

  const getCalendarNode =
    () => {
      if (portalRoot) {
        const node =
          portalRoot.querySelector(
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
      if (!showCalendar) {
        return;
      }

      const calendarNode =
        getCalendarNode();

      const target =
        e.target;

      if (
        calendarNode?.contains(
          target
        )
      ) {
        return;
      }

      if (
        calToggleRef.current?.contains(
          target
        )
      ) {
        return;
      }

      if (
        notifRef.current?.contains(
          target
        )
      ) {
        return;
      }

      setShowCalendar(false);
      setPendingNotifications(
        false
      );
    };

    const onEsc = (e) => {
      if (
        e.key ===
          "Escape" &&
        showCalendar
      ) {
        setShowCalendar(false);
        setPendingNotifications(
          false
        );
      }
    };

    document.addEventListener(
      "mousedown",
      onClick
    );

    document.addEventListener(
      "touchstart",
      onClick
    );

    document.addEventListener(
      "keydown",
      onEsc
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        onClick
      );

      document.removeEventListener(
        "touchstart",
        onClick
      );

      document.removeEventListener(
        "keydown",
        onEsc
      );
    };
  }, [
    showCalendar,
    portalRoot,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Notification / Calendar controls                                       */
  /* ---------------------------------------------------------------------- */

  const handleNotificationClick =
    () => {
      fetchNotificationCount();

      if (
        pendingNotifications
      ) {
        return;
      }

      if (showCalendar) {
        setPendingNotifications(
          true
        );

        setShowCalendar(false);

        return;
      }

      setShowNotifications(
        (v) => !v
      );
    };

  const handleNotificationKeyDown =
    (e) => {
      if (
        e.key === "Enter"
      ) {
        handleNotificationClick();
      }
    };

  useEffect(() => {
    if (
      pendingNotifications &&
      !showCalendar
    ) {
      setShowNotifications(
        true
      );

      setPendingNotifications(
        false
      );
    }
  }, [
    pendingNotifications,
    showCalendar,
  ]);

  const handleCalendarToggle =
    () => {
      if (
        showNotifications
      ) {
        setShowNotifications(
          false
        );
      }

      setPendingNotifications(
        false
      );

      setShowCalendar(
        (s) => !s
      );
    };

  /* ---------------------------------------------------------------------- */
  /* Responsive                                                             */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const check = () => {
      setIsMobile(
        window.innerWidth <=
          768
      );
    };

    check();

    window.addEventListener(
      "resize",
      check
    );

    return () =>
      window.removeEventListener(
        "resize",
        check
      );
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Logout                                                                 */
  /* ---------------------------------------------------------------------- */

  const handleLogout =
    async () => {
      try {
        router.replace("/");

        await logout({
          redirect: true,
          reason:
            "user-initiated",
        });
      } catch (err) {
        console.warn(
          "logout error (child)",
          err
        );

        try {
          router.replace("/");
        } catch (e) {}
      }
    };

  /* ---------------------------------------------------------------------- */
  /* Mobile props                                                           */
  /* ---------------------------------------------------------------------- */

  const mobileProps = {
    userName,
    userRole,
    avatar,
    orgName,

    /*
     * This is already filtered to ONLY other employees.
     */
    celebration:
      currentCelebration,

    notificationCount,

    showCalendar,
    setShowCalendar,

    showNotifications,
    setShowNotifications,

    handleNotificationClick,
    handleCalendarToggle,

    fetchNotificationCount,

    portalRoot,

    calToggleRef,
    notifRef,

    onLogout:
      handleLogout,
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return isMobile ? (
    <MobileTopbar
      {...mobileProps}
    />
  ) : (
    <div
      className={`topbar1 ${
        currentCelebration
          ? "topbar1-has-celebration"
          : ""
      }`}
      ref={wrapperRef}
    >
      {/* --------------------------------------------------------------- */}
      {/* Profile - left                                                   */}
      {/* --------------------------------------------------------------- */}

      <div className="profile-section">
        {avatar ? (
          <img
            src={avatar}
            alt="Profile"
            className="profile-img"
          />
        ) : (
          <div className="profile-placeholder" />
        )}

        <div className="profile-info">
          <span className="profile-namedash">
            {userName}
          </span>

          <span className="profile-designation">
            {userRole}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* Middle                                                           */}
      {/* --------------------------------------------------------------- */}

      <div className="topbar-middle">
        {/* Empty left spacer keeps organization name centered */}
        <div
          aria-hidden="true"
        />

        <div className="org-name-section">
          <div className="org-name-text">
            {userRole !==
              "SuperAdmin" && (
              <span>
                {formatOrgName(
                  orgName
                )}
              </span>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* ONLY OTHER EMPLOYEES' CELEBRATIONS                          */}
        {/* ----------------------------------------------------------- */}

        {currentCelebration ? (
          <div className="topbar-celebration-section">
            <div className="topbar-celebration-viewport">
              <div
                className="topbar-celebration-track"
                style={{
                  animationDuration: `${Math.max(
                    celebrations.length * 3,
                    6
                  )}s`,
                }}
              >
                {celebrations.map(
                  (
                    celebration,
                    index
                  ) => (
                    <div
                      className="topbar-celebration-item"
                      key={`${celebration?.employee_id || celebration?.employeeId || celebration?.email || celebration?.name}-${index}`}
                    >
                      <CelebrationPill
                        celebration={
                          celebration
                        }
                      />
                    </div>
                  )
                )}

                {/* First item duplicated for seamless looping */}
                {celebrations.length >
                  1 && (
                  <div
                    className="topbar-celebration-item"
                    aria-hidden="true"
                  >
                    <CelebrationPill
                      celebration={
                        celebrations[0]
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            aria-hidden="true"
          />
        )}
      </div>

      {/* --------------------------------------------------------------- */}
      {/* Icons - right                                                    */}
      {/* --------------------------------------------------------------- */}

      <div className="icon-section">
        <div
          className="notification-icon"
          role="button"
          tabIndex={0}
          ref={notifRef}
          onClick={
            handleNotificationClick
          }
          onKeyDown={
            handleNotificationKeyDown
          }
        >
          <FontAwesomeIcon
            icon={faBell}
            className="fa-icon"
          />

          {notificationCount >
            0 && (
            <span className="notification-badge">
              {
                notificationCount
              }
            </span>
          )}
        </div>

        <Notifications
          visible={
            showNotifications
          }
          onClose={() =>
            setShowNotifications(
              false
            )
          }
          onRead={() =>
            fetchNotificationCount()
          }
        />

        <div
          role="button"
          tabIndex={0}
          aria-label="Toggle calendar"
          className="calendar-toggle"
          ref={calToggleRef}
          onClick={
            handleCalendarToggle
          }
          onKeyDown={(e) =>
            e.key === "Enter" &&
            handleCalendarToggle()
          }
        >
          <FontAwesomeIcon
            icon={faCalendarAlt}
            className="fa-icon"
          />
        </div>

        {showCalendar &&
          (portalRoot ? (
            ReactDOM.createPortal(
              <div className="desktop-calendar-overlay">
                <HolidayCalendar
                  closeCalendar={() =>
                    setShowCalendar(
                      false
                    )
                  }
                />
              </div>,
              portalRoot
            )
          ) : (
            <div className="calendar-dropdown-inline">
              <HolidayCalendar
                closeCalendar={() =>
                  setShowCalendar(
                    false
                  )
                }
              />
            </div>
          ))}

        <div
          role="button"
          tabIndex={0}
          aria-label="Logout"
          onClick={
            handleLogout
          }
          onKeyDown={(e) =>
            e.key === "Enter" &&
            handleLogout()
          }
          onMouseEnter={() => {
            try {
              router?.prefetch?.(
                "/"
              );
            } catch {}
          }}
          onTouchStart={() => {
            try {
              router?.prefetch?.(
                "/"
              );
            } catch {}
          }}
        >
          <FontAwesomeIcon
            icon={faPowerOff}
            className="fa-icon"
          />
        </div>
      </div>
    </div>
  );
}