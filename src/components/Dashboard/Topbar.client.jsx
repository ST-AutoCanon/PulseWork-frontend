// // // // "use client";

// // // // import React, { useEffect, useState, useCallback, useRef } from "react";
// // // // import { useRouter } from "next/navigation";
// // // // import HolidayCalendar from "../HolidayCalendar/HolidayCalendar.client";
// // // // import Notifications from "./Notifications.client";
// // // // import ReactDOM from "react-dom";
// // // // import axios from "axios";
// // // // import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// // // // import {
// // // //   faBell,
// // // //   faCalendarAlt,
// // // //   faPowerOff,
// // // // } from "@fortawesome/free-solid-svg-icons";
// // // // import "./Topbar.css";
// // // // import { useAuth } from "../../context/AuthProvider.client";

// // // // export default function Topbar() {
// // // //   const router = useRouter();
// // // //   const { user, logout, hydrated } = useAuth();

// // // //   const [userName, setUserName] = useState("User");
// // // //   const [userRole, setUserRole] = useState("Role");
// // // //   const [notificationCount, setNotificationCount] = useState(0);
// // // //   const [showCalendar, setShowCalendar] = useState(false);
// // // //   const [showNotifications, setShowNotifications] = useState(false);
// // // //   const [pendingNotifications, setPendingNotifications] = useState(false);
// // // //   const [avatar, setAvatar] = useState(null);
// // // //   const [orgName, setOrgName] = useState("Loading...");

// // // //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// // // //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// // // //   useEffect(() => {}, [hydrated, user]);

// // // //   const meId = user?.employeeId ?? user?.id ?? null;

// // // //   const headers = meId
// // // //     ? { "x-api-key": API_KEY || "", "x-employee-id": meId }
// // // //     : { "x-api-key": API_KEY || "" };

// // // //   useEffect(() => {
// // // //     if (!hydrated) return;
// // // //     if (user) {
// // // //       setUserName(user.name || "User");
// // // //       setUserRole(user.role || "Role");
// // // //     } else {
// // // //       setUserName("User");
// // // //       setUserRole("Role");
// // // //     }
// // // //   }, [hydrated, user]);

// // // //   const fetchNotificationCount = useCallback(() => {
// // // //     if (!hydrated) return;
// // // //     if (!BACKEND_URL || !meId) return;
// // // //     axios
// // // //       .get(`${BACKEND_URL}/api/notifications`, { headers })
// // // //       .then((res) => {
// // // //         const list = res?.data?.notifications || res?.data?.message || [];
// // // //         setNotificationCount(
// // // //           Array.isArray(list) ? list.length : list?.length || 0
// // // //         );
// // // //       })
// // // //       .catch((err) => {
// // // //         console.error("Error fetching notification count", err);
// // // //       });
// // // //   }, [BACKEND_URL, meId, headers, hydrated]);

// // // //   useEffect(() => {
// // // //     if (!hydrated) return;
// // // //     fetchNotificationCount();
// // // //     const interval = setInterval(fetchNotificationCount, 60000);
// // // //     return () => clearInterval(interval);
// // // //   }, [fetchNotificationCount, hydrated]);

// // // //   useEffect(() => {
// // // //     if (!hydrated) {
// // // //       setAvatar(null);
// // // //       setOrgName("Loading...");
// // // //       return;
// // // //     }

// // // //     let mounted = true;
// // // //     let objectUrl = null;

// // // //     const defaultAvatar = (role, gender) =>
// // // //       role === "Admin"
// // // //         ? "/images/admin-avatar.png"
// // // //         : gender === "Female"
// // // //         ? "/images/female-avatar.jpeg"
// // // //         : "/images/male-avatar.jpeg";

// // // //     const defaultPath = defaultAvatar(
// // // //       user?.role,
// // // //       user?.gender ?? user?.dashboard?.gender
// // // //     );

// // // //     const normalizeInputUrl = (maybe) => {
// // // //       if (maybe === undefined || maybe === null) return null;
// // // //       if (Array.isArray(maybe)) {
// // // //         if (maybe.length === 0) return null;
// // // //         return normalizeInputUrl(maybe[0]);
// // // //       }
// // // //       if (typeof maybe === "object") {
// // // //         if (!maybe) return null;
// // // //         if (typeof maybe.url === "string" && maybe.url) return maybe.url;
// // // //         if (typeof maybe.path === "string" && maybe.path) return maybe.path;
// // // //         if (typeof maybe.file === "string" && maybe.file) return maybe.file;
// // // //         for (const k of ["link", "href", "download"]) {
// // // //           if (typeof maybe[k] === "string" && maybe[k]) return maybe[k];
// // // //         }
// // // //         return null;
// // // //       }
// // // //       if (typeof maybe === "string") {
// // // //         const s = maybe.trim();
// // // //         if (!s) return null;
// // // //         if (s.startsWith("[") || s.startsWith("%5B") || s.startsWith("%5b")) {
// // // //           try {
// // // //             const decoded = decodeURIComponent(s);
// // // //             const parsed = JSON.parse(decoded);
// // // //             if (Array.isArray(parsed) && parsed.length > 0)
// // // //               return normalizeInputUrl(parsed[0]);
// // // //             if (typeof parsed === "string") return normalizeInputUrl(parsed);
// // // //           } catch (e) {
// // // //             try {
// // // //               const parsed = JSON.parse(s);
// // // //               if (Array.isArray(parsed) && parsed.length > 0)
// // // //                 return normalizeInputUrl(parsed[0]);
// // // //               if (typeof parsed === "string") return normalizeInputUrl(parsed);
// // // //             } catch (err) {}
// // // //           }
// // // //         }
// // // //         if (s.includes("%22") || s.includes("%5C%22")) {
// // // //           try {
// // // //             const decoded = decodeURIComponent(s);
// // // //             const parsed = JSON.parse(decoded);
// // // //             if (Array.isArray(parsed) && parsed.length > 0)
// // // //               return normalizeInputUrl(parsed[0]);
// // // //             if (typeof parsed === "string") return normalizeInputUrl(parsed);
// // // //           } catch (e) {}
// // // //         }
// // // //         return s;
// // // //       }
// // // //       try {
// // // //         return String(maybe);
// // // //       } catch {
// // // //         return null;
// // // //       }
// // // //     };

// // // //     const buildFetchUrl = (maybeUrl) => {
// // // //       const u = normalizeInputUrl(maybeUrl);
// // // //       if (!u) return null;
// // // //       if (/^https?:\/\//i.test(u)) return u;
// // // //       if (!BACKEND_URL) return null;
// // // //       const base = BACKEND_URL.replace(/\/+$/g, "");
// // // //       if (u.startsWith("/docs")) {
// // // //         return `${base}${u}`;
// // // //       }
// // // //       const path = u.startsWith("/") ? u : `/${u}`;
// // // //       return `${base}/docs${path}`;
// // // //     };

// // // //     const dashboard = user?.dashboard ?? {};
// // // //     const photoUrl = dashboard.photoUrl ?? dashboard.photo_url ?? null;

// // // //     if (!user) {
// // // //       setAvatar(defaultPath);
// // // //       setOrgName("Unknown Organization");
// // // //       return () => {};
// // // //     }

// // // //     const fetchPhoto = async () => {
// // // //       if (!photoUrl) {
// // // //         if (mounted) setAvatar(defaultPath);
// // // //         return;
// // // //       }

// // // //       const fetchUrl = buildFetchUrl(photoUrl);
// // // //       if (!fetchUrl) {
// // // //         if (mounted) setAvatar(defaultPath);
// // // //         return;
// // // //       }

// // // //       try {
// // // //         const resp = await axios.get(fetchUrl, {
// // // //           headers,
// // // //           responseType: "blob",
// // // //         });

// // // //         if (!mounted) return;
// // // //         if (objectUrl) {
// // // //           try {
// // // //             URL.revokeObjectURL(objectUrl);
// // // //           } catch (e) {}
// // // //           objectUrl = null;
// // // //         }
// // // //         objectUrl = URL.createObjectURL(resp.data);
// // // //         setAvatar(objectUrl);
// // // //       } catch (err) {
// // // //         if (mounted) setAvatar(defaultPath);
// // // //       }
// // // //     };

// // // //     fetchPhoto();

// // // //     (async function fetchOrg() {
// // // //       const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
// // // //       if (!orgId || !BACKEND_URL) {
// // // //         setOrgName("Unknown Organization");
// // // //         return;
// // // //       }
// // // //       try {
// // // //         const resp = await axios.get(`${BACKEND_URL}/org/${orgId}`, {
// // // //           headers: { "x-api-key": API_KEY || "", "x-employee-id": meId || "0" },
// // // //         });
// // // //         setOrgName(
// // // //           resp?.data?.Name ? String(resp.data.Name) : "Unknown Organization"
// // // //         );
// // // //       } catch {
// // // //         setOrgName("Unknown Organization");
// // // //       }
// // // //     })();

// // // //     return () => {
// // // //       mounted = false;
// // // //       if (objectUrl) {
// // // //         try {
// // // //           URL.revokeObjectURL(objectUrl);
// // // //         } catch (e) {}
// // // //         objectUrl = null;
// // // //       }
// // // //     };
// // // //   }, [hydrated, user, BACKEND_URL, API_KEY, meId]);

// // // //   const portalRoot =
// // // //     typeof document !== "undefined"
// // // //       ? document.getElementById("portal-root")
// // // //       : null;

// // // //   const wrapperRef = useRef(null);
// // // //   const notifRef = useRef(null);
// // // //   const calToggleRef = useRef(null);

// // // //   const getCalendarNode = () => {
// // // //     if (portalRoot) {
// // // //       const node = portalRoot.querySelector(
// // // //         ".calendar-dropdown, .calendar-dropdown-inline"
// // // //       );
// // // //       if (node) return node;
// // // //     }
// // // //     return document.querySelector(
// // // //       ".calendar-dropdown-inline, .calendar-dropdown"
// // // //     );
// // // //   };

// // // //   useEffect(() => {
// // // //     function onDocumentClick(e) {
// // // //       if (!showCalendar) return;

// // // //       const calendarNode = getCalendarNode();
// // // //       const target = e.target;

// // // //       if (calendarNode && calendarNode.contains(target)) return;

// // // //       if (calToggleRef.current && calToggleRef.current.contains(target)) return;

// // // //       if (notifRef.current && notifRef.current.contains(target)) return;

// // // //       setShowCalendar(false);
// // // //       setPendingNotifications(false);
// // // //     }

// // // //     function onEsc(e) {
// // // //       if (e.key === "Escape" && showCalendar) {
// // // //         setShowCalendar(false);
// // // //         setPendingNotifications(false);
// // // //       }
// // // //     }

// // // //     document.addEventListener("mousedown", onDocumentClick);
// // // //     document.addEventListener("touchstart", onDocumentClick);
// // // //     document.addEventListener("keydown", onEsc);

// // // //     return () => {
// // // //       document.removeEventListener("mousedown", onDocumentClick);
// // // //       document.removeEventListener("touchstart", onDocumentClick);
// // // //       document.removeEventListener("keydown", onEsc);
// // // //     };
// // // //   }, [showCalendar, portalRoot]);

// // // //   const handleNotificationClick = () => {
// // // //     fetchNotificationCount();

// // // //     if (pendingNotifications) return;

// // // //     if (showCalendar) {
// // // //       setPendingNotifications(true);
// // // //       setShowCalendar(false);
// // // //       return;
// // // //     }

// // // //     setShowNotifications((v) => !v);
// // // //   };

// // // //   const handleNotificationKeyDown = (e) => {
// // // //     if (e.key !== "Enter") return;
// // // //     handleNotificationClick();
// // // //   };

// // // //   useEffect(() => {
// // // //     if (pendingNotifications && !showCalendar) {
// // // //       setShowNotifications(true);
// // // //       setPendingNotifications(false);
// // // //     }
// // // //   }, [pendingNotifications, showCalendar]);

// // // //   const handleCalendarToggle = () => {
// // // //     if (showNotifications) setShowNotifications(false);
// // // //     setPendingNotifications(false);
// // // //     setShowCalendar((s) => !s);
// // // //   };

// // // //   return (
// // // //     <div className="topbar1" ref={wrapperRef}>
// // // //       <div className="profile-section">
// // // //         {avatar ? (
// // // //           <img src={avatar} alt="Profile" className="profile-img" />
// // // //         ) : (
// // // //           <div className="profile-placeholder" />
// // // //         )}
// // // //         <div className="profile-info">
// // // //           <span className="profile-namedash">{userName}</span>
// // // //           <span className="profile-designation">{userRole}</span>
// // // //         </div>
// // // //       </div>

// // // //       <div className="org-name-section">
// // // //         <span className="org-name-gradient">
// // // //           {String(orgName || "").toUpperCase()}
// // // //         </span>
// // // //       </div>

// // // //       <div className="icon-section">
// // // //         <div
// // // //           className="notification-icon"
// // // //           role="button"
// // // //           tabIndex={0}
// // // //           ref={notifRef}
// // // //           onClick={handleNotificationClick}
// // // //           onKeyDown={handleNotificationKeyDown}
// // // //         >
// // // //           <FontAwesomeIcon icon={faBell} className="fa-icon" />
// // // //           {notificationCount > 0 && (
// // // //             <span className="notification-badge">{notificationCount}</span>
// // // //           )}
// // // //         </div>

// // // //         <Notifications
// // // //           visible={showNotifications}
// // // //           onClose={() => setShowNotifications(false)}
// // // //           onRead={() => fetchNotificationCount()}
// // // //         />

// // // //         <div
// // // //           role="button"
// // // //           tabIndex={0}
// // // //           aria-label="Toggle calendar"
// // // //           className="calendar-toggle"
// // // //           ref={calToggleRef}
// // // //           onClick={handleCalendarToggle}
// // // //           onKeyDown={(e) => {
// // // //             if (e.key === "Enter") handleCalendarToggle();
// // // //           }}
// // // //         >
// // // //           <FontAwesomeIcon icon={faCalendarAlt} className="fa-icon" />
// // // //         </div>

// // // //         {showCalendar &&
// // // //           (portalRoot ? (
// // // //             ReactDOM.createPortal(
// // // //               <div className="calendar-dropdown">
// // // //                 <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// // // //               </div>,
// // // //               portalRoot
// // // //             )
// // // //           ) : (
// // // //             <div className="calendar-dropdown-inline">
// // // //               <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// // // //             </div>
// // // //           ))}

// // // //         <div
// // // //           role="button"
// // // //           tabIndex={0}
// // // //           onClick={() => {
// // // //             setTimeout(() => logout({ redirect: true }), 0);
// // // //           }}
// // // //           onKeyDown={(e) => {
// // // //             if (e.key === "Enter") logout({ redirect: true });
// // // //           }}
// // // //         >
// // // //           <FontAwesomeIcon icon={faPowerOff} className="fa-icon" />
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }

// // // "use client";

// // // import React, { useEffect, useState, useCallback, useRef } from "react";
// // // import { useRouter } from "next/navigation";
// // // import HolidayCalendar from "../HolidayCalendar/HolidayCalendar.client";
// // // import Notifications from "./Notifications.client";
// // // import ReactDOM from "react-dom";
// // // import axios from "axios";
// // // import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// // // import {
// // //   faBell,
// // //   faCalendarAlt,
// // //   faPowerOff,
// // // } from "@fortawesome/free-solid-svg-icons";
// // // import "./Topbar.css";
// // // import { useAuth } from "../../context/AuthProvider.client";

// // // /* -------------------------------------------------
// // //    MOBILE-ONLY TOPBAR COMPONENT (pure JSX – no TS)
// // //    ------------------------------------------------- */
// // // function MobileTopbar(props) {
// // //   const {
// // //     userName,
// // //     userRole,
// // //     avatar,
// // //     orgName,
// // //     notificationCount,
// // //     showCalendar,
// // //     setShowCalendar,
// // //     showNotifications,
// // //     setShowNotifications,
// // //     handleNotificationClick,
// // //     handleCalendarToggle,
// // //     fetchNotificationCount,
// // //     logout,
// // //     portalRoot,
// // //     calToggleRef,
// // //     notifRef,
// // //   } = props;

// // //   return (
// // //     <div className="mobile-topbar">
// // //       {/* Org name – top */}
// // //       <div className="mobile-org-section">
// // //         <span className="org-name-gradient">
// // //           {String(orgName || "").toUpperCase()}
// // //         </span>
// // //       </div>

// // //       {/* Bottom row – profile left, icons right */}
// // //       <div className="mobile-bottom-row">
// // //         <div className="mobile-profile">
// // //           {avatar ? (
// // //             <img src={avatar} alt="Profile" className="mobile-profile-img" />
// // //           ) : (
// // //             <div className="mobile-profile-placeholder" />
// // //           )}
// // //           <div className="mobile-profile-info">
// // //             <span className="mobile-profile-name">{userName}</span>
// // //             <span className="mobile-profile-role">{userRole}</span>
// // //           </div>
// // //         </div>

// // //         <div className="mobile-icons">
// // //           {/* Notification */}
// // //           <div
// // //             role="button"
// // //             tabIndex={0}
// // //             ref={notifRef}
// // //             onClick={handleNotificationClick}
// // //             onKeyDown={(e) => e.key === "Enter" && handleNotificationClick()}
// // //             className="mobile-icon-wrapper"
// // //           >
// // //             <FontAwesomeIcon icon={faBell} className="mobile-fa-icon" />
// // //             {notificationCount > 0 && (
// // //               <span className="mobile-notification-badge">
// // //                 {notificationCount}
// // //               </span>
// // //             )}
// // //           </div>

// // //           {/* Calendar */}
// // //           <div
// // //             role="button"
// // //             tabIndex={0}
// // //             ref={calToggleRef}
// // //             onClick={handleCalendarToggle}
// // //             onKeyDown={(e) => e.key === "Enter" && handleCalendarToggle()}
// // //             className="mobile-icon-wrapper"
// // //           >
// // //             <FontAwesomeIcon icon={faCalendarAlt} className="mobile-fa-icon" />
// // //           </div>

// // //           {/* Logout */}
// // //           <div
// // //             role="button"
// // //             tabIndex={0}
// // //             onClick={() => setTimeout(() => logout({ redirect: true }), 0)}
// // //             onKeyDown={(e) =>
// // //               e.key === "Enter" && logout({ redirect: true })
// // //             }
// // //             className="mobile-icon-wrapper"
// // //           >
// // //             <FontAwesomeIcon icon={faPowerOff} className="mobile-fa-icon" />
// // //           </div>
// // //         </div>
// // //       </div>

// // //       {/* Dropdowns – same as desktop */}
// // //       <Notifications
// // //         visible={showNotifications}
// // //         onClose={() => setShowNotifications(false)}
// // //         onRead={() => fetchNotificationCount()}
// // //       />
// // //       {showCalendar &&
// // //         (portalRoot ? (
// // //           ReactDOM.createPortal(
// // //             <div className="calendar-dropdown">
// // //               <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// // //             </div>,
// // //             portalRoot
// // //           )
// // //         ) : (
// // //           <div className="calendar-dropdown-inline">
// // //             <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// // //           </div>
// // //         ))}
// // //     </div>
// // //   );
// // // }

// // // /* -------------------------------------------------
// // //    MAIN TOPBAR COMPONENT
// // //    ------------------------------------------------- */
// // // export default function Topbar() {
// // //   const router = useRouter();
// // //   const { user, logout, hydrated } = useAuth();

// // //   const [isMobile, setIsMobile] = useState(false);
// // //   const [userName, setUserName] = useState("User");
// // //   const [userRole, setUserRole] = useState("Role");
// // //   const [notificationCount, setNotificationCount] = useState(0);
// // //   const [showCalendar, setShowCalendar] = useState(false);
// // //   const [showNotifications, setShowNotifications] = useState(false);
// // //   const [pendingNotifications, setPendingNotifications] = useState(false);
// // //   const [avatar, setAvatar] = useState(null);
// // //   const [orgName, setOrgName] = useState("Loading...");

// // //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// // //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// // //   useEffect(() => {}, [hydrated, user]);

// // //   const meId = user?.employeeId ?? user?.id ?? null;

// // //   const headers = meId
// // //     ? { "x-api-key": API_KEY || "", "x-employee-id": meId }
// // //     : { "x-api-key": API_KEY || "" };

// // //   /* ----------  USER NAME / ROLE ---------- */
// // //   useEffect(() => {
// // //     if (!hydrated) return;
// // //     if (user) {
// // //       setUserName(user.name || "User");
// // //       setUserRole(user.role || "Role");
// // //     } else {
// // //       setUserName("User");
// // //       setUserRole("Role");
// // //     }
// // //   }, [hydrated, user]);

// // //   /* ----------  NOTIFICATION COUNT ---------- */
// // //   const fetchNotificationCount = useCallback(() => {
// // //     if (!hydrated) return;
// // //     if (!BACKEND_URL || !meId) return;
// // //     axios
// // //       .get(`${BACKEND_URL}/api/notifications`, { headers })
// // //       .then((res) => {
// // //         const list = res?.data?.notifications || res?.data?.message || [];
// // //         setNotificationCount(
// // //           Array.isArray(list) ? list.length : list?.length || 0
// // //         );
// // //       })
// // //       .catch((err) => {
// // //         console.error("Error fetching notification count", err);
// // //       });
// // //   }, [BACKEND_URL, meId, headers, hydrated]);

// // //   useEffect(() => {
// // //     if (!hydrated) return;
// // //     fetchNotificationCount();
// // //     const interval = setInterval(fetchNotificationCount, 60000);
// // //     return () => clearInterval(interval);
// // //   }, [fetchNotificationCount, hydrated]);

// // //   /* ----------  AVATAR & ORGANIZATION NAME ---------- */
// // //   useEffect(() => {
// // //     if (!hydrated) {
// // //       setAvatar(null);
// // //       setOrgName("Loading...");
// // //       return;
// // //     }

// // //     let mounted = true;
// // //     let objectUrl = null;

// // //     const defaultAvatar = (role, gender) =>
// // //       role === "Admin"
// // //         ? "/images/admin-avatar.png"
// // //         : gender === "Female"
// // //         ? "/images/female-avatar.jpeg"
// // //         : "/images/male-avatar.jpeg";

// // //     const defaultPath = defaultAvatar(
// // //       user?.role,
// // //       user?.gender ?? user?.dashboard?.gender
// // //     );

// // //     const normalizeInputUrl = (maybe) => {
// // //       if (maybe === undefined || maybe === null) return null;
// // //       if (Array.isArray(maybe)) {
// // //         if (maybe.length === 0) return null;
// // //         return normalizeInputUrl(maybe[0]);
// // //       }
// // //       if (typeof maybe === "object") {
// // //         if (!maybe) return null;
// // //         if (typeof maybe.url === "string" && maybe.url) return maybe.url;
// // //         if (typeof maybe.path === "string" && maybe.path) return maybe.path;
// // //         if (typeof maybe.file === "string" && maybe.file) return maybe.file;
// // //         for (const k of ["link", "href", "download"]) {
// // //           if (typeof maybe[k] === "string" && maybe[k]) return maybe[k];
// // //         }
// // //         return null;
// // //       }
// // //       if (typeof maybe === "string") {
// // //         const s = maybe.trim();
// // //         if (!s) return null;
// // //         if (s.startsWith("[") || s.startsWith("%5B") || s.startsWith("%5b")) {
// // //           try {
// // //             const decoded = decodeURIComponent(s);
// // //             const parsed = JSON.parse(decoded);
// // //             if (Array.isArray(parsed) && parsed.length > 0)
// // //               return normalizeInputUrl(parsed[0]);
// // //             if (typeof parsed === "string") return normalizeInputUrl(parsed);
// // //           } catch (e) {
// // //             try {
// // //               const parsed = JSON.parse(s);
// // //               if (Array.isArray(parsed) && parsed.length > 0)
// // //                 return normalizeInputUrl(parsed[0]);
// // //               if (typeof parsed === "string") return normalizeInputUrl(parsed);
// // //             } catch (err) {}
// // //           }
// // //         }
// // //         if (s.includes("%22") || s.includes("%5C%22")) {
// // //           try {
// // //             const decoded = decodeURIComponent(s);
// // //             const parsed = JSON.parse(decoded);
// // //             if (Array.isArray(parsed) && parsed.length > 0)
// // //               return normalizeInputUrl(parsed[0]);
// // //             if (typeof parsed === "string") return normalizeInputUrl(parsed);
// // //           } catch (e) {}
// // //         }
// // //         return s;
// // //       }
// // //       try {
// // //         return String(maybe);
// // //       } catch {
// // //         return null;
// // //       }
// // //     };

// // //     const buildFetchUrl = (maybeUrl) => {
// // //       const u = normalizeInputUrl(maybeUrl);
// // //       if (!u) return null;
// // //       if (/^https?:\/\//i.test(u)) return u;
// // //       if (!BACKEND_URL) return null;
// // //       const base = BACKEND_URL.replace(/\/+$/g, "");
// // //       if (u.startsWith("/docs")) {
// // //         return `${base}${u}`;
// // //       }
// // //       const path = u.startsWith("/") ? u : `/${u}`;
// // //       return `${base}/docs${path}`;
// // //     };

// // //     const dashboard = user?.dashboard ?? {};
// // //     const photoUrl = dashboard.photoUrl ?? dashboard.photo_url ?? null;

// // //     if (!user) {
// // //       setAvatar(defaultPath);
// // //       setOrgName("Unknown Organization");
// // //       return () => {};
// // //     }

// // //     const fetchPhoto = async () => {
// // //       if (!photoUrl) {
// // //         if (mounted) setAvatar(defaultPath);
// // //         return;
// // //       }

// // //       const fetchUrl = buildFetchUrl(photoUrl);
// // //       if (!fetchUrl) {
// // //         if (mounted) setAvatar(defaultPath);
// // //         return;
// // //       }

// // //       try {
// // //         const resp = await axios.get(fetchUrl, {
// // //           headers,
// // //           responseType: "blob",
// // //         });

// // //         if (!mounted) return;
// // //         if (objectUrl) {
// // //           try {
// // //             URL.revokeObjectURL(objectUrl);
// // //           } catch (e) {}
// // //           objectUrl = null;
// // //         }
// // //         objectUrl = URL.createObjectURL(resp.data);
// // //         setAvatar(objectUrl);
// // //       } catch (err) {
// // //         if (mounted) setAvatar(defaultPath);
// // //       }
// // //     };

// // //     fetchPhoto();

// // //     (async function fetchOrg() {
// // //       const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
// // //       if (!orgId || !BACKEND_URL) {
// // //         setOrgName("Unknown Organization");
// // //         return;
// // //       }
// // //       try {
// // //         const resp = await axios.get(`${BACKEND_URL}/org/${orgId}`, {
// // //           headers: { "x-api-key": API_KEY || "", "x-employee-id": meId || "0" },
// // //         });
// // //         setOrgName(
// // //           resp?.data?.Name ? String(resp.data.Name) : "Unknown Organization"
// // //         );
// // //       } catch {
// // //         setOrgName("Unknown Organization");
// // //       }
// // //     })();

// // //     return () => {
// // //       mounted = false;
// // //       if (objectUrl) {
// // //         try {
// // //           URL.revokeObjectURL(objectUrl);
// // //         } catch (e) {}
// // //         objectUrl = null;
// // //       }
// // //     };
// // //   }, [hydrated, user, BACKEND_URL, API_KEY, meId]);

// // //   /* ----------  PORTAL & REFS ---------- */
// // //   const portalRoot =
// // //     typeof document !== "undefined"
// // //       ? document.getElementById("portal-root")
// // //       : null;

// // //   const wrapperRef = useRef(null);
// // //   const notifRef = useRef(null);
// // //   const calToggleRef = useRef(null);

// // //   const getCalendarNode = () => {
// // //     if (portalRoot) {
// // //       const node = portalRoot.querySelector(
// // //         ".calendar-dropdown, .calendar-dropdown-inline"
// // //       );
// // //       if (node) return node;
// // //     }
// // //     return document.querySelector(
// // //       ".calendar-dropdown-inline, .calendar-dropdown"
// // //     );
// // //   };

// // //   /* ----------  OUTSIDE-CLICK & ESC ---------- */
// // //   useEffect(() => {
// // //     function onDocumentClick(e) {
// // //       if (!showCalendar) return;

// // //       const calendarNode = getCalendarNode();
// // //       const target = e.target;

// // //       if (calendarNode && calendarNode.contains(target)) return;
// // //       if (calToggleRef.current && calToggleRef.current.contains(target)) return;
// // //       if (notifRef.current && notifRef.current.contains(target)) return;

// // //       setShowCalendar(false);
// // //       setPendingNotifications(false);
// // //     }

// // //     function onEsc(e) {
// // //       if (e.key === "Escape" && showCalendar) {
// // //         setShowCalendar(false);
// // //         setPendingNotifications(false);
// // //       }
// // //     }

// // //     document.addEventListener("mousedown", onDocumentClick);
// // //     document.addEventListener("touchstart", onDocumentClick);
// // //     document.addEventListener("keydown", onEsc);

// // //     return () => {
// // //       document.removeEventListener("mousedown", onDocumentClick);
// // //       document.removeEventListener("touchstart", onDocumentClick);
// // //       document.removeEventListener("keydown", onEsc);
// // //     };
// // //   }, [showCalendar, portalRoot]);

// // //   /* ----------  NOTIFICATION HANDLER ---------- */
// // //   const handleNotificationClick = () => {
// // //     fetchNotificationCount();

// // //     if (pendingNotifications) return;

// // //     if (showCalendar) {
// // //       setPendingNotifications(true);
// // //       setShowCalendar(false);
// // //       return;
// // //     }

// // //     setShowNotifications((v) => !v);
// // //   };

// // //   const handleNotificationKeyDown = (e) => {
// // //     if (e.key !== "Enter") return;
// // //     handleNotificationClick();
// // //   };

// // //   useEffect(() => {
// // //     if (pendingNotifications && !showCalendar) {
// // //       setShowNotifications(true);
// // //       setPendingNotifications(false);
// // //     }
// // //   }, [pendingNotifications, showCalendar]);

// // //   /* ----------  CALENDAR TOGGLE ---------- */
// // //   const handleCalendarToggle = () => {
// // //     if (showNotifications) setShowNotifications(false);
// // //     setPendingNotifications(false);
// // //     setShowCalendar((s) => !s);
// // //   };

// // //   /* ----------  MOBILE DETECTION ---------- */
// // //   useEffect(() => {
// // //     const check = () => setIsMobile(window.innerWidth <= 768);
// // //     check();
// // //     window.addEventListener("resize", check);
// // //     return () => window.removeEventListener("resize", check);
// // //   }, []);

// // //   /* ----------  SHARED PROPS FOR MOBILE ---------- */
// // //   const mobileProps = {
// // //     userName,
// // //     userRole,
// // //     avatar,
// // //     orgName,
// // //     notificationCount,
// // //     showCalendar,
// // //     setShowCalendar,
// // //     showNotifications,
// // //     setShowNotifications,
// // //     handleNotificationClick,
// // //     handleCalendarToggle,
// // //     fetchNotificationCount,
// // //     logout,
// // //     portalRoot,
// // //     calToggleRef,
// // //     notifRef,
// // //   };

// // //   /* ----------  RENDER ---------- */
// // //   return isMobile ? (
// // //     <MobileTopbar {...mobileProps} />
// // //   ) : (
// // //     /* ----------  ORIGINAL DESKTOP MARKUP (unchanged) ---------- */
// // //     <div className="topbar1" ref={wrapperRef}>
// // //       <div className="profile-section">
// // //         {avatar ? (
// // //           <img src={avatar} alt="Profile" className="profile-img" />
// // //         ) : (
// // //           <div className="profile-placeholder" />
// // //         )}
// // //         <div className="profile-info">
// // //           <span className="profile-namedash">{userName}</span>
// // //           <span className="profile-designation">{userRole}</span>
// // //         </div>
// // //       </div>

// // //       <div className="org-name-section">
// // //         <span className="org-name-gradient">
// // //           {String(orgName || "").toUpperCase()}
// // //         </span>
// // //       </div>

// // //       <div className="icon-section">
// // //         <div
// // //           className="notification-icon"
// // //           role="button"
// // //           tabIndex={0}
// // //           ref={notifRef}
// // //           onClick={handleNotificationClick}
// // //           onKeyDown={handleNotificationKeyDown}
// // //         >
// // //           <FontAwesomeIcon icon={faBell} className="fa-icon" />
// // //           {notificationCount > 0 && (
// // //             <span className="notification-badge">{notificationCount}</span>
// // //           )}
// // //         </div>

// // //         <Notifications
// // //           visible={showNotifications}
// // //           onClose={() => setShowNotifications(false)}
// // //           onRead={() => fetchNotificationCount()}
// // //         />

// // //         <div
// // //           role="button"
// // //           tabIndex={0}
// // //           aria-label="Toggle calendar"
// // //           className="calendar-toggle"
// // //           ref={calToggleRef}
// // //           onClick={handleCalendarToggle}
// // //           onKeyDown={(e) => {
// // //             if (e.key === "Enter") handleCalendarToggle();
// // //           }}
// // //         >
// // //           <FontAwesomeIcon icon={faCalendarAlt} className="fa-icon" />
// // //         </div>

// // //         {showCalendar &&
// // //           (portalRoot ? (
// // //             ReactDOM.createPortal(
// // //               <div className="calendar-dropdown">
// // //                 <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// // //               </div>,
// // //               portalRoot
// // //             )
// // //           ) : (
// // //             <div className="calendar-dropdown-inline">
// // //               <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// // //             </div>
// // //           ))}

// // //         <div
// // //           role="button"
// // //           tabIndex={0}
// // //           onClick={() => {
// // //             setTimeout(() => logout({ redirect: true }), 0);
// // //           }}
// // //           onKeyDown={(e) => {
// // //             if (e.key === "Enter") logout({ redirect: true });
// // //           }}
// // //         >
// // //           <FontAwesomeIcon icon={faPowerOff} className="fa-icon" />
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // "use client";

// // // import React, { useEffect, useState, useCallback, useRef } from "react";
// // // import { useRouter } from "next/navigation";
// // // import HolidayCalendar from "../HolidayCalendar/HolidayCalendar.client";
// // // import Notifications from "./Notifications.client";
// // // import ReactDOM from "react-dom";
// // // import axios from "axios";
// // // import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// // // import {
// // //   faBell,
// // //   faCalendarAlt,
// // //   faPowerOff,
// // // } from "@fortawesome/free-solid-svg-icons";
// // // import "./Topbar.css";
// // // import { useAuth } from "../../context/AuthProvider.client";

// // // /* -------------------------------------------------
// // //    MOBILE TOPBAR (Pure JSX – no TS)
// // //    ------------------------------------------------- */
// // // function MobileTopbar(props) {
// // //   const {
// // //     userName,
// // //     userRole,
// // //     avatar,
// // //     orgName,
// // //     notificationCount,
// // //     showCalendar,
// // //     setShowCalendar,
// // //     showNotifications,
// // //     setShowNotifications,
// // //     handleNotificationClick,
// // //     handleCalendarToggle,
// // //     fetchNotificationCount,
// // //     logout,
// // //     portalRoot,
// // //     calToggleRef,
// // //     notifRef,
// // //   } = props;

// // // return (
// // //     <div className="mobile-topbar-v2">
// // //       {/* Glass Header with Org Name */}
// // //       <div className="mobile-header-glass">
// // //         <span className="mobile-org-title">{String(orgName || "").toUpperCase()}</span>
// // //       </div>

// // //       {/* Main Row: Profile + Icons */}
// // //       <div className="mobile-main-row">
// // //         <div className="mobile-profile-card">
// // //           {avatar ? (
// // //             <img src={avatar} alt="Profile" className="mobile-avatar" />
// // //           ) : (
// // //             <div className="mobile-avatar-placeholder">
// // //               <span>{userName.charAt(0)}</span>
// // //             </div>
// // //           )}
// // //           <div className="mobile-user-info">
// // //             <div className="mobile-user-name">{userName}</div>
// // //             <div className="mobile-user-role">{userRole}</div>
// // //           </div>
// // //         </div>

// // //         <div className="mobile-action-buttons">
// // //           <button
// // //             ref={notifRef}
// // //             onClick={handleNotificationClick}
// // //             className="mobile-action-btn"
// // //             aria-label="Notifications"
// // //           >
// // //             <FontAwesomeIcon icon={faBell} />
// // //             {notificationCount > 0 && (
// // //               <span className="mobile-badge">{notificationCount}</span>
// // //             )}
// // //           </button>

// // //           <button
// // //             ref={calToggleRef}
// // //             onClick={handleCalendarToggle}
// // //             className="mobile-action-btn"
// // //             aria-label="Calendar"
// // //           >
// // //             <FontAwesomeIcon icon={faCalendarAlt} />
// // //           </button>

// // //           <button
// // //             onClick={() => setTimeout(() => logout({ redirect: true }), 0)}
// // //             className="mobile-action-btn mobile-logout-btn"
// // //             aria-label="Logout"
// // //           >
// // //             <FontAwesomeIcon icon={faPowerOff} />
// // //           </button>
// // //         </div>
// // //       </div>

// // //       {/* Portals */}
// // //       <Notifications
// // //         visible={showNotifications}
// // //         onClose={() => setShowNotifications(false)}
// // //         onRead={() => fetchNotificationCount()}
// // //       />
// // //       {showCalendar &&
// // //         (portalRoot ? (
// // //           ReactDOM.createPortal(
// // //             <div className="calendar-dropdown">
// // //               <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// // //             </div>,
// // //             portalRoot
// // //           )
// // //         ) : (
// // //           <div className="calendar-dropdown-inline">
// // //             <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// // //           </div>
// // //         ))}
// // //     </div>
// // //   );
// // // }

// // // /* -------------------------------------------------
// // //    MAIN TOPBAR
// // //    ------------------------------------------------- */
// // // export default function Topbar() {
// // //   const router = useRouter();
// // //   const { user, logout, hydrated } = useAuth();

// // //   const [isMobile, setIsMobile] = useState(false);
// // //   const [userName, setUserName] = useState("User");
// // //   const [userRole, setUserRole] = useState("Role");
// // //   const [notificationCount, setNotificationCount] = useState(0);
// // //   const [showCalendar, setShowCalendar] = useState(false);
// // //   const [showNotifications, setShowNotifications] = useState(false);
// // //   const [pendingNotifications, setPendingNotifications] = useState(false);
// // //   const [avatar, setAvatar] = useState(null);
// // //   const [orgName, setOrgName] = useState("Loading...");

// // //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// // //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// // //   useEffect(() => {}, [hydrated, user]);

// // //   const meId = user?.employeeId ?? user?.id ?? null;
// // //   const headers = meId
// // //     ? { "x-api-key": API_KEY || "", "x-employee-id": meId }
// // //     : { "x-api-key": API_KEY || "" };

// // //   /* USER NAME / ROLE */
// // //   useEffect(() => {
// // //     if (!hydrated) return;
// // //     if (user) {
// // //       setUserName(user.name || "User");
// // //       setUserRole(user.role || "Role");
// // //     } else {
// // //       setUserName("User");
// // //       setUserRole("Role");
// // //     }
// // //   }, [hydrated, user]);

// // //   /* NOTIFICATION COUNT */
// // //   const fetchNotificationCount = useCallback(() => {
// // //     if (!hydrated || !BACKEND_URL || !meId) return;
// // //     axios
// // //       .get(`${BACKEND_URL}/api/notifications`, { headers })
// // //       .then((res) => {
// // //         const list = res?.data?.notifications || res?.data?.message || [];
// // //         setNotificationCount(Array.isArray(list) ? list.length : list?.length || 0);
// // //       })
// // //       .catch((err) => console.error("Error fetching notification count", err));
// // //   }, [BACKEND_URL, meId, headers, hydrated]);

// // //   useEffect(() => {
// // //     if (!hydrated) return;
// // //     fetchNotificationCount();
// // //     const interval = setInterval(fetchNotificationCount, 60000);
// // //     return () => clearInterval(interval);
// // //   }, [fetchNotificationCount, hydrated]);

// // //   /* AVATAR & ORG NAME */
// // //   useEffect(() => {
// // //     if (!hydrated) {
// // //       setAvatar(null);
// // //       setOrgName("Loading...");
// // //       return;
// // //     }

// // //     let mounted = true;
// // //     let objectUrl = null;

// // //     const defaultAvatar = (role, gender) =>
// // //       role === "Admin"
// // //         ? "/images/admin-avatar.png"
// // //         : gender === "Female"
// // //         ? "/images/female-avatar.jpeg"
// // //         : "/images/male-avatar.jpeg";

// // //     const defaultPath = defaultAvatar(user?.role, user?.gender ?? user?.dashboard?.gender);

// // //     const normalizeInputUrl = (maybe) => {
// // //       if (!maybe) return null;
// // //       if (Array.isArray(maybe)) return maybe.length > 0 ? normalizeInputUrl(maybe[0]) : null;
// // //       if (typeof maybe === "object") {
// // //         return maybe.url || maybe.path || maybe.file || null;
// // //       }
// // //       if (typeof maybe === "string") {
// // //         const s = maybe.trim();
// // //         if (!s) return null;
// // //         try {
// // //           const parsed = JSON.parse(decodeURIComponent(s));
// // //           return normalizeInputUrl(Array.isArray(parsed) ? parsed[0] : parsed);
// // //         } catch {
// // //           return s;
// // //         }
// // //       }
// // //       return null;
// // //     };

// // //     const buildFetchUrl = (url) => {
// // //       const u = normalizeInputUrl(url);
// // //       if (!u) return null;
// // //       if (/^https?:\/\//i.test(u)) return u;
// // //       const base = BACKEND_URL.replace(/\/+$/g, "");
// // //       return u.startsWith("/docs") ? `${base}${u}` : `${base}/docs${u.startsWith("/") ? u : `/${u}`}`;
// // //     };

// // //     const dashboard = user?.dashboard ?? {};
// // //     const photoUrl = dashboard.photoUrl ?? dashboard.photo_url ?? null;

// // //     if (!user) {
// // //       setAvatar(defaultPath);
// // //       setOrgName("Unknown Organization");
// // //       return;
// // //     }

// // //     const fetchPhoto = async () => {
// // //       if (!photoUrl) return mounted && setAvatar(defaultPath);
// // //       const fetchUrl = buildFetchUrl(photoUrl);
// // //       if (!fetchUrl) return mounted && setAvatar(defaultPath);

// // //       try {
// // //         const resp = await axios.get(fetchUrl, { headers, responseType: "blob" });
// // //         if (!mounted) return;
// // //         if (objectUrl) URL.revokeObjectURL(objectUrl);
// // //         objectUrl = URL.createObjectURL(resp.data);
// // //         setAvatar(objectUrl);
// // //       } catch {
// // //         mounted && setAvatar(defaultPath);
// // //       }
// // //     };

// // //     fetchPhoto();

// // //     (async () => {
// // //       const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
// // //       if (!orgId || !BACKEND_URL) return setOrgName("Unknown Organization");
// // //       try {
// // //         const resp = await axios.get(`${BACKEND_URL}/org/${orgId}`, {
// // //           headers: { "x-api-key": API_KEY || "", "x-employee-id": meId || "0" },
// // //         });
// // //         setOrgName(resp?.data?.Name ? String(resp.data.Name) : "Unknown Organization");
// // //       } catch {
// // //         setOrgName("Unknown Organization");
// // //       }
// // //     })();

// // //     return () => {
// // //       mounted = false;
// // //       if (objectUrl) URL.revokeObjectURL(objectUrl);
// // //     };
// // //   }, [hydrated, user, BACKEND_URL, API_KEY, meId]);

// // //   /* PORTAL & REFS */
// // //   const portalRoot = typeof document !== "undefined" ? document.getElementById("portal-root") : null;
// // //   const wrapperRef = useRef(null);
// // //   const notifRef = useRef(null);
// // //   const calToggleRef = useRef(null);

// // //   const getCalendarNode = () => {
// // //     if (portalRoot) {
// // //       const node = portalRoot.querySelector(".calendar-dropdown, .calendar-dropdown-inline");
// // //       if (node) return node;
// // //     }
// // //     return document.querySelector(".calendar-dropdown-inline, .calendar-dropdown");
// // //   };

// // //   /* OUTSIDE CLICK & ESC */
// // //   useEffect(() => {
// // //     const onClick = (e) => {
// // //       if (!showCalendar) return;
// // //       const calendarNode = getCalendarNode();
// // //       const target = e.target;
// // //       if (calendarNode?.contains(target)) return;
// // //       if (calToggleRef.current?.contains(target)) return;
// // //       if (notifRef.current?.contains(target)) return;
// // //       setShowCalendar(false);
// // //       setPendingNotifications(false);
// // //     };

// // //     const onEsc = (e) => e.key === "Escape" && showCalendar && (setShowCalendar(false), setPendingNotifications(false));

// // //     document.addEventListener("mousedown", onClick);
// // //     document.addEventListener("touchstart", onClick);
// // //     document.addEventListener("keydown", onEsc);

// // //     return () => {
// // //       document.removeEventListener("mousedown", onClick);
// // //       document.removeEventListener("touchstart", onClick);
// // //       document.removeEventListener("keydown", onEsc);
// // //     };
// // //   }, [showCalendar, portalRoot]);

// // //   /* NOTIFICATION HANDLER */
// // //   const handleNotificationClick = () => {
// // //     fetchNotificationCount();
// // //     if (pendingNotifications) return;
// // //     if (showCalendar) {
// // //       setPendingNotifications(true);
// // //       setShowCalendar(false);
// // //       return;
// // //     }
// // //     setShowNotifications((v) => !v);
// // //   };

// // //   const handleNotificationKeyDown = (e) => e.key === "Enter" && handleNotificationClick();

// // //   useEffect(() => {
// // //     if (pendingNotifications && !showCalendar) {
// // //       setShowNotifications(true);
// // //       setPendingNotifications(false);
// // //     }
// // //   }, [pendingNotifications, showCalendar]);

// // //   const handleCalendarToggle = () => {
// // //     if (showNotifications) setShowNotifications(false);
// // //     setPendingNotifications(false);
// // //     setShowCalendar((s) => !s);
// // //   };

// // //   /* MOBILE DETECTION */
// // //   useEffect(() => {
// // //     const check = () => setIsMobile(window.innerWidth <= 768);
// // //     check();
// // //     window.addEventListener("resize", check);
// // //     return () => window.removeEventListener("resize", check);
// // //   }, []);

// // //   const mobileProps = {
// // //     userName, userRole, avatar, orgName, notificationCount,
// // //     showCalendar, setShowCalendar, showNotifications, setShowNotifications,
// // //     handleNotificationClick, handleCalendarToggle, fetchNotificationCount,
// // //     logout, portalRoot, calToggleRef, notifRef,
// // //   };

// // //   return isMobile ? (
// // //     <MobileTopbar {...mobileProps} />
// // //   ) : (
// // //     /* DESKTOP – UNCHANGED */
// // //     <div className="topbar1" ref={wrapperRef}>
// // //       <div className="profile-section">
// // //         {avatar ? (
// // //           <img src={avatar} alt="Profile" className="profile-img" />
// // //         ) : (
// // //           <div className="profile-placeholder" />
// // //         )}
// // //         <div className="profile-info">
// // //           <span className="profile-namedash">{userName}</span>
// // //           <span className="profile-designation">{userRole}</span>
// // //         </div>
// // //       </div>

// // //       <div className="org-name-section">
// // //         <span className="org-name-gradient">
// // //           {String(orgName || "").toUpperCase()}
// // //         </span>
// // //       </div>

// // //       <div className="icon-section">
// // //         <div
// // //           className="notification-icon"
// // //           role="button"
// // //           tabIndex={0}
// // //           ref={notifRef}
// // //           onClick={handleNotificationClick}
// // //           onKeyDown={handleNotificationKeyDown}
// // //         >
// // //           <FontAwesomeIcon icon={faBell} className="fa-icon" />
// // //           {notificationCount > 0 && (
// // //             <span className="notification-badge">{notificationCount}</span>
// // //           )}
// // //         </div>

// // //         <Notifications
// // //           visible={showNotifications}
// // //           onClose={() => setShowNotifications(false)}
// // //           onRead={() => fetchNotificationCount()}
// // //         />

// // //         <div
// // //           role="button"
// // //           tabIndex={0}
// // //           aria-label="Toggle calendar"
// // //           className="calendar-toggle"
// // //           ref={calToggleRef}
// // //           onClick={handleCalendarToggle}
// // //           onKeyDown={(e) => e.key === "Enter" && handleCalendarToggle()}
// // //         >
// // //           <FontAwesomeIcon icon={faCalendarAlt} className="fa-icon" />
// // //         </div>

// // //         {showCalendar &&
// // //           (portalRoot ? (
// // //             ReactDOM.createPortal(
// // //               <div className="calendar-dropdown">
// // //                 <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// // //               </div>,
// // //               portalRoot
// // //             )
// // //           ) : (
// // //             <div className="calendar-dropdown-inline">
// // //               <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// // //             </div>
// // //           ))}

// // //         <div
// // //           role="button"
// // //           tabIndex={0}
// // //           onClick={() => setTimeout(() => logout({ redirect: true }), 0)}
// // //           onKeyDown={(e) => e.key === "Enter" && logout({ redirect: true })}
// // //         >
// // //           <FontAwesomeIcon icon={faPowerOff} className="fa-icon" />
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // "use client";

// // import React, { useEffect, useState, useCallback, useRef } from "react";
// // import { useRouter } from "next/navigation";
// // import HolidayCalendar from "../HolidayCalendar/HolidayCalendar.client";
// // import Notifications from "./Notifications.client";
// // import ReactDOM from "react-dom";
// // import axios from "axios";
// // import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// // import {
// //   faBell,
// //   faCalendarAlt,
// //   faPowerOff,
// //   faBuilding,
// // } from "@fortawesome/free-solid-svg-icons";
// // import "./Topbar.css";
// // import { useAuth } from "../../context/AuthProvider.client";

// // /* -------------------------------------------------
// //    MOBILE TOPBAR
// //    ------------------------------------------------- */
// // function MobileTopbar(props) {
// //   const {
// //     userName,
// //     userRole,
// //     avatar,
// //     orgName,
// //     notificationCount,
// //     showCalendar,
// //     setShowCalendar,
// //     showNotifications,
// //     setShowNotifications,
// //     handleNotificationClick,
// //     handleCalendarToggle,
// //     fetchNotificationCount,
// //     logout,
// //     portalRoot,
// //     calToggleRef,
// //     notifRef,
// //   } = props;

// //   return (
// //     <div className="mobile-topbar-v2">
// //       {/* FULL-COLOR HEADER – NO GLASS */}
// //       <div className="mobile-header-colored">
// //         <div className="mobile-org-card">
// //           <FontAwesomeIcon icon={faBuilding} className="org-icon" />
// //           <span>{String(orgName || "").toUpperCase()}</span>
// //         </div>
// //       </div>

// //       {/* Main Row */}
// //       <div className="mobile-main-row">
// //         <div className="mobile-profile-card">
// //           {avatar ? (
// //             <img src={avatar} alt="Profile" className="mobile-avatar" />
// //           ) : (
// //             <div className="mobile-avatar-placeholder">
// //               <span>{userName.charAt(0)}</span>
// //             </div>
// //           )}
// //           <div className="mobile-user-info">
// //             <div className="mobile-user-name">{userName}</div>
// //             <div className="mobile-user-role">{userRole}</div>
// //           </div>
// //         </div>

// //         <div className="mobile-action-buttons">
// //           <button
// //             ref={notifRef}
// //             onClick={handleNotificationClick}
// //             className="mobile-action-btn"
// //             aria-label="Notifications"
// //           >
// //             <FontAwesomeIcon icon={faBell} />
// //             {notificationCount > 0 && (
// //               <span className="mobile-badge">{notificationCount}</span>
// //             )}
// //           </button>

// //           <button
// //             ref={calToggleRef}
// //             onClick={handleCalendarToggle}
// //             className="mobile-action-btn"
// //             aria-label="Calendar"
// //           >
// //             <FontAwesomeIcon icon={faCalendarAlt} />
// //           </button>

// //           <button
// //             onClick={() => setTimeout(() => logout({ redirect: true }), 0)}
// //             className="mobile-action-btn mobile-logout-btn"
// //             aria-label="Logout"
// //           >
// //             <FontAwesomeIcon icon={faPowerOff} />
// //           </button>
// //         </div>
// //       </div>

// //       <Notifications
// //         visible={showNotifications}
// //         onClose={() => setShowNotifications(false)}
// //         onRead={() => fetchNotificationCount()}
// //       />
// //       {showCalendar &&
// //         (portalRoot ? (
// //           ReactDOM.createPortal(
// //             <div className="calendar-dropdown">
// //               <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// //             </div>,
// //             portalRoot
// //           )
// //         ) : (
// //           <div className="calendar-dropdown-inline">
// //             <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// //           </div>
// //         ))}
// //     </div>
// //   );
// // }

// // /* -------------------------------------------------
// //    MAIN TOPBAR
// //    ------------------------------------------------- */
// // export default function Topbar() {
// //   const router = useRouter();
// //   const { user, logout, hydrated } = useAuth();

// //   const [isMobile, setIsMobile] = useState(false);
// //   const [userName, setUserName] = useState("User");
// //   const [userRole, setUserRole] = useState("Role");
// //   const [notificationCount, setNotificationCount] = useState(0);
// //   const [showCalendar, setShowCalendar] = useState(false);
// //   const [showNotifications, setShowNotifications] = useState(false);
// //   const [pendingNotifications, setPendingNotifications] = useState(false);
// //   const [avatar, setAvatar] = useState(null);
// //   const [orgName, setOrgName] = useState("Loading...");

// //   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
// //   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// //   useEffect(() => {}, [hydrated, user]);

// //   const meId = user?.employeeId ?? user?.id ?? null;
// //   const headers = meId
// //     ? { "x-api-key": API_KEY || "", "x-employee-id": meId }
// //     : { "x-api-key": API_KEY || "" };

// //   /* USER NAME / ROLE */
// //   useEffect(() => {
// //     if (!hydrated) return;
// //     if (user) {
// //       setUserName(user.name || "User");
// //       setUserRole(user.role || "Role");
// //     } else {
// //       setUserName("User");
// //       setUserRole("Role");
// //     }
// //   }, [hydrated, user]);

// //   /* NOTIFICATION COUNT */
// //   const fetchNotificationCount = useCallback(() => {
// //     if (!hydrated || !BACKEND_URL || !meId) return;
// //     axios
// //       .get(`${BACKEND_URL}/api/notifications`, { headers })
// //       .then((res) => {
// //         const list = res?.data?.notifications || res?.data?.message || [];
// //         setNotificationCount(Array.isArray(list) ? list.length : list?.length || 0);
// //       })
// //       .catch((err) => console.error("Error fetching notification count", err));
// //   }, [BACKEND_URL, meId, headers, hydrated]);

// //   useEffect(() => {
// //     if (!hydrated) return;
// //     fetchNotificationCount();
// //     const interval = setInterval(fetchNotificationCount, 60000);
// //     return () => clearInterval(interval);
// //   }, [fetchNotificationCount, hydrated]);

// //   /* AVATAR & ORG NAME */
// //   useEffect(() => {
// //     if (!hydrated) {
// //       setAvatar(null);
// //       setOrgName("Loading...");
// //       return;
// //     }

// //     let mounted = true;
// //     let objectUrl = null;

// //     const defaultAvatar = (role, gender) =>
// //       role === "Admin"
// //         ? "/images/admin-avatar.png"
// //         : gender === "Female"
// //         ? "/images/female-avatar.jpeg"
// //         : "/images/male-avatar.jpeg";

// //     const defaultPath = defaultAvatar(user?.role, user?.gender ?? user?.dashboard?.gender);

// //     const normalizeInputUrl = (maybe) => {
// //       if (!maybe) return null;
// //       if (Array.isArray(maybe)) return maybe.length > 0 ? normalizeInputUrl(maybe[0]) : null;
// //       if (typeof maybe === "object") {
// //         return maybe.url || maybe.path || maybe.file || null;
// //       }
// //       if (typeof maybe === "string") {
// //         const s = maybe.trim();
// //         if (!s) return null;
// //         try {
// //           const parsed = JSON.parse(decodeURIComponent(s));
// //           return normalizeInputUrl(Array.isArray(parsed) ? parsed[0] : parsed);
// //         } catch {
// //           return s;
// //         }
// //       }
// //       return null;
// //     };

// //     const buildFetchUrl = (url) => {
// //       const u = normalizeInputUrl(url);
// //       if (!u) return null;
// //       if (/^https?:\/\//i.test(u)) return u;
// //       const base = BACKEND_URL.replace(/\/+$/g, "");
// //       return u.startsWith("/docs") ? `${base}${u}` : `${base}/docs${u.startsWith("/") ? u : `/${u}`}`;
// //     };

// //     const dashboard = user?.dashboard ?? {};
// //     const photoUrl = dashboard.photoUrl ?? dashboard.photo_url ?? null;

// //     if (!user) {
// //       setAvatar(defaultPath);
// //       setOrgName("Unknown Organization");
// //       return;
// //     }

// //     const fetchPhoto = async () => {
// //       if (!photoUrl) return mounted && setAvatar(defaultPath);
// //       const fetchUrl = buildFetchUrl(photoUrl);
// //       if (!fetchUrl) return mounted && setAvatar(defaultPath);

// //       try {
// //         const resp = await axios.get(fetchUrl, { headers, responseType: "blob" });
// //         if (!mounted) return;
// //         if (objectUrl) URL.revokeObjectURL(objectUrl);
// //         objectUrl = URL.createObjectURL(resp.data);
// //         setAvatar(objectUrl);
// //       } catch {
// //         mounted && setAvatar(defaultPath);
// //       }
// //     };

// //     fetchPhoto();

// //     (async () => {
// //       const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
// //       if (!orgId || !BACKEND_URL) return setOrgName("Unknown Organization");
// //       try {
// //         const resp = await axios.get(`${BACKEND_URL}/org/${orgId}`, {
// //           headers: { "x-api-key": API_KEY || "", "x-employee-id": meId || "0" },
// //         });
// //         setOrgName(resp?.data?.Name ? String(resp.data.Name) : "Unknown Organization");
// //       } catch {
// //         setOrgName("Unknown Organization");
// //       }
// //     })();

// //     return () => {
// //       mounted = false;
// //       if (objectUrl) URL.revokeObjectURL(objectUrl);
// //     };
// //   }, [hydrated, user, BACKEND_URL, API_KEY, meId]);

// //   /* PORTAL & REFS */
// //   const portalRoot = typeof document !== "undefined" ? document.getElementById("portal-root") : null;
// //   const wrapperRef = useRef(null);
// //   const notifRef = useRef(null);
// //   const calToggleRef = useRef(null);

// //   const getCalendarNode = () => {
// //     if (portalRoot) {
// //       const node = portalRoot.querySelector(".calendar-dropdown, .calendar-dropdown-inline");
// //       if (node) return node;
// //     }
// //     return document.querySelector(".calendar-dropdown-inline, .calendar-dropdown");
// //   };

// //   /* OUTSIDE CLICK & ESC */
// //   useEffect(() => {
// //     const onClick = (e) => {
// //       if (!showCalendar) return;
// //       const calendarNode = getCalendarNode();
// //       const target = e.target;
// //       if (calendarNode?.contains(target)) return;
// //       if (calToggleRef.current?.contains(target)) return;
// //       if (notifRef.current?.contains(target)) return;
// //       setShowCalendar(false);
// //       setPendingNotifications(false);
// //     };

// //     const onEsc = (e) => e.key === "Escape" && showCalendar && (setShowCalendar(false), setPendingNotifications(false));

// //     document.addEventListener("mousedown", onClick);
// //     document.addEventListener("touchstart", onClick);
// //     document.addEventListener("keydown", onEsc);

// //     return () => {
// //       document.removeEventListener("mousedown", onClick);
// //       document.removeEventListener("touchstart", onClick);
// //       document.removeEventListener("keydown", onEsc);
// //     };
// //   }, [showCalendar, portalRoot]);

// //   /* NOTIFICATION HANDLER */
// //   const handleNotificationClick = () => {
// //     fetchNotificationCount();
// //     if (pendingNotifications) return;
// //     if (showCalendar) {
// //       setPendingNotifications(true);
// //       setShowCalendar(false);
// //       return;
// //     }
// //     setShowNotifications((v) => !v);
// //   };

// //   const handleNotificationKeyDown = (e) => e.key === "Enter" && handleNotificationClick();

// //   useEffect(() => {
// //     if (pendingNotifications && !showCalendar) {
// //       setShowNotifications(true);
// //       setPendingNotifications(false);
// //     }
// //   }, [pendingNotifications, showCalendar]);

// //   const handleCalendarToggle = () => {
// //     if (showNotifications) setShowNotifications(false);
// //     setPendingNotifications(false);
// //     setShowCalendar((s) => !s);
// //   };

// //   /* MOBILE DETECTION */
// //   useEffect(() => {
// //     const check = () => setIsMobile(window.innerWidth <= 768);
// //     check();
// //     window.addEventListener("resize", check);
// //     return () => window.removeEventListener("resize", check);
// //   }, []);

// //   const mobileProps = {
// //     userName, userRole, avatar, orgName, notificationCount,
// //     showCalendar, setShowCalendar, showNotifications, setShowNotifications,
// //     handleNotificationClick, handleCalendarToggle, fetchNotificationCount,
// //     logout, portalRoot, calToggleRef, notifRef,
// //   };

// //   return isMobile ? (
// //     <MobileTopbar {...mobileProps} />
// //   ) : (
// //     /* DESKTOP */
// //     <div className="topbar1" ref={wrapperRef}>
// //       <div className="profile-section">
// //         {avatar ? (
// //           <img src={avatar} alt="Profile" className="profile-img" />
// //         ) : (
// //           <div className="profile-placeholder" />
// //         )}
// //         <div className="profile-info">
// //           <span className="profile-namedash">{userName}</span>
// //           <span className="profile-designation">{userRole}</span>
// //         </div>
// //       </div>

// //       <div className="org-name-section">
// //         <div className="org-name-card">
// //           <FontAwesomeIcon icon={faBuilding} className="org-icon" />
// //           <span>{String(orgName || "").toUpperCase()}</span>
// //         </div>
// //       </div>

// //       <div className="icon-section">
// //         <div
// //           className="notification-icon"
// //           role="button"
// //           tabIndex={0}
// //           ref={notifRef}
// //           onClick={handleNotificationClick}
// //           onKeyDown={handleNotificationKeyDown}
// //         >
// //           <FontAwesomeIcon icon={faBell} className="fa-icon" />
// //           {notificationCount > 0 && (
// //             <span className="notification-badge">{notificationCount}</span>
// //           )}
// //         </div>

// //         <Notifications
// //           visible={showNotifications}
// //           onClose={() => setShowNotifications(false)}
// //           onRead={() => fetchNotificationCount()}
// //         />

// //         <div
// //           role="button"
// //           tabIndex={0}
// //           aria-label="Toggle calendar"
// //           className="calendar-toggle"
// //           ref={calToggleRef}
// //           onClick={handleCalendarToggle}
// //           onKeyDown={(e) => e.key === "Enter" && handleCalendarToggle()}
// //         >
// //           <FontAwesomeIcon icon={faCalendarAlt} className="fa-icon" />
// //         </div>

// //         {showCalendar &&
// //           (portalRoot ? (
// //             ReactDOM.createPortal(
// //               <div className="calendar-dropdown">
// //                 <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// //               </div>,
// //               portalRoot
// //             )
// //           ) : (
// //             <div className="calendar-dropdown-inline">
// //               <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
// //             </div>
// //           ))}

// //         <div
// //           role="button"
// //           tabIndex={0}
// //           onClick={() => setTimeout(() => logout({ redirect: true }), 0)}
// //           onKeyDown={(e) => e.key === "Enter" && logout({ redirect: true })}
// //         >
// //           <FontAwesomeIcon icon={faPowerOff} className="fa-icon" />
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import React, { useEffect, useState, useCallback, useRef } from "react";
// import { useRouter } from "next/navigation";
// import HolidayCalendar from "../HolidayCalendar/HolidayCalendar.client";
// import Notifications from "./Notifications.client";
// import ReactDOM from "react-dom";
// import axios from "axios";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faBell,
//   faCalendarAlt,
//   faPowerOff,
//   faBuilding,
// } from "@fortawesome/free-solid-svg-icons";
// import "./Topbar.css";
// import { useAuth } from "../../context/AuthProvider.client";

// /* -------------------------------------------------
//    MOBILE TOPBAR
//    ------------------------------------------------- */
// function MobileTopbar(props) {
//   const {
//     userName,
//     userRole,
//     avatar,
//     orgName,
//     notificationCount,
//     showCalendar,
//     setShowCalendar,
//     showNotifications,
//     setShowNotifications,
//     handleNotificationClick,
//     handleCalendarToggle,
//     fetchNotificationCount,
//     logout,
//     portalRoot,
//     calToggleRef,
//     notifRef,
//   } = props;

//   return (
//     <div className="mobile-topbar-v2">
//       {/* FULL-COLOR HEADER */}
//       <div className="mobile-header-colored">
//         <div className="mobile-org-card">
//           {/* <FontAwesomeIcon icon={faBuilding} className="org-icon" /> */}
//           <span>{String(orgName || "").toUpperCase()}</span>
//         </div>
//       </div>

//       {/* Main Row */}
//       <div className="mobile-main-row">
//         <div className="mobile-profile-card">
//           {avatar ? (
//             <img src={avatar} alt="Profile" className="mobile-avatar" />
//           ) : (
//             <div className="mobile-avatar-placeholder">
//               <span>{userName.charAt(0)}</span>
//             </div>
//           )}
//           <div className="mobile-user-info">
//             <div className="mobile-user-name">{userName}</div>
//             <div className="mobile-user-role">{userRole}</div>
//           </div>
//         </div>

//         <div className="mobile-action-buttons">
//           <button
//             ref={notifRef}
//             onClick={handleNotificationClick}
//             className="mobile-action-btn"
//             aria-label="Notifications"
//           >
//             <FontAwesomeIcon icon={faBell} />
//             {notificationCount > 0 && (
//               <span className="mobile-badge">{notificationCount}</span>
//             )}
//           </button>

//           <button
//             ref={calToggleRef}
//             onClick={handleCalendarToggle}
//             className="mobile-action-btn"
//             aria-label="Calendar"
//           >
//             <FontAwesomeIcon icon={faCalendarAlt} />
//           </button>

//           <button
//             onClick={() => setTimeout(() => logout({ redirect: true }), 0)}
//             className="mobile-action-btn mobile-logout-btn"
//             aria-label="Logout"
//           >
//             <FontAwesomeIcon icon={faPowerOff} />
//           </button>
//         </div>
//       </div>

//       {/* Portals */}
//       <Notifications
//         visible={showNotifications}
//         onClose={() => setShowNotifications(false)}
//         onRead={() => fetchNotificationCount()}
//       />
//       {showCalendar &&
//         (portalRoot ? (
//           ReactDOM.createPortal(
//             <div className="mobile-calendar-overlay">
//               <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
//             </div>,
//             portalRoot
//           )
//         ) : (
//           <div className="mobile-calendar-inline">
//             <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
//           </div>
//         ))}
//     </div>
//   );
// }

// /* -------------------------------------------------
//    MAIN TOPBAR
//    ------------------------------------------------- */
// export default function Topbar() {
//   const router = useRouter();
//   const { user, logout, hydrated } = useAuth();

//   const [isMobile, setIsMobile] = useState(false);
//   const [userName, setUserName] = useState("User");
//   const [userRole, setUserRole] = useState("Role");
//   const [notificationCount, setNotificationCount] = useState(0);
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [pendingNotifications, setPendingNotifications] = useState(false);
//   const [avatar, setAvatar] = useState(null);
//   const [orgName, setOrgName] = useState("Loading...");

//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

//   useEffect(() => {}, [hydrated, user]);

//   const meId = user?.employeeId ?? user?.id ?? null;
//   const headers = meId
//     ? { "x-api-key": API_KEY || "", "x-employee-id": meId }
//     : { "x-api-key": API_KEY || "" };

//   /* USER NAME / ROLE */
//   useEffect(() => {
//     if (!hydrated) return;
//     if (user) {
//       setUserName(user.name || "User");
//       setUserRole(user.role || "Role");
//     } else {
//       setUserName("User");
//       setUserRole("Role");
//     }
//   }, [hydrated, user]);

//   /* NOTIFICATION COUNT */
//   const fetchNotificationCount = useCallback(() => {
//     if (!hydrated || !BACKEND_URL || !meId) return;
//     axios
//       .get(`${BACKEND_URL}/api/notifications`, { headers })
//       .then((res) => {
//         const list = res?.data?.notifications || res?.data?.message || [];
//         setNotificationCount(Array.isArray(list) ? list.length : list?.length || 0);
//       })
//       .catch((err) => console.error("Error fetching notification count", err));
//   }, [BACKEND_URL, meId, headers, hydrated]);

//   useEffect(() => {
//     if (!hydrated) return;
//     fetchNotificationCount();
//     const interval = setInterval(fetchNotificationCount, 60000);
//     return () => clearInterval(interval);
//   }, [fetchNotificationCount, hydrated]);

//   /* AVATAR & ORG NAME */
//   useEffect(() => {
//     if (!hydrated) {
//       setAvatar(null);
//       setOrgName("Loading...");
//       return;
//     }

//     let mounted = true;
//     let objectUrl = null;

//     const defaultAvatar = (role, gender) =>
//       role === "Admin"
//         ? "/images/admin-avatar.png"
//         : gender === "Female"
//         ? "/images/female-avatar.jpeg"
//         : "/images/male-avatar.jpeg";

//     const defaultPath = defaultAvatar(user?.role, user?.gender ?? user?.dashboard?.gender);

//     const normalizeInputUrl = (maybe) => {
//       if (!maybe) return null;
//       if (Array.isArray(maybe)) return maybe.length > 0 ? normalizeInputUrl(maybe[0]) : null;
//       if (typeof maybe === "object") {
//         return maybe.url || maybe.path || maybe.file || null;
//       }
//       if (typeof maybe === "string") {
//         const s = maybe.trim();
//         if (!s) return null;
//         try {
//           const parsed = JSON.parse(decodeURIComponent(s));
//           return normalizeInputUrl(Array.isArray(parsed) ? parsed[0] : parsed);
//         } catch {
//           return s;
//         }
//       }
//       return null;
//     };

//     const buildFetchUrl = (url) => {
//       const u = normalizeInputUrl(url);
//       if (!u) return null;
//       if (/^https?:\/\//i.test(u)) return u;
//       const base = BACKEND_URL.replace(/\/+$/g, "");
//       return u.startsWith("/docs") ? `${base}${u}` : `${base}/docs${u.startsWith("/") ? u : `/${u}`}`;
//     };

//     const dashboard = user?.dashboard ?? {};
//     const photoUrl = dashboard.photoUrl ?? dashboard.photo_url ?? null;

//     if (!user) {
//       setAvatar(defaultPath);
//       setOrgName("Unknown Organization");
//       return;
//     }

//     const fetchPhoto = async () => {
//       if (!photoUrl) return mounted && setAvatar(defaultPath);
//       const fetchUrl = buildFetchUrl(photoUrl);
//       if (!fetchUrl) return mounted && setAvatar(defaultPath);

//       try {
//         const resp = await axios.get(fetchUrl, { headers, responseType: "blob" });
//         if (!mounted) return;
//         if (objectUrl) URL.revokeObjectURL(objectUrl);
//         objectUrl = URL.createObjectURL(resp.data);
//         setAvatar(objectUrl);
//       } catch {
//         mounted && setAvatar(defaultPath);
//       }
//     };

//     fetchPhoto();

//     (async () => {
//       const orgId = user?.orgId ?? user?.raw?.org_id ?? null;
//       if (!orgId || !BACKEND_URL) return setOrgName("Unknown Organization");
//       try {
//         const resp = await axios.get(`${BACKEND_URL}/org/${orgId}`, {
//           headers: { "x-api-key": API_KEY || "", "x-employee-id": meId || "0" },
//         });
//         setOrgName(resp?.data?.Name ? String(resp.data.Name) : "Unknown Organization");
//       } catch {
//         setOrgName("Unknown Organization");
//       }
//     })();

//     return () => {
//       mounted = false;
//       if (objectUrl) URL.revokeObjectURL(objectUrl);
//     };
//   }, [hydrated, user, BACKEND_URL, API_KEY, meId]);

//   /* PORTAL & REFS */
//   const portalRoot = typeof document !== "undefined" ? document.getElementById("portal-root") : null;
//   const wrapperRef = useRef(null);
//   const notifRef = useRef(null);
//   const calToggleRef = useRef(null);

//   const getCalendarNode = () => {
//     if (portalRoot) {
//       const node = portalRoot.querySelector(".mobile-calendar-overlay, .mobile-calendar-inline");
//       if (node) return node;
//     }
//     return document.querySelector(".mobile-calendar-inline, .mobile-calendar-overlay");
//   };

//   /* OUTSIDE CLICK & ESC */
//   useEffect(() => {
//     const onClick = (e) => {
//       if (!showCalendar) return;
//       const calendarNode = getCalendarNode();
//       const target = e.target;
//       if (calendarNode?.contains(target)) return;
//       if (calToggleRef.current?.contains(target)) return;
//       if (notifRef.current?.contains(target)) return;
//       setShowCalendar(false);
//       setPendingNotifications(false);
//     };

//     const onEsc = (e) => e.key === "Escape" && showCalendar && (setShowCalendar(false), setPendingNotifications(false));

//     document.addEventListener("mousedown", onClick);
//     document.addEventListener("touchstart", onClick);
//     document.addEventListener("keydown", onEsc);

//     return () => {
//       document.removeEventListener("mousedown", onClick);
//       document.removeEventListener("touchstart", onClick);
//       document.removeEventListener("keydown", onEsc);
//     };
//   }, [showCalendar, portalRoot]);

//   /* NOTIFICATION HANDLER */
//   const handleNotificationClick = () => {
//     fetchNotificationCount();
//     if (pendingNotifications) return;
//     if (showCalendar) {
//       setPendingNotifications(true);
//       setShowCalendar(false);
//       return;
//     }
//     setShowNotifications((v) => !v);
//   };

//   const handleNotificationKeyDown = (e) => e.key === "Enter" && handleNotificationClick();

//   useEffect(() => {
//     if (pendingNotifications && !showCalendar) {
//       setShowNotifications(true);
//       setPendingNotifications(false);
//     }
//   }, [pendingNotifications, showCalendar]);

//   const handleCalendarToggle = () => {
//     if (showNotifications) setShowNotifications(false);
//     setPendingNotifications(false);
//     setShowCalendar((s) => !s);
//   };

//   /* MOBILE DETECTION */
//   useEffect(() => {
//     const check = () => setIsMobile(window.innerWidth <= 768);
//     check();
//     window.addEventListener("resize", check);
//     return () => window.removeEventListener("resize", check);
//   }, []);

//   const mobileProps = {
//     userName, userRole, avatar, orgName, notificationCount,
//     showCalendar, setShowCalendar, showNotifications, setShowNotifications,
//     handleNotificationClick, handleCalendarToggle, fetchNotificationCount,
//     logout, portalRoot, calToggleRef, notifRef,
//   };

//   return isMobile ? (
//     <MobileTopbar {...mobileProps} />
//   ) : (
//     /* DESKTOP */
//     <div className="topbar1" ref={wrapperRef}>
//       <div className="profile-section">
//         {avatar ? (
//           <img src={avatar} alt="Profile" className="profile-img" />
//         ) : (
//           <div className="profile-placeholder" />
//         )}
//         <div className="profile-info">
//           <span className="profile-namedash">{userName}</span>
//           <span className="profile-designation">{userRole}</span>
//         </div>
//       </div>

//       <div className="org-name-section">
//         <div className="org-name-card">
//           {/* <FontAwesomeIcon icon={faBuilding} className="org-icon" /> */}
//           <span>{String(orgName || "").toUpperCase()}</span>
//         </div>
//       </div>

//       <div className="icon-section">
//         <div
//           className="notification-icon"
//           role="button"
//           tabIndex={0}
//           ref={notifRef}
//           onClick={handleNotificationClick}
//           onKeyDown={handleNotificationKeyDown}
//         >
//           <FontAwesomeIcon icon={faBell} className="fa-icon" />
//           {notificationCount > 0 && (
//             <span className="notification-badge">{notificationCount}</span>
//           )}
//         </div>

//         <Notifications
//           visible={showNotifications}
//           onClose={() => setShowNotifications(false)}
//           onRead={() => fetchNotificationCount()}
//         />

//         <div
//           role="button"
//           tabIndex={0}
//           aria-label="Toggle calendar"
//           className="calendar-toggle"
//           ref={calToggleRef}
//           onClick={handleCalendarToggle}
//           onKeyDown={(e) => e.key === "Enter" && handleCalendarToggle()}
//         >
//           <FontAwesomeIcon icon={faCalendarAlt} className="fa-icon" />
//         </div>

//         {showCalendar &&
//           (portalRoot ? (
//             ReactDOM.createPortal(
//               <div className="calendar-dropdown">
//                 <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
//               </div>,
//               portalRoot
//             )
//           ) : (
//             <div className="calendar-dropdown-inline">
//               <HolidayCalendar closeCalendar={() => setShowCalendar(false)} />
//             </div>
//           ))}

//         <div
//           role="button"
//           tabIndex={0}
//           onClick={() => setTimeout(() => logout({ redirect: true }), 0)}
//           onKeyDown={(e) => e.key === "Enter" && logout({ redirect: true })}
//         >
//           <FontAwesomeIcon icon={faPowerOff} className="fa-icon" />
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
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

/* -------------------------------------------------
   MOBILE TOPBAR
   ------------------------------------------------- */
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
  } = props;

  return (
    <div className="mobile-topbar-v2">
      {/* FULL-COLOR HEADER */}
      <div className="mobile-header-colored">
        <div className="mobile-org-card">
          {/* <FontAwesomeIcon icon={faBuilding} className="org-icon" /> */}
          <span>{String(orgName || "").toUpperCase()}</span>
        </div>
      </div>

      {/* Main Row */}
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
            onClick={() => setTimeout(() => logout({ redirect: true }), 0)}
            className="mobile-action-btn mobile-logout-btn"
            aria-label="Logout"
          >
            <FontAwesomeIcon icon={faPowerOff} />
          </button>
        </div>
      </div>

      {/* Portals */}
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

/* -------------------------------------------------
   MAIN TOPBAR
   ------------------------------------------------- */
export default function Topbar() {
  const router = useRouter();
  const { user, logout, hydrated } = useAuth();

  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("Role");
  const [notificationCount, setNotificationCount] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [orgName, setOrgName] = useState("Loading...");

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {}, [hydrated, user]);

  const meId = user?.employeeId ?? user?.id ?? null;
  const headers = meId
    ? { "x-api-key": API_KEY || "", "x-employee-id": meId }
    : { "x-api-key": API_KEY || "" };

  /* USER NAME / ROLE */
  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      setUserName(user.name || "User");
      setUserRole(user.role || "Role");
    } else {
      setUserName("User");
      setUserRole("Role");
    }
  }, [hydrated, user]);

  /* NOTIFICATION COUNT */
  const fetchNotificationCount = useCallback(() => {
    if (!hydrated || !BACKEND_URL || !meId) return;
    axios
      .get(`${BACKEND_URL}/api/notifications`, { headers })
      .then((res) => {
        const list = res?.data?.notifications || res?.data?.message || [];
        setNotificationCount(Array.isArray(list) ? list.length : list?.length || 0);
      })
      .catch((err) => console.error("Error fetching notification count", err));
  }, [BACKEND_URL, meId, headers, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 60000);
    return () => clearInterval(interval);
  }, [fetchNotificationCount, hydrated]);

  /* AVATAR & ORG NAME */
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

    const defaultPath = defaultAvatar(user?.role, user?.gender ?? user?.dashboard?.gender);

    const normalizeInputUrl = (maybe) => {
      if (!maybe) return null;
      if (Array.isArray(maybe)) return maybe.length > 0 ? normalizeInputUrl(maybe[0]) : null;
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
      return u.startsWith("/docs") ? `${base}${u}` : `${base}/docs${u.startsWith("/") ? u : `/${u}`}`;
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
        const resp = await axios.get(fetchUrl, { headers, responseType: "blob" });
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
          headers: { "x-api-key": API_KEY || "", "x-employee-id": meId || "0" },
        });
        setOrgName(resp?.data?.Name ? String(resp.data.Name) : "Unknown Organization");
      } catch {
        setOrgName("Unknown Organization");
      }
    })();

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [hydrated, user, BACKEND_URL, API_KEY, meId]);

  /* PORTAL & REFS */
  const portalRoot = typeof document !== "undefined" ? document.getElementById("portal-root") : null;
  const wrapperRef = useRef(null);
  const notifRef = useRef(null);
  const calToggleRef = useRef(null);

  const getCalendarNode = () => {
    if (portalRoot) {
      const node = portalRoot.querySelector(".desktop-calendar-overlay, .mobile-calendar-overlay, .calendar-dropdown-inline");
      if (node) return node;
    }
    return document.querySelector(".calendar-dropdown-inline, .mobile-calendar-overlay, .desktop-calendar-overlay");
  };

  /* OUTSIDE CLICK & ESC */
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

    const onEsc = (e) => e.key === "Escape" && showCalendar && (setShowCalendar(false), setPendingNotifications(false));

    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showCalendar, portalRoot]);

  /* NOTIFICATION HANDLER */
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

  const handleNotificationKeyDown = (e) => e.key === "Enter" && handleNotificationClick();

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

  /* MOBILE DETECTION */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const mobileProps = {
    userName, userRole, avatar, orgName, notificationCount,
    showCalendar, setShowCalendar, showNotifications, setShowNotifications,
    handleNotificationClick, handleCalendarToggle, fetchNotificationCount,
    logout, portalRoot, calToggleRef, notifRef,
  };

  return isMobile ? (
    <MobileTopbar {...mobileProps} />
  ) : (
    /* DESKTOP – COLORED TEXT ONLY */
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
          {/* <FontAwesomeIcon icon={faBuilding} className="org-icon-text" /> */}
          <span>{String(orgName || "").toUpperCase()}</span>
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
          onClick={() => setTimeout(() => logout({ redirect: true }), 0)}
          onKeyDown={(e) => e.key === "Enter" && logout({ redirect: true })}
        >
          <FontAwesomeIcon icon={faPowerOff} className="fa-icon" />
        </div>
      </div>
    </div>
  );
}