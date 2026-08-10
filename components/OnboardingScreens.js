"use client";
import { useState } from "react";
import { COLORS } from "../lib/theme";
import { SECURITY_OPTIONS_META } from "../lib/mockData";
import { Logo, WebMesh, FieldInput } from "./Shared";
import { ArrowRight, Mail, Lock, Phone, ShieldCheck, Scan, Fingerprint, Eye, Check, Loader2 } from "lucide-react";

const SECURITY_ICONS = { "2fa": ShieldCheck, face: Scan, finger: Fingerprint, retina: Eye };

export function SplashScreen({ onContinue }) {
  return (
    <div className="h-full flex flex-col items-center justify-center" style={{ padding: 32, textAlign: "center" }}>
      <WebMesh size={140} opacity={0.5} />
      <div style={{ marginTop: 8 }}>
        <Logo size={34} />
      </div>
      <p className="text-sm" style={{ color: COLORS.textMuted, marginTop: 14, marginBottom: 44, lineHeight: 1.5 }}>
        Chat, rete mesh e ricompense in un&apos;unica app.
      </p>
      <button
        onClick={onContinue}
        className="flex items-center justify-center font-medium text-sm active:opacity-80"
        style={{ width: "100%", padding: 14, borderRadius: 999, border: "none", background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.violet})`, color: "#fff", gap: 8 }}
      >
        Inizia <ArrowRight size={16} />
      </button>
    </div>
  );
}

export function LoginScreen({ email, setEmail, password, setPassword, phone, setPhone, onSubmit, loading, error, backendOnline }) {
  const canSubmit = email.trim() && password.trim() && phone.trim() && !loading;
  return (
    <div className="h-full flex flex-col" style={{ padding: "48px 24px 24px" }}>
      <Logo size={24} />
      <p className="text-xs" style={{ color: COLORS.textMuted, marginTop: 10, marginBottom: 24 }}>Accedi o crea un account</p>
      <div className="flex flex-col" style={{ gap: 12 }}>
        <FieldInput icon={Mail} placeholder="Email" value={email} onChange={setEmail} type="email" />
        <FieldInput icon={Lock} placeholder="Password" value={password} onChange={setPassword} type="password" passwordToggle />
        <FieldInput icon={Phone} placeholder="Numero di telefono" value={phone} onChange={setPhone} type="tel" />
      </div>
      {error && (
        <p className="text-xs" style={{ color: "#F87171", marginTop: 12, lineHeight: 1.5 }}>{error}</p>
      )}
      <p className="text-xs" style={{ color: COLORS.textMuted, marginTop: 16, lineHeight: 1.5 }}>
        {backendOnline === false
          ? "Backend non raggiunto: continui in modalità demo, con dati dimostrativi."
          : "Il primo accesso crea l'account in automatico; le volte dopo fa login."}
      </p>
      <div className="flex-1" />
      <button
        disabled={!canSubmit}
        onClick={onSubmit}
        className="flex items-center justify-center font-medium text-sm"
        style={{ width: "100%", padding: 14, borderRadius: 999, border: "none", background: canSubmit ? COLORS.blue : COLORS.panel2, color: canSubmit ? "#fff" : COLORS.textMuted, gap: 8 }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <>Continua <ArrowRight size={16} /></>}
      </button>
    </div>
  );
}

export function SecurityScreen({ selected, onToggle, onFinish, totpSetup, totpStatus, totpCode, setTotpCode, onVerifyTotp, backendOnline }) {
  return (
    <div className="h-full flex flex-col" style={{ padding: "48px 24px 24px" }}>
      <p className="wb-display font-semibold" style={{ fontSize: 19, marginBottom: 4 }}>Proteggi il tuo account</p>
      <p className="text-xs" style={{ color: COLORS.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
        L&apos;app propone queste protezioni aggiuntive oltre a email e password: scegli tu quali attivare.
      </p>
      <div className="flex flex-col" style={{ gap: 10 }}>
        {SECURITY_OPTIONS_META.map((opt) => {
          const active = selected.includes(opt.id);
          const Icon = SECURITY_ICONS[opt.id];
          return (
            <button
              key={opt.id}
              onClick={() => onToggle(opt.id)}
              className="w-full flex items-center active:opacity-80"
              style={{ gap: 12, padding: 14, borderRadius: 14, background: COLORS.panel2, border: `1px solid ${active ? COLORS.blue : COLORS.border}`, textAlign: "left" }}
            >
              <div className="flex items-center justify-center shrink-0" style={{ width: 34, height: 34, borderRadius: 999, background: (active ? COLORS.blue : COLORS.textMuted) + "22" }}>
                <Icon size={16} color={active ? COLORS.blue : COLORS.textMuted} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>{opt.desc}</p>
              </div>
              <div className="flex items-center justify-center shrink-0" style={{ width: 20, height: 20, borderRadius: 999, background: active ? COLORS.blue : "transparent", border: `1px solid ${active ? COLORS.blue : COLORS.border}` }}>
                {active && <Check size={12} color="#fff" />}
              </div>
            </button>
          );
        })}
      </div>

      {selected.includes("2fa") && backendOnline && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: COLORS.panel2, border: `1px solid ${COLORS.border}` }}>
          {!totpSetup && <Loader2 size={16} className="animate-spin" color={COLORS.textMuted} />}
          {totpSetup && totpStatus !== "verified" && (
            <>
              <p className="text-xs font-medium" style={{ marginBottom: 6 }}>Configura l&apos;app authenticator</p>
              <p className="text-xs" style={{ color: COLORS.textMuted, marginBottom: 8, lineHeight: 1.5 }}>
                Su Google/Microsoft Authenticator, aggiungi manualmente questo codice:
              </p>
              <p className="text-xs" style={{ fontFamily: "monospace", color: COLORS.blue, marginBottom: 10, wordBreak: "break-all" }}>{totpSetup.secret}</p>
              <div className="flex items-center" style={{ gap: 8 }}>
                <input
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="Codice a 6 cifre"
                  className="flex-1 text-sm"
                  style={{ background: COLORS.panel, borderRadius: 10, padding: "8px 12px", border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, outline: "none" }}
                />
                <button
                  onClick={onVerifyTotp}
                  className="text-xs font-medium active:opacity-80"
                  style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: COLORS.blue, color: "#fff" }}
                >
                  Verifica
                </button>
              </div>
              {totpStatus === "error" && <p className="text-xs" style={{ color: "#F87171", marginTop: 8 }}>Codice non valido, riprova.</p>}
            </>
          )}
          {totpStatus === "verified" && (
            <p className="text-xs" style={{ color: COLORS.online, display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={13} /> 2FA verificato e attivo
            </p>
          )}
        </div>
      )}
      {selected.includes("2fa") && backendOnline === false && (
        <p className="text-xs" style={{ color: COLORS.textMuted, marginTop: 10, lineHeight: 1.5 }}>
          Backend non raggiunto: il 2FA resta solo visuale in questa sessione demo.
        </p>
      )}
      <div className="flex-1" />
      <button
        onClick={onFinish}
        className="flex items-center justify-center font-medium text-sm active:opacity-80"
        style={{ width: "100%", padding: 14, borderRadius: 999, border: "none", background: COLORS.blue, color: "#fff", gap: 8 }}
      >
        {selected.length ? "Fine" : "Salta per ora"} <ArrowRight size={16} />
      </button>
    </div>
  );
}
