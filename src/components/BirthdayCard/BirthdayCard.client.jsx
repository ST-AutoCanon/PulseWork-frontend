


"use client";

import React, { useEffect, useState } from "react";
import "./BirthdayCard.css";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider.client";

/*
 * ---------------------------------------------------------
 * IMPORTANT:
 * React Strict Mode can run useEffect twice in development.
 *
 * This module-level cache makes sure the same birthday API
 * request is NOT sent twice during the Strict Mode remount.
 * ---------------------------------------------------------
 */

const birthdayRequestCache = new Map();

const getBirthdayRequestKey = ({
  BACKEND_URL,
  email,
  orgId,
  meId,
}) => {
  return [
    BACKEND_URL || "",
    String(orgId || ""),
    String(meId || ""),
    String(email || "").trim().toLowerCase(),
  ].join("|");
};

const fetchBirthdayData = ({
  BACKEND_URL,
  API_KEY,
  meId,
  orgId,
  email,
}) => {
  const key = getBirthdayRequestKey({
    BACKEND_URL,
    email,
    orgId,
    meId,
  });

  /*
   * If the same request is already running, reuse it.
   */
  if (birthdayRequestCache.has(key)) {
    console.debug(
      "BirthdayCard: reusing existing birthday request"
    );

    return birthdayRequestCache.get(key);
  }

  const url = `${(BACKEND_URL || "").replace(
    /\/$/,
    ""
  )}/api/employee/birthday/${encodeURIComponent(email)}`;

  console.log("BirthdayCard API:", url);

  const request = axios
    .get(url, {
      withCredentials: true,
      headers: {
        "x-api-key": API_KEY || "",
        "x-employee-id": meId || "0",
        "x-org-id": orgId,
      },
    })
    .then((response) => {
      console.log(
        "BirthdayCard API response:",
        response?.data
      );

      return response?.data || {};
    })
    .catch((error) => {
      /*
       * Remove failed requests from cache so a later
       * legitimate retry is still possible.
       */
      birthdayRequestCache.delete(key);

      throw error;
    });

  /*
   * Store the Promise immediately.
   */
  birthdayRequestCache.set(key, request);

  return request;
};

const BirthdayCard = () => {
  const { user, hydrated } = useAuth();

  /*
   * CHANGED:
   * Previously this was one celebration.
   *
   * Now it is an array so birthday + work anniversary
   * can both be displayed together.
   */
  const [celebrations, setCelebrations] = useState([]);

  const [loading, setLoading] = useState(true);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
    user?.raw?.organisation_id ??
    user?.raw?.orgId ??
    null;

  const email =
    user?.email ??
    user?.raw?.email ??
    user?.employee_email ??
    user?.raw?.employee_email ??
    null;

  useEffect(() => {
    let mounted = true;

    if (!hydrated) {
      return;
    }

    if (!orgId || !email) {
      console.warn(
        "BirthdayCard: missing user information",
        {
          hydrated,
          meId,
          orgId,
          email,
        }
      );

      setLoading(false);
      setCelebrations([]);

      return;
    }

    const loadCelebration = async () => {
      try {
        setLoading(true);

        /*
         * The request itself is cached outside the component.
         */
        const data = await fetchBirthdayData({
          BACKEND_URL,
          API_KEY,
          meId,
          orgId,
          email,
        });

        if (!mounted) {
          return;
        }

        /*
         * ---------------------------------------------------
         * Get my celebrations
         * ---------------------------------------------------
         */

        let myCelebrations = [];

        if (Array.isArray(data?.myCelebrations)) {
          myCelebrations = data.myCelebrations;
        } else if (
          Array.isArray(data?.my_celebrations)
        ) {
          myCelebrations = data.my_celebrations;
        } else if (
          Array.isArray(data?.data?.myCelebrations)
        ) {
          myCelebrations =
            data.data.myCelebrations;
        } else if (
          Array.isArray(data?.data?.my_celebrations)
        ) {
          myCelebrations =
            data.data.my_celebrations;
        }

        /*
         * ---------------------------------------------------
         * IMPORTANT CHANGE
         * ---------------------------------------------------
         *
         * Do NOT select only the first celebration.
         *
         * Keep all celebrations belonging to the
         * logged-in employee.
         *
         * This allows:
         *
         * Birthday
         * +
         * Work Anniversary
         *
         * on the same day.
         */

        let selectedCelebrations = [];

        /*
         * First priority:
         * records explicitly marked as self.
         */

        const explicitlySelf = myCelebrations.filter(
          (item) => {
            const value =
              item?.is_self ??
              item?.isSelf ??
              item?.self;

            return (
              value === true ||
              value === 1 ||
              value === "1" ||
              String(value).toLowerCase() === "true"
            );
          }
        );

        /*
         * If the API already gives myCelebrations
         * scoped to the logged-in employee, use all
         * of them.
         *
         * This is important because there may be:
         *
         * [
         *   birthday,
         *   work_anniversary
         * ]
         */

        if (myCelebrations.length > 0) {
          if (explicitlySelf.length > 0) {
            selectedCelebrations = explicitlySelf;
          } else {
            selectedCelebrations = [...myCelebrations];
          }
        }

        /*
         * ---------------------------------------------------
         * Fallback:
         * Search all celebrations for the logged-in employee.
         * ---------------------------------------------------
         */

        if (selectedCelebrations.length === 0) {
          const allCelebrations = [
            ...(Array.isArray(
              data?.myCelebrations
            )
              ? data.myCelebrations
              : []),

            ...(Array.isArray(
              data?.otherCelebrations
            )
              ? data.otherCelebrations
              : []),

            ...(Array.isArray(
              data?.my_celebrations
            )
              ? data.my_celebrations
              : []),

            ...(Array.isArray(
              data?.other_celebrations
            )
              ? data.other_celebrations
              : []),

            ...(Array.isArray(
              data?.data?.myCelebrations
            )
              ? data.data.myCelebrations
              : []),

            ...(Array.isArray(
              data?.data?.otherCelebrations
            )
              ? data.data.otherCelebrations
              : []),
          ];

          const currentEmail = String(email)
            .trim()
            .toLowerCase();

          const currentId = String(
            meId || ""
          ).trim();

          selectedCelebrations =
            allCelebrations.filter((item) => {
              const itemEmail = String(
                item?.email ??
                  item?.employee_email ??
                  item?.employeeEmail ??
                  ""
              )
                .trim()
                .toLowerCase();

              const itemId = String(
                item?.employee_id ??
                  item?.employeeId ??
                  item?.emp_id ??
                  item?.empId ??
                  item?.user_id ??
                  item?.userId ??
                  item?.id ??
                  ""
              ).trim();

              return (
                (currentEmail &&
                  itemEmail &&
                  currentEmail === itemEmail) ||
                (currentId &&
                  itemId &&
                  currentId === itemId)
              );
            });
        }

        /*
         * ---------------------------------------------------
         * Remove duplicate birthday / anniversary records.
         * ---------------------------------------------------
         *
         * This prevents the same celebration from appearing
         * twice if the backend returns duplicate structures.
         */

        const uniqueCelebrations = [];

        const celebrationKeys = new Set();

        selectedCelebrations.forEach((item) => {
          const type = String(
            item?.type ??
              item?.celebration_type ??
              item?.celebrationType ??
              ""
          )
            .trim()
            .toLowerCase();

          const normalizedType =
            type === "birth_day"
              ? "birthday"
              : type === "work anniversary" ||
                type === "work-anniversary" ||
                type === "anniversary"
              ? "work_anniversary"
              : type;

          const years = Number(
            item?.completed_years ??
              item?.completedYears ??
              item?.years_completed ??
              item?.years ??
              0
          );

          const key = `${normalizedType}|${years}`;

          if (!celebrationKeys.has(key)) {
            celebrationKeys.add(key);
            uniqueCelebrations.push(item);
          }
        });

        /*
         * ---------------------------------------------------
         * Keep birthday first, anniversary second.
         * ---------------------------------------------------
         */

        uniqueCelebrations.sort((a, b) => {
          const getType = (item) =>
            String(
              item?.type ??
                item?.celebration_type ??
                item?.celebrationType ??
                ""
            )
              .trim()
              .toLowerCase();

          const typeA = getType(a);
          const typeB = getType(b);

          const priority = (type) => {
            if (
              type === "birthday" ||
              type === "birth_day"
            ) {
              return 1;
            }

            if (
              type === "work_anniversary" ||
              type === "work anniversary" ||
              type === "work-anniversary" ||
              type === "anniversary"
            ) {
              return 2;
            }

            return 3;
          };

          return priority(typeA) - priority(typeB);
        });

        console.log(
          "BirthdayCard selected celebrations:",
          uniqueCelebrations
        );

        if (mounted) {
          setCelebrations(uniqueCelebrations);
        }
      } catch (error) {
        console.error(
          "BirthdayCard API error:",
          error?.response?.data || error
        );

        if (mounted) {
          setCelebrations([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCelebration();

    return () => {
      mounted = false;
    };
  }, [
    hydrated,
    orgId,
    email,
    meId,
    BACKEND_URL,
    API_KEY,
  ]);

  /*
   * ---------------------------------------------------------
   * Nothing to display
   * ---------------------------------------------------------
   */

  if (
    loading ||
    !celebrations ||
    celebrations.length === 0
  ) {
    return null;
  }

  /*
   * ---------------------------------------------------------
   * Normalize celebrations
   * ---------------------------------------------------------
   */

  const normalizedCelebrations =
    celebrations
      .map((celebration) => {
        const type = String(
          celebration?.type ??
            celebration?.celebration_type ??
            celebration?.celebrationType ??
            ""
        )
          .trim()
          .toLowerCase();

        const isBirthday =
          type === "birthday" ||
          type === "birth_day";

        const isWorkAnniversary =
          type === "work_anniversary" ||
          type === "work anniversary" ||
          type === "work-anniversary" ||
          type === "anniversary";

        return {
          ...celebration,
          isBirthday,
          isWorkAnniversary,
        };
      })
      .filter(
        (item) =>
          item.isBirthday ||
          item.isWorkAnniversary
      );

  if (normalizedCelebrations.length === 0) {
    return null;
  }

  /*
   * ---------------------------------------------------------
   * Employee name
   * ---------------------------------------------------------
   */

  const firstCelebration =
    normalizedCelebrations[0];

  const displayName =
    firstCelebration?.full_name ||
    firstCelebration?.fullName ||
    firstCelebration?.employee_name ||
    firstCelebration?.employeeName ||
    `${firstCelebration?.first_name || ""} ${
      firstCelebration?.last_name || ""
    }`.trim() ||
    user?.name ||
    user?.full_name ||
    "Employee";

  /*
   * ---------------------------------------------------------
   * Check which celebrations exist
   * ---------------------------------------------------------
   */

  const hasBirthday =
    normalizedCelebrations.some(
      (item) => item.isBirthday
    );

  const anniversaryCelebration =
    normalizedCelebrations.find(
      (item) => item.isWorkAnniversary
    );

  const hasWorkAnniversary =
    Boolean(anniversaryCelebration);

  /*
   * ---------------------------------------------------------
   * Completed years
   * ---------------------------------------------------------
   */

  const completedYears = hasWorkAnniversary
    ? Number(
        anniversaryCelebration?.completed_years ??
          anniversaryCelebration?.completedYears ??
          anniversaryCelebration?.years_completed ??
          anniversaryCelebration?.years ??
          1
      ) || 1
    : 1;

  /*
   * ---------------------------------------------------------
   * Ordinal helper
   * ---------------------------------------------------------
   */

  const getOrdinal = (number) => {
    const n = Number(number);

    if (
      n % 100 >= 11 &&
      n % 100 <= 13
    ) {
      return `${n}th`;
    }

    if (n % 10 === 1) {
      return `${n}st`;
    }

    if (n % 10 === 2) {
      return `${n}nd`;
    }

    if (n % 10 === 3) {
      return `${n}rd`;
    }

    return `${n}th`;
  };

  /*
   * ---------------------------------------------------------
   * IMPORTANT:
   * Create both messages independently.
   * ---------------------------------------------------------
   */

  let birthdayTitle = "";
  let birthdayDescription = "";

  let anniversaryTitle = "";
  let anniversaryDescription = "";

  if (hasBirthday) {
    birthdayTitle = `Happy Birthday, ${displayName}!`;

    birthdayDescription =
      "Wishing you a wonderful day filled with happiness, success and memorable moments.";
  }

  if (hasWorkAnniversary) {
    anniversaryTitle = `Happy ${getOrdinal(
      completedYears
    )} Work Anniversary, ${displayName}!`;

    anniversaryDescription = `Congratulations on completing ${completedYears} ${
      completedYears === 1
        ? "year"
        : "years"
    } with the organization. Wishing you continued success!`;
  }

  /*
   * ---------------------------------------------------------
   * Combined title
   * ---------------------------------------------------------
   *
   * When both exist, both messages are shown.
   */

  const title = hasBirthday && hasWorkAnniversary
    ? `🎉 ${birthdayTitle} 🎊 ${anniversaryTitle}`
    : hasBirthday
    ? `🎉 ${birthdayTitle} 🎂`
    : `🎊 ${anniversaryTitle} 🎁`;

  /*
   * ---------------------------------------------------------
   * Combined description
   * ---------------------------------------------------------
   */

  const description =
    hasBirthday && hasWorkAnniversary
      ? `${birthdayDescription} ${anniversaryDescription}`
      : hasBirthday
      ? birthdayDescription
      : anniversaryDescription;

  /*
   * ---------------------------------------------------------
   * Card class
   * ---------------------------------------------------------
   *
   * Extra class when both celebrations happen together.
   */

  const cardClass = [
    "birthday-horizontal-card",
    hasBirthday && hasWorkAnniversary
      ? "birthday-horizontal-card-both"
      : hasBirthday
      ? "birthday-horizontal-card-birthday"
      : "birthday-horizontal-card-anniversary",
  ].join(" ");

  return (
    <section className={cardClass}>
      {/* =====================================================
          CONTINUOUS BACKGROUND SPARKLES
      ====================================================== */}

      <div
        className="birthday-confetti"
        aria-hidden="true"
      >
        <span className="confetti-piece c1">✦</span>
        <span className="confetti-piece c2">✧</span>
        <span className="confetti-piece c3">✨</span>
        <span className="confetti-piece c4">◆</span>
        <span className="confetti-piece c5">✦</span>
        <span className="confetti-piece c6">●</span>
        <span className="confetti-piece c7">✧</span>
        <span className="confetti-piece c8">★</span>
        <span className="confetti-piece c9">✦</span>
        <span className="confetti-piece c10">◆</span>
        <span className="confetti-piece c11">✨</span>
        <span className="confetti-piece c12">✧</span>
        <span className="confetti-piece c13">✦</span>
        <span className="confetti-piece c14">●</span>
        <span className="confetti-piece c15">★</span>
        <span className="confetti-piece c16">◆</span>

        <span className="confetti-piece c17">✦</span>
        <span className="confetti-piece c18">✧</span>
        <span className="confetti-piece c19">✨</span>
        <span className="confetti-piece c20">◆</span>
        <span className="confetti-piece c21">✦</span>
        <span className="confetti-piece c22">●</span>
        <span className="confetti-piece c23">✧</span>
        <span className="confetti-piece c24">★</span>
        <span className="confetti-piece c25">✦</span>
        <span className="confetti-piece c26">◆</span>
        <span className="confetti-piece c27">✨</span>
        <span className="confetti-piece c28">✧</span>
        <span className="confetti-piece c29">✦</span>
        <span className="confetti-piece c30">●</span>
        <span className="confetti-piece c31">★</span>
        <span className="confetti-piece c32">◆</span>

        <span className="confetti-piece c33">✦</span>
        <span className="confetti-piece c34">✨</span>
        <span className="confetti-piece c35">✧</span>
        <span className="confetti-piece c36">★</span>
      </div>

      {/* =====================================================
          LEFT CARTOON CHARACTER
      ====================================================== */}

      <div
        className="birthday-character birthday-character-left"
        aria-hidden="true"
      >
        <div className="birthday-character-body">
          <div className="birthday-character-head">
            <span className="character-eye character-eye-left" />
            <span className="character-eye character-eye-right" />
            <span className="character-smile" />
          </div>

          <div className="character-hair">
            <span />
            <span />
            <span />
          </div>

          <div className="character-party-hat">
            <span className="party-hat-ball" />
          </div>

          <div className="character-arm character-arm-left" />
          <div className="character-arm character-arm-right" />

          <div className="character-torso">
            <span className="character-star">★</span>
          </div>

          <div className="character-leg character-leg-left" />
          <div className="character-leg character-leg-right" />
        </div>
      </div>

      {/* =====================================================
          RIGHT CARTOON CHARACTER
      ====================================================== */}

      <div
        className="birthday-character birthday-character-right"
        aria-hidden="true"
      >
        <div className="birthday-character-body">
          <div className="birthday-character-head">
            <span className="character-eye character-eye-left" />
            <span className="character-eye character-eye-right" />
            <span className="character-smile" />
          </div>

          <div className="character-hair">
            <span />
            <span />
            <span />
          </div>

          <div className="character-party-hat">
            <span className="party-hat-ball" />
          </div>

          <div className="character-arm character-arm-left" />
          <div className="character-arm character-arm-right" />

          <div className="character-torso">
            <span className="character-star">★</span>
          </div>

          <div className="character-leg character-leg-left" />
          <div className="character-leg character-leg-right" />
        </div>
      </div>

      {/* =====================================================
          LEFT PARTY POPPER
      ====================================================== */}

      <div
        className="birthday-party-popper birthday-party-popper-left"
        aria-hidden="true"
      >
        <div className="party-popper-body">
          <span className="party-popper-opening" />
        </div>

        <div className="party-popper-burst">
          <i>✦</i>
          <i>◆</i>
          <i>●</i>
          <i>✧</i>
          <i>★</i>
          <i>◆</i>
        </div>
      </div>

      {/* =====================================================
          RIGHT PARTY POPPER
      ====================================================== */}

      <div
        className="birthday-party-popper birthday-party-popper-right"
        aria-hidden="true"
      >
        <div className="party-popper-body">
          <span className="party-popper-opening" />
        </div>

        <div className="party-popper-burst">
          <i>✦</i>
          <i>◆</i>
          <i>●</i>
          <i>✧</i>
          <i>★</i>
          <i>◆</i>
        </div>
      </div>

      {/* =====================================================
          CENTRAL CONTENT
      ====================================================== */}

     <div className="birthday-horizontal-content">
  {hasBirthday && (
    <div className="birthday-celebration-message">
      <div className="birthday-horizontal-title">
        <span className="birthday-title-emoji">🎂</span>

        <span className="birthday-title-text">
          {birthdayTitle}
        </span>
      </div>

      <div className="birthday-horizontal-description">
        {birthdayDescription}
      </div>
    </div>
  )}

  {hasWorkAnniversary && (
    <div className="birthday-celebration-message">
      <div className="birthday-horizontal-title">
        <span className="birthday-title-emoji">🎁</span>

        <span className="birthday-title-text">
          {anniversaryTitle}
        </span>
      </div>

      <div className="birthday-horizontal-description">
        {anniversaryDescription}
      </div>
    </div>
  )}
</div>

      {/* =====================================================
          CENTER CELEBRATION BURST
      ====================================================== */}

      <div
        className="birthday-center-burst"
        aria-hidden="true"
      >
        <span>✦</span>
        <span>✧</span>
        <span>✨</span>
        <span>✦</span>
        <span>✧</span>
        <span>★</span>
        <span>✦</span>
        <span>✨</span>
      </div>
    </section>
  );
};

export default BirthdayCard;
