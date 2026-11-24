// Language: TypeScript (React/Next.js) | Target: Admin Third-Party Ad Script Renderer (Individual/Public Only)
"use client";

import React, { useEffect, useRef } from "react";

interface ThirdPartyAdSlotProps {
  slotName: string;
  scriptCode: string;
  isAgencyUser?: boolean;
}

export default function ThirdPartyAdSlot({
  slotName,
  scriptCode,
  isAgencyUser = false,
}: ThirdPartyAdSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    // Agency ইউজারদের প্যানেলে কোনো বিজ্ঞাপন দেখানো হবে না
    if (isAgencyUser || !scriptCode.trim()) {
      return;
    }

    const tempWrapper = document.createElement("div");
    tempWrapper.innerHTML = scriptCode;

    // Non-script HTML elements যুক্ত করা
    Array.from(tempWrapper.childNodes).forEach((node) => {
      if (node.nodeName.toLowerCase() !== "script") {
        container.appendChild(node.cloneNode(true));
      }
    });

    // <script> ট্যাগগুলো ডাইনামিকভাবে এক্সিকিউট করা
    const scripts = tempWrapper.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      container.appendChild(newScript);
    });
  }, [scriptCode, isAgencyUser, slotName]);

  if (isAgencyUser || !scriptCode.trim()) {
    return null;
  }

  return (
    <div
      data-ad-slot={slotName}
      className="my-3 flex w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2"
    >
      <div ref={containerRef} className="w-full text-center" />
    </div>
  );
}
