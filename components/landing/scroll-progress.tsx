"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none bg-slate-900/40">
      <motion.div
        className="h-full bg-gradient-to-r from-cyan-500 via-[#ff3538] to-cyan-400 shadow-[0_0_12px_#ff3538]"
        style={{ scaleX, transformOrigin: "0%" }}
      />
    </div>
  );
}
