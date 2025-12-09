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

export type TestStatus = "active" | "focused" | "skipped" | "todo" | "xfail";

export type Framework = string;

export type TestCase = {
  filePath: string;
  framework: Framework;
  line: number;
  modifier?: string;
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
  focused: number;
  framework: Framework;
  skipped: number;
  todo: number;
  total: number;
  xfail: number;
};

export type Summary = {
  active: number;
  focused: number;
  frameworks: FrameworkSummary[];
  skipped: number;
  todo: number;
  total: number;
  xfail: number;
};

export type AnalysisResult = {
  analyzedAt: string;
  commitSha: string;
  owner: string;
  repo: string;
  suites: TestSuite[];
  summary: Summary;
};

// Queue-based analysis status
export type AnalysisStatus = "analyzing" | "completed" | "failed" | "queued";

// Response from /api/analyze/{owner}/{repo}
export type AnalysisResponse =
  | { status: "completed"; data: AnalysisResult }
  | { status: "analyzing" }
  | { status: "queued" }
  | { status: "failed"; error: string };
