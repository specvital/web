// Synced with backend: src/backend/analyzer/types.go

// RFC 7807 Problem Details for HTTP APIs with optional rate limit extension
export type ProblemDetail = {
  detail: string;
  instance?: string;
  rateLimit?: RateLimitInfo;
  status: number;
  title: string;
  type?: string;
};

export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetAt: number;
};

export type TestStatus = "active" | "skipped" | "todo";

export type Framework = string;

export type TestCase = {
  filePath: string;
  framework: Framework;
  line: number;
  name: string;
  status: TestStatus;
};

export type TestSuite = {
  filePath: string;
  framework: Framework;
  tests: TestCase[];
};

export type FrameworkSummary = {
  active: number;
  framework: Framework;
  skipped: number;
  todo: number;
  total: number;
};

export type Summary = {
  active: number;
  frameworks: FrameworkSummary[];
  skipped: number;
  todo: number;
  total: number;
};

export type AnalysisResult = {
  analyzedAt: string;
  commitSha: string;
  owner: string;
  repo: string;
  suites: TestSuite[];
  summary: Summary;
};
