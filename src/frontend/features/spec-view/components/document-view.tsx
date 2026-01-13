"use client";

import { Bot, Calendar, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { SpecDocument } from "../types";
import { DomainSection } from "./domain-section";

type DocumentViewProps = {
  document: SpecDocument;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString(undefined, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const DocumentView = ({ document }: DocumentViewProps) => {
  const domainCount = document.domains.length;
  const featureCount = document.domains.reduce((sum, d) => sum + d.features.length, 0);
  const behaviorCount = document.domains.reduce(
    (sum, d) => sum + d.features.reduce((fSum, f) => fSum + f.behaviors.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {document.executiveSummary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Executive Summary</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {document.modelId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="text-xs gap-1" variant="outline">
                        <Bot className="h-3 w-3" />
                        {document.modelId}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>AI model used for generation</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="text-xs gap-1" variant="secondary">
                      <Calendar className="h-3 w-3" />
                      {formatDate(document.createdAt)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Document generated at</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <CardDescription>
              {domainCount} domains / {featureCount} features / {behaviorCount} behaviors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{document.executiveSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Domains */}
      <div className="space-y-4">
        {document.domains.map((domain) => (
          <DomainSection domain={domain} key={domain.id} />
        ))}
      </div>
    </div>
  );
};
