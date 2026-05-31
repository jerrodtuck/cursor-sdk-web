"use client";

import { useEffect, useState } from "react";

export function useMockTagTick(mounted: boolean) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [mounted]);

  return tick;
}
