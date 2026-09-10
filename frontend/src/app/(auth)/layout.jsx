"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function AuthLayout({ children }) {
  const pathname = usePathname();
  const isLogin = pathname.includes("login") || pathname === "/";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 lg:p-12 overflow-hidden relative bg-[#02040a]">
      
      {/* Immersive Painterly Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Deep starry/bokeh base slowly panning */}
        <motion.div 
          animate={{ backgroundPosition: ['0px 0px', '40px 40px'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-[0.15] mix-blend-color-dodge" 
          style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />
        
        {/* Subtle, floating painterly light blooms */}
        <motion.div 
          animate={{ x: ['-2%', '2%', '-2%'], y: ['-2%', '2%', '-2%'], scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#059669]/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ x: ['2%', '-2%', '2%'], y: ['2%', '-2%', '2%'], scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-[#1e3a8a]/20 rounded-full blur-[130px]"
        />
        <motion.div 
          animate={{ y: ['0%', '-5%', '0%'], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[100px]"
        />
      </div>
      
      {/* DESKTOP LAYOUT */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden md:flex w-full max-w-[1050px] h-[680px] rounded-[24px] overflow-hidden relative z-10 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.9)] border border-white/10"
      >
        {/* Master Image filling the ENTIRE card - Breathing Animation */}
        <div className="absolute inset-0 z-0 bg-[#060c16] overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 0.5, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full absolute inset-0 origin-center"
          >
            <Image 
              src="/images/Login.png"
              alt="Expense Tracker"
              fill
              sizes="100vw"
              className="object-cover object-right"
              priority
              quality={100}
            />
          </motion.div>
          {/* Subtle overlay gradient for depth to blend with the form */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#02050a]/40 to-transparent pointer-events-none" />
        </div>

        {/* Form Panel - Slides between left and right */}
        <motion.div 
          className="absolute top-0 bottom-0 w-[48%] flex flex-col justify-center z-10 px-10 lg:px-14 bg-[#0a0f1c]/85 backdrop-blur-xl border-x border-white/5 shadow-2xl"
          initial={false}
          animate={{ left: isLogin ? "0%" : "52%" }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-[360px] mx-auto py-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* MOBILE LAYOUT */}
      <div className="md:hidden flex flex-col w-full min-h-screen z-10">
        <div className="w-full h-64 relative bg-[#060c16] border-b border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-10 rounded-b-[2.5rem] overflow-hidden">
          <Image 
            src="/images/Login.png"
            alt="Expense Tracker"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent pointer-events-none" />
        </div>
        
        <div className="flex-1 px-6 py-8 z-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
