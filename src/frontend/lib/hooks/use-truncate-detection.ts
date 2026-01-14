import { useEffect, useRef, useState } from "react";

export const useTruncateDetection = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      const element = ref.current;
      if (!element) return;
      const truncated = element.scrollWidth > element.clientWidth;
      setIsTruncated(truncated);
    };

    // 레이아웃 안정화를 위해 짧은 지연 후 체크
    const timeoutId = setTimeout(checkTruncation, 100);

    // window resize 시 재체크
    window.addEventListener("resize", checkTruncation);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkTruncation);
    };
  }, []);

  return { isTruncated, ref };
};
