export type ToolCategory = "all" | "ai" | "documents" | "calculators" | "utilities";

export type ActiveToolId =
  | "all"
  | "ai-problem-assistant"
  | "business-name-generator"
  | "business-plan-assistant"
  | "invoice-generator"
  | "receipt-generator"
  | "percentage-calculator"
  | "loan-calculator"
  | "budget-planner"
  | "currency-converter"
  | "unit-converter"
  | "cv-builder"
  | "cover-letter"
  | "document-templates"
  | "generator-calc"
  | "cost-estimator"
  | "moving-calc";

export interface ToolItem {
  id: ActiveToolId;
  category: ToolCategory;
  name: string;
  badge: string;
  description: string;
  icon: string;
}

export const TOOLS_CATALOG: ToolItem[] = [
  {
    id: "ai-problem-assistant",
    category: "ai",
    name: "AI Everyday Problem Assistant",
    badge: "Smart Diagnostics",
    description: "Describe any domestic or SME breakdown (generator, plumbing, inverter, AC) for instant diagnostics, safety checks, and verified pro dispatch.",
    icon: "sparkles",
  },
  {
    id: "business-name-generator",
    category: "ai",
    name: "Business Name Ideas Generator",
    badge: "Branding",
    description: "Generate culturally resonant, memorable Nigerian business names with taglines, CAC classification checks, and domain suggestions.",
    icon: "building",
  },
  {
    id: "business-plan-assistant",
    category: "ai",
    name: "Basic Business Plan Assistant",
    badge: "Strategy",
    description: "Structure a 6-part executive business plan with market analysis, 12-month financial projections, and risk mitigations ready for export.",
    icon: "file-text",
  },
  {
    id: "invoice-generator",
    category: "documents",
    name: "Commercial Invoice Generator",
    badge: "Invoicing",
    description: "Create professional business invoices with dynamic line items, 7.5% Nigerian VAT, bank settlement details, and instant PDF download.",
    icon: "file-text",
  },
  {
    id: "receipt-generator",
    category: "documents",
    name: "Official Receipt Generator",
    badge: "Accounting",
    description: "Issue official payment acknowledgment receipts with transaction references, payment method badges, and amount in words.",
    icon: "receipt",
  },
  {
    id: "percentage-calculator",
    category: "calculators",
    name: "Percentage Calculator (Markup & VAT)",
    badge: "Instant Math",
    description: "Calculate trade discounts, profit margins, cost markups, and statutory 7.5% Nigerian VAT with zero mobile overflow.",
    icon: "zap",
  },
  {
    id: "loan-calculator",
    category: "calculators",
    name: "Loan Repayment Calculator (Amortization)",
    badge: "Finance",
    description: "Calculate monthly installments (EMI), total interest, and full repayment schedules in Naira (₦) for micro-loans and SME credit.",
    icon: "calendar",
  },
  {
    id: "budget-planner",
    category: "calculators",
    name: "Household & SME Budget Planner",
    badge: "Finance",
    description: "Track monthly income vs categorized expenses, monitor savings rates, and audit against the 50/30/20 benchmark.",
    icon: "receipt",
  },
  {
    id: "currency-converter",
    category: "calculators",
    name: "Multi-Currency FX Converter",
    badge: "FX",
    description: "Convert between Naira (NGN), USD, GBP, EUR, CAD, GHS, and CNY with official and parallel reference rate benchmarks.",
    icon: "receipt",
  },
  {
    id: "unit-converter",
    category: "calculators",
    name: "Everyday & Trade Unit Converter",
    badge: "Utility",
    description: "Convert construction length, trade weight, liquid volume, and Nigerian land plots (1 standard plot = 464.5 sq m).",
    icon: "wrench",
  },
  {
    id: "cv-builder",
    category: "documents",
    name: "Professional CV Builder",
    badge: "Career",
    description: "Build modern, application-ready Nigerian curriculum vitae with structured experience bullets, skills matrix, and PDF export.",
    icon: "briefcase",
  },
  {
    id: "cover-letter",
    category: "documents",
    name: "Professional Cover Letter Builder",
    badge: "Career",
    description: "Generate tailored, compelling cover letters matching specific job openings with editable paragraphs and executive letterhead.",
    icon: "mail",
  },
  {
    id: "document-templates",
    category: "documents",
    name: "Legal Contracts & Document Templates",
    badge: "Legal",
    description: "Fill out and export vetted Nigerian agreements: Service Contract, Mutual NDA, Overdue Payment Demand, and Tenancy Notice.",
    icon: "file",
  },
  {
    id: "generator-calc",
    category: "utilities",
    name: "Generator Load & Fuel Sizing Calculator",
    badge: "Energy",
    description: "Select appliances to calculate running wattage, peak surge capacity, recommended kVA generator, and monthly fuel expense.",
    icon: "zap",
  },
  {
    id: "cost-estimator",
    category: "utilities",
    name: "Service Cost Estimator",
    badge: "Estimates",
    description: "Benchmark expected labor, parts, and transport costs for technical trades across Port Harcourt, Lagos, and Abuja.",
    icon: "hammer",
  },
  {
    id: "moving-calc",
    category: "utilities",
    name: "Relocation & Moving Estimator",
    badge: "Logistics",
    description: "Estimate truck sizing, moving crew labor, packing materials, and haulage pricing based on home size and transit distance.",
    icon: "truck",
  },
];
