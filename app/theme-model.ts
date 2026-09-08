export const THEME_STORAGE_KEY = "ontology-learning-studio.theme";
export const DEFAULT_THEME = "forest";
export type ThemeId = "light" | "dark" | "forest" | "ocean" | "lavender" | "sand";
type Palette = {
  paper: string; panel: string; surface: string; ink: string; muted: string;
  line: string; green: string; "green-soft": string; lime: string;
  "strong-bg": string; "on-strong": string; "on-accent": string;
  "terminal-bg": string; "terminal-ink": string; "terminal-muted": string;
  "warning-bg": string; "warning-ink": string; "warning-line": string;
  "error-bg": string; "error-ink": string; "error-line": string;
  "disabled-bg": string; "disabled-ink": string; blue: string;
};
const common: Palette = {
  paper: "#f3f5f0", panel: "#fcfdf9", surface: "#ffffff", ink: "#182321", muted: "#5c6b65",
  line: "#cbd5cc", green: "#0b7658", "green-soft": "#dfeee7", lime: "#d8ee72",
  "strong-bg": "#182321", "on-strong": "#ffffff", "on-accent": "#ffffff",
  "terminal-bg": "#101816", "terminal-ink": "#dce7e1", "terminal-muted": "#a9bab1",
  "warning-bg": "#fff6dc", "warning-ink": "#76500d", "warning-line": "#b08a31",
  "error-bg": "#fff4f2", "error-ink": "#a52929", "error-line": "#d58b83",
  "disabled-bg": "#e8ede7", "disabled-ink": "#69736d", blue: "#3659cf",
};

export const THEMES: { id: ThemeId; label: string; combination: string; scheme: "light" | "dark"; colors: Palette }[] = [
  { id: "light", label: "라이트", combination: "화이트 + 슬레이트 블루", scheme: "light", colors: {
    ...common, paper: "#f5f7fa", panel: "#ffffff", ink: "#192536", muted: "#536174", line: "#cbd3df",
    green: "#3156a0", "green-soft": "#e5ecfa", lime: "#b9d5ff", "strong-bg": "#1e304b",
    "terminal-bg": "#111c2b", "disabled-bg": "#e9edf3",
  } },
  { id: "dark", label: "다크", combination: "차콜 + 아이스 블루", scheme: "dark", colors: {
    ...common, paper: "#111827", panel: "#182233", surface: "#202d40", ink: "#edf2f9", muted: "#b0bfd2",
    line: "#40526a", green: "#93c5fd", "green-soft": "#253d58", lime: "#b9d5ff",
    "strong-bg": "#314969", "on-accent": "#111827", "terminal-bg": "#0a101c",
    "terminal-ink": "#e1eaf7", "terminal-muted": "#a7bad3",
    "warning-bg": "#3b2f1a", "warning-ink": "#f9d586", "warning-line": "#9b7b35",
    "error-bg": "#3b222b", "error-ink": "#ffb4b4", "error-line": "#a15d69",
    "disabled-bg": "#263243", "disabled-ink": "#9caec4", blue: "#a4b8ff",
  } },
  { id: "forest", label: "포레스트", combination: "세이지 + 딥 그린 · 기존 테마", scheme: "light", colors: { ...common } },
  { id: "ocean", label: "오션", combination: "아이스 블루 + 딥 틸", scheme: "light", colors: {
    ...common, paper: "#edf6fa", panel: "#f8fcff", ink: "#18313e", muted: "#506875", line: "#bdd4df",
    green: "#096b85", "green-soft": "#d9edf5", lime: "#a7e5f3", "strong-bg": "#173d50",
    "terminal-bg": "#0e2430", "disabled-bg": "#e1ecf1",
  } },
  { id: "lavender", label: "라벤더", combination: "라일락 + 플럼", scheme: "light", colors: {
    ...common, paper: "#f4f0fa", panel: "#fdfaff", ink: "#30263e", muted: "#695d7a", line: "#d5c8e4",
    green: "#74509a", "green-soft": "#ece2f7", lime: "#e1c6ff", "strong-bg": "#38264d",
    "terminal-bg": "#21182e", "disabled-bg": "#ece6f2", blue: "#6750a4",
  } },
  { id: "sand", label: "샌드", combination: "크림 + 테라코타", scheme: "light", colors: {
    ...common, paper: "#f8f2e8", panel: "#fffbf4", ink: "#392e26", muted: "#756451", line: "#dbcbb7",
    green: "#9a492e", "green-soft": "#f3e3d1", lime: "#f5d69e", "strong-bg": "#463023",
    "terminal-bg": "#261d16", "disabled-bg": "#eee4d7", blue: "#835037",
  } },
];

export function themeById(id: unknown) {
  return THEMES.find((theme) => theme.id === id) ?? THEMES.find((theme) => theme.id === DEFAULT_THEME)!;
}

type ThemeRoot = { dataset: { theme?: string }; style: { setProperty: (key: string, value: string) => void; colorScheme: string } };
export function applyTheme(id: unknown, root: ThemeRoot): ThemeId {
  const theme = themeById(id);
  for (const [key, value] of Object.entries(theme.colors)) root.style.setProperty("--" + key, value);
  root.style.colorScheme = theme.scheme;
  root.dataset.theme = theme.id;
  return theme.id;
}

export function saveTheme(id: ThemeId, storage: Pick<Storage, "setItem">): boolean {
  try { storage.setItem(THEME_STORAGE_KEY, themeById(id).id); return true; } catch { return false; }
}

// Static, allowlisted data only. Runs before the body to avoid a light flash on
// reload; blocked/unavailable storage leaves the default theme intact.
export const THEME_BOOTSTRAP = `(()=>{const themes=${JSON.stringify(THEMES).replace(/</g, "\\u003c")};let id=${JSON.stringify(DEFAULT_THEME)};try{id=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||id}catch{}const theme=themes.find(t=>t.id===id)||themes.find(t=>t.id===${JSON.stringify(DEFAULT_THEME)});const root=document.documentElement;for(const [key,value]of Object.entries(theme.colors))root.style.setProperty('--'+key,value);root.style.colorScheme=theme.scheme;root.dataset.theme=theme.id;})();`;
