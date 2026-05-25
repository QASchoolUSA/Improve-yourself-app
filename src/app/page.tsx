"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Index() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onboarded = useStore.getState().profile.onboarded;
    if (onboarded) router.replace("/today");
    else router.replace("/onboarding");
    setReady(true);
  }, [router]);

  return (
    <div className="flex min-h-screen-safe items-center justify-center text-fg-dim">
      {ready ? null : <span className="font-display text-3xl text-gradient">Coach</span>}
    </div>
  );
}
