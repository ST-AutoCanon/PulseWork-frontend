"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client"; // adjust path if needed

const defaultAvatars = {
  admin: "/images/admin-avatar.png",
  female: "/images/female-avatar.jpeg",
  male: "/images/male-avatar.jpeg",
};

const UserAvatar = ({ photoUrl, role, gender, apiKey, className, alt }) => {
  const { user } = useAuth();
  const userEmployeeId = user?.employeeId ?? user?.id ?? null;
  const orgId = user?.orgId ?? user?.raw?.org_id ?? null;

  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const chooseFallback = () => {
      if (String(role).toLowerCase() === "admin") return defaultAvatars.admin;
      if (String(gender).toLowerCase() === "female")
        return defaultAvatars.female;
      return defaultAvatars.male;
    };

    const fetchPhoto = async () => {
      if (!photoUrl) {
        setAvatar(chooseFallback());
        return;
      }

      try {
        const headers = {
          "x-api-key": apiKey || process.env.NEXT_PUBLIC_API_KEY,
          ...(userEmployeeId ? { "x-employee-id": userEmployeeId } : {}),
          ...(orgId ? { "x-org-id": orgId } : {}),
        };

        const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        // Ensure leading slash for docs path
        const docsPath = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
        const url = `${base}/docs${docsPath}`;

        const resp = await axios.get(url, {
          responseType: "blob",
          headers,
        });

        if (cancelled) return;

        objectUrl = URL.createObjectURL(resp.data);
        setAvatar(objectUrl);
      } catch (err) {
        console.error("Error fetching photo:", err);
        if (!cancelled) setAvatar(chooseFallback());
      }
    };

    fetchPhoto();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
    // We intentionally depend on photoUrl/role/gender/apiKey/userEmployeeId/orgId
  }, [photoUrl, role, gender, apiKey, userEmployeeId, orgId]);

  const fallback = (() => {
    if (String(role).toLowerCase() === "admin") return defaultAvatars.admin;
    if (String(gender).toLowerCase() === "female") return defaultAvatars.female;
    return defaultAvatars.male;
  })();

  return (
    <img
      src={avatar || fallback}
      alt={alt ?? "Profile"}
      className={className}
      onError={(e) => {
        // in case the blob url or fallback fails for some reason
        e.currentTarget.src = fallback;
      }}
    />
  );
};

export default UserAvatar;
