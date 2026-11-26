"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { isValidEmail, normaliseNigerianPhone } from "@/lib/validation/forms";
import type {
  JobVacancyRow,
  JobApplicationRow,
  JobApplicationStatus,
  JobEmploymentType,
  JobWorkplaceType,
  JobSalaryPeriod,
} from "@easylife/shared-types";

export interface JobApplicationFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  applicationId?: string;
  referenceCode?: string;
}

export interface JobVacancyFormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  vacancyId?: string;
  slug?: string;
}

/**
 * Fetch a single job vacancy by slug or UUID.
 */
export async function getJobVacancyBySlugOrId(
  slugOrId: string
): Promise<(JobVacancyRow & { company_name?: string; business?: { id: string; name: string; slug: string; city?: string } | null; employer?: { id: string; company_name: string; slug: string; city?: string } | null }) | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slugOrId
    );

  const filter = isUuid ? `id=eq.${slugOrId}` : `slug=eq.${encodeURIComponent(slugOrId)}`;
  const res = await supabaseFetch<Array<JobVacancyRow & { business?: { id: string; name: string; slug: string; city?: string } | null; employer?: { id: string; company_name: string; slug: string; city?: string } | null }>>(
    config,
    `/rest/v1/job_vacancies?${filter}&select=*,business:businesses(id,name,slug,city),employer:employer_profiles(id,company_name,slug,city)&limit=1`
  );

  if (res.ok && Array.isArray(res.data) && res.data[0]) {
    const item = res.data[0];
    return {
      ...item,
      company_name:
        item.employer?.company_name ||
        item.business?.name ||
        "Verified EasyLife Partner Employer",
    };
  }
  return null;
}

/**
 * Fetch all applications submitted by the current authenticated user.
 */
export async function getJobApplicationsForUser(): Promise<
  Array<JobApplicationRow & { vacancy?: JobVacancyRow | null }>
> {
  const auth = await getAuthenticatedUser();
  if (!auth) return [];

  const config = getSupabasePublicConfig();
  if (!config) return [];

  const res = await supabaseFetch<
    Array<JobApplicationRow & { vacancy: JobVacancyRow | null }>
  >(
    config,
    `/rest/v1/job_applications?applicant_id=eq.${auth.user.id}&select=*,vacancy:job_vacancies(*)&order=created_at.desc`,
    { accessToken: auth.accessToken }
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Candidate Action: Submit an application for an open opportunity.
 */
export async function submitJobApplicationAction(
  _prevState: JobApplicationFormState,
  formData: FormData
): Promise<JobApplicationFormState> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      status: "error",
      message: "Please log in or register before submitting your job application.",
    };
  }

  const vacancyId = String(formData.get("vacancyId") || "").trim();
  const applicantName = String(formData.get("applicantName") || "").trim();
  const applicantEmail = String(formData.get("applicantEmail") || "").trim();
  const applicantPhone = String(formData.get("applicantPhone") || "").trim();
  const coverLetter = String(formData.get("coverLetter") || "").trim();
  const resumeUrl = String(formData.get("resumeUrl") || "").trim() || null;
  const portfolioRaw = String(formData.get("portfolioLinks") || "").trim();

  // Field Validations
  const fieldErrors: Record<string, string> = {};

  if (!vacancyId) {
    return { status: "error", message: "Vacancy identifier is missing." };
  }

  if (!applicantName || applicantName.length < 3) {
    fieldErrors.applicantName = "Please enter your full legal name (at least 3 characters).";
  }

  if (!applicantEmail || !isValidEmail(applicantEmail)) {
    fieldErrors.applicantEmail = "Please provide a valid email address.";
  }

  const phoneNormalized = normaliseNigerianPhone(applicantPhone);
  if (!phoneNormalized) {
    fieldErrors.applicantPhone =
      "Please provide a valid 11-digit Nigerian mobile phone number (e.g. 08012345678).";
  }

  if (!coverLetter || coverLetter.length < 20) {
    fieldErrors.coverLetter =
      "Please write a brief pitch or introduction explaining your experience (at least 20 characters).";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  // Parse portfolio links
  let portfolioLinks: string[] = [];
  if (portfolioRaw) {
    portfolioLinks = portfolioRaw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.startsWith("http"));
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { status: "error", message: "Database configuration error." };
  }

  // Check if candidate already applied to this vacancy
  const checkExisting = await supabaseFetch<Array<{ id: string }>>(
    config,
    `/rest/v1/job_applications?vacancy_id=eq.${vacancyId}&applicant_id=eq.${auth.user.id}&select=id&limit=1`,
    { accessToken: auth.accessToken }
  );

  if (checkExisting.ok && Array.isArray(checkExisting.data) && checkExisting.data.length > 0) {
    return {
      status: "error",
      message: "You have already submitted an application for this vacancy. Multiple applications are not permitted.",
    };
  }

  // Insert application
  const payload = {
    vacancy_id: vacancyId,
    applicant_id: auth.user.id,
    applicant_name: applicantName,
    applicant_email: applicantEmail,
    applicant_phone: phoneNormalized,
    cover_letter: coverLetter,
    resume_url: resumeUrl,
    portfolio_links: portfolioLinks,
    status: "submitted",
  };

  const insertRes = await supabaseFetch<Array<{ id: string; reference_code: string }>>(
    config,
    "/rest/v1/job_applications?select=id,reference_code",
    {
      method: "POST",
      accessToken: auth.accessToken,
      headers: {
        Prefer: "return=representation",
      },
      body: payload,
    }
  );

  if (!insertRes.ok) {
    return {
      status: "error",
      message:
        insertRes.message ||
        "Failed to record your application. Please check your network and try again.",
    };
  }

  if (!Array.isArray(insertRes.data) || !insertRes.data[0]) {
    return {
      status: "error",
      message: "No confirmation received from database. Please check your applications.",
    };
  }

  const appRecord = insertRes.data[0];

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${vacancyId}`);

  return {
    status: "success",
    message: "Your application was submitted successfully!",
    applicationId: appRecord.id,
    referenceCode: appRecord.reference_code,
  };
}

/**
 * Employer Action: Post a new job vacancy or apprenticeship role.
 */
export async function createJobVacancyAction(
  _prevState: JobVacancyFormState,
  formData: FormData
): Promise<JobVacancyFormState> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      status: "error",
      message: "Please log in to your employer or business account to post a vacancy.",
    };
  }

  const companyName = String(formData.get("companyName") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "Skilled Trades").trim();
  const employmentType = String(
    formData.get("employmentType") || "full_time"
  ).trim() as JobEmploymentType;
  const workplaceType = String(
    formData.get("workplaceType") || "on_site"
  ).trim() as JobWorkplaceType;
  const city = String(formData.get("city") || "Port Harcourt").trim();
  const state = String(formData.get("state") || "Rivers State").trim();
  const address = String(formData.get("address") || "").trim();
  const minSalaryRaw = String(formData.get("minSalaryNaira") || "").trim();
  const maxSalaryRaw = String(formData.get("maxSalaryNaira") || "").trim();
  const salaryPeriod = String(
    formData.get("salaryPeriod") || "month"
  ).trim() as JobSalaryPeriod;
  const isNegotiable = formData.get("isNegotiable") === "true";
  const description = String(formData.get("description") || "").trim();
  const requirements = String(formData.get("requirements") || "").trim();
  const responsibilities = String(formData.get("responsibilities") || "").trim();
  const positionsAvailable = Math.max(
    1,
    parseInt(String(formData.get("positionsAvailable") || "1"), 10) || 1
  );
  const applicationDeadline =
    String(formData.get("applicationDeadline") || "").trim() || null;
  const benefitsRaw = String(formData.get("benefits") || "").trim();

  // Field Validations
  const fieldErrors: Record<string, string> = {};

  if (!title || title.length < 5) {
    fieldErrors.title = "Vacancy title must be at least 5 characters.";
  }

  if (!description || description.length < 30) {
    fieldErrors.description =
      "Please provide a thorough description of the role (at least 30 characters).";
  }

  if (!requirements || requirements.length < 15) {
    fieldErrors.requirements = "Please outline key requirements or trade experience.";
  }

  if (!["Port Harcourt", "Lagos", "Abuja"].includes(city)) {
    fieldErrors.city = "Please select one of our supported pilot cities (Port Harcourt, Lagos, Abuja).";
  }

  const minSalaryNaira = minSalaryRaw ? parseFloat(minSalaryRaw.replace(/[^0-9.]/g, "")) : 0;
  const maxSalaryNaira = maxSalaryRaw ? parseFloat(maxSalaryRaw.replace(/[^0-9.]/g, "")) : 0;

  if (minSalaryNaira > 0 && maxSalaryNaira > 0 && minSalaryNaira > maxSalaryNaira) {
    fieldErrors.minSalaryNaira = "Minimum compensation cannot be greater than maximum compensation.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  // Parse benefits list
  const benefits = benefitsRaw
    ? benefitsRaw.split(/[\n,]+/).map((b) => b.trim()).filter(Boolean)
    : [];

  // Generate clean URL slug
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const uniqueSlug = `${baseSlug}-${city.toLowerCase().replace(/\s+/g, "")}-${Date.now().toString(36)}`;

  const config = getSupabasePublicConfig();
  if (!config) {
    return { status: "error", message: "Database configuration missing." };
  }

  // Detect if the poster owns a business or employer profile
  let businessId: string | null = null;
  let employerId: string | null = null;

  try {
    const bizRes = await supabaseAdminFetch<Array<{ id: string }>>(
      `/rest/v1/businesses?owner_id=eq.${auth.user.id}&select=id&limit=1`
    );
    if (bizRes.ok && Array.isArray(bizRes.data) && bizRes.data[0]) {
      businessId = bizRes.data[0].id;
    }

    const empRes = await supabaseAdminFetch<Array<{ id: string }>>(
      `/rest/v1/employer_profiles?user_id=eq.${auth.user.id}&select=id&limit=1`
    );
    if (empRes.ok && Array.isArray(empRes.data) && empRes.data[0]) {
      employerId = empRes.data[0].id;
    } else if (!businessId && companyName) {
      // Auto-create employer profile for newly posting employer
      const empSlug =
        companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") + `-${Date.now().toString(36)}`;
      const createEmpRes = await supabaseAdminFetch<Array<{ id: string }>>(
        "/rest/v1/employer_profiles?select=id",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: {
            user_id: auth.user.id,
            company_name: companyName,
            slug: empSlug,
            city,
            state,
            verification_status: "approved",
            is_verified: true,
            is_active: true,
          },
        }
      );
      if (
        createEmpRes.ok &&
        Array.isArray(createEmpRes.data) &&
        createEmpRes.data[0]
      ) {
        employerId = createEmpRes.data[0].id;
      }
    }
  } catch (err) {
    console.warn("Could not resolve business/employer profile for vacancy:", err);
  }

  const payload = {
    employer_id: employerId,
    business_id: businessId,
    posted_by: auth.user.id,
    title,
    slug: uniqueSlug,
    category,
    employment_type: employmentType,
    workplace_type: workplaceType,
    city,
    state,
    address: address || null,
    min_salary_kobo: minSalaryNaira > 0 ? Math.round(minSalaryNaira * 100) : null,
    max_salary_kobo: maxSalaryNaira > 0 ? Math.round(maxSalaryNaira * 100) : null,
    salary_period: salaryPeriod,
    currency_code: "NGN",
    is_negotiable: isNegotiable,
    benefits,
    description,
    requirements,
    responsibilities: responsibilities || null,
    positions_available: positionsAvailable,
    application_deadline: applicationDeadline,
    status: "open",
    moderation_status: "approved",
  };

  const res = await supabaseFetch<Array<{ id: string; slug: string }>>(
    config,
    "/rest/v1/job_vacancies?select=id,slug",
    {
      method: "POST",
      accessToken: auth.accessToken,
      headers: {
        Prefer: "return=representation",
      },
      body: payload,
    }
  );

  if (!res.ok) {
    return {
      status: "error",
      message: res.message || "Failed to post job vacancy to database.",
    };
  }

  if (!Array.isArray(res.data) || !res.data[0]) {
    return {
      status: "error",
      message: "No confirmation received from database.",
    };
  }

  const created = res.data[0];

  revalidatePath("/jobs");

  return {
    status: "success",
    message: "Job vacancy published successfully!",
    vacancyId: created.id,
    slug: created.slug,
  };
}

/**
 * Employer Action: Update application status (shortlisted, rejected, offered).
 */
export async function updateJobApplicationStatusAction(
  applicationId: string,
  newStatus: JobApplicationStatus,
  notes?: string
): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const res = await supabaseAdminFetch(
    `/rest/v1/job_applications?id=eq.${applicationId}`,
    {
      method: "PATCH",
      body: {
        status: newStatus,
        employer_notes: notes || null,
        reviewed_at: new Date().toISOString(),
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to update application status." };
  }

  revalidatePath("/jobs");
  revalidatePath("/business/jobs");
  return { ok: true, message: `Application status updated to ${newStatus}.` };
}

/**
 * Employer Action: Toggle vacancy status between open, paused, and closed.
 */
export async function toggleJobVacancyStatusAction(
  vacancyId: string,
  newStatus: "open" | "closed" | "paused"
): Promise<{ ok: boolean; message: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, message: "Authentication required." };
  }

  const res = await supabaseAdminFetch(
    `/rest/v1/job_vacancies?id=eq.${vacancyId}`,
    {
      method: "PATCH",
      body: {
        status: newStatus,
        updated_at: new Date().toISOString(),
      },
    }
  );

  if (!res.ok) {
    return { ok: false, message: res.message || "Failed to update vacancy status." };
  }

  revalidatePath("/jobs");
  revalidatePath("/business/jobs");
  return { ok: true, message: `Vacancy marked as ${newStatus}.` };
}

export interface EmployerVacancyWithApplications extends JobVacancyRow {
  applications: JobApplicationRow[];
  business?: { id: string; name: string; slug: string } | null;
  employer?: { id: string; company_name: string; slug: string } | null;
}

export interface EmployerJobsPortalData {
  vacancies: EmployerVacancyWithApplications[];
  summary: {
    totalVacancies: number;
    openVacancies: number;
    totalApplications: number;
    pendingApplications: number;
    shortlistedApplications: number;
    interviewedApplications: number;
    offeredApplications: number;
  };
}

/**
 * Retrieve vacancies and candidate applications for the authenticated employer / business.
 */
export async function getEmployerVacanciesAndApplications(): Promise<EmployerJobsPortalData> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      vacancies: [],
      summary: {
        totalVacancies: 0,
        openVacancies: 0,
        totalApplications: 0,
        pendingApplications: 0,
        shortlistedApplications: 0,
        interviewedApplications: 0,
        offeredApplications: 0,
      },
    };
  }

  // 1. Find user's businesses and employer profiles
  const bizRes = await supabaseAdminFetch<Array<{ id: string }>>(
    `/rest/v1/businesses?owner_id=eq.${auth.user.id}&select=id`
  );
  const businessIds =
    bizRes.ok && Array.isArray(bizRes.data) ? bizRes.data.map((b) => b.id) : [];

  const empRes = await supabaseAdminFetch<Array<{ id: string }>>(
    `/rest/v1/employer_profiles?user_id=eq.${auth.user.id}&select=id`
  );
  const employerIds =
    empRes.ok && Array.isArray(empRes.data) ? empRes.data.map((e) => e.id) : [];

  // Build filter: posted_by=eq.userId OR business_id in (...) OR employer_id in (...)
  const orFilters = [`posted_by.eq.${auth.user.id}`];
  if (businessIds.length > 0) {
    orFilters.push(`business_id.in.(${businessIds.join(",")})`);
  }
  if (employerIds.length > 0) {
    orFilters.push(`employer_id.in.(${employerIds.join(",")})`);
  }

  // Check if caller holds admin privileges
  const profileRes = await supabaseAdminFetch<Array<{ primary_role: string }>>(
    `/rest/v1/profiles?id=eq.${auth.user.id}&limit=1&select=primary_role`
  );
  const isAdmin =
    profileRes.ok &&
    Array.isArray(profileRes.data) &&
    profileRes.data[0]?.primary_role === "admin";

  // If user is admin or tester, load all vacancies if no specific ones match
  const filterQuery = isAdmin ? "" : `&or=(${orFilters.join(",")})`;

  let vacRes = await supabaseAdminFetch<EmployerVacancyWithApplications[]>(
    `/rest/v1/job_vacancies?select=*,business:businesses(id,name,slug),employer:employer_profiles(id,company_name,slug)&order=created_at.desc${filterQuery}`
  );

  // Fallback for testing: if user has no vacancies yet and is admin, query all vacancies
  if ((!vacRes.ok || !vacRes.data?.length) && isAdmin) {
    vacRes = await supabaseAdminFetch<EmployerVacancyWithApplications[]>(
      `/rest/v1/job_vacancies?select=*,business:businesses(id,name,slug),employer:employer_profiles(id,company_name,slug)&order=created_at.desc`
    );
  }

  const vacancies = vacRes.ok && Array.isArray(vacRes.data) ? vacRes.data : [];
  if (vacancies.length === 0) {
    return {
      vacancies: [],
      summary: {
        totalVacancies: 0,
        openVacancies: 0,
        totalApplications: 0,
        pendingApplications: 0,
        shortlistedApplications: 0,
        interviewedApplications: 0,
        offeredApplications: 0,
      },
    };
  }

  const vacancyIds = vacancies.map((v) => v.id);
  const appRes = await supabaseAdminFetch<JobApplicationRow[]>(
    `/rest/v1/job_applications?vacancy_id=in.(${vacancyIds.join(",")})&order=created_at.desc`
  );

  const applications = appRes.ok && Array.isArray(appRes.data) ? appRes.data : [];

  const appMap = new Map<string, JobApplicationRow[]>();
  for (const app of applications) {
    const list = appMap.get(app.vacancy_id) || [];
    list.push(app);
    appMap.set(app.vacancy_id, list);
  }

  let totalApplications = 0;
  let pendingApplications = 0;
  let shortlistedApplications = 0;
  let interviewedApplications = 0;
  let offeredApplications = 0;

  for (const vac of vacancies) {
    vac.applications = appMap.get(vac.id) || [];
    totalApplications += vac.applications.length;
    for (const app of vac.applications) {
      if (app.status === "submitted" || app.status === "under_review") pendingApplications++;
      if (app.status === "shortlisted") shortlistedApplications++;
      if (app.status === "interviewed") interviewedApplications++;
      if (app.status === "offered") offeredApplications++;
    }
  }

  const openVacancies = vacancies.filter((v) => v.status === "open").length;

  return {
    vacancies,
    summary: {
      totalVacancies: vacancies.length,
      openVacancies,
      totalApplications,
      pendingApplications,
      shortlistedApplications,
      interviewedApplications,
      offeredApplications,
    },
  };
}
