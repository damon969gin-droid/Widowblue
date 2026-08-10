"use client";
import { COLORS } from "../lib/theme";
import { Bluetooth, CheckCheck, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function WebMesh({ size = 260, opacity = 0.5 }) {
  const nodes = [
    [130, 20], [40, 70], [220, 70], [20, 150], [130, 130],
    [240, 150], [60, 220], [200, 220], [130, 240],
  ];
  const edges = [
    [0, 1], [0, 2], [0, 4], [1, 3], [1, 4], [2, 4], [2, 5], [3, 4],
    [3, 6], [4, 5], [4, 6], [4, 7], [5, 7], [6, 8], [7, 8], [4, 8],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 260 260" style={{ opacity }}>
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={COLORS.blue} strokeWidth="1" strokeOpacity="0.35" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 4 ? 5 : 3}
          fill={i === 4 ? COLORS.violet : COLORS.blue}
          className="wb-node"
          style={{ animation: i % 3 === 0 ? `wb-pulse 3s ease-in-out infinite` : "none", animationDelay: `${i * 0.4}s` }}
        />
      ))}
    </svg>
  );
}

export function Logo({ size = 28 }) {
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 40 40">
        <line x1="20" y1="6" x2="20" y2="34" stroke={COLORS.blue} strokeWidth="1.4" strokeOpacity="0.6" />
        <line x1="6" y1="20" x2="34" y2="20" stroke={COLORS.blue} strokeWidth="1.4" strokeOpacity="0.6" />
        <line x1="10" y1="10" x2="30" y2="30" stroke={COLORS.violet} strokeWidth="1.4" strokeOpacity="0.5" />
        <line x1="30" y1="10" x2="10" y2="30" stroke={COLORS.violet} strokeWidth="1.4" strokeOpacity="0.5" />
        <circle cx="20" cy="20" r="5" fill={COLORS.blue} />
        <circle cx="20" cy="6" r="2.2" fill={COLORS.violet} />
        <circle cx="20" cy="34" r="2.2" fill={COLORS.violet} />
        <circle cx="6" cy="20" r="2.2" fill={COLORS.violet} />
        <circle cx="34" cy="20" r="2.2" fill={COLORS.violet} />
      </svg>
      <span className="wb-display font-semibold" style={{ fontSize: size * 0.5, color: COLORS.textPrimary, letterSpacing: "-0.02em" }}>
        widow<span style={{ color: COLORS.blue }}>blue</span>
      </span>
    </div>
  );
}

export function FieldInput({ icon: Icon, placeholder, value, onChange, type = "text", passwordToggle = false }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password" && passwordToggle;
  return (
    <div className="flex items-center" style={{ gap: 10, padding: "12px 14px", borderRadius: 14, background: COLORS.panel2, border: `1px solid ${COLORS.border}` }}>
      <Icon size={16} color={COLORS.textMuted} />
      <input
        type={isPassword ? (show ? "text" : "password") : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-sm"
        style={{ background: "transparent", outline: "none", border: "none", color: COLORS.textPrimary }}
      />
      {isPassword && (
        <button onClick={() => setShow((s) => !s)} style={{ border: "none", background: "none", padding: 6 }} className="active:opacity-70">
          {show ? <EyeOff size={16} color={COLORS.textMuted} /> : <Eye size={16} color={COLORS.textMuted} />}
        </button>
      )}
    </div>
  );
}

export function MessageBubble({ message, fontFamily }) {
  const isMe = message.from === "me";
  return (
    <div className="flex" style={{ justifyContent: isMe ? "flex-end" : "flex-start" }}>
      <div
        className="rounded-2xl"
        style={{
          maxWidth: "75%",
          padding: "8px 14px",
          background: isMe ? `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.violet})` : COLORS.panel2,
          color: isMe ? "#ffffff" : COLORS.textPrimary,
        }}
      >
        {message.name && <p className="text-xs font-semibold" style={{ color: COLORS.violet, marginBottom: 2 }}>{message.name}</p>}
        <p className="text-sm" style={{ lineHeight: 1.4, fontFamily }}>{message.text}</p>
        <div className="flex items-center" style={{ justifyContent: "flex-end", gap: 4, marginTop: 4 }}>
          {message.relayed && <Bluetooth size={10} color={isMe ? "#ffffffaa" : COLORS.textMuted} />}
          <span className="text-xs" style={{ color: isMe ? "#ffffffaa" : COLORS.textMuted }}>{message.time}</span>
          {isMe && <CheckCheck size={12} color="#ffffffaa" />}
        </div>
      </div>
    </div>
  );
}
