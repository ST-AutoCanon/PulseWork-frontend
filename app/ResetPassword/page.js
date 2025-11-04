"use client";

import React, { Suspense } from "react";
import ResetPassword from "../../src/components/ResetPassword/ResetPassword.client";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
