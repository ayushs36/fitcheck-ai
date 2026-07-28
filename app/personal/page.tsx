import { notFound } from "next/navigation";

import { FitCheckApp } from "../page";

export const dynamic = "force-dynamic";

export default function PersonalPage() {
  if (process.env.VERCEL) {
    notFound();
  }

  return <FitCheckApp />;
}
