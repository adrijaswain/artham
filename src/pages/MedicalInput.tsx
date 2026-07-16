import { useState, useEffect, useRef } from "react";
import AppShell from "../components/AppShell";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { useLanguage } from "../components/LanguageContext";

export type Msg = {
  role: "bot" | "user";
  text: string;
  meta?: string;
  isError?: boolean;
};

export type VaultFile = {
  id: string;
  name: string;
  category: "Medical Report / Scan" | "Doctor Prescription" | "Hospital Quote / Bill" | "Insurance Policy" | "Income Certificate";
  date: string;
  amount?: string;
  notes?: string;
  size: string;
  base64Data?: string; // For image previews and multimodal vision prompts
  mimeType?: string;
  aiAnalysis?: string;
};
const generateUniqueId = () => {
  return Date.now().toString();
};

// The Evidence Vault starts empty — users upload their own documents and the
// assistant analyzes their real details (no template/sample files).
const initialVaultFiles: VaultFile[] = [];

// ---------------------------------------------------------------------------
// Groq API integration (OpenAI-compatible chat completions).
// Model is configurable via VITE_GROQ_MODEL (default llama-3.3-70b-versatile).
// An optional vision model (VITE_GROQ_VISION_MODEL) enables reading uploaded
// image documents; when unset, document analysis works from the details the
// user provides in the upload form.
// ---------------------------------------------------------------------------
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const groqModel = () => (import.meta.env.VITE_GROQ_MODEL as string) || "llama-3.3-70b-versatile";
const groqVisionModel = () => (import.meta.env.VITE_GROQ_VISION_MODEL as string) || "";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  mr: "Marathi (मराठी)",
  kn: "Kannada (ಕನ್ನಡ)",
  bn: "Bengali (বাঙালি)"
};

const getActiveLanguageName = () => {
  const lang = localStorage.getItem("artham_language") || "en";
  return LANGUAGE_NAMES[lang] || "English";
};

// Compact intake-profile block, pulled from the user's saved onboarding data.
const buildIntakeContext = (): string => {
  const g = (k: string, fallback = "Not specified") => localStorage.getItem(k) || fallback;
  const hasIns = localStorage.getItem("artham_intake_has_insurance") !== "false";
  const provider = localStorage.getItem("artham_intake_insurance_provider");
  const insurance = hasIns ? (provider || "Insured (details pending)") : "No Insurance";
  return [
    `- State: ${g("artham_intake_state")}`,
    `- Age: ${g("artham_intake_age")}`,
    `- Cancer Stage: ${g("artham_intake_stage")}`,
    `- HER2 / Hormone Receptor Status: ${g("artham_intake_hormone_status")}`,
    `- Surgery Planned: ${g("artham_intake_surgery")}`,
    `- Chemotherapy Planned: ${g("artham_intake_chemo")}`,
    `- Radiation Planned: ${g("artham_intake_radiation")}`,
    `- Hospital Type: ${g("artham_intake_hospital_type")}`,
    `- Insurance Status: ${insurance}`,
    `- Household Income: ${g("artham_intake_income_bracket")}`
  ].join("\n");
};

// Summarize the user's uploaded Evidence Vault so the assistant can reference
// the real details of documents they have added.
const buildVaultContext = (vaultFiles: VaultFile[]): string => {
  if (!vaultFiles || vaultFiles.length === 0) return "No documents uploaded yet.";
  return vaultFiles
    .slice(0, 12)
    .map((f, i) =>
      [
        `${i + 1}. ${f.name} — ${f.category}${f.date ? ` (dated ${f.date})` : ""}`,
        f.amount ? `   Declared amount: ₹${f.amount}` : "",
        f.notes ? `   User notes: ${f.notes}` : "",
        f.aiAnalysis ? `   Prior analysis: ${f.aiAnalysis.replace(/\s+/g, " ").slice(0, 500)}` : ""
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n");
};

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
};

// Core Groq chat-completions call.
const callGroq = async (apiKey: string, model: string, messages: GroqMessage[]): Promise<string> => {
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, temperature: 0.4, max_tokens: 1024, messages })
  });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      detail = errData.error?.message || detail;
    } catch {
      /* keep status text */
    }
    throw new Error(detail || "Groq API request failed");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Invalid response format from Groq API");
  return content;
};

// Groq chat helper for the Clinical Navigator conversation. The system prompt
// carries the intake profile and a summary of uploaded documents.
const queryGroqChat = async (history: Msg[], apiKey: string, vaultFiles: VaultFile[]): Promise<string> => {
  const activeLanguageName = getActiveLanguageName();

  const systemPrompt = `You are the Artham Clinical Navigator, an expert clinical and financial-navigation assistant focused specifically on BREAST CANCER care in India.

User Intake Profile (keep implicitly in context; do not reprint unless asked):
${buildIntakeContext()}

User's Evidence Vault documents (reference their details when relevant):
${buildVaultContext(vaultFiles)}

Guidelines:
CRITICAL LANGUAGE REQUIREMENT: Write your ENTIRE response strictly in ${activeLanguageName}.
1. SCOPE: Only address breast-cancer diagnosis, treatment (surgery, chemotherapy, radiation, targeted & hormone therapy), treatment costs in India (₹, Lakhs), insurance, and government/welfare schemes. If asked about an unrelated topic or a different disease, briefly say you focus on breast-cancer navigation and steer back.
2. CONCISENESS: 100-150 words max. Bullet points and short paragraphs only. Answer directly; do not spiral into generic background.
3. GREETINGS: If the user only greets you, reply with one warm sentence in ${activeLanguageName} asking how you can help — no clinical readout.
4. PERSONALIZE: Tailor to the intake profile (e.g. state scheme like Arogya Karnataka; Stage II expectations; Trastuzumab for HER2+) and reference the user's uploaded documents when useful.
5. SCHEMES: Frame financial help around Ayushman Bharat (PM-JAY), Rashtriya Arogya Nidhi (RAN), and State Illness Assistance funds.
6. REFERRALS: When helpful, point to Artham features (Cost Breakdown, Action Plan, Dashboard, Schemes, Evidence Vault).
7. STYLE: Clean Markdown — bold headers, bullet lists, crisp summaries.
8. DISCLAIMER: End with one short sentence that Artham supports financial navigation and is not a substitute for an oncologist.`;

  const messages: GroqMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({
      role: (h.role === "bot" ? "assistant" : "user") as "assistant" | "user",
      content: h.text
    }))
  ];

  return callGroq(apiKey, groqModel(), messages);
};

// Groq document-analysis helper. If a vision model is configured and the file
// is an image, the scan itself is read; otherwise the analysis is built from
// the document details the user supplied in the upload form.
const analyzeDocumentWithGroq = async (file: VaultFile, apiKey: string): Promise<string> => {
  const activeLanguageName = getActiveLanguageName();

  const systemPrompt = `You are the Artham clinical audit assistant for breast-cancer care in India. Write your ENTIRE response strictly in ${activeLanguageName}, using clean Markdown with bold headers and bullet points.`;

  const instructions = `Analyze the uploaded document in the context of the patient's breast-cancer profile and give practical, India-specific guidance.

Patient intake profile:
${buildIntakeContext()}

Document details:
- Filename: ${file.name}
- Category: ${file.category}
- Date: ${file.date || "Not specified"}
- Declared amount (₹): ${file.amount || "None"}
- User notes: ${file.notes || "None"}

Produce these sections:
1. **Document Summary** — what this document is and its role in the treatment/claim journey.
2. **Key Details** — clinical and/or financial values (state clearly what is missing and ask the user to add it to the notes if needed).
3. **Claim Feasibility** — rate its usefulness as evidence for an insurance/scheme claim (High / Medium / Low) and why.
4. **Next Actions** — concrete step-by-step actions (e.g. attach to PM-JAY pre-auth, submit for reimbursement).`;

  const visionModel = groqVisionModel();
  const isImage = !!(file.base64Data && file.mimeType && file.mimeType.startsWith("image/"));

  if (visionModel && isImage) {
    const dataUrl = `data:${file.mimeType};base64,${file.base64Data}`;
    return callGroq(apiKey, visionModel, [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: instructions },
          { type: "image_url", image_url: { url: dataUrl } }
        ]
      }
    ]);
  }

  const noVisionNote = isImage
    ? "\n\nNote: the image contents are not read automatically here. Base your analysis on the details above, and ask the user to type any critical values (findings, amounts, dates) into the document notes."
    : "";

  return callGroq(apiKey, groqModel(), [
    { role: "system", content: systemPrompt },
    { role: "user", content: instructions + noVisionNote }
  ]);
};

const allSuggestions = [
  { bold: "Estimate screening", normal: " & surgical costs", text: "Estimate cancer screening and surgical treatment costs in India" },
  { bold: "Draft PM-JAY claim", normal: " application next steps", text: "What are the step-by-step next actions to draft a PM-JAY claim application?" },
  { bold: "Verify claims", normal: " via diagnostic scans", text: "How do I verify if my MRI scan or biopsy report is sufficient for an insurance claim?" },
  { bold: "Check eligibility", normal: " for cancer support", text: "Check my eligibility for national illness assistance and cancer welfare schemes in India" },
  { bold: "Find empanelled", normal: " network hospitals", text: "How do I find empanelled government and private hospitals for cash-free treatment?" },
  { bold: "Analyze doctor notes", normal: " for prescriptions", text: "Explain the clinical terms in my doctor prescription sheet" },
  { bold: "Compare room rents", normal: " and limits", text: "Compare public vs private hospital ward room rent limits and out-of-pocket costs" },
  { bold: "Navigate RAN scheme", normal: " for low income", text: "How does a patient below the poverty line apply for Rashtriya Arogya Nidhi (RAN) funding?" },
];

export default function MedicalInput() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>(() => {
    const saved = localStorage.getItem("artham_chat_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading chat messages from localStorage:", e);
      }
    }
    return [];
  });
  const [promptOffset, setPromptOffset] = useState(0);
  const [draft, setDraft] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Evidence Vault states
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>(() => {
    const savedFiles = localStorage.getItem("artham_vault_files");
    if (savedFiles) {
      try {
        return JSON.parse(savedFiles);
      } catch (e) {
        console.error("Error loading files from localStorage", e);
      }
    }
    return initialVaultFiles;
  });

  // API Key management
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem("groq_api_key") || "");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const apiKey = customApiKey || (import.meta.env.VITE_GROQ_API_KEY as string) || "";

  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("artham_is_logged_in") === "true");

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(localStorage.getItem("artham_is_logged_in") === "true");

      // Reload chat messages from cache (where firestore syncs them)
      const savedMessages = localStorage.getItem("artham_chat_messages");
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error("Error parsing chat messages:", e);
        }
      } else {
        setMessages([]);
      }

      // Reload vault files from cache (where firestore syncs them)
      const savedFiles = localStorage.getItem("artham_vault_files");
      if (savedFiles) {
        try {
          setVaultFiles(JSON.parse(savedFiles));
        } catch (e) {
          console.error("Error parsing vault files:", e);
        }
      } else {
        setVaultFiles(initialVaultFiles);
      }
    };
    window.addEventListener("auth-change", checkAuth);
    return () => window.removeEventListener("auth-change", checkAuth);
  }, []);
  
  // Listen for global 'start-new-chat' events and start a fresh conversation
  useEffect(() => {
    const handler = () => {
      setMessages([]);
      setDraft("");
      setTimeout(() => inputRef.current?.focus(), 60);
    };
    window.addEventListener("start-new-chat", handler as EventListener);
    return () => window.removeEventListener("start-new-chat", handler as EventListener);
  }, []);

  // Sync messages list to LocalStorage & Firestore on update
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("artham_chat_messages", JSON.stringify(messages));
    } else {
      localStorage.removeItem("artham_chat_messages");
    }
  }, [messages]);

  const currentSuggestions = allSuggestions.slice(promptOffset, promptOffset + 4);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modalMode, setModalMode] = useState<"configure" | "send">("send");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileMime, setFileMime] = useState<string>("");

  // Vault Form states
  const [valCategory, setValCategory] = useState<VaultFile["category"]>("Medical Report / Scan");
  const [valDate, setValDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [valAmount, setValAmount] = useState("");
  const [valNotes, setValNotes] = useState("");

  // Drawer / Detail states
  const [activeDetailedFile, setActiveDetailedFile] = useState<VaultFile | null>(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Voice integration states & refs
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: { msg: "Speech recognition is not supported in this browser. Try Chrome or Safari.", type: "error" }
      }));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      
      const activeLang = localStorage.getItem("artham_language") || "en";
      const localeMap: Record<string, string> = {
        en: "en-IN",
        hi: "hi-IN",
        mr: "mr-IN",
        kn: "kn-IN",
        bn: "bn-IN"
      };
      recognition.lang = localeMap[activeLang] || "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setDraft(prev => prev ? prev + " " + text : text);
        }
      };

      recognition.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const stripMarkdown = (text: string): string => {
    return text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/#/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/-\s+/g, "")
      .replace(/₹/g, "Rupees");
  };

  const toggleSpeakMessage = (index: number, text: string) => {
    if (!window.speechSynthesis) {
      window.dispatchEvent(new CustomEvent("show-toast", {
        detail: { msg: "Text-to-speech is not supported in this browser.", type: "error" }
      }));
      return;
    }

    if (speakingMsgIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const activeLang = localStorage.getItem("artham_language") || "en";
    const localeMap: Record<string, string> = {
      en: "en-IN",
      hi: "hi-IN",
      mr: "mr-IN",
      kn: "kn-IN",
      bn: "bn-IN"
    };
    utterance.lang = localeMap[activeLang] || "en-IN";

    const voices = window.speechSynthesis.getVoices();
    const targetLocale = localeMap[activeLang] || "en-IN";
    const matchingVoice = voices.find(voice => voice.lang.toLowerCase().replace("_", "-") === targetLocale.toLowerCase());
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => {
      setSpeakingMsgIndex(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgIndex(null);
    };

    setSpeakingMsgIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  // Sync files to localStorage when changed (central layer mirrors to Firestore)
  const updateVaultFilesState = (files: VaultFile[]) => {
    setVaultFiles(files);
    localStorage.setItem("artham_vault_files", JSON.stringify(files));
  };

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  // Esc key closes the drawer/modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDetailedFile(null);
        setShowUploadModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when drawer/modal is open
  useEffect(() => {
    if (activeDetailedFile || showUploadModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeDetailedFile, showUploadModal]);

  // Standard Text Chat Send
  const send = async (overrideText?: string) => {
    const text = (typeof overrideText === "string" ? overrideText : draft).trim();

    // If a document attachment is pending, open the modal form to complete metadata before recording and sending
    if (selectedUploadFile && !overrideText) {
      setModalMode("send");
      setShowUploadModal(true);
      return;
    }

    if (!text) return;

    const updatedMessages = [...messages, { role: "user", text } as Msg];
    setMessages(updatedMessages);
    setDraft("");
    setIsChatLoading(true);

    if (apiKey) {
      try {
        const aiResponse = await queryGroqChat(updatedMessages, apiKey, vaultFiles);

        // Extract a clinical badge from the AI response
        let extractedBadge = undefined;
        const surgeryMatch = aiResponse.match(/surgery|procedure|mastectomy|replacement|chemotherapy|radiation/i);
        if (surgeryMatch) {
          extractedBadge = `Extracted: Clinical Pathway Indicated`;
        }

        setMessages(m => [...m, {
          role: "bot",
          text: aiResponse,
          meta: extractedBadge
        }]);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setMessages(m => [...m, {
          role: "bot",
          text: `I encountered an issue connecting to the Groq API: ${errMsg}. Please verify your API key or try again in a few moments.`,
          isError: true
        }]);
      } finally {
        setIsChatLoading(false);
      }
    } else {
      // Demo Mock response if no API key is specified
      setTimeout(() => {
        setIsChatLoading(false);
        const lowerText = text.toLowerCase();
        let reply = "I have updated your profile context. Let me know if you need specific scheme or cost details.";
        let badge = undefined;

        if (lowerText.includes("hospital") || lowerText.includes("apollo") || lowerText.includes("max")) {
          reply = "Hospital setting updated. We will match this with empanelled insurers and apply room rent limits.";
          badge = "Extracted: Preference — Private Empanelled";
        } else if (lowerText.includes("cost") || lowerText.includes("price") || lowerText.includes("lakh")) {
          reply = "Cost quotation noted. This will be analyzed against critical illness policy ceilings.";
          badge = "Extracted: Cost Quote Captured";
        } else if (lowerText.includes("stage") || lowerText.includes("cancer") || lowerText.includes("heart")) {
          reply = "Severity status updated. This triggers national and state illness assistance (RAN) eligibility rules.";
          badge = "Extracted: Diagnosis Severity Updated";
        }

        setMessages(m => [...m, { role: "bot", text: reply, meta: badge }]);
      }, 1000);
    }
  };

  // Unified File attachment loader inside text input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedUploadFile(file);

      // Convert to base64 for images
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = reader.result as string;
        const base64Data = base64Str.split(",")[1];
        setFileBase64(base64Data);
        setFileMime(file.type);
      };

      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else {
        setFileBase64("");
        setFileMime("");
      }

      // Pre-fill categories
      setValCategory(
        file.name.toLowerCase().includes("bill") || file.name.toLowerCase().includes("quote")
          ? "Hospital Quote / Bill"
          : file.name.toLowerCase().includes("presc")
            ? "Doctor Prescription"
            : file.name.toLowerCase().includes("policy")
              ? "Insurance Policy"
              : "Medical Report / Scan"
      );
      setValDate(new Date().toISOString().split("T")[0]);
      setValAmount("");
      setValNotes("");
      setShowUploadModal(false);
    }
  };

  // Unified: Record File in Vault and Send to Chat for AI Analysis
  const handleRecordAndSend = async () => {
    if (!selectedUploadFile) return;

    const sizeStr = selectedUploadFile.size > 1024 * 1024
      ? `${(selectedUploadFile.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(selectedUploadFile.size / 1024).toFixed(0)} KB`;

    const newFile: VaultFile = {
      id: generateUniqueId(),
      name: selectedUploadFile.name,
      category: valCategory,
      date: valDate,
      amount: valAmount || undefined,
      notes: valNotes || undefined,
      size: sizeStr,
      base64Data: fileBase64 || undefined,
      mimeType: fileMime || undefined
    };

    // 1. Record document permanently in the repository
    const updatedFiles = [newFile, ...vaultFiles];
    updateVaultFilesState(updatedFiles);

    // 2. Clear pending uploader variables
    setShowUploadModal(false);
    setSelectedUploadFile(null);
    setFileBase64("");
    setFileMime("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    // 3. Construct chat message representing this file attachment
    const comment = draft.trim();
    const fileLabel = `📎 Attached Document: ${newFile.name} (${newFile.category})`;
    const textMessage = comment ? `${fileLabel}\n"${comment}"` : `${fileLabel}\nPlease extract and verify this diagnostic scan.`;

    const updatedMessages = [...messages, { role: "user", text: textMessage } as Msg];
    setMessages(updatedMessages);
    setDraft("");
    setIsChatLoading(true);

    // 4. Execute AI analysis
    if (apiKey) {
      try {
        const responseText = await analyzeDocumentWithGroq(newFile, apiKey);

        // Save the extracted results inside the permanent repository entry
        const finalFiles = updatedFiles.map(f => {
          if (f.id === newFile.id) {
            return { ...f, aiAnalysis: responseText };
          }
          return f;
        });
        updateVaultFilesState(finalFiles);

        setMessages(m => [...m, {
          role: "bot",
          text: responseText,
          meta: `Extracted: ${newFile.category} analyzed successfully`
        }]);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const errorText = `### **AI Extraction Error**
        
Failed to analyze document: ${errMsg}. 

*Please check that your Groq API Key is active, and ensure that the uploaded image size is under 4MB.*`;

        const finalFiles = updatedFiles.map(f => {
          if (f.id === newFile.id) {
            return { ...f, aiAnalysis: errorText };
          }
          return f;
        });
        updateVaultFilesState(finalFiles);

        setMessages(m => [...m, {
          role: "bot",
          text: `I encountered an issue analyzing ${newFile.name}: ${errMsg}. The file has been recorded in your Evidence Vault, and you can re-trigger analysis from there.`,
          isError: true
        }]);
      } finally {
        setIsChatLoading(false);
      }
    } else {
      // Demo mock analysis if no key is entered
      setTimeout(() => {
        setIsChatLoading(false);
        const mockResponse = `### **Artham AI Document Analysis (Demo Mode)**
        
*No API Key provided. Simulated extraction analysis for attached document:*

**1. Patient & Document Summary:**
* **Patient Profile Match:** 100% Verified
* **Extracted Document Category:** ${newFile.category}
* **Filename:** ${newFile.name}
* **Audit Date:** ${new Date().toLocaleDateString()}

**2. Clinical Insights:**
* Verified clinical relevance to planned surgical orthopedic pathways.
* Recommended clinical terms: osteophytes, severe subchondral sclerosis, joint replacement.
* Custom comments: ${newFile.notes || "None specified by user."}

**3. Financial Extracted Values:**
* **Line-item billing details:** ${newFile.amount ? `₹${newFile.amount} Captured` : "No billing cost declared. Please declare standard quote amount."}
* **Feasibility Score:** **High** (Documents verified under national database).
* Recommended next action: Attach this certificate to claims processing inside Artham Action Plan.`;

        const finalFiles = updatedFiles.map(f => {
          if (f.id === newFile.id) {
            return { ...f, aiAnalysis: mockResponse };
          }
          return f;
        });
        updateVaultFilesState(finalFiles);

        setMessages(m => [...m, {
          role: "bot",
          text: mockResponse,
          meta: `Extracted: ${newFile.category} simulated analysis`
        }]);
      }, 1500);
    }
  };

  // Trigger file analysis for existing vault files
  const runFileAnalysis = async (file: VaultFile) => {
    setIsAnalyzingFile(true);

    if (apiKey) {
      try {
        const responseText = await analyzeDocumentWithGroq(file, apiKey);
        const updatedFiles = vaultFiles.map(f => {
          if (f.id === file.id) {
            return { ...f, aiAnalysis: responseText };
          }
          return f;
        });
        updateVaultFilesState(updatedFiles);

        // Update active drawer details
        const found = updatedFiles.find(f => f.id === file.id);
        if (found) setActiveDetailedFile(found);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const errorText = `### **AI Extraction Error**
        
Failed to analyze document: ${errMsg}. 

*Please check that your Groq API Key is active, and ensure that the uploaded image size is under 4MB.*`;
        const updatedFiles = vaultFiles.map(f => {
          if (f.id === file.id) {
            return { ...f, aiAnalysis: errorText };
          }
          return f;
        });
        updateVaultFilesState(updatedFiles);
        const found = updatedFiles.find(f => f.id === file.id);
        if (found) setActiveDetailedFile(found);
      } finally {
        setIsAnalyzingFile(false);
      }
    } else {
      // Demo mock analysis
      setTimeout(() => {
        setIsAnalyzingFile(false);
        const mockResponse = `### **Artham AI Document Analysis (Demo Mode)**
        
*No API Key provided. Simulated extraction analysis for attached document:*

**1. Patient & Document Summary:**
* **Patient Profile Match:** 100% Verified
* **Extracted Document Category:** ${file.category}
* **Filename:** ${file.name}
* **Audit Date:** ${new Date().toLocaleDateString()}

**2. Clinical Insights:**
* Verified clinical relevance to planned surgical orthopedic pathways.
* Recommended clinical terms: osteophytes, severe subchondral sclerosis, joint replacement.
* Custom comments: ${file.notes || "None specified by user."}

**3. Financial Extracted Values:**
* **Line-item billing details:** ${file.amount ? `₹${file.amount} Captured` : "No billing cost declared. Please declare standard quote amount."}
* **Feasibility Score:** **High** (Documents verified under national database).
* Recommended next action: Attach this certificate to claims processing inside Artham Action Plan.`;

        const updatedFiles = vaultFiles.map(f => {
          if (f.id === file.id) {
            return { ...f, aiAnalysis: mockResponse };
          }
          return f;
        });
        updateVaultFilesState(updatedFiles);
        const found = updatedFiles.find(f => f.id === file.id);
        if (found) setActiveDetailedFile(found);
      }, 1500);
    }
  };

  // Delete file from repository
  const deleteFile = (id: string) => {
    const updated = vaultFiles.filter(f => f.id !== id);
    updateVaultFilesState(updated);
    setActiveDetailedFile(null);
  };

  return (
    <AppShell>
      <div className="h-[calc(100vh-64px)] flex flex-col bg-surface-bright relative w-full overflow-hidden">

        {/* Chat Header Bar */}
        <header className="px-md py-sm border-b border-outline-variant/40 bg-surface-container-low flex justify-between items-center shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">medical_services</span>
            <span className="font-headline-sm text-sm font-bold text-on-surface">{t("nav_medical")}</span>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("start-new-chat"))}
            disabled={messages.length === 0 && !draft}
            className="flex items-center gap-xs px-3 py-1.5 rounded-full border border-outline-variant bg-surface-bright text-on-surface hover:bg-surface-container hover:border-primary/40 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="New Chat"
            aria-label="New Chat"
          >
            <span className="material-symbols-outlined text-[18px]">add_comment</span>
            <span>New Chat</span>
          </button>
        </header>

        {/* Scrollable Conversation Workspace */}
        <div
          className="flex-grow overflow-y-auto px-4 py-6 md:px-8 space-y-md custom-scrollbar bg-surface-bright/20 flex flex-col relative"
          role="log"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            /* Centered Welcome Landing State */
            <div className="flex-grow flex flex-col items-center justify-center py-6 max-w-3xl mx-auto w-full animate-fade-in my-auto">

              {/* Glossy Logo Orb */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary via-surface-tint to-primary shadow-xl relative overflow-hidden flex items-center justify-center border border-white/20 mb-6 shrink-0">
                <div className="absolute top-1 left-2 w-12 h-6 bg-white/25 rounded-full blur-[1px] rotate-[-15deg]"></div>
                <span className="material-symbols-outlined text-[36px] text-white/90">neurology</span>
              </div>

              {/* Greeting */}
              <h2 className="font-headline-lg text-2xl md:text-3xl text-on-surface font-semibold tracking-tight text-center mb-2">
                {t("mi_welcome")}
              </h2>
              <h3 className="font-headline-md text-xl md:text-2xl text-on-surface-variant font-medium tracking-tight text-center mb-4">
                {t("mi_welcome_sub")}
              </h3>
              <p className="text-xs md:text-sm text-outline text-center mb-8 max-w-md">
                {t("mi_welcome_desc")}
              </p>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-3xl mb-4">
                {currentSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => send(s.text)}
                    className="p-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low hover:border-outline transition-all text-left text-sm group shadow-sm flex flex-col justify-between h-24"
                  >
                    <span className="text-on-surface leading-normal text-xs md:text-sm">
                      <strong className="text-primary font-bold">{s.bold}</strong>{s.normal}
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[18px] self-end mt-1">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>

              {/* Refresh Prompts button */}
              <button
                onClick={() => setPromptOffset((prev) => (prev + 4) % allSuggestions.length)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant/80 bg-surface-bright text-outline hover:text-on-surface hover:bg-surface-container transition-all text-xs font-bold shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Refresh prompts</span>
              </button>
            </div>
          ) : (
            /* Chat Messages scroll area thread */
            <div className="max-w-3xl w-full mx-auto space-y-md pb-40">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-sm max-w-[85%] ${m.role === "user" ? "self-end flex-row-reverse ml-auto" : ""
                    }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${m.role === "user"
                        ? "bg-secondary/15 text-secondary border border-secondary/20"
                        : "bg-primary/10 text-primary border border-primary/20"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {m.role === "user" ? "person" : "neurology"}
                    </span>
                  </div>
                  <div
                    className={`p-md shadow-sm rounded-2xl ${m.role === "user"
                        ? "bg-primary text-on-primary rounded-tr-none whitespace-pre-line leading-relaxed font-body-md"
                        : `bg-surface-container-lowest rounded-tl-none border border-outline-variant/40 leading-relaxed font-body-md ${m.isError ? "border-l-4 border-l-error bg-error-container/10 text-error-container" : ""
                        } ${m.meta ? "border-l-4 border-l-secondary bg-surface-container font-medium" : ""
                        }`
                      }`}
                  >
                    <div className="leading-relaxed text-sm">
                      <MarkdownRenderer text={m.text} role={m.role} />
                    </div>

                    {m.role === "bot" && !m.isError && (
                      <div className="mt-sm pt-sm border-t border-outline-variant/20 flex justify-end">
                        <button
                          type="button"
                          onClick={() => toggleSpeakMessage(i, m.text)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            speakingMsgIndex === i
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-outline hover:text-primary hover:bg-primary/5"
                          }`}
                          title={speakingMsgIndex === i ? "Stop playback" : "Listen to response"}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {speakingMsgIndex === i ? "volume_off" : "volume_up"}
                          </span>
                          <span>{speakingMsgIndex === i ? "Stop" : "Listen"}</span>
                        </button>
                      </div>
                    )}

                    {m.meta && (
                      <div className="mt-sm pt-sm border-t border-outline-variant/40 flex items-center gap-xs text-secondary font-bold text-xs">
                        <span className="material-symbols-outlined text-sm active-entity-pulse">auto_awesome</span>
                        {m.meta}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Loader Indicator */}
              {isChatLoading && (
                <div className="flex gap-sm max-w-[85%]">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/20 animate-pulse">
                    <span className="material-symbols-outlined text-[18px]">neurology</span>
                  </div>
                  <div className="p-md shadow-sm rounded-2xl rounded-tl-none bg-surface-container border border-outline-variant/40 flex items-center gap-xs">
                    <span className="w-2.5 h-2.5 bg-outline rounded-full animate-bounce delay-100" />
                    <span className="w-2.5 h-2.5 bg-outline rounded-full animate-bounce delay-200" />
                    <span className="w-2.5 h-2.5 bg-outline rounded-full animate-bounce delay-300" />
                    <span className="text-[11px] font-bold text-outline uppercase pl-xs tracking-wider animate-pulse">Analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Floating Textfield Input Area at bottom center */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-surface-bright via-surface-bright/95 to-transparent pt-8 pb-4 px-4 z-30">
          <div className="max-w-3xl mx-auto relative">

            {/* Embedded Evidence Vault Popover Panel */}
            {isVaultOpen && (
              <div className="absolute bottom-[calc(100%+12px)] left-0 right-0 bg-surface-container-lowest border border-outline-variant/80 rounded-2xl shadow-xl z-40 p-md flex flex-col max-h-[320px] overflow-hidden animate-slide-up">

                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-sm mb-sm shrink-0">
                  <h4 className="font-headline-sm text-sm text-primary flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary text-[20px]">folder_open</span>
                    {t("mi_evidence")}
                  </h4>
                  <div className="flex items-center gap-xs">
                    <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {vaultFiles.length} Documents
                    </span>
                    <button
                      onClick={() => setIsVaultOpen(false)}
                      className="p-1.5 hover:bg-surface-container rounded-full text-outline hover:text-on-surface transition-all flex items-center justify-center"
                      aria-label="Close Evidence Vault Popover"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>

                {!isLoggedIn && (
                  <div className="p-2 mb-2 bg-primary/5 border border-primary/20 rounded-xl flex justify-between items-center text-[10px] text-on-surface-variant gap-xs shrink-0 mx-1 animate-fade-in">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-[14px]">info</span>
                      <span>Guest mode: Reports are saved in browser cache only.</span>
                    </span>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent("open-auth"))}
                      className="text-primary font-bold hover:underline shrink-0"
                    >
                      Backup
                    </button>
                  </div>
                )}

                {/* Scrollable Document List inside Popover */}
                <div className="flex-grow overflow-y-auto space-y-sm pr-xs custom-scrollbar">
                  {vaultFiles.length > 0 ? (
                    vaultFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => {
                          setActiveDetailedFile(file);
                          setIsVaultOpen(false); // Close vault list when detail drawer opens
                        }}
                        className="flex items-center justify-between p-sm bg-surface-container-low rounded-xl border border-outline-variant/50 hover:bg-surface-container transition-all hover:border-outline-variant cursor-pointer group shadow-sm animate-fade-in focus-visible:ring-2 focus-visible:ring-primary outline-none"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActiveDetailedFile(file);
                            setIsVaultOpen(false);
                          }
                        }}
                        aria-label={`View details for ${file.name} - ${file.category}`}
                      >
                        <div className="flex items-center gap-sm min-w-0">
                          <div className="bg-primary/5 p-2 rounded-lg text-primary border border-primary/10 shrink-0">
                            <span className="material-symbols-outlined text-[18px]">
                              {file.category === "Hospital Quote / Bill"
                                ? "receipt"
                                : file.category === "Doctor Prescription"
                                  ? "clinical_notes"
                                  : file.category === "Insurance Policy"
                                    ? "shield"
                                    : "description"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-label-md text-on-surface font-bold truncate group-hover:text-primary transition-colors text-xs">
                              {file.name}
                            </p>
                            <p className="text-[9px] text-outline flex items-center gap-xs mt-0.5">
                              <span>{file.category}</span>
                              <span>•</span>
                              <span>{file.size}</span>
                              {file.amount && (
                                <>
                                  <span>•</span>
                                  <span className="font-bold text-secondary">₹{file.amount}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-xs pr-1 shrink-0">
                          {file.aiAnalysis ? (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold rounded-full flex items-center gap-[2px]">
                              <span className="material-symbols-outlined text-[9px]">auto_awesome</span>
                              AI AUDITED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-surface-container-highest text-outline text-[9px] font-bold rounded-full">
                              RECORDED
                            </span>
                          )}
                          <span className="material-symbols-outlined text-outline group-hover:text-on-surface transition-colors text-[18px]">
                            chevron_right
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-xl border border-dashed border-outline-variant/60 rounded-xl bg-surface-container-low text-outline text-xs">
                      No evidence uploaded yet. Add bills/reports.
                    </div>
                  )}
                </div>

                {/* Upload Button in Popover */}
                <div className="pt-sm border-t border-outline-variant/20 mt-sm shrink-0">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-xs p-2 rounded-xl border border-dashed border-primary text-xs font-bold text-primary hover:bg-primary/5 transition-all w-full active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    Upload New Evidence Document
                  </button>
                </div>

              </div>
            )}

            {/* Hidden native uploader */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />

            {/* ChatGPT / Claude style Input Bar Container */}
            <div
              className="bg-surface-container-lowest border border-outline-variant/80 rounded-3xl p-sm flex flex-col gap-xs focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all shadow-md relative"
              role="form"
            >
              {/* Pending Upload Attachment Pill */}
              {selectedUploadFile && (
                <div className="flex items-center gap-xs bg-primary/5 border border-primary/20 rounded-xl px-sm py-2 max-w-sm m-xs animate-fade-in">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {valCategory === "Hospital Quote / Bill"
                      ? "receipt"
                      : valCategory === "Doctor Prescription"
                        ? "clinical_notes"
                        : valCategory === "Insurance Policy"
                          ? "shield"
                          : "description"}
                  </span>
                  <div className="min-w-0 flex-grow">
                    <p className="font-label-sm text-[11px] text-on-surface font-semibold truncate leading-none">{selectedUploadFile.name}</p>
                    <p className="text-[9px] text-outline leading-none mt-1">Pending Attachment • {valCategory}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUploadFile(null);
                      setFileBase64("");
                      setFileMime("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1 hover:bg-primary/10 rounded-full text-outline hover:text-on-surface transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary"
                    title="Discard attachment"
                    aria-label="Discard attachment"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}

              {/* Text Input Area */}
              <div className="flex items-end gap-sm pl-xs pr-xs">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  ref={inputRef}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  className="w-full bg-transparent border-0 focus:ring-0 outline-none resize-none font-body-md py-sm text-on-surface min-h-[44px] max-h-[140px] leading-relaxed placeholder-on-surface-variant/70 focus-visible:ring-0 text-sm"
                  placeholder={selectedUploadFile ? t("mi_placeholder_doc") : t("mi_placeholder_chat")}
                  rows={1}
                  disabled={isChatLoading}
                  aria-label="Chat input query"
                />
              </div>

              {/* Lower Toolbar inside input box */}
              <div className="flex justify-between items-center px-xs pt-xs border-t border-outline-variant/20">

                {/* Left: Attachment triggers & Vault toggle */}
                <div className="flex items-center gap-xs">
                  {/* File Upload Trigger */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isChatLoading}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-primary hover:bg-primary/5 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary"
                    title="Attach clinical document (Reports, Bills, Prescriptions)"
                    aria-label="Attach clinical document"
                  >
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                  </button>

                  {/* Evidence Vault Popover Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsVaultOpen(!isVaultOpen)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary active:scale-95 ${isVaultOpen
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline-variant/80 bg-surface-bright text-on-surface-variant hover:bg-surface-container"
                      }`}
                    title="Toggle Clinical Evidence Vault Popover"
                    aria-label="Toggle Clinical Evidence Vault Popover"
                  >
                    <span className="material-symbols-outlined text-[16px]">folder_open</span>
                    <span>Vault ({vaultFiles.length})</span>
                  </button>

                  {/* Configure Attachment Button if file is selected */}
                  {selectedUploadFile && (
                    <button
                      onClick={() => {
                        setModalMode("configure");
                        setShowUploadModal(true);
                      }}
                      className="px-2.5 py-1 bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 text-[10px] font-bold rounded-lg flex items-center gap-[2px] transition-all focus-visible:ring-2 focus-visible:ring-primary"
                      title="Edit document category or metadata"
                    >
                      <span className="material-symbols-outlined text-[10px]">edit</span>
                      Configure File
                    </button>
                  )}
                </div>

                {/* Right: Send & Voice buttons */}
                <div className="flex items-center gap-xs">
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    disabled={isChatLoading}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary ${
                      isListening
                        ? "bg-error text-on-error hover:brightness-110 shadow-md animate-pulse"
                        : "text-outline hover:text-primary hover:bg-primary/5 border border-outline-variant/40"
                    }`}
                    title={isListening ? "Stop listening" : "Voice input"}
                    aria-label="Toggle voice input"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isListening ? "mic_off" : "mic"}
                    </span>
                  </button>

                  <button
                    onClick={() => send()}
                    disabled={isChatLoading || (!draft.trim() && !selectedUploadFile)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary ${(draft.trim() || selectedUploadFile) && !isChatLoading
                        ? "bg-primary text-on-primary hover:brightness-110 shadow-md animate-pulse"
                        : "bg-surface-container text-outline cursor-not-allowed border border-outline-variant/40"
                      }`}
                    aria-label="Submit message"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Helper Footer Text */}
            <div className="flex justify-between items-center text-[10px] text-outline mt-2 px-sm">
              <span>Artham can make mistakes. Please double-check responses.</span>
              <span className="hidden sm:inline">Use shift + return for new line</span>
            </div>

          </div>
        </div>

      </div>

      {/* 1. File Upload details capture modal */}
      {showUploadModal && selectedUploadFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-on-surface/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-bright border border-outline-variant/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-md md:p-lg border-b border-outline-variant/40 bg-surface-container-low flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">assignment</span>
                Document Evidence Form
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  if (modalMode === "send") {
                    setSelectedUploadFile(null);
                    setFileBase64("");
                    setFileMime("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }
                }}
                className="p-2 hover:bg-surface-container-high rounded-full text-outline hover:text-on-surface transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close form"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-md md:p-lg space-y-md max-h-[460px] overflow-y-auto custom-scrollbar">
              <div className="bg-primary/5 p-sm rounded-xl border border-primary/20">
                <p className="text-[10px] uppercase font-bold text-outline tracking-wider leading-none">Selected Document File</p>
                <p className="font-label-md text-label-md text-on-surface font-semibold mt-1 truncate">{selectedUploadFile.name}</p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Size: {(selectedUploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>

              {/* Form Input fields */}
              <div className="space-y-sm">
                <div className="flex flex-col gap-xs">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Document Category</label>
                  <select
                    value={valCategory}
                    onChange={(e) => setValCategory(e.target.value as VaultFile["category"])}
                    className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none cursor-pointer focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="Medical Report / Scan">Medical Report / Scan (e.g. MRI, Biopsy)</option>
                    <option value="Doctor Prescription">Doctor Prescription</option>
                    <option value="Hospital Quote / Bill">Hospital Quote / Bill</option>
                    <option value="Insurance Policy">Insurance Policy</option>
                    <option value="Income Certificate">Income Certificate</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-sm">
                  <div className="flex flex-col gap-xs">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Document Date</label>
                    <input
                      type="date"
                      value={valDate}
                      onChange={(e) => setValDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Amount in INR (Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 125000"
                      value={valAmount}
                      onChange={(e) => setValAmount(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Custom Notes / Findings</label>
                  <textarea
                    rows={3}
                    placeholder="Provide a brief summary or notes regarding this diagnostic file..."
                    value={valNotes}
                    onChange={(e) => setValNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-md md:p-lg border-t border-outline-variant/40 bg-surface-container-low flex justify-end gap-sm">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  if (modalMode === "send") {
                    setSelectedUploadFile(null);
                    setFileBase64("");
                    setFileMime("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }
                }}
                className="px-lg py-2.5 border border-outline text-outline hover:bg-surface-container rounded-xl font-label-md text-label-md active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary"
              >
                Cancel
              </button>

              {modalMode === "configure" ? (
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-lg py-2.5 bg-primary text-on-primary hover:brightness-110 rounded-xl font-label-md text-label-md shadow-md active:scale-95 transition-all flex items-center gap-xs focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">done</span>
                  Save Details
                </button>
              ) : (
                <button
                  onClick={handleRecordAndSend}
                  className="px-lg py-2.5 bg-primary text-on-primary hover:brightness-110 rounded-xl font-label-md text-label-md shadow-md active:scale-95 transition-all flex items-center gap-xs focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Record & Ask AI
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Groq API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-on-surface/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-bright border border-outline-variant/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-md md:p-lg border-b border-outline-variant/40 bg-surface-container-low flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">vpn_key</span>
                Groq API Configuration
              </h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-2 hover:bg-surface-container-high rounded-full text-outline hover:text-on-surface transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close API Key Configuration"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-md md:p-lg space-y-md">
              <p className="text-xs text-outline leading-relaxed">
                By default, Artham loads the Groq API key from the environment variable <code>VITE_GROQ_API_KEY</code>. You can also paste your key below to save it in your browser cache.
              </p>

              {/* Status Indicator */}
              <div className={`p-sm rounded-xl border flex items-start gap-sm text-xs ${import.meta.env.VITE_GROQ_API_KEY
                  ? "bg-secondary/10 border-secondary/20 text-on-secondary-container"
                  : customApiKey
                    ? "bg-primary/10 border-primary/20 text-on-primary-container"
                    : "bg-tertiary/10 border-tertiary/20 text-on-tertiary-container"
                }`}>
                <span className="material-symbols-outlined mt-0.5 text-[18px]">
                  {import.meta.env.VITE_GROQ_API_KEY || customApiKey ? "check_circle" : "info"}
                </span>
                <div>
                  <p className="font-bold">
                    {import.meta.env.VITE_GROQ_API_KEY
                      ? "Using Key from Environment (.env)"
                      : customApiKey
                        ? "Using Key from Browser Storage"
                        : "Currently in Demo Mock Mode"}
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {import.meta.env.VITE_GROQ_API_KEY
                      ? "VITE_GROQ_API_KEY is configured in the project environment variables."
                      : customApiKey
                        ? "A custom key is stored locally in this browser."
                        : "No key found. AI features will use pre-recorded simulated responses."}
                  </p>
                </div>
              </div>

              {/* Key Input */}
              <div className="space-y-xs">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                  Groq API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-outline text-[18px] pointer-events-none">
                    vpn_key
                  </span>
                </div>
                <p className="text-[10px] text-outline pl-1">
                  Your key is sent directly to the Groq API and is never uploaded to external servers.
                </p>
              </div>
            </div>

            <div className="p-md md:p-lg border-t border-outline-variant/40 bg-surface-container-low flex justify-end gap-sm">
              {customApiKey && (
                <button
                  onClick={() => {
                    localStorage.removeItem("groq_api_key");
                    setCustomApiKey("");
                    setTempKey("");
                    setShowKeyModal(false);
                  }}
                  className="px-md py-2.5 rounded-xl text-xs font-bold text-error border border-error-container hover:bg-error/5 transition-all"
                >
                  Clear Custom Key
                </button>
              )}
              <button
                onClick={() => {
                  setShowKeyModal(false);
                }}
                className="px-md py-2.5 rounded-xl text-xs font-bold text-outline hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("groq_api_key", tempKey.trim());
                  setCustomApiKey(tempKey.trim());
                  setShowKeyModal(false);
                }}
                className="px-lg py-2.5 bg-primary text-on-primary hover:brightness-110 rounded-xl font-label-md text-label-md shadow-md active:scale-95 transition-all"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Slide-over Detailed Evidence Drawer / Modal */}
      {activeDetailedFile && (
        <div className="fixed inset-0 z-50 flex justify-end transition-all duration-300">

          {/* Backdrop glassmorphic */}
          <div
            onClick={() => setActiveDetailedFile(null)}
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          />

          {/* Panel Container */}
          <div className="relative w-full max-w-2xl bg-surface-bright h-full shadow-2xl flex flex-col justify-between border-l border-outline-variant/40 animate-slide-in overflow-hidden">

            {/* Header */}
            <div className="p-md md:p-lg border-b border-outline-variant/40 flex justify-between items-start bg-surface-container-low">
              <div className="flex-grow pr-sm">
                <div className="flex items-center gap-sm mb-sm flex-wrap">
                  <span className="px-3 py-1 text-[12px] rounded-full font-label-sm bg-primary-container text-on-primary-container font-bold">
                    {activeDetailedFile.category}
                  </span>
                  <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-[12px] font-semibold flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    Date: {activeDetailedFile.date}
                  </span>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[12px] font-semibold flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]">data_usage</span>
                    Size: {activeDetailedFile.size}
                  </span>
                </div>
                <h2 className="font-headline-md text-headline-md text-primary leading-tight truncate max-w-lg">
                  {activeDetailedFile.name}
                </h2>
              </div>
              <button
                onClick={() => setActiveDetailedFile(null)}
                className="p-2 hover:bg-surface-container-high rounded-full text-outline hover:text-on-surface transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Close details"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Scrollable details container */}
            <div className="p-md md:p-lg overflow-y-auto flex-grow space-y-md custom-scrollbar">

              {/* Document Image Preview (if image base64 data exists) */}
              {activeDetailedFile.base64Data && (
                <div className="border border-outline-variant/50 rounded-2xl overflow-hidden bg-surface-container-lowest max-h-[220px] flex items-center justify-center p-sm shadow-sm relative group">
                  <img
                    src={`data:${activeDetailedFile.mimeType || 'image/png'};base64,${activeDetailedFile.base64Data}`}
                    alt="Clinical document preview"
                    className="max-h-[200px] w-auto rounded-xl object-contain shadow-md hover:scale-[1.02] transition-transform"
                  />
                  <div className="absolute top-2 right-2 bg-on-surface/60 text-surface-bright px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    Image Scan Preview
                  </div>
                </div>
              )}

              {/* Form Metadata info */}
              <div className="bg-surface-container-low p-md rounded-2xl border border-outline-variant/50 grid grid-cols-1 sm:grid-cols-3 gap-sm">
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider leading-none">Document Type</p>
                  <p className="font-label-md text-label-md text-on-surface font-semibold mt-1">{activeDetailedFile.category}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider leading-none">Audit Date</p>
                  <p className="font-label-md text-label-md text-on-surface font-semibold mt-1">{activeDetailedFile.date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider leading-none">Declared Cost</p>
                  <p className="font-label-md text-label-md text-secondary font-semibold mt-1">
                    {activeDetailedFile.amount ? `₹${activeDetailedFile.amount}` : "None"}
                  </p>
                </div>
              </div>

              {/* User custom notes */}
              {activeDetailedFile.notes && (
                <div className="space-y-xs pl-sm border-l-4 border-l-secondary">
                  <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider">User description notes:</h4>
                  <p className="font-body-md text-on-surface-variant leading-relaxed">{activeDetailedFile.notes}</p>
                </div>
              )}

              {/* Groq AI Clinical Audit Panel */}
              <div className="border-t border-outline-variant/40 pt-md">
                {isAnalyzingFile ? (
                  /* Loading extraction skeleton */
                  <div className="bg-primary/5 p-md rounded-2xl border border-primary/20 space-y-md animate-pulse">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-primary text-[20px] animate-spin">sync</span>
                      <h4 className="font-label-md text-primary font-bold uppercase tracking-wider">Artham AI Document Auditing...</h4>
                    </div>
                    <div className="space-y-sm">
                      <div className="h-4 bg-outline-variant rounded w-3/4" />
                      <div className="h-4 bg-outline-variant rounded w-5/6" />
                      <div className="h-4 bg-outline-variant rounded w-2/3" />
                      <div className="h-4 bg-outline-variant rounded w-1/2" />
                    </div>
                  </div>
                ) : activeDetailedFile.aiAnalysis ? (
                  /* Output extracted audit */
                  <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-surface-container-lowest border border-primary/20 rounded-2xl p-md shadow-inner relative overflow-hidden">
                    <div className="absolute top-2 right-2 px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold rounded-full flex items-center gap-[2px]">
                      <span className="material-symbols-outlined text-[10px] active-entity-pulse">auto_awesome</span>
                      AI AUDITED
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none text-on-surface leading-relaxed text-sm">
                      <MarkdownRenderer text={activeDetailedFile.aiAnalysis || ""} />
                    </div>
                  </div>
                ) : (
                  /* Trigger Analysis Prompt Box */
                  <div className="bg-surface-container-low p-md rounded-2xl border border-dashed border-outline-variant/60 flex flex-col items-center justify-center gap-sm text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <div>
                      <h4 className="font-label-md text-on-surface font-semibold">Groq AI Document Extractor</h4>
                      <p className="text-xs text-outline mt-xs max-w-md">
                        Trigger Groq AI to analyze the document details. Artham will parse diagnostic findings, verify claims compatibility, and extract billing cost values.
                      </p>
                    </div>

                    <button
                      onClick={() => runFileAnalysis(activeDetailedFile)}
                      className="px-lg py-2.5 bg-primary text-on-primary hover:brightness-110 rounded-xl font-label-md text-label-md shadow-md active:scale-95 transition-all flex items-center gap-xs focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      Analyze Document with Artham AI
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom actions footer */}
            <div className="p-md md:p-lg border-t border-outline-variant/40 bg-surface-container-low flex justify-between gap-sm items-stretch">
              <button
                onClick={() => deleteFile(activeDetailedFile.id)}
                className="flex-grow flex items-center justify-center gap-xs px-md py-3 rounded-xl font-label-md text-label-md transition-all active:scale-[0.98] shadow-sm bg-error-container/10 border border-error-container text-error-container hover:bg-error-container/20 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete Document
              </button>

              <button
                onClick={() => setActiveDetailedFile(null)}
                className="flex-grow flex items-center justify-center gap-xs px-md py-3 rounded-xl font-label-md text-label-md transition-all active:scale-[0.98] shadow-sm bg-primary text-on-primary hover:bg-primary/95 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="material-symbols-outlined text-[18px]">done</span>
                Confirm & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
