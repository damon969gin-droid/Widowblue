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
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
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

  // --- Integrazione backend reale, con fallback grazioso alla demo ---
  const [backendOnline, setBackendOnline] = useState(null); // null = verifica in corso
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
  const earnedEuro = realReward ? realReward.wbluAwarded : mockEarnedEuro;

  const displayContacts = realContacts || CONTACTS;
  const isConnected = backendOnline && !!authToken;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeChat, screen]);

  // Controllo di stato del backend, una volta all'avvio.
  useEffect(() => {
    checkHealth().then(setBackendOnline);
  }, []);

  // Ripristina la sessione se c'e' un token salvato da una visita precedente.
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

  // Contatti e ricompensa reali, appena autenticati e online.
  useEffect(() => {
    if (!isConnected) return;
    apiGetContacts(authToken).then((res) => {
      if (res.ok) setRealContacts(res.data);
    });
    apiSubmitSteps(authToken, steps).then((res) => {
      if (res.ok) setRealReward(res.data);
    });
  }, [isConnected]);

  // Storico messaggi + iscrizione allo stream in tempo reale della chat aperta.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat, isConnected]);

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
      }
    }
  }

  async function handleVerifyTotp() {
    const res = await apiVerify2FA(authToken, totpCode);
    setTotpStatus(res.ok ? "verified" : "error");
  }

  async function handleLoginSubmit() {
    setLoginError("");

    if (!backendOnline) {
      setScreen("security"); // modalita' demo: nessun backend, si prosegue comunque
      return;
    }

    setLoginLoading(true);
    const res = await loginOrRegister(loginEmail.trim().toLowerCase(), loginPassword, loginPhone.trim());
    setLoginLoading(false);

    if (res.ok) {
      setAuthToken(res.data.token);
      setScreen("security");
    } else if (res.offline) {
      setBackendOnline(false);
      setScreen("security");
    } else if (res.data?.requires2fa) {
      setLoginError("Questo account ha il 2FA attivo: funzione di login con codice non ancora nella demo — usa un altro account per provare il flusso.");
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
      await apiSendMessage(authToken, activeChat, text);
      return; // arriva in UI da solo via lo stream SSE
    }

    // Modalita' demo (offline o non autenticato): stesso comportamento del prototipo originale.
    const id = Date.now();
    const time = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), { id, from: "me", text, time }] }));
    const replies = AUTO_REPLIES[activeChat] || ["👍"];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), { id: id + 1, from: "them", text: reply, time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) }],
      }));
    }, 1100);
  }

  // --- aggiunta logout ---
  function handleLogout() {
    setAuthToken(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    setLoginEmail("");
    setLoginPassword("");
    setLoginPhone("");
    setScreen("login");
  }

  const contact = displayContacts.find((c) => c.id === activeChat);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" style={{ background: COLORS.void, padding: 24 }}>
      <style>{FONT_STYLE}</style>

      <div
        className="relative w-full max-w-sm border overflow-hidden shadow-2xl"
        style={{ background: COLORS.panel, borderColor: COLORS.border, height: 800, borderRadius: 40 }}
      >
        <div className="absolute" style={{ top: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 22, background: "#000", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, opacity: 0.06 }} />

        <div className="h-full flex flex-col wb-body" style={{ color: COLORS.textPrimary }}>
          {screen === "splash" && <SplashScreen onContinue={() => setScreen("login")} />}
          {screen === "login" && (
            <LoginScreen
              email={loginEmail} setEmail={setLoginEmail}
              password={loginPassword} setPassword={setLoginPassword}
              phone={loginPhone} setPhone={setLoginPhone}
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
              connectionStatus={backendOnline === null ? "checking" : isConnected ? "online" : "demo"}
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
              onHome={() => setScreen("home")}
              onOpenModal={setModal}
              bgTheme={bgTheme}
              onOpenBgPicker={() => setShowBgPicker(true)}
              scrollRef={scrollRef}
              chatFont={chatFont}
            />
          )}
          {screen === "vpn" && (
            <VpnScreen onBack={() => setScreen("home")} onHome={() => setScreen("home")} active={vpnActive} onToggle={() => setVpnActive((v) => !v)} provider={vpnProvider} setProvider={setVpnProvider} />
          )}
          {screen === "profile" && (
            <ProfileScreen
              onBack={() => setScreen("home")}
              onHome={() => setScreen("home")}
              portfolioUrl={portfolioUrl}
              setPortfolioUrl={setPortfolioUrl}
              portfolioPublic={portfolioPublic}
              setPortfolioPublic={setPortfolioPublic}
            />
          )}
        </div>

        {showBgPicker && (
          <BgPicker current={bgTheme} onPick={(id) => setBgTheme(id)} onClose={() => setShowBgPicker(false)} currentFont={chatFont} onPickFont={(id) => setChatFont(id)} />
        )}
        {modal && <InfoModal type={modal} onClose={() => setModal(null)} onPick={(emoji) => { setDraft((d) => d + emoji); setModal(null); }} />}
      </div>
    </div>
  );
}
