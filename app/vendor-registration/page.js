import PublicVendorRegistration from "../../src/components/vendors/PublicVendorRegistration.client";
import { Suspense } from "react";

export default function VendorRegistrationPage() {
  return (
    <Suspense fallback={<p>Loading vendor registration...</p>}>
      <PublicVendorRegistration />
    </Suspense>
  );
}