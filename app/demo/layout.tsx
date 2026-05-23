import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Demo | P&ID → HMI",
  description:
    "Upload a P&ID, generate process-hmi.yaml, and preview a live SVG process-flow HMI with the Cursor SDK.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
