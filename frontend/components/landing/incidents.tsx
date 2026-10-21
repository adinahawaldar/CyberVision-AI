"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, ExternalLink, ShieldAlert, Pause, Play } from "lucide-react";

interface Tag {
  label: string;
  className: string;
}

interface Incident {
  id: string;
  title: string;
  headline: string;
  tags: Tag[];
  locationYear: string;
  metric: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  image: string;
}

const incidents: Incident[] = [
  {
    id: "gujarat-kidnapping",
    title: "Gujarat 48-Hour Manhunt",
    headline: "172 CCTV cameras scanned across 100 km to rescue a 5-year-old kidnapped boy",
    tags: [
      { label: "172 CCTVs", className: "bg-[#e9d5ff] text-[#581c87]" },
      { label: "48h Chase", className: "bg-[#bae6fd] text-[#0369a1]" },
    ],
    locationYear: "Gujarat, India · 2024",
    metric: "172 Cameras · 100 km Chase",
    description:
      "A 5-year-old child was abducted, forcing investigators to manually examine footage from 172 government and private cameras across blind spots and broken feeds.",
    sourceName: "The Indian Express",
    sourceUrl:
      "https://indianexpress.com/article/cities/ahmedabad/gujarat-hardlook-kidnapping-chase-hours-hunt-cctv-10886763/",
    image: "/images/incidents/gujarat_kidnapping.jpg",
  },
  {
    id: "delhi-murder-peeragarhi",
    title: "Peeragarhi 200-Feed Homicide",
    headline: "Staged hit-and-run uncovered as premeditated murder after reviewing 200+ camera feeds",
    tags: [
      { label: "200+ CCTVs", className: "bg-[#bae6fd] text-[#0369a1]" },
      { label: "Haridwar Arrest", className: "bg-[#fef3c7] text-[#92400e]" },
    ],
    locationYear: "Delhi, India · 2024",
    metric: "200+ Feeds · 48h Crackdown",
    description:
      "Initially reported as a routine road accident, detectives decoded over 200 surveillance feeds in 48 hours to identify the vehicle and arrest the suspects before they fled.",
    sourceName: "NDTV India",
    sourceUrl:
      "https://ndtv.in/delhi-news/peeragarhi-murder-mystery-delhi-police-cracked-the-case-after-scanning-200-cctv-footage-in-48-hours-four-accused-arrested-before-fleeing-to-haridwar-11551655",
    image: "/images/incidents/peeragarhi_mystery.jpg",
  },
  {
    id: "pune-porsche-crash",
    title: "Pune Porsche Speed Reconstruction",
    headline: "Kalyani Nagar CCTV footage captured high-speed impact and hospital evidence tampering",
    tags: [
      { label: "160 km/h Impact", className: "bg-[#ffe4e6] text-[#be123c]" },
      { label: "Junction Trail", className: "bg-[#e9d5ff] text-[#581c87]" },
    ],
    locationYear: "Pune, Maharashtra · 2024",
    metric: "Hospital & Road CCTV · Speed Analysis",
    description:
      "Police pieced together CCTV feeds across restaurant lobbies, highway intersections, and hospital premises to reconstruct vehicle velocity and expose sample tampering.",
    sourceName: "The Indian Express",
    sourceUrl:
      "https://indianexpress.com/article/cities/pune/pune-porsche-accident-cctv-captures-speeding-car-9340833/",
    image: "/images/incidents/pune_porsche.jpg",
  },
  {
    id: "bareilly-serial-manhunt",
    title: "Bareilly 1,500-Camera Manhunt",
    headline: "14-month serial killings cracked after scanning 1,500 cameras across 25 km rural stretches",
    tags: [
      { label: "1,500 CCTVs", className: "bg-[#dcfce7] text-[#15803d]" },
      { label: "Operation Talash", className: "bg-[#cffafe] text-[#0e7490]" },
    ],
    locationYear: "Bareilly, Uttar Pradesh · 2024",
    metric: "1,500 Cameras · 22 Police Teams",
    description:
      "Police launched 'Operation Talash', installing and reviewing 1,500 CCTV cameras across isolated rural roads and decoy corridors to apprehend the serial offender.",
    sourceName: "The Indian Express",
    sourceUrl:
      "https://indianexpress.com/article/long-reads/bareilly-serial-killing-case-kuldeep-kumar-gangwar-up-police-9510592/",
    image: "/images/incidents/bareilly_serial.jpg",
  },
  {
    id: "delhi-builder-murder",
    title: "South Delhi Staged Robbery",
    headline: "Conspiracy exposed by cross-referencing neighborhood CCTV timelines with call records",
    tags: [
      { label: "Timeline Match", className: "bg-[#ffedd5] text-[#9a3412]" },
      { label: "Forensic CCTV", className: "bg-[#fef3c7] text-[#92400e]" },
    ],
    locationYear: "South Delhi, India · 2024",
    metric: "CCTV Timeline · Mystery Solved",
    description:
      "Detectives analyzed neighborhood CCTV cameras around the house to identify a masked intruder during a staged robbery, cross-referencing timeline evidence to uncover the conspiracy.",
    sourceName: "The Indian Express",
    sourceUrl:
      "https://indianexpress.com/article/cities/delhi/sleeping-pills-electrocution-staged-robbery-wife-her-friend-held-for-builders-murder-in-south-delhi-10830610/",
    image: "/images/incidents/delhi_builder_murder.jpg",
  },
  {
    id: "chanakyapuri-grid",
    title: "Chanakyapuri Security Grid",
    headline: "Diplomatic zone infrastructure tracked across 150 high-security surveillance camera nodes",
    tags: [
      { label: "150 CCTVs", className: "bg-[#e0e7ff] text-[#3730a3]" },
      { label: "Zone Defense", className: "bg-[#bae6fd] text-[#0369a1]" },
    ],
    locationYear: "New Delhi, India · 2024",
    metric: "150 Node Grid · Real-Time Tracking",
    description:
      "Specialized police units reviewed multi-junction CCTV grids and camera power telemetry across embassy corridors to catch perpetrators operating in high-security zones.",
    sourceName: "The Indian Express",
    sourceUrl:
      "https://indianexpress.com/article/cities/delhi/sleeping-pills-electrocution-staged-robbery-wife-her-friend-held-for-builders-murder-in-south-delhi-10830610/",
    image: "/images/cctv_live_footage.jpg",
  },
];

// Duplicate incidents array to create a seamless infinite marquee loop
const marqueeIncidents = [...incidents, ...incidents];

export default function Incidents() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section
      id="why-it-matters"
      className="relative bg-[#111317] text-white py-16 sm:py-24 border-t border-white/5 overflow-hidden"
    >
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[350px] bg-red-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 w-full space-y-10 sm:space-y-12">
        {/* SECTION HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto px-4 sm:px-6 space-y-4"
        >


          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-tight">
            WHY IT MATTERS.
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed font-normal max-w-2xl mx-auto">
            When crimes unfold, officers spend 48 to 72 hours manually scanning hundreds of disjointed camera feeds.
            CyberVision-AI isolates suspects, links multi-camera timelines, and generates forensic evidence in seconds.
          </p>

          {/* INTERACTION HINT & PAUSE TOGGLE */}
          
        </motion.div>

        {/* FULL-WIDTH CONTINUOUS HORIZONTAL MOVING TRACK */}
        <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] py-3">
          <div
            className={`animate-marquee flex gap-5 sm:gap-6 w-max ${isPaused ? "[animation-play-state:paused]" : ""
              }`}
            style={{ animationDuration: "50s" }}
          >
            {marqueeIncidents.map((incident, idx) => (
              <a
                key={`${incident.id}-${idx}`}
                href={incident.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-[310px] sm:w-[350px] md:w-[380px] shrink-0 block cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-[28px]"
              >
                {/* CARD IMAGE CONTAINER WITH FLOATING PILLS — EXACTLY LIKE USER REFERENCE */}
                <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[22px] sm:rounded-[26px] bg-[#181a20] border border-white/10 group-hover:border-white/25 shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <Image
                    src={incident.image}
                    alt={incident.title}
                    fill
                    sizes="(max-width: 768px) 310px, 380px"
                    className="object-cover object-center brightness-[0.88] contrast-[1.05] group-hover:scale-105 group-hover:brightness-95 transition-transform duration-500 ease-out"
                  />

                  {/* Subtle vignette at base */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* FLOATING PILL TAGS (TOP-LEFT) — EXACTLY LIKE REFERENCE SCREENSHOT */}
                  <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2">
                    {incident.tags.map((tag) => (
                      <span
                        key={tag.label}
                        className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold tracking-tight shadow-sm ${tag.className}`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>

                  {/* SOURCE BADGE (TOP-RIGHT) */}
                  <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-black/75 backdrop-blur-md text-[11px] font-medium text-white/90 border border-white/15 shadow-sm group-hover:bg-black/90 transition-colors">
                    <span>{incident.sourceName}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {/* CARD DETAILS BELOW IMAGE CONTAINER */}
                <div className="mt-3.5 sm:mt-4 space-y-1.5 px-1">
                  {/* TITLE & HOVER ARROW */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-400 transition-colors leading-snug">
                      {incident.title}
                    </h3>
                    <div className="p-1 rounded-full bg-white/[0.04] group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-400 transition-all shrink-0 mt-0.5">
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* METRIC & LOCATION */}
                  <p className="text-[11px] sm:text-xs font-mono text-cyan-400/90 font-medium">
                    {incident.metric} · {incident.locationYear}
                  </p>

                  {/* HEADLINE / DESCRIPTION */}
                  <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed font-normal">
                    {incident.headline}
                  </p>

                  {/* ACTION LINK */}
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                    <span>Read news report & case details</span>
                    <span className="text-cyan-400">↗</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
