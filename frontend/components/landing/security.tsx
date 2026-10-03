"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface TextCardProps {
  title: string;
  description: string;
  variant: "light" | "dark" | "slate";
  delay: number;
}

function TextCard({ title, description, variant, delay }: TextCardProps) {
  const variantStyles = {
    light: "bg-[#f5f6f8] text-[#111317] border border-black/5 shadow-xl",
    dark: "bg-[#161821] text-white border border-white/10 shadow-xl",
    slate: "bg-[#252b36] text-white border border-white/10 shadow-xl",
  };

  const textSecondaryStyles = {
    light: "text-[#555b68]",
    dark: "text-slate-300",
    slate: "text-slate-200",
  };

  const linkStyles = {
    light: "text-[#111317] decoration-[#111317]/40 hover:decoration-[#111317]",
    dark: "text-white decoration-white/40 hover:decoration-white",
    slate: "text-white decoration-white/40 hover:decoration-white",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between aspect-[4/5] sm:aspect-square transition-all duration-300 hover:scale-[1.02] ${variantStyles[variant]}`}
    >
      {/* Title */}
      <h3 className="text-2xl sm:text-[1.65rem] font-bold tracking-tight leading-tight whitespace-pre-line">
        {title}
      </h3>

      {/* Description */}
      <p className={`text-xs sm:text-sm leading-relaxed my-auto py-3 ${textSecondaryStyles[variant]}`}>
        {description}
      </p>

      {/* Link */}
      <div>
        <a
          href="#working"
          className={`inline-block text-xs sm:text-sm font-semibold underline underline-offset-8 decoration-1 transition-all ${linkStyles[variant]}`}
        >
          More Information
        </a>
      </div>
    </motion.div>
  );
}

interface ImageCardProps {
  src: string;
  alt: string;
  delay: number;
}

function ImageCard({ src, alt, delay }: ImageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="relative rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-square group border border-white/10 shadow-xl bg-black"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.92] contrast-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
}

export default function Security() {
  return (
    <section id="security" className="py-20 sm:py-28 bg-[#111317] text-white relative overflow-hidden border-t border-white/5">
      {/* Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[350px] bg-cyan-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[350px] bg-[#ff3538]/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 relative z-10 space-y-12 sm:space-y-16">
        {/* SECTION HEADER */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 max-w-5xl mx-auto px-4"
        >
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight">
            BUILT FOR THE MOMENTS SECURITY TEAMS CAN&apos;T AFFORD TO MISS.
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base font-normal max-w-2xl mx-auto leading-relaxed">
            From unauthorized access to suspicious activity, every camera becomes an active layer of security.
          </p>
        </motion.div>

        {/* 8-CARD CHECKERBOARD GRID (4 COLUMNS x 2 ROWS) - FULL WIDTH */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {/* ROW 1 */}
          {/* Card 1: Image */}
          <ImageCard
            src="/images/cctv_live_footage.jpg"
            alt="Live CCTV footage monitoring"
            delay={0.05}
          />

          {/* Card 2: Light Text Card */}
          <TextCard
            title="Unauthorized&#10;Access"
            description="Instantly detect perimeter intrusions and unauthorized personnel in restricted zones before situations escalate."
            variant="light"
            delay={0.1}
          />

          {/* Card 3: Image */}
          <ImageCard
            src="/images/cctv_camera_detection.jpg"
            alt="AI computer vision detection"
            delay={0.15}
          />

          {/* Card 4: Dark Text Card */}
          <TextCard
            title="Suspicious&#10;Activity"
            description="Autonomous behavioral analysis flagging loitering, abandoned packages, and anomalous crowd patterns in real time."
            variant="dark"
            delay={0.2}
          />

          {/* ROW 2 */}
          {/* Card 5: Slate Text Card */}
          <TextCard
            title="Multi-Camera&#10;Tracking"
            description="Seamless re-identification across dozens of CCTV nodes, preserving target continuity across physical facilities."
            variant="slate"
            delay={0.25}
          />

          {/* Card 6: Image */}
          <ImageCard
            src="/images/surveillance_devices.jpg"
            alt="Surveillance devices and tactical hardware"
            delay={0.3}
          />

          {/* Card 7: Light Text Card */}
          <TextCard
            title="Incident&#10;Reports"
            description="Automatically compile timestamped forensic dossiers, video clips, and audit trails ready for immediate debriefs."
            variant="light"
            delay={0.35}
          />

          {/* Card 8: Image */}
          <ImageCard
            src="/images/mobile_desktop_dashboard.jpg"
            alt="Control room intelligence and operations dashboard"
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
}
