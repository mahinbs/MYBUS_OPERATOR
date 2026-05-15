"use client";

import { useState } from "react";

interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  experience: string;
  photo: string;
  status: "Active" | "On Leave" | "Off Duty";
  assignedBus: string | null;
  assignedTrip: string | null;
  rating: number;
  tripsDone: number;
}

const initialDrivers: Driver[] = [
  { id: "DRV-001", name: "Suresh Yadav", phone: "+91 98765 11111", license: "MH-2020-123456", experience: "8 years", photo: "https://readdy.ai/api/search-image?query=indian%20male%20bus%20driver%20professional%20uniform%20portrait%20headshot%20neutral%20background&width=100&height=100&seq=60&orientation=squarish", status: "Active", assignedBus: "MB-001", assignedTrip: "MB-401", rating: 4.8, tripsDone: 1240 },
  { id: "DRV-002", name: "Amit Singh", phone: "+91 98765 22222", license: "DL-2019-654321", experience: "6 years", photo: "https://readdy.ai/api/search-image?query=indian%20male%20professional%20bus%20driver%20portrait%20headshot%20neutral%20background%20formal%20uniform&width=100&height=100&seq=61&orientation=squarish", status: "Active", assignedBus: "MB-002", assignedTrip: "MB-203", rating: 4.6, tripsDone: 980 },
  { id: "DRV-003", name: "Ravi Kumar", phone: "+91 98765 33333", license: "KA-2021-789012", experience: "5 years", photo: "https://readdy.ai/api/search-image?query=indian%20male%20bus%20driver%20portrait%20friendly%20smile%20uniform%20neutral%20background&width=100&height=100&seq=62&orientation=squarish", status: "On Leave", assignedBus: null, assignedTrip: null, rating: 4.7, tripsDone: 756 },
  { id: "DRV-004", name: "Deepak Sharma", phone: "+91 98765 44444", license: "TN-2018-345678", experience: "10 years", photo: "https://readdy.ai/api/search-image?query=indian%20male%20professional%20driver%20headshot%20uniform%20neutral%20background&width=100&height=100&seq=63&orientation=squarish", status: "Off Duty", assignedBus: null, assignedTrip: null, rating: 4.9, tripsDone: 1560 },
  { id: "DRV-005", name: "Manoj Patel", phone: "+91 98765 55555", license: "GJ-2022-901234", experience: "3 years", photo: "https://readdy.ai/api/search-image?query=indian%20male%20driver%20portrait%20professional%20uniform%20neutral%20background&width=100&height=100&seq=64&orientation=squarish", status: "Active", assignedBus: "MB-004", assignedTrip: "MB-105", rating: 4.5, tripsDone: 420 },
];

const busOptions = [
  { id: "MB-001", name: "Volvo 9600 AC Sleeper" },
  { id: "MB-002", name: "Scania Metrolink" },
  { id: "MB-003", name: "Mercedes Benz OC500" },
  { id: "MB-004", name: "Ashok Leyland Oyster" },
];

const tripOptions = [
  { id: "MB-401", route: "Mumbai → Pune", time: "06:00 AM" },
  { id: "MB-203", route: "Delhi → Jaipur", time: "08:30 AM" },
  { id: "MB-105", route: "Bangalore → Hyderabad", time: "10:00 PM" },
  { id: "MB-302", route: "Chennai → Coimbatore", time: "02:00 PM" },
];

export default function DriverManagementScreen({ onClose }: { onClose: () => void }) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState("");
  const [selectedTrip, setSelectedTrip] = useState("");

  const filtered = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || d.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleAssign = (driverId: string) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, assignedBus: selectedBus || d.assignedBus, assignedTrip: selectedTrip || d.assignedTrip, status: "Active" as const } : d));
    setShowAssignModal(null);
    setSelectedBus("");
    setSelectedTrip("");
  };

  const activeDriver = showAssignModal ? drivers.find(d => d.id === showAssignModal) : null;

  return (
    <div className="fixed inset-0 z-[70] bg-[#F0F0F5] flex flex-col max-w-[430px] mx-auto w-full shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] px-5 pt-12 pb-5 shadow-xl shrink-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <i className="ri-arrow-left-line text-white text-lg" />
            </button>
            <h2 className="text-white font-bold text-base">Driver Management</h2>
          </div>
          <button onClick={() => setShowAddModal(true)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <i className="ri-add-line text-white text-lg" />
          </button>
        </div>
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drivers..."
            className="w-full bg-white/10 backdrop-blur-sm rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/50 outline-none border border-white/10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 py-3 bg-white shadow-sm shrink-0">
        <div className="flex gap-2 overflow-x-auto">
          {["All", "Active", "On Leave", "Off Duty"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? "bg-[#7C3AED] text-white shadow-md"
                  : "bg-[#F3F4F6] text-[#6B7280]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Driver List */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-3">
          {filtered.map((driver) => (
            <div key={driver.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#F3F4F6] flex-shrink-0">
                  <img src={driver.photo} alt={driver.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#111827] truncate">{driver.name}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      driver.status === "Active" ? "bg-green-50 text-green-600"
                      : driver.status === "On Leave" ? "bg-amber-50 text-amber-600"
                      : "bg-[#F3F4F6] text-[#9CA3AF]"
                    }`}>
                      {driver.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{driver.id} · License: {driver.license}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-[#F3F4F6] rounded-xl p-2 text-center">
                  <p className="text-xs font-bold text-[#7C3AED]">{driver.rating}</p>
                  <p className="text-[10px] text-[#9CA3AF]">Rating</p>
                </div>
                <div className="bg-[#F3F4F6] rounded-xl p-2 text-center">
                  <p className="text-xs font-bold text-[#111827]">{driver.tripsDone}</p>
                  <p className="text-[10px] text-[#9CA3AF]">Trips</p>
                </div>
                <div className="bg-[#F3F4F6] rounded-xl p-2 text-center">
                  <p className="text-xs font-bold text-[#10B981]">{driver.experience}</p>
                  <p className="text-[10px] text-[#9CA3AF]">Exp</p>
                </div>
              </div>

              {driver.assignedBus && (
                <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mb-2">
                  <i className="ri-bus-2-line text-[#9CA3AF]" />
                  <span>{driver.assignedBus}</span>
                  {driver.assignedTrip && (
                    <>
                      <span className="text-[#E5E7EB]">|</span>
                      <i className="ri-route-line text-[#9CA3AF]" />
                      <span>{driver.assignedTrip}</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAssignModal(driver.id); setSelectedBus(driver.assignedBus || ""); setSelectedTrip(driver.assignedTrip || ""); }}
                  className="flex-1 bg-[#7C3AED] text-white text-xs font-medium py-2 rounded-xl"
                >
                  {driver.assignedBus ? "Reassign" : "Assign Bus"}
                </button>
                <button className="w-10 h-8 bg-[#F3F4F6] rounded-xl flex items-center justify-center">
                  <i className="ri-phone-line text-[#9CA3AF] text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && activeDriver && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end" onClick={() => setShowAssignModal(null)}>
          <div className="bg-white w-full rounded-t-[28px] p-6 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#E5E7EB] rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <img src={activeDriver.photo} alt={activeDriver.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Assign {activeDriver.name}</h3>
                <p className="text-[10px] text-[#9CA3AF]">{activeDriver.id}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#6B7280] mb-2 block">Select Bus</label>
                <div className="grid grid-cols-1 gap-2">
                  {busOptions.map((bus) => (
                    <button
                      key={bus.id}
                      onClick={() => setSelectedBus(bus.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        selectedBus === bus.id
                          ? "bg-[#7C3AED]/10 border border-[#7C3AED]"
                          : "bg-[#F3F4F6] border border-transparent"
                      }`}
                    >
                      <i className="ri-bus-2-line text-[#7C3AED] text-lg" />
                      <div>
                        <p className="text-xs font-medium text-[#111827]">{bus.name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{bus.id}</p>
                      </div>
                      {selectedBus === bus.id && <i className="ri-check-line text-[#7C3AED] ml-auto text-sm" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#6B7280] mb-2 block">Select Trip</label>
                <div className="grid grid-cols-1 gap-2">
                  {tripOptions.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        selectedTrip === trip.id
                          ? "bg-[#7C3AED]/10 border border-[#7C3AED]"
                          : "bg-[#F3F4F6] border border-transparent"
                      }`}
                    >
                      <i className="ri-route-line text-[#7C3AED] text-lg" />
                      <div>
                        <p className="text-xs font-medium text-[#111827]">{trip.route}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{trip.id} · {trip.time}</p>
                      </div>
                      {selectedTrip === trip.id && <i className="ri-check-line text-[#7C3AED] ml-auto text-sm" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleAssign(showAssignModal)}
                className="w-full bg-[#7C3AED] text-white font-semibold py-3.5 rounded-2xl mt-2"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full rounded-t-[28px] p-6 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#E5E7EB] rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#111827] mb-4">Add New Driver</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#6B7280] mb-1.5 block">Full Name</label>
                <input type="text" placeholder="e.g. Vikram Rao" className="w-full bg-[#F3F4F6] rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280] mb-1.5 block">Phone Number</label>
                <input type="tel" placeholder="+91 98765 00000" className="w-full bg-[#F3F4F6] rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6B7280] mb-1.5 block">License Number</label>
                  <input type="text" placeholder="MH-2020-..." className="w-full bg-[#F3F4F6] rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[#6B7280] mb-1.5 block">Experience</label>
                  <input type="text" placeholder="e.g. 5 years" className="w-full bg-[#F3F4F6] rounded-xl px-4 py-3 text-sm outline-none" />
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-full bg-[#7C3AED] text-white font-semibold py-3.5 rounded-2xl mt-2">
                Add Driver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}