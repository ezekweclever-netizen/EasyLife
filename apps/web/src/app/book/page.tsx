import { redirect } from "next/navigation";

interface BookPageProps {
  searchParams: Promise<{
    category?: string;
    service?: string;
    pro?: string;
    city?: string;
    title?: string;
    description?: string;
    urgency?: "normal" | "high" | "emergency";
  }>;
}

export default async function BookServicePage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.service) qs.set("service", params.service);
  if (params.pro) qs.set("pro", params.pro);
  if (params.city) qs.set("city", params.city);
  if (params.title) qs.set("title", params.title);
  if (params.description) qs.set("description", params.description);
  if (params.urgency) qs.set("urgency", params.urgency);

  const destination = qs.toString() ? `/post-a-need?${qs.toString()}` : "/post-a-need";
  redirect(destination);
}
