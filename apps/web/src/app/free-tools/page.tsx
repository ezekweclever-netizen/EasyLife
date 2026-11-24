import { redirect } from "next/navigation";

export default async function FreeToolsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.tab) qs.set("tab", params.tab);
  if (params.q) qs.set("q", params.q);

  const target = qs.toString() ? `/tools?${qs.toString()}` : "/tools";
  redirect(target);
}
