"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatBytes, formatDate } from "@/lib/utils";
import {
  FileText, Link2, ExternalLink, Download, BookOpen,
  Atom, FlaskConical, Calculator, Filter
} from "lucide-react";
import type { Material, SubjectName } from "@/types";
import { cn } from "@/lib/utils";

interface MaterialsClientProps {
  materials: Material[];
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf_notes: <FileText className="h-4 w-4" />,
  pyq_pdf: <BookOpen className="h-4 w-4" />,
  mock_paper: <FileText className="h-4 w-4" />,
  important_link: <Link2 className="h-4 w-4" />,
  video: <ExternalLink className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  pdf_notes: "Notes",
  pyq_pdf: "PYQ",
  mock_paper: "Mock Paper",
  important_link: "Link",
  video: "Video",
  other: "Other",
};

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  Physics: <Atom className="h-4 w-4" />,
  Chemistry: <FlaskConical className="h-4 w-4" />,
  Mathematics: <Calculator className="h-4 w-4" />,
};

export function MaterialsClient({ materials }: MaterialsClientProps) {
  const [activeSubject, setActiveSubject] = useState<SubjectName | "All">("All");
  const [activeType, setActiveType] = useState<string>("all");

  const filtered = materials.filter((m) => {
    const subjectMatch = activeSubject === "All" || m.subject === activeSubject;
    const typeMatch = activeType === "all" || m.material_type === activeType;
    return subjectMatch && typeMatch;
  });

  const subjectTabs: (SubjectName | "All")[] = ["All", "Physics", "Chemistry", "Mathematics"];
  const typeTabs = [
    { value: "all", label: "All Types" },
    { value: "pdf_notes", label: "Notes" },
    { value: "pyq_pdf", label: "PYQ" },
    { value: "mock_paper", label: "Mock Papers" },
    { value: "important_link", label: "Links" },
  ];

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Study Materials</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Notes, PYQs, mock papers and important links
        </p>
      </div>

      {/* Subject filter */}
      <div className="flex flex-wrap gap-2">
        {subjectTabs.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSubject(s)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              activeSubject === s
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                : "text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
            )}
          >
            {s !== "All" && SUBJECT_ICONS[s]}
            {s}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
        {typeTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveType(t.value)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
              activeType === t.value
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Materials grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No materials found</p>
          <p className="text-xs text-zinc-600 mt-1">
            {materials.length === 0
              ? "Materials uploaded by admin will appear here"
              : "Try changing your filters"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialCard({ material }: { material: Material }) {
  const isLink = material.material_type === "important_link";
  const url = isLink ? material.external_url : material.file_url;

  return (
    <Card className="hover:border-zinc-700/80 transition-all duration-200 group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
            material.subject === "Physics" ? "bg-indigo-500/10 text-indigo-400" :
            material.subject === "Chemistry" ? "bg-emerald-500/10 text-emerald-400" :
            material.subject === "Mathematics" ? "bg-amber-500/10 text-amber-400" :
            "bg-zinc-800 text-zinc-400"
          )}>
            {TYPE_ICONS[material.material_type] || <FileText className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 line-clamp-2 group-hover:text-zinc-100 transition-colors">
              {material.title}
            </p>
            {material.description && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{material.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="secondary">{TYPE_LABELS[material.material_type] || "Other"}</Badge>
          {material.subject && (
            <Badge variant={
              material.subject === "Physics" ? "default" :
              material.subject === "Chemistry" ? "success" : "warning"
            }>
              {material.subject}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-600">{formatDate(material.created_at)}</span>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
            >
              {isLink ? (
                <><ExternalLink className="h-3 w-3" /> Open</>
              ) : (
                <><Download className="h-3 w-3" /> Download</>
              )}
            </a>
          ) : (
            <span className="text-xs text-zinc-600">Unavailable</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
