import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RateLimitWarning } from "./rate-limit-warning";

describe("RateLimitWarning", () => {
  const createResetAt = (minutesFromNow: number): number => {
    return Math.floor(Date.now() / 1000) + minutesFromNow * 60;
  };

  describe("visibility", () => {
    it("should not render when limit is 0", () => {
      const { container } = render(
        <RateLimitWarning rateLimit={{ limit: 0, remaining: 0, resetAt: 0 }} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should not render when remaining > 50%", () => {
      const { container } = render(
        <RateLimitWarning
          rateLimit={{ limit: 100, remaining: 60, resetAt: createResetAt(60) }}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render warning when remaining <= 50%", () => {
      render(
        <RateLimitWarning
          rateLimit={{ limit: 100, remaining: 50, resetAt: createResetAt(60) }}
        />
      );
      expect(screen.getByText(/50 \/ 100 requests remaining/i)).toBeInTheDocument();
    });
  });

  describe("warning levels", () => {
    it("should show critical warning when remaining <= 10%", () => {
      const { container } = render(
        <RateLimitWarning
          rateLimit={{ limit: 100, remaining: 5, resetAt: createResetAt(60) }}
        />
      );
      expect(screen.getByText(/5 \/ 100 requests remaining/i)).toBeInTheDocument();
      expect(container.querySelector(".bg-red-50")).toBeInTheDocument();
    });

    it("should show warning level when remaining <= 25%", () => {
      const { container } = render(
        <RateLimitWarning
          rateLimit={{ limit: 100, remaining: 20, resetAt: createResetAt(60) }}
        />
      );
      expect(screen.getByText(/20 \/ 100 requests remaining/i)).toBeInTheDocument();
      expect(container.querySelector(".bg-yellow-50")).toBeInTheDocument();
    });

    it("should show info level when remaining <= 50%", () => {
      const { container } = render(
        <RateLimitWarning
          rateLimit={{ limit: 100, remaining: 40, resetAt: createResetAt(60) }}
        />
      );
      expect(screen.getByText(/40 \/ 100 requests remaining/i)).toBeInTheDocument();
      expect(container.querySelector(".bg-blue-50")).toBeInTheDocument();
    });
  });

  describe("reset time formatting", () => {
    it("should format reset time as 'now' when already passed", () => {
      const pastResetAt = Math.floor(Date.now() / 1000) - 60;
      render(
        <RateLimitWarning
          rateLimit={{ limit: 100, remaining: 5, resetAt: pastResetAt }}
        />
      );
      expect(screen.getByText(/resets in now/i)).toBeInTheDocument();
    });

    it("should format reset time in minutes when < 60 minutes", () => {
      render(
        <RateLimitWarning
          rateLimit={{ limit: 100, remaining: 5, resetAt: createResetAt(30) }}
        />
      );
      expect(screen.getByText(/resets in 30 minutes/i)).toBeInTheDocument();
    });

    it("should format reset time as singular minute", () => {
      render(
        <RateLimitWarning
          rateLimit={{ limit: 100, remaining: 5, resetAt: createResetAt(1) }}
        />
      );
      expect(screen.getByText(/resets in 1 minute$/i)).toBeInTheDocument();
    });

    it("should format reset time in hours when >= 60 minutes", () => {
      render(
        <RateLimitWarning
          rateLimit={{ limit: 100, remaining: 5, resetAt: createResetAt(120) }}
        />
      );
      expect(screen.getByText(/resets in 2 hours/i)).toBeInTheDocument();
    });

    it("should format reset time as singular hour", () => {
      render(
        <RateLimitWarning
          rateLimit={{ limit: 100, remaining: 5, resetAt: createResetAt(60) }}
        />
      );
      expect(screen.getByText(/resets in 1 hour$/i)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have alert icon visible", () => {
      render(
        <RateLimitWarning
          rateLimit={{ limit: 100, remaining: 5, resetAt: createResetAt(60) }}
        />
      );
      // AlertTriangle icon should be present (lucide renders as svg)
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });
});
