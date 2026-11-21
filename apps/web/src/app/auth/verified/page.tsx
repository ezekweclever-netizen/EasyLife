import React, { Suspense } from "react";
import { PublicShell } from "@/components/site/public-shell";
import { EmailVerifiedClient } from "./email-verified-client";

export const metadata = {
  title: "Email Verified | EasyLife",
  description: "Account email verification status for EasyLife.",
};

export default function EmailVerifiedPage() {
  return (
    <PublicShell>
      <Suspense
        fallback={
          <div className="py-20 flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full" />
          </div>
        }
      >
        <EmailVerifiedClient />
      </Suspense>
    </PublicShell>
  );
}
