import {
  BedDouble,
  BellRing,
  CalendarCheck2,
  ChevronRight,
  ConciergeBell,
  DoorOpen,
  LayoutDashboard,
  LineChart,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Utensils,
  WalletCards,
} from "lucide-react";
import { motion } from "framer-motion";

import "./TenetOsPompeii.css";

const suites = [
  {
    icon: LayoutDashboard,
    title: "One Command Center",
    text: "Reservations, rooms, housekeeping, staff, guest messages, revenue and reporting in one calm operating layer.",
  },
  {
    icon: ConciergeBell,
    title: "Guest Journey OS",
    text: "From booking to checkout, TENET OS keeps every request, upgrade, preference and task moving without handoffs disappearing.",
  },
  {
    icon: LineChart,
    title: "Revenue Intelligence",
    text: "See occupancy, channel mix, package performance and daily actions with dashboards built for fast hotel decisions.",
  },
];

const operations = [
  { icon: BedDouble, label: "Rooms", value: "124", tone: "terra" },
  { icon: DoorOpen, label: "Arrivals", value: "38", tone: "ivory" },
  { icon: BellRing, label: "Requests", value: "17", tone: "green" },
  { icon: WalletCards, label: "Revenue", value: "+14%", tone: "wine" },
];

const timeline = [
  "Booking syncs with channels and direct reservations",
  "Front desk receives a clean arrival plan",
  "Housekeeping sees room turns in real time",
  "Managers monitor revenue and service quality",
];

const modules = [
  "PMS",
  "POS",
  "Housekeeping",
  "CRM",
  "Payments",
  "Concierge",
  "Inventory",
  "Analytics",
];

function TenetOsPompeii() {
  return (
    <main className="tenet-site">
      <div className="fresco-grain" aria-hidden="true" />
      <nav className="tenet-nav" aria-label="Main navigation">
        <a className="brand-mark" href="#top" aria-label="TENET OS home">
          <span>T</span>
          TENET OS
        </a>
        <div className="nav-links" aria-label="Sections">
          <a href="#platform">Platform</a>
          <a href="#operations">Operations</a>
          <a href="#modules">Modules</a>
        </div>
        <a className="nav-action" href="#demo">
          Request demo
          <ChevronRight size={17} strokeWidth={2.4} />
        </a>
      </nav>

      <section className="hero-shell" id="top">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="eyebrow">
            <Sparkles size={16} />
            Pompeii-inspired hotel operating system
          </div>
          <h1>TENET OS</h1>
          <p className="hero-lede">
            An all-in-one hotel command center for properties that want the
            grace of a grand house and the precision of modern operations.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#demo">
              See the suite
              <ChevronRight size={18} />
            </a>
            <a className="secondary-action" href="#platform">
              Explore platform
            </a>
          </div>
        </motion.div>

        <motion.div
          className="pompeii-panel"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.75, ease: "easeOut" }}
          aria-label="TENET OS hotel dashboard preview"
        >
          <div className="fresco-arch">
            <div className="sun-medallion">
              <CalendarCheck2 size={30} />
            </div>
            <div className="dashboard-slab">
              <div>
                <span>Tonight</span>
                <strong>92% Occupancy</strong>
              </div>
              <div className="slab-bars" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="mosaic-row" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
          </div>
          <div className="panel-metrics">
            {operations.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  className={`metric-tile ${item.tone}`}
                  key={item.label}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                >
                  <Icon size={21} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="platform-band" id="platform">
        <div className="section-heading">
          <p>Built for the whole property</p>
          <h2>Hotel work finally lives in one place.</h2>
        </div>
        <div className="suite-grid">
          {suites.map((suite, index) => {
            const Icon = suite.icon;
            return (
              <motion.article
                className="suite-card"
                key={suite.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.08, duration: 0.55 }}
              >
                <Icon size={28} />
                <h3>{suite.title}</h3>
                <p>{suite.text}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="operations-band" id="operations">
        <div className="operations-copy">
          <p>Live operations</p>
          <h2>Front desk, back office and guest service move together.</h2>
          <div className="timeline">
            {timeline.map((item, index) => (
              <motion.div
                className="timeline-item"
                key={item}
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="service-board" aria-label="Hotel service board">
          <div className="board-top">
            <MessageSquareText size={22} />
            <span>Guest requests</span>
          </div>
          <div className="request-row priority">
            <Utensils size={18} />
            <div>
              <strong>Suite 204</strong>
              <span>Private dining setup at 20:00</span>
            </div>
            <b>Live</b>
          </div>
          <div className="request-row">
            <ShieldCheck size={18} />
            <div>
              <strong>Lobby</strong>
              <span>Night audit checklist complete</span>
            </div>
            <b>Done</b>
          </div>
          <div className="request-row">
            <Sparkles size={18} />
            <div>
              <strong>Room 118</strong>
              <span>Turnover assigned to housekeeping</span>
            </div>
            <b>12m</b>
          </div>
        </div>
      </section>

      <section className="modules-band" id="modules">
        <div className="section-heading">
          <p>All-in-one suite</p>
          <h2>Every module feels carved from the same stone.</h2>
        </div>
        <div className="module-wall">
          {modules.map((module, index) => (
            <motion.span
              key={module}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04, duration: 0.35 }}
            >
              {module}
            </motion.span>
          ))}
        </div>
      </section>

      <section className="demo-band" id="demo">
        <div>
          <p>For hotels, resorts and serviced apartments</p>
          <h2>Run the property from one beautiful operating system.</h2>
        </div>
        <a className="primary-action" href="mailto:hello@tenetos.com">
          Book a demo
          <ChevronRight size={18} />
        </a>
      </section>
    </main>
  );
}

export default TenetOsPompeii;
