import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useLanguage } from "../components/LanguageContext";

type Doc = { name: string; sub: string; status: "ready" | "warning" | "pending" };

const docsInitial: Doc[] = [
  { name: "Aadhar Card", sub: "Identity Proof (Verified)", status: "ready" },
  { name: "Medical Reports", sub: "Last 3 months (Ready)", status: "ready" },
  { name: "Income Certificate", sub: "Issued by Tehsildar", status: "warning" },
  { name: "Ration Card", sub: "BPL/Priority Category", status: "pending" },
];

type TimelineStepType = {
  n: number;
  title: string;
  body: string;
  hint?: string;
  completed: boolean;
  disabled?: boolean;
};

const localizedTimeline = (stepNum: number, schemeName: string, language: string) => {
  const steps: Record<string, Record<number, { title: string; body: string; hint?: string }>> = {
    en: {
      1: { title: "Day 1: Collect Medical Reports", body: "Gather all recent blood work, biopsy reports, and MRI scans from the hospital records office." },
      2: { title: "Day 2: Visit Nodal Office", body: "Meet the Government Health Liaison at the District Nodal Office for scheme verification.", hint: `Bring 2 passport photos and original Aadhar to verify under ${schemeName}.` },
      3: { title: "Day 3: Pre-Surgical Consultation", body: "Meet with your surgical oncologist to discuss lumpectomy or mastectomy options and room booking limits." },
      4: { title: "Day 4: Chemotherapy Plan Approval", body: "Confirm chemotherapy regimen approvals, oncologist schedule, and pharmacy drug requisition orders." },
      5: { title: "Day 5: Submit Final Application", body: `Upload all verified documents to the ${schemeName} Treatment Portal or submit at Counter 12.` }
    },
    hi: {
      1: { title: "दिन 1: मेडिकल रिपोर्ट एकत्र करें", body: "अस्पताल के रिकॉर्ड कार्यालय से सभी हालिया रक्त परीक्षण, बायोप्सी रिपोर्ट और एमआरआई स्कैन एकत्र करें।" },
      2: { title: "दिन 2: नोडल कार्यालय का दौरा करें", body: "योजना सत्यापन के लिए जिला नोडल कार्यालय में सरकारी स्वास्थ्य संपर्क अधिकारी से मिलें।", hint: `${schemeName} के तहत सत्यापन के लिए 2 पासपोर्ट फोटो और मूल आधार लाएं।` },
      3: { title: "दिन 3: सर्जरी-पूर्व परामर्श", body: "लम्पेक्टॉमी या मास्टेक्टॉमी विकल्पों और कमरा बुकिंग सीमाओं पर चर्चा करने के लिए अपने सर्जिकल ऑन्कोलॉजिस्ट से मिलें।" },
      4: { title: "दिन 4: कीमोथेरेपी योजना स्वीकृति", body: "कीमोथेरेपी व्यवस्था की मंजूरी, ऑन्कोलॉजिस्ट शेड्यूल और फार्मेसी दवा मांग पत्रों की पुष्टि करें।" },
      5: { title: "दिन 5: अंतिम आवेदन जमा करें", body: `सभी सत्यापित दस्तावेजों को ${schemeName} उपचार पोर्टल पर अपलोड करें या काउंटर 12 पर जमा करें।` }
    },
    mr: {
      1: { title: "दिवस १: वैद्यकीय अहवाल गोळा करा", body: "रुग्णालयाच्या रेकॉर्ड ऑफिसमधून अलीकडील सर्व रक्त चाचण्या, बायोप्सी अहवाल आणि एमआरआय स्कॅन गोळा करा." },
      2: { title: "दिवस २: नोडल ऑफिसला भेट द्या", body: "योजना पडताळणीसाठी जिल्हा नोडल कार्यालयातील सरकारी आरोग्य संपर्क अधिकाऱ्याला भेटा.", hint: `${schemeName} अंतर्गत पडताळणीसाठी २ पासपोर्ट फोटो आणि मूळ आधार कार्ड सोबत आणा.` },
      3: { title: "दिवस ३: शस्त्रक्रिया-पूर्व सल्लामसलत", body: "लम्पेक्टॉमी किंवा मॅस्टेक्टॉमी पर्याय आणि रूम बुकिंग मर्यादांवर चर्चा करण्यासाठी तुमच्या सर्जिकल ऑन्कोलॉजिस्टना भेटा." },
      4: { title: "दिवस ४: केमोथेरपी योजना मंजुरी", body: "केमोथेरपीचे वेळापत्रक आणि औषधांची मागणी निश्चित करा." },
      5: { title: "दिवस ५: अंतिम अर्ज सादर करा", body: `सर्व पडताळणी केलेली कागदपत्रे ${schemeName} उपचार पोर्टलवर अपलोड करा किंवा काउंटर १२ वर जमा करा.` }
    },
    kn: {
      1: { title: "ದಿನ 1: ವೈದ್ಯಕೀಯ ವರದಿಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ", body: "ಆಸ್ಪತ್ರೆಯ ದಾಖಲೆಗಳ ಕಚೇರಿಯಿಂದ ಇತ್ತೀಚಿನ ರಕ್ತದ ವರದಿಗಳು, ಬಯಾಪ್ಸಿ ವರದಿಗಳು ಮತ್ತು ಎಂಆರ್‌ಐ ಸ್ಕ್ಯಾನ್‌ಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ." },
      2: { title: "ದಿನ 2: ನೋಡಲ್ ಕಚೇರಿಗೆ ಭೇಟಿ ನೀಡಿ", body: "ಯೋಜನೆಯ ಪರಿಶೀಲನೆಗಾಗಿ ಜಿಲ್ಲಾ ನೋಡಲ್ ಕಚೇರಿಯಲ್ಲಿರುವ ಸರ್ಕಾರಿ आरोग्य ಸಂಪರ್ಕ ಅಧಿಕಾರಿಯನ್ನು ಭೇಟಿ ಮಾಡಿ.", hint: `${schemeName} ಅಡಿಯಲ್ಲಿ ಪರಿಶೀಲಿಸಲು 2 ಪಾಸ್‌ಪೋರ್ಟ್ ಫೋಟೋಗಳು ಮತ್ತು ಮೂಲ ಆಧಾರ್ ಕಾರ್ಡ್ ತರಬೇಕು.` },
      3: { title: "ದಿನ 3: ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗೂ ಮುನ್ನ ಸಮಾಲೋಚನೆ", body: "ಲಂಪೆಕ್ಟಮಿ ಅಥವಾ ಮ್ಯಾಸ್ಟೆಕ್ಟಮಿ ಆಯ್ಕೆಗಳು ಮತ್ತು ರೂಮ್ ಬುಕಿಂಗ್ ಮಿತಿಗಳ ಬಗ್ಗೆ ಚರ್ಚಿಸಲು ನಿಮ್ಮ ಶಸ್ತ್ರಚಿಕಿತ್ಸಕರನ್ನು ಭೇಟಿ ಮಾಡಿ." },
      4: { title: "ದಿನ 4: ಕೀಮೋಥೆರಪಿ ಯೋಜನೆ ಅನುಮೋದನೆ", body: "ಕೀಮೋಥೆರಪಿ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಔಷಧಗಳ ಬೇಡಿಕೆಯನ್ನು ದೃಢೀಕರಿಸಿ." },
      5: { title: "ದಿನ 5: ಕೊನೆಯ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ", body: `ಪರಿಶೀಲಿಸಲಾದ ಎಲ್ಲಾ ದಾಖಲೆಗಳನ್ನು ${schemeName} ಚಿಕಿತ್ಸಾ ಪೋರ್ಟಲ್‌ಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಕೌಂಟರ್ 12 ರಲ್ಲಿ ಸಲ್ಲಿಸಿ.` }
    },
    bn: {
      1: { title: "দিন ১: মেডিকেল রিপোর্ট সংগ্রহ করুন", body: "হাসপাতালের রেকর্ড অফিস থেকে সাম্প্রতিক সমস্ত রক্ত পরীক্ষা, বায়োপসি রিপোর্ট এবং এমআরআই স্ক্যান সংগ্রহ করুন।" },
      2: { title: "দিন ২: নোডাল অফিসে যান", body: "স্কিম যাচাইকরণের জন্য জেলা নোডাল অফিসে সরকারি স্বাস্থ্য কর্মকর্তার সাথে দেখা করুন।", hint: `${schemeName} এর অধীনে যাচাইকরণের জন্য ২টি পাসপোর্ট সাইজ ছবি এবং মূল আধার কার্ড সাথে আনুন।` },
      3: { title: "দিন ৩: সার্জারি-পূর্ব পরামর্শ", body: "লাম্পেক্টমি বা মাস্টেক্টমি বিকল্প এবং রুম বুকিংয়ের সীমা নিয়ে আলোচনা করতে আপনার সার্জিক্যাল অঙ্কোলজিস্টের সাথে দেখা করুন।" },
      4: { title: "দিন ৪: কেমোথেরাপি পরিকল্পনা অনুমোদন", body: "কেমোথেরাপির সময়সূচী এবং ওষুধের প্রয়োজনীয়তা নিশ্চিত করুন।" },
      5: { title: "দিন ৫: চূড়ান্ত আবেদন জমা দিন", body: `সমস্ত যাচাইকৃত নথিপত্র ${schemeName} চিকিৎসা পোর্টালে আপলোড করুন বা কাউন্টার ১২-এ জমা দিন।` }
    }
  };

  const activeLangSteps = steps[language] || steps.en;
  return activeLangSteps[stepNum] || activeLangSteps[1];
};

const localizedDocs = (docName: string, sub: string, language: string) => {
  const docMap: Record<string, Record<string, { name: string; sub: string }>> = {
    en: {
      "Aadhar Card": { name: "Aadhar Card", sub: "Identity Proof (Verified)" },
      "Medical Reports": { name: "Medical Reports", sub: "Last 3 months (Ready)" },
      "Income Certificate": { name: "Income Certificate", sub: "Issued by Tehsildar" },
      "Ration Card": { name: "Ration Card", sub: "BPL/Priority Category" }
    },
    hi: {
      "Aadhar Card": { name: "आधार कार्ड", sub: "पहचान प्रमाण (सत्यापित)" },
      "Medical Reports": { name: "मेडिकल रिपोर्ट", sub: "पिछले 3 महीने (तैयार)" },
      "Income Certificate": { name: "आय प्रमाण पत्र", sub: "तहसीलदार द्वारा जारी" },
      "Ration Card": { name: "राशन कार्ड", sub: "बीपीएल/प्राथमिकता श्रेणी" }
    },
    mr: {
      "Aadhar Card": { name: "आधार कार्ड", sub: "ओळख पुरावा (पडताळणी झालेले)" },
      "Medical Reports": { name: "वैद्यकीय अहवाल", sub: "मागील ३ महिने (तयार)" },
      "Income Certificate": { name: "उत्पन्न प्रमाणपत्र", sub: "तहसीलदारांकडून जारी" },
      "Ration Card": { name: "रेशन कार्ड", sub: "बीपीएल/प्राधान्य गट" }
    },
    kn: {
      "Aadhar Card": { name: "ಆಧಾರ್ ಕಾರ್ಡ್", sub: "ಗುರುತಿನ ಪುರಾವೆ (ಪರಿಶೀಲಿಸಲಾಗಿದೆ)" },
      "Medical Reports": { name: "ವೈದ್ಯಕೀಯ ವರದಿಗಳು", sub: "ಕಳೆದ 3 ತಿಂಗಳು (ಸಿದ್ಧವಾಗಿದೆ)" },
      "Income Certificate": { name: "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ", sub: "ತಹಶೀಲ್ದಾರರಿಂದ ನೀಡಲ್ಪಟ್ಟಿದೆ" },
      "Ration Card": { name: "ರೇಷನ್ ಕಾರ್ಡ್", sub: "ಬಿಪಿಎಲ್/ಆದ್ಯತಾ ವರ್ಗ" }
    },
    bn: {
      "Aadhar Card": { name: "আধার কার্ড", sub: "পরিচয়পত্র (যাচাইকৃত)" },
      "Medical Reports": { name: "মেডিকেল রিপোর্ট", sub: "গত ৩ মাসের (প্রস্তুত)" },
      "Income Certificate": { name: "আয় শংসাপত্র", sub: "তহশিলদার দ্বারা জারি" },
      "Ration Card": { name: "রেশন কার্ড", sub: "বিপিএল/অগ্রাধিকার বিভাগ" }
    }
  };
  return (docMap[language] && docMap[language][docName]) || { name: docName, sub };
};

export default function ActionPlan() {
  const { t, language } = useLanguage();
  const [activeRoadmapTab, setActiveRoadmapTab] = useState<"timeline" | "documents">("timeline");

  // Dynamic profile state hooks
  const [userName, setUserName] = useState(() => localStorage.getItem("artham_user_name") || "Guest User");
  const [patientState, setPatientState] = useState(() => localStorage.getItem("artham_intake_state") || "");
  const [age, setAge] = useState(() => localStorage.getItem("artham_intake_age") || "");
  const [stage, setStage] = useState(() => localStorage.getItem("artham_intake_stage") || "");
  const [hormoneStatus, setHormoneStatus] = useState(() => localStorage.getItem("artham_intake_hormone_status") || "");
  const [surgery, setSurgery] = useState(() => localStorage.getItem("artham_intake_surgery") || "");
  const [chemo, setChemo] = useState(() => localStorage.getItem("artham_intake_chemo") || "");
  const [radiation, setRadiation] = useState(() => localStorage.getItem("artham_intake_radiation") || "");
  const [hospitalType, setHospitalType] = useState(() => localStorage.getItem("artham_intake_hospital_type") || "");
  const [hasInsurance, setHasInsurance] = useState(() => localStorage.getItem("artham_intake_has_insurance") === "true");
  const [insurance, setInsurance] = useState(() => {
    const hasIns = localStorage.getItem("artham_intake_has_insurance") === "true";
    const provider = localStorage.getItem("artham_intake_insurance_provider");
    return hasIns ? (provider || "Yes (details pending)") : "No Insurance";
  });
  const [incomeBracket, setIncomeBracket] = useState(() => localStorage.getItem("artham_intake_income_bracket") || "");

  const isIntakeFilled = !!patientState && !!age && !!stage;

  useEffect(() => {
    const syncProfile = () => {
      setUserName(localStorage.getItem("artham_user_name") || "Guest User");
      setPatientState(localStorage.getItem("artham_intake_state") || "");
      setAge(localStorage.getItem("artham_intake_age") || "");
      setStage(localStorage.getItem("artham_intake_stage") || "");
      setHormoneStatus(localStorage.getItem("artham_intake_hormone_status") || "");
      setSurgery(localStorage.getItem("artham_intake_surgery") || "");
      setChemo(localStorage.getItem("artham_intake_chemo") || "");
      setRadiation(localStorage.getItem("artham_intake_radiation") || "");
      setHospitalType(localStorage.getItem("artham_intake_hospital_type") || "");
      setHasInsurance(localStorage.getItem("artham_intake_has_insurance") === "true");
      
      const hasIns = localStorage.getItem("artham_intake_has_insurance") === "true";
      const provider = localStorage.getItem("artham_intake_insurance_provider");
      setInsurance(hasIns ? (provider || "Yes (details pending)") : "No Insurance");
      
      setIncomeBracket(localStorage.getItem("artham_intake_income_bracket") || "");
    };

    window.addEventListener("auth-change", syncProfile);
    return () => window.removeEventListener("auth-change", syncProfile);
  }, []);

  const getLocalValue = (field: string, value: string) => {
    if (!value || value === "Not specified" || value === "Pending") return t("it_not_specified");
    if (field === "state") {
      const stateTranslations: Record<string, Record<string, string>> = {
        en: { Karnataka: "Karnataka", Maharashtra: "Maharashtra", Delhi: "Delhi", "Tamil Nadu": "Tamil Nadu", "West Bengal": "West Bengal", Kerala: "Kerala", Gujarat: "Gujarat", Telangana: "Telangana", "Andhra Pradesh": "Andhra Pradesh", "Uttar Pradesh": "Uttar Pradesh", Rajasthan: "Rajasthan", Odisha: "Odisha", Haryana: "Haryana", Punjab: "Punjab", Assam: "Assam", Other: "Other State" },
        hi: { Karnataka: "कर्नाटक", Maharashtra: "महाराष्ट्र", Delhi: "दिल्ली", "Tamil Nadu": "तमिलनाडु", "West Bengal": "पश्चिम बंगाल", Kerala: "केरल", Gujarat: "गुजरात", Telangana: "तेलंगाना", "Andhra Pradesh": "आंध्र प्रदेश", "Uttar Pradesh": "उत्तर प्रदेश", Rajasthan: "राजस्थान", Odisha: "ओडिशा", Haryana: "हरियाणा", Punjab: "पंजाब", Assam: "असम", Other: "अन्य राज्य" },
        mr: { Karnataka: "कर्नाटक", Maharashtra: "महाराष्ट्र", Delhi: "दिल्ली", "Tamil Nadu": "तमिळनाडू", "West Bengal": "पश्चिम बंगाल", Kerala: "केरल", Gujarat: "गुजरात", Telangana: "तेलंगणा", "Andhra Pradesh": "आंध्र प्रदेश", "Uttar Pradesh": "उत्तर प्रदेश", Rajasthan: "राजस्थान", Odisha: "ओडिशा", Haryana: "हरियाणा", Punjab: "पंजाब", Assam: "आसाम", Other: "इतर राज्य" },
        kn: { Karnataka: "ಕರ್ನಾಟಕ", Maharashtra: "ಮಹಾರಾಷ್ಟ್ರ", Delhi: "ದೆಹಲಿ", "Tamil Nadu": "ತಮಿಳುನಾಡು", "West Bengal": "ಪಶ್ಚಿಮ ಬಂಗಾಳ", Kerala: "ಕೇರಳ", Gujarat: "ಗುಜರಾತ್", Telangana: "ತೆಲಂಗಾಣ", "Andhra Pradesh": "ಆಂಧ್ರಪ್ರದೇಶ", "Uttar Pradesh": "ಉತ್ತರ ಪ್ರದೇಶ", Rajasthan: "ರಾಜಸ್ಥಾನ", Odisha: "ಒಡಿಸ್ಸಾ", Haryana: "ಹರಿಯಾಣ", Punjab: "ಪಂಜಾಬ್", Assam: "ಅಸ್ಸಾಂ", Other: "ಇತರ राज्य" },
        bn: { Karnataka: "কর্ণাটক", Maharashtra: "মহারাষ্ট্র", Delhi: "দিল্লি", "Tamil Nadu": "তামিলনাড়ু", "West Bengal": "পশ্চিমবঙ্গ", Kerala: "কেরালা", Gujarat: "গুজরাট", Telangana: "তেলেঙ্গানা", "Andhra Pradesh": "অন্ধ্রপ্রদেশ", "Uttar Pradesh": "উত্তরপ্রদেশ", Rajasthan: "রাজস্থান", Odisha: "ওড়িশা", Haryana: "হরিয়ানা", Punjab: "পাঞ্জাব", Assam: "আসাম", Other: "অন্যান্য রাজ্য" }
      };
      const langDict = stateTranslations[language] || stateTranslations["en"];
      return langDict[value] || value;
    }
    if (field === "stage") {
      if (value === "Stage I") return t("it_stage_i");
      if (value === "Stage II") return t("it_stage_ii");
      if (value === "Stage III") return t("it_stage_iii");
      if (value === "Stage IV") return t("it_stage_iv");
      if (value === "Unsure") return t("it_stage_unsure");
    }
    if (field === "receptor") {
      if (value === "HER2 Positive") return t("it_receptor_her2");
      if (value === "Triple Negative") return t("it_receptor_tn");
      if (value === "ER+/PR+ Positive") return t("it_receptor_erpr");
      if (value === "Unsure") return t("it_receptor_unsure");
    }
    if (field === "yesno") {
      if (value === "Yes") return t("it_yes");
      if (value === "No") return t("it_no");
      if (value === "Unsure") return t("it_unsure");
    }
    if (field === "hospital") {
      if (value === "Government / Public Hospital") return t("it_hospital_gov");
      if (value === "Private Medical Center") return t("it_hospital_priv");
      if (value === "Premium Corporate Hospital") return t("it_hospital_prem");
      if (value === "I'm Unsure") return t("it_hospital_unsure");
    }
    if (field === "insurance") {
      if (value === "Insured" || value.startsWith("Yes") || value === "Yes (details pending)") return t("it_insured");
      if (value === "Not Insured" || value === "No Insurance") return t("it_not_insured");
    }
    if (field === "income") {
      if (value === "Below ₹2,50,000") return t("it_income_below_2_5");
      if (value === "₹2,50,000 – ₹5,00,000") return t("it_income_2_5_to_5");
      if (value === "₹5,00,000 – ₹10,00,000") return t("it_income_5_to_10");
      if (value === "Above ₹10,0,000") return t("it_income_above_10");
    }
    return value;
  };

  const handleResetProfile = () => {
    const confirmMessage = t("it_reset_confirm") || "Are you sure you want to clear your intake profile data? This will restart onboarding.";
    if (window.confirm(confirmMessage)) {
      // Clear local storage
      const INTAKE_KEYS = [
        "artham_intake_state",
        "artham_intake_age",
        "artham_intake_stage",
        "artham_intake_hormone_status",
        "artham_intake_surgery",
        "artham_intake_chemo",
        "artham_intake_radiation",
        "artham_intake_hospital_type",
        "artham_intake_has_insurance",
        "artham_intake_insurance_provider",
        "artham_intake_income_bracket",
        "artham_intake_step"
      ];
      INTAKE_KEYS.forEach(key => localStorage.removeItem(key));

      window.dispatchEvent(new CustomEvent("auth-change"));
    }
  };

  // Determine state welfare program dynamically
  const getStateScheme = (stateName: string) => {
    switch (stateName) {
      case "Maharashtra":
        return {
          name: "Mahatma Jyotiba Phule Jan Arogya Yojana (MJPJAY)",
          description: language === "en" ? "Offers cashless health coverage up to ₹5 Lakhs per family per year in empanelled oncology centers in Maharashtra." :
                       language === "hi" ? "महाराष्ट्र में पैनल में शामिल ऑन्कोलॉजी केंद्रों में प्रति परिवार प्रति वर्ष ₹5 लाख तक का कैशलेस स्वास्थ्य कवरेज प्रदान करता है।" :
                       language === "mr" ? "महाराष्ट्रातील नोंदणीकृत कर्करोग केंद्रांमध्ये प्रति कुटुंब प्रति वर्ष ५ लाख रुपयांपर्यंतचे मोफत वैद्यकीय विमा संरक्षण देते." :
                       language === "kn" ? "ಮಹಾರಾಷ್ಟ್ರದ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ಪ್ರತಿ ಕುಟುಂಬಕ್ಕೆ ವಾರ್ಷಿಕ ₹೫ ಲಕ್ಷದವರೆಗೆ ನಗದು ರಹಿತ ಆರೋಗ್ಯ ರಕ್ಷಣೆ ನೀಡುತ್ತದೆ." :
                       "মহারাষ্ট্রে প্যানেলভুক্ত ক্যান্সার কেন্দ্রগুলিতে প্রতি পরিবারকে বার্ষিক ₹৫ লক্ষ পর্যন্ত ক্যাশলেস স্বাস্থ্য কভারেজ প্রদান করে।"
        };
      case "Karnataka":
        return {
          name: "Arogya Karnataka (AB-ArK)",
          description: language === "en" ? "Covers up to ₹5 Lakhs annually for tertiary oncology chemotherapy, radiation, and surgeries in Karnataka." :
                       language === "hi" ? "कर्नाटक में तृतीयक ऑन्कोलॉजी कीमोथेरेपी, विकिरण और सर्जरी के लिए सालाना ₹5 लाख तक का कवर।" :
                       language === "mr" ? "कर्नाटकातील तृतीयक ऑन्कोलॉजी केमोथेरपी, रेडिएशन आणि शस्त्रक्रियांसाठी वार्षिक ५ लाख रुपयांपर्यंतचे संरक्षण." :
                       language === "kn" ? "ಕರ್ನಾಟಕದಲ್ಲಿ ಕ್ಯಾನ್ಸರ್ ಕೀಮೋಥೆರಪಿ, ರೇಡಿಯೇಷನ್ ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗಳಿಗೆ ವಾರ್ಷಿಕ ₹೫ ಲಕ್ಷದವರೆಗೆ ನೆರವು ನೀಡುತ್ತದೆ." :
                       "কর্ণাটকে তৃতীয় স্তরের ক্যান্সার কেমোথেরাপি, রেডিয়েশন এবং সার্জারির জন্য বার্ষিক ₹৫ লক্ষ পর্যন্ত কভার প্রদান করে।"
        };
      case "West Bengal":
        return {
          name: "Swasthya Sathi Scheme",
          description: language === "en" ? "Provides smart card-based health insurance offering up to ₹5 Lakhs annually for cancer treatments in West Bengal." :
                       language === "hi" ? "पश्चिम बंगाल में कैंसर के इलाज के लिए सालाना ₹5 लाख तक का स्मार्ट कार्ड-आधारित स्वास्थ्य बीमा प्रदान करता है।" :
                       language === "mr" ? "पश्चिम बंगालमधील कर्करोगाच्या उपचारांसाठी वार्षिक ५ लाख रुपयांपर्यंतचे स्मार्ट कार्ड-आधारित आरोग्य विमा प्रदान करते." :
                       language === "kn" ? "ಪಶ್ಚಿಮ ಬಂಗಾಳದಲ್ಲಿ ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆಗಳಿಗಾಗಿ ವಾರ್ಷಿಕ ₹೫ ಲಕ್ಷದವರೆಗೆ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್ ಆಧಾರಿತ ಆರೋಗ್ಯ ವಿಮೆ ಒದಗಿಸುತ್ತದೆ." :
                       "পশ্চিমবঙ্গে ক্যান্সারের চিকিৎসার জন্য বার্ষিক ₹৫ লক্ষ পর্যন্ত স্মার্ট কার্ড-ভিত্তিক স্বাস্থ্য বীমা প্রদান করে।"
        };
      case "Tamil Nadu":
        return {
          name: "Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS)",
          description: language === "en" ? "Cashless welfare cover up to ₹5 Lakhs per family per year for advanced oncology packages in Tamil Nadu." :
                       language === "hi" ? "तमिलनाडु में उन्नत ऑन्कोलॉजी पैकेजों के लिए प्रति परिवार प्रति वर्ष ₹5 लाख तक का कैशलेस कल्याण कवर।" :
                       language === "mr" ? "तमिळनाडूमध्ये प्रगत ऑन्कोलॉजी पॅकेजसाठी प्रति कुटुंब प्रति वर्ष ५ लाख रुपयांपर्यंतचे मोफत विमा संरक्षण." :
                       language === "kn" ? "ತಮಿಳುನಾಡಿನಲ್ಲಿ ಸುಧಾರಿತ ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆಗಾಗಿ ಪ್ರತಿ ಕುಟುಂಬಕ್ಕೆ ವಾರ್ಷಿಕ ₹೫ ಲಕ್ಷದವರೆಗೆ ನಗದು ರಹಿತ ರಕ್ಷಣೆ." :
                       "তামিলনাড়ুতে উন্নত ক্যান্সারের চিকিৎসার জন্য প্রতি পরিবারকে বার্ষিক ₹৫ লক্ষ পর্যন্ত ক্যাশলেস কল্যাণ কভার।"
        };
      case "Kerala":
        return {
          name: "Karunya Arogya Suraksha Padhathi (KASP)",
          description: language === "en" ? "Offers family health protection up to ₹5 Lakhs per year for specified cancer diagnostic scans and chemo cycles." :
                       language === "hi" ? "निर्दिष्ट कैंसर नैदानिक स्कैन और कीमो चक्रों के लिए प्रति वर्ष ₹5 लाख तक की पारिवारिक स्वास्थ्य सुरक्षा प्रदान करता है।" :
                       language === "mr" ? "विशिष्ट कर्करोग चाचण्या आणि केमो सायकलसाठी प्रति वर्ष ५ लाख रुपयांपर्यंतचे कौटुंबिक आरोग्य संरक्षण प्रदान करते." :
                       language === "kn" ? "ನಿಗದಿತ ಕ್ಯಾನ್ಸರ್ ತಪಾಸಣೆಗಳು ಮತ್ತು ಕೀಮೋ ಚಕ್ರಗಳಿಗೆ ವರ್ಷಕ್ಕೆ ₹೫ ಲಕ್ಷದವರೆಗೆ ಕೌಟುಂಬಿಕ ಆರೋಗ್ಯ ರಕ್ಷಣೆ ಒದಗಿಸುತ್ತದೆ." :
                       "নির্দিষ্ট ক্যান্সারের ডায়াগনস্টিক স্ক্যান এবং কেমো চক্রের জন্য প্রতি বছর ₹৫ লক্ষ পর্যন্ত পারিবারিক স্বাস্থ্য সুরক্ষা প্রদান করে।"
        };
      case "Delhi":
        return {
          name: "Delhi Arogya Kosh (DAK)",
          description: language === "en" ? "Delhi government aid covering costs of diagnostic imaging scans and cancer surgeries at approved partner labs." :
                       language === "hi" ? "दिल्ली सरकार की सहायता स्वीकृत भागीदार प्रयोगशालाओं में नैदानिक इमेजिंग स्कैन और कैंसर सर्जरी की लागत को कवर करती है।" :
                       language === "mr" ? "मान्यताप्राप्त भागीदार लॅबमध्ये चाचण्या आणि कर्करोग शस्त्रक्रियांच्या खर्चाचा समावेश असलेले दिल्ली सरकारचे सहाय्य." :
                       language === "kn" ? "ಅಂಗೀಕೃತ ಪ್ರಯೋಗಾಲಯಗಳಲ್ಲಿ ಕ್ಯಾನ್ಸರ್ ತಪಾಸಣೆಗಳು ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗಳ ವೆಚ್ಚವನ್ನು ಭರಿಸುವ ದೆಹಲಿ ಸರ್ಕಾರದ ಸಹಾಯ." :
                       "দিল্লির অনুমোদিত অংশীদার ল্যাবগুলিতে ডায়াগনস্টিক ইমেজিং স্ক্যান এবং ক্যান্সার সার্জারির খরচ বহনকারী দিল্লি সরকারের সহায়তা।"
        };
      case "Gujarat":
        return {
          name: "Mukhyamantri Amrutam (MA) Yojana",
          description: language === "en" ? "Provides cashless medical assistance up to ₹5 Lakhs for cancer packages to lower-income families in Gujarat." :
                       language === "hi" ? "गुजरात में कम आय वाले परिवारों को कैंसर पैकेजों के लिए ₹5 लाख तक की कैशलेस चिकित्सा सहायता प्रदान करता है।" :
                       language === "mr" ? "गुजरात मधील अल्प उत्पन्न कुटुंबांना कर्करोगाच्या उपचारांसाठी ५ लाख रुपयांपर्यंतचे मोफत वैद्यकीय सहाय्य प्रदान करते." :
                       language === "kn" ? "ಗುಜರಾತ್‌ನಲ್ಲಿ ಕಡಿಮೆ ಆದಾಯದ ಕುಟುಂಬಗಳಿಗೆ ಕ್ಯಾನ್ಸರ್ ಪ್ಯಾಕೇಜ್‌ಗಳಿಗಾಗಿ ₹೫ ಲಕ್ಷದವರೆಗೆ ನಗದು ರಹಿತ ನೆರವು ನೀಡುತ್ತದೆ." :
                       "গুজরাটের নিম্ন আয়ের পরিবারগুলিকে ক্যান্সারের জন্য ₹৫ লক্ষ পর্যন্ত ক্যাশলেস চিকিৎসা সহায়তা প্রদান করে।"
        };
      case "Telangana":
      case "Andhra Pradesh":
        return {
          name: "Dr. YSR Aarogyasri Health Scheme",
          description: language === "en" ? "State-sponsored cashless healthcare covering critical cancer operations and chemotherapy cycles." :
                       language === "hi" ? "राज्य प्रायोजित कैशलेस स्वास्थ्य सेवा जिसमें महत्वपूर्ण कैंसर ऑपरेशन और कीमोथेरेपी चक्र शामिल हैं।" :
                       language === "mr" ? "महत्त्वाच्या कर्करोग शस्त्रक्रिया आणि केमोथेरपी सायकलचा समावेश असलेले राज्य पुरस्कृत मोफत वैद्यकीय संरक्षण." :
                       language === "kn" ? "ಕ್ಯಾನ್ಸರ್ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗಳು ಮತ್ತು ಕೀಮೋಥೆರಪಿ ಚಕ್ರಗಳನ್ನು ಭರಿಸುವ ರಾಜ್ಯ ಪ್ರಾಯೋಜಿತ ನಗದು ರಹಿತ ಆರೋಗ್ಯ ಸೇವೆ." :
                       "রাজ্য স্পনসরিত ক্যাশলেস স্বাস্থ্য পরিষেবা যা জটিল ক্যান্সারের অপারেশন এবং কেমোথেরাপি কভার করে।"
        };
      case "Rajasthan":
        return {
          name: "Mukhyamantri Chiranjeevi Swasthya Bima Yojana",
          description: language === "en" ? "Offers cashless health coverage up to ₹25 Lakhs per family per year for major oncology treatments." :
                       language === "hi" ? "प्रमुख ऑन्कोलॉजी उपचारों के लिए प्रति परिवार प्रति वर्ष ₹25 लाख तक का कैशलेस स्वास्थ्य कवरेज प्रदान करता है।" :
                       language === "mr" ? "प्रमुख कर्करोग उपचारांसाठी प्रति कुटुंब प्रति वर्ष २५ लाख रुपयांपर्यंतचे मोफत आरोग्य संरक्षण प्रदान करते." :
                       language === "kn" ? "ಪ್ರಮುಖ ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆಗಳಿಗಾಗಿ ಪ್ರತಿ ಕುಟುಂಬಕ್ಕೆ ವಾರ್ಷಿಕ ₹೨೫ ಲಕ್ಷದವರೆಗೆ ನಗದು ರಹಿತ ರಕ್ಷಣೆ ಒದಗಿಸುತ್ತದೆ." :
                       "প্রধান ক্যান্সারের চিকিৎসার জন্য প্রতি পরিবারকে বার্ষিক ₹২৫ লক্ষ পর্যন্ত ক্যাশলেস স্বাস্থ্য কভারেজ প্রদান করে।"
        };
      case "Odisha":
        return {
          name: "Biju Swasthya Kalyan Yojana (BSKY)",
          description: language === "en" ? "Welfare scheme covering up to ₹10 Lakhs for female oncology care in Odisha." :
                       language === "hi" ? "ओडिशा में महिलाओं की ऑन्कोलॉजी देखभाल के लिए ₹10 लाख तक की सहायता प्रदान करने वाली कल्याणकारी योजना।" :
                       language === "mr" ? "ओडिशामधील महिला कर्करोग रुग्णांच्या उपचारांसाठी १० लाख रुपयांपर्यंतचे संरक्षण देणारी कल्याणकारी योजना." :
                       language === "kn" ? "ಒಡಿಶಾದಲ್ಲಿ ಮಹಿಳಾ ಕ್ಯಾನ್ಸರ್ ರೋಗಿಗಳ ಚಿಕಿತ್ಸೆಗಾಗಿ ₹೧೦ ಲಕ್ಷದವರೆಗೆ ನೆರವು ನೀಡುವ ಕಲ್ಯಾಣ ಯೋಜನೆ." :
                       "ওড়িশায় মহিলা ক্যান্সার রোগীদের চিকিৎসার জন্য ₹১০ লক্ষ পর্যন্ত কভার প্রদানকারী কল্যাণ প্রকল্প।"
        };
      default:
        return {
          name: "Ayushman Bharat (PM-JAY)",
          description: language === "en" ? "National public health cover up to ₹5 Lakhs per year for advanced cancer chemotherapy and operations." :
                       language === "hi" ? "उन्नत कैंसर कीमोथेरेपी और ऑपरेशनों के लिए प्रति वर्ष ₹5 लाख तक का राष्ट्रीय सार्वजनिक स्वास्थ्य कवर।" :
                       language === "mr" ? "प्रगत कर्करोग केमोथेरपी आणि शस्त्रक्रियांसाठी प्रति वर्ष ५ लाख रुपयांपर्यंतचे राष्ट्रीय सार्वजनिक आरोग्य संरक्षण." :
                       language === "kn" ? "ಸುಧಾರಿತ ಕ್ಯಾನ್ಸರ್ ಕೀಮೋಥೆರಪಿ ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗಳಿಗಾಗಿ ವಾರ್ಷಿಕ ₹೫ ಲಕ್ಷದವರೆಗೆ ರಾಷ್ಟ್ರೀಯ ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ರಕ್ಷಣೆ." :
                       "উন্নত ক্যান্সারের কেমোথেরাপি এবং অপারেশনের জন্য প্রতি বছর ₹৫ লক্ষ পর্যন্ত জাতীয় জনস্বাস্থ্য কভার।"
        };
    }
  };

  const stateScheme = getStateScheme(patientState);

  // Interactive state variables
  const [docs, setDocs] = useState<Doc[]>(docsInitial);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [completedSchemeSteps, setCompletedSchemeSteps] = useState<string[]>([]);

  // Derive timeline steps reactively
  const timelineSteps: TimelineStepType[] = [];
  
  const step1 = localizedTimeline(1, stateScheme.name, language);
  timelineSteps.push({ n: 1, title: step1.title, body: step1.body, completed: completedSteps.includes(1) });
  
  const step2 = localizedTimeline(2, stateScheme.name, language);
  timelineSteps.push({ n: 2, title: step2.title, body: step2.body, hint: step2.hint, completed: completedSteps.includes(2) });

  let currentDayNum = 3;
  if (surgery === "Yes" || surgery === "Unsure") {
    const surgeryDay = currentDayNum++;
    const stepSurg = localizedTimeline(3, stateScheme.name, language);
    // Replace titles to match dynamic day
    const dynamicTitle = language === "en" ? `Day ${surgeryDay}: Pre-Surgical Consultation` :
                         language === "hi" ? `दिन ${surgeryDay}: सर्जरी-पूर्व परामर्श` :
                         language === "mr" ? `दिवस ${surgeryDay}: शस्त्रक्रिया-पूर्व सल्लामसलत` :
                         language === "kn" ? `ದಿನ ${surgeryDay}: ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗೂ ಮುನ್ನ ಸಮಾಲೋಚನೆ` :
                         `দিন ${surgeryDay}: সার্জারি-পূর্ব পরামর্শ`;
    timelineSteps.push({
      n: surgeryDay,
      title: dynamicTitle,
      body: stepSurg.body,
      completed: completedSteps.includes(surgeryDay)
    });
  }

  if (chemo === "Yes" || chemo === "Unsure") {
    const chemoDay = currentDayNum++;
    const stepChemo = localizedTimeline(4, stateScheme.name, language);
    const dynamicTitle = language === "en" ? `Day ${chemoDay}: Chemotherapy Plan Approval` :
                         language === "hi" ? `दिन ${chemoDay}: कीमोथेरेपी योजना स्वीकृति` :
                         language === "mr" ? `दिवस ${chemoDay}: केमोथेरपी योजना मंजुरी` :
                         language === "kn" ? `ದಿನ ${chemoDay}: ಕೀಮೋಥೆರಪಿ ಯೋಜನೆ ಅನುಮೋದನೆ` :
                         `দিন ${chemoDay}: কেমোথেরাপি পরিকল্পনা অনুমোদন`;
    timelineSteps.push({
      n: chemoDay,
      title: dynamicTitle,
      body: stepChemo.body,
      completed: completedSteps.includes(chemoDay)
    });
  }

  const finalDay = currentDayNum;
  const stepFinal = localizedTimeline(5, stateScheme.name, language);
  const dynamicTitle = language === "en" ? `Day ${finalDay}: Submit Final Application` :
                       language === "hi" ? `दिन ${finalDay}: अंतिम आवेदन जमा करें` :
                       language === "mr" ? `दिवस ${finalDay}: अंतिम अर्ज सादर करा` :
                       language === "kn" ? `ದಿನ ${finalDay}: ಕೊನೆಯ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ` :
                       `দিন ${finalDay}: চূড়ান্ত আবেদন জমা দিন`;
  timelineSteps.push({
    n: finalDay,
    title: dynamicTitle,
    body: stepFinal.body,
    disabled: true,
    completed: completedSteps.includes(finalDay)
  });

  // Helper callbacks
  const toggleDoc = (i: number) => {
    setDocs((prev) =>
      prev.map((d, idx) =>
        idx === i ? { ...d, status: d.status === "ready" ? "pending" : "ready" } : d
      )
    );
  };

  const toggleTimeline = (stepNum: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNum)
        ? prev.filter((n) => n !== stepNum)
        : [...prev, stepNum]
    );
  };

  const toggleSchemeStep = (schemeId: string, stepIdx: number) => {
    const key = `${schemeId}_${stepIdx}`;
    setCompletedSchemeSteps((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isDocReady = (docName: string) => {
    const found = docs.find((d) => d.name.toLowerCase().includes(docName.toLowerCase()));
    return found ? found.status === "ready" : false;
  };

  // Derive suggested schemes based on user variables
  const suggestedSchemes: {
    id: string;
    type: string;
    title: string;
    description: string;
    matchReason: string;
    suitability: string;
    matchScore: number;
    steps: { head: string; sub: string }[];
    documents: string[];
    contact: { tollFree: string; deskName: string; actionUrl: string };
  }[] = [];

  // 1. State government scheme
  suggestedSchemes.push({
    id: "state_govt",
    type: language === "en" ? "Government Scheme" : language === "hi" ? "सरकारी योजना" : language === "mr" ? "शासकीय योजना" : language === "kn" ? "ಸರ್ಕಾರಿ ಯೋಜನೆ" : "সরকারি প্রকল্প",
    title: stateScheme.name,
    description: stateScheme.description,
    matchReason: language === "en" ? `Eligible as a resident of ${patientState || "India"}.` :
                 language === "hi" ? `${patientState || "भारत"} के निवासी के रूप में पात्र।` :
                 language === "mr" ? `${patientState || "भारत"} रहिवासी म्हणून पात्र.` :
                 language === "kn" ? `${patientState || "ಭಾರತ"} ನಿವಾಸಿಯಾಗಿರುವುದರಿಂದ ಅರ್ಹರು.` :
                 `${patientState || "ভারত"} এর বাসিন্দা হিসেবে যোগ্য।`,
    suitability: language === "en" ? "High" : language === "hi" ? "उच्च" : language === "mr" ? "उच्च" : language === "kn" ? "ಹೆಚ್ಚು" : "উচ্চ",
    matchScore: 95,
    steps: [
      { 
        head: language === "en" ? "Visit the Empanelled Hospital Nodal Counter" :
              language === "hi" ? "पैनलबद्ध अस्पताल नोडल काउंटर पर जाएँ" :
              language === "mr" ? "नोंदणीकृत रुग्णालयाच्या नोडल काउंटरला भेट द्या" :
              language === "kn" ? "ಆಸ್ಪತ್ರೆಯ ನೋಡಲ್ ಕೌಂಟರ್‌ಗೆ ಭೇಟಿ ನೀಡಿ" :
              "প্যানেলভুক্ত হাসপাতাল নোডাল কাউন্টারে যান", 
        sub: language === "en" ? `Ask for the '${patientState === "Karnataka" ? "Arogya Mitra" : patientState === "Maharashtra" ? "Arogya Sevak" : "Scheme coordinator"}' desk.` :
             language === "hi" ? `नोडल डेस्क पर '${patientState === "Karnataka" ? "आरोग्य मित्र" : patientState === "Maharashtra" ? "आरोग्य सेवक" : "योजना समन्वयक"}' के बारे में पूछें।` :
             language === "mr" ? `'${patientState === "Karnataka" ? "आरोग्य मित्र" : patientState === "Maharashtra" ? "आरोग्य सेवक" : "योजना समन्वयक"}' डेस्कबद्दल विचारणा करा.` :
             language === "kn" ? `'${patientState === "Karnataka" ? "ಆರೋಗ್ಯ ಮಿತ್ರ" : patientState === "Maharashtra" ? "ಆರೋಗ್ಯ ಸೇವಕ" : "ಯೋಜನಾ ಸಂಯೋಜಕರು"}' ಡೆಸ್ಕ್ ಬಗ್ಗೆ ವಿಚಾರಿಸಿ.` :
             `'${patientState === "Karnataka" ? "আরোগ্য মিত্র" : patientState === "Maharashtra" ? "আরোগ্য সেবক" : "স্কিম সমন্বয়কারী"}' ডেস্ক সম্পর্কে জিজ্ঞাসা করুন।`
      },
      { 
        head: language === "en" ? "Present ID and Income Documents" :
              language === "hi" ? "पहचान पत्र और आय दस्तावेज प्रस्तुत करें" :
              language === "mr" ? "ओळखपत्र आणि उत्पन्न कागदपत्रे सादर करा" :
              language === "kn" ? "ಗುರುತಿನ ಚೀಟಿ ಮತ್ತು ಆದಾಯ ದಾಖಲೆಗಳನ್ನು ಸಲ್ಲಿಸಿ" :
              "পরিচয়পত্র এবং আয়ের নথিপত্র পেশ করুন", 
        sub: language === "en" ? "Present your Aadhar card, Ration card (BPL/Priority), and Tehsildar income certificate." :
             language === "hi" ? "अपना आधार कार्ड, राशन कार्ड (बीपीएल/प्राथमिकता), और तहसीलदार आय प्रमाण पत्र प्रस्तुत करें।" :
             language === "mr" ? "तुमचे आधार कार्ड, रेशन कार्ड (बीपीएल/प्राधान्य) आणि तहसीलदार उत्पन्न प्रमाणपत्र सादर करा." :
             language === "kn" ? "ನಿಮ್ಮ ಆಧಾರ್ ಕಾರ್ಡ್, ರೇಷನ್ ಕಾರ್ಡ್ (ಬಿಪಿಎಲ್), ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರವನ್ನು ತೋರಿಸಿ." :
             "আপনার আধার কার্ড, রেশন কার্ড (বিপিএল/অগ্রাধিকার), এবং তহশিলদার আয়ের শংসাপত্র পেশ করুন।"
      },
      { 
        head: language === "en" ? "Obtain Pre-Authorization Certificate" :
              language === "hi" ? "पूर्व-प्राधिकरण प्रमाणपत्र प्राप्त करें" :
              language === "mr" ? "पूर्व-मंजुरी प्रमाणपत्र मिळवा" :
              language === "kn" ? "ಪೂರ್ವ-ಅನುಮೋದನೆ ಪತ್ರವನ್ನು ಪಡೆಯಿರಿ" :
              "প্রাক-অনুমোদন শংসাপত্র সংগ্রহ করুন", 
        sub: language === "en" ? "The hospital coordinator will submit your medical reports to the state board for cashless treatment clearance." :
             language === "hi" ? "अस्पताल समन्वयक कैशलेस उपचार मंजूरी के लिए आपकी मेडिकल रिपोर्ट राज्य बोर्ड को प्रस्तुत करेगा।" :
             language === "mr" ? "रुग्णालय समन्वयक मोफत उपचारांच्या मंजुरीसाठी तुमचे वैद्यकीय अहवाल राज्य मंडळाकडे सादर करतील." :
             language === "kn" ? "ಆಸ್ಪತ್ರೆಯ ಸಂಯೋಜಕರು ನಗದು ರಹಿತ ಚಿಕಿत्ಸೆಗೆ ಅನುಮೋದನೆ ಪಡೆಯಲು ನಿಮ್ಮ ವರदीಗಳನ್ನು ಮಂಡಳಿಗೆ ಸಲ್ಲಿಸುತ್ತಾರೆ." :
             "হাসপাতাল সমন্বয়কারী ক্যাশলেস চিকিৎসার ছাড়পত্রের জন্য আপনার মেডিকেল রিপোর্ট রাজ্য বোর্ডে জমা দেবেন।"
      }
    ],
    documents: ["Aadhar Card", "Ration Card", "Income Certificate"],
    contact: {
      tollFree: "104 (State Health Helpline)",
      deskName: language === "en" ? "Hospital Scheme Nodal Office" :
                language === "hi" ? "अस्पताल योजना नोडल कार्यालय" :
                language === "mr" ? "रुग्णालय योजना नोडल कार्यालय" :
                language === "kn" ? "ಆಸ್ಪತ್ರೆ ಯೋಜನಾ ನೋಡಲ್ ಕಚೇರಿ" :
                "হাসপাতাল স্কিম নোডাল অফিস",
      actionUrl: "/schemes"
    }
  });

  // 2. Private Trust Aid
  const isLowerIncome = incomeBracket === "Below ₹2,50,000" || incomeBracket === "₹2,50,000 – ₹5,00,000";
  if (isLowerIncome || hospitalType === "Government / Public Hospital") {
    suggestedSchemes.push({
      id: "private_trust",
      type: language === "en" ? "Private Trust Aid" : language === "hi" ? "निजी ट्रस्ट सहायता" : language === "mr" ? "खाजगी ट्रस्ट मदत" : language === "kn" ? "ಖಾಸಗಿ ಟ್ರಸ್ಟ್ ನೆರವು" : "বেসরকারি ট্রাস্ট সহায়তা",
      title: language === "en" ? "Tata Trusts Financial Assistance" :
             language === "hi" ? "टाटा ट्रस्ट वित्तीय सहायता" :
             language === "mr" ? "टाटा ट्रस्ट वित्तीय सहाय्यता" :
             language === "kn" ? "ಟಾಟಾ ಟ್ರಸ್ಟ್ ಆರ್ಥಿಕ ಸಹಾಯ" :
             "টাটা ট্রাস্ট আর্থিক সহায়তা",
      description: language === "en" ? "Provides grant-based financial subsidies for critical cancer medicines, chemotherapy cycles, and radiation packages in empanelled cancer centres." :
                   language === "hi" ? "पैनलबद्ध कैंसर केंद्रों में महत्वपूर्ण कैंसर दवाओं, कीमोथेरेपी चक्रों और विकिरण पैकेजों के लिए अनुदान-आधारित वित्तीय सब्सिडी प्रदान करता है।" :
                   language === "mr" ? "नोंदणीकृत कर्करोग केंद्रांमध्ये औषधे, केमोथेरपी सायकल आणि रेडिएशन पॅकेजसाठी अनुदान-आधारित वित्तीय मदत प्रदान करते." :
                   language === "kn" ? "ಕ್ಯಾನ್ಸರ್ ಔಷಧಿಗಳು, ಕೀಮೋ ಚಕ್ರಗಳು ಮತ್ತು ರೇಡಿಯೇಷನ್ ವೆಚ್ಚಗಳಿಗೆ ಸಹಾಯಧನ ಒದಗಿಸುತ್ತದೆ." :
                   "প্যানেলভুক্ত ক্যান্সার কেন্দ্রগুলিতে জটিল ক্যান্সারের ওষুধ, কেমোথেরাপি চক্র এবং রেডিয়েশন প্যাকেজের জন্য অনুদান-ভিত্তিক আর্থিক ভর্তুকি প্রদান করে।",
      matchReason: language === "en" ? `Matched due to income bracket (${incomeBracket}) or public hospital choice.` :
                   language === "hi" ? `आय वर्ग (${incomeBracket}) या सरकारी अस्पताल के विकल्प के कारण मिलान किया गया।` :
                   language === "mr" ? `उत्पन्न गट (${incomeBracket}) किंवा शासकीय रुग्णालयाच्या पर्यायामुळे जुळले.` :
                   language === "kn" ? `ಆದಾಯ ವರ್ಗ (${incomeBracket}) ಅಥವಾ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಯ ಆಯ್ಕೆಯಿಂದಾಗಿ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.` :
                   `আয়ের সীমা (${incomeBracket}) বা সরকারি হাসপাতালের পছন্দের কারণে সামঞ্জস্যপূর্ণ।`,
      suitability: language === "en" ? "Moderate to High" : language === "hi" ? "मध्यम से उच्च" : language === "mr" ? "मध्यम ते उच्च" : language === "kn" ? "ಮಧ್ಯಮದಿಂದ ಹೆಚ್ಚು" : "মাঝারি থেকে উচ্চ",
      matchScore: 84,
      steps: [
        { 
          head: language === "en" ? "Obtain Application Form" :
                language === "hi" ? "आवेदन पत्र प्राप्त करें" :
                language === "mr" ? "अर्ज मिळवा" :
                language === "kn" ? "ಅರ್ಜಿ ನಮೂನೆಯನ್ನು ಪಡೆಯಿರಿ" :
                "আবেদনপত্র সংগ্রহ করুন", 
          sub: language === "en" ? "Request Form T-202 from the hospital social worker or download from the Tata Trusts website." :
               language === "hi" ? "अस्पताल के सामाजिक कार्यकर्ता से फॉर्म टी-202 का अनुरोध करें या टाटा ट्रस्ट की वेबसाइट से डाउनलोड करें।" :
               language === "mr" ? "रुग्णालयातील समाजसेवकाकडून फॉर्म T-202 मिळवा किंवा टाटा ट्रस्टच्या संकेतस्थळावरून डाऊनलोड करा." :
               language === "kn" ? "ಆಸ್ಪತ್ರೆಯ ಸಮಾಜ ಸೇವಕರಿಂದ ಫಾರ್ಮ್ T-202 ಪಡೆಯಿರಿ ಅಥವಾ ಟಾಟಾ ಟ್ರಸ್ಟ್ ವೆಬ್‌ಸೈಟ್‌ನಿಂದ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ." :
               "হাসপাতালের সমাজকর্মীর কাছ থেকে ফর্ম T-202 সংগ্রহ করুন বা টাটা ট্রাস্টের ওয়েবসাইট থেকে ডাউনলোড করুন।"
        },
        { 
          head: language === "en" ? "Oncologist Certification" :
                language === "hi" ? "ऑन्कोलॉजिस्ट प्रमाणन" :
                language === "mr" ? "कर्करोगतज्ज्ञांचे प्रमाणपत्र" :
                language === "kn" ? "ಕ್ಯಾನ್ಸರ್ ತಜ್ಞರ ದೃಢೀಕರಣ" :
                "ক্যান্সার বিশেষজ্ঞের শংসাপত্র", 
          sub: language === "en" ? "Get the application certified and stamped by the treating oncology surgeon or chief medical superintendent." :
               language === "hi" ? "उपचार करने वाले ऑन्कोलॉजी सर्जन या मुख्य चिकित्सा अधीक्षक द्वारा आवेदन को प्रमाणित और मुद्रांकित करवाएं।" :
               language === "mr" ? "उपचार करणाऱ्या कर्करोगतज्ज्ञांकडून किंवा मुख्य वैद्यकीय अधीक्षकांकडून अर्ज प्रमाणित करून घ्या." :
               language === "kn" ? "ಚಿಕಿತ್ಸೆ ನೀಡುವ ವೈದ್ಯರಿಂದ ಅರ್ಜಿಯನ್ನು ದೃಢೀಕರಿಸಿ ಸಹಿ ಪಡೆಯಿರಿ." :
               "চিকিত্সাধীন ক্যান্সার সার্জন বা প্রধান মেডিকেল সুপারের কাছ থেকে আবেদনপত্রটি সার্টিফাইড এবং স্ট্যাম্প করিয়ে নিন।"
        },
        { 
          head: language === "en" ? "Submit Original Estimates" :
                language === "hi" ? "मूल अनुमान दस्तावेज जमा करें" :
                language === "mr" ? "मूळ खर्चाचे अंदाज पत्रक सादर करा" :
                language === "kn" ? "ಮೂಲ ವೆಚ್ಚದ ಅಂದಾಜುಗಳನ್ನು ಸಲ್ಲಿಸಿ" :
                "মূল খরচের বিবরণ জমা দিন", 
          sub: language === "en" ? "Provide original cost estimate sheets from the hospital along with identity proof." :
               language === "hi" ? "पहचान पत्र के साथ अस्पताल से मूल लागत अनुमान पत्रक प्रदान करें।" :
               language === "mr" ? "ओळखपुराव्यासह रुग्णालयाकडून मिळालेले मूळ खर्चाचे अंदाज पत्रक जोडा." :
               language === "kn" ? "ಆಸ್ಪತ್ರೆಯ ಮೂಲ ವೆಚ್ಚದ ಅಂದಾಜು ಹಾಳೆಯನ್ನು ಗುರುತಿನ ಚೀಟಿಯೊಂದಿಗೆ ಸಲ್ಲಿಸಿ." :
               "পরিচয়পত্রের সাথে হাসপাতালের মূল খরচের বিবরণী পত্র জমা দিন।"
        }
      ],
      documents: ["Income Certificate", "Medical Reports", "Aadhar Card"],
      contact: {
        tollFree: "022-66658282 (Mumbai Corporate Office)",
        deskName: language === "en" ? "Medical Social Worker (MSW) Dept" :
                  language === "hi" ? "चिकित्सा सामाजिक कार्यकर्ता (MSW) विभाग" :
                  language === "mr" ? "वैद्यकीय समाजसेवक विभाग" :
                  language === "kn" ? "ಸಮಾಜ ಸೇವಕರ ವಿಭಾಗ" :
                  "মেডিকেল সোশ্যাল ওয়ার্কার (MSW) বিভাগ",
        actionUrl: "/schemes"
      }
    });
  }

  // 3. National RAN Scheme
  if ((incomeBracket === "Below ₹2,50,000" || incomeBracket === "Not specified") && hospitalType === "Government / Public Hospital") {
    suggestedSchemes.push({
      id: "national_ran",
      type: language === "en" ? "National Government Scheme" : language === "hi" ? "राष्ट्रीय सरकारी योजना" : language === "mr" ? "राष्ट्रीय शासकीय योजना" : language === "kn" ? "ರಾಷ್ಟ್ರೀಯ ಸರ್ಕಾರಿ ಯೋಜನೆ" : "জাতীয় সরকারি প্রকল্প",
      title: "Rashtriya Arogya Nidhi (RAN) - HMCSF",
      description: language === "en" ? "One-time financial assistance up to ₹15 Lakhs for super-specialty treatment of life-threatening illnesses in Government Hospitals for BPL families." :
                   language === "hi" ? "बीपीएल परिवारों के लिए सरकारी अस्पतालों में जानलेवा बीमारियों के सुपर-स्पेशियलिटी उपचार के लिए ₹15 लाख तक की एकमुश्त वित्तीय सहायता।" :
                   language === "mr" ? "दारिद्र्यरेषेखालील (BPL) कुटुंबांना सरकारी रुग्णालयात गंभीर आजारांच्या उपचारासाठी १५ लाख रुपयांपर्यंतची एकवेळची आर्थिक मदत." :
                   language === "kn" ? "ಬಿಪಿಎಲ್ ಕುಟುಂಬಗಳಿಗೆ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ಗಂಭೀರ ಕಾಯಿಲೆಗಳ ಚಿಕಿತ್ಸೆಗಾಗಿ ₹೧೫ ಲಕ್ಷದವರೆಗೆ ಏಕಕಾಲದ ಆರ್ಥಿಕ ನೆರವು ಒದಗಿಸುತ್ತದೆ." :
                   "বিপিএল পরিবারগুলির জন্য সরকারি হাসপাতালে জীবনসংঙ্কট রোগের সুপার-স্পেশালিটি চিকিৎসার জন্য ₹১৫ লক্ষ পর্যন্ত এককালীন আর্থিক সহায়তা।",
      matchReason: language === "en" ? "Eligible due to Government hospital preference and BPL income status." :
                   language === "hi" ? "सरकारी अस्पताल की प्राथमिकता और बीपीएल आय स्थिति के कारण पात्र।" :
                   language === "mr" ? "सरकारी रुग्णालयाची निवड आणि बीपीएल उत्पन्न स्थितीमुळे पात्र." :
                   language === "kn" ? "ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಯ ಆದ್ಯತೆ ಮತ್ತು ಬಿಪಿಎಲ್ ಕಾರ್ಡ್ ಇರುವುದರಿಂದ ಅರ್ಹರು." :
                   "সরকারি হাসপাতালের পছন্দ এবং বিপিএল আয়ের স্তরের কারণে যোগ্য।",
      suitability: language === "en" ? "High" : language === "hi" ? "उच्च" : language === "mr" ? "उच्च" : language === "kn" ? "ಹೆಚ್ಚು" : "উচ্চ",
      matchScore: 90,
      steps: [
        { 
          head: language === "en" ? "Hospital Verification" :
                language === "hi" ? "अस्पताल सत्यापन" :
                language === "mr" ? "रुग्णालय पडताळणी" :
                language === "kn" ? "ಆಸ್ಪತ್ರೆಯ ಪರಿಶೀಲನೆ" :
                "হাসপাতাল যাচাইকরণ", 
          sub: language === "en" ? "Get the prescribed RAN application form filled by the treating oncologist of the government hospital." :
               language === "hi" ? "सरकारी अस्पताल के उपचार करने वाले ऑन्कोलॉजिस्ट द्वारा निर्धारित आरएएन (RAN) आवेदन पत्र भरवाएं।" :
               language === "mr" ? "सरकारी रुग्णालयाच्या कर्करोगतज्ज्ञांकडून विहित नमुन्यातील RAN अर्ज भरून घ्या." :
               language === "kn" ? "ನಿಗದಿತ RAN ಅರ್ಜಿ ನಮೂನೆಯನ್ನು ಆಸ್ಪತ್ರೆಯ ವೈದ್ಯರಿಂದ ಭರ್ತಿ ಮಾಡಿಸಿ." :
               "সরকারি হাসপাতালের চিকিত্সাধীন ক্যান্সার বিশেষজ্ঞের দ্বারা নির্ধারিত RAN আবেদনপত্রটি পূরণ করিয়ে নিন।"
        },
        { 
          head: language === "en" ? "Income & BPL Card Attestation" :
                language === "hi" ? "आय और बीपीएल कार्ड सत्यापन" :
                language === "mr" ? "उत्पन्न आणि बीपीएल कार्ड साक्षांकित करणे" :
                language === "kn" ? "ಆದಾಯ ಮತ್ತು ಬಿಪಿಎಲ್ ಕಾರ್ಡ್ ದೃಢೀಕರಣ" :
                "আয় এবং বিপিএল কার্ডের প্রত্যয়ন", 
          sub: language === "en" ? "Attach attested copies of your BPL card, family income certificate, and Aadhar card." :
               language === "hi" ? "अपने बीपीएल कार्ड, परिवार के आय प्रमाण पत्र और आधार कार्ड की सत्यापित प्रतियां संलग्न करें।" :
               language === "mr" ? "तुमचे बीपीएल कार्ड, उत्पन्न प्रमाणपत्र आणि आधार कार्डच्या साक्षांकित प्रती जोडा." :
               language === "kn" ? "ನಿಮ್ಮ ಬಿಪಿಎಲ್ ಕಾರ್ಡ್, ಕುಟುಂಬ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಆಧಾರ್ ಕಾರ್ಡ್‌ನ ದೃಢೀಕರಿಸಿದ ಪ್ರತಿಗಳನ್ನು ಲಗತ್ತಿಸಿ." :
               "আপনার বিপিএল কার্ড, পারিবারিক আয়ের শংসাপত্র এবং আধার কার্ডের প্রত্যয়িত অনুলিপি সংযুক্ত করুন।"
        },
        { 
          head: language === "en" ? "Submit to Superintendent office" :
                language === "hi" ? "अधीक्षक कार्यालय में जमा करें" :
                language === "mr" ? "अधीक्षक कार्यालयात सादर करा" :
                language === "kn" ? "ಅಧೀಕ್ಷಕರ ಕಚೇರಿಗೆ ಸಲ್ಲಿಸಿ" :
                "সুপারিন্টেন্ডেন্ট অফিসে জমা দিন", 
          sub: language === "en" ? "Submit to the hospital superintendent, who forwards it directly to the Central Health Ministry." :
               language === "hi" ? "अस्पताल अधीक्षक को जमा करें, जो इसे सीधे केंद्रीय स्वास्थ्य मंत्रालय को भेजेंगे।" :
               language === "mr" ? "रुग्णालय अधीक्षकांकडे अर्ज सादर करा, जे तो थेट केंद्रीय आरोग्य मंत्रालयाकडे पाठवतील." :
               language === "kn" ? "ಆಸ್ಪತ್ರೆಯ ಅಧೀಕ್ಷಕರಿಗೆ ಸಲ್ಲಿಸಿ, ಅವರು ಅದನ್ನು ನೇರವಾಗಿ ಕೇಂದ್ರ ಆರೋಗ್ಯ ಸಚಿವಾಲಯಕ್ಕೆ ಕಳುಹಿಸುತ್ತಾರೆ." :
               "হাসপাতাল সুপারের কাছে জমা দিন, যিনি এটি সরাসরি কেন্দ্রীয় স্বাস্থ্য মন্ত্রণালয়ে প্রেরণ করবেন।"
        }
      ],
      documents: ["Ration Card", "Income Certificate", "Aadhar Card"],
      contact: {
        tollFree: "011-23061333 (Ministry of Health & Family Welfare)",
        deskName: language === "en" ? "Medical Superintendent Office" :
                  language === "hi" ? "चिकित्सा अधीक्षक कार्यालय" :
                  language === "mr" ? "वैद्यकीय अधीक्षक कार्यालय" :
                  language === "kn" ? "ವೈದ್ಯಕೀಯ ಅಧೀಕ್ಷಕರ ಕಚೇರಿ" :
                  "মেডিকেল সুপারিন্টেন্ডেন্ট অফিস",
        actionUrl: "/schemes"
      }
    });
  }

  // 4. Insurance Schemes
  if (hasInsurance) {
    suggestedSchemes.push({
      id: "private_insurance",
      type: language === "en" ? "Private Health Insurance" : language === "hi" ? "निजी स्वास्थ्य बीमा" : language === "mr" ? "खाजगी आरोग्य विमा" : language === "kn" ? "ಖಾಸಗಿ ಆರೋಗ್ಯ ವಿಮೆ" : "বেসরকারি স্বাস্থ্য বীমা",
      title: `${insurance} Cashless / Reimbursement Claim`,
      description: language === "en" ? "Commercial health insurance policy coverage for oncology surgeries, inpatient hospitalizations, and daycare chemotherapy." :
                   language === "hi" ? "ऑन्कोलॉजी सर्जरी, इनपेशेंट अस्पताल में भर्ती और डेकेयर कीमोथेरेपी के लिए वाणिज्यिक स्वास्थ्य बीमा पॉलिसी कवरेज।" :
                   language === "mr" ? "कर्करोग शस्त्रक्रिया, रुग्णालय भरती आणि डेकेयर केमोथेरपीसाठी खाजगी आरोग्य विमा संरक्षण." :
                   language === "kn" ? "ಕ್ಯಾನ್ಸರ್ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಗಳು, ಆಸ್ಪತ್ರೆ ದಾಖಲಾತಿ ಮತ್ತು ಕೀಮೋ ಚಿಕಿತ್ಸೆಗಳಿಗೆ ಖಾಸಗಿ ಆರೋಗ್ಯ ವಿಮೆ ರಕ್ಷಣೆ." :
                   "ক্যান্সার সার্জারি, ইনপেশেন্ট হাসপাতালে ভর্তি এবং ডে-কেয়ার কেমোথেরাপির জন্য বাণিজ্যিক স্বাস্থ্য বীমা পলিসি কভারেজ।",
      matchReason: language === "en" ? "Configured in your profile: Private Insurance." :
                   language === "hi" ? "आपके प्रोफ़ाइल में कॉन्फ़िगर किया गया: निजी बीमा।" :
                   language === "mr" ? "तुमच्या प्रोफाइलमध्ये नोंदवलेले: खाजगी विमा." :
                   language === "kn" ? "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ದಾಖಲಿಸಲಾಗಿದೆ: ಖಾಸಗಿ ವಿಮೆ." :
                   "আপনার প্রোফাইলে কনফিগার করা হয়েছে: বেসরকারি বীমা।",
      suitability: language === "en" ? "High" : language === "hi" ? "उच्च" : language === "mr" ? "उच्च" : language === "kn" ? "ಹೆಚ್ಚು" : "উচ্চ",
      matchScore: 92,
      steps: [
        { 
          head: language === "en" ? "File Pre-Authorization" :
                language === "hi" ? "पूर्व-प्राधिकरण फाइल करें" :
                language === "mr" ? "पूर्व-मंजुरीसाठी अर्ज करा" :
                language === "kn" ? "ಪೂರ್ವ-ಅನುಮೋದನೆ ಸಲ್ಲಿಸಿ" :
                "প্রাক-অনুমোদন ফাইল করুন", 
          sub: language === "en" ? "Submit TPA pre-auth form at least 48 hours before surgery or chemo cycle." :
               language === "hi" ? "सर्जरी या कीमो चक्र से कम से कम 48 घंटे पहले टीपीए (TPA) पूर्व-प्राधिकरण फॉर्म जमा करें।" :
               language === "mr" ? "शस्त्रक्रिया किंवा केमो सायकलच्या किमान ४८ तास आधी TPA पूर्व-मंजुरी अर्ज सादर करा." :
               language === "kn" ? "ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಅಥವಾ ಕೀಮೋ ಚಕ್ರಕ್ಕೆ ಕನಿಷ್ಠ 48 ಗಂಟೆಗಳ ಮೊದಲು TPA ಅರ್ಜಿ ಸಲ್ಲಿಸಿ." :
               "অস্ত্রোপচার বা কেমো চক্রের কমপক্ষে ৪৮ ঘণ্টা আগে TPA প্রাক-অনুমোদন ফর্ম জমা দিন।"
        },
        { 
          head: language === "en" ? "Monitor Room Rent Limits" :
                language === "hi" ? "कमरे के किराए की सीमा की निगरानी करें" :
                language === "mr" ? "खोलीच्या भाड्याच्या मर्यादेवर लक्ष ठेवा" :
                language === "kn" ? "ರೂಮ್ ಬಾಡಿಗೆ ಮಿತಿಗಳನ್ನು ಗಮನಿಸಿ" :
                "রুম ভাড়ার সীমা খেয়াল রাখুন", 
          sub: language === "en" ? "Ensure your selected ward stays within room rent caps (typically 1% of Sum Insured) to avoid proportional deductions." :
               language === "hi" ? "सुनिश्चित करें कि आपका चयनित वार्ड आनुपातिक कटौती से बचने के लिए कमरे के किराए की सीमा (आमतौर पर बीमा राशि का 1%) के भीतर हो।" :
               language === "mr" ? "कपाती टाळण्यासाठी तुमचा वॉर्ड खोलीच्या भाड्याच्या मर्यादेत (साधारणपणे विमा रकमेच्या १%) असल्याची खात्री करा." :
               language === "kn" ? "ಹೆಚ್ಚುವರಿ ಕಡಿತಗಳನ್ನು ತಪ್ಪಿಸಲು ನೀವು ಆಯ್ದುಕೊಂಡ ರೂಮ್ ಬಾಡಿಗೆ ಮಿತಿಯೊಳಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ." :
               "আনুপাতিক কর্তন এড়াতে আপনার নির্বাচিত ওয়ার্ডটি রুম ভাড়ার সীমার (সাধারণত বীমাকৃত অংকের ১%) মধ্যে থাকা নিশ্চিত করুন।"
        },
        { 
          head: language === "en" ? "TPA Approval Follow-up" :
                language === "hi" ? "टीपीए अनुमोदन अनुवर्ती" :
                language === "mr" ? "TPA मंजुरीचा पाठपुरावा" :
                language === "kn" ? "TPA ಅನುಮೋದನೆಗಾಗಿ ವಿಚಾರಿಸಿ" :
                "TPA অনুমোদনের ফলো-আপ", 
          sub: language === "en" ? "Track approvals with the hospital desk or call TPA support to expedite pre-clearance." :
               language === "hi" ? "अस्पताल डेस्क के साथ अनुमोदन को ट्रैक करें या पूर्व-निकासी में तेजी लाने के लिए टीपीए सहायता को कॉल करें।" :
               language === "mr" ? "रुग्णालयाच्या काउंटरवर मंजुरीचा मागोवा घ्या किंवा मंजुरी गतीने मिळवण्यासाठी TPA सपोर्टला कॉल करा." :
               language === "kn" ? "ಅನುಮೋದನೆಯನ್ನು ತ್ವರಿತಗೊಳಿಸಲು ಆಸ್ಪತ್ರೆಯ ಸಹಾಯವಾಣಿ ಅಥವಾ TPA ಬೆಂಬಲ ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ." :
               "অনুমোদন ত্বরান্বিত করতে হাসপাতাল ডেস্কের সাথে যোগাযোগ রাখুন বা TPA সহায়তায় কল করুন।"
        }
      ],
      documents: ["Medical Reports", "Aadhar Card"],
      contact: {
        tollFree: "Insurance TPA Desk / Customer Care Support",
        deskName: language === "en" ? "Hospital TPA Desk (Third Party Administrator)" :
                  language === "hi" ? "अस्पताल टीपीए डेस्क (तृतीय पक्ष प्रशासक)" :
                  language === "mr" ? "रुग्णालय TPA डेस्क" :
                  language === "kn" ? "ಆಸ್ಪತ್ರೆ TPA ವಿಭಾಗ" :
                  "হাসপাতাল TPA ডেস্ক",
        actionUrl: "/cost-breakdown"
      }
    });
  } else {
    suggestedSchemes.push({
      id: "crowdfunding_alternatives",
      type: language === "en" ? "Alternative Funding" : language === "hi" ? "वैकल्पिक वित्तपोषण" : language === "mr" ? "पर्यायी निधी" : language === "kn" ? "ಪರ್ಯಾಯ ಧನಸಹಾಯ" : "বিকল্প অর্থায়ন",
      title: "Medical Crowdfunding (Milaap / Ketto)",
      description: language === "en" ? "Create online fundraising campaigns to receive micro-donations from the community for self-paying oncology expenses." :
                   language === "hi" ? "स्वयं-भुगतान वाले कैंसर खर्चों के लिए समुदाय से सूक्ष्म-दान प्राप्त करने के लिए ऑनलाइन क्राउडफंडिंग अभियान बनाएं।" :
                   language === "mr" ? "कर्करोगाच्या खर्चासाठी लोकांमडून मदत मिळवण्यासाठी ऑनलाइन क्राउडफंडिंग मोहीम सुरू करा." :
                   language === "kn" ? "ಕ್ಯಾನ್ಸರ್ ವೆಚ್ಚಗಳಿಗಾಗಿ ಸಮುದಾಯದಿಂದ ದೇಣಿಗೆ ಪಡೆಯಲು ಆನ್‌ಲೈನ್ ಧನಸಹಾಯ ಅಭಿಯಾನಗಳನ್ನು ರಚಿಸಿ." :
                   "ক্যান্সারের খরচের জন্য জনসাধারণের কাছ থেকে অনুদান পেতে অনলাইন ফান্ডরাইজিং অভিযান তৈরি করুন।",
      matchReason: language === "en" ? "Recommended since no commercial private insurance was declared." :
                   language === "hi" ? "सिफारिश की गई क्योंकि कोई व्यावसायिक निजी बीमा घोषित नहीं किया गया था।" :
                   language === "mr" ? "तुमच्याकडे कोणताही खाजगी विमा नसल्यामुळे शिफारस केली आहे." :
                   language === "kn" ? "ಯಾವುದೇ ಖಾಸಗಿ ವಿಮೆ ಇಲ್ಲದಿರುವುದರಿಂದ ಈ ಆಯ್ಕೆಯನ್ನು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ." :
                   "কোনো বাণিজ্যিক বেসরকারি বীমা না থাকায় এটি সুপারিশ করা হচ্ছে।",
      suitability: language === "en" ? "Moderate" : language === "hi" ? "मध्यम" : language === "mr" ? "मध्यम" : language === "kn" ? "ಮಧ್ಯಮ" : "মাঝারি",
      matchScore: 70,
      steps: [
        { 
          head: language === "en" ? "Set up Online Campaign" :
                language === "hi" ? "ऑनलाइन अभियान शुरू करें" :
                language === "mr" ? "ऑनलाइन मोहीम सुरू करा" :
                language === "kn" ? "ಆನ್‌ಲೈನ್ ಅಭಿಯಾನವನ್ನು ಪ್ರಾರಂಭಿಸಿ" :
                "অনলাইন ক্যাম্পেইন শুরু করুন", 
          sub: language === "en" ? "Register a campaign on Milaap or Ketto under 'Medical Fundraiser'." :
               language === "hi" ? "मिलाप या केटो पर 'मेडिकल फंडरेज़र' के तहत एक अभियान पंजीकृत करें।" :
               language === "mr" ? "मिलाप किंवा केटोवर 'वैद्यकीय फंडरेझर' अंतर्गत मोहीम नोंदवा." :
               language === "kn" ? "ಮಿಲಾಪ್ ಅಥವಾ ಕೆಟ್ಟೊದಲ್ಲಿ ಅಭಿಯಾನವನ್ನು ನೋಂದಾಯಿಸಿ." :
               "মিলাপ বা কেটো-তে 'মেডিকেল ফান্ডরাইজার'-এর অধীনে একটি অভিযান রেজিস্টার করুন।"
        },
        { 
          head: language === "en" ? "Submit Verification Documents" :
                language === "hi" ? "सत्यापन दस्तावेज जमा करें" :
                language === "mr" ? "पडताळणी कागदपत्रे सादर करा" :
                language === "kn" ? "ಪರಿಶೀಲನಾ ದಾಖಲೆಗಳನ್ನು ಸಲ್ಲಿಸಿ" :
                "যাচাইকরণের নথি জমা দিন", 
          sub: language === "en" ? "Upload oncologist cost estimates, patient photos, and government ID for platform verification." :
               language === "hi" ? "प्लेटफ़ॉर्म सत्यापन के लिए ऑन्कोलॉजिस्ट लागत अनुमान, रोगी की तस्वीरें और सरकारी आईडी अपलोड करें।" :
               language === "mr" ? "पडताळणीसाठी डॉक्टरांचे खर्चाचे अंदाज पत्रक, रुग्णाचे फोटो आणि सरकारी ओळखपत्र अपलोड करा." :
               language === "kn" ? "ವೆಚ್ಚದ ಅಂದಾಜು ಪತ್ರ, ರೋಗಿಯ ಫೋಟೋ ಮತ್ತು ಗುರುತಿನ ಚೀಟಿಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ." :
               "প্ল্যাটফর্ম যাচাইকরণের জন্য ক্যান্সার বিশেষজ্ঞের খরচের বিবরণী, রোগীর ছবি এবং সরকারি পরিচয়পত্র আপলোড করুন।"
        },
        { 
          head: language === "en" ? "Share with Social Networks" :
                language === "hi" ? "सोशल नेटवर्क पर साझा करें" :
                language === "mr" ? "सोशल मीडियावर शेअर करा" :
                language === "kn" ? "ಸಾಮಾಜಿಕ ಜಾಲತಾಣಗಳಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ" :
                "সোশ্যাল নেটওয়ার্কে শেয়ার করুন", 
          sub: language === "en" ? "Share the verified campaign link on WhatsApp and Facebook to gather donations." :
               language === "hi" ? "दान एकत्र करने के लिए सत्यापित अभियान लिंक को व्हाट्सएप और फेसबुक पर साझा करें।" :
               language === "mr" ? "मदत गोळा करण्यासाठी पडताळणी केलेली लिंक व्हॉट्सॲप आणि फेसबुकवर शेअर करा." :
               language === "kn" ? "ದೇಣಿಗೆ ಸಂಗ್ರಹಿಸಲು ಅಭಿಯಾನದ ಲಿಂಕ್ ಅನ್ನು ವಾಟ್ಸಾಪ್ ಮತ್ತು ಫೇಸ್‌ಬುಕ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ." :
               "অনুদানের উদ্দেশ্যে যাচাইকৃত অভিযানের লিঙ্কটি হোয়াটসঅ্যাপ এবং ফেসবুকে শেয়ার করুন।"
        }
      ],
      documents: ["Medical Reports", "Aadhar Card"],
      contact: {
        tollFree: "Support: Milaap (+91-9916104747)",
        deskName: language === "en" ? "Online Crowdfunding Campaign Portal" :
                  language === "hi" ? "ऑनलाइन क्राउडफंडिंग अभियान पोर्टल" :
                  language === "mr" ? "ऑनलाइन क्राउडफंडिंग मोहीम पोर्टल" :
                  language === "kn" ? "ಆನ್‌ಲೈನ್ ಧನಸಹಾಯ ಅಭಿಯಾನ ಪೋರ್ಟಲ್" :
                  "অনলাইন ক্রাউডফান্ডিং ক্যাম্পেইন পোর্টাল",
        actionUrl: "https://milaap.org"
      }
    });
  }

  // Add customized documents
  const addCustomDoc = () => {
    const promptMessage = language === "en" ? "Enter custom document name:" :
                          language === "hi" ? "कस्टम दस्तावेज़ का नाम दर्ज करें:" :
                          language === "mr" ? "सानुकूल दस्तऐवजाचे नाव प्रविष्ट करा:" :
                          language === "kn" ? "ಕಸ್ಟಮ್ ದಾಖಲೆಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ:" :
                          "কাস্টম নথির নাম লিখুন:";
    const docName = prompt(promptMessage);
    if (docName && docName.trim()) {
      setDocs((prev) => [
        ...prev,
        { name: docName.trim(), sub: "Custom document", status: "pending" }
      ]);
    }
  };

  // Dynamically calculate progress metrics
  const docsReady = docs.filter((d) => d.status === "ready").length;
  const docsProgress = docs.length > 0 ? Math.round((docsReady / docs.length) * 100) : 0;
  const timelineReady = timelineSteps.filter((t) => t.completed).length;
  const timelineProgress = timelineSteps.length > 0 ? Math.round((timelineReady / timelineSteps.length) * 100) : 0;

  const schemeProgresses = suggestedSchemes.map((scheme) => {
    const stepsCount = scheme.steps.length;
    const completedCount = scheme.steps.filter((_, idx) =>
      completedSchemeSteps.includes(`${scheme.id}_${idx}`)
    ).length;
    const progress = stepsCount > 0 ? Math.round((completedCount / stepsCount) * 100) : 100;
    return { id: scheme.id, progress };
  });

  const avgSchemeProgress = schemeProgresses.length > 0
    ? Math.round(schemeProgresses.reduce((acc, curr) => acc + curr.progress, 0) / schemeProgresses.length)
    : 100;

  // Overall consolidated readiness calculation (averaging active components)
  const totalReadiness = Math.round((docsProgress + timelineProgress + avgSchemeProgress) / 3);

  return (
    <AppShell>
      <div className="px-margin-mobile md:px-gutter pt-md pb-xl max-w-container-max mx-auto space-y-lg animate-fade-in">
        
        {/* Header Block */}
        <header className="bg-gradient-to-r from-primary-container/20 via-primary-container/5 to-surface-container-low border border-outline-variant rounded-3xl p-md md:p-lg flex flex-col md:flex-row justify-between items-center gap-md shadow-sm">
          <div className="max-w-2xl space-y-xs">
            <span className="inline-flex items-center gap-xs px-2.5 py-1 bg-primary-container text-primary border border-primary/20 text-[10px] font-bold rounded-full uppercase tracking-wider">
              <span className="material-symbols-outlined text-[12px]">lightbulb</span>
              {language === "en" ? "Consolidated Treatment Navigator" :
               language === "hi" ? "एकीकृत उपचार मार्गदर्शक" :
               language === "mr" ? "एकत्रित उपचार मार्गदर्शक" :
               language === "kn" ? "ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶಿ ಸೂಚಕ" :
               "একত্রিত চিকিৎসা নির্দেশক"}
            </span>
            <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary font-bold tracking-tight">
              {t("ap_title")}
            </h1>
            <p className="font-body-md text-on-surface-variant leading-relaxed text-sm">
              {t("ap_subtitle")}
            </p>
          </div>
          <div className="bg-surface-bright border border-outline-variant rounded-2xl p-sm shadow-sm shrink-0 flex items-center gap-sm">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div>
              <p className="font-label-sm text-outline text-[10px] font-semibold uppercase tracking-wider">
                {language === "en" ? "Security Checked" : language === "hi" ? "सुरक्षा जांची गई" : language === "mr" ? "सुरक्षा तपासली" : language === "kn" ? "ಭದ್ರತೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ" : "সুরক্ষা যাচাই করা হয়েছে"}
              </p>
              <p className="font-bold text-secondary text-xs">
                {language === "en" ? "85% Match Accuracy" :
                 language === "hi" ? "85% मिलान सटीकता" :
                 language === "mr" ? "85% अचूकता" :
                 language === "kn" ? "85% ನಿಖರತೆ" :
                 "85% ম্যাচ সঠিকতা"}
              </p>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        {!isIntakeFilled && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-md flex items-center justify-between gap-md shadow-sm">
            <div className="flex items-center gap-sm text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              {t("ap_pending_desc")}
            </div>
            <Link
              to="/intake"
              className="inline-flex items-center gap-xs bg-primary text-on-primary hover:brightness-110 px-md py-sm rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">assignment</span>
              {t("db_start")}
            </Link>
          </div>
        )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
            
            {/* LEFT PANEL: Interactive Checklists & Matched Schemes */}
            <div className="lg:col-span-8 space-y-lg">
              
              {/* Roadmap & Checklist Card */}
              <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 p-md md:p-lg shadow-sm space-y-md">
                
                {/* Header & Internal Switcher Tab */}
                <div className="border-b border-outline-variant/30 pb-sm flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">assignment_turned_in</span>
                      {t("ap_milestones_title")}
                    </h2>
                    <p className="text-[11px] text-on-surface-variant font-normal">
                      {t("ap_milestones_desc")}
                    </p>
                  </div>
                  
                  {/* Segmented Sub-Tab Switcher */}
                  <div className="inline-flex bg-surface-container-high p-1 rounded-xl border border-outline-variant/50">
                    <button
                      onClick={() => setActiveRoadmapTab("timeline")}
                      className={`px-sm py-1 rounded-lg text-xs font-bold transition-all ${
                        activeRoadmapTab === "timeline"
                          ? "bg-surface-bright text-primary shadow-sm"
                          : "text-outline hover:text-on-surface-variant"
                      }`}
                    >
                      {language === "en" ? "Timeline Tasks" : language === "hi" ? "समयरेखा कार्य" : language === "mr" ? "टाइमलाइन कार्य" : language === "kn" ? "ಟೈಮ್‌ಲೈನ್ ಕಾರ್ಯಗಳು" : "সময়রেখা কাজ"}
                    </button>
                    <button
                      onClick={() => setActiveRoadmapTab("documents")}
                      className={`px-sm py-1 rounded-lg text-xs font-bold transition-all ${
                        activeRoadmapTab === "documents"
                          ? "bg-surface-bright text-primary shadow-sm"
                          : "text-outline hover:text-on-surface-variant"
                      }`}
                    >
                      {language === "en" ? "Required Documents" : language === "hi" ? "आवश्यक दस्तावेज" : language === "mr" ? "आवश्यक कागदपत्रे" : language === "kn" ? "ಅಗತ್ಯ ದಾಖಲೆಗಳು" : "প্রয়োজনীয় নথিপত্র"}
                    </button>
                  </div>
                </div>

                {/* Tab Contents */}
                {activeRoadmapTab === "timeline" ? (
                  <div className="space-y-md relative pt-2">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-outline-variant/60" />
                    
                    {timelineSteps.map((step) => {
                      return (
                        <div key={step.n} className="flex gap-md relative">
                          <button
                            onClick={() => !step.disabled && toggleTimeline(step.n)}
                            className={`z-10 w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                              step.completed
                                ? "bg-secondary border-secondary text-on-secondary shadow-sm scale-105"
                                : step.disabled
                                ? "bg-surface-container-high border-outline-variant text-outline cursor-not-allowed"
                                : "bg-surface-bright border-outline text-outline hover:border-primary hover:text-primary active:scale-95"
                            }`}
                            disabled={step.disabled}
                          >
                            {step.completed ? (
                              <span className="material-symbols-outlined text-[20px]">check</span>
                            ) : (
                              <span className="font-headline-sm text-xs font-bold">{step.n}</span>
                            )}
                          </button>
                          
                          <div className="flex-1 pb-md">
                            <h4 className={`font-label-md text-xs font-bold ${step.completed ? "text-secondary line-through opacity-70" : "text-on-surface"}`}>
                              {step.title}
                            </h4>
                            <p className={`font-body-sm text-[10px] leading-relaxed mt-1 ${step.completed ? "text-on-surface-variant/75 line-through opacity-70" : "text-on-surface-variant"}`}>
                              {step.body}
                            </p>
                            {step.hint && !step.completed && (
                              <div className="mt-xs p-xs bg-[#e7def3]/10 border border-[#e7def3]/20 text-[#4c3a69] text-[9px] font-bold rounded-lg inline-flex items-center gap-xs">
                                <span className="material-symbols-outlined text-[12px]">info</span>
                                {step.hint}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                      {docs.map((doc, i) => {
                        const lDoc = localizedDocs(doc.name, doc.sub, language);
                        const isReady = doc.status === "ready";
                        return (
                          <div
                            key={doc.name}
                            onClick={() => toggleDoc(i)}
                            className={`p-sm border rounded-2xl cursor-pointer hover:shadow-sm transition-all flex items-center justify-between group ${
                              isReady
                                ? "bg-secondary-container/10 border-secondary/30"
                                : doc.status === "warning"
                                ? "bg-[#e7def3]/5 border-[#e7def3]/25"
                                : "bg-surface-container-low border-outline-variant"
                            }`}
                          >
                            <div className="flex items-center gap-sm">
                              <span
                                className={`material-symbols-outlined text-[20px] ${
                                  isReady
                                    ? "text-secondary font-bold"
                                    : doc.status === "warning"
                                    ? "text-[#4c3a69]"
                                    : "text-outline"
                                }`}
                              >
                                {isReady ? "check_circle" : doc.status === "warning" ? "warning" : "pending_actions"}
                              </span>
                              <div>
                                <h4 className="font-bold text-on-surface text-xs leading-none group-hover:text-primary">
                                  {lDoc.name}
                                </h4>
                                <p className="text-[9px] text-on-surface-variant mt-1.5 leading-none font-medium">
                                  {lDoc.sub}
                                </p>
                              </div>
                            </div>
                            
                            <span className="material-symbols-outlined text-outline group-hover:text-primary text-[16px] pr-1">
                              {isReady ? "check_box" : "check_box_outline_blank"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={addCustomDoc}
                      className="w-full border-2 border-dashed border-outline-variant py-md rounded-2xl text-on-surface-variant font-bold text-xs flex items-center justify-center gap-xs hover:border-[#4c3a69] hover:text-[#4c3a69] transition-all bg-surface-container-lowest"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      {language === "en" ? "Add Custom Document" : language === "hi" ? "कस्टम दस्तावेज जोड़ें" : language === "mr" ? "सानुकूल दस्तऐवज जोडा" : language === "kn" ? "ಕಸ್ಟಮ್ ದಾಖಲೆ ಸೇರಿಸಿ" : "কাস্টম নথি যোগ করুন"}
                    </button>
                  </div>
                )}

              </section>

              {/* Matched Schemes List Section */}
              <section className="space-y-sm">
                <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs font-bold pl-1">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: 24 }}>account_balance</span>
                  {t("ap_contacts_title")}
                </h3>
                
                {suggestedSchemes.map((scheme) => {
                  return (
                    <div
                      key={scheme.id}
                      className="bg-surface-container-low border border-outline-variant/60 rounded-3xl p-md md:p-lg space-y-md shadow-sm animate-fade-in"
                    >
                      {/* Badge strip */}
                      <div className="flex justify-between items-center flex-wrap gap-xs">
                        <span className="inline-block px-sm py-[2px] bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold rounded-lg">
                          {scheme.type}
                        </span>
                        
                        <div className="flex items-center gap-sm text-[10px] font-semibold">
                          <span className="text-[#4c3a69] bg-[#e7def3]/10 border border-[#e7def3]/30 px-xs py-[2px] rounded-lg">
                            {language === "en" ? "Score" : language === "hi" ? "सटीकता" : language === "mr" ? "गुण" : language === "kn" ? "ಅಂಕ" : "স্কোর"}: {scheme.matchScore}%
                          </span>
                          <span className="text-secondary bg-secondary-container/10 border border-secondary/20 px-xs py-[2px] rounded-lg">
                            {language === "en" ? "Suitability" : language === "hi" ? "उपयुक्तता" : language === "mr" ? "योग्यता" : language === "kn" ? "ಸೂಕ್ತತೆ" : "উপযোগিতা"}: {scheme.suitability}
                          </span>
                        </div>
                      </div>

                      {/* Info header */}
                      <div className="space-y-xs">
                        <h4 className="font-headline-sm text-headline-sm font-bold text-primary leading-tight">
                          {scheme.title}
                        </h4>
                        <p className="font-body-sm text-[10px] text-on-surface-variant leading-relaxed">
                          {scheme.description}
                        </p>
                        <p className="text-[10px] text-primary italic font-medium">
                          {language === "en" ? "Match Reason:" : language === "hi" ? "मिलान का कारण:" : language === "mr" ? "जुळण्याचे कारण:" : language === "kn" ? "ಹೊಂದುವ ಕಾರಣ:" : "মিলের কারণ:"} {scheme.matchReason}
                        </p>
                      </div>

                      {/* Required Documents check strip */}
                      <div className="p-xs bg-surface-container-high border border-outline-variant/50 rounded-2xl flex flex-wrap gap-sm items-center text-[10px]">
                        <span className="font-bold text-outline uppercase pl-1 tracking-wider text-[9px]">
                          {language === "en" ? "Required Docs:" : language === "hi" ? "आवश्यक दस्तावेज:" : language === "mr" ? "आवश्यक कागदपत्रे:" : language === "kn" ? "ಅಗತ್ಯ ದಾಖಲೆಗಳು:" : "প্রয়োজনীয় নথি:"}
                        </span>
                        {scheme.documents.map((docName) => {
                          const ready = isDocReady(docName);
                          const docDisplay = localizedDocs(docName, "", language).name;
                          return (
                            <div key={docName} className="flex items-center gap-xs">
                              <span className={`material-symbols-outlined text-[14px] ${ready ? "text-secondary font-bold" : "text-outline"}`}>
                                {ready ? "check_circle" : "cancel"}
                              </span>
                              <span className={ready ? "text-secondary font-bold" : "text-on-surface-variant"}>{docDisplay}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Interactive guidance list */}
                      <div className="space-y-sm">
                        <h5 className="font-label-md text-[10px] uppercase font-bold text-outline tracking-wider pl-1">
                          {language === "en" ? "Step-by-Step Guidance Checklist" :
                           language === "hi" ? "चरण-दर-चरण मार्गदर्शन चेकलिस्ट" :
                           language === "mr" ? "चरण-दर-चरण मार्गदर्शन चेकलिस्ट" :
                           language === "kn" ? "ಹಂತ-ಹಂತದ ಮಾರ್ಗದರ್ಶಿ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ" :
                           "ধাপে ধাপে নির্দেশিকা চেকলিস্ট"}
                        </h5>
                        <div className="space-y-xs">
                          {scheme.steps.map((st, stepIdx) => {
                            const isDone = completedSchemeSteps.includes(`${scheme.id}_${stepIdx}`);
                            return (
                              <div
                                key={stepIdx}
                                onClick={() => toggleSchemeStep(scheme.id, stepIdx)}
                                className={`p-sm border rounded-2xl cursor-pointer hover:shadow-xs transition-all flex items-start justify-between group ${
                                  isDone
                                    ? "bg-secondary-container/5 border-secondary/20"
                                    : "bg-white border-outline-variant/80"
                                }`}
                              >
                                <div className="flex gap-sm">
                                  <span className={`material-symbols-outlined text-[16px] mt-0.5 ${isDone ? "text-secondary font-bold" : "text-outline group-hover:text-primary"}`}>
                                    {isDone ? "check_box" : "check_box_outline_blank"}
                                  </span>
                                  <div>
                                    <h6 className={`font-bold text-xs ${isDone ? "text-secondary line-through opacity-70" : "text-on-surface"}`}>
                                      {st.head}
                                    </h6>
                                    <p className={`text-[10px] text-on-surface-variant leading-relaxed mt-1 ${isDone ? "opacity-75 line-through" : ""}`}>
                                      {st.sub}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Scheme action bar */}
                      {(() => {
                        const schemeKeyPrefix = `${scheme.id}_`;
                        const totalSchemeSteps = scheme.steps.length;
                        const completedSchemeStepsCount = completedSchemeSteps.filter(k => k.startsWith(schemeKeyPrefix)).length;
                        const progress = totalSchemeSteps > 0 ? Math.round((completedSchemeStepsCount / totalSchemeSteps) * 100) : 0;
                        return (
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-sm pt-sm border-t border-outline-variant/30 flex-wrap">
                            {/* Left: Progress indicator */}
                            <div className="flex items-center gap-sm">
                              <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                                <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-on-surface-variant">
                                {language === "en" ? "Progress" : language === "hi" ? "प्रगति" : language === "mr" ? "प्रगती" : language === "kn" ? "ಪ್ರಗತಿ" : "অগ্রগতি"}: {progress}%
                              </span>
                            </div>
                            
                            {/* Middle: Help desk and Contact */}
                            <div className="flex flex-col text-right pr-2">
                              <span className="text-[9px] uppercase font-bold text-outline leading-none">
                                {language === "en" ? "Contact Helpline" : language === "hi" ? "हेल्पलाइन संपर्क" : language === "mr" ? "हेल्पलाईन संपर्क" : language === "kn" ? "ಸಹಾಯವಾಣಿ ಸಂಪರ್ಕ" : "হেল্পলাইন যোগাযোগ"}
                              </span>
                              <span className="text-xs font-bold text-on-surface mt-1 leading-none">{scheme.contact.tollFree}</span>
                              <span className="text-[9px] text-on-surface-variant mt-0.5 leading-none">Desk: {scheme.contact.deskName}</span>
                            </div>

                            {/* Right: claim link */}
                            {scheme.contact.actionUrl.startsWith("http") ? (
                              <a
                                href={scheme.contact.actionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-secondary text-on-secondary hover:brightness-110 rounded-xl text-xs font-bold shadow-sm transition-all text-center flex items-center justify-center gap-xs"
                              >
                                {language === "en" ? "Visit Site" : language === "hi" ? "साइट पर जाएं" : language === "mr" ? "साइटला भेट द्या" : language === "kn" ? "ವೆಬ್‌ಸೈಟ್‌ಗೆ ಭೇಟಿ ನೀಡಿ" : "সাইট ভিজিট করুন"}
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                              </a>
                            ) : (
                              <Link
                                to={scheme.contact.actionUrl}
                                className="px-4 py-2 bg-primary text-on-primary hover:brightness-110 rounded-xl text-xs font-bold shadow-sm transition-all text-center flex items-center justify-center gap-xs"
                              >
                                {t("sc_guide")} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </Link>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}

                {/* Lower grid (Generics & PMBJP Advice) */}
                <div className="p-md bg-[#e7def3]/10 border border-[#e7def3]/30 rounded-2xl space-y-xs animate-fade-in">
                  <h4 className="font-label-md text-primary font-bold flex items-center gap-xs text-xs">
                    <span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
                    {language === "en" ? "Recommendation" : language === "hi" ? "सिफारिश" : language === "mr" ? "शिफारस" : language === "kn" ? "ಶಿಫಾರಸು" : "সুপারিশ"}
                  </h4>
                  <p className="text-body-sm text-on-surface text-xs leading-relaxed">
                    {language === "en" ? "Based on your prescription history, consider purchasing generic medicines at PMBJP outlets to save 40% to 90% on monthly drug therapies." :
                     language === "hi" ? "अपने नुस्खे के इतिहास के आधार पर, मासिक दवा उपचारों पर 40% से 90% की बचत करने के लिए पीएमबीजेपी (PMBJP) केंद्रों पर जेनेरिक दवाएं खरीदने पर विचार करें।" :
                     language === "mr" ? "तुमच्या डॉक्टरांच्या चिठ्ठीनुसार, मासिक औषधोपचारांवर ४०% ते ९०% बचत करण्यासाठी पीएमबीजेपी (PMBJP) केंद्रांवरून जेनेरिक औषध खरेदी करण्याचा विचार करा." :
                     language === "kn" ? "ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಇತಿಹಾಸದ ಆಧಾರದ ಮೇಲೆ, ಮಾಸಿಕ ಚಿಕಿತ್ಸೆಗಳ ವೆಚ್ಚದಲ್ಲಿ 40% ರಿಂದ 90% ರಷ್ಟು ಉಳಿಸಲು ಪಿಎಂಬಿಜೆಪಿ (PMBJP) ಮಳಿಗೆಗಳಲ್ಲಿ ಜೆನೆರಿಕ್ ಔಷಧಿಗಳನ್ನು ಖರೀದಿಸುವುದನ್ನು ಪರಿಗಣಿಸಿ." :
                     "আপনার প্রেসক্রিপশনের ইতিহাসের উপর ভিত্তি করে, মাসিক ওষুধের খরচে ৪০% থেকে ৯০% সাশ্রয় করতে পিএমবিজেপি (PMBJP) কেন্দ্রগুলিতে জেনেরিক ওষুধ কেনার কথা বিবেচনা করুন।"}
                  </p>
                </div>

                {/* Navigate Schemes CTA */}
                <Link
                  to="/schemes"
                  className="block bg-primary hover:bg-primary-hover text-on-primary py-3.5 rounded-2xl font-bold text-sm text-center shadow-sm transition-all active:scale-[0.98]"
                >
                  {language === "en" ? "Explore Full Schemes & Insurances Catalogue →" :
                   language === "hi" ? "संपूर्ण योजनाएं और बीमा कैटलॉग देखें →" :
                   language === "mr" ? "संपूर्ण योजना आणि विमा कॅटलॉग पहा →" :
                   language === "kn" ? "ಸಂಪೂರ್ಣ ಯೋಜನೆಗಳು ಮತ್ತು ವಿಮೆಗಳ ವಿವರಗಳನ್ನು ನೋಡಿ →" :
                   "সম্পূর্ণ প্রকল্প ও বীমা তালিকা দেখুন →"}
                </Link>
              </section>

            </div>

            {/* RIGHT PANEL: Profile summary, contacts, pro-tips */}
            <div className="lg:col-span-4 space-y-md">
              
              {/* Profile summary card */}
              <section className="bg-surface-container-low border border-outline-variant/60 rounded-3xl p-md shadow-sm space-y-md">
                <div className="flex items-center gap-sm pb-sm border-b border-outline-variant/40">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-sm">{userName}</h3>
                    <p className="text-[10px] text-on-surface-variant font-medium">
                      {language === "en" ? "Condition: Breast Cancer Care" :
                       language === "hi" ? "स्थिति: स्तन कैंसर देखभाल" :
                       language === "mr" ? "स्थिती: स्तन कर्करोग काळजी" :
                       language === "kn" ? "ಸ್ಥಿತಿ: ಸ್ತನ ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ" :
                       "অবস্থা: স্তন ক্যান্সার যত্ন"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-xs">
                  {[
                    { id: "state", icon: "map", label: t("it_state"), value: patientState ? getLocalValue("state", patientState) : null, color: "text-[#4c3a69] bg-[#e7def3]" },
                    { id: "age", icon: "calendar_month", label: t("it_age"), value: age || null, color: "text-[#7458a6] bg-[#ece3f6]" },
                    { id: "stage", icon: "biotech", label: t("it_stage"), value: stage ? getLocalValue("stage", stage) : null, color: "text-secondary bg-secondary-container/40" },
                    { id: "receptor", icon: "science", label: t("it_receptor"), value: hormoneStatus ? getLocalValue("receptor", hormoneStatus) : null, color: "text-[#9478c4] bg-[#efe8f8]" },
                    { id: "surgery", icon: "medical_services", label: t("it_surgery"), value: surgery ? getLocalValue("yesno", surgery) : null, color: "text-[#4c3a69] bg-[#e7def3]" },
                    { id: "chemo", icon: "medication", label: t("it_chemo"), value: chemo ? getLocalValue("yesno", chemo) : null, color: "text-[#7458a6] bg-[#ece3f6]" },
                    { id: "radiation", icon: "bolt", label: t("it_radiation"), value: radiation ? getLocalValue("yesno", radiation) : null, color: "text-[#9478c4] bg-[#efe8f8]" },
                    { id: "hospital", icon: "home_health", label: t("it_hospital"), value: hospitalType ? getLocalValue("hospital", hospitalType) : null, color: "text-[#4c3a69] bg-[#e7def3]" },
                    { id: "insurance", icon: "shield", label: t("it_insurance_status"), value: insurance ? getLocalValue("insurance", insurance) : null, color: "text-[#7458a6] bg-[#ece3f6]" },
                    { id: "income", icon: "payments", label: t("it_income"), value: incomeBracket ? getLocalValue("income", incomeBracket) : null, color: "text-[#9478c4] bg-[#efe8f8]" }
                  ].map((item) => {
                    const isPending = !item.value || item.value === t("it_not_specified") || item.value === "Pending";
                    const pendingText = language === "en" ? "Pending" : language === "hi" ? "लंबित" : language === "mr" ? "प्रलंबित" : language === "kn" ? "ಬಾಕಿ ಇದೆ" : "বাকি আছে";
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`p-2 rounded-xl border flex flex-col justify-between transition-all duration-300 ${
                          isPending 
                            ? "bg-surface-container-lowest/20 border-dashed border-outline-variant/30 opacity-60" 
                            : "bg-surface-container-lowest border-outline-variant/60 hover:shadow-sm hover:border-primary/30 transform hover:-translate-y-[0.5px]"
                        }`}
                      >
                        <div className="flex items-center gap-[4px] mb-1">
                          <span className={`material-symbols-outlined text-[12px] p-0.5 rounded-md shrink-0 ${isPending ? "text-outline bg-surface-container" : item.color}`}>
                            {item.icon}
                          </span>
                          <span className="text-[8px] uppercase tracking-wider text-on-surface-variant font-bold truncate max-w-[65px]">
                            {item.label}
                          </span>
                        </div>
                        <div className={`text-[10px] font-bold truncate leading-tight ${isPending ? "text-outline/70 italic font-normal" : "text-on-surface"}`} title={item.value || pendingText}>
                          {item.value || pendingText}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-sm pt-xs border-t border-outline-variant/20">
                  <Link
                    to="/intake"
                    className="flex-1 py-1.5 border border-outline-variant hover:bg-surface-container-high rounded-xl text-[10px] font-bold text-primary active:scale-95 transition-all flex items-center justify-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    {t("it_edit_details")}
                  </Link>
                  <button
                    onClick={handleResetProfile}
                    className="flex-1 py-1.5 border border-error/30 hover:bg-error/5 text-error rounded-xl text-[10px] font-bold active:scale-95 transition-all flex items-center justify-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                    {language === "en" ? "Reset Profile" : language === "hi" ? "प्रोफ़ाइल रीसेट" : language === "mr" ? "प्रोफाइल रीसेट" : language === "kn" ? "ರಿಸೆಟ್" : "রিসেট প্রোফাইল"}
                  </button>
                </div>

                {/* Consolidated Readiness Index */}
                <div className="pt-sm border-t border-outline-variant/40">
                  <div className="flex justify-between items-center text-[10px] font-bold text-outline uppercase tracking-wider mb-sm">
                    <span>
                      {language === "en" ? "Conjoint Readiness Index" :
                       language === "hi" ? "संयुक्त तैयारी सूचकांक" :
                       language === "mr" ? "एकत्रित सज्जता निर्देशांक" :
                       language === "kn" ? "ಸನ್ನದ್ಧತೆ ಸೂಚ್ಯಂಕ" :
                       "যৌথ প্রস্তুতি সূচক"}
                    </span>
                    <span className="text-primary">{totalReadiness}% score</span>
                  </div>
                  
                  <div className="relative flex flex-col items-center h-28 justify-end overflow-hidden pt-4">
                    <div className="absolute top-4 w-40 h-40 border-[12px] border-surface-container-high rounded-full" />
                    <div
                      className="absolute top-4 w-40 h-40 border-[12px] border-t-secondary border-r-secondary border-l-transparent border-b-transparent rounded-full origin-center transition-all duration-700"
                      style={{ transform: `rotate(${-135 + (totalReadiness * 1.8)}deg)` }}
                    />
                    <div className="text-center pb-2 z-10">
                      <span className="font-headline-md text-headline-md text-primary font-bold">
                        {totalReadiness > 80 ? (language === "en" ? "High" : language === "hi" ? "उच्च" : language === "mr" ? "उच्च" : language === "kn" ? "ಹೆಚ್ಚು" : "উচ্চ") : 
                         totalReadiness > 50 ? (language === "en" ? "Medium" : language === "hi" ? "मध्यम" : language === "mr" ? "मध्यम" : language === "kn" ? "ಮಧ್ಯಮ" : "মাঝারি") : 
                         (language === "en" ? "Needs Review" : language === "hi" ? "समीक्षा की आवश्यकता" : language === "mr" ? "पुनरावलोकन आवश्यक" : language === "kn" ? "ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ" : "পর্যালোচনা প্রয়োজন")}
                      </span>
                      <p className="text-[10px] text-on-surface-variant font-medium">
                        {language === "en" ? "Application Reliability Score" : language === "hi" ? "आवेदन विश्वसनीयता स्कोर" : language === "mr" ? "अर्ज विश्वासार्हता निर्देशांक" : language === "kn" ? "ಅರ್ಜಿ ವಿಶ್ವಾಸಾರ್ಹತೆ ಸ್ಕೋರ್" : "আবেদন নির্ভরযোগ্যতা স্কোর"}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-outline leading-tight mt-sm text-center italic font-medium">
                    {language === "en" ? "Readiness scales automatically as you check off timeline steps, documents, and schemes." :
                     language === "hi" ? "जैसे-जैसे आप समयरेखा चरणों, दस्तावेजों और योजनाओं को चिह्नित करते हैं, तैयारी का स्तर अपने आप बढ़ता है।" :
                     language === "mr" ? "तुम्ही जसजसे टप्पे, कागदपत्रे आणि योजना पूर्ण कराल, तसतसा सज्जता निर्देशांक स्वयंचलितपणे वाढेल." :
                     language === "kn" ? "ನೀವು ಹಂತಗಳು, ದಾಖಲೆಗಳು ಮತ್ತು ಯೋಜನೆಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದಂತೆ ಸನ್ನದ್ಧತೆಯ ಸೂಚ್ಯಂಕವು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಹೆಚ್ಚಾಗುತ್ತದೆ." :
                     "আপনি যখন সময়রেখার ধাপ, নথি এবং প্রকল্পগুলি চিহ্নিত করবেন, তখন প্রস্তুতির হার স্বয়ংক্রিয়ভাবে বৃদ্ধি পাবে।"}
                  </p>
                </div>
              </section>

              {/* Key contacts */}
              <section className="bg-surface-container-low border border-outline-variant/60 rounded-3xl p-md shadow-sm space-y-sm">
                <h3 className="font-bold text-primary text-xs uppercase tracking-wider pl-1">
                  {t("nav_support")}
                </h3>
                
                <div className="space-y-sm">
                  <div className="bg-surface-bright p-sm rounded-2xl border border-outline-variant/40 space-y-sm">
                    <div className="flex items-center gap-sm">
                      <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[18px]">person</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-xs leading-none">
                          {language === "en" ? "Mrs. Ananya Sharma" : language === "hi" ? "श्रीमती अनन्या शर्मा" : language === "mr" ? "श्रीमती अनन्या शर्मा" : language === "kn" ? "ಶ್ರೀಮತಿ ಅನನ್ಯಾ ಶರ್ಮಾ" : "শ্রীমতি অনন্যা শর্মা"}
                        </h4>
                        <p className="text-[10px] text-on-surface-variant mt-1 leading-none font-medium text-outline">
                          {language === "en" ? "Hospital Social Worker" : language === "hi" ? "अस्पताल समाज सेवक" : language === "mr" ? "रुग्णालय समाज सेवक" : language === "kn" ? "ಆಸ್ಪತ್ರೆ ಸಮಾಜ ಸೇವಕ" : "হাসপাতাল সমাজ কর্মী"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-xs pt-xs">
                      <a className="flex-1 bg-secondary hover:bg-secondary/90 text-on-secondary py-2 rounded-xl flex items-center justify-center gap-xs font-bold text-xs shadow-sm transition-all" href="tel:1234567890">
                        <span className="material-symbols-outlined text-[15px]">call</span> {language === "en" ? "Call" : language === "hi" ? "कॉल करें" : language === "mr" ? "कॉल करा" : language === "kn" ? "ಕರೆ ಮಾಡಿ" : "কল করুন"}
                      </a>
                      <button 
                        onClick={() => alert(language === "en" ? "Initiating chat session with counselor..." : "काउंसलर के साथ चैट शुरू हो रही है...")} 
                        className="flex-1 border border-secondary text-secondary py-2 rounded-xl flex items-center justify-center gap-xs font-bold text-xs hover:bg-secondary/5 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">chat</span> {language === "en" ? "Chat" : language === "hi" ? "चैट करें" : language === "mr" ? "चॅट करा" : language === "kn" ? "ಚಾಟ್ ಮಾಡಿ" : "চ্যাট করুন"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface-bright p-sm rounded-2xl border border-outline-variant/40 text-center space-y-sm">
                    <div className="text-left">
                      <h4 className="font-bold text-primary text-xs leading-none">
                        {language === "en" ? "Government Helpline" : language === "hi" ? "सरकारी हेल्पलाइन" : language === "mr" ? "शासकीय हेल्पलाईन" : language === "kn" ? "ಸರ್ಕಾರಿ ಸಹಾಯವಾಣಿ" : "সরকারি হেল্পলাইন"}
                      </h4>
                      <p className="text-[10px] text-on-surface-variant leading-tight mt-1.5 font-medium">
                        {language === "en" ? "Available 24/7 for insurance claims and public welfare queries." :
                         language === "hi" ? "बीमा दावों और सार्वजनिक कल्याण प्रश्नों के लिए 24/7 उपलब्ध।" :
                         language === "mr" ? "विमा दावे आणि सार्वजनिक कल्याण प्रश्नांसाठी २४/७ उपलब्ध." :
                         language === "kn" ? "ವಿಮೆ ಕ್ಲೈಮ್‌ಗಳು ಮತ್ತು ಸಾರ್ವಜನಿಕ ಕಲ್ಯಾಣ ಪ್ರಶ್ನೆಗಳಿಗೆ 24/7 ಲಭ್ಯವಿದೆ." :
                         "বীমা দাবি এবং জনকল্যাণমূলক জিজ্ঞাসার জন্য ২৪/৭ উপলব্ধ।"}
                      </p>
                    </div>
                    <a className="w-full bg-primary hover:bg-primary-hover text-on-primary py-2 rounded-xl flex items-center justify-center gap-xs font-bold text-xs shadow-sm transition-all block font-bold" href="tel:104">
                      <span className="material-symbols-outlined text-[16px]">support_agent</span> {language === "en" ? "Dial 104" : language === "hi" ? "104 डायल करें" : language === "mr" ? "१०४ डायल करा" : language === "kn" ? "104 ಡಯಲ್ ಮಾಡಿ" : "১০৪ ডায়াল করুন"}
                    </a>
                  </div>
                </div>
              </section>

              {/* Pro-Tips Panel */}
              <div className="p-md rounded-3xl bg-gradient-to-br from-primary-container/30 to-primary text-on-primary shadow-sm space-y-sm relative overflow-hidden border border-primary/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <span className="material-symbols-outlined text-[32px] text-white">description</span>
                <h3 className="font-headline-sm text-sm font-bold text-white leading-none mt-2">{t("ap_org_advice")}</h3>
                <p className="text-[11px] opacity-90 leading-relaxed font-medium">
                  {language === "en" ? "Keep all original medical receipts and diagnostic scans in a waterproof folder. Photocopy each document 3 times before your Nodal Office visit." :
                   language === "hi" ? "सभी मूल मेडिकल रसीदें और नैदानिक स्कैन वाटरप्रूफ फोल्डर में रखें। अपने नोडल कार्यालय के दौरे से पहले प्रत्येक दस्तावेज़ की 3 फोटोकॉपी बना लें।" :
                   language === "mr" ? "सर्व मूळ वैद्यकीय पावत्या आणि चाचण्यांचे अहवाल वॉटरप्रूफ फोल्डरमध्ये ठेवा. नोडल कार्यालयाला भेट देण्यापूर्वी प्रत्येक कागदपत्राच्या ३ छायाप्रती काढा." :
                   language === "kn" ? "ಎಲ್ಲಾ ಮೂಲ ವೈದ್ಯಕೀಯ ರಶೀದಿಗಳು ಮತ್ತು ಸ್ಕ್ಯಾನ್ ವರದಿಗಳನ್ನು ಜಲನಿರೋಧಕ ಫೋಲ್ಡರ್‌ನಲ್ಲಿ ಇರಿಸಿ. ನಿಮ್ಮ ನೋಡಲ್ ಕಚೇರಿ ಭೇಟಿಗೆ ಮುನ್ನ ಪ್ರತಿ ದಾಖಲೆಯ 3 ನಕಲುಗಳನ್ನು ತಯಾರಿಸಿ." :
                   "সমস্ত মূল মেডিকেল রসিদ এবং পরীক্ষার রিপোর্ট ওয়াটারপ্রুফ ফোল্ডারে রাখুন। নোডাল অফিসে যাওয়ার আগে প্রতিটি নথির ৩টি করে ফটোকপি করে রাখুন।"}
                </p>
                <button 
                  onClick={() => alert("Downloading digital documentation template checklist...")} 
                  className="w-full py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs transition-colors font-bold"
                >
                  {language === "en" ? "View Document Guide Booklet" : language === "hi" ? "दस्तावेज़ मार्गदर्शिका पुस्तिका देखें" : language === "mr" ? "दस्तऐवज मार्गदर्शिका पुस्तिका पहा" : language === "kn" ? "ದಾಖಲೆ ಮಾರ್ಗದರ್ಶಿ ಪುಸ್ತಕ ನೋಡಿ" : "নথি নির্দেশিকা পুস্তিকা দেখুন"}
                </button>
              </div>

            </div>

          </div>

      </div>
    </AppShell>
  );
}
