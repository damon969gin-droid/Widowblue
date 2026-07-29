"use client";
import { COLORS } from "../lib/theme";
import { ArrowLeft, ExternalLink } from "lucide-react";

export function ProfileScreen({ onBack, portfolioUrl, setPortfolioUrl, portfolioPublic, setPortfolioPublic }) {
  return (
    <div className="h-full flex flex-col" style={{ padding: "48px 24px 24px" }}>
      <div className="flex items-center" style={{ gap: 10, marginBottom: 24 }}>
        <button onClick={onBack} style={{ border: "none", background: "none", padding: 4 }}>
          <ArrowLeft size={18} color={COLORS.textPrimary} />
        </button>
        <p className="text-sm font-semibold">Il tuo profilo</p>
      </div>

      <div className="flex flex-col items-center" style={{ marginBottom: 28 }}>
        <div className="flex items-center justify-center font-semibold" style={{ width: 64, height: 64, borderRadius: 999, background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.violet})`, color: "#fff", fontSize: 20 }}>
          TU
        </div>
      </div>

      <p className="text-xs font-medium" style={{ color: COLORS.textMuted, marginBottom: 8 }}>Portfolio</p>
      <div className="flex items-center" style={{ gap: 10, padding: "12px 14px", borderRadius: 14, background: COLORS.panel2, border: `1px solid ${COLORS.border}`, marginBottom: 10 }}>
        <ExternalLink size={16} color={COLORS.textMuted} />
        <input
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
          placeholder="Link Framer, Figma o altro..."
          className="flex-1 text-sm"
          style={{ background: "transparent", outline: "none", border: "none", color: COLORS.textPrimary }}
        />
      </div>

      <button
        onClick={() => setPortfolioPublic((v) => !v)}
        className="w-full flex items-center justify-between active:opacity-80"
        style={{ padding: 14, borderRadius: 14, background: COLORS.panel2, border: `1px solid ${COLORS.border}`, marginBottom: 16 }}
      >
        <div style={{ textAlign: "left" }}>
          <p className="text-sm font-medium">{portfolioPublic ? "Pubblico" : "Privato"}</p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>{portfolioPublic ? "Chiunque abbia il link può vederlo" : "Visibile solo a chi autorizzi tu"}</p>
        </div>
        <div style={{ width: 40, height: 24, borderRadius: 999, background: portfolioPublic ? COLORS.blue : COLORS.border, position: "relative", flexShrink: 0 }}>
          <span style={{ position: "absolute", top: 2, left: portfolioPublic ? 18 : 2, width: 20, height: 20, borderRadius: 999, background: "#fff" }} />
        </div>
      </button>

      {portfolioUrl.trim() && (
        <div style={{ padding: 14, borderRadius: 14, border: `1px dashed ${COLORS.border}` }}>
          <p className="text-xs" style={{ color: COLORS.textMuted, marginBottom: 4 }}>Anteprima card</p>
          <div className="flex items-center" style={{ gap: 10 }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.blue + "22" }}>
              <ExternalLink size={14} color={COLORS.blue} />
            </div>
            <span className="text-xs truncate" style={{ color: COLORS.textPrimary }}>{portfolioUrl}</span>
          </div>
        </div>
      )}

      <p className="text-xs" style={{ color: COLORS.textMuted, marginTop: 16, lineHeight: 1.5 }}>
        Il portfolio creato con Framer, Figma o codice proprio compare qui come card cliccabile — su questo link, non ospitato dentro l&apos;app.
      </p>
    </div>
  );
}
