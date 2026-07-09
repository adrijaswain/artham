import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { auth, saveUserCustomBreakdownToFirestore } from "../firebase";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { useLanguage } from "../components/LanguageContext";

type Item = { 
  title: string; 
  body: string; 
  estimate: string; 
  insurance: string; 
  oop: string;
  key: string;
  customNote?: string;
  isExcluded?: boolean;
  isHighlighted?: boolean;
};

const queryBreakdownPersonalizer = async (
  userMessage: string,
  patientState: string,
  age: string,
  stage: string,
  hormoneStatus: string,
  surgery: string,
  chemo: string,
  radiation: string,
  hospitalType: string,
  insurance: string,
  incomeBracket: string,
  apiKey: string,
  modelName: string
): Promise<{ reply: string; parsed: Record<string, unknown> }> => {
  const lang = localStorage.getItem("artham_language") || "en";
  const languageNames: Record<string, string> = {
    en: "English",
    hi: "Hindi (हिन्दी)",
    mr: "Marathi (मराठी)",
    kn: "Kannada (ಕನ್ನಡ)",
    bn: "Bengali (বাঙালি)"
  };
  const activeLanguageName = languageNames[lang] || "English";

  const systemPrompt = `You are the Artham pricing navigator.
Your task is to analyze the user's clinical update and adjust their cost breakdown sheet accordingly.
Below is the patient's current profile:
- State: ${patientState}
- Age: ${age}
- Stage: ${stage}
- Hormone Status: ${hormoneStatus}
- Surgery: ${surgery}
- Chemotherapy: ${chemo}
- Radiation: ${radiation}
- Hospital: ${hospitalType}
- Insurance: ${insurance}
- Income Bracket: ${incomeBracket}

Based on the user's message, determine which cost breakdown items are relevant, which are not needed (N/A), and write any short custom notes.

You must only use the following item keys for your classification:
- Diagnostics: 'mammogram', 'ultrasound', 'biopsy', 'histopathology', 'ihc', 'bloodTests', 'pet', 'mri'
- Surgery: 'lumpectomy', 'slnb', 'mastectomy', 'alnd', 'reconstruction'
- Therapies: 'chemotherapy', 'radiation', 'hormonal', 'targeted', 'immunotherapy'

Respond in the exact format:
[REPLY] <empathetic explanation in 1-2 sentences of the personalization changes made in the ${activeLanguageName} language> [JSON] {"relevantItems": ["<key1>", "<key2>"], "notNeeded": ["<key3>"], "customNotes": {"<key1>": "<short note>"}}

Ensure the JSON is completely valid and uses only keys from the list above. Do not include raw markdown block wrappers (\`\`\`json) for the JSON part. The [JSON] portion must be in English.`;

  const payload = {
    contents: [{
      parts: [
        { text: systemPrompt },
        { text: `User Clinical Update: "${userMessage}"` }
      ]
    }]
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Request failed");
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  const replyIndex = rawText.indexOf("[REPLY]");
  const jsonIndex = rawText.indexOf("[JSON]");
  
  if (replyIndex === -1 || jsonIndex === -1) {
    throw new Error("Invalid format from model response");
  }

  const reply = rawText.slice(replyIndex + 7, jsonIndex).trim();
  const jsonStr = rawText.slice(jsonIndex + 6).trim();
  
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON part:", jsonStr, e);
    throw new Error("JSON parsing error", { cause: e });
  }

  return { reply, parsed };
};

const chatbotWelcomeMessages: Record<string, { personalized: string; default: string }> = {
  en: {
    personalized: "Hello! I am Artham's pricing navigator. Your cost breakdown is currently personalized based on your updates. You can clear overrides using the Reset button at any time.",
    default: "Hello! I am Artham's pricing navigator. Tell me more about your planned treatments (e.g., surgery type, prescribed therapies) and I will customize the cost breakdown sheet for you."
  },
  hi: {
    personalized: "नमस्ते! मैं अर्थम का मूल्य निर्धारण नेविगेटर हूँ। आपके अपडेट के आधार पर आपका लागत विवरण वर्तमान में व्यक्तिगत है। आप किसी भी समय रीसेट बटन का उपयोग करके अधिलेख साफ़ कर सकते हैं।",
    default: "नमस्ते! मैं अर्थम का मूल्य निर्धारण नेविगेटर हूँ। मुझे अपने नियोजित उपचारों (जैसे, सर्जरी प्रकार, निर्धारित उपचार) के बारे में अधिक बताएं और मैं आपके लिए लागत विवरण पत्रक को अनुकूलित करूँगा।"
  },
  mr: {
    personalized: "नमस्कार! मी अर्थमचा खर्च मार्गदर्शक आहे. तुमच्या अपडेट्सच्या आधारे तुमचे खर्चाचे तपशील सध्या वैयक्तिकृत केले आहेत. तुम्ही कोणत्याही वेळी रीसेट बटण वापरून बदल रद्द करू शकता.",
    default: "नमस्कार! मी अर्थमचा खर्च मार्गदर्शक आहे. मला तुमच्या नियोजित उपचारांबद्दल (उदा. शस्त्रक्रियेचा प्रकार, विहित उपचार) अधिक सांगा आणि मी तुमच्यासाठी खर्चाचे तपशील वैयक्तिकृत करेन."
  },
  kn: {
    personalized: "ನಮಸ್ಕಾರ! ನಾನು ಅರ್ಥಮ್ ಅವರ ಬೆಲೆ ಮಾರ್ಗದರ್ಶಿ. ನಿಮ್ಮ ನವೀಕರಣಗಳ ಆಧಾರದ ಮೇಲೆ ನಿಮ್ಮ ವೆಚ್ಚದ ವಿವರಗಳನ್ನು ಪ್ರಸ್ತುತ ವೈಯಕ್ತಿಕಗೊಳಿಸಲಾಗಿದೆ. ನೀವು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ರಿಸೆಟ್ ಬಟನ್ ಬಳಸಿ ಬದಲಾವಣೆಗಳನ್ನು ತೆರವುಗೊಳಿಸಬಹುದು.",
    default: "ನಮಸ್ಕಾರ! ನಾನು ಅರ್ಥಮ್ ಅವರ ಬೆಲೆ ಮಾರ್ಗದರ್ಶಿ. ನಿಮ್ಮ ಯೋಜಿತ ಚಿಕಿತ್ಸೆಗಳ ಬಗ್ಗೆ (ಉದಾಹರಣೆಗೆ, ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ಪ್ರಕಾರ, ಸೂಚಿಸಲಾದ ಚಿಕಿತ್ಸೆಗಳು) ನನಗೆ ಇನ್ನಷ್ಟು ತಿಳಿಸಿ ಮತ್ತು ನಾನು ನಿಮಗಾಗಿ ವೆಚ್ಚದ ವಿವರಗಳ ಹಾಳೆಯನ್ನು ಕಸ್ಟಮೈಸ್ ಮಾಡುತ್ತೇನೆ."
  },
  bn: {
    personalized: "হ্যালো! আমি অর্থম-এর মূল্য নির্ধারণ নির্দেশক। আপনার আপডেটের উপর ভিত্তি করে আপনার খরচের বিবরণ বর্তমানে ব্যক্তিগতকৃত করা হয়েছে। আপনি যেকোনো সময় রিসেট বোতাম ব্যবহার করে পরিবর্তনগুলি মুছে ফেলতে পারেন।",
    default: "হ্যালো! আমি অর্থম-এর মূল্য নির্ধারণ নির্দেশক। আপনার পরিকল্পিত চিকিৎসা সম্পর্কে (যেমন, অস্ত্রোপচারের ধরণ, নির্ধারিত থেরাপি) আমাকে আরও বলুন এবং আমি আপনার জন্য খরচের বিবরণ তালিকাটি কাস্টমাইজ করব।"
  }
};

const mockReplies: Record<string, Record<string, string>> = {
  en: {
    default: "I've personalized your cost breakdown list by prioritizing and filtering items accordingly.",
    surgery: "Updated your surgical pathway to focus on a Lumpectomy and Sentinel Lymph Node Biopsy, and marked Mastectomy as not needed.",
    chemo: "Understood. Chemotherapy cycles and day-care fees have been excluded from the cost estimate sheet.",
    targeted: "Prioritized targeted antibody therapy (Trastuzumab) on your active maintenance roadmap."
  },
  hi: {
    default: "मैंने तदनुसार वस्तुओं को प्राथमिकता देकर और फ़िल्टर करके आपकी लागत विभाजन सूची को व्यक्तिगत बना दिया है।",
    surgery: "लम्पेक्टॉमी और सेंटिनल लिम्फ नोड बायोप्सी पर ध्यान केंद्रित करने के लिए आपके सर्जिकल मार्ग को अपडेट किया गया है, और मास्टेक्टॉमी को अपवर्जित चिह्नित किया गया है।",
    chemo: "समझ गया। कीमोथेरेपी चक्र और डे-केयर शुल्क को लागत अनुमान पत्रक से बाहर रखा गया है।",
    targeted: "आपके सक्रिय रखरखाव रोडमैप पर लक्षित एंटीबॉडी थेरेपी (ट्रैस्टुजुमाब) को प्राथमिकता दी गई है।"
  },
  mr: {
    default: "मी त्यानुसार गोष्टींना प्राधान्य देऊन आणि फिल्टर करून तुमची खर्च विभागणी सूची वैयक्तिकृत केली आहे.",
    surgery: "लम्पेक्टॉमी आणि सेंटिनेल लिम्फ नोड बायोप्सीवर लक्ष केंद्रित करण्यासाठी तुमचा शस्त्रक्रिया मार्ग अद्यतनित केला आहे आणि मॅस्टेक्टॉमी वगळले आहे.",
    chemo: "समजले. केमोथेरपी सायकल आणि डे-केअर फी खर्च अंदाज पत्रकातून वगळण्यात आली आहे.",
    targeted: "तुमच्या सक्रिय देखभाल रोडमॅपवर लक्ष्यित अँटीबॉडी थेरपी (ट्रॅस्टुझुमॅब) ला प्राधान्य दिले आहे."
  },
  kn: {
    default: "ಅದಕ್ಕೆ ತಕ್ಕಂತೆ ಐಟಂಗಳಿಗೆ ಆದ್ಯತೆ ನೀಡಿ ಫಿಲ್ಟರ್ ಮಾಡುವ ಮೂಲಕ ನಿಮ್ಮ ವೆಚ್ಚದ ವಿವರಗಳನ್ನು ನಾನು ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ್ದೇನೆ.",
    surgery: "ಲಂಪೆಕ್ಟಮಿ ಮತ್ತು ಸೆಂಟಿನೆಲ್ ಲಿಂಫ್ ನೋಡ್ ಬಯಾಪ್ಸಿ ಮೇಲೆ ಗಮನ ಹರಿಸಲು ನಿಮ್ಮ ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಮಾರ್ಗವನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ, ಮತ್ತು ಮ್ಯಾಸ್ಟೆಕ್ಟಮಿಯನ್ನು ಅಗತ್ಯವಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.",
    chemo: "ತಿಳಿದುಕೊಂಡೆ. ಕೀಮೋಥೆರಪಿ ಚಕ್ರಗಳು ಮತ್ತು ಡೇ-ಕೇರ್ ಶುಲ್ಕಗಳನ್ನು ವೆಚ್ಚದ ಅಂದಾಜು ಹಾಳೆಯಿಂದ ಹೊರಗಿಡಲಾಗಿದೆ.",
    targeted: "ನಿಮ್ಮ ಸಕ್ರಿಯ ನಿರ್ವಹಣಾ ಮಾರ್ಗಸೂಚಿಯಲ್ಲಿ ಉದ್ದೇಶಿತ ಪ್ರತಿಕಾಯ ಚಿಕಿತ್ಸೆಗೆ (ಟ್ರಾಸ್ಟುಜುಮಾಬ್) ಆದ್ಯತೆ ನೀಡಲಾಗಿದೆ."
  },
  bn: {
    default: "আমি সেই অনুযায়ী আইটেমগুলিকে অগ্রাধিকার দিয়ে এবং ফিল্টার করে আপনার খরচের বিবরণ তালিকাটিকে ব্যক্তিগতকৃত করেছি।",
    surgery: "লাম্পেক্টমি এবং সেন্টিনেল লিম্ফ নোড বায়োপসিতে ফোকাস করার জন্য আপনার অস্ত্রোপচারের পথ আপডেট করা হয়েছে এবং মাস্টেক্টমি প্রয়োজন নেই বলে চিহ্নিত করা হয়েছে।",
    chemo: "বুঝতে পেরেছি। কেমোথেরাপি চক্র এবং ডে-কেয়ার ফি খরচের অনুমানের তালিকা থেকে বাদ দেওয়া হয়েছে।",
    targeted: "আপনার সক্রিয় রক্ষণাবেক্ষণ রোডম্যাপে লক্ষ্যযুক্ত অ্যান্টিবডি থেরাপি (ট্রাস্টুজুমাব) অগ্রাধিকার দেওয়া হয়েছে।"
  }
};

export default function CostBreakdown() {
  const { t, language } = useLanguage();
  const [patientState, setPatientState] = useState(() => localStorage.getItem("artham_intake_state") || "");
  const [age, setAge] = useState(() => localStorage.getItem("artham_intake_age") || "");
  const [stage, setStage] = useState(() => localStorage.getItem("artham_intake_stage") || "");
  const [hormoneStatus, setHormoneStatus] = useState(() => localStorage.getItem("artham_intake_hormone_status") || "");
  const [surgery, setSurgery] = useState(() => localStorage.getItem("artham_intake_surgery") || "");
  const [chemo, setChemo] = useState(() => localStorage.getItem("artham_intake_chemo") || "");
  const [radiation, setRadiation] = useState(() => localStorage.getItem("artham_intake_radiation") || "");
  const [hospitalType, setHospitalType] = useState(() => localStorage.getItem("artham_intake_hospital_type") || "");
  const [hasInsurance, setHasInsurance] = useState(() => localStorage.getItem("artham_intake_has_insurance") === "true");
  const [insuranceProvider, setInsuranceProvider] = useState(() => localStorage.getItem("artham_intake_insurance_provider") || "");
  const [incomeBracket, setIncomeBracket] = useState(() => localStorage.getItem("artham_intake_income_bracket") || "");

  // API Key management
  const apiKey = localStorage.getItem("gemini_api_key") || (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
  const modelName = (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-2.5-flash-lite";

  // AI custom breakdown configuration
  const [customBreakdown, setCustomBreakdown] = useState<{
    relevantItems?: string[];
    notNeeded?: string[];
    customNotes?: Record<string, string>;
  } | null>(() => {
    const saved = localStorage.getItem("artham_custom_breakdown");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  // Mini chatbot states
  const [chatHistory, setChatHistory] = useState<{ role: "bot" | "user"; text: string }[]>(() => {
    const saved = localStorage.getItem("artham_custom_breakdown");
    const activeWelcome = chatbotWelcomeMessages.en;
    if (saved) {
      return [{ role: "bot", text: activeWelcome.personalized }];
    }
    return [{ role: "bot", text: activeWelcome.default }];
  });
  const [draftMessage, setDraftMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Flow-chart accordion state: which sections/items are expanded
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const toggleSection = (title: string) => setOpenSections(prev => ({ ...prev, [title]: !(prev[title] ?? false) }));
  const toggleItem = (key: string) => setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));

  // Sync initial bot message language reactively
  useEffect(() => {
    if (chatHistory.length === 1 && chatHistory[0].role === "bot") {
      const saved = localStorage.getItem("artham_custom_breakdown");
      const msgMap = chatbotWelcomeMessages[language] || chatbotWelcomeMessages.en;
      setChatHistory([
        {
          role: "bot",
          text: saved ? msgMap.personalized : msgMap.default
        }
      ]);
    }
  }, [language]);

  useEffect(() => {
    const handleAuthChange = () => {
      setPatientState(localStorage.getItem("artham_intake_state") || "");
      setAge(localStorage.getItem("artham_intake_age") || "");
      setStage(localStorage.getItem("artham_intake_stage") || "");
      setHormoneStatus(localStorage.getItem("artham_intake_hormone_status") || "");
      setSurgery(localStorage.getItem("artham_intake_surgery") || "");
      setChemo(localStorage.getItem("artham_intake_chemo") || "");
      setRadiation(localStorage.getItem("artham_intake_radiation") || "");
      setHospitalType(localStorage.getItem("artham_intake_hospital_type") || "");
      setHasInsurance(localStorage.getItem("artham_intake_has_insurance") === "true");
      setInsuranceProvider(localStorage.getItem("artham_intake_insurance_provider") || "");
      setIncomeBracket(localStorage.getItem("artham_intake_income_bracket") || "");

      const savedBreakdown = localStorage.getItem("artham_custom_breakdown");
      if (savedBreakdown) {
        try {
          setCustomBreakdown(JSON.parse(savedBreakdown));
        } catch (e) {
          console.error(e);
        }
      } else {
        setCustomBreakdown(null);
      }
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  const saveCustomBreakdown = async (breakdown: Record<string, unknown> | null) => {
    localStorage.setItem("artham_custom_breakdown", JSON.stringify(breakdown));
    setCustomBreakdown(breakdown);
    
    if (auth.currentUser) {
      try {
        await saveUserCustomBreakdownToFirestore(auth.currentUser.uid, breakdown);
      } catch (err) {
        console.error("Failed to save custom breakdown to firestore:", err);
      }
    }
    
    window.dispatchEvent(new CustomEvent("auth-change"));
  };

  const resetToDefault = async () => {
    localStorage.removeItem("artham_custom_breakdown");
    setCustomBreakdown(null);
    setChatHistory([
      {
        role: "bot",
        text: language === "en" ? "Reset complete. Cost breakdown is back to standard intake estimates. How can I help you customize it today?" :
              language === "hi" ? "रीसेट पूरा हुआ। लागत विवरण मानक इनटेक अनुमानों पर वापस आ गया है। आज इसे अनुकूलित करने में मैं आपकी क्या मदद कर सकता हूँ?" :
              language === "mr" ? "रीसेट पूर्ण झाले. खर्चाचे तपशील मानक इनटेक अंदाजांवर परत आले आहेत. आज हे वैयक्तिकृत करण्यात मी तुमची काय मदत करू शकतो?" :
              language === "kn" ? "ರಿಸೆಟ್ ಪೂರ್ಣಗೊಂಡಿದೆ. ವೆಚ್ಚದ ವಿವರಗಳು ಸಾಮಾನ್ಯ ಅಂದಾಜಿಗೆ ಮರಳಿವೆ. ಇಂದು ಇದನ್ನು ವೈಯಕ್ತಿಕಗೊಳಿಸಲು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?" :
              "রিসেট সম্পূর্ণ হয়েছে। খরচের বিবরণ সাধারণ অনুমানে ফিরে গেছে। আজ এটি কাস্টমাইজ করতে আমি কীভাবে আপনাকে সাহায্য করতে পারি?"
      }
    ]);
    if (auth.currentUser) {
      await saveUserCustomBreakdownToFirestore(auth.currentUser.uid, null);
    }
    window.dispatchEvent(new CustomEvent("auth-change"));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftMessage.trim() || isChatLoading) return;

    const userMessage = draftMessage.trim();
    setChatHistory(prev => [...prev, { role: "user", text: userMessage }]);
    setDraftMessage("");
    setIsChatLoading(true);

    if (apiKey) {
      try {
        const { reply, parsed } = await queryBreakdownPersonalizer(
          userMessage,
          patientState,
          age,
          stage,
          hormoneStatus,
          surgery,
          chemo,
          radiation,
          hospitalType,
          hasInsurance ? (insuranceProvider || "Yes") : "None",
          incomeBracket,
          apiKey,
          modelName
        );

        saveCustomBreakdown(parsed);
        setChatHistory(prev => [...prev, { role: "bot", text: reply }]);
      } catch (err) {
        console.error("AI personalization error:", err);
        setChatHistory(prev => [...prev, { 
          role: "bot", 
          text: language === "en" ? "I ran into an issue personalizing your cost breakdown. Please check your Gemini API key or try again." :
                language === "hi" ? "आपके लागत विवरण को व्यक्तिगत बनाने में समस्या आई। कृपया अपनी जेमिनी एपीआई कुंजी जांचें या पुनः प्रयास करें।" :
                language === "mr" ? "तुमचे खर्चाचे तपशील वैयक्तिकृत करण्यात अडचण आली. कृपया तुमची जेमिनी एपीआई की तपासा किंवा पुन्हा प्रयत्न करा." :
                language === "kn" ? "ನಿಮ್ಮ ವೆಚ್ಚದ ವಿವರಗಳನ್ನು ವೈಯಕ್ತಿಕಗೊಳಿಸುವಲ್ಲಿ ತೊಂದರೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಜೆಮಿನಿ ಎಪಿಐ ಕೀಲಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ." :
                "আপনার খরচের বিবরণ ব্যক্তিগতকৃত করতে সমস্যা হয়েছে। অনুগ্রহ করে আপনার জেমিনি এপিআই কি পরীক্ষা করুন অথবা আবার চেষ্টা করুন।"
        }]);
      } finally {
        setIsChatLoading(false);
      }
    } else {
      // Simulated mock personalization in Demo Mode
      setTimeout(() => {
        const lower = userMessage.toLowerCase();
        const replies = mockReplies[language] || mockReplies.en;
        let reply = replies.default;
        let parsed = {
          relevantItems: [] as string[],
          notNeeded: [] as string[],
          customNotes: {} as Record<string, string>
        };

        if (lower.includes("lumpectomy") || lower.includes("breast save") || lower.includes("partial")) {
          reply = replies.surgery;
          parsed.relevantItems = ["lumpectomy", "slnb"];
          parsed.notNeeded = ["mastectomy", "alnd", "reconstruction"];
          parsed.customNotes = {
            lumpectomy: language === "en" ? "AI Customization: Planned breast-conserving surgery." : "AI: स्तन-संरक्षण सर्जरी की योजना बनाई।",
            slnb: language === "en" ? "AI Customization: Sentinel node biopsy indicated." : "AI: सेंटिनल नोड बायोप्सी इंगित की गई।"
          };
        } else if (lower.includes("no chemo") || lower.includes("chemotherapy not")) {
          reply = replies.chemo;
          parsed.notNeeded = ["chemotherapy"];
          parsed.customNotes = {
            chemotherapy: language === "en" ? "AI Customization: Excluded per consult." : "AI: परामर्श के अनुसार बाहर रखा गया।"
          };
        } else if (lower.includes("targeted") || lower.includes("trastuzumab")) {
          reply = replies.targeted;
          parsed.relevantItems = ["targeted"];
          parsed.customNotes = {
            targeted: language === "en" ? "AI Customization: Confirmed targeted protocol." : "AI: लक्षित प्रोटोकॉल की पुष्टि की गई।"
          };
        }

        saveCustomBreakdown(parsed);
        setChatHistory(prev => [...prev, { role: "bot", text: reply }]);
        setIsChatLoading(false);
      }, 1000);
    }
  };

  const isIntakeFilled = !!patientState && !!age && !!stage;

  // Illustrative defaults so the breakdown always has content to show,
  // even before the patient completes their intake profile.
  const effAge = age || "45";
  const effStage = stage || "Stage II";
  const effHormoneStatus = hormoneStatus || "ER+/PR+ Positive";
  const effSurgery = surgery || "Yes";
  const effChemo = chemo || "Yes";
  const effRadiation = radiation || "Yes";
  const effHospitalType = hospitalType || "Private Medical Center";

  // Hospital Category: "Government" | "Private" | "Premium"
  const category: "Government" | "Private" | "Premium" =
    effHospitalType === "Government / Public Hospital" ? "Government" :
    effHospitalType === "Premium Corporate Hospital" ? "Premium" : "Private";

  // Define exact pricing maps calibrated against Dr. Jay Anam's clinical records
  const DIAGNOSTICS = {
    mammogram: { Government: 1000, Private: 3000, Premium: 5000 },
    ultrasound: { Government: 1500, Private: 4000, Premium: 6000 },
    biopsy: { Government: 5000, Private: 20000, Premium: 35000 },
    histopathology: { Government: 3000, Private: 10000, Premium: 15000 },
    ihc: { Government: 5000, Private: 15000, Premium: 25000 },
    pet: { Government: 10000, Private: 30000, Premium: 45000 },
    mri: { Government: 8000, Private: 25000, Premium: 40000 },
    bloodTests: { Government: 2000, Private: 8000, Premium: 12000 }
  };

  const SURGERY = {
    lumpectomy: { Government: 75000, Private: 185000, Premium: 350000 },
    mastectomy: { Government: 100000, Private: 270000, Premium: 500000 },
    slnb: { Government: 30000, Private: 75000, Premium: 125000 },
    alnd: { Government: 50000, Private: 100000, Premium: 175000 },
    reconstruction: { Government: 100000, Private: 250000, Premium: 600000 }
  };

  const CHEMO = {
    ac4: { Government: 80000, Private: 150000, Premium: 250000 },
    act: { Government: 150000, Private: 320000, Premium: 600000 },
    tc4: { Government: 100000, Private: 200000, Premium: 350000 },
    tc6: { Government: 150000, Private: 300000, Premium: 500000 },
    fac: { Government: 90000, Private: 180000, Premium: 300000 },
    fec: { Government: 100000, Private: 200000, Premium: 350000 },
    cmf: { Government: 70000, Private: 150000, Premium: 250000 },
    tch6: { Government: 300000, Private: 500000, Premium: 800000 }
  };

  const RADIATION = {
    whole: { Government: 75000, Private: 200000, Premium: 350000 },
    chestWall: { Government: 75000, Private: 200000, Premium: 350000 },
    regional: { Government: 100000, Private: 250000, Premium: 400000 }
  };

  const HORMONE = {
    tamoxifen: { Government: 10000, Private: 50000, Premium: 75000 },
    letrozole: { Government: 25000, Private: 100000, Premium: 150000 },
    anastrozole: { Government: 30000, Private: 120000, Premium: 180000 },
    exemestane: { Government: 40000, Private: 150000, Premium: 200000 }
  };

  const TARGETED = {
    trastuzumab: { Government: 400000, Private: 1200000, Premium: 1800000 },
    pertuzumabTrastuzumab: { Government: 800000, Private: 1800000, Premium: 2500000 },
    tdm1: { Government: 800000, Private: 1500000, Premium: 2200000 }
  };

  const IMMUNO = {
    pembrolizumab: { Government: 1000000, Private: 1500000, Premium: 2500000 },
    atezolizumab: { Government: 800000, Private: 1200000, Premium: 2000000 }
  };

  const ADDITIONAL = {
    consultationInit: { Government: 500, Private: 2000, Premium: 4000 },
    consultationFollow: { Government: 500, Private: 1500, Premium: 3000 },
    chemoAdmin: { Government: 2000, Private: 10000, Premium: 20000 },
    admission: { Government: 2000, Private: 10000, Premium: 25000 },
    icu: { Government: 10000, Private: 40000, Premium: 75000 }
  };

  const formatINR = (val: number) => {
    return "₹" + val.toLocaleString("en-IN");
  };

  let coveragePercent = 0;
  if (hasInsurance) {
    coveragePercent = category === "Government" ? 0.90 : 0.75;
  }

  const getItemCustomDetails = (itemKey: string) => {
    if (!customBreakdown) return { isRelevant: false, isNotNeeded: false, note: "" };
    
    let isNotNeeded = customBreakdown.notNeeded?.includes(itemKey) || false;
    const isRelevant = customBreakdown.relevantItems?.includes(itemKey) || false;
    const note = customBreakdown.customNotes?.[itemKey] || "";

    // Dependencies
    if (itemKey === "chemoAdmin" && customBreakdown.notNeeded?.includes("chemotherapy")) {
      isNotNeeded = true;
    }
    
    return { isRelevant, isNotNeeded, note };
  };

  const createItem = (title: string, body: string, estimateVal: number, itemKey: string): Item => {
    const itemInsuranceShare = Math.round(estimateVal * coveragePercent);
    let itemOop = estimateVal - itemInsuranceShare;

    if (incomeBracket === "Below ₹2,50,000") {
      itemOop = 0;
    } else if (incomeBracket === "₹2,50,000 – ₹5,00,000") {
      itemOop = Math.round(itemOop * 0.5);
    }

    const { isRelevant, isNotNeeded, note } = getItemCustomDetails(itemKey);

    // Retrieve localized values
    let localizedTitle = t(`item_${itemKey}_title`) || title;
    let localizedBody = t(`item_${itemKey}_desc`) || body;

    // Handle special suffix for title
    if (itemKey === "chemotherapy") {
      const prefix = t("item_chemotherapy_title") || "Chemotherapy";
      const parts = title.split(": ");
      const suffix = parts.length > 1 ? parts[1] : "";
      localizedTitle = suffix ? `${prefix}: ${suffix}` : prefix;
    } else if (itemKey === "hormonal") {
      const prefix = t("item_hormonal_title") || "Hormone Therapy";
      const parts = title.split(": ");
      const suffix = parts.length > 1 ? parts[1] : "";
      localizedTitle = suffix ? `${prefix}: ${suffix}` : prefix;
    } else if (itemKey === "targeted") {
      const prefix = t("item_targeted_title") || "Targeted Therapy";
      const parts = title.split(": ");
      const suffix = parts.length > 1 ? parts[1] : "";
      localizedTitle = suffix ? `${prefix}: ${suffix}` : prefix;
    } else if (itemKey === "immunotherapy") {
      const prefix = t("item_immunotherapy_title") || "Immunotherapy";
      const parts = title.split(": ");
      const suffix = parts.length > 1 ? parts[1] : "";
      localizedTitle = suffix ? `${prefix}: ${suffix}` : prefix;
    }

    return {
      title: localizedTitle,
      body: localizedBody,
      estimate: formatINR(estimateVal),
      insurance: formatINR(itemInsuranceShare),
      oop: formatINR(itemOop),
      key: itemKey,
      customNote: note,
      isExcluded: isNotNeeded,
      isHighlighted: isRelevant
    };
  };

  const diagnosticsItems: Item[] = [];
  const primaryItems: Item[] = [];
  const medicationItems: Item[] = [];
  const hospitalizationItems: Item[] = [];

  {
    let chemoCyclesCount = 0;

    diagnosticsItems.push(createItem("Mammogram", "Baseline bilateral screening mammography.", DIAGNOSTICS.mammogram[category], "mammogram"));
    diagnosticsItems.push(createItem("Breast Ultrasound", "High-resolution ultrasound of both breasts and axilla.", DIAGNOSTICS.ultrasound[category], "ultrasound"));
    diagnosticsItems.push(createItem("Core Needle Biopsy", "Ultrasound-guided core needle biopsy of the primary tumor.", DIAGNOSTICS.biopsy[category], "biopsy"));
    diagnosticsItems.push(createItem("Histopathology", "Microscopic examination and tumor grading of biopsy tissue.", DIAGNOSTICS.histopathology[category], "histopathology"));
    diagnosticsItems.push(createItem("IHC Panel (ER/PR/HER2)", "Immunohistochemistry profiling to determine receptor status.", DIAGNOSTICS.ihc[category], "ihc"));
    diagnosticsItems.push(createItem("Blood Tests Package", "Complete blood count, liver/kidney function tests, and viral markers.", DIAGNOSTICS.bloodTests[category], "bloodTests"));

    if (effStage === "Stage III" || effStage === "Stage IV") {
      diagnosticsItems.push(createItem("PET-CT Scan", "Whole-body PET-CT scan for staging and metastasis screening.", DIAGNOSTICS.pet[category], "pet"));
    }
    if (effHormoneStatus === "HER2 Positive" || effHormoneStatus === "Triple Negative" || Number(effAge) < 40) {
      diagnosticsItems.push(createItem("Breast MRI", "Contrast-enhanced breast MRI for detailed anatomical planning.", DIAGNOSTICS.mri[category], "mri"));
    }

    if (effSurgery !== "No") {
      if (effStage === "Stage I" || effStage === "Stage II") {
        const baseSurgery = SURGERY.lumpectomy[category];
        primaryItems.push(createItem("Lumpectomy Surgery", "Surgical removal of the breast tumor with margins.", baseSurgery, "lumpectomy"));

        const nodeSurgery = SURGERY.slnb[category];
        primaryItems.push(createItem("Sentinel Lymph Node Biopsy (SLNB)", "Biopsy of sentinel lymph nodes to check for early spread.", nodeSurgery, "slnb"));
      } else {
        const baseSurgery = SURGERY.mastectomy[category];
        primaryItems.push(createItem("Mastectomy Surgery", "Complete surgical removal of the breast tissue.", baseSurgery, "mastectomy"));

        const nodeSurgery = SURGERY.alnd[category];
        primaryItems.push(createItem("Axillary Lymph Node Dissection (ALND)", "Removal of axillary lymph nodes due to advanced stage spread.", nodeSurgery, "alnd"));
      }

      if (effStage === "Stage II" || effStage === "Stage III") {
        const reconSurgery = SURGERY.reconstruction[category];
        primaryItems.push(createItem("Breast Reconstruction Surgery", "Post-mastectomy reconstructive breast surgery.", reconSurgery, "reconstruction"));
      }
    }

    if (effChemo !== "No") {
      let chemoVal = 0;
      let chosenChemoName = "";
      if (effHormoneStatus === "HER2 Positive") {
        chemoVal = CHEMO.tch6[category];
        chosenChemoName = "TCH × 6";
        chemoCyclesCount = 6;
      } else if (effHormoneStatus === "Triple Negative") {
        chemoVal = CHEMO.act[category];
        chosenChemoName = "AC-T";
        chemoCyclesCount = 8;
      } else if (effHormoneStatus === "ER+/PR+ Positive") {
        if (effStage === "Stage I" || effStage === "Stage II") {
          chemoVal = CHEMO.tc4[category];
          chosenChemoName = "TC × 4";
          chemoCyclesCount = 4;
        } else {
          chemoVal = CHEMO.fac[category];
          chosenChemoName = "FAC";
          chemoCyclesCount = 6;
        }
      } else {
        chemoVal = CHEMO.act[category];
        chosenChemoName = "AC-T";
        chemoCyclesCount = 8;
      }
      primaryItems.push(createItem(`Chemotherapy: ${chosenChemoName}`, `Systemic chemotherapy protocol (${chemoCyclesCount} cycles total).`, chemoVal, "chemotherapy"));
    }

    if (effRadiation !== "No") {
      let radVal = 0;
      if (effStage === "Stage I" || effStage === "Stage II") {
        radVal = RADIATION.whole[category];
        primaryItems.push(createItem("Whole Breast Radiation", "Adjuvant radiation therapy for the remaining breast tissue.", radVal, "radiation"));
      } else {
        radVal = RADIATION.chestWall[category] + RADIATION.regional[category];
        primaryItems.push(createItem("Chest Wall & Regional Radiation", "Targeted radiation to chest wall and regional lymph node basins.", radVal, "radiation"));
      }
    }

    if (effHormoneStatus === "ER+/PR+ Positive") {
      let hormoneVal = 0;
      let chosenHormoneName = "";
      if (Number(effAge) >= 50) {
        hormoneVal = HORMONE.letrozole[category];
        chosenHormoneName = "Letrozole (5 years)";
      } else {
        hormoneVal = HORMONE.tamoxifen[category];
        chosenHormoneName = "Tamoxifen (5 years)";
      }
      medicationItems.push(createItem(`Hormone Therapy: ${chosenHormoneName}`, "Long-term daily oral maintenance therapy (5-year course).", hormoneVal, "hormonal"));
    }

    if (effHormoneStatus === "HER2 Positive") {
      let targetedVal = 0;
      let chosenTargetedName = "";
      if (effStage === "Stage III" || effStage === "Stage IV") {
        targetedVal = TARGETED.pertuzumabTrastuzumab[category];
        chosenTargetedName = "Pertuzumab + Trastuzumab";
      } else {
        targetedVal = TARGETED.trastuzumab[category];
        chosenTargetedName = "Trastuzumab (17 cycles)";
      }
      medicationItems.push(createItem(`Targeted Therapy: ${chosenTargetedName}`, "Monoclonal antibody regimen specifically targeting HER2 receptors.", targetedVal, "targeted"));
    }

    if (effHormoneStatus === "Triple Negative" && (effStage === "Stage III" || effStage === "Stage IV")) {
      const immunoVal = IMMUNO.pembrolizumab[category];
      const chosenImmunoName = "Pembrolizumab";
      medicationItems.push(createItem(`Immunotherapy: ${chosenImmunoName}`, "Checkpoint inhibitor therapy recommended for advanced Triple Negative breast cancer.", immunoVal, "immunotherapy"));
    }

    const consultationCost = ADDITIONAL.consultationInit[category] + (10 * ADDITIONAL.consultationFollow[category]);
    hospitalizationItems.push(createItem("Oncology Consultations", "Initial oncology consultation and 10 follow-up visits.", consultationCost, "consultations"));

    if (effChemo !== "No" && chemoCyclesCount > 0) {
      const chemoAdminCost = chemoCyclesCount * ADDITIONAL.chemoAdmin[category];
      hospitalizationItems.push(createItem("Chemo Administration Day-Care", `Day-care clinical ward and nursing fees for ${chemoCyclesCount} chemo infusions.`, chemoAdminCost, "chemoAdmin"));
    }

    const hospitalizationCost = 3 * ADDITIONAL.admission[category];
    hospitalizationItems.push(createItem("Inpatient Ward Admission", "3 days standard room stay for surgical recovery and monitoring.", hospitalizationCost, "admission"));

    if (effStage === "Stage III" || effStage === "Stage IV" || category === "Premium" || category === "Private") {
      const icuCost = 1 * ADDITIONAL.icu[category];
      hospitalizationItems.push(createItem("ICU Admission", "1 day ICU monitoring following complex surgery.", icuCost, "icu"));
    }
  }

  const getSumOfNonExcludedItems = (items: Item[]) => {
    return items
      .filter(it => !it.isExcluded)
      .reduce((sum, it) => {
        const cleanStr = it.estimate.replace(/[₹,]/g, "");
        const num = parseFloat(cleanStr) || 0;
        return sum + num;
      }, 0);
  };

  const getOopSumOfNonExcludedItems = (items: Item[]) => {
    return items
      .filter(it => !it.isExcluded)
      .reduce((sum, it) => {
        const cleanStr = it.oop.replace(/[₹,]/g, "");
        const num = parseFloat(cleanStr) || 0;
        return sum + num;
      }, 0);
  };

  const allItems = [...diagnosticsItems, ...primaryItems, ...medicationItems, ...hospitalizationItems];
  
  const totalEstimate = getSumOfNonExcludedItems(allItems);
  let outOfPocket = getOopSumOfNonExcludedItems(allItems);
  const insuranceShare = totalEstimate - outOfPocket;

  let subsidyApplied = false;
  let subsidyAmount = 0;
  let subsidyName = "";

  {
    if (incomeBracket === "Below ₹2,50,000") {
      subsidyApplied = true;
      subsidyAmount = outOfPocket;
      outOfPocket = 0;
      subsidyName = "Ayushman Bharat PM-JAY (100% Subsidy)";
    } else if (incomeBracket === "₹2,50,000 – ₹5,00,000") {
      subsidyApplied = true;
      subsidyAmount = Math.round(outOfPocket * 0.5);
      outOfPocket = outOfPocket - subsidyAmount;
      subsidyName = "National Illness Assistance Fund (50% Subsidy)";
    }
  }

  let localizedSubsidyName = subsidyName;
  if (subsidyName.includes("PM-JAY")) {
    localizedSubsidyName = "PM-JAY";
  } else if (subsidyName.includes("National Illness")) {
    localizedSubsidyName = "RAN";
  }

  const sortAndFilterItems = (items: Item[]) => {
    return [...items].sort((a, b) => {
      const aVal = a.isHighlighted ? -1 : a.isExcluded ? 1 : 0;
      const bVal = b.isHighlighted ? -1 : b.isExcluded ? 1 : 0;
      return aVal - bVal;
    });
  };

  const sectionTitleKeys: Record<string, string> = {
    "Pre-treatment Diagnostics": "cb_sec_diagnostics",
    "Primary Treatment": "cb_sec_primary",
    "Medication & Supportive Care": "cb_sec_meds",
    "Hospitalization & Consultations": "cb_sec_hospital"
  };

  const sections: { icon: string; title: string; items: Item[] }[] = [
    {
      icon: "biotech",
      title: "Pre-treatment Diagnostics",
      items: diagnosticsItems,
    },
    {
      icon: "healing",
      title: "Primary Treatment",
      items: primaryItems,
    },
    {
      icon: "medication",
      title: "Medication & Supportive Care",
      items: medicationItems,
    },
    {
      icon: "domain",
      title: "Hospitalization & Consultations",
      items: hospitalizationItems,
    },
  ].filter(section => section.items.length > 0);

  return (
    <AppShell>
      <div className="px-margin-mobile md:px-gutter pb-xl pt-md max-w-container-max mx-auto space-y-md animate-fade-in">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-sm gap-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
              {t("cb_title")}
            </h1>
            <p className="font-body-sm text-on-surface-variant text-xs mt-1">
              {t("cb_subtitle")}
            </p>
            {isIntakeFilled && (
              <div className="mt-xs text-on-surface-variant/80 text-[10px] flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                <span>{t("cb_calibrated")}</span>
              </div>
            )}
          </div>
          
          <div className="bg-surface-container-low p-sm rounded-2xl border border-outline-variant/40 flex items-center gap-sm shadow-sm shrink-0">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <p className="font-label-sm text-[9px] uppercase font-bold text-outline tracking-wider">{t("cb_reliability")}</p>
              <p className="font-bold text-secondary text-xs">{customBreakdown ? t("cb_reliability_ai") : t("cb_reliability_high")}</p>
            </div>
          </div>
        </div>

        {/* Selected Intake Profile Parameters Badge strip */}
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-md flex flex-wrap gap-xs items-center justify-between shadow-sm text-xs text-on-surface-variant font-medium font-body-sm">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-sm">
            <span className="font-bold text-[#4c3a69] flex items-center gap-xs">
              <span className="material-symbols-outlined text-sm">tune</span> {t("it_summary")}:
            </span>
            <span>{t("it_state")}: <strong>{patientState || "Pending"}</strong></span>
            <span>•</span>
            <span>{t("it_age")}: <strong>{age || "Pending"}</strong></span>
            <span>•</span>
            <span>{t("it_stage")}: <strong>{stage || "Pending"}</strong></span>
            <span>•</span>
            <span>{t("it_receptor")}: <strong>{hormoneStatus || "Pending"}</strong></span>
            <span>•</span>
            <span>{t("it_hospital")}: <strong>{hospitalType ? hospitalType.split(" / ")[0] : "Pending"}</strong></span>
            <span>•</span>
            <span>{t("it_insurance_status")}: <strong>{hasInsurance ? (insuranceProvider || "Yes") : "None / Pending"}</strong></span>
            <span>•</span>
            <span>{t("it_income")}: <strong>{incomeBracket || "Pending"}</strong></span>
          </div>
          
          <div className="flex items-center gap-sm">
            {customBreakdown && (
              <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                AI Personalized
              </span>
            )}
            <Link to="/intake" className="text-xs text-[#4c3a69] hover:underline font-bold flex items-center gap-[2px] shrink-0">
              {isIntakeFilled ? t("it_edit_details") : t("db_start")} <span className="material-symbols-outlined text-[14px]">{isIntakeFilled ? "edit" : "arrow_forward"}</span>
            </Link>
          </div>
        </div>

        {!isIntakeFilled && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-md flex items-center justify-between gap-md shadow-sm">
            <div className="flex items-center gap-sm text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              {t("cb_pending_desc")}
            </div>
            <Link
              to="/intake"
              className="inline-flex items-center gap-xs bg-primary text-on-primary hover:brightness-110 px-md py-sm rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">assignment</span>
              {t("cb_pending_btn")}
            </Link>
          </div>
        )}

          <div className="grid grid-cols-1 gap-lg items-start">

            {/* Breakdown Sheet */}
            <div className="space-y-md">
              {/* Summary Cards Panel */}
              <div className={`grid grid-cols-1 md:grid-cols-${subsidyApplied ? '4' : '3'} gap-md`}>
                <SummaryCard label={t("cb_total_est")} value={formatINR(totalEstimate)} tone="primary" />
                <SummaryCard 
                  label={t("cb_insurance_covers")} 
                  value={formatINR(insuranceShare)} 
                  tone="secondary" 
                  pct={totalEstimate > 0 ? Math.round((insuranceShare / totalEstimate) * 100) : 0} 
                />
                {subsidyApplied && (
                  <SummaryCard 
                    label={t("cb_subsidies_applied")} 
                    sublabel={localizedSubsidyName}
                    value={formatINR(subsidyAmount)} 
                    tone="primary" 
                    pct={totalEstimate > 0 ? Math.round((subsidyAmount / totalEstimate) * 100) : 0} 
                  />
                )}
                <SummaryCard 
                  label={t("cb_total_oop")} 
                  value={formatINR(outOfPocket)} 
                  tone={outOfPocket === 0 ? "secondary" : "tertiary"} 
                  pct={totalEstimate > 0 ? Math.round((outOfPocket / totalEstimate) * 100) : 0} 
                />
              </div>

              {/* Subsidy notification banner */}
              {subsidyApplied && (
                <div className="bg-[#e7def3]/10 border border-[#e7def3]/30 rounded-2xl p-md flex items-start gap-sm">
                  <span className="material-symbols-outlined text-[#4c3a69] text-[20px] mt-0.5">volunteer_activism</span>
                  <div>
                    <h4 className="text-xs font-bold text-[#4c3a69]">{subsidyName}</h4>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                      {language === "en" ? (
                        <>Your out-of-pocket share has been reduced by <strong>{formatINR(subsidyAmount)}</strong> because of your income classification. Submit your income certificate during the action plan stages to lock in this subsidy.</>
                      ) : language === "hi" ? (
                        <>आपकी आय श्रेणी के कारण आपकी जेब से होने वाला खर्च <strong>{formatINR(subsidyAmount)}</strong> कम हो गया है। इस सब्सिडी को लॉक करने के लिए कार्य योजना के चरणों के दौरान अपना आय प्रमाण पत्र जमा करें।</>
                      ) : language === "mr" ? (
                        <>तुमच्या उत्पन्न वर्गीकरणामुळे तुमचा स्वतःचा खर्च <strong>{formatINR(subsidyAmount)}</strong> कमी झाला आहे. ही सवलत निश्चित करण्यासाठी कार्य आराखड्याच्या टप्प्यादरम्यान तुमचे उत्पन्न प्रमाणपत्र सादर करा।</>
                      ) : language === "kn" ? (
                        <>ನಿಮ್ಮ ಆದಾಯದ ವರ್ಗೀಕರಣದ ಕಾರಣದಿಂದಾಗಿ ನಿಮ್ಮ ಜೇಬಿನಿಂದ ಭರಿಸುವ ವೆಚ್ಚವನ್ನು <strong>{formatINR(subsidyAmount)}</strong> ಕಡಿತಗೊಳಿಸಲಾಗಿದೆ. ಈ ಸಬ್ಸಿಡಿಯನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ಕ್ರಿಯಾ ಯೋಜನೆಯ ಹಂತಗಳಲ್ಲಿ ನಿಮ್ಮ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಸಲ್ಲಿಸಿ.</>
                      ) : (
                        <>আপনার আয়ের শ্রেণীবিভাগের কারণে আপনার পকেট থেকে খরচের পরিমাণ <strong>{formatINR(subsidyAmount)}</strong> হ্রাস করা হয়েছে। এই ভর্তুকি নিশ্চিত করতে কর্ম পরিকল্পনার পদক্ষেপের সময় আপনার আয়ের শংসাপত্র জমা দিন।</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Flow-chart Breakdown: heading -> topics -> sub-topics, click to expand */}
              <div className="space-y-sm">
                {sections.map((s, idx) => {
                  const isSectionOpen = openSections[s.title] ?? (idx === 0);
                  const sectionTotal = getSumOfNonExcludedItems(s.items);
                  return (
                    <section
                      key={s.title}
                      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSection(s.title)}
                        className="w-full flex items-center justify-between gap-md p-md hover:bg-surface-container-low/60 transition-colors text-left"
                      >
                        <div className="flex items-center gap-md min-w-0">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm shrink-0">
                            <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-headline-sm text-headline-sm text-primary font-bold truncate">{t(sectionTitleKeys[s.title]) || s.title}</h3>
                            <p className="text-[10px] text-on-surface-variant">{s.items.length} {s.items.length === 1 ? "item" : "items"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-sm shrink-0">
                          <span className="font-bold text-primary text-sm">{formatINR(sectionTotal)}</span>
                          <span className="material-symbols-outlined text-outline">
                            {isSectionOpen ? "expand_less" : "expand_more"}
                          </span>
                        </div>
                      </button>

                      {isSectionOpen && (
                        <div className="px-md pb-md space-y-xs">
                          {sortAndFilterItems(s.items).map((it) => (
                            <FlowLineItem
                              key={it.key}
                              item={it}
                              isOpen={!!openItems[it.key]}
                              onToggle={() => toggleItem(it.key)}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              {/* Financial Resilience Insight */}
              <div className="mt-xl bg-primary-container/20 text-on-primary-container p-lg rounded-3xl flex flex-col md:flex-row gap-lg items-center overflow-hidden border border-outline-variant/40 relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary-container/30 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex-1 z-10 space-y-sm">
                  <h2 className="font-headline-md text-headline-md font-bold text-primary">{t("cb_resilience_title")}</h2>
                  <p className="font-body-md text-on-surface-variant text-xs leading-relaxed max-w-2xl">
                    {t("cb_resilience_desc")}
                  </p>
                  <Link
                    to="/action-plan"
                    className="inline-flex items-center gap-xs bg-secondary hover:bg-secondary/90 px-md py-sm rounded-xl font-bold text-xs text-on-secondary shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {t("db_action")}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                
                <div className="w-full md:w-64 flex flex-col items-center gap-sm z-10 bg-surface-container-low border border-outline-variant/40 p-md rounded-2xl">
                  <div className="relative w-44 h-22 overflow-hidden flex flex-col justify-end items-center pt-2">
                    <div className="absolute top-2 w-36 h-36 border-[10px] border-surface-container-high rounded-full" />
                    <div
                      className="absolute top-2 w-36 h-36 border-[10px] border-t-secondary border-r-secondary border-l-transparent border-b-transparent rounded-full origin-center transition-all duration-700"
                      style={{ transform: "rotate(45deg)" }}
                    />
                    <span className="font-headline-sm text-sm text-primary font-bold z-10">{t("cb_excellent")}</span>
                  </div>
                  <p className="font-label-sm text-[9px] uppercase font-bold text-outline text-center tracking-wider mt-1">
                    {t("cb_net_alignment")}
                  </p>
                </div>
              </div>
            </div>

          </div>

      </div>

      {/* Floating AI Pricing Personalizer: popup button + panel */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] max-w-sm bg-surface-container-low border border-outline-variant/40 rounded-3xl shadow-2xl flex flex-col h-[520px] overflow-hidden animate-fade-in">
          {/* Chatbot Header */}
          <div className="flex justify-between items-center p-md pb-sm border-b border-outline-variant/30 shrink-0">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-[20px] active-entity-pulse">auto_awesome</span>
              <div>
                <h3 className="font-headline-sm text-xs font-bold text-primary">{t("cb_ai_personalizer_title")}</h3>
                <p className="text-[9px] text-outline font-medium">
                  {language === "en" ? "Dynamically customize cost sheet" :
                   language === "hi" ? "लागत पत्रक को गतिशील रूप से अनुकूलित करें" :
                   language === "mr" ? "खर्च पत्रक वैयक्तिकृत करा" :
                   language === "kn" ? "ವೆಚ್ಚದ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ" :
                   "খরচের বিবরণ তালিকাটি কাস্টমাইজ করুন"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-xs shrink-0">
              {customBreakdown && (
                <button
                  onClick={resetToDefault}
                  className="px-2 py-1 text-[10px] font-bold text-error border border-error-container/30 hover:bg-error-container/10 rounded-lg transition-all"
                >
                  {language === "en" ? "Reset Standard" : language === "hi" ? "मानक रीसेट करें" : language === "mr" ? "मानक रीसेट करा" : language === "kn" ? "ಮರುಹೊಂದಿಸಿ" : "রিসেট করুন"}
                </button>
              )}
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 hover:bg-surface-container rounded-full text-outline hover:text-on-surface transition-all"
                title="Close"
                aria-label="Close assistant"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>

          {/* Chat history list */}
          <div className="flex-grow overflow-y-auto p-md py-sm space-y-sm pr-xs custom-scrollbar">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-sm max-w-[85%] rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-on-primary rounded-tr-none"
                    : "bg-surface-bright border border-outline-variant/40 text-on-surface rounded-tl-none"
                }`}>
                  {msg.role === "bot" ? <MarkdownRenderer text={msg.text} /> : msg.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="p-sm bg-surface-bright border border-outline-variant/40 text-on-surface rounded-2xl rounded-tl-none flex items-center gap-xs">
                  <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce delay-200" />
                  <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}
          </div>

          {/* Input textfield form */}
          <form onSubmit={handleSendMessage} className="p-md pt-sm border-t border-outline-variant/30 flex gap-xs items-center shrink-0">
            <input
              type="text"
              placeholder={t("cb_ai_placeholder")}
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              disabled={isChatLoading}
              className="flex-grow px-3 py-2 border border-outline-variant rounded-xl text-xs bg-surface-bright text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isChatLoading || !draftMessage.trim()}
              className="p-2 bg-primary text-on-primary hover:brightness-110 rounded-xl flex items-center justify-center shadow-md disabled:opacity-40 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating action button */}
      <button
        onClick={() => setIsChatOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center"
        title={isChatOpen ? "Close assistant" : "Open AI Pricing Personalizer"}
        aria-label={isChatOpen ? "Close assistant" : "Open AI Pricing Personalizer"}
      >
        <span className="material-symbols-outlined text-[26px]">
          {isChatOpen ? "close" : "auto_awesome"}
        </span>
      </button>
    </AppShell>
  );
}

function SummaryCard({
  label,
  sublabel,
  value,
  tone,
  pct = 100,
}: {
  label: string;
  sublabel?: string;
  value: string;
  tone: "primary" | "secondary" | "tertiary";
  pct?: number;
}) {
  const text = { primary: "text-primary", secondary: "text-secondary", tertiary: "text-tertiary" }[tone];
  const bar = { primary: "bg-primary", secondary: "bg-secondary", tertiary: "bg-tertiary" }[tone];
  return (
    <div className="bg-surface-container-low p-md rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col justify-between">
      <div>
        <p className="font-label-md text-[10px] uppercase font-bold text-outline tracking-wider mb-xs">{label}</p>
        <p className={`font-headline-md text-headline-md font-bold text-[20px] ${text}`}>{value}</p>
        {sublabel && <p className="text-[10px] text-outline font-medium italic mt-0.5">{sublabel}</p>}
      </div>
      <div className="w-full h-1 bg-surface-container-high mt-md rounded-full overflow-hidden">
        <div className={`${bar} h-1 rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FlowLineItem({ item, isOpen, onToggle }: { item: Item; isOpen: boolean; onToggle: () => void }) {
  const { t } = useLanguage();
  const { title, body, estimate, insurance, oop, isExcluded, isHighlighted, customNote } = item;
  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      isExcluded
        ? "bg-surface-container-lowest border-outline-variant/20 opacity-60"
        : isHighlighted
        ? "bg-primary/5 border-primary/30"
        : "bg-surface-container-low border-outline-variant/50"
    }`}>
      {/* Topic row: click to reveal sub-topic detail */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-sm p-sm text-left hover:bg-surface-container/30 transition-colors"
      >
        <div className="flex items-center gap-xs min-w-0">
          <span className="material-symbols-outlined text-outline text-[16px] shrink-0">
            {isOpen ? "expand_less" : "chevron_right"}
          </span>
          <h4 className={`font-label-md text-xs font-bold truncate ${isExcluded ? "text-outline line-through" : "text-primary"}`}>
            {title}
          </h4>
          {isHighlighted && (
            <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-[9px] font-bold uppercase tracking-wider flex items-center gap-[2px] shrink-0">
              <span className="material-symbols-outlined text-[10px]">check_circle</span>
              {t("cb_confirmed_relevant")}
            </span>
          )}
          {isExcluded && (
            <span className="px-2 py-0.5 rounded-full bg-outline-variant/40 text-outline border border-outline-variant/40 text-[9px] font-bold uppercase tracking-wider shrink-0">
              {t("cb_excluded_badge")}
            </span>
          )}
        </div>
        <span className={`font-bold text-xs shrink-0 ${isExcluded ? "text-outline" : "text-on-surface"}`}>
          {isExcluded ? "N/A" : estimate}
        </span>
      </button>

      {/* Sub-topics: description + insurance / OOP split, revealed on click */}
      {isOpen && (
        <div className="px-sm pb-sm pt-1 border-t border-outline-variant/20">
          <p className={`font-body-sm text-[10px] leading-normal mt-2 ${isExcluded ? "text-outline/70" : "text-on-surface-variant"}`}>
            {body}
          </p>

          {customNote && (
            <div className="mt-2 p-1.5 rounded-lg bg-surface-container/60 border border-outline-variant/30 text-[10px] text-on-surface-variant flex items-start gap-xs max-w-lg">
              <span className="material-symbols-outlined text-[12px] text-[#4c3a69] mt-0.5 shrink-0">auto_awesome</span>
              <span><strong>{t("cb_ai_personalizer_title")}:</strong> {customNote}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-md mt-sm pt-sm border-t border-outline-variant/20">
            <Cell label={t("cb_cell_estimate")} value={isExcluded ? "N/A" : estimate} bold />
            <Cell label={t("cb_cell_insurance")} value={isExcluded ? "N/A" : insurance} tone="text-secondary" />
            <Cell label={t("cb_cell_oop")} value={isExcluded ? "N/A" : oop} tone="text-tertiary" bold />
          </div>
        </div>
      )}
    </div>
  );
}

function Cell({ label, value, tone, bold }: { label: string; value: string; tone?: string; bold?: boolean }) {
  return (
    <div>
      <p className="font-label-sm text-[9px] uppercase font-bold text-outline tracking-wider">{label}</p>
      <p className={`font-body-md text-xs mt-1 ${bold ? "font-bold" : ""} ${tone ?? "text-on-surface"}`}>
        {value}
      </p>
    </div>
  );
}
