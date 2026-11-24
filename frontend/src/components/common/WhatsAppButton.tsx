// Language: TypeScript (React/Next.js) | Target: Floating WhatsApp Live Contact Button
"use client";

import React from "react";

interface WhatsAppButtonProps {
  phoneNumber: string;
  defaultMessage?: string;
}

export default function WhatsAppButton({
  phoneNumber,
  defaultMessage = "Hello, I need help with GlobalRoute.",
}: WhatsAppButtonProps) {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  if (!cleanPhone) return null;

  const href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700"
    >
      <span>WhatsApp</span>
    </a>
  );
}
