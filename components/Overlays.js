"use client";
import { COLORS, BACKGROUNDS, CHAT_FONTS } from "../lib/theme";
import { X, Check, Globe, Bot, Paperclip, Mic, Smile } from "lucide-react";

export function BgPicker({ current, onPick, onClose, currentFont, onPickFont }) {
  return (
    <div className="absolute flex items-end" style={{ inset: 0, background: "#00000099", zIndex: 30 }} onClick={onClose}>
      <div style={{ width: "100%", borderRadius: "24px 24px 0 0", padding: 20, background: COLORS.panel }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <p className="text-sm font-semibold">Personalizza chat</p>
          <button onClick={onClose} style={{ border: "none", background: "none" }}>
            <X size={18} color={COLORS.textMuted} />
          </button>
        </div>

        <p className="text-xs font-medium" style={{ color: COLORS.textMuted, marginBottom: 8 }}>Sfondo</p>
        <div className="flex" style={{ gap: 12, marginBottom: 20 }}>
          {BACKGROUNDS.map((b) => (
            <button key={b.id} onClick={() => onPick(b.id)} className="flex-1 flex flex-col items-center" style={{ gap: 6, border: "none", background: "none" }}>
              <div style={{ ...b.style, width: "100%", height: 56, borderRadius: 12, border: current === b.id ? `2px solid ${COLORS.blue}` : `1px solid ${COLORS.border}` }} />
              <span className="text-xs" style={{ color: COLORS.textMuted }}>{b.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>Carattere testo</p>
          <span className="text-xs" style={{ color: COLORS.textMuted, opacity: 0.7 }}>gratuiti, estendibili</span>
        </div>
        <div className="flex flex-col" style={{ gap: 8 }}>
          {CHAT_FONTS.map((f) => {
            const active = currentFont === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onPickFont(f.id)}
                className="w-full flex items-center justify-between active:opacity-80"
                style={{ padding: "10px 14px", borderRadius: 12, background: COLORS.panel2, border: `1px solid ${active ? COLORS.blue : COLORS.border}`, textAlign: "left" }}
              >
                <span className="text-sm" style={{ fontFamily: f.family, color: COLORS.textPrimary }}>Ciao! Così apparirà il testo — {f.label}</span>
                {active && <Check size={14} color={COLORS.blue} style={{ flexShrink: 0, marginLeft: 8 }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const MODAL_CONTENT = {
  web: { icon: Globe, title: "Naviga sul web", body: "Apri un browser integrato senza uscire dalla chat, per condividere subito quello che trovi." },
  ai: { icon: Bot, title: "Collega un'AI", body: "Collega l'assistente AI che preferisci alla conversazione, per riassumere, tradurre o rispondere al posto tuo." },
  attach: { icon: Paperclip, title: "Allega file", body: "Allega foto, video, audio e documenti dal dispositivo o dallo spazio cloud collegato." },
  mic: { icon: Mic, title: "Messaggio vocale", body: "Tieni premuto per registrare un vocale, come su WhatsApp — rilasciando lo invii, scorrendo lo annulli." },
  emoji: { icon: Smile, title: "Emoji, sticker e GIF", body: "Libreria di emoji, sticker e GIF, con la possibilità di aggiungere pacchetti extra dalle impostazioni." },
};

export function InfoModal({ type, onClose }) {
  const content = MODAL_CONTENT[type];
  const Icon = content.icon;
  return (
    <div className="absolute flex items-center justify-center" style={{ inset: 0, background: "#00000099", zIndex: 30, padding: 24 }} onClick={onClose}>
      <div style={{ width: "100%", borderRadius: 18, padding: 20, background: COLORS.panel }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 999, background: COLORS.blue + "22", marginBottom: 12 }}>
          <Icon size={18} color={COLORS.blue} />
        </div>
        <p className="text-sm font-semibold" style={{ marginBottom: 6 }}>{content.title}</p>
        <p className="text-xs" style={{ color: COLORS.textMuted, lineHeight: 1.5, marginBottom: 16 }}>{content.body}</p>
        <button onClick={onClose} className="w-full text-sm font-medium" style={{ padding: 10, borderRadius: 12, border: "none", background: COLORS.blue, color: "#fff" }}>
          Capito
        </button>
      </div>
    </div>
  );
}
