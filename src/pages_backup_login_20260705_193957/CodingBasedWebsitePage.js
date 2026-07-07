import React from "react";
import { Check, Code2, GitBranch, ShieldCheck, FileText, ClipboardList, Coins, RefreshCw, UserCircle2, Users, MonitorSmartphone, Workflow, LaptopMinimal, LockKeyhole, Rocket, ArrowRight, Building2, Globe2, MessageSquare, CalendarClock, Sparkles, Layers3, Handshake, FolderGit2 } from "lucide-react";
import { motion } from "framer-motion";

// Single-file React component. TailwindCSS required in your project.
// Usage: import CodingBasedWebsitePage from "./CodingBasedWebsitePage"; <CodingBasedWebsitePage />

const Section = ({ id, title, subtitle, children, bg = "plain" }) => (
  <section
    id={id}
    className={
      "py-12 md:py-16 " +
      (bg === "white"
        ? "bg-white"
        : bg === "gray"
        ? "bg-gray-50"
        : bg === "tint"
        ? "bg-gradient-to-b from-blue-50 to-cyan-50"
        : "bg-transparent")
    }
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <span className="inline-flex h-6 w-1.5 rounded-full bg-gradient-to-b from-cyan-500 to-blue-600" aria-hidden="true" />
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-gray-600 max-w-3xl">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  </section>
);

const Stat = ({ icon: Icon, label, value }) => (
  <div className="bg-white/70 backdrop-blur rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-gray-100">
        <Icon className="w-5 h-5 text-blue-700" />
      </div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-xl md:text-2xl font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  </div>
);

const Pill = ({ children }) => (
  <span className="inline-flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
    <Check className="w-4 h-4 text-green-600" /> {children}
  </span>
);

const ListItem = ({ icon: Icon, title, children }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 mt-1">
      <Icon className="w-5 h-5 text-blue-700" />
    </div>
    <div>
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-gray-600 text-sm md:text-[15px] leading-relaxed">{children}</p>
    </div>
  </div>
);

export default function CodingBasedWebsitePage() {
  return (
    <div className="bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(45rem_20rem_at_50%_-10%,rgba(59,130,246,0.1),transparent)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-16 pb-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900"
              >
                100% Coding‑Based Websites — Built For Full Control
              </motion.h1>
              <p className="mt-4 text-gray-600 md:text-lg max-w-2xl">
                No page builders. No lock‑ins. We craft custom websites purely with code so you own the
                complete codebase, enjoy faster performance, cleaner SEO, and truly bespoke design.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Pill>Full code handover</Pill>
                <Pill>Lifetime portability</Pill>
                <Pill>High performance</Pill>
                <Pill>SEO‑friendly structure</Pill>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat icon={Code2} label="Stack" value="Pure Code" />
              <Stat icon={ShieldCheck} label="Ownership" value="100% Yours" />
              <Stat icon={Rocket} label="Performance" value=" 90 Lighthouse" />
              <Stat icon={GitBranch} label="Versioning" value="Git-Ready" />
            </div>
          </div>
        </div>
      </header>

      {/* What is Coding-Based Website */}
      <Section id="overview" bg="white"
        title="Coding‑Based Websites: Overview"
        subtitle="Understand what a 100% coding‑based website is, how it compares, and the key benefits."
      >
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">What is a 100% Coding‑Based Website?</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <ListItem icon={Layers3} title="Custom architecture">
            Structured exactly to your business flows and content, not squeezed into a generic template.
          </ListItem>
          <ListItem icon={LockKeyhole} title="No vendor lock‑in">
            Move your code anywhere, deploy on any hosting, and collaborate with any developer in the future.
          </ListItem>
          <ListItem icon={Sparkles} title="Pixel‑perfect UI">
            Designs implemented to spec without the constraints imposed by page‑builders.
          </ListItem>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">Comparison: Coding‑Based vs CMS/No‑Code</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="p-3 md:p-4 font-semibold">Dimension</th>
                <th className="p-3 md:p-4 font-semibold">100% Coding‑Based</th>
                <th className="p-3 md:p-4 font-semibold">Typical CMS/No‑Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                {
                  k: "Ownership",
                  a: "Full source code handed over; portable & auditable.",
                  b: "Theme license & plugins; partial control, updates may break.",
                },
                {
                  k: "Performance",
                  a: "Lean assets, minimal bloat; Core Web Vitals friendly.",
                  b: "Extra scripts/styles; slower TTFB & CLS risk.",
                },
                { k: "Security", a: "Smaller attack surface.", b: "Plugin ecosystem increases vectors." },
                { k: "Scalability", a: "Scales with your architecture.", b: "Template constraints limit growth." },
                { k: "SEO", a: "Clean semantic markup.", b: "Mixed quality HTML from builders." },
                { k: "Design", a: "Truly bespoke components.", b: "Template look‑alikes are common." },
                { k: "Cost over time", a: "No theme fees; maintain only what you need.", b: "Ongoing theme/plugin renewals." },
              ].map((row) => (
                <tr key={row.k} className="align-top">
                  <td className="p-3 md:p-4 font-medium text-gray-900">{row.k}</td>
                  <td className="p-3 md:p-4 text-gray-700">{row.a}</td>
                  <td className="p-3 md:p-4 text-gray-700">{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">Benefits of Coding‑Based Websites</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ListItem icon={Rocket} title="Speed & Lighthouse scores">
            Optimized bundles, no unnecessary plugins or render‑blocking assets.
          </ListItem>
          <ListItem icon={Globe2} title="SEO foundation">
            Semantic HTML, accessible components, predictable crawls, and clean sitemaps.
          </ListItem>
          <ListItem icon={ShieldCheck} title="Security">
            Smaller dependency surface reduces risks; updates are intentional and reviewed.
          </ListItem>
          <ListItem icon={Workflow} title="Extensibility">
            Add features as your business grows without fighting theme limits.
          </ListItem>
          <ListItem icon={FolderGit2} title="Version control">
            Delivered with a Git‑ready structure so you can branch, review, and roll back.
          </ListItem>
          <ListItem icon={MonitorSmartphone} title="Responsive by design">
            Component‑first approach ensures consistent behavior across devices.
          </ListItem>
        </div>
      </Section>

      {/* Comparison */}
      

      {/* Benefits */}
      

      {/* Ownership & Control */}
      <Section id="ownership-portal" bg="gray" title="Ownership, Control & Client Portal" subtitle="Keep full control of your assets and stay connected through your exclusive portal.">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Ownership & Control</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">Full Code Handover</h4>
            <p className="text-gray-600 text-sm md:text-[15px]">
              We provide the entire project repository, environment instructions, and deployment notes so you can
              archive, migrate, or collaborate with any developer in the future.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>Source + Assets</Pill>
              <Pill>Env & Build Docs</Pill>
              <Pill>Deployment notes</Pill>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">You keep full control — not the developer</h4>
            <p className="text-gray-600 text-sm md:text-[15px]">
              Hosting, domains, and repos stay under your accounts. Developers are collaborators, not custodians.
              Access can be granted or revoked anytime from your side.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>Client‑owned hosting</Pill>
              <Pill>Admin‑level access</Pill>
              <Pill>Transparent governance</Pill>
            </div>
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">Customer Exclusive Portal</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={UserCircle2} title="Full Access">
              View milestones, approve designs, upload website content, and request changes.
            </ListItem>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
              <Pill>Progress tracking</Pill>
              <Pill>Files & assets</Pill>
              <Pill>Discussion threads</Pill>
              <Pill>Approvals & sign‑offs</Pill>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={MessageSquare} title="Always Connected">
              Message your developer, schedule meetings, and receive notifications — all inside one portal.
            </ListItem>
          </div>
        </div>
      </Section>

      {/* Exclusive Solution Process */}
      <Section id="process" bg="tint" title="Process & Engagement" subtitle="From discovery and prototype to documentation, quotation, payments, development, and a final exclusive launch.">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Exclusive, Customer‑First Solution</h3>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="space-y-5">
              <ListItem icon={Users} title="Discovery">
                We discuss your goals, audience, and must‑have features to map the scope.
              </ListItem>
              <ListItem icon={LaptopMinimal} title="Prototype as Demo">
                You receive a clickable prototype to validate flows and UI before development.
              </ListItem>
              <ListItem icon={CalendarClock} title="Flexible Meetings">
                Choose a personal visit by our agent or an online Google Meet session.
              </ListItem>
              <ListItem icon={MessageSquare} title="Client Portal Access">
                Track progress, share content, and chat with the team in one place.
              </ListItem>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ol className="relative border-s-2 border-dashed border-blue-200 ps-5 space-y-6">
              {[
                { t: "Requirement Intake", d: "We gather detailed inputs and confirm objectives.", I: ClipboardList },
                { t: "Prototype Delivery", d: "You review and comment on your demo.", I: MonitorSmartphone },
                { t: "Portal Onboarding", d: "Get credentials to your private project portal.", I: UserCircle2 },
                { t: "Approval to Build", d: "Once happy, we proceed to implementation.", I: Handshake },
              ].map(({ t, d, I }, idx) => (
                <li key={t} className="ms-2">
                  <div className="absolute -start-[9px] bg-white border-2 border-blue-300 w-4 h-4 rounded-full mt-1.5" />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-100">
                      <I className="w-5 h-5 text-cyan-700" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t}</h4>
                      <p className="text-gray-600 text-sm md:text-[15px]">{d}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">Work Documentation</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={FileText} title="Requirements Document">
              A living document that captures scope, user stories, and acceptance criteria.
            </ListItem>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>• We revise together until you are satisfied with <em>how</em> development should proceed.</p>
              <p>• Finalized documents are the foundation for timelines and costing.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={ClipboardList} title="Sign‑off & Handover">
              Once finalized, we share the document in your portal for easy reference throughout the project.
            </ListItem>
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">Quotation</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={Coins} title="Transparent Pricing">
              Costs correlate to features and estimated effort; no hidden fees.
            </ListItem>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={Building2} title="Approval & Next Steps">
              Approve your quotation in the portal; we then initiate the payment process.
            </ListItem>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={ArrowRight} title="From Quote to Kick‑off">
              With approvals in place, we schedule sprints and start building.
            </ListItem>
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">Easy Installments & Refund Policy</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">Payment Milestones</h4>
            <ul className="space-y-3 text-sm md:text-[15px] text-gray-700">
              <li className="flex items-start gap-2"><Check className="mt-0.5 w-4 h-4 text-green-600" /> 30% advance at agreement — project does not start without this.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 w-4 h-4 text-green-600" /> 30% when 50% development is completed (pay directly inside your portal).</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 w-4 h-4 text-green-600" /> Final payment before deployment (deployment does not proceed without final settlement).</li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={RefreshCw} title="Refund Policy">
              Refer to the <a href="#refund-policy" className="text-blue-700 underline-offset-2 underline">Refund Policy</a> for conditions and timelines.
            </ListItem>
            <div className="mt-3 text-sm text-gray-600">We keep terms simple and documented inside your portal.</div>
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">Developer Assignment</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={LaptopMinimal} title="Single‑threaded Focus">
              Your developer is aligned on your scope and responsible for consistent delivery quality.
            </ListItem>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={ShieldCheck} title="Accountability">
              Tasks are traceable to a single owner with review checkpoints.
            </ListItem>
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">How We Finalize & What Makes It Exclusive</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={Sparkles} title="Tailored to You">
              Every decision — from color palette to component behavior — follows your documented preferences.
            </ListItem>
            <ListItem icon={Code2} title="Unique Codebase">
              Custom components ensure your site does not resemble any other client’s project.
            </ListItem>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <ListItem icon={LockKeyhole} title="Exclusive by Process">
              Our requirement‑first workflow, prototype review, and portal approvals naturally lead to a one‑of‑a‑kind outcome.
            </ListItem>
            <ListItem icon={Rocket} title="Confident Launch">
              We deploy only after you approve the final build against the signed documentation.
            </ListItem>
          </div>
        </div>
      </Section>

      {/* Work Documentation */}
      

      {/* Quotation */}
      

      {/* Installments & Refund */}
      

      {/* Customer Portal */}
      

      {/* Developer Assignment */}
      

      {/* Finalization & Exclusivity */}
      

      {/* Footer CTA */}
      <footer className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-bold">Ready to build your coding‑first website?</h3>
              <p className="text-white/90 mt-1">Book a discovery call — in person or on Google Meet — and get your prototype demo.</p>
            </div>
            <a href="#contact" className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-4 py-2 rounded-xl shadow hover:shadow-md">
              Get Started <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
