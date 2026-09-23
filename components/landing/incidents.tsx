"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

interface Incident {
  id: string;
  headline: string;
  badge: string;
  locationYear: string;
  description: string;
  youtubeId: string;
  youtubeUrl: string;
  camTag: string;
}

const incidents: Incident[] = [
  {
    id: "dresden-vault",
    headline: "CCTV footage became critical evidence in the €113M museum jewel heist.",
    badge: "INCIDENT",
    locationYear: "Dresden, Germany · 2019",
    description:
      "Investigation involved reviewing hundreds of hours of surveillance footage after static museum alarms failed to prompt immediate dispatch.",
    youtubeId: "s5FzVj9x24k",
    youtubeUrl: "https://www.youtube.com/watch?v=s5FzVj9x24k",
    camTag: "CAM-01 · 1080P",
  },
  {
    id: "luton-fire",
    headline: "Surveillance footage tracked initial vehicle blaze prior to multi-storey collapse.",
    badge: "INCIDENT",
    locationYear: "London Luton Airport · 2023",
    description:
      "Investigation involved reviewing airport CCTV tapes after an undetected diesel ignition spread, destroying over 1,500 vehicles and grounding flights.",
    youtubeId: "gT8wNqF0k3Q",
    youtubeUrl: "https://www.youtube.com/watch?v=gT8wNqF0k3Q",
    camTag: "CAM-04 · 1080P",
  },
  {
    id: "cargo-theft",
    headline: "CCTV archives revealed widespread container looting across railyard tracks.",
    badge: "INCIDENT",
    locationYear: "Los Angeles, CA · 2022",
    description:
      "Investigation involved manually scrubbing weeks of stationary surveillance video after unmonitored railyard cameras failed to flag real-time intrusion.",
    youtubeId: "kYv_8vWd_sU",
    youtubeUrl: "https://www.youtube.com/watch?v=kYv_8vWd_sU",
    camTag: "CAM-02 · 1080P",
  },
];

export default function Incidents() {
  const handleOpenVideo = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="incidents"
      className="relative bg-[#111317] text-white py-20 sm:py-24 border-t border-white/5 overflow-hidden"
    >
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* SECTION HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            When every minute matters.
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed font-normal">
            Security incidents can unfold before investigators have access to the complete picture.
            CyberVision is designed to surface relevant events and organize the available CCTV evidence faster.
          </p>
        </motion.div>

        {/* 3 MINIMAL INCIDENT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incidents.map((incident, index) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              onClick={() => handleOpenVideo(incident.youtubeUrl)}
              className="group bg-[#14161b] hover:bg-[#181a20] border border-white/[0.08] hover:border-white/20 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl"
            >
              {/* VIDEO THUMBNAIL / MEDIA PLAYER PREVIEW */}
              <div className="relative aspect-video w-full overflow-hidden bg-black/60 border-b border-white/[0.08]">
                {/* News Snapshot / Surveillance Video Preview */}
                <img
                  src={`https://img.youtube.com/vi/${incident.youtubeId}/hqdefault.jpg`}
                  alt={incident.headline}
                  className="w-full h-full object-cover object-center brightness-[0.85] contrast-[1.05] group-hover:scale-105 group-hover:brightness-95 transition-transform duration-500"
                  loading="lazy"
                />

                {/* CCTV Scanlines & Ambient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                {/* CCTV HUD: Timestamp / REC indicator */}
                <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 border border-white/10 text-[10px] font-mono text-white/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff3538] animate-pulse" />
                  <span>REC · {incident.camTag}</span>
                </div>

                {/* YouTube Pill Badge */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 border border-white/10 text-[10px] font-medium text-white/80">
                  <svg className="w-3.5 h-2.5 text-[#ff0000] fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span>YouTube</span>
                </div>

                {/* Play Button Indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-black/60 group-hover:bg-[#ff0000] border border-white/20 group-hover:border-transparent flex items-center justify-center text-white transition-all transform group-hover:scale-110 shadow-lg">
                    <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* CARD BODY CONTENT */}
              <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                <div className="space-y-3">
                  {/* Headline */}
                  <h3 className="text-sm sm:text-base font-semibold text-white leading-snug group-hover:text-slate-100 transition-colors">
                    {incident.headline}
                  </h3>

                  {/* INCIDENT Tag & Location · Year */}
                  <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                    <span className="font-mono text-[10px] uppercase font-semibold text-slate-300 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded">
                      {incident.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {incident.locationYear}
                    </span>
                  </div>

                  {/* Investigation Description */}
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {incident.description}
                  </p>
                </div>

                {/* Read Case Link */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                    Read case
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
                    Watch on YouTube ↗
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
