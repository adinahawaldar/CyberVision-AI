"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";

interface Incident {
  id: string;
  headline: string;
  badge: string;
  locationYear: string;
  description: string;
  camTag: string;
  sourceName: string;
  sourceUrl: string;
  image: string;
}

const incidents: Incident[] = [
  {
    id: "gujarat-kidnapping",
    headline: "48-Hour Manhunt Scanned 172 CCTV Cameras Across Cities to Rescue Kidnapped Boy",
    badge: "172 CCTV CAMERAS",
    locationYear: "Gujarat, India · 2024",
    description:
      "A 5-year-old child was abducted, forcing investigators to manually examine footage from 172 government and private cameras during a 48-hour chase across blind spots and broken feeds.",
    camTag: "CAM-12 · HIGHWAY TOLL",
    sourceName: "Indian Express",
    sourceUrl:
      "https://indianexpress.com/article/cities/ahmedabad/gujarat-hardlook-kidnapping-chase-hours-hunt-cctv-10886763/",
    image: "/images/cctv_live_footage.jpg",
  },
  {
    id: "delhi-murder-peeragarhi",
    headline: "Peeragarhi Case Solved After Detectives Scanned 200+ CCTV Feeds in 48 Hours",
    badge: "200+ CCTV CAMERAS",
    locationYear: "Delhi, India · 2024",
    description:
      "What initially appeared to be a routine road accident was reconstructed as deliberate murder after police spent 48 hours manually analyzing more than 200 CCTV cameras across urban junctions.",
    camTag: "CAM-34 · PEERAGARHI JUNCTION",
    sourceName: "NDTV",
    sourceUrl:
      "https://ndtv.in/delhi-news/peeragarhi-murder-mystery-delhi-police-cracked-the-case-after-scanning-200-cctv-footage-in-48-hours-four-accused-arrested-before-fleeing-to-haridwar-11551655",
    image: "/images/cctv_camera_detection.jpg",
  },
  {
    id: "delhi-builder-murder",
    headline: "South Delhi Builder Murder Exposed by Matching Neighborhood CCTV with Call Records",
    badge: "CCTV + TIMELINE",
    locationYear: "South Delhi, India · 2024",
    description:
      "Detectives reviewed neighborhood CCTV around the house to identify a masked intruder during a staged robbery, cross-referencing timeline evidence with phone records to uncover the conspiracy.",
    camTag: "CAM-07 · RESIDENTIAL GATE",
    sourceName: "Indian Express",
    sourceUrl:
      "https://indianexpress.com/article/cities/delhi/sleeping-pills-electrocution-staged-robbery-wife-her-friend-held-for-builders-murder-in-south-delhi-10830610/",
    image: "/images/surveillance_devices.jpg",
  },
];

// Duplicate incidents array to create a seamless infinite marquee scroll
const marqueeIncidents = [...incidents, ...incidents, ...incidents, ...incidents];

export default function Incidents() {
  const handleOpenSource = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id="incidents"
      className="relative bg-[#111317] text-white py-16 sm:py-20 border-t border-white/5 overflow-hidden"
    >
      {/* Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-red-500/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 w-full space-y-10 sm:space-y-12">
        {/* SECTION HEADER */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto px-4 sm:px-6 space-y-3"
        >
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight">
            WHEN EVERY MINUTE MATTERS.
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed font-normal max-w-2xl mx-auto">
            Security incidents can unfold before investigators have access to the complete picture.
            CyberVision is designed to surface relevant events and organize the available CCTV evidence faster.
          </p>
        </motion.div>

        {/* FULL-WIDTH CONTINUOUS SCROLLING MARQUEE TRACK */}
        <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] py-2">
          <div className="animate-marquee flex gap-4 sm:gap-5 w-max">
            {marqueeIncidents.map((incident, idx) => (
              <div
                key={`${incident.id}-${idx}`}
                onClick={() => handleOpenSource(incident.sourceUrl)}
                className="group w-[300px] sm:w-[340px] md:w-[360px] shrink-0 bg-[#14161b] hover:bg-[#181a20] border border-white/[0.08] hover:border-white/20 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl select-none"
              >
                {/* MINIMAL MEDIA HEADER */}
                <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-black/60 border-b border-white/[0.08]">
                  <Image
                    src={incident.image}
                    alt={incident.headline}
                    fill
                    sizes="360px"
                    className="object-cover object-center brightness-[0.85] contrast-[1.05] group-hover:scale-105 group-hover:brightness-95 transition-transform duration-500"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />

                  {/* CCTV REC HUD Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 border border-white/10 text-[9.5px] font-mono text-white/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff3538]" />
                    <span>REC · {incident.camTag}</span>
                  </div>

                  {/* Source Name Badge */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 border border-white/10 text-[9.5px] font-medium text-white/90">
                    <span>{incident.sourceName}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                </div>

                {/* COMPACT CARD CONTENT */}
                <div className="p-4 sm:p-4.5 flex flex-col flex-1 justify-between space-y-3">
                  <div className="space-y-2">
                    {/* Badge & Location */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[9px] uppercase font-bold text-slate-300 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded">
                        {incident.badge}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {incident.locationYear}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-slate-100 transition-colors">
                      {incident.headline}
                    </h3>

                    {/* Description */}
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed font-normal line-clamp-3">
                      {incident.description}
                    </p>
                  </div>

                  {/* Action Link Footer */}
                  <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors">
                      Read report
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">
                      {incident.sourceName} ↗
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
