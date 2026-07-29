import { COLORS } from "./theme";

export const CONTACTS = [
  { id: "giulia", name: "Giulia Bianchi", initials: "GB", color: COLORS.blue, status: "mesh", statusLabel: "Nodo mesh · 2 hop", unread: 2 },
  { id: "marco", name: "Marco · Sviluppo", initials: "MS", color: COLORS.violet, status: "wifi", statusLabel: "Wi-Fi", unread: 0 },
  { id: "nodo-milano", name: "Nodo Milano Centro", initials: "NM", color: "#34D399", status: "group", statusLabel: "Gruppo mesh · 5/5 utenti", unread: 5, group: true },
  { id: "team", name: "Widow Blue Team", initials: "WB", color: "#F2B84C", status: "5g", statusLabel: "Annunci", unread: 1, group: true },
];

export const INITIAL_MESSAGES = {
  giulia: [
    { id: 1, from: "them", text: "Ci vediamo stasera per collaudare il nodo mesh?", time: "18:02" },
    { id: 2, from: "me", text: "Sì! Porto il telefono di backup per testare i 5 utenti sul nodo", time: "18:03" },
    { id: 3, from: "them", text: "Perfetto, io ho già 4.820 passi oggi 👀", time: "18:05", relayed: true },
  ],
  marco: [
    { id: 1, from: "them", text: "Ho pushato la build con il selettore di rete", time: "09:12" },
    { id: 2, from: "me", text: "Top, la provo appena arrivo in ufficio", time: "09:14" },
  ],
  "nodo-milano": [
    { id: 1, from: "them", name: "Ale", text: "Nodo stabile, 5/5 connessi da 20 minuti", time: "17:40" },
    { id: 2, from: "them", name: "Fede", text: "Segnale forte anche qui in fondo alla sala", time: "17:41" },
  ],
  team: [{ id: 1, from: "them", text: "Rilasciata la policy di sicurezza aggiornata di questo mese", time: "08:00" }],
};

export const AUTO_REPLIES = {
  giulia: ["👍", "Ricevuto, ci sentiamo dopo", "Ok, ti aggiorno sul nodo"],
  marco: ["Fixato, ora pusho", "Ok procedo", "👌"],
  "nodo-milano": ["Ale: tutto ok da qui", "Fede: confermo"],
  team: ["Grazie per il feedback"],
};

export const SECURITY_OPTIONS_META = [
  { id: "2fa", label: "Autenticazione a 2 fattori", desc: "App authenticator (consigliata)" },
  { id: "face", label: "Face ID", desc: "Sblocco con riconoscimento del volto" },
  { id: "finger", label: "Impronta digitale", desc: "Sblocco con sensore impronte" },
  { id: "retina", label: "Scansione retina", desc: "Dove supportata dal dispositivo" },
];
