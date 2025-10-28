"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Purchase from "../../src/components/Purchase/Purchase.client";

export default function PurchasePage() {
  const router = useRouter();
  return <Purchase onClose={() => router.back()} />;
}
