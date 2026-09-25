"use client";

import React, { Suspense } from "react";
import OfferResponse from "../../src/components/OfferResponse/OfferResponse.client";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OfferResponse />
    </Suspense>
  );
}
