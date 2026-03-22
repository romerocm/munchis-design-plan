"use client";

import Lottie from "lottie-react";
import { useTranslation } from "@/lib/i18n/context";
import cookingBg from "../../../public/animations/cooking-bg.json";

export function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { num: 1, title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
    { num: 2, title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
    { num: 3, title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
  ];

  const lottieProps = {
    animationData: cookingBg,
    loop: true,
    autoplay: true,
    className: "w-full h-full",
  };

  return (
    <div className="w-full bg-white rounded-[20px] py-10 px-10 flex items-center justify-around relative overflow-hidden">
      {/* Three Lottie instances spanning the full width */}
      <div className="absolute inset-0 flex opacity-[0.06] pointer-events-none">
        {/* Left — original */}
        <div className="flex-1 overflow-hidden">
          <Lottie {...lottieProps} />
        </div>
        {/* Center — rotated 180° */}
        <div className="flex-1 overflow-hidden" style={{ transform: "rotate(180deg)" }}>
          <Lottie {...lottieProps} />
        </div>
        {/* Right — rotated 180° */}
        <div className="flex-1 overflow-hidden" style={{ transform: "rotate(180deg)" }}>
          <Lottie {...lottieProps} />
        </div>
      </div>

      {/* Content */}
      {steps.map((step) => (
        <div key={step.num} className="flex flex-col items-center text-center max-w-[200px] relative z-10">
          <div className="w-12 h-12 rounded-full bg-mint flex items-center justify-center mb-3">
            <span className="font-display font-black text-lg text-forest">{step.num}</span>
          </div>
          <p className="font-semibold text-sm text-forest mb-1">{step.title}</p>
          <p className="text-xs text-forest/40 leading-relaxed">{step.desc}</p>
        </div>
      ))}
    </div>
  );
}
