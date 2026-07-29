"use client";
import { COLORS } from "../lib/theme";
import { CONTACTS } from "../lib/mockData";
import { Logo } from "./Shared";
import { Shield, Search, Bluetooth, Users, Wifi, Signal, Info } from "lucide-react";

const NET_META = {
  mesh: { icon: Bluetooth, label: "Mesh", detail: "Nodo mesh · 4/5 utenti connessi · condivisione attiva" },
  wifi: { icon: Wifi, label: "Wi-Fi", detail: "IP nodo 10.42.7.113 · univoco per questa sessione" },
  "5g": { icon: Signal, label: "5G", detail: "Connessione diretta operatore" },
};

export { NET_META };

export function HomeScreen({
  onOpenChat, onOpenVpn, onOpenProfile,
  steps, stepGoal, earnedEuro, fmtEuro,
  showTokenInfo, setShowTokenInfo,
  network, setNetwork,
  messages,
  contactsOverride,
  connectionStatus,
}) {
  const contactsList = contactsOverride || CONTACTS;
  const pct = Math.min(100, Math.round((steps / stepGoal) * 100));
  const statusMeta = {
    checking: { label: "Verifica...", color: COLORS.textMuted },
    online: { label: "Connesso", color: COLORS.online },
    demo: { label: "Modalità demo", color: "#F2B84C" },
  }[connectionStatus] || { label: "Modalità demo", color: "#F2B84C" };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between" style={{ padding: "40px 20px 12px" }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <Logo size={24} />
          <span
            className="text-xs"
            style={{ color: statusMeta.color, background: statusMeta.color + "1a", padding: "2px 8px", borderRadius: 999, fontWeight: 500 }}
          >
            {statusMeta.label}
          </span>
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          <button onClick={onOpenVpn} className="flex items-center justify-center active:opacity-70" style={{ width: 32, height: 32, borderRadius: 999, background: COLORS.panel2, border: "none" }} title="VPN">
            <Shield size={15} color={COLORS.textMuted} />
          </button>
          <button onClick={onOpenProfile} className="flex items-center justify-center font-semibold text-xs active:opacity-70" style={{ width: 32, height: 32, borderRadius: 999, background: COLORS.panel2, color: COLORS.textMuted, border: "none" }}>
            TU
          </button>
        </div>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <div className="flex" style={{ background: COLORS.panel2, borderRadius: 14, padding: 4, gap: 4 }}>
          {["mesh", "wifi", "5g"].map((key) => {
            const meta = NET_META[key];
            const Icon = meta.icon;
            const active = network === key;
            return (
              <button
                key={key}
                onClick={() => setNetwork(key)}
                className="flex-1 flex items-center justify-center text-xs font-medium"
                style={{ gap: 6, padding: "8px 0", borderRadius: 10, background: active ? COLORS.blue : "transparent", color: active ? "#fff" : COLORS.textMuted, border: "none" }}
              >
                <Icon size={13} />
                {meta.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs" style={{ color: COLORS.textMuted, marginTop: 6, paddingLeft: 4 }}>{NET_META[network].detail}</p>
      </div>

      <div style={{ margin: "0 20px 12px", borderRadius: 18, padding: 16, background: COLORS.panel2, border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Passi di oggi</span>
          <button onClick={() => setShowTokenInfo((v) => !v)} className="flex items-center text-xs" style={{ gap: 4, color: COLORS.blue, border: "none", background: "none" }}>
            Cos&apos;è WBLU? <Info size={11} />
          </button>
        </div>
        <div className="flex items-end justify-between" style={{ marginBottom: 8 }}>
          <span className="wb-display font-semibold" style={{ fontSize: 26 }}>{steps.toLocaleString("it-IT")}</span>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>/ {stepGoal.toLocaleString("it-IT")} passi</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, overflow: "hidden", background: COLORS.border, marginBottom: 8 }}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.violet})` }} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: COLORS.online, fontWeight: 600 }}>+{fmtEuro(earnedEuro)} WBLU oggi</span>
          <span style={{ color: COLORS.textMuted }}>≈ €{fmtEuro(earnedEuro)} · max €20/giorno</span>
        </div>
        {showTokenInfo && (
          <p className="text-xs" style={{ color: COLORS.textMuted, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}`, lineHeight: 1.5 }}>
            WBLU è il token di ricompensa dell&apos;app: lo guadagni camminando (fino a 7.000 passi al giorno) e lo spendi in premi, sconti nel marketplace o lo converti in euro.
          </p>
        )}
      </div>

      <div style={{ padding: "0 20px 8px" }}>
        <div className="flex items-center" style={{ gap: 8, padding: "9px 12px", borderRadius: 12, background: COLORS.panel2 }}>
          <Search size={15} color={COLORS.textMuted} />
          <span className="text-xs" style={{ color: COLORS.textMuted }}>Cerca chat o nodi...</span>
        </div>
      </div>

      <div className="flex-1" style={{ overflowY: "auto", padding: "4px 12px 16px" }}>
        {contactsList.map((c) => {
          const lastMsgs = messages[c.id] || [];
          const last = lastMsgs[lastMsgs.length - 1];
          return (
            <button
              key={c.id}
              onClick={() => onOpenChat(c.id)}
              className="w-full flex items-center active:opacity-70"
              style={{ gap: 12, padding: "10px 8px", borderRadius: 14, background: "none", border: "none", textAlign: "left" }}
            >
              <div className="relative shrink-0">
                <div className="flex items-center justify-center font-semibold text-sm" style={{ width: 44, height: 44, borderRadius: 999, background: c.color + "2a", color: c.color }}>
                  {c.group ? <Users size={16} /> : c.initials}
                </div>
                {c.status === "mesh" && (
                  <span className="absolute flex items-center justify-center" style={{ bottom: -2, right: -2, width: 16, height: 16, borderRadius: 999, background: COLORS.void }}>
                    <Bluetooth size={9} color={COLORS.blue} />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{c.name}</span>
                  <span className="text-xs shrink-0" style={{ color: COLORS.textMuted, marginLeft: 8 }}>{last?.time}</span>
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
                  <span className="text-xs truncate" style={{ color: COLORS.textMuted }}>{last?.text}</span>
                  {c.unread > 0 && (
                    <span className="flex items-center justify-center font-semibold shrink-0" style={{ minWidth: 18, height: 18, borderRadius: 999, background: COLORS.blue, color: "#fff", fontSize: 10, padding: "0 5px", marginLeft: 8 }}>
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
