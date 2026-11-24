import { redirect } from "next/navigation";

interface ExploreServicesRedirectProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ExploreServicesRedirectPage({
  searchParams,
}: ExploreServicesRedirectProps) {
  const params = await searchParams;
  const sp = new URLSearchParams();

  for (const [key, val] of Object.entries(params)) {
    if (typeof val === "string") {
      sp.set(key, val);
    } else if (Array.isArray(val)) {
      val.forEach((v) => sp.append(key, v));
    }
  }

  const qs = sp.toString();
  redirect(qs ? `/services?${qs}` : "/services");
}
