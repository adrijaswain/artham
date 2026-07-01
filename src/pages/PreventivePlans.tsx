import { useState } from "react";
import AppShell from "../components/AppShell";
import { generalInsurers } from "./Schemes";
import { useLanguage } from "../components/LanguageContext";
import type { Language } from "../utils/translations";
import {
  localizedTests,
  localizedAgeGuidelines,
  localizedAreaCostMultiplier,
  localizedMatchedSchemes
} from "../utils/preventiveTranslations";




type AreaTier = "tier1" | "tier2" | "tier3";

type CostDetails = {
  name: string;
  mammogram: string;
  cbe: string;
  bse: string;
  ultrasound: string;
  mri: string;
  brca: string;
  cities: string[];
  description: string;
};

const cityToTierMap: Record<string, AreaTier> = {
  mumbai: "tier1",
  delhi: "tier1",
  "new delhi": "tier1",
  ncr: "tier1",
  gurugram: "tier1",
  gurgaon: "tier1",
  noida: "tier1",
  "greater noida": "tier1",
  ghaziabad: "tier1",
  faridabad: "tier1",
  bangalore: "tier1",
  bengaluru: "tier1",
  chennai: "tier1",
  kolkata: "tier1",
  hyderabad: "tier1",
  ahmedabad: "tier1",
  pune: "tier2",
  jaipur: "tier2",
  lucknow: "tier2",
  kochi: "tier2",
  cochin: "tier2",
  indore: "tier2",
  nagpur: "tier2",
  patna: "tier2",
  bhopal: "tier2",
  ludhiana: "tier2",
  vadodara: "tier2",
  baroda: "tier2",
  agra: "tier2",
  visakhapatnam: "tier2",
  vizag: "tier2",
  surat: "tier2",
  coimbatore: "tier2",
  chandigarh: "tier2",
  guwahati: "tier2",
  nashik: "tier2",
  rajkot: "tier2",
  kanpur: "tier2",
  meerut: "tier2",
  varanasi: "tier2",
  srinagar: "tier2",
  aurangabad: "tier2",
  dhanbad: "tier2",
  amritsar: "tier2",
  allahabad: "tier2",
  prayagraj: "tier2",
  howrah: "tier2",
  gwalior: "tier2",
  jabalpur: "tier2",
  vijayawada: "tier2",
  madurai: "tier2",
  raipur: "tier2",
  kota: "tier2",
  solapur: "tier2",
  hubli: "tier2",
  dharwad: "tier2",
  bareilly: "tier2",
  moradabad: "tier2",
  mysore: "tier2",
  mysuru: "tier2",
  thiruvananthapuram: "tier2",
  trivandrum: "tier2",
  salem: "tier2",
  tiruchirappalli: "tier2",
  trichy: "tier2",
  jodhpur: "tier2",
  bhubaneswar: "tier2",
  jalandhar: "tier2",
  warangal: "tier2",
  tirupati: "tier2",
  dehradun: "tier2",
  ranchi: "tier2",
  mangalore: "tier2",
  mangaluru: "tier2",
  belgaum: "tier2",
  belagavi: "tier2",
  udaipur: "tier2",
  guntur: "tier2"
};

const matchCityToTier = (search: string): { tier: AreaTier; name: string; isMatched: boolean } | null => {
  if (!search.trim()) return null;
  const cleanSearch = search.trim().toLowerCase();
  if (cityToTierMap[cleanSearch]) {
    const matchedKey = Object.keys(cityToTierMap).find(k => k === cleanSearch) || cleanSearch;
    const formattedName = matchedKey.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    return {
      tier: cityToTierMap[cleanSearch],
      name: formattedName,
      isMatched: true
    };
  }
  const keyMatch = Object.keys(cityToTierMap).find(
    k => k.startsWith(cleanSearch) || cleanSearch.startsWith(k)
  );
  if (keyMatch) {
    const formattedName = keyMatch.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    return {
      tier: cityToTierMap[keyMatch],
      name: formattedName,
      isMatched: true
    };
  }
  return {
    tier: "tier3",
    name: search,
    isMatched: false
  };
};

const areaCostMultiplier: Record<AreaTier, CostDetails> = {
  tier1: {
    name: "Metro / Tier 1 (Mumbai, Delhi, Bangalore, Chennai, etc.)",
    mammogram: "₹2,200 – ₹3,800",
    cbe: "₹500 – ₹800",
    bse: "₹0 (Free / At-home)",
    ultrasound: "₹1,200 – ₹2,200",
    mri: "₹8,000 – ₹14,000",
    brca: "₹15,000 – ₹25,000",
    cities: ["Mumbai", "Delhi NCR", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Ahmedabad"],
    description: "Major metropolitan cities with population above 4 million. High concentration of state-of-the-art super-specialty hospitals and oncology labs."
  },
  tier2: {
    name: "Tier 2 Cities (Pune, Jaipur, Lucknow, Kochi, Indore, etc.)",
    mammogram: "₹1,500 – ₹2,500",
    cbe: "₹300 – ₹500",
    bse: "₹0 (Free / At-home)",
    ultrasound: "₹800 – ₹1,400",
    mri: "₹5,500 – ₹9,000",
    brca: "₹12,000 – ₹18,000",
    cities: ["Pune", "Jaipur", "Lucknow", "Kochi", "Indore", "Nagpur", "Patna", "Bhopal", "Ludhiana", "Vadodara", "Agra", "Visakhapatnam", "Surat", "Coimbatore", "Chandigarh", "Guwahati", "Nashik", "Rajkot", "Varanasi", "Srinagar", "Amritsar", "Dehradun", "Thiruvananthapuram", "Bhubaneswar", "Ranchi", "Raipur", "Jodhpur"],
    description: "Rapidly growing urban centers and state capitals with population between 1 million and 4 million. Excellent multi-specialty regional hospital chains available."
  },
  tier3: {
    name: "Tier 3 Cities / Rural Areas (Districts & Community Health)",
    mammogram: "₹800 – ₹1,400",
    cbe: "₹150 – ₹300",
    bse: "₹0 (Free / At-home)",
    ultrasound: "₹500 – ₹900",
    mri: "₹3,500 – ₹6,000",
    brca: "₹8,000 – ₹12,000",
    cities: ["District Headquarters", "Municipal Towns", "Taluka Centers", "Community Health Blocks", "Rural Villages"],
    description: "Towns and rural areas with population below 1 million. Screenings are often subsidized at government district hospitals, taluka centers, and NGO camps."
  }
};



export default function PreventivePlans() {
  const { t, language } = useLanguage();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("Ages 40 - 49");
  const [selectedArea, setSelectedArea] = useState<AreaTier>("tier1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [citySearchQuery, setCitySearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"guidelines" | "costs" | "schemes" | "insurers">("guidelines");

  const localT = (key: string): string => {
    const dicts: Record<Language, Record<string, string>> = {
      en: {
        prev_care: "Preventive Care",
        awareness: "Breast Cancer Awareness",
        prevention: "Breast Cancer Prevention",
        clinical_ref: "Clinical Reference",
        compliant: "WHO & NPCDCS Compliant",
        freq_planner: "Screening Frequency Planner",
        select_age: "Select your age bracket to view recommendations:",
        clinical_overview: "Clinical Overview for",
        updated_standards: "Updated with WHO Oncology Screen 2026 Standards",
        pricing_maps: "Geographical-based pricing maps for oncology tests. Select your tier or search for your city.",
        find_city: "Find Your City's Tier & Price",
        search_city_placeholder: "Search city (e.g. Pune, Patna, Bangalore...)",
        matched_as: "matched as",
        not_in_list: "not in list. Showing Tier 3 / Rural rates",
        select_pricing_tier: "Select Pricing Tier",
        pricing_sheet: "Diagnostic Pricing Sheet",
        estimates_derived: "Estimates derived from average diagnostic indexes.",
        inr_rates: "INR (₹) Rates",
        cities_in_tier: "Cities in this Tier Range",
        travel_savings: "Traveling to Tier 3 centers can reduce screening scan costs by up to 60%.",
        national_scaling: "National Cost Scaling",
        baseline: "Baseline",
        avg_savings: "Avg Savings",
        estimates_disclaimer: "*Estimates are calculated based on national averages across leading radiology centers. Real prices may vary.",
        matched_schemes_title: "Matched Government Schemes & Subsidies",
        matched_schemes_desc: "Public financial-aid programs matched to fund or fully subsidize oncology diagnostic screens and clinical evaluations.",
        eligibility_label: "Eligibility:",
        empanelled_insurers: "Empanelled General Insurers & Cancer riders",
        insurers_desc: "Integrate cashless critical illness riders and pre-authorization screening packages from leading general insurance organizations.",
        search_insurers: "Search insurers, policies...",
        reliability: "Reliability",
        primary_cover: "Primary Cancer Cover",
        visit_website: "Visit Website",
        no_insurers_matched: "No general insurers matched your query. Try searching with a different term.",
        view_details: "View Application Details",
        view_claim_guide: "View Policy & Claim Guide",
        cashless_network: "Cashless Network",
        claim_ratio: "Claim Ratio",
        reimbursement: "Reimbursement",
        metro_rates: "Metro Rates",
        tier_2: "Tier 2",
        rural: "Rural"
      },
      hi: {
        prev_care: "निवारक देखभाल",
        awareness: "स्तन कैंसर जागरूकता",
        prevention: "स्तन कैंसर रोकथाम",
        clinical_ref: "नैदानिक संदर्भ",
        compliant: "डब्ल्यूएचओ और एनपीसीडीसीएस अनुपालन",
        freq_planner: "स्क्रीनिंग आवृत्ति योजनाकार",
        select_age: "सिफारिशें देखने के लिए अपना आयु वर्ग चुनें:",
        clinical_overview: "नैदानिक अवलोकन:",
        updated_standards: "डब्ल्यूएचओ ऑन्कोलॉजी स्क्रीन 2026 मानकों के साथ अपडेटेड",
        pricing_maps: "ऑन्कोलॉजी परीक्षणों के लिए भौगोलिक-आधारित मूल्य निर्धारण मानचित्र। अपना स्तर चुनें या अपने शहर की खोज करें।",
        find_city: "अपने शहर का स्तर और मूल्य ढूंढें",
        search_city_placeholder: "शहर खोजें (जैसे पुणे, पटना, बैंगलोर...)",
        matched_as: "इस रूप में मिलान किया गया",
        not_in_list: "सूची में नहीं है। टियर 3 / ग्रामीण दरें दिखाई जा रही हैं",
        select_pricing_tier: "मूल्य निर्धारण स्तर का चयन करें",
        pricing_sheet: "नैदानिक मूल्य निर्धारण पत्रक",
        estimates_derived: "औसत नैदानिक सूचकांकों से प्राप्त अनुमान।",
        inr_rates: "आईएनआर (₹) दरें",
        cities_in_tier: "इस स्तर श्रेणी के शहर",
        travel_savings: "टियर 3 केंद्रों की यात्रा करने से स्क्रीनिंग स्कैन की लागत 60% तक कम हो सकती है।",
        national_scaling: "राष्ट्रीय लागत पैमाना",
        baseline: "आधार रेखा",
        avg_savings: "औसत बचत",
        estimates_disclaimer: "*अनुमान अग्रणी रेडियोलॉजी केंद्रों के राष्ट्रीय औसत के आधार पर आकलित किए गए हैं। वास्तविक कीमतें भिन्न हो सकती हैं।",
        matched_schemes_title: "मिलान सरकारी योजनाएं और सब्सिडी",
        matched_schemes_desc: "ऑन्कोलॉजी नैदानिक जांच और नैदानिक मूल्यांकन को निधि देने या पूरी तरह से सब्सिडी देने के लिए मिलान किए गए सार्वजनिक वित्तीय सहायता कार्यक्रम।",
        eligibility_label: "पात्रता:",
        empanelled_insurers: "पैनलबद्ध सामान्य बीमाकर्ता और कैंसर राइडर्स",
        insurers_desc: "अग्रणी सामान्य बीमा संगठनों से कैशलेस गंभीर बीमारी राइडर्स और पूर्व-प्राधिकरण स्क्रीनिंग पैकेज एकीकृत करें।",
        search_insurers: "बीमा कंपनियों, पॉलिसियों की खोज करें...",
        reliability: "विश्वसनीयता",
        primary_cover: "प्राथमिक कैंसर कवर",
        visit_website: "वेबसाइट पर जाएं",
        no_insurers_matched: "आपकी खोज से कोई सामान्य बीमाकर्ता मेल नहीं खाता। किसी अन्य शब्द से खोजें।",
        view_details: "आवेदन विवरण देखें",
        view_claim_guide: "नीति और दावा गाइड देखें",
        cashless_network: "कैशलेस नेटवर्क",
        claim_ratio: "दावा अनुपात",
        reimbursement: "प्रतिपूर्ति",
        metro_rates: "मेट्रो दरें",
        tier_2: "टियर 2",
        rural: "ग्रामीण"
      },
      mr: {
        prev_care: "निवारक काळजी",
        awareness: "स्तन कर्करोग जागरूकता",
        prevention: "स्तन कर्करोग प्रतिबंध",
        clinical_ref: "वैद्यकीय संदर्भ",
        compliant: "WHO आणि NPCDCS सुसंगत",
        freq_planner: "तपासणी वेळापत्रक नियोजन",
        select_age: "शिफारसी पाहण्यासाठी तुमचा वयोगट निवडा:",
        clinical_overview: "वैद्यकीय आढावा:",
        updated_standards: "WHO ऑन्कोलॉजी स्क्रीन २०२६ मानकांनुसार अद्ययावत",
        pricing_maps: "चाचण्यांसाठी भौगोलिक-आधारित खर्च मार्गदर्शक. तुमचे शहर शोधा.",
        find_city: "तुमच्या शहराचा खर्च तपासा",
        search_city_placeholder: "शहर शोधा (उदा. पुणे, नाशिक, मुंबई...)",
        matched_as: "श्रेणीमध्ये आढळले",
        not_in_list: "यादीत आढळले नाही. टियर ३ / ग्रामीण दर दाखवत आहे",
        select_pricing_tier: "खर्च श्रेणी निवडा",
        pricing_sheet: "चाचणी खर्च पत्रक",
        estimates_derived: "अंदाजे खर्च सरासरी वैद्यकीय दरांवर आधारित आहेत.",
        inr_rates: "रुपये (₹) दर",
        cities_in_tier: "या खर्च श्रेणीतील शहरे",
        travel_savings: "टियर ३ केंद्रांमध्ये तपासणी केल्यास खर्चात ६०% पर्यंत बचत होऊ शकते.",
        national_scaling: "राष्ट्रीय खर्च प्रमाण",
        baseline: "मूळ दर",
        avg_savings: "सरासरी बचत",
        estimates_disclaimer: "*हे दर राष्ट्रीय सरासरीवर आधारित आहेत. प्रत्यक्ष खर्च बदलू शकतो.",
        matched_schemes_title: "पात्र सरकारी योजना आणि सवलती",
        matched_schemes_desc: "कर्करोग तपासणी आणि उपचारांसाठी मदत करणाऱ्या सरकारी योजना.",
        eligibility_label: "पात्रता:",
        empanelled_insurers: "आरोग्य विमा आणि कॅन्सर कवच",
        insurers_desc: "मुख्य विमा कंपन्यांच्या कॅन्सर विशिष्ट योजना आणि सवलती.",
        search_insurers: "विमा कंपनी किंवा पॉलिसी शोधा...",
        reliability: "विश्वासार्हता",
        primary_cover: "कर्करोग कवच",
        visit_website: "वेबसाइटला भेट द्या",
        no_insurers_matched: "कोणतीही विमा कंपनी आढळली नाही. कृपया दुसरा शब्द शोधून पहा.",
        view_details: "योजनेची सविस्तर माहिती",
        view_claim_guide: "पॉलिसी आणि क्लेम मार्गदर्शक",
        cashless_network: "कॅशलेस नेटवर्क",
        claim_ratio: "दावा मंजुरी दर",
        reimbursement: "प्रतिपूर्ती (Reimbursement)",
        metro_rates: "मेट्रो दर",
        tier_2: "टियर २",
        rural: "ग्रामीण"
      },
      kn: {
        prev_care: "ಪೂರ್ವಭಾವಿ ಕಾಳಜಿ",
        awareness: "ಸ್ತನ ಕ್ಯಾನ್ಸರ್ ಜಾಗೃತಿ",
        prevention: "ಸ್ತನ ಕ್ಯಾನ್ಸರ್ ತಡೆಗಟ್ಟುವಿಕೆ",
        clinical_ref: "ವೈದ್ಯಕೀಯ ಉಲ್ಲೇಖ",
        compliant: "WHO ಮತ್ತು NPCDCS ನಿಯಮಾವಳಿ ಅನುಸರಣೆ",
        freq_planner: "ತಪಾಸಣಾ ಆವರ್ತನ ಯೋಜಕ",
        select_age: "ಶಿಫಾರಸುಗಳನ್ನು ವೀಕ್ಷಿಸಲು ನಿಮ್ಮ ವಯಸ್ಸಿನ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ:",
        clinical_overview: "ವೈದ್ಯಕೀಯ ಅವಲೋಕನ:",
        updated_standards: "WHO ಆಂಕೊಲಾಜಿ ಸ್ಕ್ರೀನ್ 2026 ನಿಯಮಗಳೊಂದಿಗೆ ನವೀಕರಿಸಲಾಗಿದೆ",
        pricing_maps: "ರೋಗನಿರ್ಣಯ ಪರೀಕ್ಷೆಗಳ ಭೌಗೋಳಿಕ ಆಧಾರಿತ ವೆಚ್ಚದ ವಿವರಗಳು. ನಿಮ್ಮ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ನಿಮ್ಮ ನಗರವನ್ನು ಹುಡುಕಿ.",
        find_city: "ನಿಮ್ಮ ನಗರದ ವರ್ಗ ಮತ್ತು ವೆಚ್ಚವನ್ನು ಹುಡುಕಿ",
        search_city_placeholder: "ನಗರವನ್ನು ಹುಡುಕಿ (ಉದಾ. ಪುಣೆ, ಪಟ್ನಾ, ಬೆಂಗಳೂರು...)",
        matched_as: "ಎಂದು ವರ್ಗೀಕರಿಸಲಾಗಿದೆ",
        not_in_list: "ಪಟ್ಟಿಯಲ್ಲಿಲ್ಲ. ಟಯರ್ 3 / ಗ್ರಾಮೀಣ ದರಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ",
        select_pricing_tier: "ವೆಚ್ಚದ ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
        pricing_sheet: "ರೋಗನಿರ್ಣಯ ವೆಚ್ಚದ ಪಟ್ಟಿ",
        estimates_derived: "ಸರಾಸರಿ ವೆಚ್ಚಗಳ ಆಧಾರದ ಮೇಲೆ ಅಂದಾಜು ಮಾಡಲಾಗಿದೆ.",
        inr_rates: "ರೂಪಾಯಿ (₹) ದರಗಳು",
        cities_in_tier: "ಈ ವೆಚ್ಚದ ವರ್ಗದಲ್ಲಿರುವ ನಗರಗಳು",
        travel_savings: "ಟಯರ್ 3 ಕೇಂದ್ರಗಳಲ್ಲಿ ತಪಾಸಣೆ ಮಾಡಿಸುವುದರಿಂದ ವೆಚ್ಚವನ್ನು ಶೇ. 60 ರಷ್ಟು ಉಳಿಸಬಹುದು.",
        national_scaling: "ರಾಷ್ಟ್ರೀಯ ವೆಚ್ಚ ಪ್ರಮಾಣ",
        baseline: "ಮೂಲ ವೆಚ್ಚ",
        avg_savings: "ಸರಾಸರಿ ಉಳಿತಾಯ",
        estimates_disclaimer: "*ಅಂದಾಜು ವೆಚ್ಚಗಳನ್ನು ಪ್ರಮುಖ ರೋಗನಿರ್ಣಯ ಕೇಂದ್ರಗಳ ಆಧಾರದ ಮೇಲೆ ನೀಡಲಾಗಿದೆ. ನೈಜ ದರಗಳು ವ್ಯತ್ಯಾಸವಿರಬಹುದು.",
        matched_schemes_title: "ಅರ್ಹ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಸಬ್ಸಿಡಿಗಳು",
        matched_schemes_desc: "ಸ್ತನ ಕ್ಯಾನ್ಸರ್ ತಪಾಸಣೆ ಮತ್ತು ರೋಗನಿರ್ಣಯಕ್ಕೆ ಹಣಕಾಸಿನ ನೆರವು ನೀಡುವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು.",
        eligibility_label: "ಅರ್ಹತೆ:",
        empanelled_insurers: "ನೋಂದಾಯಿತ ಸಾರ್ವಜನಿಕ ಮತ್ತು ಖಾಸಗಿ ವಿಮೆದಾರರು",
        insurers_desc: "ಪ್ರಮುಖ ವಿಮಾ ಕಂಪನಿಗಳಿಂದ ನಗದು ರಹಿತ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಕ್ಯಾನ್ಸರ್ ವಿಮಾ ಯೋಜನೆಗಳ ವಿವರಗಳು.",
        search_insurers: "ವಿಮೆದಾರರು, ಪಾಲಿಸಿಗಳನ್ನು ಹುಡುಕಿ...",
        reliability: "ವಿಶ್ವಾಸಾರ್ಹತೆ",
        primary_cover: "ಪ್ರಾಥಮಿಕ ಕ್ಯಾನ್ಸರ್ ವಿಮೆ",
        visit_website: "ವೆಬ್‌ಸೈಟ್‌ಗೆ ಭೇಟಿ ನೀಡಿ",
        no_insurers_matched: "ಯಾವುದೇ ವಿಮಾ ಕಂಪನಿಗಳು ಪತ್ತೆಯಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ಪದವನ್ನು ಬಳಸಿ ಹುಡುಕಿ.",
        view_details: "ಅರ್ಜಿ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
        view_claim_guide: "ಪಾಲಿಸಿ ಮತ್ತು ಕ್ಲೈಮ್ ಮಾರ್ಗದರ್ಶಿ ವೀಕ್ಷಿಸಿ",
        cashless_network: "ನಗದು ರಹಿತ ನೆಟ್‌ವರ್ಕ್",
        claim_ratio: "ಕ್ಲೈಮ್ ಅನುಪಾತ",
        reimbursement: "ಮರುಪಾವতি",
        metro_rates: "ಮೆಟ್ರೋ ದರಗಳು",
        tier_2: "ಟಯರ್ 2",
        rural: "ಗ್ರಾಮೀಣ"
      },
      bn: {
        prev_care: "প্রতিরোধমূলক যত্ন",
        awareness: "স্তন ক্যান্সার সচেতনতা",
        prevention: "স্তন ক্যান্সার প্রতিরোধ",
        clinical_ref: "ক্লিনিক্যাল রেফারেন্স",
        compliant: "WHO এবং NPCDCS সম্মত",
        freq_planner: "স্ক্রীনিং ফ্রিকোয়েন্সি প্ল্যানার",
        select_age: "পরামর্শ দেখতে আপনার বয়সসীমা নির্বাচন করুন:",
        clinical_overview: "ক্লিনিক্যাল ওভারভিউ:",
        updated_standards: "WHO অনকোলজি স্ক্রিন ২০২৬ মানসম্মত",
        pricing_maps: "পরীক্ষাগুলির ভৌগোলিক-ভিত্তিক ব্যয় নির্দেশিকা। আপনার এলাকা নির্বাচন করুন বা শহর খুঁজুন।",
        find_city: "আপনার শহরের ক্যাটাগরি ও খরচ খুঁজুন",
        search_city_placeholder: "শহর খুঁজুন (যেমন পুনে, পাটনা, বেঙ্গালুরু...)",
        matched_as: "হিসেবে চিহ্নিত",
        not_in_list: "তালিকায় নেই। টিয়ার ৩ / গ্রামীণ রেট দেখানো হচ্ছে",
        select_pricing_tier: "ব্যয় সীমা নির্বাচন করুন",
        pricing_sheet: "ডায়াগনস্টিক ব্যয় তালিকা",
        estimates_derived: "গড় ডায়াগনস্টিক রেটের ভিত্তিতে প্রাক্কলিত ব্যয়।",
        inr_rates: "টাকা (₹) রেট",
        cities_in_tier: "এই ক্যাটাগরির অন্তর্ভুক্ত শহরসমূহ",
        travel_savings: "টিয়ার ৩ কেন্দ্রে পরীক্ষা করালে খরচ ৬০% পর্যন্ত হ্রাস পেতে পারে।",
        national_scaling: "জাতীয় ব্যয় স্কেল",
        baseline: "বেসলাইন",
        avg_savings: "গড় সাশ্রয়",
        estimates_disclaimer: "*এই হিসাবগুলি গড় জাতীয় হারের ওপর ভিত্তি করে করা। প্রকৃত খরচ পরিবর্তিত হতে পারে।",
        matched_schemes_title: "যোগ্য সরকারি প্রকল্প ও ভর্তুকি",
        matched_schemes_desc: "ক্যান্সার স্ক্রীনিং ও পরীক্ষা সংক্রান্ত খরচে আর্থিক সহায়তা প্রদানকারী সরকারি প্রকল্পসমূহ।",
        eligibility_label: "যোগ্যতা:",
        empanelled_insurers: "নিবন্ধিত সাধারণ বীমাকারী ও ক্যান্সার কভার",
        insurers_desc: "ক্যান্সার নির্দিষ্ট নগদহীন বীমা পলিসি এবং গুরুত্বপূর্ণ সুবিধা প্রদানকারী বীমা সংস্থাসমূহ।",
        search_insurers: "বীমাকারী বা পলিসি খুঁজুন...",
        reliability: "নির্ভরযোগ্যতা",
        primary_cover: "প্রাথমিক ক্যান্সার কভার",
        visit_website: "ওয়েবসাইট দেখুন",
        no_insurers_matched: "কোনো বীমাকারী পাওয়া যায়নি। অনুগ্রহ করে অন্য শব্দ দিয়ে চেষ্টা করুন।",
        view_details: "আবেদনের বিবরণ দেখুন",
        view_claim_guide: "পলিসি ও দাবি নির্দেশিকা দেখুন",
        cashless_network: "ক্যাশলেস নেটওয়ার্ক",
        claim_ratio: "দাবি নিষ্পত্তির অনুপাত",
        reimbursement: "রিইম্বার্সমেন্ট (টাকা ফেরত)",
        metro_rates: "মেট্রো রেট",
        tier_2: "টিয়ার ২",
        rural: "গ্রামীণ"
      }
    };
    const activeDict = dicts[language] || dicts.en;
    return activeDict[key] || dicts.en[key] || key;
  };

  const ageGroupLabels: Record<Language, Record<string, string>> = {
    en: {
      "Ages 20 - 29": "Ages 20 - 29",
      "Ages 30 - 39": "Ages 30 - 39",
      "Ages 40 - 49": "Ages 40 - 49",
      "Ages 50 - 74": "Ages 50 - 74",
      "Ages 75+ / High Risk": "Ages 75+ / High Risk"
    },
    hi: {
      "Ages 20 - 29": "20 - 29 वर्ष",
      "Ages 30 - 39": "30 - 39 वर्ष",
      "Ages 40 - 49": "40 - 49 वर्ष",
      "Ages 50 - 74": "50 - 74 वर्ष",
      "Ages 75+ / High Risk": "75+ वर्ष / उच्च जोखिम"
    },
    mr: {
      "Ages 20 - 29": "वय २० - २९",
      "Ages 30 - 39": "वय ३० - ३९",
      "Ages 40 - 49": "वय ४० - ४९",
      "Ages 50 - 74": "वय ५० - ७४",
      "Ages 75+ / High Risk": "वय ७५+ / अति-जोखीम"
    },
    kn: {
      "Ages 20 - 29": "೨೦ - ೨೯ ವರ್ಷಗಳು",
      "Ages 30 - 39": "೩೦ - ೩೯ ವರ್ಷಗಳು",
      "Ages 40 - 49": "೪೦ - ೪೯ ವರ್ಷಗಳು",
      "Ages 50 - 74": "೫೦ - ೭೪ ವರ್ಷಗಳು",
      "Ages 75+ / High Risk": "೭೫+ ವರ್ಷಗಳು / ಹೆಚ್ಚಿನ ಅಪಾಯ"
    },
    bn: {
      "Ages 20 - 29": "২০ - ২৯ বছর",
      "Ages 30 - 39": "৩০ - ৩৯ বছর",
      "Ages 40 - 49": "৪০ - ৪৯ বছর",
      "Ages 50 - 74": "৫০ - ৭৪ বছর",
      "Ages 75+ / High Risk": "৭৫+ বছর / উচ্চ ঝুঁকি"
    }
  };

  const localLabels = {
    guidelines: language === "hi" ? "स्क्रीनिंग दिशानिर्देश" : language === "mr" ? "स्क्रीनिंग मार्गदर्शक" : language === "kn" ? "ಸ್ಕ್ರೀನಿಂಗ್ ಮಾರ್ಗಸೂಚಿಗಳು" : language === "bn" ? "স্ক্রীনিং নির্দেশিকা" : "Screening Guidelines",
    guidelines_short: language === "hi" ? "दिशानिर्देश" : language === "mr" ? "मार्गदर्शक" : language === "kn" ? "ಮಾರ್ಗಸೂಚಿ" : language === "bn" ? "নির্দেশিকা" : "Guidelines",
    costs: language === "hi" ? "लागत अनुमानक" : language === "mr" ? "खर्च अंदाजक" : language === "kn" ? "ವೆಚ್ಚ ಅಂದಾಜುಗಾರ" : language === "bn" ? "ব্যয় হিসাবকারী" : "Cost Estimator",
    costs_short: language === "hi" ? "लागत" : language === "mr" ? "खर्च" : language === "kn" ? "ವೆಚ್ಚ" : language === "bn" ? "ব্যয়" : "Costs",
    schemes: language === "hi" ? "सरकारी योजनाएं" : language === "mr" ? "सरकारी योजना" : language === "kn" ? "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು" : language === "bn" ? "সরকারী প্রকল্প" : "Government Schemes",
    schemes_short: language === "hi" ? "योजनाएं" : language === "mr" ? "योजना" : language === "kn" ? "ಯೋಜನೆಗಳು" : language === "bn" ? "প্রকল্প" : "Schemes",
    insurers: language === "hi" ? "सामान्य बीमा" : language === "mr" ? "सामान्य विमा" : language === "kn" ? "ಸಾಮಾನ್ಯ ವಿಮೆ" : language === "bn" ? "সাধারণ বীমা" : "General Insurances",
    insurers_short: language === "hi" ? "बीमा" : language === "mr" ? "विमा" : language === "kn" ? "ವಿಮೆ" : language === "bn" ? "বীমা" : "Insurances"
  };

  const tests = localizedTests[language] || localizedTests.en;
  const guidelines = localizedAgeGuidelines[language] || localizedAgeGuidelines.en;
  const schemes = localizedMatchedSchemes[language] || localizedMatchedSchemes.en;

  const activeGuideline = guidelines.find(g => g.ageGroup === selectedAgeGroup) || guidelines[2];
  const activeCostMap = {
    ...areaCostMultiplier[selectedArea],
    name: localizedAreaCostMultiplier[language]?.[selectedArea]?.name || areaCostMultiplier[selectedArea].name,
    description: localizedAreaCostMultiplier[language]?.[selectedArea]?.description || areaCostMultiplier[selectedArea].description
  };

  const filteredInsurers = generalInsurers.filter(insurer =>
    insurer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insurer.primaryPolicy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insurer.hq.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell bare>
      {/* Fixed Local Sidebar - Styled exactly like the global SideNav of Start Your Journey */}
      <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] py-lg w-64 fixed left-0 top-16 bg-surface-container-low shadow-md z-40 overflow-y-auto custom-scrollbar">
        <div className="px-md mb-lg">
          <h2 className="font-headline-sm text-headline-sm text-[#B83B5E] font-bold">{localT("prev_care")}</h2>
          <p className="font-label-sm text-label-sm text-on-surface-variant">{localT("awareness")}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {[
            { id: "guidelines", label: localLabels.guidelines, icon: "timeline" },
            { id: "costs", label: localLabels.costs, icon: "payments" },
            { id: "schemes", label: localLabels.schemes, icon: "account_balance" },
            { id: "insurers", label: localLabels.insurers, icon: "security" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as "guidelines" | "costs" | "schemes" | "insurers")}
              className={`w-full flex items-center gap-sm px-4 py-3 font-label-md text-label-md transition-transform duration-150 text-left focus-visible:ring-2 focus-visible:ring-[#B83B5E] outline-none ${
                activeTab === item.id
                  ? "text-[#B83B5E] font-bold border-r-4 border-[#B83B5E] bg-[#F9CBDB]/10"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area - Shifted left on desktop to accommodate the sidebar, matching all pages */}
      <div className="max-w-container-max mx-auto p-md lg:p-lg space-y-lg md:ml-64">
        
        {/* Header Block - Rose/Pink Gradient Theme */}
        <header className="bg-gradient-to-r from-[#F9CBDB]/30 via-[#F9CBDB]/10 to-surface-container-low border border-[#F9CBDB]/40 rounded-3xl p-md md:p-lg flex flex-col md:flex-row justify-between items-center gap-md shadow-sm relative overflow-hidden shrink-0">
          <div className="absolute inset-0 -z-10 bg-radial-gradient from-[#F9CBDB]/15 to-transparent opacity-40 blur-2xl" />
          <div className="max-w-2xl space-y-xs">
            <span className="inline-flex items-center gap-xs px-2.5 py-1 bg-[#F9CBDB]/20 text-[#B83B5E] border border-[#F9CBDB]/40 text-[10px] font-bold rounded-full uppercase tracking-wider">
              <span className="material-symbols-outlined text-[12px] active-entity-pulse">health_and_safety</span>
              {localT("prevention")}
            </span>
            <h1 className="font-headline-lg text-[28px] md:text-headline-lg text-primary font-bold tracking-tight">
              {t("pp_title")}
            </h1>
            <p className="font-body-md text-on-surface-variant leading-relaxed text-sm">
              {t("pp_subtitle")}
            </p>
          </div>
          <div className="bg-surface-bright border border-outline-variant rounded-2xl p-sm shadow-sm shrink-0 flex items-center gap-sm">
            <div className="w-10 h-10 rounded-full bg-[#F9CBDB]/20 text-[#B83B5E] flex items-center justify-center border border-[#F9CBDB]/30">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div>
              <p className="font-label-sm text-outline">{localT("clinical_ref")}</p>
              <p className="font-bold text-secondary text-xs">{localT("compliant")}</p>
            </div>
          </div>
        </header>

        {/* Mobile Horizontal Tabs - Swipeable/Scrollable */}
        <div className="flex flex-row overflow-x-auto gap-xs pb-sm md:hidden shrink-0 border-b border-outline-variant/30 scrollbar-none">
          {[
            { id: "guidelines", label: localLabels.guidelines_short, icon: "timeline" },
            { id: "costs", label: localLabels.costs_short, icon: "payments" },
            { id: "schemes", label: localLabels.schemes_short, icon: "account_balance" },
            { id: "insurers", label: localLabels.insurers_short, icon: "security" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "guidelines" | "costs" | "schemes" | "insurers")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-xs focus-visible:ring-2 focus-visible:ring-[#B83B5E] ${
                activeTab === tab.id
                  ? "bg-[#F9CBDB]/30 text-[#B83B5E] border border-[#F9CBDB]/50"
                  : "bg-surface-container border border-outline-variant/40 text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Active section view */}
        <main className="w-full flex flex-col gap-md">

            {/* TAB 1: SCREENING GUIDELINES */}
            {activeTab === "guidelines" && (
              <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 p-md md:p-lg flex flex-col justify-between shadow-sm space-y-md animate-fade-in" aria-label="Screening Frequencies by Age">
                <div>
                  <div className="border-b border-outline-variant/40 pb-sm mb-md flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
                    <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">timeline</span>
                      {localT("freq_planner")}
                    </h2>
                    <p className="text-xs text-outline font-semibold">{localT("select_age")}</p>
                  </div>

                  {/* Age Tabs */}
                  <div className="flex flex-wrap gap-xs mb-lg">
                    {guidelines.map(g => (
                      <button
                        key={g.ageGroup}
                        onClick={() => setSelectedAgeGroup(g.ageGroup)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#B83B5E] ${
                          selectedAgeGroup === g.ageGroup
                            ? "bg-[#B83B5E] text-white shadow-md"
                            : "bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:border-[#F9CBDB]"
                        }`}
                      >
                        {ageGroupLabels[language]?.[g.ageGroup] || g.ageGroup}
                      </button>
                    ))}
                  </div>

                  {/* Age Summary & Advice */}
                  <div className="bg-[#F9CBDB]/10 border border-[#F9CBDB]/30 rounded-2xl p-md mb-md animate-fade-in">
                    <h4 className="font-label-md text-[#B83B5E] font-bold flex items-center gap-xs text-xs">
                      <span className="material-symbols-outlined text-sm">lightbulb</span>
                      {localT("clinical_overview")} {ageGroupLabels[language]?.[selectedAgeGroup] || selectedAgeGroup}
                    </h4>
                    <p className="text-body-sm text-on-surface-variant mt-xs leading-relaxed text-xs">
                      {activeGuideline.generalAdvice}
                    </p>
                  </div>

                  {/* Guidelines List */}
                  <div className="space-y-sm">
                    {activeGuideline.recommendations.map((rec) => {
                      const testDetail = tests.find(t => t.id === rec.testId);
                      if (!testDetail) return null;

                      const toneClass = {
                        primary: "bg-[#B83B5E]/10 text-[#B83B5E] border border-[#B83B5E]/20",
                        secondary: "bg-secondary/10 text-secondary border border-secondary/20",
                        tertiary: "bg-tertiary/10 text-tertiary border border-tertiary/20",
                        outline: "bg-surface-container-high text-on-surface-variant border border-outline-variant"
                      }[rec.badgeTone];

                      return (
                        <div 
                          key={rec.testId}
                          className="p-md bg-surface-container-low border border-outline-variant/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-md hover:border-[#F9CBDB]/80 transition-all shadow-sm animate-fade-in"
                        >
                          <div className="space-y-xs max-w-xl">
                            <div className="flex items-center gap-xs flex-wrap">
                              <h4 className="font-headline-sm text-[16px] text-on-surface font-bold">
                                {testDetail.name}
                              </h4>
                              <span className="px-2 py-0.5 bg-outline-variant text-[10px] font-bold rounded uppercase">
                                Code: {testDetail.code}
                              </span>
                            </div>
                            <p className="text-body-sm text-on-surface-variant leading-relaxed text-xs">
                              {rec.description}
                            </p>
                            <p className="text-[10px] text-outline italic">
                              <strong>Vascular Significance:</strong> {testDetail.clinicalSignificance}
                            </p>
                            {testDetail.bseInstruction && (
                              <div className="mt-sm bg-surface-bright border border-outline-variant/30 rounded-xl p-sm text-[11px] text-on-surface-variant leading-relaxed">
                                <strong>Self-Check Guide:</strong> {testDetail.bseInstruction}
                              </div>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${toneClass}`}>
                            {rec.frequency}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="pt-md border-t border-outline-variant/30 flex justify-between items-center shrink-0">
                  <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#B83B5E] animate-pulse" />
                    {localT("updated_standards")}
                  </span>
                </div>
              </section>
            )}

            {/* TAB 2: SCREENING COST ESTIMATOR */}
            {activeTab === "costs" && (
              <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 p-md md:p-lg flex flex-col justify-between shadow-sm space-y-md animate-fade-in" aria-label="Dynamic Diagnostic Cost Estimator">
                <div className="space-y-md">
                  
                  {/* Header */}
                  <div className="border-b border-outline-variant/40 pb-sm">
                    <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[#B83B5E] text-[24px]">payments</span>
                      {localT("costs")}
                    </h2>
                    <p className="text-body-sm text-on-surface-variant mt-1 text-xs font-normal">
                      {localT("pricing_maps")}
                    </p>
                  </div>

                  {/* Top Control Panel: Search & Segmented Selector */}
                  <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-md flex flex-col md:flex-row md:items-center justify-between gap-md shadow-sm">
                    {/* City Search */}
                    <div className="flex-1 space-y-xs">
                      <label htmlFor="city-finder" className="block text-[10px] font-bold text-outline uppercase tracking-wider pl-1">
                        {localT("find_city")}
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">location_city</span>
                        <input
                          id="city-finder"
                          type="text"
                          value={citySearchQuery}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCitySearchQuery(val);
                            const match = matchCityToTier(val);
                            if (match) {
                              setSelectedArea(match.tier);
                            }
                          }}
                          className="w-full p-2.5 pl-10 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-[#B83B5E] focus:border-[#B83B5E] text-xs transition-all placeholder-outline/50"
                          placeholder={localT("search_city_placeholder")}
                        />
                      </div>
                      {citySearchQuery.trim() && (() => {
                        const match = matchCityToTier(citySearchQuery);
                        if (match) {
                          if (match.isMatched) {
                            return (
                              <p className="text-[11px] font-bold text-[#B83B5E] flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-[13px]">verified</span>
                                "{match.name}" {localT("matched_as")} {match.tier === "tier1" ? localT("metro_rates") : localT("tier_2")}
                              </p>
                            );
                          } else {
                            return (
                              <p className="text-[11px] text-outline flex items-center gap-1 mt-1 italic font-medium">
                                <span className="material-symbols-outlined text-[13px]">info</span>
                                "{match.name}" {localT("not_in_list")}
                              </p>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>

                    {/* Segmented Tier Selector */}
                    <div className="space-y-xs shrink-0">
                      <span className="block text-[10px] font-bold text-outline uppercase tracking-wider pl-1">
                        {localT("select_pricing_tier")}
                      </span>
                      <div className="inline-flex bg-surface-container-high p-1 rounded-xl border border-outline-variant/60">
                        {[
                          { key: "tier1", label: language === "hi" ? "टियर 1 (मेट्रो)" : language === "mr" ? "टियर १ (मेट्रो)" : language === "kn" ? "ಟಯರ್ 1 (ಮೆಟ್ರೋ)" : language === "bn" ? "টিয়ার ১ (মেট্রো)" : "Tier 1 (Metro)" },
                          { key: "tier2", label: language === "hi" ? "टियर 2" : language === "mr" ? "टियर २" : language === "kn" ? "ಟಯರ್ 2" : language === "bn" ? "টিয়ার ২" : "Tier 2" },
                          { key: "tier3", label: language === "hi" ? "टियर 3 (ग्रामीण)" : language === "mr" ? "टियर ३ (ग्रामीण)" : language === "kn" ? "ಟಯರ್ 3 (ಗ್ರಾಮೀಣ)" : language === "bn" ? "টিয়ার ৩ (গ্রামীণ)" : "Tier 3 (Rural)" }
                        ].map((tier) => (
                          <button
                            key={tier.key}
                            onClick={() => {
                              setSelectedArea(tier.key as AreaTier);
                              setCitySearchQuery(""); // Clear search to avoid confusion
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                              selectedArea === tier.key
                                ? "bg-[#B83B5E] text-white shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                            }`}
                          >
                            {tier.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Main Grid Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-stretch">
                    
                    {/* Left Column: Pricing Sheet */}
                    <div className="lg:col-span-7 flex flex-col">
                      <div className="flex-1 space-y-sm bg-surface-container-low p-md md:p-lg rounded-2xl border border-[#F9CBDB]/20 shadow-sm relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#F9CBDB]/15 rounded-full blur-xl pointer-events-none" />
                        
                        <div>
                          <div className="flex justify-between items-center pb-sm border-b border-outline-variant/30 mb-sm">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-outline tracking-wider">
                                {localT("pricing_sheet")}
                              </p>
                              <h3 className="font-bold text-primary text-sm mt-0.5">
                                {activeCostMap.name}
                              </h3>
                            </div>
                            <span className="text-[10px] font-bold text-[#B83B5E] uppercase bg-[#F9CBDB]/30 px-2.5 py-0.5 rounded-full border border-[#F9CBDB]/40">
                              {selectedArea === "tier1" ? localT("metro_rates") : selectedArea === "tier2" ? localT("tier_2") : localT("rural")}
                            </span>
                          </div>

                          <div className="divide-y divide-outline-variant/20">
                            {tests.map((test) => {
                              const testPrice = activeCostMap[test.id as keyof typeof activeCostMap] || "₹0";
                              return (
                                <div key={test.id} className="flex justify-between items-center py-2.5 first:pt-1 last:pb-1 hover:bg-[#F9CBDB]/5 transition-colors px-1 rounded-lg">
                                  <div className="max-w-[70%]">
                                    <p className="font-label-md text-on-surface font-bold text-xs leading-none">{test.name}</p>
                                    <p className="text-[10px] text-on-surface-variant leading-none mt-1.5">{test.purpose.split(".")[0]}.</p>
                                  </div>
                                  <span className={`font-bold text-sm shrink-0 ${testPrice.includes("Free") || testPrice.includes("विनामूल्य") || testPrice.includes("निःशुल्क") || testPrice.includes("ಉಚಿತ") || testPrice.includes("বিনামূল্য") ? "text-secondary font-extrabold" : "text-[#B83B5E]"}`}>
                                    {testPrice}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="pt-sm border-t border-outline-variant/30 text-[10px] text-outline flex items-center justify-between">
                          <span>{localT("estimates_derived")}</span>
                          <span className="font-bold text-[#B83B5E] uppercase tracking-wider">{localT("inr_rates")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Reference Info & Comparison */}
                    <div className="lg:col-span-5 space-y-md flex flex-col justify-between">
                      
                      {/* Included Cities */}
                      <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-md flex-1 flex flex-col justify-between">
                        <div className="space-y-sm">
                          <div>
                            <h4 className="font-label-md text-primary font-bold flex items-center gap-xs text-xs">
                              <span className="material-symbols-outlined text-[#B83B5E] text-[18px]">map</span>
                              {localT("cities_in_tier")}
                            </h4>
                            <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                              {activeCostMap.description}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-xs pt-1 max-h-40 overflow-y-auto custom-scrollbar">
                            {activeCostMap.cities.map((city) => {
                              const isMatched = citySearchQuery.trim() && city.toLowerCase().includes(citySearchQuery.trim().toLowerCase());
                              return (
                                <span 
                                  key={city} 
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                                    isMatched
                                      ? "bg-[#B83B5E] text-white border-[#B83B5E] scale-105 shadow-sm"
                                      : "bg-surface-bright text-on-surface border-outline-variant/60"
                                  }`}
                                >
                                  {city}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {selectedArea !== "tier3" && (
                          <div className="mt-md bg-[#F9CBDB]/10 border border-[#F9CBDB]/30 rounded-xl p-xs flex items-center gap-sm">
                            <span className="material-symbols-outlined text-[#B83B5E] text-lg pl-1">volunteer_activism</span>
                            <p className="text-[10px] text-on-surface-variant leading-tight">
                              {localT("travel_savings")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Cost Comparison Meter */}
                      <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-md space-y-sm">
                        <h4 className="text-xs font-bold text-on-surface flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px] text-outline">analytics</span>
                          {localT("national_scaling")}
                        </h4>
                        
                        <div className="space-y-xs">
                          {/* Meter items */}
                          {[
                            { label: language === "hi" ? "टियर 1 (मेट्रो)" : language === "mr" ? "टियर १ (मेट्रो)" : language === "kn" ? "ಟಯರ್ 1 (ಮೆಟ್ರೋ)" : language === "bn" ? "টিয়ার ১ (মেট্রো)" : "Tier 1 (Metro)", scale: "100%", style: "w-full bg-[#B83B5E]" },
                            { label: language === "hi" ? "टियर 2 शहर" : language === "mr" ? "टियर २ शहरे" : language === "kn" ? "ಟಯರ್ 2 ನಗರಗಳು" : language === "bn" ? "টিয়ার ২ শহর" : "Tier 2 Cities", scale: "70%", style: "w-[70%] bg-[#B83B5E]/70" },
                            { label: language === "hi" ? "टियर 3 / ग्रामीण" : language === "mr" ? "टियर ३ / ग्रामीण" : language === "kn" ? "ಟಯರ್ 3 / ಗ್ರಾಮೀಣ" : language === "bn" ? "টিয়ার ৩ / গ্রামীণ" : "Tier 3 / Rural", scale: "40%", style: "w-[40%] bg-secondary" }
                          ].map((item) => (
                            <div key={item.label} className="space-y-[2px]">
                              <div className="flex justify-between text-[9px] text-on-surface-variant font-bold">
                                <span>{item.label}</span>
                                <span>{item.scale === "100%" ? `${localT("baseline")} (100%)` : `~${100 - parseInt(item.scale)}% ${localT("avg_savings")}`}</span>
                              </div>
                              <div className="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden">
                                <div className={`h-1 rounded-full ${item.style}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

                <div className="pt-md border-t border-outline-variant/30 text-[10px] text-outline leading-relaxed italic">
                  {localT("estimates_disclaimer")}
                </div>
              </section>
            )}

            {/* TAB 3: GOVERNMENT AID SCHEMES */}
            {activeTab === "schemes" && (
              <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 p-md md:p-lg shadow-sm space-y-md animate-fade-in" aria-label="Matched Government Financial Aid Programs">
                <div className="border-b border-outline-variant/40 pb-sm">
                  <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary text-[22px]">account_balance</span>
                    {localT("matched_schemes_title")}
                  </h2>
                  <p className="text-body-sm text-on-surface-variant mt-1 text-sm">
                    {localT("matched_schemes_desc")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                  {schemes.map((scheme) => (
                    <div 
                      key={scheme.title}
                      className="p-md bg-surface-container-low border border-outline-variant/50 rounded-2xl hover:border-[#F9CBDB]/50 transition-all flex flex-col justify-between gap-sm shadow-sm"
                    >
                      <div className="space-y-sm">
                        <div className="flex items-center gap-xs text-[#B83B5E] font-bold">
                          <span className="material-symbols-outlined text-[20px]">{scheme.icon}</span>
                          <h4 className="font-headline-sm text-[15px] font-bold leading-tight">{scheme.title}</h4>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-[#B83B5E] uppercase bg-[#F9CBDB]/35 px-2 py-0.5 rounded-full tracking-wider border border-[#F9CBDB]">
                            {scheme.coverage}
                          </span>
                        </div>
                        <p className="text-body-sm text-on-surface-variant text-xs leading-relaxed">
                          {scheme.details}
                        </p>
                      </div>
                      <div className="pt-sm border-t border-outline-variant/30 text-[11px] text-on-surface-variant font-medium">
                        <strong>{localT("eligibility_label")}</strong> {scheme.eligibility}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* TAB 4: GENERAL INSURANCES */}
            {activeTab === "insurers" && (
              <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/60 p-md md:p-lg shadow-sm space-y-md animate-fade-in" aria-label="Private General Insurers Catalogue">
                <div className="border-b border-outline-variant/40 pb-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-sm">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">security</span>
                      {localT("empanelled_insurers")}
                    </h2>
                    <p className="text-body-sm text-on-surface-variant mt-1 text-sm">
                      {localT("insurers_desc")}
                    </p>
                  </div>
                  
                  {/* Search filter input */}
                  <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-[18px]">search</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-2.5 pl-10 rounded-xl border border-outline-variant bg-surface-container-low font-body-sm text-on-surface outline-none focus:ring-2 focus:ring-[#B83B5E] focus:border-[#B83B5E] text-xs"
                      placeholder={localT("search_insurers")}
                    />
                  </div>
                </div>

                {/* Insurers list grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                  {filteredInsurers.length > 0 ? (
                    filteredInsurers.map((insurer) => (
                      <div 
                        key={insurer.name}
                        className="p-md bg-surface-container-low border border-outline-variant/60 rounded-2xl shadow-sm hover:border-[#F9CBDB] transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-sm">
                          {/* Header: Name, sector, reliability */}
                          <div className="flex justify-between items-start gap-xs">
                            <div>
                              <h4 className="font-headline-sm text-[15px] text-primary group-hover:text-primary-hover transition-colors font-bold leading-snug">
                                {insurer.name}
                              </h4>
                              <p className="text-[9px] text-outline uppercase font-bold tracking-wider mt-0.5">
                                {insurer.sector} • Reg No. {insurer.regNumber}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 bg-[#F9CBDB]/20 text-[#B83B5E] border border-[#F9CBDB]/30 text-[9px] font-bold rounded-full whitespace-nowrap shrink-0">
                              {insurer.reliability}% {localT("reliability")}
                            </span>
                          </div>

                          {/* Policy panel */}
                          <div className="bg-[#F9CBDB]/10 p-xs rounded-xl border border-[#F9CBDB]/30">
                            <div className="flex items-center gap-xs text-[#B83B5E] font-bold text-xs p-1">
                              <span className="material-symbols-outlined text-sm">shield</span>
                              <span className="truncate">{insurer.primaryPolicy}</span>
                            </div>
                            <ul className="text-body-sm text-on-surface-variant space-y-1 pl-4 list-disc text-[11px] leading-relaxed p-1 pb-2">
                              {insurer.policyFeatures.slice(0, 2).map((feat, idx) => (
                                <li key={idx} className="line-clamp-2">{feat}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Network details */}
                          <div className="grid grid-cols-2 gap-sm text-[10px] text-on-surface-variant font-medium pt-xs">
                            <div className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-outline text-sm">location_on</span>
                              <span className="truncate">HQ: {insurer.hq}</span>
                            </div>
                            <div className="flex items-center gap-xs">
                              <span className="material-symbols-outlined text-outline text-sm">local_hospital</span>
                              <span>{insurer.networkHospitals}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions bar */}
                        <div className="flex items-center justify-between pt-sm border-t border-outline-variant/30 gap-sm mt-sm">
                          <a
                            href={insurer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#B83B5E] hover:text-[#A12E50] font-bold flex items-center gap-[2px]"
                          >
                            {localT("visit_website")}
                            <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                          </a>
                          
                          <div className="flex items-center gap-xs">
                            {insurer.contactPhone && (
                              <a
                                href={`tel:${insurer.contactPhone}`}
                                className="w-7 h-7 rounded-lg bg-surface-container-highest hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors border border-outline-variant/40"
                                title={`Call CMD Office: ${insurer.contactPhone}`}
                              >
                                <span className="material-symbols-outlined text-sm">phone</span>
                              </a>
                            )}
                            {insurer.contactEmail && (
                              <a
                                href={`mailto:${insurer.contactEmail}`}
                                className="w-7 h-7 rounded-lg bg-surface-container-highest hover:bg-surface-container flex items-center justify-center text-[#B83B5E] transition-colors border border-[#F9CBDB]/40"
                                title={`Email CMD Office: ${insurer.contactEmail}`}
                              >
                                <span className="material-symbols-outlined text-sm">mail</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-xl border border-dashed border-outline-variant/60 rounded-2xl bg-surface-container-low text-outline text-xs">
                      {localT("no_insurers_matched")}
                    </div>
                  )}
                </div>
              </section>
            )}

          </main>
      </div>
    </AppShell>
  );
}
