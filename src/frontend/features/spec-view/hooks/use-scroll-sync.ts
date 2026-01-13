"use client";

import { useEffect } from "react";

export const useScrollSync = () => {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    let targetId: string;
    try {
      targetId = decodeURIComponent(hash);
    } catch {
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);
};
