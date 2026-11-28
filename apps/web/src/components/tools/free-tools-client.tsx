"use client";

import React, { useState } from "react";
import { Icon } from "@/components/site/icons";
import { TOOLS_CATALOG, ToolCategory, ActiveToolId } from "./tools-catalog";

// Import all 16 upgraded tool engines
import { ToolAiAssistant } from "./tool-ai-assistant";
import { ToolBusinessName } from "./tool-business-name";
import { ToolBusinessPlan } from "./tool-business-plan";
import { ToolInvoice } from "./tool-invoice";
import { ToolReceipt } from "./tool-receipt";
import { ToolPercentage } from "./tool-percentage";
import { ToolLoan } from "./tool-loan";
import { ToolBudget } from "./tool-budget";
import { ToolCurrency } from "./tool-currency";
import { ToolUnit } from "./tool-unit";
import { ToolCvBuilder } from "./tool-cv-builder";
import { ToolCoverLetter } from "./tool-cover-letter";
import { ToolContracts } from "./tool-contracts";
import { ToolGenerator } from "./tool-generator";
import { ToolCostEstimator } from "./tool-cost-estimator";
import { ToolMoving } from "./tool-moving";

interface FreeToolsClientProps {
  initialTab?: string;
  initialQuery?: string;
}

export function FreeToolsClient({ initialTab = "all", initialQuery = "" }: FreeToolsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>("all");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeToolId, setActiveToolId] = useState<ActiveToolId>(
    (TOOLS_CATALOG.some((t) => t.id === initialTab) ? initialTab : "all") as ActiveToolId
  );

  // Filter tools catalog
  const filteredTools = TOOLS_CATALOG.filter((tool) => {
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const activeTool = TOOLS_CATALOG.find((t) => t.id === activeToolId);

  const renderActiveToolComponent = () => {
    switch (activeToolId) {
      case "ai-problem-assistant":
        return <ToolAiAssistant />;
      case "business-name-generator":
        return <ToolBusinessName />;
      case "business-plan-assistant":
        return <ToolBusinessPlan />;
      case "invoice-generator":
        return <ToolInvoice />;
      case "receipt-generator":
        return <ToolReceipt />;
      case "percentage-calculator":
        return <ToolPercentage />;
      case "loan-calculator":
        return <ToolLoan />;
      case "budget-planner":
        return <ToolBudget />;
      case "currency-converter":
        return <ToolCurrency />;
      case "unit-converter":
        return <ToolUnit />;
      case "cv-builder":
        return <ToolCvBuilder />;
      case "cover-letter":
        return <ToolCoverLetter />;
      case "document-templates":
        return <ToolContracts />;
      case "generator-calc":
        return <ToolGenerator />;
      case "cost-estimator":
        return <ToolCostEstimator />;
      case "moving-calc":
        return <ToolMoving />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Navigation & Tool Selector */}
      {activeToolId !== "all" && activeTool ? (
        /* Active Tool Breadcrumb & Return */
        <div className="flex items-center justify-between bg-white dark:bg-[#1F2328] p-4 rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveToolId("all");
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="text-xs font-bold text-[#E8590C] hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <span>&larr; Back to All Free Tools</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {activeTool.name}
            </span>
            {activeTool.badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] border border-[#E8590C]/30">
                {activeTool.badge}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Directory Search & Category Filters */
        <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools (e.g. invoice, loan, generator, percent, CV, contract, name generator)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6E0D8] dark:border-[#2E343B] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8590C]"
              />
              <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              16 Professional Utilities
            </span>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800 pt-3">
            {[
              { id: "all", label: "All 16 Tools" },
              { id: "ai", label: "AI Assistants" },
              { id: "documents", label: "Invoicing & Documents" },
              { id: "calculators", label: "Financial Calculators" },
              { id: "utilities", label: "Energy & Utilities" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as ToolCategory)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#E8590C] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeToolId === "all" ? (
        /* Tools Catalog Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white dark:bg-[#1F2328] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] p-5 shadow-xs hover:border-[#E8590C]/50 hover:shadow-md transition flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C] flex items-center justify-center">
                    <Icon name={tool.icon as any} className="w-5 h-5" />
                  </div>
                  {tool.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7F3] dark:bg-[#1F2328] text-slate-600 dark:text-slate-300 border border-[#E6E0D8] dark:border-[#2E343B]">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#E8590C] transition-colors">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveToolId(tool.id)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#E8590C] hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Launch Tool &rarr;</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Active Dedicated Tool Form & Output View */
        <div className="bg-white dark:bg-[#1F2328] rounded-3xl border border-[#E6E0D8] dark:border-[#2E343B] p-6 sm:p-8 shadow-sm">
          {renderActiveToolComponent()}
        </div>
      )}
    </div>
  );
}
