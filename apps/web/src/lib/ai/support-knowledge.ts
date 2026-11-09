/**
 * EasyLife Approved Customer Support Knowledge Base
 * 
 * Sourced from officially accredited platform documentation, architecture decision records,
 * and service policies across all core modules.
 */

export interface KnowledgeTopic {
  id: string;
  title: string;
  slug: string;
  category: "registration" | "booking" | "verification" | "quotation" | "appointment" | "dispute" | "account";
  keywords: string[];
  summary: string;
  detailedContent: string;
  faqs: Array<{ question: string; answer: string }>;
}

export const SUPPORT_KNOWLEDGE_BASE: KnowledgeTopic[] = [
  {
    id: "kb-registration",
    title: "Account Registration & Onboarding",
    slug: "registration-guide",
    category: "registration",
    keywords: ["register", "sign up", "create account", "join", "artisan onboarding", "customer signup", "login"],
    summary: "How customers and professionals register on EasyLife with identity verification.",
    detailedContent: `
EasyLife provides two distinct registration paths:
1. Customer Accounts:
   - Requires: Full name, valid email address, Nigerian phone number (+234), and default service city/LGA.
   - Verification: OTP sent to the registered mobile number.
   - Access: Instant ability to browse accredited tradespeople, request quotes, and book emergency services.

2. Professional / Artisan Accounts:
   - Requires: Full name, trade category selection, business name (if applicable), physical workshop/office address, proof of identification (NIN slip, Voter's Card, or Driver's License), and vocational training / trade certifications.
   - Corporate Entities: Can register through the Business Management Portal and provide CAC registration numbers.
   - Review Timeline: All professional profiles undergo document verification within 24 to 48 hours before being listed on the public marketplace.
`,
    faqs: [
      {
        question: "Can I register as both a customer and an artisan?",
        answer: "Yes. You can switch between Customer Mode and Professional Mode within your profile settings once your identity is verified.",
      },
      {
        question: "Is there a registration fee for customers?",
        answer: "No. Customer registration on EasyLife is 100% free.",
      },
    ],
  },
  {
    id: "kb-booking",
    title: "Booking Procedures & Requesting Services",
    slug: "booking-procedures",
    category: "booking",
    keywords: ["book", "hire", "service request", "find artisan", "plumber", "electrician", "schedule service", "emergency"],
    summary: "How to search verified professionals, compare rates, and book appointments.",
    detailedContent: `
EasyLife simplifies booking home and commercial maintenance services:
1. Search & Discovery:
   - Browse by category (Plumbing, Electrical, AC, Generator, Solar, Carpentry, etc.) or enter your problem in natural language using the EasyLife AI Assistant.
   - Filter by city/LGA (e.g. Port Harcourt, Lagos, Abuja), verified badge status, and customer review ratings.

2. Booking Types:
   - Direct Booking: For standardized diagnostic services or fixed-rate call-outs. Select date and preferred time slot.
   - Quotation Request: For custom projects, extensive repairs, or installations. The professional reviews your description and issues an itemized breakdown.

3. Confirmation & Escrow Protection:
   - When a booking is confirmed, payment is securely held in EasyLife Escrow.
   - Funds are never paid directly to the professional until you approve completion with your 4-digit Job Completion PIN.
`,
    faqs: [
      {
        question: "What happens after I submit a booking request?",
        answer: "The assigned professional receives an instant SMS/push notification and has 2 hours to confirm or propose a revised time.",
      },
      {
        question: "Can I cancel a booking?",
        answer: "Yes. Bookings can be cancelled free of charge up to 2 hours before the scheduled appointment time.",
      },
    ],
  },
  {
    id: "kb-verification",
    title: "Professional Vetting & Verification Badges",
    slug: "professional-verification",
    category: "verification",
    keywords: ["verification", "vetting", "badge", "trust", "background check", "certified", "artisan security"],
    summary: "The 4-tier verification protocol ensuring marketplace safety.",
    detailedContent: `
EasyLife enforces strict safety standards before artisans can service homes and businesses:
1. Identity Verification: Government ID (NIN, International Passport, or Driver's License) validated against national databases.
2. Address Verification: Physical verification of residential address and workshop location.
3. Trade Competency & Reference Checks: Vocational certificates (e.g. NABTEB, City & Guilds) or minimum 3 verifiable references from past clients.
4. Police & Criminal Background Clearance: Criminal history check ensuring safety of clients and premises.

Verification Badges:
- 'Verified Pro': Completed ID, address, and trade checks.
- 'Elite Pro': Top 5% of marketplace performers with 4.8+ rating and over 50 completed jobs without unresolved disputes.
`,
    faqs: [
      {
        question: "How do I know if an artisan is verified?",
        answer: "Look for the teal 'Verified Pro' badge next to the professional's name on their profile and quotation documents.",
      },
    ],
  },
  {
    id: "kb-quotation",
    title: "Quotation Review & Escrow Acceptance",
    slug: "quotation-acceptance",
    category: "quotation",
    keywords: ["quote", "quotation", "price", "cost", "parts", "labour", "accept quote", "escrow", "paystack", "payment"],
    summary: "Understanding itemized quotations, labor, parts, and secure payment.",
    detailedContent: `
Every EasyLife quotation follows an itemized, transparent structure:
- Labour: Clearly states the diagnostic and workmanship cost.
- Materials / Parts: Itemized list of parts needed with quantities and unit prices.
- Additional Expenses: Transport/logistics and specialized equipment hire.
- Estimated Duration: Realistic time to complete the work.

Acceptance & Payment Process:
1. Review: You can inspect every line item in your customer dashboard.
2. Accept & Fund Escrow: When you accept, you fund the quotation total via Paystack, Flutterwave, or bank transfer into secure escrow.
3. Professional Action: The professional is notified that escrow is funded and proceeds to purchase materials and execute the job.
4. Critical Rule: Never pay cash directly to the artisan for quotation balances. Doing so voids EasyLife warranty and dispute protections.
`,
    faqs: [
      {
        question: "Can I decline or ask for revisions on a quote?",
        answer: "Yes. You can message the professional directly through the chat tab or decline the quotation with written feedback.",
      },
      {
        question: "Is my payment safe if the professional doesn't show up?",
        answer: "Yes. Escrow funds remain protected. If the professional fails to attend, 100% of your funds are returned.",
      },
    ],
  },
  {
    id: "kb-appointment",
    title: "Appointment Management & Completion PIN",
    slug: "appointment-management",
    category: "appointment",
    keywords: ["appointment", "reschedule", "artisan arrival", "pin", "completion code", "finish job"],
    summary: "Managing schedules, tracking arrival, and the 4-digit completion PIN.",
    detailedContent: `
Managing your EasyLife appointment:
1. Tracking Arrival: Professionals update status to 'En Route' and 'Arrived on Site'.
2. Rescheduling: You or the professional can reschedule the appointment through the appointment view up to 24 hours prior without fee.
3. Job Completion PIN:
   - When the professional finishes the job, they submit a Completion Request.
   - You must inspect the work thoroughly.
   - If satisfied, release the unique 4-digit Completion PIN displayed in your booking screen to the professional.
   - Entering this PIN releases escrow payout to the professional.
`,
    faqs: [
      {
        question: "What if the professional asks for the PIN before finishing?",
        answer: "Never share the completion PIN before inspecting and testing the completed work. The PIN is your guarantee.",
      },
    ],
  },
  {
    id: "kb-dispute",
    title: "Dispute Reporting & Problem Resolution",
    slug: "dispute-reporting",
    category: "dispute",
    keywords: ["dispute", "complaint", "incomplete work", "poor workmanship", "stolen", "damage", "refund", "problem", "report"],
    summary: "How to report incomplete work, poor workmanship, or submit complaints.",
    detailedContent: `
If a service does not meet expectations, EasyLife's Dispute Management System protects you:
1. Grounds for Dispute:
   - Incomplete work: Job left unfinished.
   - Poor workmanship: Fault persists or repair broke down immediately.
   - Unapproved additional charges: Professional demanding extra cash outside approved quote.
   - Missed appointments / No-show: Professional failed to arrive.
   - Property damage: Accidental damage during service.

2. How to File:
   - Click 'Report a Problem' on your booking screen.
   - Select the dispute category and upload photographic or video evidence.
   - Add a clear explanation of what went wrong.

3. Dispute Lifecycle:
   - Open -> Under Review -> Awaiting Information -> Resolved -> Rejected / Closed.
   - Disputed bookings FREEZE escrow payout immediately.
   - An EasyLife dispute administrator investigates evidence from both parties within 24 to 48 hours.
`,
    faqs: [
      {
        question: "Does a dispute mean I get a full refund?",
        answer: "If the administrator verifies incomplete work or misconduct, funds in escrow are refunded to your original payment method.",
      },
    ],
  },
  {
    id: "kb-account",
    title: "Account Management & Security Settings",
    slug: "account-management",
    category: "account",
    keywords: ["profile", "password", "phone", "email", "security", "notifications", "delete account", "settings"],
    summary: "Managing personal details, security settings, and notifications.",
    detailedContent: `
Keep your account secure:
- Profile Updates: Change name, email, phone number, and service locations from Profile Settings.
- Security: Two-factor authentication (2FA) via SMS OTP or authenticator app.
- Notification Preferences: Customize alerts for booking status, chat messages, quotes, and maintenance schedules via SMS, email, or in-app push.
`,
    faqs: [
      {
        question: "How do I change my phone number?",
        answer: "Go to Profile Settings > Security > Update Phone. An OTP will verify ownership of the new number.",
      },
    ],
  },
];

/**
 * High-priority Escalation Keywords
 * Any query containing these phrases immediately triggers human support escalation.
 */
export const HUMAN_ESCALATION_KEYWORDS = [
  "stolen",
  "steal",
  "theft",
  "thief",
  "assault",
  "threat",
  "threaten",
  "police",
  "damaged my property",
  "destroyed",
  "fraud",
  "scam",
  "court",
  "lawyer",
  "legal action",
  "ran away with money",
  "took money",
  "took cash",
  "off-platform",
  "abandoned the job",
  "abandoned",
  "disappeared with cash",
  "talk to a human",
  "human agent",
  "human supervisor",
  "speak to someone",
  "speak with someone",
  "human support",
  "human representative",
  "human",
  "supervisor",
  "customer care representative",
  "escalate",
  "escalation",
  "unresolved dispute",
  "urgent help",
  "urgent complaint",
];

export function isEscalationIntent(text: string): boolean {
  const normalized = text.toLowerCase();
  return HUMAN_ESCALATION_KEYWORDS.some((kw) => normalized.includes(kw));
}
