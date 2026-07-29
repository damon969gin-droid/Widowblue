export const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Poppins:wght@400;500;600&family=Lora:wght@400;500;600&family=Roboto+Mono:wght@400;500&display=swap');
  .wb-display { font-family: 'Space Grotesk', sans-serif; }
  .wb-body { font-family: 'Inter', sans-serif; }
  @media (prefers-reduced-motion: reduce) {
    .wb-node { animation: none !important; }
  }
  @keyframes wb-pulse {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.9; }
  }
`;

export const CHAT_FONTS = [
  { id: "inter", label: "Standard", family: "'Inter', sans-serif" },
  { id: "poppins", label: "Arrotondato", family: "'Poppins', sans-serif" },
  { id: "lora", label: "Elegante", family: "'Lora', serif" },
  { id: "mono", label: "Tecnico", family: "'Roboto Mono', monospace" },
];

export const COLORS = {
  void: "#0A0C16",
  panel: "#12162A",
  panel2: "#171C33",
  border: "#232A47",
  blue: "#4C8DFF",
  violet: "#8B6CF2",
  textPrimary: "#EEF1FB",
  textMuted: "#8891B0",
  online: "#34D399",
};

export const TERM = {
  bg: "#050B06",
  green: "#3BFF7A",
  greenDim: "#1E7A3C",
  text: "#B9FFC9",
};

export const BACKGROUNDS = [
  { id: "default", label: "Scuro", style: { background: COLORS.void } },
  {
    id: "aurora",
    label: "Aurora",
    style: {
      background: `radial-gradient(circle at 20% 10%, #8B6CF233, transparent 45%), radial-gradient(circle at 85% 30%, #4C8DFF33, transparent 45%), ${COLORS.void}`,
    },
  },
  { id: "mesh", label: "Rete", style: { background: COLORS.void } },
];

export function fmtEuro(n) {
  return n.toFixed(2).replace(".", ",");
}
