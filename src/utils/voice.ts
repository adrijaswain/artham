export const speechLocaleMap: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  kn: "kn-IN",
  bn: "bn-IN",
};

export function getSpeechLocale(): string {
  const activeLang = localStorage.getItem("artham_language") || "en";
  return speechLocaleMap[activeLang] || "en-IN";
}

let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

// Chrome/Safari populate speechSynthesis.getVoices() asynchronously - calling it
// immediately after page load reliably returns []. Every non-English locale then
// silently falls back to whatever default voice happens to already be loaded
// (almost always an English one), which is why voice replies only sounded English.
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve([]);

  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);

  if (voicesReadyPromise) return voicesReadyPromise;

  voicesReadyPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const finish = () => {
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", finish);
    // Safety net in case the browser never fires voiceschanged.
    setTimeout(finish, 1500);
  });
  return voicesReadyPromise;
}

export function pickVoiceForLocale(voices: SpeechSynthesisVoice[], locale: string): SpeechSynthesisVoice | undefined {
  const norm = (s: string) => s.toLowerCase().replace("_", "-");
  const target = norm(locale);
  const base = target.split("-")[0];
  return (
    voices.find((v) => norm(v.lang) === target) ||
    voices.find((v) => norm(v.lang).startsWith(`${base}-`)) ||
    voices.find((v) => norm(v.lang) === base)
  );
}
