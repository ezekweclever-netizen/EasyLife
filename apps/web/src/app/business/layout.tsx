import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "/business";

  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  return <>{children}</>;
}
