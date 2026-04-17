"use client";

import dynamic from "next/dynamic";

const TransitMap = dynamic(() => import("./TransitMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-900">
      <span className="text-gray-400">Loading map...</span>
    </div>
  ),
});

export default TransitMap;
