"use client";
import { TERM } from "../lib/theme";
import { ArrowLeft, Terminal, Crown } from "lucide-react";

export function VpnScreen({ onBack, active, onToggle, provider, setProvider }) {
  return (
    <div className="h-full flex flex-col" style={{ background: TERM.bg, color: TERM.text, fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>
      <div className="flex items-center" style={{ gap: 10, padding: "40px 18px 16px", borderBottom: `1px solid ${TERM.greenDim}` }}>
        <button onClick={onBack} style={{ border: "none", background: "none", padding: 4 }}>
          <ArrowLeft size={18} color={TERM.green} />
        </button>
        <Terminal size={16} color={TERM.green} />
        <span className="text-sm" style={{ letterSpacing: 1 }}>widowblue@vpn:~$</span>
      </div>

      <div className="flex-1" style={{ overflowY: "auto", padding: 18 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <div>
            <p className="text-sm" style={{ color: TERM.green, fontWeight: 600 }}>{active ? "CONNESSO" : "NON CONNESSO"}</p>
            <p className="text-xs" style={{ color: TERM.text, opacity: 0.7, marginTop: 2 }}>
              {active ? `via profilo "${provider === "secure" ? "massima sicurezza" : "massima privacy"}"` : "tocca l'interruttore per attivare"}
            </p>
          </div>
          <button onClick={onToggle} style={{ width: 52, height: 30, borderRadius: 999, background: active ? TERM.green : TERM.greenDim, border: "none", position: "relative", padding: 0, flexShrink: 0 }}>
            <span style={{ position: "absolute", top: 3, left: active ? 25 : 3, width: 24, height: 24, borderRadius: 999, background: TERM.bg }} />
          </button>
        </div>

        <div style={{ border: `1px solid ${TERM.greenDim}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <p className="text-xs" style={{ opacity: 0.7, marginBottom: 10 }}>&gt; profilo di connessione</p>
          {[
            { id: "secure", label: "Massima sicurezza", detail: "predefinito · audit indipendente, no-log verificato" },
            { id: "private", label: "Massima privacy", detail: "instradamento multi-hop, nessuna traccia sul dispositivo" },
          ].map((opt) => (
            <button key={opt.id} onClick={() => setProvider(opt.id)} className="w-full flex items-center" style={{ gap: 10, padding: "10px 4px", background: "none", border: "none", textAlign: "left" }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: provider === opt.id ? TERM.green : TERM.greenDim, flexShrink: 0 }} />
              <span className="text-sm" style={{ flex: 1 }}>
                {opt.label}
                <br />
                <span className="text-xs" style={{ opacity: 0.6 }}>{opt.detail}</span>
              </span>
            </button>
          ))}
        </div>

        <div style={{ border: `1px solid ${TERM.green}`, borderRadius: 10, padding: 14 }}>
          <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
            <Crown size={14} color={TERM.green} />
            <span className="text-sm" style={{ fontWeight: 600 }}>VPN Premium</span>
          </div>
          <p className="text-xs" style={{ opacity: 0.8, lineHeight: 1.7, marginBottom: 10 }}>
            &gt; scelta manuale del provider (server audit indipendente)<br />
            &gt; nodi mesh privati illimitati, non solo cluster da 5<br />
            &gt; IP dedicato per le chat riservate<br />
            &gt; nessun limite sul routing multi-hop
          </p>
          <button style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${TERM.green}`, background: "none", color: TERM.green, fontSize: 12, fontWeight: 600 }}>
            SCOPRI PREMIUM →
          </button>
        </div>

        <p className="text-xs" style={{ opacity: 0.5, marginTop: 16, lineHeight: 1.6 }}>
          Il tema terminale si applica solo qui; il resto dell&apos;app resta nel tema scelto. Anteprima — provider e prezzi da confermare in fase di partnership.
        </p>
      </div>
    </div>
  );
}
