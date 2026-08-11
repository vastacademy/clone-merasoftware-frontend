// /src/pages/Practice.js
import React, { useMemo, useState } from "react";
import {
  Users,
  DollarSign,
  Package,
  UserCheck,
  Headphones,
  ShoppingCart,
  FileText,
  XCircle,
  Clock,
  CheckCircle,
  Truck,
  Settings,
  ClipboardList,
  Archive,
  Home,
  Wrench,
  ListChecks,
  BadgeCheck,
  UserPlus,
} from "lucide-react";

/* ───────────────── Shared Options & Utils ───────────────── */
const DEVICE_TYPES = ["Laptop", "Projector", "Motherboard", "Mobile"];
const CONDITIONS = ["Burned", "Dead", "Water Damaged", "Physical Damaged", "Display Problem"];
const CLOSE_REASONS = ["Customer Refused", "Duplicate Ticket", "Part Not Available", "Other"];

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};

function cx(...xs) { return xs.filter(Boolean).join(" "); }

/* ───────────────── Seed Data ───────────────── */
const initialCustomers = [
  {
    id: "c1",
    name: "Arjun Sharma",
    phone: "9876501234",
    history: [
      { date: "2025-08-18", product: "Laptop", issue: "Display flicker" },
      { date: "2025-07-02", product: "Mobile", issue: "Water damage" },
    ],
    jobs: [
      {
        id: "r101",
        date: "2025-08-20",
        deviceType: "Laptop",
        barcode: "LAP-2025-0081",
        condition: "Display Problem",
        notes: "Seed job",
        status: "Registered", // Registered | Completed | Closed
        delivered: false,
        estimate: "",
        techNotes: "",
        closeReason: "",
      },
    ],
  },
  {
    id: "c2",
    name: "Simran Kaur",
    phone: "9988776655",
    history: [
      { date: "2025-08-19", product: "Projector", issue: "No power" },
      { date: "2025-06-28", product: "Motherboard", issue: "Burned IC" },
    ],
    jobs: [
      {
        id: "r202",
        date: "2025-08-19",
        deviceType: "Mobile",
        barcode: "MOB-2025-2211",
        condition: "Water Damaged",
        notes: "Seed job",
        status: "Completed",
        delivered: false,
        estimate: "1800",
        techNotes: "Replaced charging IC + cleaning",
        closeReason: "",
      },
      {
        id: "r203",
        date: "2025-08-01",
        deviceType: "Motherboard",
        barcode: "MB-5521",
        condition: "Burned",
        notes: "Completed example",
        status: "Completed",
        delivered: true,
        estimate: "3200",
        techNotes: "Reflow + VRM replacement",
        closeReason: "",
      },
    ],
  },
];

/* ───────────────── Reusable UI Pieces ───────────────── */
function StatCard({ icon: Icon, title, value, subtitle, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    red: "bg-red-50 border-red-200 text-red-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors",
        isActive ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700" : "text-gray-600 hover:bg-gray-50"
      )}
    >
      <Icon size={20} className="mr-3" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function ProgressRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center">
        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
          <div className={`${color} h-2 rounded-full`} style={{ width: `${value}%` }} />
        </div>
        <span className="text-sm font-medium">{value}%</span>
      </div>
    </div>
  );
}

function JobsTable({ title, jobs, onRowClick }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      <div className="p-4 font-medium">{title}</div>
      {jobs.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-gray-500">No items.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Device</th>
                <th className="text-left p-3">Barcode</th>
                <th className="text-left p-3">Condition</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Estimate</th>
                <th className="text-left p-3">Delivered</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => onRowClick && onRowClick(j)}
                >
                  <td className="p-3">{j.date}</td>
                  <td className="p-3">{j.customerName}</td>
                  <td className="p-3">{j.deviceType}</td>
                  <td className="p-3">{j.barcode || "—"}</td>
                  <td className="p-3">{j.condition}</td>
                  <td className="p-3">
                    {j.status}
                    {j.status === "Closed" && j.closeReason ? ` — ${j.closeReason}` : ""}
                  </td>
                  <td className="p-3">{j.estimate ? `₹${j.estimate}` : "—"}</td>
                  <td className="p-3">{j.status === "Completed" ? (j.delivered ? "✓" : "✗") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ───────────────── Modals ───────────────── */
function CustomerDetailsModal({ customer, onClose, onRegister }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl border p-5">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Customer Details</h3>
          <button onClick={onClose} className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50">Close</button>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{customer.name}</span></div>
          <div><span className="text-gray-500">Phone:</span> {customer.phone}</div>
        </div>
        <div className="mt-4">
          <div className="font-medium">Last Repairs (max 2)</div>
          {customer.history.length === 0 ? (
            <p className="text-sm text-gray-500">No history yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {customer.history.slice(0,2).map((h, idx) => (
                <li key={idx} className="rounded-xl border p-3">
                  <div className="text-xs text-gray-500">{h.date}</div>
                  <div className="font-medium">{h.product}</div>
                  <div className="text-sm">{h.issue}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 pt-4">
          <button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Close</button>
          <button onClick={onRegister} className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">Register New Device</button>
        </div>
      </div>
    </div>
  );
}

function RegisterModal({ customer, onClose, onRegister }) {
  const [barcode, setBarcode] = useState("");
  const [deviceType, setDeviceType] = useState(DEVICE_TYPES[0]);
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [notes, setNotes] = useState("");

  function simulateScan() {
    setBarcode("LAP-2025-0081");
    setDeviceType("Laptop");
    setCondition("Display Problem");
    setNotes("Auto-filled from simulated barcode scan.");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      customerId: customer.id,
      customerName: customer.name,
      barcode: barcode.trim(),
      deviceType,
      condition,
      notes: notes.trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    onRegister(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl border p-5">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Register New Device</h3>
          <button onClick={onClose} className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50">Close</button>
        </div>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Barcode Scanner</div>
                <div className="text-xs text-gray-500">Use a scanner or paste code below. Click simulate to auto-fill.</div>
              </div>
              <button type="button" onClick={simulateScan} className="text-sm rounded-lg border px-3 py-1 hover:bg-gray-50">Simulate Scan</button>
            </div>
            <input className="mt-3 w-full rounded-lg border px-3 py-2" placeholder="Scan/Enter Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Device</label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2 bg-white" value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
                {DEVICE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Condition (first look)</label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2 bg-white" value={condition} onChange={(e) => setCondition(e.target.value)}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Notes (optional)</label>
            <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={3} placeholder="Any quick notes about the device..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">Register</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobDetailsModal({ role, job, onClose, onSubmitEstimate, onComplete, onCloseTicket, onDeliver }) {
  const [estimate, setEstimate] = useState(job.estimate || "");
  const [techNotes, setTechNotes] = useState(job.techNotes || "");
  const [closeReason, setCloseReason] = useState(CLOSE_REASONS[0]);

  const isReception = role === "receptionist";
  const isTech = role === "technician";

  const canEditTech = isTech && job.status === "Registered";
  const canDeliver = isReception && job.status === "Completed" && !job.delivered;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-xl border p-5">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Job Details</h3>
          <button onClick={onClose} className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50">Close</button>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span className="text-gray-500">Date:</span> {job.date}</div>
          <div><span className="text-gray-500">Customer:</span> {job.customerName}</div>
          <div><span className="text-gray-500">Device:</span> {job.deviceType}</div>
          <div><span className="text-gray-500">Barcode:</span> {job.barcode || "—"}</div>
          <div className="sm:col-span-2"><span className="text-gray-500">Condition:</span> {job.condition}</div>
          {job.notes && <div className="sm:col-span-2"><span className="text-gray-500">Reception Notes:</span> {job.notes}</div>}
          <div className="sm:col-span-2">
            <span className="text-gray-500">Status:</span> <span className="font-medium">{job.status}</span>
            {job.status === "Closed" && job.closeReason ? <span className="ml-1">— {job.closeReason}</span> : null}
          </div>
          {job.status === "Completed" && (
            <div className="sm:col-span-2"><span className="text-gray-500">Delivered:</span> {job.delivered ? "Yes" : "No"}</div>
          )}
        </div>

        <div className="mt-4 rounded-xl border p-4 bg-gray-50">
          <div className="font-medium mb-2">Technician Estimate & Notes</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Estimated Price (₹)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border px-3 py-2 bg-white"
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                disabled={!canEditTech}
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-sm text-gray-600">Technician Notes</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 bg-white"
                placeholder="Work summary / parts / diagnosis"
                value={techNotes}
                onChange={(e) => setTechNotes(e.target.value)}
                disabled={!canEditTech}
              />
            </div>
          </div>
          {isTech && job.status === "Registered" && (
            <p className="text-xs text-gray-500 mt-2">
              Tip: first click <b>Submit Estimate</b> to save values, then <b>Complete Repair</b> when job is done or <b>Close</b> if customer refused.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
          <button onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">Close</button>

          {/* Technician Actions */}
          {isTech && job.status === "Registered" && (
            <>
              <button
                onClick={() => onSubmitEstimate && onSubmitEstimate({ estimate: estimate.trim(), techNotes: techNotes.trim() })}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
              >Submit Estimate</button>

              <button
                onClick={() => onComplete && onComplete({ estimate: estimate.trim(), techNotes: techNotes.trim() })}
                className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
              >Complete Repair</button>

              <div className="inline-flex items-center gap-2">
                <select className="rounded-lg border px-2 py-2 text-sm bg-white" value={closeReason} onChange={(e) => setCloseReason(e.target.value)}>
                  {CLOSE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button
                  onClick={() => onCloseTicket && onCloseTicket(closeReason, { estimate: estimate.trim(), techNotes: techNotes.trim() })}
                  className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
                >Close (Refused)</button>
              </div>
            </>
          )}

          {/* Receptionist Action */}
          {canDeliver && (
            <button onClick={onDeliver} className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">Mark Delivered</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Role: Reception (Sidebar + Content) ───────────────── */
function ReceptionContent({ active, setActive, customers = [], setCustomers }) {
  // Shared derivations
  const allJobs = useMemo(
    () => (customers || []).flatMap((c) => (c.jobs || []).map((j) => ({ ...j, customerId: c.id, customerName: c.name }))),
    [customers]
  );
  const jobsRegistered = useMemo(() => allJobs.filter((j) => j.status === "Registered").sort((a,b)=> (b.date > a.date ? 1 : -1)), [allJobs]);
  const jobsCompleted = useMemo(() => allJobs.filter((j) => j.status === "Completed").sort((a,b)=> (b.date > a.date ? 1 : -1)), [allJobs]);
  const jobsReadyToDeliver = useMemo(() => jobsCompleted.filter((j) => !j.delivered), [jobsCompleted]);

  // Dashboard metrics
  const metrics = {
    customers: customers.length,
    registered: jobsRegistered.length,
    ready: jobsReadyToDeliver.length,
    completed: jobsCompleted.length,
  };

  // State for Customers page & modals
  const [query, setQuery] = useState("");
  const [customerForModal, setCustomerForModal] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [jobForModal, setJobForModal] = useState(null);

  const filteredCustomers = useMemo(() => {
    const q = query.replace(/[^0-9]/g, "");
    if (!q) return customers;
    return customers.filter((c) => c.phone.includes(q));
  }, [query, customers]);

  const exactMatch = useMemo(() => {
    const q = query.replace(/[^0-9]/g, "");
    if (q.length < 10) return null;
    return customers.find((c) => c.phone === q) || null;
  }, [query, customers]);

  function addNewCustomer() {
    const phone = query.replace(/[^0-9]/g, "");
    if (phone.length < 10) return;
    const name = window.prompt("Enter customer name:", "New Customer");
    if (!name) return;
    const newCustomer = { id: `c_${Date.now()}`, name, phone, history: [], jobs: [] };
    setCustomers((prev) => {
      const next = [...prev, newCustomer];
      while (next.length > 2) next.shift(); // keep max 2 (prototype)
      return next;
    });
  }
  function openCustomerModal(c) { setCustomerForModal(c); }
  function openRegisterModalFor(c) { setCustomerForModal({ ...c, __registerOnly: true }); setShowRegisterModal(true); }
  function addJobForCustomer(customerId, job) {
    setCustomers((prev) => prev.map((c) => c.id === customerId ? { ...c, jobs: [job, ...(c.jobs||[])] } : c));
  }

  // Sidebar items for Reception
  const sidebar = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "customers", label: "Customers", icon: Users },
    { key: "registered", label: "Registered Devices", icon: ClipboardList },
    { key: "ready", label: "Ready to Deliver", icon: BadgeCheck },
    { key: "completed", label: "Completed Tasks", icon: ListChecks },
  ];

  /* Content Switch */
  return (
    <>
      {/* Sidebar (left) */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">CRM Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Reception Panel</p>
        </div>
        <nav className="p-4 space-y-2">
          {sidebar.map((s) => (
            <SidebarItem
              key={s.key}
              icon={s.icon}
              label={s.label}
              isActive={active === s.key}
              onClick={() => setActive(s.key)}
            />
          ))}
        </nav>
      </div>

      {/* Main (right) — header now comes from parent */}
      <div className="flex-1 overflow-auto">
        {active === "dashboard" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard icon={Users} title="Total Customers" value={metrics.customers} color="blue" />
              <StatCard icon={ClipboardList} title="Registered Devices" value={metrics.registered} color="indigo" />
              <StatCard icon={BadgeCheck} title="Ready to Deliver" value={metrics.ready} color="green" />
              <StatCard icon={ListChecks} title="Completed" value={metrics.completed} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setActive("customers")} className="px-4 py-2 rounded-lg border hover:bg-gray-50 flex items-center gap-2">
                    <UserPlus size={18}/> Add / Search Customer
                  </button>
                  <button onClick={() => setActive("ready")} className="px-4 py-2 rounded-lg border hover:bg-gray-50 flex items-center gap-2">
                    <BadgeCheck size={18}/> Ready to Deliver
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Overview</h3>
                <div className="space-y-4">
                  <ProgressRow label="Registered" value={metrics.registered ? Math.min(100, metrics.registered * 25) : 0} color="bg-orange-500" />
                  <ProgressRow label="Ready" value={metrics.ready ? Math.min(100, metrics.ready * 50) : 0} color="bg-blue-500" />
                  <ProgressRow label="Completed" value={metrics.completed ? Math.min(100, metrics.completed * 50) : 0} color="bg-green-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {active === "customers" && (
          <div className="p-6 space-y-6">
            <div className="bg-white rounded-2xl border shadow-sm p-4">
              <h2 className="text-lg font-medium">Customers</h2>
              <p className="text-sm text-gray-500">Search by phone. Enter full number to add if no match appears.</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter phone number"
                  className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setQuery("")}>Clear</button>
                {!exactMatch && query.replace(/[^0-9]/g, "").length >= 10 && (
                  <button onClick={addNewCustomer} className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">Add New Customer</button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm">
              <div className="p-4 font-medium">Customers List</div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Phone</th>
                      <th className="text-left p-3 w-36">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="p-3">{c.name}</td>
                        <td className="p-3">{c.phone}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button onClick={() => setCustomerForModal(c)} className="rounded border px-3 py-1 hover:bg-gray-50">View</button>
                            <button onClick={() => openRegisterModalFor(c)} className="rounded border px-3 py-1 hover:bg-gray-50">Register Device</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr><td colSpan={3} className="p-6 text-center text-gray-500">No customers found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {active === "registered" && (
          <div className="p-6">
            <JobsTable title="Registered Devices" jobs={jobsRegistered} onRowClick={setJobForModal} />
          </div>
        )}

        {active === "ready" && (
          <div className="p-6">
            <JobsTable title="Ready to Deliver" jobs={jobsReadyToDeliver} onRowClick={setJobForModal} />
          </div>
        )}

        {active === "completed" && (
          <div className="p-6">
            <JobsTable title="Completed Tasks" jobs={jobsCompleted} onRowClick={setJobForModal} />
          </div>
        )}

        {/* Modals */}
        {customerForModal && !customerForModal.__registerOnly && (
          <CustomerDetailsModal
            customer={customerForModal}
            onClose={() => setCustomerForModal(null)}
            onRegister={() => { const c = customerForModal; setCustomerForModal(null); openRegisterModalFor(c); }}
          />
        )}
        {showRegisterModal && customerForModal && customerForModal.__registerOnly && (
          <RegisterModal
            customer={customerForModal}
            onClose={() => { setShowRegisterModal(false); setCustomerForModal(null); }}
            onRegister={(payload) => {
              const job = { id: `r_${Date.now()}`, status: "Registered", delivered: false, estimate: "", techNotes: "", closeReason: "", ...payload };
              addJobForCustomer(customerForModal.id, job);
              setShowRegisterModal(false);
              setCustomerForModal(null);
              setActive("registered");
            }}
          />
        )}
        {jobForModal && (
          <JobDetailsModal
            role="receptionist"
            job={jobForModal}
            onClose={() => setJobForModal(null)}
            onDeliver={() => {
              const j = jobForModal;
              setCustomers((prev) =>
                prev.map((c) =>
                  c.id === j.customerId
                    ? { ...c, jobs: c.jobs.map((x) => x.id === j.id ? { ...x, delivered: true } : x) }
                    : c
                )
              );
              setJobForModal(null);
            }}
          />
        )}
      </div>
    </>
  );
}

/* ───────────────── Role: Technician (Sidebar + Content) ───────────────── */
function TechnicianContent({ active, setActive, customers = [], setCustomers }) {
  const allJobs = useMemo(
    () => (customers || []).flatMap((c) => (c.jobs || []).map((j) => ({ ...j, customerId: c.id, customerName: c.name }))),
    [customers]
  );
  const jobsRegistered = useMemo(() => allJobs.filter((j) => j.status === "Registered").sort((a,b)=> (b.date > a.date ? 1 : -1)), [allJobs]);
  const jobsCompleted = useMemo(() => allJobs.filter((j) => j.status === "Completed").sort((a,b)=> (b.date > a.date ? 1 : -1)), [allJobs]);

  const metrics = {
    registered: jobsRegistered.length,
    completed: jobsCompleted.length,
    closed: allJobs.filter((j) => j.status === "Closed").length,
  };

  const [jobForModal, setJobForModal] = useState(null);

  function upsertJob(jobId, customerId, updater) {
    setCustomers((prev) => prev.map((c) => c.id !== customerId ? c : { ...c, jobs: c.jobs.map((j) => j.id === jobId ? updater(j) : j) }));
  }

  const sidebar = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "registered", label: "Registered Devices", icon: Wrench },
    { key: "completed", label: "Completed Tasks", icon: ListChecks },
  ];

  return (
    <>
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">CRM Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Technician Panel</p>
        </div>
        <nav className="p-4 space-y-2">
          {sidebar.map((s) => (
            <SidebarItem
              key={s.key}
              icon={s.icon}
              label={s.label}
              isActive={active === s.key}
              onClick={() => setActive(s.key)}
            />
          ))}
        </nav>
      </div>

      {/* Main — header now comes from parent */}
      <div className="flex-1 overflow-auto">
        {active === "dashboard" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard icon={Wrench} title="Registered" value={metrics.registered} color="orange" />
              <StatCard icon={ListChecks} title="Completed" value={metrics.completed} color="green" />
              <StatCard icon={XCircle} title="Closed / Refused" value={metrics.closed} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Tips</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                  <li>Open a job to add an estimate and notes.</li>
                  <li>Complete Repair to move it to Completed.</li>
                  <li>Close (Refused) when customer declines.</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Registered</h3>
                <ul className="space-y-3">
                  {jobsRegistered.slice(0,3).map((job) => (
                    <li key={job.id} className="rounded-xl border p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">{timeAgo(job.date)}</div>
                        <div className="font-medium">{job.deviceType} {job.barcode ? `(${job.barcode})` : ""}</div>
                        <div className="text-sm">Owner: {job.customerName}</div>
                      </div>
                      <button className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50" onClick={() => setActive("registered")}>Open</button>
                    </li>
                  ))}
                  {jobsRegistered.length === 0 && <li className="text-sm text-gray-500">No registered devices.</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {active === "registered" && (
          <div className="p-6">
            <JobsTable title="Registered Devices" jobs={jobsRegistered} onRowClick={setJobForModal} />
          </div>
        )}

        {active === "completed" && (
          <div className="p-6">
            <JobsTable title="Completed Tasks" jobs={jobsCompleted} onRowClick={setJobForModal} />
          </div>
        )}

        {jobForModal && (
          <JobDetailsModal
            role="technician"
            job={jobForModal}
            onClose={() => setJobForModal(null)}
            onSubmitEstimate={(data) => {
              upsertJob(jobForModal.id, jobForModal.customerId, (j) => ({ ...j, estimate: data.estimate, techNotes: data.techNotes }));
              setJobForModal(null);
            }}
            onComplete={(data) => {
              upsertJob(jobForModal.id, jobForModal.customerId, (j) => ({ ...j, status: "Completed", estimate: data.estimate ?? j.estimate, techNotes: data.techNotes ?? j.techNotes }));
              setJobForModal(null);
            }}
            onCloseTicket={(reason, data) => {
              upsertJob(jobForModal.id, jobForModal.customerId, (j) => ({ ...j, status: "Closed", closeReason: reason, estimate: data?.estimate ?? j.estimate, techNotes: data?.techNotes ?? j.techNotes }));
              setJobForModal(null);
            }}
          />
        )}
      </div>
    </>
  );
}

/* ───────────────── Top Header (shared for all roles) ───────────────── */
function TopHeader({ role, adminSection, receptionSection, technicianSection, setRole }) {
  function getTitle() {
    if (role === "admin") {
      return adminSection === "dashboard" ? "Dashboard Overview" :
             adminSection === "users" ? "User Management" :
             adminSection === "workorders" ? "Work Orders" :
             adminSection === "inventory" ? "Inventory Management" : "Management";
    }
    if (role === "receptionist") {
      return receptionSection === "dashboard" ? "Dashboard Overview" :
             receptionSection === "customers" ? "Customers" :
             receptionSection === "registered" ? "Registered Devices" :
             receptionSection === "ready" ? "Ready to Deliver" :
             "Completed Tasks";
    }
    // technician
    return technicianSection === "dashboard" ? "Dashboard Overview" :
           technicianSection === "registered" ? "Registered Devices" :
           "Completed Tasks";
  }

  const subtitle = role === "admin"
    ? "Welcome back, Admin"
    : role === "receptionist"
      ? "Reception Panel"
      : "Technician Panel";

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{getTitle()}</h2>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-lg font-semibold text-gray-800">{new Date().toLocaleDateString('en-IN')}</p>
          </div>
          <div className="flex items-center rounded-xl border bg-white p-1 shadow-sm">
            <RoleButton label="Admin" active={role === 'admin'} onClick={() => setRole('admin')} />
            <RoleButton label="Reception" active={role === 'receptionist'} onClick={() => setRole('receptionist')} />
            <RoleButton label="Technician" active={role === 'technician'} onClick={() => setRole('technician')} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Root App (Admin Layout + Role Switch) ───────────────── */
export default function App() {
  const [role, setRole] = useState("admin"); // admin | receptionist | technician
  const [adminSection, setAdminSection] = useState("dashboard"); // admin's left sidebar
  const [receptionSection, setReceptionSection] = useState("dashboard");
  const [technicianSection, setTechnicianSection] = useState("dashboard");
  const [customers, setCustomers] = useState(initialCustomers);

  // Derived metrics for Admin (from jobs)
  const jobs = (customers || []).flatMap((c) => c.jobs || []);
  const counts = jobs.reduce(
    (acc, j) => {
      const s = j.status;
      acc.total += 1;
      acc[s] = (acc[s] || 0) + 1;
      if (s === "Completed" && j.delivered) acc.delivered = (acc.delivered || 0) + 1;
      if (s === "Completed" && !j.delivered) acc.ready = (acc.ready || 0) + 1;
      return acc;
    },
    { total: 0, delivered: 0, ready: 0 }
  );

  const adminMetrics = {
    totalCustomers: (customers || []).length,
    monthlyRevenue: 85420,
    inventoryItems: 342,
    activeTechnicians: { active: 8, total: 12 },
    activeReceptionists: 3,
    newOrders: counts["Registered"] || 0,
    totalEstimates: 45,
    customerRefused: counts["Closed"] || 0,
    inProgress: counts["Registered"] || 0,
    readyForDelivery: counts.ready || 0,
    totalDelivered: counts.delivered || 0,
    completedPct: counts.total ? Math.round(((counts["Completed"] || 0) / counts.total) * 100) : 0,
    inProgressPct: counts.total ? Math.round(((counts["Registered"] || 0) / counts.total) * 100) : 0,
    readyPct: counts.total ? Math.round((counts.ready / counts.total) * 100) : 0,
  };

  // Admin sidebar items
  const adminSidebar = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "users", label: "User Management", icon: Users },
    { key: "workorders", label: "Work Orders", icon: ClipboardList },
    { key: "inventory", label: "Inventory", icon: Archive },
    { key: "management", label: "Management", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-auto">
      {/* Sidebar — Role-based */}
      {role === "admin" ? (
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">CRM Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
          </div>
          <nav className="p-4 space-y-2">
            {adminSidebar.map((s) => (
              <SidebarItem
                key={s.key}
                icon={s.icon}
                label={s.label}
                isActive={adminSection === s.key}
                onClick={() => setAdminSection(s.key)}
              />
            ))}
          </nav>
        </div>
      ) : null}

      {/* Main Content Wrapper */}
      <div className={`${role === "admin" ? "flex-1" : ""} flex flex-col w-full`}>
        {/* 🔹 Top Header now shown for ALL roles */}
        <TopHeader
          role={role}
          adminSection={adminSection}
          receptionSection={receptionSection}
          technicianSection={technicianSection}
          setRole={setRole}
        />

        {/* Body area below header */}
        <div className="flex flex-1">
          {/* Admin main */}
          <div className={`${role === "admin" ? "flex-1 overflow-auto" : "hidden"}`}>
            {adminSection === "dashboard" && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  <StatCard icon={Users} title="Total Customers" value={adminMetrics.totalCustomers.toLocaleString()} color="blue" />
                  <StatCard icon={DollarSign} title="This Month Revenue" value={`₹${adminMetrics.monthlyRevenue.toLocaleString()}`} color="green" />
                  <StatCard icon={Package} title="Inventory Items" value={adminMetrics.inventoryItems} color="purple" />
                  <StatCard icon={UserCheck} title="Active Technicians" value={`${adminMetrics.activeTechnicians.active}/${adminMetrics.activeTechnicians.total}`} subtitle="Currently working" color="indigo" />
                  <StatCard icon={Headphones} title="Active Receptionists" value={adminMetrics.activeReceptionists} color="blue" />
                  <StatCard icon={ShoppingCart} title="New Orders" value={adminMetrics.newOrders} color="green" />
                  <StatCard icon={FileText} title="Total Estimates" value={adminMetrics.totalEstimates} color="purple" />
                  <StatCard icon={XCircle} title="Customer Refused" value={adminMetrics.customerRefused} color="red" />
                  <StatCard icon={Clock} title="In Progress Projects" value={adminMetrics.inProgress} color="orange" />
                  <StatCard icon={CheckCircle} title="Ready for Delivery" value={adminMetrics.readyForDelivery} color="green" />
                  <StatCard icon={Truck} title="Total Delivered" value={adminMetrics.totalDelivered} color="blue" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div>
                            <p className="font-medium text-gray-800">Order #ORD-{1000 + item}</p>
                            <p className="text-sm text-gray-500">Customer: Rajesh Kumar</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">New</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Status</h3>
                    <div className="space-y-4">
                      <ProgressRow label="Completed" value={adminMetrics.completedPct} color="bg-green-500" />
                      <ProgressRow label="In Progress" value={adminMetrics.inProgressPct} color="bg-orange-500" />
                      <ProgressRow label="Ready" value={adminMetrics.readyPct} color="bg-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminSection !== "dashboard" && (
              <div className="p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="mb-4">
                    {adminSection === 'users' && <Users size={48} className="mx-auto text-gray-400" />}
                    {adminSection === 'workorders' && <ClipboardList size={48} className="mx-auto text-gray-400" />}
                    {adminSection === 'inventory' && <Archive size={48} className="mx-auto text-gray-400" />}
                    {adminSection === 'management' && <Settings size={48} className="mx-auto text-gray-400" />}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {adminSection === 'users' ? 'User Management' :
                    adminSection === 'workorders' ? 'Work Orders' :
                    adminSection === 'inventory' ? 'Inventory Management' : 'Management Settings'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    This section is ready for development. The layout and navigation are complete.
                  </p>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Get Started
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reception full layout (sidebar + main) */}
          {role === "receptionist" && (
            <div className="flex w-full">
              <ReceptionContent
                active={receptionSection}
                setActive={setReceptionSection}
                customers={customers}
                setCustomers={setCustomers}
              />
            </div>
          )}

          {/* Technician full layout (sidebar + main) */}
          {role === "technician" && (
            <div className="flex w-full">
              <TechnicianContent
                active={technicianSection}
                setActive={setTechnicianSection}
                customers={customers}
                setCustomers={setCustomers}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating role switch still available */}
      <div className="fixed top-3 right-3 z-40">
        <div className="flex items-center rounded-xl border bg-white p-1 shadow-sm">
          <RoleButton label="Admin" active={role === 'admin'} onClick={() => setRole('admin')} />
          <RoleButton label="Reception" active={role === 'receptionist'} onClick={() => setRole('receptionist')} />
          <RoleButton label="Technician" active={role === 'technician'} onClick={() => setRole('technician')} />
        </div>
      </div>
    </div>
  );
}

function RoleButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
    >
      {label}
    </button>
  );
}
