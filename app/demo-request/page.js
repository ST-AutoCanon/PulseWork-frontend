"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DemoRequest from "../../src/components/DemoRequest/DemoRequest.client";
export default function DemoRequestPage() {
  const router = useRouter();

  return <DemoRequest onClose={() => router.back()} />;
}
