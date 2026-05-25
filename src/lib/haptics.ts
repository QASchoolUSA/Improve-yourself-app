export function haptic(kind: "light" | "medium" | "success" | "warning" = "light") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  const patterns: Record<string, number | number[]> = {
    light: 8,
    medium: 14,
    success: [10, 30, 10],
    warning: [20, 40, 20],
  };
  try {
    navigator.vibrate(patterns[kind]);
  } catch {
    /* ignore */
  }
}
