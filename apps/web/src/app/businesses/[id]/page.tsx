import { redirect } from "next/navigation";

export default async function LegacyBusinessRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/business-hub/${id}`);
}
