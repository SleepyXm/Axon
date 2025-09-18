"use client";

import Image from "next/image";

import { Manrope } from "next/font/google";
import { motion, easeOut, TargetAndTransition } from "framer-motion";
import AuraBackground7 from "@/app/components/background7";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "200"] });

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: easeOut },
  }),
};

export default function Home() {
  return (
    <div className="bg-gray-800/70 grid grid-rows-[5vh_1fr_5vh] items-center justify-items-center min-h-screen pb-[10vh] gap-[5vh]
    ">
      <AuraBackground7 />

      <div className="flex justify-center mt-[50%] pt-20%">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-2 shadow-2xl flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search models..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 text-white px-2 py-1 rounded-md"
          />

          <select
            className="bg-black/40 border border-white/15 text-white text-sm rounded-md px-2 py-1 hover:border-white/25 transition"
          >
            <option value="trending">Trending</option>
            <option value="downloads">Downloads</option>
            <option value="likes">Likes</option>
            <option value="updated">Recently Updated</option>
          </select>

          <button
            className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-blue-400 text-black hover:bg-blue-300 transition"
          >
            Search
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}
