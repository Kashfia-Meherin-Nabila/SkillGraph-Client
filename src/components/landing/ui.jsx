"use client";

import Link from "next/link";
import { motion } from "motion/react";

// A Next.js Link that can use Motion props such as whileHover and whileTap
export const MotionLink = motion.create(Link);