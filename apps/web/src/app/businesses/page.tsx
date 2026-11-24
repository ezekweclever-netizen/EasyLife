import { redirect } from "next/navigation";

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; q?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.city) qs.set("city", params.city);
  if (params.q) qs.set("q", params.q);
  const target = qs.toString() ? `/business-hub?${qs.toString()}` : "/business-hub";
  redirect(target);
}
