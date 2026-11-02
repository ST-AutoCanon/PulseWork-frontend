"use client";

import React, { Suspense } from "react";
import OnboardingDocumentsPage from "../../src/components/OnboardingDocuments/OnboardingDocuments.client";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardingDocumentsPage />;
    </Suspense>
  );
}
