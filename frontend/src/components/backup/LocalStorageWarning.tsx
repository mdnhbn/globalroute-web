// Language: TypeScript (React/Next.js) | Target: Prominent Local Storage Warning Notice Banner
"use client";

import React from "react";

interface LocalStorageWarningProps {
  variant?: "individual" | "agency";
  compact?: boolean;
}

export default function LocalStorageWarning({
  variant = "individual",
  compact = false,
}: LocalStorageWarningProps) {
  const ownerLabel =
    variant === "agency"
      ? "আপনার এজেন্সি ও ক্লায়েন্টদের প্রোফাইল, পাসপোর্ট, NID, লাইসেন্স ও ডকুমেন্ট"
      : "আপনার প্রোফাইল, পাসপোর্ট, NID, সার্টিফিকেট ও ডকুমেন্ট";

  return (
    <div
      role="alert"
      className={`w-full rounded-xl border-2 border-red-500 bg-red-50 text-red-950 shadow-sm ${
        compact ? "p-3" : "p-5"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
          !
        </span>
        <div className="space-y-1.5">
          <h3 className={compact ? "text-sm font-bold text-red-800" : "text-lg font-extrabold text-red-800"}>
            গুরুত্বপূর্ণ সতর্কবার্তা: লোকাল ডিভাইস স্টোরেজ ও ব্যাকআপ নির্দেশনা
          </h3>
          <p className={compact ? "text-xs leading-5 text-red-900" : "text-sm leading-6 text-red-900"}>
            {ownerLabel} আপনার <strong>Local Device</strong>-এর ব্রাউজারে সংরক্ষিত হচ্ছে এবং প্রয়োজনে{" "}
            <strong>Backup File</strong> রাখা যাবে। আপনি যদি নিয়মিত <strong>Backup File</strong> ডাউনলোড করে
            নিরাপদ স্থানে না রাখেন এবং ব্রাউজারের <strong>History / Cache / Site Data</strong> ক্লিয়ার করেন
            অথবা নতুন ডিভাইস/ব্রাউজার ব্যবহার করেন, তবে লোকাল ডাটা মুছে যাবে এবং ব্যাকআপ ফাইল না থাকলে আপনি
            আর এই ফাইল ও তথ্যগুলো খুঁজে পাবেন না বা ফিরে পাবেন না।
          </p>
          <p className="text-xs font-semibold text-red-700">
            পরামর্শ: কাজ শেষে বা গুরুত্বপূর্ণ ডকুমেন্ট যুক্ত করার পর অবশ্যই Backup File ডাউনলোড করে রাখুন এবং
            নতুন ডিভাইসে লগইন করলে Backup File আপলোড করে Restore করুন।
          </p>
        </div>
      </div>
    </div>
  );
}
