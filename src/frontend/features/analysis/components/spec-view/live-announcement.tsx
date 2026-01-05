"use client";

import { useEffect, useState } from "react";

type LiveAnnouncementProps = {
  assertive?: boolean;
  message: string;
};

export const LiveAnnouncement = ({ assertive = false, message }: LiveAnnouncementProps) => {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    setAnnouncement(message);

    const timer = setTimeout(() => {
      setAnnouncement("");
    }, 1000);

    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div
      aria-atomic="true"
      aria-live={assertive ? "assertive" : "polite"}
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  );
};
