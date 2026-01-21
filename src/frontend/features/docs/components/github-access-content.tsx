"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  HelpCircle,
  Key,
  Lock,
  Shield,
  User,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const OAUTH_SCOPES = [
  { required: true, scopeKey: "repoRead" },
  { required: true, scopeKey: "userEmail" },
  { required: false, scopeKey: "orgRead" },
] as const;

const ACCESS_COMPARISON = [
  { featureKey: "publicRepos", githubApp: true, oauth: true },
  { featureKey: "privatePersonal", githubApp: false, oauth: true },
  { featureKey: "orgRepos", githubApp: true, oauth: false },
  { featureKey: "granularControl", githubApp: true, oauth: false },
] as const;

const INSTALLATION_STEPS = ["selectOrg", "chooseRepos", "authorize", "complete"] as const;

export const GithubAccessContent = () => {
  const t = useTranslations("docs.githubAccess");

  return (
    <div className="space-y-8">
      {/* Overview */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">
          {t("sections.overview.title")}
        </h2>
        <p className="mb-4 leading-7 text-muted-foreground">{t("sections.overview.description")}</p>

        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
          <Zap className="size-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">
            {t("sections.overview.keyPoint.title")}
          </AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            {t("sections.overview.keyPoint.description")}
          </AlertDescription>
        </Alert>
      </section>

      {/* Two Authentication Methods */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">
          {t("sections.methods.title")}
        </h2>
        <p className="mb-6 leading-7 text-muted-foreground">{t("sections.methods.description")}</p>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <User className="size-5 text-green-600 dark:text-green-400" />
                <CardTitle className="text-base">{t("sections.methods.oauth.title")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                {t("sections.methods.oauth.description")}
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                  <span>{t("sections.methods.oauth.item1")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                  <span>{t("sections.methods.oauth.item2")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                  <span>{t("sections.methods.oauth.item3")}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-base">{t("sections.methods.githubApp.title")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                {t("sections.methods.githubApp.description")}
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-purple-500" />
                  <span>{t("sections.methods.githubApp.item1")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-purple-500" />
                  <span>{t("sections.methods.githubApp.item2")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-purple-500" />
                  <span>{t("sections.methods.githubApp.item3")}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* OAuth Scopes */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">{t("sections.scopes.title")}</h2>
        <p className="mb-4 leading-7 text-muted-foreground">{t("sections.scopes.description")}</p>

        <Card className="py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-2 font-semibold">
                    {t("sections.scopes.table.scope")}
                  </TableHead>
                  <TableHead className="px-4 py-2 font-semibold">
                    {t("sections.scopes.table.purpose")}
                  </TableHead>
                  <TableHead className="w-[100px] px-4 py-2 text-center font-semibold">
                    {t("sections.scopes.table.required")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {OAUTH_SCOPES.map(({ required, scopeKey }) => (
                  <TableRow key={scopeKey}>
                    <TableCell className="px-4 py-2.5">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                        {t(`sections.scopes.scopes.${scopeKey}.name`)}
                      </code>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-muted-foreground">
                      {t(`sections.scopes.scopes.${scopeKey}.purpose`)}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-center">
                      {required ? (
                        <Badge variant="default">{t("sections.scopes.table.yes")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("sections.scopes.table.optional")}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Access Comparison */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">
          {t("sections.comparison.title")}
        </h2>
        <p className="mb-4 leading-7 text-muted-foreground">
          {t("sections.comparison.description")}
        </p>

        <Card className="py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-2 font-semibold">
                    {t("sections.comparison.table.feature")}
                  </TableHead>
                  <TableHead className="w-[120px] px-4 py-2 text-center font-semibold">
                    {t("sections.comparison.table.oauth")}
                  </TableHead>
                  <TableHead className="w-[120px] px-4 py-2 text-center font-semibold">
                    {t("sections.comparison.table.githubApp")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ACCESS_COMPARISON.map(({ featureKey, githubApp, oauth }) => (
                  <TableRow key={featureKey}>
                    <TableCell className="px-4 py-2.5 font-medium">
                      {t(`sections.comparison.features.${featureKey}`)}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-center">
                      {oauth ? (
                        <CheckCircle2 className="mx-auto size-5 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-center">
                      {githubApp ? (
                        <CheckCircle2 className="mx-auto size-5 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Why GitHub App for Organizations */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">
          {t("sections.whyGithubApp.title")}
        </h2>
        <p className="mb-4 leading-7 text-muted-foreground">
          {t("sections.whyGithubApp.description")}
        </p>

        <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50">
          <Lock className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">
            {t("sections.whyGithubApp.adminNote.title")}
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            {t("sections.whyGithubApp.adminNote.description")}
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Shield className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    {t("sections.whyGithubApp.benefits.security.title")}
                  </p>
                  <p>{t("sections.whyGithubApp.benefits.security.description")}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Key className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    {t("sections.whyGithubApp.benefits.granular.title")}
                  </p>
                  <p>{t("sections.whyGithubApp.benefits.granular.description")}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <GitBranch className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    {t("sections.whyGithubApp.benefits.audit.title")}
                  </p>
                  <p>{t("sections.whyGithubApp.benefits.audit.description")}</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Installation Steps */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">
          {t("sections.installation.title")}
        </h2>
        <p className="mb-6 leading-7 text-muted-foreground">
          {t("sections.installation.description")}
        </p>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("sections.installation.steps.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {INSTALLATION_STEPS.map((stepKey, index) => (
              <div
                className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3"
                key={stepKey}
              >
                <Badge className="mt-0.5 shrink-0" variant="secondary">
                  {index + 1}
                </Badge>
                <div>
                  <p className="font-medium">{t(`sections.installation.steps.${stepKey}.title`)}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`sections.installation.steps.${stepKey}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Permissions Requested */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">
          {t("sections.permissions.title")}
        </h2>
        <p className="mb-4 leading-7 text-muted-foreground">
          {t("sections.permissions.description")}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                {t("sections.permissions.read.label")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("sections.permissions.read.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {t("sections.permissions.metadata.label")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("sections.permissions.metadata.description")}
              </p>
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-4 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50">
          <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-900 dark:text-green-100">
            {t("sections.permissions.readOnly.title")}
          </AlertTitle>
          <AlertDescription className="text-green-800 dark:text-green-200">
            {t("sections.permissions.readOnly.description")}
          </AlertDescription>
        </Alert>
      </section>

      {/* Troubleshooting */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">
          {t("sections.troubleshooting.title")}
        </h2>
        <p className="mb-4 leading-7 text-muted-foreground">
          {t("sections.troubleshooting.description")}
        </p>

        <div className="space-y-3">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/50">
            <AlertCircle className="size-4 text-orange-600 dark:text-orange-400" />
            <AlertTitle className="text-orange-900 dark:text-orange-100">
              {t("sections.troubleshooting.cantSeeOrg.title")}
            </AlertTitle>
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              {t("sections.troubleshooting.cantSeeOrg.description")}
            </AlertDescription>
          </Alert>

          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/50">
            <AlertCircle className="size-4 text-orange-600 dark:text-orange-400" />
            <AlertTitle className="text-orange-900 dark:text-orange-100">
              {t("sections.troubleshooting.pendingRequest.title")}
            </AlertTitle>
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              {t("sections.troubleshooting.pendingRequest.description")}
            </AlertDescription>
          </Alert>

          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/50">
            <AlertCircle className="size-4 text-orange-600 dark:text-orange-400" />
            <AlertTitle className="text-orange-900 dark:text-orange-100">
              {t("sections.troubleshooting.repoNotListed.title")}
            </AlertTitle>
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              {t("sections.troubleshooting.repoNotListed.description")}
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Managing Access */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">
          {t("sections.managing.title")}
        </h2>
        <p className="mb-4 leading-7 text-muted-foreground">{t("sections.managing.description")}</p>

        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ExternalLink className="mt-0.5 size-4 shrink-0" />
                <span>{t("sections.managing.items.oauthSettings")}</span>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="mt-0.5 size-4 shrink-0" />
                <span>{t("sections.managing.items.appSettings")}</span>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="mt-0.5 size-4 shrink-0" />
                <span>{t("sections.managing.items.orgSettings")}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">{t("sections.faq.title")}</h2>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2">
                <HelpCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <CardTitle className="text-base">{t("sections.faq.q1.question")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("sections.faq.q1.answer")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2">
                <HelpCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <CardTitle className="text-base">{t("sections.faq.q2.question")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("sections.faq.q2.answer")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2">
                <HelpCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <CardTitle className="text-base">{t("sections.faq.q3.question")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("sections.faq.q3.answer")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2">
                <HelpCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <CardTitle className="text-base">{t("sections.faq.q4.question")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("sections.faq.q4.answer")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};
