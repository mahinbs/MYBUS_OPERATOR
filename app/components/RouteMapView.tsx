"use client";

import { useState } from "react";

const routeStops = [
  { name: "Mumbai Central", type: "start", time: "06:00 AM" },
  { name: "Bandra Terminus", type: "pickup", time: "06:30 AM" },
  { name: "Thane", type: "pickup", time: "07:00 AM" },
  { name: "Kalyan", type: "pickup", time: "07:30 AM" },
  { name: "Lonavala", type: "rest", time: "08:15 AM" },
  { name: "Pune Station", type: "drop", time: "09:30 AM" },
  { name: "Swargate", type: "drop", time: "09:45 AM" },
  { name: "Koregaon Park", type: "end", time: "10:00 AM" },
];

const routeOptions = [
  { id: "RT-101", name: "Mumbai → Pune", distance: "152 km", duration: "3h 30m", color: "#7C3AED" },
  { id: "RT-205", name: "Delhi → Jaipur", distance: "280 km", duration: "5h 15m", color: "#8B5CF6" },
  { id: "RT-312", name: "Bangalore → Hyderabad", distance: "570 km", duration: "8h 45m", color: "#6D28D9" },
];

export default function RouteMapView({ onClose }: { onClose: () => void }) {
  const [selectedRoute, setSelectedRoute] = useState(routeOptions[0]);

  return (
    <div className="fixed inset-0 z-[70] bg-[#F0F0F5] flex flex-col max-w-[430px] mx-auto w-full shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pt-12 pb-4 shadow-xl shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <i className="ri-arrow-left-line text-white text-lg" />
          </button>
          <div>
            <h2 className="text-white font-bold text-base">Route Map</h2>
            <p className="text-white/50 text-[11px]">{selectedRoute.name} · {selectedRoute.distance}</p>
          </div>
        </div>
      </div>

      {/* Route Selector */}
      <div className="bg-white px-5 py-3 shadow-sm shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {routeOptions.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoute(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedRoute.id === r.id
                  ? "bg-[#7C3AED] text-white shadow-md"
                  : "bg-[#F3F4F6] text-[#6B7280]"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* Google Map Embed */}
      <div className="shrink-0 h-[280px] bg-[#E5E7EB] relative">
        <iframe
          width="100%"
          height="280"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d482667.83930775266!2d72.877656!3d18.96903!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e0!4m5!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai%2C+Maharashtra!3m2!1d19.076!2d72.8777!4m5!1s0x3bc2bf2e67461101%3A0x828d43bfaf38c3f1!2sPune%2C+Maharashtra!3m2!1d18.5204!2d73.8567!5e0!3m2!1sen!2sin!4v1700000000000"
        />
        <div className="absolute bottom-3 left-3 bg-white rounded-xl px-3 py-2 shadow-md flex items-center gap-2">
          <i className="ri-route-line text-[#7C3AED]" />
          <span className="text-xs font-medium text-[#111827]">{selectedRoute.duration}</span>
        </div>
      </div>

      {/* Stop Timeline */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <h3 className="text-sm font-bold text-[#111827] mb-3">Stops & Timings</h3>
        <div className="space-y-0">
          {routeStops.map((stop, i) => {
            const isStart = stop.type === "start";
            const isEnd = stop.type === "end";
            const isRest = stop.type === "rest";
            return (
              <div key={stop.name} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                    isStart || isEnd
                      ? "bg-[#7C3AED] border-[#7C3AED]"
                      : isRest
                      ? "bg-amber-500 border-amber-500"
                      : "bg-white border-[#7C3AED]"
                  }`}>
                    {(isStart || isEnd) && <div className="w-1 h-1 bg-white rounded-full" />}
                  </div>
                  {i !== routeStops.length - 1 && (
                    <div className="w-px flex-1 bg-[#E5E7EB] min-h-[20px]" />
                  )}
                </div>
                {/* Card */}
                <div className="flex-1 pb-4">
                  <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className={`${
                        isStart ? "ri-map-pin-2-fill text-[#7C3AED]"
                        : isEnd ? "ri-flag-fill text-[#7C3AED]"
                        : isRest ? "ri-cup-line text-amber-500"
                        : stop.type === "pickup" ? "ri-user-add-line text-green-500"
                        : "ri-user-received-line text-red-500"
                      } text-sm`} />
                      <span className="text-xs font-medium text-[#111827]">{stop.name}</span>
                    </div>
                    <span className="text-[11px] text-[#9CA3AF]">{stop.time}</span>
                  </div>
                  {isRest && (
                    <span className="text-[10px] text-amber-600 ml-6 mt-0.5 block">15 min rest stop</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trip Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mt-4 mb-2">
          <h3 className="text-sm font-bold text-[#111827] mb-3">Trip Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-[#7C3AED]">8</p>
              <p className="text-[10px] text-[#9CA3AF]">Stops</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#111827]">152</p>
              <p className="text-[10px] text-[#9CA3AF]">Kilometers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#10B981]">4h</p>
              <p className="text-[10px] text-[#9CA3AF]">Duration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}