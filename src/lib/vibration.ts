// Tactile Vibration (Haptic Feedback) Helper using HTML5 Vibration API
// Enhances mobile gaming experience during photos capture, card forging, unboxing, and battle actions.

export function vibrate(pattern: number | number[] = 50) {
  if (typeof window !== "undefined" && "navigator" in window && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch (_) {
      // Ignore errors on unsupported or restricted browsers
    }
  }
}

// Preset haptic feedback patterns
export const haptics = {
  // Light subtle tap feedback for general button presses
  tap: () => vibrate(25),

  // Camera photo capture shutter feedback (sharp double pulse)
  capture: () => vibrate([50, 50, 80]),

  // Heavy forging start rumble pattern (dramatic tactile sweep)
  forgingStart: () => vibrate([100, 40, 120, 40, 220]),

  // Unboxing capsule burst / card reveal (explosive feedback)
  unboxing: () => vibrate([150, 30, 150, 30, 350]),

  // Battle action / attack feedback (heavy strike impact)
  battleHit: () => vibrate([80, 30, 100]),

  // Level up or victory celebration
  victory: () => vibrate([100, 50, 100, 50, 100, 50, 250]),
};
