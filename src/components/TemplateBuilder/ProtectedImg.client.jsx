"use client";

import React, { useEffect, useState, useRef } from "react";

const cache = new Map();

export default function ProtectedImg({
  src,
  apiKey,
  alt = "",
  className,
  loading = "lazy",
  style,
  credentials = true,
  fallback = null,
  ...rest
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    const cached = cache.get(src);
    if (cached && cached.blobUrl) {
      setBlobUrl(cached.blobUrl);
      setError(null);
      return;
    }

    controllerRef.current?.abort?.();
    const ac = new AbortController();
    controllerRef.current = ac;

    async function fetchImage() {
      try {
        setError(null);
        setBlobUrl(null);
        const opts = {
          method: "GET",
          credentials: "include",
          signal: ac.signal,
          headers: {},
        };
        if (apiKey) opts.headers["x-api-key"] = apiKey;
        if (credentials === true) opts.credentials = "include";
        else if (typeof credentials === "string")
          opts.credentials = credentials;

        const res = await fetch(src, opts);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Image fetch failed (${res.status}) ${text}`);
        }
        const contentType = res.headers.get("content-type") || "image/png";
        const buf = await res.blob();
        const url = URL.createObjectURL(buf);

        cache.set(src, { blobUrl: url, contentType, timestamp: Date.now() });

        if (!ac.signal.aborted) {
          setBlobUrl(url);
          setError(null);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        console.error("ProtectedImg fetch error:", err);
        setError(err.message || "Failed to load image");
      }
    }

    fetchImage();

    return () => {
      controllerRef.current?.abort?.();
      controllerRef.current = null;
    };
  }, [src, apiKey, credentials]);

  if (error) {
    return (
      fallback || (
        <div
          aria-label={alt || "image"}
          title={error}
          style={{
            display: "inline-block",
            minWidth: 40,
            minHeight: 28,
            background: "#f3f4f6",
            color: "#6b7280",
            fontSize: 12,
            textAlign: "center",
            lineHeight: "28px",
            ...style,
          }}
          className={className}
        >
          {alt || "Image"}
        </div>
      )
    );
  }

  if (!blobUrl) {
    return (
      fallback || (
        <div
          aria-hidden="true"
          style={{
            display: "inline-block",
            minWidth: 40,
            minHeight: 28,
            background: "#f8fafc",
            ...style,
          }}
          className={className}
        />
      )
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      loading={loading}
      style={style}
      {...rest}
    />
  );
}
