"use client";
import { useState, useRef, useEffect } from "react";
import { COLORS, FONT_STYLE, fmtEuro } from "../lib/theme";
import { CONTACTS, INITIAL_MESSAGES, AUTO_REPLIES } from "../lib/mockData";
import {
  checkHealth,
  loginOrRegister,
  apiSetup2FA,
  apiVerify2FA,
  apiGetContacts,
  apiGetMessages,
  apiSendMessage,
  apiSubmitSteps,
  openMessageStream,
  apiAddContacts,
} from "../lib/apiClient";
import { SplashScreen, LoginScreen, SecurityScreen } from "./OnboardingScreens";
import { HomeScreen } from "./HomeScreen";
import { ChatScreen } from "./ChatScreen";
import { VpnScreen } from "./VpnScreen";
import { ProfileScreen } from "./ProfileScreen";
import { BgPicker, InfoModal } from "./Overlays";

const TOKEN_STORAGE_KEY = "widowblue_token";

export default function WidowBlueApp() {
  const [screen, setScreen] = useState("splash");
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [draft, setDraft] = useState("");
  const [network, setNetwork] = useState("mesh");
  const [bgTheme, setBgTheme] = useState("default");
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [modal, setModal] = useState(null);
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [selectedSecurity, setSelectedSecurity] = useState(["2fa"]);
  const [vpnActive, setVpnActive] = useState(false);
  const [vpnProvider, setVpnProvider] = useState("secure");
  const [chatFont, setChatFont] = useState("inter");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioPublic, setPortfolioPublic] = useState(false);
  const scrollRef = useRef(null);

  // Backend reale - OBBLIGATORIO
  const [backendOnline, setBackendOnline] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [totpSetup, setTotpSetup] = useState(null);
  const [totpStatus, setTotpStatus] = useState("idle");
  const [totpCode, setTotpCode] = useState("");
  const [realContacts, setRealContacts] = useState(null);
  const [realReward, setRealReward] = useState(null);

  const steps = 4820;
  const stepGoal = 7000;
  const maxEuro = 20;
  const mockEarnedEuro = Math.min(maxEuro, Number((maxEuro * (steps / stepGoal)).toFixed(2)));
  const earnedEuro = realReward ? realReward.wblu_amount : 0;

  const displayContacts = realContacts || [];
  const isConnected = backendOnline && !!authToken;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeChat, screen]);

  // Verifica backend al caricamento
  useEffect(() => {
    checkHealth().then((isOnline) => {
      setBackendOnline(isOnline);
      if (!isOnline) {
        setLoginError("Backend non disponibile. Riprova fra poco.");
      }
    });
  }, []);

  // Ripristina sessione se c'è un token salvato
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) setAuthToken(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authToken) window.localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, [authToken]);

  // Carica contatti e ricompense quando autenticato
  useEffect(() => {
    if (!isConnected) return;
    apiGetContacts(authToken).then((res) => {
      if (res.ok) setRealContacts(res.data);
    });
    apiSubmitSteps(authToken, steps).then((res) => {
      if (res.ok) setRealReward(res.data);
    });
  }, [isConnected, authToken, steps]);

  // Storico messaggi + stream realtime
  useEffect(() => {
    if (!activeChat || !isConnected) return;
    let alive = true;

    apiGetMessages(authToken, activeChat).then((res) => {
      if (alive && res.ok) {
        setMessages((prev) => ({ ...prev, [activeChat]: res.data }));
      }
    });

    const closeStream = openMessageStream(authToken, activeChat, (incoming) => {
      setMessages((prev) => {
        const existing = prev[activeChat] || [];
        if (existing.some((m) => m.id === incoming.id)) return prev;
        return { ...prev, [activeChat]: [...existing, incoming] };
      });
    });

    return () => {
      alive = false;
      closeStream();
    };
  }, [activeChat, isConnected, authToken]);

  async function toggleSecurity(id) {
    const alreadyOn = selectedSecurity.includes(id);
    setSelectedSecurity((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    if (id === "2fa" && !alreadyOn && isConnected) {
      setTotpStatus("pending");
      const res = await apiSetup2FA(authToken);
      if (res.ok) {
        setTotpSetup(res.data);
        setTotpStatus("idle");
      } else {
        setTotpStatus("error");
        setLoginError("Errore setup 2FA");
      }
    }
  }

  async function handleVerifyTotp() {
    const res = await apiVerify2FA(authToken, totpCode);
    if (res.ok) {
      setTotpStatus("verified");
      setLoginError("");
    } else {
      setTotpStatus("error");
      setLoginError("Codice 2FA non valido");
    }
  }

  async function handleLoginSubmit() {
    setLoginError("");

    if (!backendOnline) {
      setLoginError("Backend non disponibile. Riprova fra poco.");
      return;
    }

    setLoginLoading(true);
    const res = await loginOrRegister(loginEmail.trim().toLowerCase(), loginPassword, loginPhone.trim());
    setLoginLoading(false);

    if (res.ok) {
      setAuthToken(res.data.access_token);
      setScreen("security");
      setLoginEmail("");
      setLoginPassword("");
      setLoginPhone("");
    } else {
      setLoginError(res.error || "Credenziali non valide");
    }
  }

  function openChat(id) {
    setActiveChat(id);
    setScreen("chat");
  }

  async function sendMessage() {
    if (!draft.trim() || !activeChat) return;
    const text = draft.trim();
    setDraft("");

    if (isConnected) {
      const res = await apiSendMessage(authToken, activeChat, text);
      if (!res.ok) {
        setLoginError("Errore invio messaggio");
      }
      return;
    }

    setLoginError("Non sei connesso al backend");
  }

  function handleLogout() {
    setAuthToken(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    setLoginEmail("");
    setLoginPassword("");
    setLoginPhone("");
    setScreen("login");
    setRealContacts(null);
    setMessages({});
  }

  async function handleImportContacts() {
    if (!isConnected) {
      setLoginError("Devi essere autenticato per importare contatti");
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.contacts && navigator.contacts.select) {
        const props = ["name", "tel", "email"];
        const opts = { multiple: true };
        const picked = await navigator.contacts.select(props, opts);
        const contacts = picked.map((c) => ({
          name: Array.isArray(c.name) ? c.name[0] : c.name || "Sconosciuto",
          phone: Array.isArray(c.tel) ? c.tel[0] : c.tel || "",
          email: Array.isArray(c.email) ? c.email[0] : c.email || "",
          initials: Array.isArray(c.name) && c.name[0]
            ? c.name[0]
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
            : "??",
          color: "#7C3AED",
          is_group: false,
        }));
        const res = await apiAddContacts(authToken, contacts);
        if (res.ok) {
          setRealContacts((prev) => [...(prev || []), ...res.data]);
          setLoginError("");
        } else {
          setLoginError("Errore import contatti");
        }
        return;
      }
    } catch (e) {
      console.warn("Contacts API error", e);
    }

    const csv = prompt("Incolla CSV con colonne: name,email,phone");
    if (csv) {
      const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
      const parsed = lines.map((ln) => {
        const [name, email, phone] = ln.split(",");
        return {
          name: name?.trim(),
          email: email?.trim(),
          phone: phone?.trim(),
          initials: name?.split(" ").map((s) => s[0]).slice(0, 2).join(""),
          color: "#60A5FA",
          is_group: false,
        };
      });
      const res2 = await apiAddContacts(authToken, parsed);
      if (res2.ok) {
        setRealContacts((prev) => [...(prev || []), ...res2.data]);
        setLoginError("");
      } else {
        setLoginError("Errore import CSV");
      }
    }
  }

  function handleOpenUrl(url, mode = "external") {
    const safeUrl = url && url.startsWith("http") ? url : `https://${url}`;
    if (mode === "external") {
      window.open(safeUrl, "_blank", "noopener,noreferrer");
    }
  }

  const contact = displayContacts.find((c) => c.id === activeChat);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: COLORS.void, padding: 24 }}>
      <style>{FONT_STYLE}</style>

      <div
        className="relative w-full max-w-sm border overflow-hidden shadow-2xl"
        style={{ background: COLORS.panel, borderColor: COLORS.border, height: 800, borderRadius: 40 }}
      >
        <div className="absolute" style={{ top: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 22, background: "#000", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }} />

        <div className="h-full flex flex-col wb-body" style={{ color: COLORS.textPrimary }}>
          {screen === "splash" && <SplashScreen onContinue={() => setScreen("login")} />}
          {screen === "login" && (
            <LoginScreen
              email={loginEmail}
              setEmail={setLoginEmail}
              password={loginPassword}
              setPassword={setLoginPassword}
              phone={loginPhone}
              setPhone={setLoginPhone}
              onSubmit={handleLoginSubmit}
              loading={loginLoading}
              error={loginError}
              backendOnline={backendOnline}
            />
          )}
          {screen === "security" && (
            <SecurityScreen
              selected={selectedSecurity}
              onToggle={toggleSecurity}
              onFinish={() => setScreen("home")}
              totpSetup={totpSetup}
              totpStatus={totpStatus}
              totpCode={totpCode}
              setTotpCode={setTotpCode}
              onVerifyTotp={handleVerifyTotp}
              backendOnline={backendOnline}
            />
          )}
          {screen === "home" && (
            <HomeScreen
              onOpenChat={openChat}
              onOpenVpn={() => setScreen("vpn")}
              onOpenProfile={() => setScreen("profile")}
              onLogout={handleLogout}
              onImportContacts={handleImportContacts}
              steps={steps}
              stepGoal={stepGoal}
              earnedEuro={earnedEuro}
              fmtEuro={fmtEuro}
              showTokenInfo={showTokenInfo}
              setShowTokenInfo={setShowTokenInfo}
              network={network}
              setNetwork={setNetwork}
              messages={messages}
              contactsOverride={displayContacts}
              connectionStatus={backendOnline === null ? "checking" : isConnected ? "online" : "offline"}
            />
          )}
          {screen === "chat" && contact && (
            <ChatScreen
              contact={contact}
              messages={messages[activeChat] || []}
              draft={draft}
              setDraft={setDraft}
              onSend={sendMessage}
              onBack={() => setScreen("home")}
              onOpenModal={setModal}
              onOpenUrl={handleOpenUrl}
              bgTheme={bgTheme}
              onOpenBgPicker={() => setShowBgPicker(true)}
              scrollRef={scrollRef}
              chatFont={chatFont}
            />
          )}
          {screen === "vpn" && <VpnScreen onBack={() => setScreen("home")} onHome={() => setScreen("home")} active={vpnActive} onToggle={() => setVpnActive((v) => !v)} provider={vpnProvider} setProvider={setVpnProvider} />}
          {screen === "profile" && <ProfileScreen onBack={() => setScreen("home")} onHome={() => setScreen("home")} portfolioUrl={portfolioUrl} setPortfolioUrl={setPortfolioUrl} portfolioPublic={portfolioPublic} setPortfolioPublic={setPortfolioPublic} />}
        </div>

        {showBgPicker && <BgPicker current={bgTheme} onPick={(id) => setBgTheme(id)} onClose={() => setShowBgPicker(false)} currentFont={chatFont} onPickFont={(id) => setChatFont(id)} />}
        {modal && <InfoModal type={modal} onClose={() => setModal(null)} onPick={(emoji) => { setDraft((d) => d + emoji); setModal(null); }} />}
      </div>
    </div>
  );
}
