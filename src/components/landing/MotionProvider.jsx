"use client";

import { MotionConfig } from "motion/react";

// Respects the visitor's "reduce motion" setting for every animation below it
export default function MotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}