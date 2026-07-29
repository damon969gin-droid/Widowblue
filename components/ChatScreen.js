"use client";
import { COLORS, BACKGROUNDS, CHAT_FONTS } from "../lib/theme";
import { WebMesh, MessageBubble } from "./Shared";
import { ArrowLeft, Users, Globe, Bot, Palette, Paperclip, Smile, Mic, Send } from "lucide-react";

export function ChatScreen({
  contact, messages, draft, setDraft, onSend, onBack, onOpenModal,
  bgTheme, onOpenBgPicker, scrollRef, chatFont,
}) {
  const bg = BACKGROUNDS.find((b) => b.id === bgTheme) || BACKGROUNDS[0];
  const fontFamily = (CHAT_FONTS.find((f) => f.id === chatFont) || CHAT_FONTS[0]).family;
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center" style={{ gap: 8, padding: "40px 10px 12px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.panel }}>
        <button onClick={onBack} className="active:opacity-60" style={{ padding: 6, borderRadius: 999, border: "none", background: "none" }}>
          <ArrowLeft size={18} color={COLORS.textPrimary} />
        </button>
        <div className="flex items-center justify-center font-semibold text-xs shrink-0" style={{ width: 36, height: 36, borderRadius: 999, background: contact.color + "2a", color: contact.color }}>
          {contact.group ? <Users size={15} /> : contact.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{contact.name}</p>
          <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>{contact.statusLabel}</p>
        </div>
        <button onClick={() => onOpenModal("web")} className="active:opacity-60" style={{ padding: 6, borderRadius: 999, border: "none", background: "none" }}>
          <Globe size={17} color={COLORS.textMuted} />
        </button>
        <button onClick={() => onOpenModal("ai")} className="active:opacity-60" style={{ padding: 6, borderRadius: 999, border: "none", background: "none" }}>
          <Bot size={17} color={COLORS.textMuted} />
        </button>
        <button onClick={onOpenBgPicker} className="active:opacity-60" style={{ padding: 6, borderRadius: 999, border: "none", background: "none" }}>
          <Palette size={17} color={COLORS.textMuted} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 relative" style={{ ...bg.style, overflowY: "auto", padding: 16 }}>
        {bgTheme === "mesh" && (
          <div className="absolute pointer-events-none flex items-center justify-center" style={{ inset: 0 }}>
            <WebMesh size={240} opacity={0.1} />
          </div>
        )}
        <div className="relative flex flex-col" style={{ gap: 8 }}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} fontFamily={fontFamily} />
          ))}
        </div>
      </div>

      <div className="flex items-center" style={{ gap: 6, padding: 10, borderTop: `1px solid ${COLORS.border}`, background: COLORS.panel }}>
        <button onClick={() => onOpenModal("attach")} className="active:opacity-60" style={{ padding: 8, borderRadius: 999, border: "none", background: "none" }}>
          <Paperclip size={18} color={COLORS.textMuted} />
        </button>
        <div className="flex-1 flex items-center" style={{ gap: 6, padding: "8px 12px", borderRadius: 999, background: COLORS.panel2 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Scrivi un messaggio..."
            className="flex-1 text-sm"
            style={{ background: "transparent", outline: "none", border: "none", color: COLORS.textPrimary }}
          />
          <button onClick={() => onOpenModal("emoji")} style={{ border: "none", background: "none", padding: 0, display: "flex" }}>
            <Smile size={17} color={COLORS.textMuted} />
          </button>
        </div>
        {draft.trim() ? (
          <button onClick={onSend} className="active:opacity-70" style={{ padding: 10, borderRadius: 999, border: "none", background: COLORS.blue }}>
            <Send size={16} color="#fff" />
          </button>
        ) : (
          <button onClick={() => onOpenModal("mic")} className="active:opacity-60" style={{ padding: 10, borderRadius: 999, border: "none", background: "none" }}>
            <Mic size={18} color={COLORS.textMuted} />
          </button>
        )}
      </div>
    </div>
  );
}
