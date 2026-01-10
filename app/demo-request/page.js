"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DemoRequest from "../../src/components/DemoRequest/DemoRequest.client";
// import "../../src/components/FacePunch/FacePunch.client.jsxs";
export default function DemoRequestPage() {
  const router = useRouter();

  return <DemoRequest onClose={() => router.back()} />;
}
