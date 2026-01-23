import type { ReactNode } from "react";

import { DocsSidebar } from "@/features/docs";

type DocsContentLayoutProps = {
  children: ReactNode;
};

const DocsContentLayout = ({ children }: DocsContentLayoutProps) => {
  return (
    <div className="container mx-auto flex max-w-6xl gap-8 px-4 py-8">
      <DocsSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
};

export default DocsContentLayout;
