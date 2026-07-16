import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useLanguage } from "../components/LanguageContext";

type SchemeLink = {
  label: string;
  url: string;
  type: "official" | "hospitals" | "eligibility" | "guide" | "other";
};

type Scheme = {
  title: string;
  category: "General" | "Breast Cancer Specific" | "State Specific";
  state: string; // Domicile state
  tag: string;
  tagTone: "tertiary-container" | "surface-variant";
  icon: string;
  body: string;
  bullets: string[];
  reliability: number;
  links: SchemeLink[];
  description: string;
  requiredDocuments: string[];
};

export type Insurance = {
  name: string;
  regNumber: string;
  sector: "Public Sector" | "Private Sector" | "Standalone Health";
  hq: string;
  networkHospitals: string;
  networkSize: number;
  primaryPolicy: string;
  policyFeatures: string[];
  body: string;
  reliability: number;
  website: string;
  requiredDocuments: string[];
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
};

// ... schemes data placeholder for compiler alignment ...


const schemes: Scheme[] = [
  {
    title: "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
    category: "General",
    state: "All India",
    tag: "Central Govt",
    tagTone: "tertiary-container",
    icon: "local_hospital",
    body: "Covers hospitalization up to ₹5 lakh/family/year including breast cancer surgery, chemotherapy, radiation & oncology procedures at empanelled hospitals.",
    bullets: [
      "₹5 Lakh cashless coverage per family per year",
      "Covers breast cancer chemo, radiation & oncology",
      "Valid at all empanelled public and private hospitals"
    ],
    reliability: 95,
    description: "Ayushman Bharat PM-JAY is the world's largest health assurance scheme, fully funded by the Government of India. It provides cashless and paperless access to services for the beneficiary at the point of service in any empanelled hospital across the country.",
    links: [
      { label: "PM-JAY Official Portal", url: "https://hem.nha.gov.in/search", type: "official" },
      { label: "Find Empanelled Hospitals", url: "https://hem.nha.gov.in/search", type: "hospitals" },
      { label: "Check Eligibility", url: "https://beneficiary.nha.gov.in/", type: "eligibility" },
      { label: "How to Use Video Guide", url: "https://www.youtube.com/playlist?list=PLYcj0BpCoCc7CBFxCMJo2Ms2iKypz5kAw", type: "guide" }
    ],
    requiredDocuments: [
      "Aadhaar Card or PAN Card (Identity proof)",
      "PM-JAY Golden Card or Family HHID Number",
      "Ration Card showing family listing",
      "Domicile Certificate"
    ]
  },
  {
    title: "Rashtriya Arogya Nidhi (RAN)",
    category: "General",
    state: "All India",
    tag: "Central Govt",
    tagTone: "tertiary-container",
    icon: "payments",
    body: "Financial assistance for poor patients with life-threatening diseases including cancer; support can go up to ₹15 lakh in eligible cases. (myScheme)",
    bullets: [
      "One-time financial aid up to ₹15 Lakh for critical illnesses",
      "Targeted exclusively for Below Poverty Line (BPL) families",
      "Treatment in designated government super-specialty hospitals / RCCs"
    ],
    reliability: 88,
    description: "Rashtriya Arogya Nidhi provides one-time financial assistance to patients who are suffering from major life-threatening diseases related to heart, kidney, liver, cancer, etc. who are receiving treatment in super specialty government hospitals or regional cancer centres.",
    links: [
      { label: "RAN Scheme Details", url: "https://www.myscheme.gov.in/schemes/ran", type: "official" }
    ],
    requiredDocuments: [
      "Prescribed RAN Application Form (signed by treating doctor)",
      "Countersignature by Medical Superintendent of the government hospital",
      "Income Certificate (verifying BPL status)",
      "BPL Ration Card copy",
      "Oncology medical test reports & biopsy diagnoses",
      "Copy of bank account passbook",
      "Passport-sized photograph of the patient"
    ]
  },
  {
    title: "Health Minister’s Cancer Patient Fund (HMCPF)",
    category: "General",
    state: "All India",
    tag: "Central Govt",
    tagTone: "tertiary-container",
    icon: "medical_services",
    body: "Dedicated cancer-treatment fund under RAN for BPL cancer patients treated at Regional Cancer Centres (RCCs) and approved institutes. (myScheme)",
    bullets: [
      "Assistance: up to ₹2 Lakh standard, up to ₹5 Lakh emergency",
      "Exclusive for BPL (poor) patients suffering from malignant cancer",
      "Valid at 27 designated Regional Cancer Centres (RCCs) across India"
    ],
    reliability: 90,
    description: "The HMCPF is a dedicated cancer treatment fund set up under the Rashtriya Arogya Nidhi (RAN). The financial assistance is provided directly to the treating Regional Cancer Centre to cover drugs, radiation, and surgeries. Central/State Gov or PSU employees are not eligible.",
    links: [
      { label: "HMCPF Information", url: "https://www.myscheme.gov.in/schemes/hmcpf", type: "official" }
    ],
    requiredDocuments: [
      "Prescribed HMCPF Application Form completed by treating doctor",
      "Countersignature by Medical Superintendent of designated Regional Cancer Centre (RCC)",
      "Income Certificate (verifying low-income/BPL status)",
      "BPL Ration Card copy",
      "Complete medical history, biopsy, and pathology reports",
      "Aadhaar Card copy",
      "Passport-sized photograph of the patient"
    ]
  },
  {
    title: "Health Minister’s Discretionary Grant (HMDG)",
    category: "General",
    state: "All India",
    tag: "Central Govt",
    tagTone: "tertiary-container",
    icon: "handshake",
    body: "One-time financial assistance for poor patients receiving treatment in government hospitals.",
    bullets: [
      "One-time financial grant up to ₹1,25,000",
      "Income ceiling applies for needy poor families",
      "Requires recommendation from treating government doctor"
    ],
    reliability: 82,
    description: "The HMDG scheme provides up to ₹1,25,000 in one-time financial assistance to poor patients who are suffering from major illnesses and cannot afford treatments in government hospitals.",
    links: [
      { label: "MoHFW Financial Assistance Info", url: "https://main.mohfw.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Prescribed HMDG Application Form signed by the treating doctor",
      "Income Certificate showing annual family income under limits",
      "Ration Card copy",
      "Detailed medical diagnosis report and treatment cost estimate",
      "Identity Proof (Aadhaar/Voter ID)",
      "Recommendation from local MP/District Magistrate or treating hospital"
    ]
  },
  {
    title: "National Programme for Prevention and Control of Non-Communicable Diseases (NP-NCD)",
    category: "General",
    state: "All India",
    tag: "Central Govt",
    tagTone: "tertiary-container",
    icon: "biotech",
    body: "Government screening and early detection program for cancers including breast cancer at district hospitals and health centres.",
    bullets: [
      "Free routine cancer screening and counseling",
      "Clinics situated at district and block health centers",
      "Focuses on early detection of breast, oral & cervical cancers"
    ],
    reliability: 80,
    description: "NP-NCD focuses on infrastructure development, human resource development, health promotion, early diagnosis, and management of non-communicable diseases. Under this initiative, free cancer screening and community-level awareness drives are conducted regularly.",
    links: [
      { label: "NP-NCD Program Website", url: "https://nhm.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Aadhaar Card (Identity proof)",
      "OPD registration slip at Government District Hospital / Health Centre",
      "Local address proof"
    ]
  },
  {
    title: "Central Government Health Scheme (CGHS)",
    category: "General",
    state: "All India",
    tag: "Central Govt",
    tagTone: "tertiary-container",
    icon: "badge",
    body: "Cashless cancer treatment and reimbursement for central government employees, pensioners and dependents.",
    bullets: [
      "Cashless treatment and diagnostics at empanelled centers",
      "Applicable to central government employees and pensioners",
      "Covers chemotherapy, radiation & surgery procedures"
    ],
    reliability: 92,
    description: "CGHS provides comprehensive health care facilities for Central Government employees, pensioners, and their family members. Cashless cancer therapies are covered in private hospitals empanelled with CGHS based on standard rates.",
    links: [
      { label: "CGHS Portal", url: "https://cghs.nic.in", type: "official" }
    ],
    requiredDocuments: [
      "Valid CGHS Plastic Card of the employee/pensioner & dependent",
      "Oncologist referral letter from government medical officer",
      "Official permission letter for cancer treatment at private empanelled hospital",
      "Original prescriptions, medical reports, and bills"
    ]
  },
  {
    title: "Employees’ State Insurance Scheme (ESIC)",
    category: "General",
    state: "All India",
    tag: "Central Govt",
    tagTone: "tertiary-container",
    icon: "domain",
    body: "Covers cancer treatment for eligible salaried workers under ESI hospitals and tie-up centres.",
    bullets: [
      "Full coverage for salaried workers with monthly income under limits",
      "Treatment at specialized ESI super-specialty hospitals",
      "Extends cancer treatment benefits to dependents"
    ],
    reliability: 89,
    description: "ESIC is a multi-dimensional social security system that provides medical care and cash benefits for workers in the organized sector. Cancer care and advanced chemotherapy are provided completely free at ESI network and tie-up hospitals.",
    links: [
      { label: "ESIC Official Website", url: "https://www.esic.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "ESIC Pehchan Smart Card / E-Pehchan Card",
      "Employer declaration of monthly contributions / salary slip",
      "Doctor referral from local ESI Dispensary / Hospital",
      "Identity Proof and Domicile proof of the patient"
    ]
  },
  {
    title: "Indian Railways Cancer Concession",
    category: "General",
    state: "All India",
    tag: "Central Govt",
    tagTone: "tertiary-container",
    icon: "train",
    body: "Railway fare concession (up to 100% in some classes) for cancer patients and attendants traveling for treatment.",
    bullets: [
      "Up to 100% ticket discount for cancer patients",
      "Concession also provided for one accompanying attendant",
      "Valid for travel to/from empanelled oncology hospitals"
    ],
    reliability: 94,
    description: "To ease the burden of cancer travel, Indian Railways provides significant concessions on travel fares for cancer patients going for diagnostic checks, active surgery, radiation, or chemotherapy, along with one attendant.",
    links: [
      { label: "Railway Concession Rules", url: "https://indianrailways.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Official Railway Cancer Concession Certificate issued by treating oncologist / Cancer Hospital",
      "Oncology diagnosis report and hospital referral card",
      "Aadhaar Card / Photo Identity of patient & attendant",
      "Copy of active treatment schedule"
    ]
  },
  {
    title: "Air India Cancer Travel Concession",
    category: "General",
    state: "All India",
    tag: "Central Govt",
    tagTone: "tertiary-container",
    icon: "flight",
    body: "Discounted airfare for cancer patients traveling for treatment.",
    bullets: [
      "Up to 50% discount on base fares for domestic travel",
      "Requires standard oncology medical certification",
      "Valid on select Air India operated flights"
    ],
    reliability: 88,
    description: "Air India provides air travel concessions to cancer patients traveling for treatment or diagnostic checks within India. This helps patients travel quickly and safely under high-comfort conditions.",
    links: [
      { label: "Air India Concessions", url: "https://www.airindia.com", type: "official" }
    ],
    requiredDocuments: [
      "Official Medical Certificate issued by Regional Cancer Centre / Government Hospital",
      "Airline Concession application form",
      "Identity Proof (Aadhaar / Passport)",
      "Proof of medical appointment / surgery details"
    ]
  },
  {
    title: "National Health Mission (NHM)",
    category: "General",
    state: "All India",
    tag: "Central Govt",
    tagTone: "tertiary-container",
    icon: "health_and_safety",
    body: "Funds state-level cancer screening, diagnostics, awareness and district NCD clinics.",
    bullets: [
      "Supports free medicines and diagnostic checks in states",
      "Establishes District Non-Communicable Disease (NCD) clinics",
      "Funds regional oncology awareness campaigns"
    ],
    reliability: 85,
    description: "The NHM supports states in strengthening their healthcare delivery systems, including cancer diagnosis, screening, and secondary care under national non-communicable disease initiatives.",
    links: [
      { label: "NHM India Portal", url: "https://nhm.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Local government hospital registration / treatment booklet",
      "Ration Card copy"
    ]
  },
  {
    title: "AFFDF - Financial Assistance for ex-Servicemen & Widows",
    category: "General",
    state: "All India",
    tag: "Central Govt",
    tagTone: "tertiary-container",
    icon: "military_tech",
    body: "Financial assistance for treatment of serious diseases including cancer to non-pensioner ex-servicemen of all ranks and their widows. (myScheme)",
    bullets: [
      "Cancer/Dialysis assistance up to ₹75,000 per annum",
      "Reimbursement: 75% for non-pensioner officers, 90% for other ranks",
      "Valid for treatments obtained at approved government hospitals"
    ],
    reliability: 86,
    description: "The Armed Forces Flag Day Fund (AFFDF) provides financial assistance to non-pensioner ex-servicemen (ESM) of all ranks and their widows who are suffering from serious illnesses like cancer, heart disease, or renal failure. Expenditure is calculated based on CGHS/ECHS rates. Bank account must be with SBI or PNB.",
    links: [
      { label: "AFFDF Scheme Link", url: "https://www.myscheme.gov.in/schemes/affdf-serious-disease-treatment", type: "official" }
    ],
    requiredDocuments: [
      "Ex-Servicemen Discharge Book copy",
      "Sainik Board non-pensioner identity card",
      "Medical Certificate confirming cancer from approved government hospital",
      "Itemized medical bills, prescriptions, and receipts",
      "Affidavit declaring non-receipt of other medical pension/reimbursement",
      "Copy of bank passbook (SBI or PNB only)",
      "Aadhaar Card copy"
    ]
  },
  {
    title: "NPCDCS Breast Cancer Screening Program",
    category: "Breast Cancer Specific",
    state: "All India",
    tag: "Breast Cancer",
    tagTone: "surface-variant",
    icon: "female",
    body: "Clinical breast examination and screening through government Primary Health Centres (PHCs), CHCs and district hospitals.",
    bullets: [
      "Free clinical breast examinations by trained doctors",
      "Local community-level outreach and education programs",
      "Referral pipeline to Regional Cancer Centres for diagnostics"
    ],
    reliability: 82,
    description: "Under the NPCDCS, screening for breast cancer is prioritized at local primary healthcare touchpoints, helping detect abnormalities early for quick diagnostic follow-up.",
    links: [
      { label: "NPCDCS Information", url: "https://nhm.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Aadhaar Card",
      "Primary Health Centre (PHC) / CHC registration booklet",
      "Referral slip (if referred to tertiary center)"
    ]
  },
  {
    title: "Ayushman Bharat Breast Cancer Packages",
    category: "Breast Cancer Specific",
    state: "All India",
    tag: "Breast Cancer",
    tagTone: "surface-variant",
    icon: "medical_information",
    body: "Includes mastectomy, lumpectomy, chemo, radiation, diagnostics and reconstructive procedures in approved hospitals.",
    bullets: [
      "Full coverage for surgery, chemotherapy and radiation cycles",
      "Includes breast reconstruction procedures",
      "Cashless diagnostic packages at empanelled centers"
    ],
    reliability: 94,
    description: "Ayushman Bharat provides targeted breast cancer health benefit packages, which include surgical interventions (like mastectomy), adjuvant therapies, and reconstructive plastic surgery at approved network hospitals.",
    links: [
      { label: "Ayushman Breast Cancer Packages", url: "https://www.bajajfinserv.in", type: "official" }
    ],
    requiredDocuments: [
      "Ayushman Golden Card",
      "Biopsy and pathology diagnostic reports confirming breast cancer stage",
      "Doctor's surgical/chemotherapy prescription layout",
      "Ration Card showing family listing"
    ]
  },
  {
    title: "Regional Cancer Centres (RCCs) Subsidies",
    category: "Breast Cancer Specific",
    state: "All India",
    tag: "Breast Cancer",
    tagTone: "surface-variant",
    icon: "domain_add",
    body: "Government-supported specialized cancer institutes offering subsidized breast cancer treatment under HMCPF/RAN.",
    bullets: [
      "Subsidized high-quality surgery, radiation and chemo",
      "Facilitates direct application for central funds like RAN/HMCPF",
      "State-of-the-art oncology infrastructure & specialists"
    ],
    reliability: 91,
    description: "Regional Cancer Centres are government-supported super-specialty institutes that provide subsidized cancer care, allowing low-income families to access state-of-the-art diagnostics and therapies.",
    links: [
      { label: "RCCs Information", url: "https://pib.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "RCC OPD Card",
      "Biopsy / histopathology diagnosis report",
      "Income Certificate (if seeking subsidies / RAN registration)",
      "Aadhaar Card and Local residence proof"
    ]
  },
  {
    title: "Dr. YSR Aarogyasri Health Scheme",
    category: "State Specific",
    state: "Andhra Pradesh",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cashless treatment for serious diseases including cancer at empanelled govt and private hospitals. Breast cancer surgeries and oncology packages covered.",
    bullets: [
      "100% cashless treatment in empanelled hospitals",
      "Covers breast cancer surgery & comprehensive oncology",
      "Income limit is verified via local state-issued ration cards"
    ],
    reliability: 90,
    description: "Dr. YSR Aarogyasri is the flagship health insurance scheme of Andhra Pradesh, offering high-fidelity cashless care for serious ailments including cancer therapies, surgery, and palliative care.",
    links: [
      { label: "YSR Aarogyasri Portal", url: "https://www.aarogyasri.ap.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Dr. YSR Aarogyasri Card or BPL Rice Card",
      "Aadhaar Card",
      "Doctor referral letter from empanelled hospital",
      "Cancer diagnostic reports (biopsy, imaging, etc.)"
    ]
  },
  {
    title: "Aarogyasri Health Scheme Telangana",
    category: "State Specific",
    state: "Telangana",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Major cancer treatment including breast cancer surgery, chemotherapy and radiation through empanelled hospitals.",
    bullets: [
      "Cashless care across public & private empanelled networks",
      "Comprehensive breast cancer surgery & radiation packages",
      "Fully integrated with state health authorities"
    ],
    reliability: 89,
    description: "The Aarogyasri Health Scheme in Telangana provides cashless healthcare to low-income families, ensuring they can access advanced cancer care without financial distress.",
    links: [
      { label: "Aarogyasri Telangana Portal", url: "https://www.aarogyasri.telangana.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Aarogyasri Card or Food Security Card (Ration Card)",
      "Aadhaar Card",
      "Doctor recommendation / referral slip",
      "Biopsy or medical report confirming cancer"
    ]
  },
  {
    title: "Mahatma Jyotiba Phule Jan Arogya Yojana (MJPJAY)",
    category: "State Specific",
    state: "Maharashtra",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Covers cancer hospitalization, surgeries, chemotherapy and radiation for eligible low-income families.",
    bullets: [
      "Covers breast oncology, surgeries, and chemotherapy",
      "For Yellow/Orange ration card holder families",
      "Substantial cash-free financial cover in empanelled centers"
    ],
    reliability: 88,
    description: "MJPJAY is a cashless health insurance scheme for poor families in Maharashtra. It offers comprehensive coverage for selected critical therapies, including complex cancer procedures.",
    links: [
      { label: "MJPJAY Portal", url: "https://www.jeevandayee.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Yellow or Orange Ration Card copy",
      "MJPJAY Health Card / Aadhaar Card",
      "Doctor diagnosis report and empanelled hospital referral slip",
      "Detailed pathology / biopsy reports"
    ]
  },
  {
    title: "Chief Minister Relief Fund Maharashtra",
    category: "State Specific",
    state: "Maharashtra",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial support for high-cost treatment including cancer and breast cancer surgeries.",
    bullets: [
      "One-time medical financial grant to cover bills",
      "Direct disbursement to the treating hospital",
      "Applies to critical procedures and chemotherapy"
    ],
    reliability: 80,
    description: "The CMRF Maharashtra provides immediate financial assistance to poor patients undergoing high-cost treatments for major ailments like cancer, open-heart surgery, or brain surgery.",
    links: [
      { label: "CMRF Maharashtra", url: "https://cmrf.maharashtra.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Official CMRF application form",
      "Income Certificate (family income under limits)",
      "Original hospital quotation / treatment cost estimate",
      "Treating doctor recommendation and biopsy reports",
      "Ration Card copy",
      "Aadhaar Card"
    ]
  },
  {
    title: "Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS)",
    category: "State Specific",
    state: "Tamil Nadu",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cashless oncology treatment including breast cancer diagnostics, surgery and chemotherapy.",
    bullets: [
      "Cashless diagnostic checks, surgery, and chemotherapy",
      "Smart-card based verification for quick processing",
      "Empanelled network across both state & private hospitals"
    ],
    reliability: 91,
    description: "CMCHIS in Tamil Nadu is a flagship state insurance plan that provides cashless tertiary health care, particularly focused on serious procedures including oncological services.",
    links: [
      { label: "CMCHIS Tamil Nadu Portal", url: "https://www.cmchistn.com", type: "official" }
    ],
    requiredDocuments: [
      "CMCHIS Smart Card",
      "Income Certificate (issued by Revenue Department)",
      "Aadhaar Card",
      "Treating doctor referral slip and biopsy reports"
    ]
  },
  {
    title: "Arogya Karnataka",
    category: "State Specific",
    state: "Karnataka",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Universal health coverage model including oncology and breast cancer treatment.",
    bullets: [
      "Covers primary to tertiary specialized oncology care",
      "Universal health coverage model with digital cards",
      "Available across empanelled hospitals in Karnataka"
    ],
    reliability: 87,
    description: "Arogya Karnataka aims to provide universal health coverage to residents, including cashless treatment for specified tertiary procedures for poor cardholders.",
    links: [
      { label: "Arogya Karnataka Portal", url: "https://arogya.karnataka.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Arogya Karnataka Card / PDS Card (Ration Card)",
      "Aadhaar Card",
      "Government referral letter (from taluk/district hospital to empanelled center)",
      "Biopsy oncology reports"
    ]
  },
  {
    title: "Karunya Arogya Suraksha Padhathi (KASP)",
    category: "State Specific",
    state: "Kerala",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "PMJAY-integrated scheme covering tertiary care including cancer treatment.",
    bullets: [
      "Integrated with Ayushman Bharat framework",
      "₹5 Lakh health cover per family annually",
      "Covers advanced surgeries and chemotherapy cycles"
    ],
    reliability: 90,
    description: "KASP provides cashless, comprehensive tertiary health coverage for Kerala families, integrating central and state resources to cover severe conditions like cancer.",
    links: [
      { label: "Kerala SHA / KASP Portal", url: "https://sha.kerala.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "KASP Smart Card",
      "Aadhaar Card",
      "Ration Card showing family listing in Kerala",
      "Confirmed cancer medical diagnosis and biopsy report"
    ]
  },
  {
    title: "Karunya Benevolent Fund",
    category: "State Specific",
    state: "Kerala",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial aid for costly diseases including cancer.",
    bullets: [
      "Financial grants up to ₹3 Lakh for cancer care",
      "Funded dynamically via state lottery proceeds",
      "Specifically targeted to poor & lower-middle class"
    ],
    reliability: 85,
    description: "The Karunya Benevolent Fund provides medical financial assistance to poor patients suffering from high-cost diseases, funded primarily through state lottery revenues.",
    links: [
      { label: "Karunya Fund Portal", url: "http://www.kbf.kerala.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Income Certificate (family income under ₹3 Lakh/year)",
      "Medical Certificate and cost estimate from treating doctor",
      "Ration Card / BPL card",
      "Aadhaar Card",
      "Copy of bank passbook"
    ]
  },
  {
    title: "Cancer Suraksha Scheme - Kerala (U-18)",
    category: "State Specific",
    state: "Kerala",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Free cancer treatment for children under 18 years. (myScheme)",
    bullets: [
      "100% free cancer treatments, implants and chemotherapy drugs",
      "Patient age: 18 years or below, resident of Kerala",
      "Initial expenditure limit: ₹50,000 (can be extended by committee)"
    ],
    reliability: 92,
    description: "Kerala's Cancer Suraksha Scheme provides completely free medical diagnostics, surgeries, and chemotherapy to children under the age of 18 belonging to low-income/BPL families. Treats cashlessly at RCC, Thiruvananthapuram and major medical colleges via Patient Cards.",
    links: [
      { label: "Cancer Suraksha Kerala", url: "https://www.myscheme.gov.in/schemes/css", type: "official" }
    ],
    requiredDocuments: [
      "Patient Birth Certificate (as proof of age <= 18)",
      "Kerala Residence / Domicile Certificate",
      "BPL Certificate or BPL Ration Card copy",
      "Aadhaar Card of the patient or parent",
      "Confirmed oncology diagnosis and pathology report",
      "Passport-sized photograph of the child"
    ]
  },
  {
    title: "Mukhyamantri Amrutam Yojana (MA)",
    category: "State Specific",
    state: "Gujarat",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial protection for tertiary treatments including oncology and breast cancer care.",
    bullets: [
      "Up to ₹3 Lakh cashless care cover per family",
      "Targeted for Below Poverty Line (BPL) families",
      "Covers surgery, radiation, and chemotherapy cycles"
    ],
    reliability: 89,
    description: "MA Yojana provides cashless tertiary care to poor families in Gujarat, covering surgeries, therapies, and medications in a wide empanelled network.",
    links: [
      { label: "Mukhyamantri Amrutam", url: "https://magujarat.com", type: "official" }
    ],
    requiredDocuments: [
      "MA Card",
      "BPL Ration Card showing family member registry",
      "Aadhaar Card",
      "Pathology / biopsy reports and doctor's referral"
    ]
  },
  {
    title: "MA Vatsalya Yojana",
    category: "State Specific",
    state: "Gujarat",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Expanded coverage for middle-income families requiring advanced treatment.",
    bullets: [
      "Extends MA scheme cashless benefits to middle class",
      "For families with annual income up to ₹4 Lakh",
      "Comprehensive cashless oncology care & packages"
    ],
    reliability: 88,
    description: "MA Vatsalya extends the premium cashless coverage of the MA Yojana to lower-middle-income families, shielding them from massive medical debts during cancer care.",
    links: [
      { label: "MA Gujarat", url: "https://magujarat.com", type: "official" }
    ],
    requiredDocuments: [
      "MA Vatsalya Card",
      "Income Certificate (family income under ₹4 Lakh/year)",
      "Aadhaar Card",
      "Doctor diagnosis report and biopsy results"
    ]
  },
  {
    title: "Free Medical Assistance - Gujarat",
    category: "State Specific",
    state: "Gujarat",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Free medical aid and support for cancer treatment for needy patients. (myScheme)",
    bullets: [
      "Managed by the Tribal Development Department, Govt of Gujarat",
      "Exclusively for Scheduled Tribe (ST) patients in Gujarat",
      "Covers critical illnesses: Cancer, TB, Leprosy, HIV/AIDS, Thalassemia"
    ],
    reliability: 80,
    description: "This state program ensures that patients from Scheduled Tribe backgrounds in Gujarat with family incomes of ₹6,00,000 or less receive critical medical assistance and free basic cancer care in public healthcare setups via Direct Benefit Transfer (DBT).",
    links: [
      { label: "Free Medical Assistance Gujarat Details", url: "https://www.myscheme.gov.in/schemes/fmaguj", type: "official" }
    ],
    requiredDocuments: [
      "Scheduled Tribe (ST) Certificate copy",
      "Income Certificate (showing annual family income <= ₹6,00,000)",
      "Medical Certificate from government hospital confirming cancer",
      "Aadhaar Card and bank passbook details (Aadhaar-linked)",
      "Gujarat Domicile proof",
      "Passport-sized photograph of the patient"
    ]
  },
  {
    title: "Mukhyamantri Chiranjeevi Swasthya Bima Yojana",
    category: "State Specific",
    state: "Rajasthan",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Large insurance coverage including cancer surgery, chemo and radiation in govt and private hospitals.",
    bullets: [
      "Substantial cash-free insurance cover per family",
      "Covers complex cancer surgeries, chemo & radiation",
      "Valid at public and empanelled private hospitals"
    ],
    reliability: 90,
    description: "Rajasthan's premium insurance scheme offers high-value healthcare coverage, covering major procedures and advanced oncology packages cashless.",
    links: [
      { label: "Chiranjeevi Rajasthan", url: "https://chiranjeevi.rajasthan.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Chiranjeevi Health Card or Jan Aadhaar Card",
      "Aadhaar Card",
      "Medical diagnosis reports (biopsy, histopathology)",
      "Doctor prescriptions and hospital referral details"
    ]
  },
  {
    title: "Financial Assistance for ex-Servicemen & Dependents - Rajasthan",
    category: "State Specific",
    state: "Rajasthan",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial Assistance for the Treatment of Blind, Disabled, Deaf, Dumb, or Mentally Challenged Ex-Servicemen and their Dependents (Wife and Children). (myScheme)",
    bullets: [
      "Rank limit: Havildar or below ex-servicemen, or wife/children",
      "Monthly financial aid of ₹1,000 to ₹3,000 (based on 40%+ disability)",
      "Limited to a maximum of 300 active beneficiaries at a time"
    ],
    reliability: 84,
    description: "Implemented by the Department of Sainik Welfare, Government of Rajasthan. It provides monthly financial assistance (₹1,000 for 40-60% disability, ₹2,000 for 60-80% disability, and ₹3,000 for 80%+ disability) for 3 years to ex-servicemen of the rank of Havildar or below and their dependents who suffer from specified severe disabilities/illnesses.",
    links: [
      { label: "Ex-Servicemen Medical Grant Rajasthan", url: "https://www.myscheme.gov.in/schemes/faafbdmmresf", type: "official" }
    ],
    requiredDocuments: [
      "Ex-Servicemen Discharge Book copy",
      "Sainik Welfare identity card (ex-servicemen/widow)",
      "Rajasthan Domicile/Residence proof Certificate",
      "Government Medical Board Disability Certificate (showing 40%+ disability)",
      "Bank account passbook details copy",
      "Aadhaar Card copy"
    ]
  },
  {
    title: "Biju Swasthya Kalyan Yojana (BSKY)",
    category: "State Specific",
    state: "Odisha",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cashless hospitalization including oncology treatment.",
    bullets: [
      "Cashless treatment up to ₹5 Lakh (₹10 Lakh for women)",
      "Smart-card based seamless empanelled network",
      "Covers diagnostics, major surgeries & chemotherapy"
    ],
    reliability: 92,
    description: "BSKY is the premier cashless healthcare scheme of Odisha, providing high health assurance cover with an emphasis on female beneficiaries, who get up to ₹10 Lakh in tertiary care coverage.",
    links: [
      { label: "BSKY Odisha", url: "https://bsky.odisha.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "BSKY Smart Card or Ration Card (NFSA/SFSA)",
      "Aadhaar Card of the patient",
      "Confirmed medical cancer diagnosis and biopsy report",
      "Empanelled hospital consultation book"
    ]
  },
  {
    title: "Odisha Free Chemotherapy Programme",
    category: "State Specific",
    state: "Odisha",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Free chemotherapy at district hospitals.",
    bullets: [
      "Free chemotherapy drug administration",
      "Situated at local District Headquarters Hospitals",
      "Subsidizes primary cancer treatment costs"
    ],
    reliability: 85,
    description: "This pioneering state program provides free chemotherapy drugs and administration facilities at district levels, removing travel and medication burdens.",
    links: [
      { label: "Odisha Health Department", url: "https://health.odisha.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Aadhaar Card / local residence proof of Odisha",
      "Doctor's chemotherapy prescription layout",
      "Diagnostic report confirming cancer (biopsy)",
      "Registration card at District Headquarters Hospital"
    ]
  },
  {
    title: "Swasthya Sathi",
    category: "State Specific",
    state: "West Bengal",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Smart-card based cashless health scheme covering cancer treatment.",
    bullets: [
      "Cashless treatment up to ₹5 Lakh per family per year",
      "Entire family covered under a single smart card",
      "Includes complex surgeries, chemo & radiation"
    ],
    reliability: 88,
    description: "Swasthya Sathi is a premium smart-card-based cashless health insurance scheme in West Bengal, providing families with full coverage for critical secondary and tertiary care.",
    links: [
      { label: "Swasthya Sathi Portal", url: "https://swasthyasathi.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Swasthya Sathi Smart Card",
      "Aadhaar Card of the patient",
      "Ration Card copy",
      "Confirmed cancer diagnosis and oncologist prescription"
    ]
  },
  {
    title: "Medical Expenses for Treatment of Major Ailments Including Surgery - West Bengal",
    category: "State Specific",
    state: "West Bengal",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial assistance for medical expenses and major surgeries including oncology. (myScheme)",
    bullets: [
      "For registered West Bengal BOCW construction workers",
      "Ailments covered: Cancer, Heart, Kidney, TB, Leprosy",
      "Grant: up to ₹20,000/yr for medicine; up to ₹60,000 for surgeries"
    ],
    reliability: 81,
    description: "Administered by the Building and Other Construction Workers (BOCW) Welfare Board, Government of West Bengal. It provides registered construction workers (aged 18 to 60 with 90+ days work in previous year) and their dependents with financial assistance to cover medical expenses and major surgeries.",
    links: [
      { label: "Medical Expenses West Bengal Details", url: "https://www.myscheme.gov.in/schemes/metfmaiswb", type: "official" }
    ],
    requiredDocuments: [
      "Active West Bengal BOCW Registration Card",
      "Prescribed Form-XI Application Form",
      "Medical Certificate and diagnosis from treating oncologist",
      "Original bills, hospital prescriptions and invoice receipts",
      "Aadhaar Card and West Bengal Domicile proof",
      "Copy of bank passbook details"
    ]
  },
  {
    title: "Transport Workers’ Social Security: Medical Benefit for Major Ailments - West Bengal",
    category: "State Specific",
    state: "West Bengal",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Medical Benefit for Major Ailments for Transport Workers and family. (myScheme)",
    bullets: [
      "For registered unorganized transport workers (aged 18-60)",
      "Covers: Cancer, TB, cardiac problems, kidney malfunction, AIDS",
      "Up to ₹20,000/yr for treatment, up to ₹60,000 for major surgeries"
    ],
    reliability: 83,
    description: "A welfare initiative under the Labour Department, Government of West Bengal, providing transport workers (operating taxis, autos, buses, trucks) and their families with social security benefits and medical grants to cover high-cost cancer and critical surgery bills.",
    links: [
      { label: "Transport Workers Benefit West Bengal Details", url: "https://www.myscheme.gov.in/schemes/wbtwsmbma", type: "official" }
    ],
    requiredDocuments: [
      "Unorganized Transport Worker registration card/proof",
      "Online application submitted via eDistrict 2.0 portal",
      "Age proof (showing age between 18 and 60 years)",
      "Identity and Domicile proof (Aadhaar / Voter ID)",
      "Medical bills, doctor prescriptions, and oncology reports",
      "Copy of bank passbook details"
    ]
  },
  {
    title: "Delhi Arogya Kosh",
    category: "State Specific",
    state: "Delhi",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial aid for expensive illnesses including cancer for poor patients.",
    bullets: [
      "Covers specialized high-cost oncology surgeries",
      "Treatment in empanelled or referral state hospitals",
      "Targeted to Delhi residents with specific income ceilings"
    ],
    reliability: 85,
    description: "Delhi Arogya Kosh provides financial assistance to eligible patients for treatment of illnesses, diagnostics, and surgeries in government or empanelled hospitals.",
    links: [
      { label: "Delhi Health Department", url: "https://health.delhi.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Delhi Residence Proof (voter card/Aadhaar/electricity bill)",
      "Income Certificate (family income under limits)",
      "Prescribed DAK application form signed by treating doctor",
      "Original diagnostic reports and surgery estimation booklet",
      "Aadhaar Card"
    ]
  },
  {
    title: "Chirayu Ayushman Haryana",
    category: "State Specific",
    state: "Haryana",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Haryana extension of Ayushman Bharat covering cancer hospitalization and treatment.",
    bullets: [
      "State-led expansion of PM-JAY coverage",
      "₹5 Lakh comprehensive cover per family",
      "Valid for low and middle-income families"
    ],
    reliability: 89,
    description: "Chirayu Ayushman Haryana extends cashless coverage to families with moderate incomes, protecting thousands from large hospital bills during active cancer treatments.",
    links: [
      { label: "Ayushman Haryana", url: "https://ayushmanharyana.in", type: "official" }
    ],
    requiredDocuments: [
      "Chirayu Ayushman Card",
      "Aadhaar Card",
      "Haryana Domicile Certificate",
      "Parivar Pehchan Patra (PPP / Family ID card)"
    ]
  },
  {
    title: "Financial Assistance for Treatment of Chronic Diseases (HBOCWWB) - Haryana",
    category: "State Specific",
    state: "Haryana",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial assistance for workers and registered builders suffering from chronic diseases like cancer. (myScheme)",
    bullets: [
      "For construction workers registered under Haryana HBOCWWB",
      "Financial assistance up to ₹1,00,000 for indoor treatment",
      "Requires minimum of 1 year Board membership; domiciled in Haryana"
    ],
    reliability: 83,
    description: "The Haryana Building and Other Construction Workers Welfare Board (HBOCWWB) provides direct financial assistance of up to ₹1,00,000 to registered construction workers for indoor hospitalization and treatment of serious chronic diseases like Cancer, Tuberculosis (TB), or AIDS. OPD treatments are not covered.",
    links: [
      { label: "HBOCWWB Haryana Details", url: "http://myscheme.gov.in/schemes/fatcdhbocwwb", type: "official" }
    ],
    requiredDocuments: [
      "Active Haryana BOCW registration card (showing 1+ yr Board membership)",
      "Antyodaya-SARAL Portal online application receipt",
      "Medical Certificate from treating hospital confirming indoor treatment",
      "Original hospital bills, medicine invoices, and diagnostic reports",
      "Haryana Domicile/Residence proof certificate",
      "Aadhaar Card copy",
      "Copy of bank passbook passdetails",
      "Work slip and recent passport-size photograph"
    ]
  },
  {
    title: "Sarbat Sehat Bima Yojana",
    category: "State Specific",
    state: "Punjab",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cashless treatment including oncology and major surgeries.",
    bullets: [
      "₹5 Lakh comprehensive cashless coverage",
      "Valid for secondary and tertiary care hospitalization",
      "Covers major cancer surgeries and therapies"
    ],
    reliability: 87,
    description: "Punjab's flagship state health insurance covers major ailments, including comprehensive cancer therapies, at empanelled public and private medical facilities.",
    links: [
      { label: "Punjab Health Insurance", url: "https://www.sha.punjab.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "SSBY Card or Ration Card copy",
      "Aadhaar Card",
      "Punjab Residence proof",
      "Doctor diagnostic recommendation and oncology reports"
    ]
  },
  {
    title: "Mukh Mantri Punjab Cancer Rahat Kosh Scheme",
    category: "State Specific",
    state: "Punjab",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Direct financial relief for cancer patients.",
    bullets: [
      "Up to ₹1.5 Lakh direct medical assistance",
      "Paid directly to the hospital for cancer care",
      "Valid at recognized regional cancer institutes"
    ],
    reliability: 90,
    description: "This scheme provides direct financial relief of up to ₹1.5 Lakh to Punjab residents suffering from cancer, covering medicines, chemotherapy, and surgeries.",
    links: [
      { label: "Punjab Health Dept", url: "https://health.punjab.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Prescribed application form completed by doctor",
      "Income Certificate (under limits)",
      "Original cost estimate from empanelled hospital",
      "Biopsy pathology report confirming cancer",
      "Aadhaar Card and Domicile proof",
      "Passport-sized photograph"
    ]
  },
  {
    title: "HIMCARE Scheme",
    category: "State Specific",
    state: "Himachal Pradesh",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cashless hospitalization including cancer care.",
    bullets: [
      "₹5 Lakh cashless health cover per family",
      "Covers families not eligible under national PM-JAY",
      "Empanelled private & public hospital treatments"
    ],
    reliability: 88,
    description: "HIMCARE is the Himachal Pradesh state health card scheme, offering cashless treatment for selected critical illnesses, including oncology services.",
    links: [
      { label: "HIMCARE", url: "https://www.hpsbys.in", type: "official" }
    ],
    requiredDocuments: [
      "HIMCARE Card",
      "Himachal Pradesh Ration Card",
      "Aadhaar Card of the patient",
      "Biopsy / medical diagnosis reports"
    ]
  },
  {
    title: "Mukhya Mantri Sahara Yojana - Himachal Pradesh",
    category: "State Specific",
    state: "Himachal Pradesh",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial assistance for patients suffering from chronic diseases like cancer. (myScheme)",
    bullets: [
      "Monthly financial assistance of ₹3,000",
      "HP resident, EWS (family income below ₹4 Lakh per year)",
      "Covers chronic conditions: Malignant Cancer, Paralysis, Hemophilia, Muscular Dystrophy, Thalassemia, Renal Failure"
    ],
    reliability: 86,
    description: "A flagship social welfare scheme by the Government of Himachal Pradesh providing ₹3,000 per month financial aid to permanent HP residents from Economically Weaker Sections suffering from specified terminal or incapacitating illnesses. Applicants must not receive other government-sponsored pensions. Applications processed via sahara.hpsbys.in.",
    links: [
      { label: "Mukhya Mantri Sahara Yojana", url: "https://www.myscheme.gov.in/schemes/mmsy", type: "official" }
    ],
    requiredDocuments: [
      "Aadhaar Card copy",
      "Himachal Pradesh Permanent Residence Certificate",
      "Income Certificate (verifying annual family income < ₹4,00,000 issued by Tehsildar/SDM)",
      "Medical Certificate / diagnosis report from Government Hospital confirming chronic disease",
      "Bank account passbook details copy (Aadhaar-linked for DBT)",
      "Declaration stating non-receipt of other government pensions",
      "Recent passport-size photograph"
    ]
  },
  {
    title: "AB-PMJAY SEHAT Scheme",
    category: "State Specific",
    state: "Jammu & Kashmir",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Universal insurance coverage for residents including oncology packages.",
    bullets: [
      "Universal health insurance for all J&K residents",
      "₹5 Lakh comprehensive cashless cover per family",
      "Covers full cancer surgeries & chemotherapy"
    ],
    reliability: 91,
    description: "SEHAT scheme provides universal health insurance to all residents of Jammu and Kashmir. The benefits are similar to PM-JAY, offering comprehensive cashless cancer treatments.",
    links: [
      { label: "SEHAT J&K", url: "https://abpmjay.jk.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "SEHAT J&K Card / Golden Card",
      "Ration Card showing residency in Jammu & Kashmir",
      "Aadhaar Card",
      "Cancer diagnostic reports (biopsy, imaging)"
    ]
  },
  {
    title: "Mukhyamantri Jan Arogya Abhiyan",
    category: "State Specific",
    state: "Uttar Pradesh",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "State-linked insurance model supporting advanced treatment including cancer.",
    bullets: [
      "State-funded insurance for families left out of PM-JAY",
      "₹5 Lakh cashless hospitalization cover",
      "Empanelled network of public & private providers"
    ],
    reliability: 86,
    description: "This UP state scheme ensures that left-out underprivileged families receive identical cashless benefits to Ayushman Bharat, covering major oncological surgeries.",
    links: [
      { label: "UP SHA", url: "https://uphealth.up.nic.in", type: "official" }
    ],
    requiredDocuments: [
      "Jan Arogya Card",
      "Aadhaar Card",
      "UP Ration Card copy",
      "Biopsy pathology reports confirming cancer stage"
    ]
  },
  {
    title: "CM Relief Fund Uttar Pradesh",
    category: "State Specific",
    state: "Uttar Pradesh",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial assistance for serious illnesses including cancer.",
    bullets: [
      "Medical grant disbursed based on hospital quotation",
      "Requires application along with income certificates",
      "Direct payment to the treating empanelled hospital"
    ],
    reliability: 78,
    description: "The UP CM Relief Fund provides financial help to poor patients suffering from chronic and severe diseases, assisting them in paying for costly diagnostic tests or surgeries.",
    links: [
      { label: "UP CM Relief Fund", url: "http://upcmrelieffund.up.nic.in", type: "official" }
    ],
    requiredDocuments: [
      "UP CM Relief Fund application form",
      "Income Certificate (family income under limits)",
      "Treating hospital cost estimation / invoice receipt",
      "Treating doctor recommendation and pathology report",
      "UP Domicile certificate and Aadhaar Card"
    ]
  },
  {
    title: "Ayushman Madhya Pradesh",
    category: "State Specific",
    state: "Madhya Pradesh",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cancer and tertiary-care packages under Ayushman framework.",
    bullets: [
      "Comprehensive oncology package coverage",
      "Cashless access with zero paper documentation",
      "Wide state-wide empanelled network"
    ],
    reliability: 89,
    description: "This initiative implements Ayushman Bharat packages in MP, helping thousands of families access cashless cancer surgeries, radiation and drug cycles.",
    links: [
      { label: "Ayushman MP", url: "https://ayushmanup.in", type: "official" }
    ],
    requiredDocuments: [
      "Ayushman MP Card / Golden Card",
      "Aadhaar Card",
      "MP Ration Card copy",
      "Biopsy pathology reports confirming cancer"
    ]
  },
  {
    title: "Dr. Khoobchand Baghel Swasthya Sahayata Yojana",
    category: "State Specific",
    state: "Chhattisgarh",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cashless healthcare including cancer treatment.",
    bullets: [
      "Unified health insurance scheme in Chhattisgarh",
      "Up to ₹5 Lakh cashless coverage",
      "Includes major chemotherapy and cancer surgeries"
    ],
    reliability: 87,
    description: "This state-led unified healthcare scheme provides comprehensive health coverage and cashless oncological care to the registered beneficiaries in Chhattisgarh.",
    links: [
      { label: "Chhattisgarh SHA", url: "https://dkbssy.cg.nic.in", type: "official" }
    ],
    requiredDocuments: [
      "Ration Card (Priority or Antyodaya)",
      "Aadhaar Card of the patient",
      "Medical prescriptions and biopsy reports",
      "Empanelled hospital treatment registration slip"
    ]
  },
  {
    title: "Bihar Ayushman Bharat Scheme",
    category: "State Specific",
    state: "Bihar",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cancer care through Ayushman-linked empanelled hospitals.",
    bullets: [
      "Ayushman-linked cashless oncology procedures",
      "Valid at public medical colleges & private empanelled hospitals",
      "₹5 Lakh cover per family"
    ],
    reliability: 85,
    description: "Bihar's state program rolls out PM-JAY health cards and cashless cancer treatment packages, making advanced therapies affordable for underprivileged families.",
    links: [
      { label: "Bihar SHA", url: "https://biharhealth.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Ayushman Golden Card",
      "Bihar Ration Card",
      "Aadhaar Card",
      "Oncology diagnostic reports confirming cancer"
    ]
  },
  {
    title: "Atal Amrit Abhiyan",
    category: "State Specific",
    state: "Assam",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial protection for high-cost diseases including cancer.",
    bullets: [
      "Cashless treatment up to ₹2 Lakh per family",
      "Covers specialty therapies, including oncology & chemo",
      "For low and middle-income families in Assam"
    ],
    reliability: 89,
    description: "Atal Amrit Abhiyan is a high-value health card scheme in Assam, focused on providing cashless treatment for critical diseases including cancer, cardiovascular diseases, and burns.",
    links: [
      { label: "Atal Amrit Abhiyan", url: "https://aaa-assam.in", type: "official" }
    ],
    requiredDocuments: [
      "Atal Amrit Card",
      "Income Certificate (family income under ₹1.2 Lakh/year)",
      "Aadhaar Card and Assam Domicile proof",
      "Oncologist diagnosis prescription and biopsy reports"
    ]
  },
  {
    title: "Grants To Patients Suffering From TB, Cancer & Major Diseases - Assam",
    category: "State Specific",
    state: "Assam",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial grants for patients suffering from tuberculosis, cancer, or other major diseases. (myScheme)",
    bullets: [
      "Tea Tribes and Adivasi Welfare Department initiative",
      "One-time financial grant for oncology treatment",
      "Assam resident, Tea Tribes/Adivasi community, family income under ₹5 Lakh"
    ],
    reliability: 82,
    description: "Provides one-time financial assistance to patients from the Tea Tribes and Adivasi community of Assam undergoing treatment for serious health conditions like TB, Cancer, or major surgeries. Not available to state government service holders. Applications processed online via sirishassam.in.",
    links: [
      { label: "Assam Major Diseases Details", url: "https://www.myscheme.gov.in/schemes/gpstbcomd", type: "official" }
    ],
    requiredDocuments: [
      "Tea Tribes / Adivasi Community Caste Certificate",
      "Income Certificate showing annual family income under ₹5,00,000",
      "Medical Certificate and treatment prescription from treating doctor",
      "Aadhaar Card and Assam Domicile/Residence proof",
      "Non-Government Employee declaration certificate",
      "Copy of bank passbook details (linked to Aadhaar)"
    ]
  },
  {
    title: "Grants In Aid To SC/ST Patients with Cancer - Assam",
    category: "State Specific",
    state: "Assam",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Specific grants-in-aid to SC/ST category patients suffering from cancer and other malignant diseases. (myScheme)",
    bullets: [
      "One-time fixed financial grant of ₹50,000",
      "Targeted exclusively for SC or ST community patients in Assam",
      "Helps poor patients cover drug costs & minor surgeries"
    ],
    reliability: 84,
    description: "Administered by the Welfare of Plain Tribes and Backward Classes Department, Government of Assam. It provides a one-time fixed financial grant of ₹50,000 to poor SC/ST patients suffering from cancer, TB, or other malignant diseases who are unable to afford treatment costs. Preference is given to widows, elderly, or BPL families.",
    links: [
      { label: "Assam SC/ST Cancer Details", url: "https://www.myscheme.gov.in/schemes/gascstpsfcad", type: "official" }
    ],
    requiredDocuments: [
      "SC or ST Caste Certificate copy (issued by Assam competent authority)",
      "Medical Certificate confirming cancer / malignant disease from RCC / Government Hospital",
      "Income Certificate / BPL ration card (proving poor status)",
      "Aadhaar Card and Domicile proof",
      "Copy of bank passbook details",
      "Recent passport-size photograph"
    ]
  },
  {
    title: "Medical Assistance (A.B.O.C.W.W.B) - Assam",
    category: "State Specific",
    state: "Assam",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Medical Assistance for Registered Construction Workers under building and other construction board. (myScheme)",
    bullets: [
      "Assistance up to ₹1,50,000 for critical illnesses (Cancer, bypass)",
      "Hospitalization: ₹1,000/day for first 5 days, ₹200/day after (max ₹20,000)",
      "Assam resident, active registered builder with A.B.O.C.W.W.B"
    ],
    reliability: 82,
    description: "Provides comprehensive financial support to registered building and construction workers in Assam. It covers up to ₹1,50,000 for treatments of critical diseases such as cancer, heart bypass surgery, kidney transplantation, and liver cirrhosis, alongside inpatient daily cash benefits during hospital stays.",
    links: [
      { label: "Assam ABOCWWB Details", url: "https://www.myscheme.gov.in/schemes/ma-abocwwb", type: "official" }
    ],
    requiredDocuments: [
      "Active Assam BOCW Construction Worker Registration Card copy",
      "Prescribed application form submitted via abocwwb.assam.gov.in",
      "Original medical bills, prescriptions, and discharge summary",
      "Medical oncology certificate confirming critical illness/surgery details",
      "Aadhaar Card and Assam Domicile proof",
      "Employer work certificate / active work slip",
      "Copy of bank passbook details"
    ]
  },
  {
    title: "Deen Dayal Swasthya Seva Yojana (DDSSY)",
    category: "State Specific",
    state: "Goa",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cashless hospitalization including cancer treatment.",
    bullets: [
      "Up to ₹4 Lakh cashless cover for tertiary care",
      "Universal scheme for 5+ years Goan residents",
      "Includes oncology packages, surgeries & drugs"
    ],
    reliability: 90,
    description: "DDSSY is Goa's flagship health insurance card scheme, covering secondary and tertiary treatments, including comprehensive cancer care, for all Goan residents.",
    links: [
      { label: "DDSSY Goa", url: "https://www.ddssygoa.in", type: "official" }
    ],
    requiredDocuments: [
      "DDSSY Card",
      "Goa Domicile Proof (residing in Goa for 5+ years)",
      "Aadhaar Card",
      "Oncologist diagnosis layout and empanelled hospital consultation sheet"
    ]
  },
  {
    title: "Atal Ayushman Uttarakhand Yojana",
    category: "State Specific",
    state: "Uttarakhand",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "State health insurance including oncology procedures.",
    bullets: [
      "Universal cashless coverage across Uttarakhand",
      "₹5 Lakh comprehensive cover per family",
      "Includes standard oncology surgeries & drug therapies"
    ],
    reliability: 89,
    description: "Uttarakhand's premium state scheme provides health insurance for residents, ensuring low-income families get cashless oncology therapies at empanelled centres.",
    links: [
      { label: "Atal Ayushman Uttarakhand", url: "https://ayushmanuttarakhand.in", type: "official" }
    ],
    requiredDocuments: [
      "Atal Ayushman Uttarakhand Card",
      "Uttarakhand Ration Card / Family Register copy",
      "Aadhaar Card",
      "Biopsy cancer diagnostics reports"
    ]
  },
  {
    title: "Cancer Day Care Centre (CDCC) Uttarakhand",
    category: "State Specific",
    state: "Uttarakhand",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Free screening for common cancers is conducted across Uttarakhand to detect cancer at an early stage. (myScheme)",
    bullets: [
      "Free community screening for oral, breast, and cervical cancers",
      "Daycare chemotherapy and pain management at district hospitals",
      "Centers established across all 13 districts of Uttarakhand"
    ],
    reliability: 86,
    description: "Implemented by the Department of Medical Health and Family Welfare, Government of Uttarakhand. It aims to ensure early cancer detection and timely treatment. All cancer patients residing in Uttarakhand can access chemotherapy, pain management, and follow-up care offline at designated district hospitals.",
    links: [
      { label: "CDCC Uttarakhand Details", url: "https://www.myscheme.gov.in/schemes/cdccuk", type: "official" }
    ],
    requiredDocuments: [
      "Uttarakhand Domicile / Residence Proof Certificate",
      "Medical Diagnosis / Oncologist referral booklet",
      "District Hospital OPD Registration Card",
      "Aadhaar Card copy"
    ]
  },
  {
    title: "Mukhyamantri Gambhir Bimari Yojana",
    category: "State Specific",
    state: "Jharkhand",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Financial support for life-threatening diseases including cancer.",
    bullets: [
      "Direct medical assistance for critical illnesses",
      "Covers cancer treatment & major surgeries",
      "Valid at recognized public and private empanelled hospitals"
    ],
    reliability: 85,
    description: "Jharkhand's critical illness scheme provides substantial financial assistance to low-income families suffering from severe diseases like cancer or kidney failure.",
    links: [
      { label: "Jharkhand Health Dept", url: "https://health.jharkhand.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Income Certificate (showing low family income)",
      "Medical Certificate and cost estimate from government oncologist",
      "Jharkhand Domicile / Residence Proof",
      "Aadhaar Card and BPL Ration card",
      "Passport-sized photograph"
    ]
  },
  {
    title: "Chikitsa Pratipoorti Yojana - Jharkhand",
    category: "State Specific",
    state: "Jharkhand",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Medical reimbursement scheme for treatments of serious illnesses including cancer. (myScheme)",
    bullets: [
      "100% state-sponsored medical assistance scheme",
      "For registered construction workers under JBOCWW Board aged 18+",
      "Covers: Cancer, heart/kidney surgeries, mental illness, AIDS, organ transplant"
    ],
    reliability: 82,
    description: "Implemented by the Department of Labour, Employment, Training & Skill Development, Government of Jharkhand. It provides registered construction workers engaged in building activities with financial assistance for the treatment of serious chronic illnesses. Applications are processed 100% online via the Shramadhan portal for ₹0.",
    links: [
      { label: "Chikitsa Pratipoorti details", url: "https://www.myscheme.gov.in/schemes/cpy", type: "official" }
    ],
    requiredDocuments: [
      "Jharkhand Building & Other Construction Worker Welfare Board registration card copy",
      "Online application submitted via Jharkhand Shramadhan portal",
      "Medical oncologist certificate and pathology report confirming illness",
      "Original treatment bills, prescriptions, and pharmacy invoices",
      "Jharkhand Domicile certificate copy",
      "Age proof (18 years or older)",
      "Aadhaar Card and copy of bank passbook details"
    ]
  },
  {
    title: "Chief Minister's Arogya Arunachal Yojana (CMAAY)",
    category: "State Specific",
    state: "Arunachal Pradesh",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Health assurance including cancer care.",
    bullets: [
      "₹5 Lakh cashless health cover per family",
      "Covers secondary/tertiary cancer hospitalizations",
      "Valid across state and empanelled specialty networks"
    ],
    reliability: 86,
    description: "CMAAY provides cashless assurance to low-income residents of Arunachal Pradesh, helping them cover oncology and complex surgical procedures.",
    links: [
      { label: "CMAAY Portal", url: "https://www.cmaay.com", type: "official" }
    ],
    requiredDocuments: [
      "CMAAY Card / Golden Card",
      "Arunachal Pradesh ST Certificate or Domicile proof",
      "Aadhaar Card",
      "Cancer diagnostic reports (biopsy)"
    ]
  },
  {
    title: "Chief Minister’s Free Cancer Chemotherapy Scheme (CMFCCS) - Arunachal Pradesh",
    category: "State Specific",
    state: "Arunachal Pradesh",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Free chemotherapy at selected state hospitals up to ₹10 Lakh per patient per year. (myScheme)",
    bullets: [
      "Provides free commonly used chemotherapy medicines",
      "Coverage limit: up to ₹10 Lakh per patient per year (₹5 Lakh per 6 months)",
      "Arunachal resident, AP Scheduled Tribe (APST) members, or state employees/dependents"
    ],
    reliability: 90,
    description: "Launched on August 1, 2017, by the Department of Health & Family Welfare, Government of Arunachal Pradesh. It provides free chemotherapy medicines and oncologist consultations up to ₹10 Lakh annually. Benefits are accessible at State Tertiary Cancer Centres (such as Tomo Riba Institute of Health & Medical Sciences - TRIHMS, Naharlagun) after verification by the scheme's Nodal Officer.",
    links: [
      { label: "Arunachal Free Chemo details", url: "https://www.myscheme.gov.in/schemes/cmfccs", type: "official" }
    ],
    requiredDocuments: [
      "Arunachal Pradesh Scheduled Tribe (APST) Certificate copy",
      "Aadhaar Card or Voter ID card",
      "Relevant residency documentation (Domicile proof)",
      "Medical records, oncologist prescriptions and drug schedule from TRIHMS",
      "Arunachal State Government employee/dependent book copy (if applicable)",
      "Two recent passport-size photographs"
    ]
  },
  {
    title: "Chief Minister-gi Hakshelgi Tengbang (CMHT)",
    category: "State Specific",
    state: "Manipur",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Hospitalization support for secondary and tertiary care for poor families including cancer treatment.",
    bullets: [
      "Up to ₹2 Lakh cashless health cover per family",
      "Direct smart-card based hospital check-ins",
      "Covers critical cancer diagnostics & surgeries"
    ],
    reliability: 88,
    description: "CMHT is Manipur's flagship healthcare scheme, designed to protect BPL and vulnerable families from the devastating costs of critical surgeries and therapies.",
    links: [
      { label: "CMHT Manipur", url: "https://www.cmhtmanipur.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "CMHT Smart Card",
      "Income Certificate / BPL status proof",
      "Aadhaar Card",
      "Doctor diagnostic recommendation and oncology reports"
    ]
  },
  {
    title: "Medical Expenses for Treatment of Major Ailments of a Beneficiary - Manipur",
    category: "State Specific",
    state: "Manipur",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Medical Expenses for Treatment of Major Ailments of a Beneficiary registered under BOCW. (myScheme)",
    bullets: [
      "For registered construction workers under Manipur MBOCWWB & family",
      "Covers: Cancer, Tuberculosis, Heart/Kidney/Eye/Leprosy/Nerve Diseases",
      "Grant: up to ₹45,000 for major surgeries, ₹2,000/yr for minor treatments"
    ],
    reliability: 80,
    description: "Implemented by the Manipur Building and Other Construction Workers' Welfare Board (MBOCWWB). It provides registered building and construction workers and their immediate family members (spouse & children) with financial assistance to cover medical expenses and major operations at public or recognized private oncology settings.",
    links: [
      { label: "Manipur BOCW details", url: "https://www.myscheme.gov.in/schemes/metmab", type: "official" }
    ],
    requiredDocuments: [
      "Manipur BOCW Labour Card copy",
      "Prescribed application form submitted directly to MBOCWWB",
      "Relevant medical bills, doctor prescriptions, and hospital discharge summary",
      "Oncology medical report and biopsy diagnosis",
      "Manipur Residence Proof and Aadhaar Card copy",
      "Copy of bank passbook details"
    ]
  },
  {
    title: "Meghalaya Health Insurance Scheme (MHIS)",
    category: "State Specific",
    state: "Meghalaya",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cashless treatment for secondary and tertiary care in empanelled hospitals.",
    bullets: [
      "₹5.3 Lakh health cover per family per year",
      "Integrated with PM-JAY for seamless state top-ups",
      "Covers major cancer surgeries and oncology packages"
    ],
    reliability: 89,
    description: "MHIS in Meghalaya provides comprehensive health assurance, covering critical treatments cashless for the vast majority of state residents.",
    links: [
      { label: "MHIS Meghalaya", url: "https://www.mhis.org.in", type: "official" }
    ],
    requiredDocuments: [
      "MHIS Smart Card",
      "Aadhaar Card",
      "Meghalaya Ration Card copy",
      "Confirmed cancer diagnosis and biopsy report"
    ]
  },
  {
    title: "State Illness Assistance - Mizoram",
    category: "State Specific",
    state: "Mizoram",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cancer aid and medical grant for poor patients receiving treatment in government hospitals.",
    bullets: [
      "Financial assistance and direct illness grants",
      "Aims to cover critical cancer treatment expenses",
      "Targeted to Below Poverty Line (BPL) families"
    ],
    reliability: 83,
    description: "This Mizoram welfare scheme provides direct cash grants or hospital invoice clearings for BPL families undergoing severe cancer care in government setups.",
    links: [
      { label: "Mizoram Health Grants Details", url: "https://health.mizoram.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Income Certificate (proving BPL status)",
      "Hospital quotation / treatment cost estimate signed by doctor",
      "Mizoram Domicile / Residence Proof",
      "Aadhaar Card and BPL Ration card copy",
      "Copy of bank passbook details"
    ]
  },
  {
    title: "Chief Minister's Health Insurance Scheme (CMHIS) - Nagaland",
    category: "State Specific",
    state: "Nagaland",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Universal health insurance for Nagaland residents covering advanced oncology.",
    bullets: [
      "₹5 Lakh comprehensive cashless cover per family",
      "Universal scheme covering almost all state residents",
      "Covers major cancer surgeries and chemotherapy packages"
    ],
    reliability: 87,
    description: "CMHIS Nagaland provides universal health coverage, allowing residents to access critical tertiary care cashless, including intensive cancer surgery and radiation therapies.",
    links: [
      { label: "CMHIS Nagaland", url: "https://cmhis.nagaland.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "CMHIS Card / Nagaland Golden Card",
      "Indigenous Inhabitant of Nagaland Certificate (IINC) or Domicile proof",
      "Aadhaar Card",
      "Biopsy cancer reports and oncologist referral letter"
    ]
  },
  {
    title: "Sikkim State Illness Assistance Scheme",
    category: "State Specific",
    state: "Sikkim",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Medical grants for poor patients suffering from serious illnesses like cancer.",
    bullets: [
      "One-time medical assistance and grants",
      "Assistance for treatments in approved settings",
      "Special provisions for low-income residents"
    ],
    reliability: 82,
    description: "This scheme provides crucial financial support for treatments and surgeries of serious illnesses for BPL residents in Sikkim, helping clear hospital bills.",
    links: [
      { label: "Sikkim Health Department", url: "https://sikkimhealth.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Income Certificate verifying BPL status",
      "Government Medical Officer detailed diagnosis and cost estimate",
      "Sikkim Domicile / Residence certificate copy",
      "Aadhaar Card and bank passbook details copy"
    ]
  },
  {
    title: "Tripura PMJAY & State Programs",
    category: "State Specific",
    state: "Tripura",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Cancer treatment support through Ayushman Bharat state top-up and local cancer center programs.",
    bullets: [
      "Cashless treatment integrated with PM-JAY",
      "Tripura Regional Cancer Centre medical concessions",
      "Support for cancer diagnostics & chemotherapy drugs"
    ],
    reliability: 86,
    description: "Tripura integrates the national PM-JAY cards with state-level medical subsidies to ensure residents get subsidized or free cancer treatments at major state oncology facilities.",
    links: [
      { label: "Tripura Health Insurance Details", url: "https://health.tripura.gov.in", type: "official" }
    ],
    requiredDocuments: [
      "Ayushman Golden Card",
      "Tripura Ration Card / Permanent Resident Certificate (PRTC)",
      "Aadhaar Card",
      "Doctor diagnostic referral sheet from Agartala Regional Cancer Centre"
    ]
  },
  {
    title: "Pension Scheme for Cancer Patients - Tripura",
    category: "State Specific",
    state: "Tripura",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "location_on",
    body: "Monthly pension of 2,000 rupees for cancer patients from low-income groups. (myScheme)",
    bullets: [
      "Provides monthly financial pension of ₹2,000",
      "Tripura resident, annual income must not exceed ₹1,50,000",
      "No member of applicant's family should be in government service"
    ],
    reliability: 88,
    description: "Launched by the Directorate of Social Welfare and Social Education, Government of Tripura. It provides crucial monthly pension support of ₹2,000 directly to the patient's bank account to help cover diagnostic fees and regular transport costs to the hospital. Applications must be submitted offline to the Child Development Project Officer (CDPO) or the Help Desk at the Atal Bihari Vajpayee Regional Cancer Centre (AVBRCC) in Agartala.",
    links: [
      { label: "Tripura Cancer Pension Details", url: "https://www.myscheme.gov.in/schemes/pscp", type: "official" }
    ],
    requiredDocuments: [
      "Permanent Resident of Tripura Certificate (PRTC) / Voter ID / Aadhaar",
      "Income Certificate (showing annual family income <= ₹1,50,000, issued by SDM or DCM)",
      "Medical Certificate confirming cancer from Agartala Regional Cancer Center / Govt Hospital",
      "Non-Government Employee declaration certificate (from a Gazetted Officer)",
      "Copy of bank passbook details (Aadhaar-linked for pension deposits)",
      "Recent passport-sized photograph"
    ]
  },
  {
    title: "Financial Assistance to Old Age Pensioners Suffering From TB/ Cancer - Puducherry",
    category: "State Specific",
    state: "Puducherry",
    tag: "State Govt",
    tagTone: "surface-variant",
    icon: "diversity_3",
    body: "₹500/- per month in addition to the old age pension amount for pensioners suffering from TB or Cancer. (myScheme)",
    bullets: [
      "Additional ₹500/month pension top-up",
      "Indian citizen aged 60+ years, resident of Puducherry",
      "Must be an existing Old Age Pensioner / Destitute Pensioner"
    ],
    reliability: 85,
    description: "Abbreviated as FAOAPSTBC and implemented by the Department of Women and Child Development, Government of Puducherry. It provides additional monthly financial assistance of ₹500 directly via DBT to existing old age or destitute pensioners who are diagnosed with Tuberculosis or Cancer to help offset medicine and nutrition costs. Applications submitted offline to the local CDPO or Deputy Director of DWCD.",
    links: [
      { label: "TB/Cancer Pension details", url: "https://www.myscheme.gov.in/schemes/faoapstbc", type: "official" }
    ],
    requiredDocuments: [
      "Aadhaar Card copy",
      "Puducherry Residence Certificate / Domicile proof",
      "Medical Certificate confirming Cancer or TB from a Government Hospital",
      "Existing Old Age / Destitute Pension card or pension receipt copy",
      "Income Certificate copy",
      "Recent passport-size photograph"
    ]
  }
];

const statesList = [
  "All India",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

export const generalInsurers: Insurance[] = [
  {
    name: "The New India Assurance Co. Ltd.",
    regNumber: "190",
    sector: "Public Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "10,000+ Cashless Hospitals",
    networkSize: 10000,
    primaryPolicy: "New India Cancer Guard Policy",
    policyFeatures: [
      "Cashless cancer treatment across all stages I to IV",
      "No sub-limits on room rent or diagnostic tests",
      "Lifelong renewability and tax benefits under Section 80D"
    ],
    body: "Owned by the Government of India, New India Assurance is the largest public sector general insurance company in India, operating in over 28 countries.",
    reliability: 96,
    website: "https://www.newindia.co.in",
    requiredDocuments: [
      "Duly completed Claim Form A and B",
      "KYC documents (Aadhaar Card, PAN Card)",
      "Original hospital discharge summary sheet",
      "Oncology biopsy report confirming diagnosis and stage",
      "All medical bills, receipts, and physician prescriptions"
    ],
    contactPerson: "Ms. Girija Subramanian (CMD)",
    contactEmail: "cmd.nia@newindia.co.in",
    contactPhone: "+91-22-22624987"
  },
  {
    name: "National Insurance Co. Ltd.",
    regNumber: "105",
    sector: "Public Sector",
    hq: "Kolkata, West Bengal",
    networkHospitals: "8,500+ Cashless Hospitals",
    networkSize: 8500,
    primaryPolicy: "National Cancer Vivek Policy",
    policyFeatures: [
      "Covers surgery, chemotherapy, radiation therapy, and bone marrow transplant",
      "Cumulative bonus of 5% for every claim-free year",
      "Pre and post hospitalization medical expenses up to 30 and 60 days"
    ],
    body: "National Insurance is a premier government-owned general insurance company, serving millions of policyholders across India with reliable critical illness plans.",
    reliability: 94,
    website: "https://nationalinsurance.nic.co.in",
    requiredDocuments: [
      "Claim form with signatures of the policyholder and doctor",
      "Copy of original doctor prescription for hospitalization",
      "Original diagnostic test reports (biopsies, blood panels, scans)",
      "Original itemized medicine bills and invoices",
      "Cancelled cheque with printed name for direct DBT transfer"
    ],
    contactPerson: "Shri Mrsingh (CMD Office)",
    contactEmail: "cmd@nic.co.in",
    contactPhone: "+91-33-22831705"
  },
  {
    name: "The Oriental Insurance Co. Ltd.",
    regNumber: "556",
    sector: "Public Sector",
    hq: "New Delhi",
    networkHospitals: "9,000+ Cashless Hospitals",
    networkSize: 9000,
    primaryPolicy: "Oriental Cancer Protect",
    policyFeatures: [
      "Lump-sum payout upon detection of malignant tumor",
      "Provides premium waiver for the next policy term upon claims",
      "Optional critical illness cover rider for family members"
    ],
    body: "The Oriental Insurance Company is a fully government-owned general insurer known for robust systems and custom insurance products designed for critical disease cover.",
    reliability: 93,
    website: "https://orientalinsurance.org.in",
    requiredDocuments: [
      "Completed critical illness claim form",
      "KYC verified ID proofs (Voter Card / Aadhaar Card)",
      "Detailed clinical staging summary from a certified Oncologist",
      "Original prescriptions and medical bills",
      "Copy of bank passbook first page"
    ],
    contactPerson: "Shri R. R. Singh (CMD Office)",
    contactEmail: "cmd@orientalinsurance.co.in",
    contactPhone: "+91-11-23320330"
  },
  {
    name: "United India Insurance Co. Ltd.",
    regNumber: "545",
    sector: "Public Sector",
    hq: "Chennai, Tamil Nadu",
    networkHospitals: "9,500+ Cashless Hospitals",
    networkSize: 9500,
    primaryPolicy: "United India Cancer Care Plan",
    policyFeatures: [
      "Coverage for inpatient medical expenses, surgeries, and radiotherapy",
      "No pre-policy medical check-up required for individuals up to 50 years",
      "Coverage for second medical opinion from registered specialists"
    ],
    body: "United India Insurance is one of India's oldest and most trusted public sector insurers, offering extensive hospital networks particularly in South India.",
    reliability: 95,
    website: "https://uiic.co.in",
    requiredDocuments: [
      "Official Claim Form fully filled",
      "Aadhaar Card and policy schedule printout",
      "Discharge card from empanelled hospital",
      "Biopsy report and detailed staging note from surgeon",
      "Cancelled cheque copy for direct NEFT"
    ],
    contactPerson: "Shri B. S. Rahul (CMD)",
    contactEmail: "cmdsect@uiic.co.in",
    contactPhone: "+91-44-28520161"
  },
  {
    name: "ICICI Lombard General Insurance Co. Ltd.",
    regNumber: "115",
    sector: "Private Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "11,000+ Cashless Hospitals",
    networkSize: 11000,
    primaryPolicy: "ICICI Lombard Complete Health (Cancer Rider)",
    policyFeatures: [
      "Instant cashless pre-authorization in 11,000+ network hospitals",
      "Unlimited reset benefit for unrelated critical conditions",
      "Includes coverage for outpatient oncology and home-care treatments"
    ],
    body: "ICICI Lombard is one of the leading private sector general insurance companies in India, recognized for its advanced digital services and excellent settlement track record.",
    reliability: 98,
    website: "https://www.icicilombard.com",
    requiredDocuments: [
      "Digital claim submission via IL TakeCare app",
      "Biopsy, MRI, or CT scans confirming neoplastic malignancy",
      "Discharge card containing complete patient history",
      "KYC documents and active health card copy"
    ],
    contactPerson: "Mr. Sanjeev Mantri (MD & CEO)",
    contactEmail: "sanjeev.mantri@icicilombard.com",
    contactPhone: "+91-22-61961100"
  },
  {
    name: "HDFC ERGO General Insurance Co. Ltd.",
    regNumber: "146",
    sector: "Private Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "12,000+ Cashless Hospitals",
    networkSize: 12000,
    primaryPolicy: "my:Health Koti Suraksha (Critical Cancer)",
    policyFeatures: [
      "Massive critical coverage from ₹10 Lakhs up to ₹1 Crore",
      "Cashless pre-authorization under 2 hours in empanelled hospitals",
      "Worldwide medical second opinion and air ambulance riders included"
    ],
    body: "HDFC ERGO is a highly trusted joint venture between HDFC Bank and ERGO International. It is renowned for maintaining a high claim settlement ratio and industry-leading network.",
    reliability: 99,
    website: "https://www.hdfcergo.com",
    requiredDocuments: [
      "KYC verified ID details",
      "Official HDFC ERGO claim documents signed by medical superintendent",
      "Original histopathology report confirming cancer grade/stage",
      "Original discharge card and itemized final bill statement",
      "Cancelled cheque with beneficiary name printed"
    ],
    contactPerson: "Mr. Anuj Tyagi (MD & CEO)",
    contactEmail: "anuj.tyagi@hdfcergo.com",
    contactPhone: "+91-22-66383600"
  },
  {
    name: "Bajaj Allianz General Insurance Co. Ltd.",
    regNumber: "113",
    sector: "Private Sector",
    hq: "Pune, Maharashtra",
    networkHospitals: "10,500+ Cashless Hospitals",
    networkSize: 10500,
    primaryPolicy: "Bajaj Allianz Critical Illness (Oncology Plan)",
    policyFeatures: [
      "100% lump-sum payout on cancer diagnosis of specified severity",
      "Free annual preventive health and breast cancer screenings",
      "Covers chemotherapy, targeted therapies, and reconstructive surgeries"
    ],
    body: "A joint venture between Bajaj Finserv and Allianz SE, this insurer is popular for custom retail health products and rapid cashless settlements.",
    reliability: 98,
    website: "https://www.bajajallianz.com",
    requiredDocuments: [
      "Filled critical illness claim request forms",
      "KYC card copies (Aadhaar & PAN)",
      "Detailed staging and oncology medical summary",
      "Original receipts of all diagnostic imaging and labs",
      "Cancelled cheque"
    ],
    contactPerson: "Mr. Tapan Kumar Singhel (MD & CEO)",
    contactEmail: "tapan.singhel@bajajgeneral.com",
    contactPhone: "+91-20-66026666"
  },
  {
    name: "Star Health & Allied Insurance Co. Ltd.",
    regNumber: "129",
    sector: "Standalone Health",
    hq: "Chennai, Tamil Nadu",
    networkHospitals: "14,000+ Cashless Hospitals",
    networkSize: 14000,
    primaryPolicy: "Star Cancer Care Gold",
    policyFeatures: [
      "First dedicated policy for patients who have already been diagnosed/treated for cancer",
      "Covers recurrence of cancer and second malignant tumors",
      "Cashless daycare cancer therapies at 14,000+ network outlets"
    ],
    body: "Star Health is the largest Standalone Health Insurance company in India, offering specialized coverage options for cardiac, diabetic, and cancer patients.",
    reliability: 97,
    website: "https://www.starhealth.in",
    requiredDocuments: [
      "Star Health Claim Form signed by the policyholder",
      "Complete medical record of past cancer treatments (if applicable)",
      "Original discharge summary with detailed oncology course",
      "Biopsy diagnosis report",
      "KYC documentation and cancelled cheque"
    ],
    contactPerson: "Mr. Anand Roy (MD & CEO)",
    contactEmail: "anand.roy@starhealth.in",
    contactPhone: "+91-44-28319100"
  },
  {
    name: "Care Health Insurance Ltd.",
    regNumber: "148",
    sector: "Standalone Health",
    hq: "Gurugram, Haryana",
    networkHospitals: "11,500+ Cashless Hospitals",
    networkSize: 11500,
    primaryPolicy: "Care Cancer Insurance",
    policyFeatures: [
      "Comprehensive oncology indemnity cover covering stages I to IV",
      "Covers chemotherapy, radiotherapy, active oncology surgeries, and organ transplants",
      "Option for global oncology second opinion from renowned RCCs"
    ],
    body: "Care Health Insurance (formerly Religare Health) is a leading standalone health insurer known for high-quality cashless inpatient cancer covers.",
    reliability: 96,
    website: "https://www.careinsurance.com",
    requiredDocuments: [
      "Care Health claim requisition form",
      "Histopathology pathology staging report",
      "Original hospital bills and pharmacy receipt summaries",
      "Treating oncologist's certificate regarding treatment course",
      "KYC card copy"
    ],
    contactPerson: "Mr. Anuj Gulati (MD & CEO)",
    contactEmail: "anuj.gulati@careinsurance.com",
    contactPhone: "+91-124-9781200"
  },
  {
    name: "Niva Bupa Health Insurance Co. Ltd.",
    regNumber: "145",
    sector: "Standalone Health",
    hq: "New Delhi",
    networkHospitals: "10,000+ Cashless Hospitals",
    networkSize: 10000,
    primaryPolicy: "Niva Bupa CritiCare (Oncology)",
    policyFeatures: [
      "Lump-sum payout upon detection of malignant tumor to cover personal costs",
      "No room rent sub-limits on standard hospitalizations",
      "Premium waiver benefit for the next policy term upon diagnosis"
    ],
    body: "Formerly Max Bupa, Niva Bupa is a top-tier standalone health insurer providing flexible medical cover options for families and individuals.",
    reliability: 96,
    website: "https://www.nivabupa.com",
    requiredDocuments: [
      "Completed critical illness claim form",
      "KYC verification proofs",
      "Detailed clinical staging summary from a certified Oncologist",
      "Original medical bills and hospital bills",
      "Copy of bank passbook first page"
    ],
    contactPerson: "Mr. Krishnan Ramachandran (MD & CEO)",
    contactEmail: "krishnan.ramachandran@nivabupa.com",
    contactPhone: "+91-11-46073300"
  },
  {
    name: "Aditya Birla Health Insurance Co. Ltd.",
    regNumber: "153",
    sector: "Standalone Health",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "10,500+ Cashless Hospitals",
    networkSize: 10500,
    primaryPolicy: "Aditya Birla Activ Secure Cancer",
    policyFeatures: [
      "Up to 150% sum insured payout for advanced metastatic stage cancers",
      "Activ Health returns: Earn up to 100% of premium back for healthy lifestyles",
      "Cashless oncology daycare chemotherapy, targeted drug cycles, and checkups"
    ],
    body: "A joint venture between Aditya Birla Group and MMI Holdings, this health insurer is popular for wellness rewards and customized cancer plans.",
    reliability: 95,
    website: "https://www.adityabirlaha.com",
    requiredDocuments: [
      "Aditya Birla claim submission form",
      "Aadhaar Card and policy schedule copy",
      "Pathology staging report and biopsy diagnoses notes",
      "Discharge summary card",
      "Printed cancelled cheque"
    ],
    contactPerson: "Mr. Mayank Bathwal (MD & CEO)",
    contactEmail: "mayank.bathwal@adityabirla.com",
    contactPhone: "+91-22-62257000"
  },
  {
    name: "ManipalCigna Health Insurance Co. Ltd.",
    regNumber: "151",
    sector: "Standalone Health",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "9,000+ Cashless Hospitals",
    networkSize: 9000,
    primaryPolicy: "ManipalCigna Cancer Care Protect",
    policyFeatures: [
      "Covers early stage & major stage cancer, payout options as lump sum or monthly income",
      "Additional wellness coaching and dietary advice from registered oncologists",
      "No deductibles or room sub-limits on oncology hospital stays"
    ],
    body: "A joint venture between Manipal Group and Cigna Corporation, ManipalCigna provides high-quality international critical care and wellness insurance policies.",
    reliability: 96,
    website: "https://www.manipalcigna.com",
    requiredDocuments: [
      "Official ManipalCigna claim papers",
      "Aadhaar Card and residency proofs",
      "Hospital discharge card containing diagnostic notes",
      "Biopsy report and staging index",
      "Cancelled cheque"
    ],
    contactPerson: "Mr. Prasun Sikdar (MD & CEO)",
    contactEmail: "prasun.sikdar@manipalcigna.com",
    contactPhone: "+91-22-61703600"
  },
  {
    name: "SBI General Insurance Co. Ltd.",
    regNumber: "144",
    sector: "Private Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "10,000+ Cashless Hospitals",
    networkSize: 10000,
    primaryPolicy: "SBI General Critical Illness Cover",
    policyFeatures: [
      "Lump sum benefit up to ₹50 Lakhs on specified cancer severity",
      "Simple tax savings under 80D with fast documentation",
      "No medical test required for individuals up to 45 years with no pre-existing conditions"
    ],
    body: "SBI General is backed by the State Bank of India, which provides robust reach across both urban and rural populations with competitive retail pricing.",
    reliability: 95,
    website: "https://www.sbigeneral.in",
    requiredDocuments: [
      "SBI General critical illness claim form",
      "KYC Card (PAN and Aadhaar)",
      "Cancer stage diagnostic note by oncology physician",
      "Original bills, receipts, and medicine invoices",
      "Cancelled cheque copy"
    ],
    contactPerson: "Mr. Naveen Chandra Jha (MD & CEO)",
    contactEmail: "naveen.jha@sbigeneral.in",
    contactPhone: "+91-22-42412000"
  },
  {
    name: "Go Digit General Insurance Ltd.",
    regNumber: "158",
    sector: "Private Sector",
    hq: "Bengaluru, Karnataka",
    networkHospitals: "11,000+ Cashless Hospitals",
    networkSize: 11000,
    primaryPolicy: "Digit Critical Illness (Cancer)",
    policyFeatures: [
      "100% digital claiming process with zero paper requirements",
      "Smartphone app pre-authorization within 90 minutes",
      "Covers cancer of specified severity with complete lump-sum payouts"
    ],
    body: "Go Digit is an innovative digital-first insurer backed by Fairfax Group, popular among younger generations for simplified policy wording.",
    reliability: 96,
    website: "https://www.godigit.com",
    requiredDocuments: [
      "Digital claim request uploaded via Digit mobile application",
      "Biopsy or stage biopsy pathology report",
      "Treating oncologist summary sheet",
      "Discharge summary card and itemized hospital bills",
      "KYC ID copy"
    ],
    contactPerson: "Ms. Jasleen Kohli (MD & CEO)",
    contactEmail: "jasleen.kohli@godigit.com",
    contactPhone: "+91-20-67617600"
  },
  {
    name: "Acko General Insurance Ltd.",
    regNumber: "157",
    sector: "Private Sector",
    hq: "Bengaluru, Karnataka",
    networkHospitals: "8,500+ Cashless Hospitals",
    networkSize: 8500,
    primaryPolicy: "Acko Platinum Health (Oncology)",
    policyFeatures: [
      "Zero room sub-limits and zero copayments for senior patients",
      "100% digital checkups and paperless claiming under 2 hours",
      "Includes cashless home chemotherapy options and doctor visits"
    ],
    body: "Acko is a modern, direct-to-consumer digital insurer known for disrupting standard premium structures and delivering ultra-fast claiming.",
    reliability: 95,
    website: "https://www.acko.com",
    requiredDocuments: [
      "Acko app digital upload documents",
      "Original biopsy report PDF",
      "Treating physician prescription details",
      "Discharge summary and final invoice"
    ],
    contactPerson: "Mr. Animesh Das (MD & CEO)",
    contactEmail: "animesh@acko.com",
    contactPhone: "+91-22-62620000"
  },
  {
    name: "Tata AIG General Insurance Co. Ltd.",
    regNumber: "108",
    sector: "Private Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "10,000+ Cashless Hospitals",
    networkSize: 10000,
    primaryPolicy: "Tata AIG Wellsurance Woman",
    policyFeatures: [
      "Specialized female cancer focus protecting against breast, ovarian, and cervical cancers",
      "Lump-sum payouts, cosmetic reconstructive surgery riders, and post-op care",
      "Free regular diagnostic checks (mammograms, PAP smears) at network clinics"
    ],
    body: "A joint venture between the Tata Group and American International Group (AIG), this insurer is known for top-tier products and female health focus.",
    reliability: 98,
    website: "https://www.tataaig.com",
    requiredDocuments: [
      "Completed Tata AIG claim documents",
      "KYC cards and policy number printout",
      "Malignancy tissue pathology biopsy confirmation stage report",
      "Hospital discharge history sheet",
      "Cancelled cheque"
    ],
    contactPerson: "Mr. Neelesh Garg (MD & CEO)",
    contactEmail: "neelesh.garg@tata-aig.com",
    contactPhone: "+91-22-66699696"
  },
  {
    name: "Cholamandalam MS General Insurance Co. Ltd.",
    regNumber: "124",
    sector: "Private Sector",
    hq: "Chennai, Tamil Nadu",
    networkHospitals: "9,500+ Cashless Hospitals",
    networkSize: 9500,
    primaryPolicy: "Chola MS Criti 10 (Cancer Focus)",
    policyFeatures: [
      "Cashless settlement across strong South-focused corporate networks",
      "Covers 10 major critical illnesses with focused cancer payouts",
      "Lifelong renewability and custom health coaches"
    ],
    body: "A joint venture between Murugappa Group and Mitsui Sumitomo Insurance, Chola MS is a major player with a highly reliable rural and urban network.",
    reliability: 94,
    website: "https://www.cholainsurance.com",
    requiredDocuments: [
      "Chola MS claim form fully signed",
      "Biopsy pathology summary Stage and type",
      "Detailed discharge notes from the network center",
      "Original bills, prescriptions, and cash memos",
      "Cancelled cheque"
    ],
    contactPerson: "Mr. V. Suryanarayanan (MD & CEO)",
    contactEmail: "suryanarayananV@cholams.murugappa.com",
    contactPhone: "+91-44-30985300"
  },
  {
    name: "Future Generali India Insurance Co. Ltd.",
    regNumber: "132",
    sector: "Private Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "8,000+ Cashless Hospitals",
    networkSize: 8000,
    primaryPolicy: "Future Cancer Protect",
    policyFeatures: [
      "Covers both minor (early) and major advanced stages of cancer",
      "Provides premium waiver for up to 3 years upon early detection claims",
      "Double payout option: Lump sum + Active treatment hospitalization coverage"
    ],
    body: "A joint venture between Future Group and Generali Group, Future Generali is popular for flexible critical cover options and high-speed approvals.",
    reliability: 95,
    website: "https://general.futuregenerali.in",
    requiredDocuments: [
      "Filled Future Generali claim papers",
      "Aadhaar and PAN details",
      "Original surgical or chemotherapy diagnostic stages note",
      "Final itemized bill receipt",
      "Cancelled cheque copy"
    ],
    contactPerson: "Mr. Anup Rau (MD & CEO)",
    contactEmail: "anup@futuregenerali.in",
    contactPhone: "+91-22-40976666"
  },
  {
    name: "Reliance General Insurance Company Limited",
    regNumber: "103",
    sector: "Private Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "9,000+ Cashless Hospitals",
    networkSize: 9000,
    primaryPolicy: "Reliance Health Infinity (Critical)",
    policyFeatures: [
      "Flexible sum insured with unlimited restoration of health limits",
      "Cashless global oncology second opinion options included",
      "Covers active day-care chemotherapy and targeted oncology treatments"
    ],
    body: "Reliance General Insurance is a well-established private insurer providing customizable retail health insurance plans with solid network backing.",
    reliability: 93,
    website: "https://www.reliancegeneral.co.in",
    requiredDocuments: [
      "Reliance General claim form",
      "Residency proof and KYC ID",
      "Detailed biopsy stage confirmation notes from oncologist",
      "Hospital bills, pharmacy slips, and cancelled cheque"
    ],
    contactPerson: "Mr. Rakesh Jain (MD & CEO)",
    contactEmail: "rakesh.jain@relianceada.com",
    contactPhone: "+91-22-43031000"
  },
  {
    name: "Royal Sundaram General Insurance Co. Ltd.",
    regNumber: "102",
    sector: "Private Sector",
    hq: "Chennai, Tamil Nadu",
    networkHospitals: "8,500+ Cashless Hospitals",
    networkSize: 8500,
    primaryPolicy: "Royal Sundaram Lifeline (Cancer)",
    policyFeatures: [
      "Covers chemotherapy, active radiotherapy, and organ transplants",
      "Cashless oncology diagnostic procedures at empanelled diagnostic centers",
      "Option to get a second medical review from global cancer centers"
    ],
    body: "Royal Sundaram is a premier general insurer known for introducing cashless claims in India and providing comprehensive family health benefits.",
    reliability: 94,
    website: "https://www.royalsundaram.in",
    requiredDocuments: [
      "Filled Royal Sundaram claim form",
      "ID card copies and health card copy",
      "Pathology diagnosis report and discharge summary",
      "Original pharmacy invoices and cancelled cheque"
    ],
    contactPerson: "Mr. Amit Ganorkar (MD & CEO)",
    contactEmail: "amit.ganorkar@royalsundaram.in",
    contactPhone: "+91-44-71177117"
  },
  {
    name: "Shriram General Insurance Co. Ltd.",
    regNumber: "137",
    sector: "Private Sector",
    hq: "Jaipur, Rajasthan",
    networkHospitals: "7,000+ Cashless Hospitals",
    networkSize: 7000,
    primaryPolicy: "Shriram Critical Illness Insurance",
    policyFeatures: [
      "Affordable premium rates particularly tailored for rural sectors",
      "100% lump-sum payout upon detection of specified cancer stages",
      "Simplified document processing with regional language claim support"
    ],
    body: "Shriram General Insurance is part of the Shriram Group, having a major rural customer base and a strong focus on simplifying microinsurance.",
    reliability: 92,
    website: "https://www.shriramgi.com",
    requiredDocuments: [
      "Completed claim sheet",
      "Aadhaar and local regional domicile proof",
      "Detailed diagnosis biopsy stages card",
      "Medical bills and doctor certificates",
      "Cancelled cheque"
    ],
    contactPerson: "Mr. Anil Kumar Bansal (MD & CEO)",
    contactEmail: "anil.bansal@shriramgi.com",
    contactPhone: "+91-141-3928400"
  },
  {
    name: "Universal Sompo General Insurance Co. Ltd.",
    regNumber: "134",
    sector: "Private Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "7,500+ Cashless Hospitals",
    networkSize: 7500,
    primaryPolicy: "Universal Sompo Critical Illness",
    policyFeatures: [
      "Lump-sum support on cancer diagnostics to pay auxiliary charges",
      "Collaboration with cooperative banks for local offline processing",
      "Includes coverage for secondary critical ailments concurrently"
    ],
    body: "Universal Sompo is a joint venture of Indian banks (Allahabad, IOB, Karnataka Bank) and Sompo Japan, offering solid regional presence.",
    reliability: 93,
    website: "https://www.universalsompo.com",
    requiredDocuments: [
      "Filled Sompo claim document",
      "Cooperative bank account passbook copy",
      "Biopsy stage report and discharge card copy",
      "Cancelled cheque"
    ],
    contactPerson: "Mr. Sharad Mathur (MD & CEO)",
    contactEmail: "sharad.mathur@universalsompo.com",
    contactPhone: "+91-22-29211800"
  },
  {
    name: "Liberty General Insurance Ltd.",
    regNumber: "150",
    sector: "Private Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "6,500+ Cashless Hospitals",
    networkSize: 6500,
    primaryPolicy: "Liberty Critical Connect",
    policyFeatures: [
      "Lump-sum critical payout with flexible 1-year or 2-year terms",
      "Includes active lifestyle management and psychological counseling riders",
      "Simple tax exemption benefits under Section 80D"
    ],
    body: "A joint venture between Liberty Mutual Group and DP Jindal Group, this insurer focuses on retail health and employee group policies.",
    reliability: 93,
    website: "https://www.libertyinsurance.in",
    requiredDocuments: [
      "Completed Liberty claim sheet",
      "KYC card copies",
      "Detailed clinical staging summary from Oncologist",
      "Original prescriptions and medical bills",
      "Cancelled cheque"
    ],
    contactPerson: "Mr. Roopam Asthana (MD & CEO)",
    contactEmail: "roopam.asthana@libertyinsurance.in",
    contactPhone: "+91-22-67001313"
  },
  {
    name: "Magma HDI General Insurance Co. Ltd.",
    regNumber: "149",
    sector: "Private Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "7,000+ Cashless Hospitals",
    networkSize: 7000,
    primaryPolicy: "Magma HDI OneHealth (Cancer)",
    policyFeatures: [
      "Comprehensive wellness rewards and discounts on yearly health renewal premiums",
      "Covers inpatient surgical oncology and chemotherapy daycare admissions",
      "Organ donor treatment charges fully covered up to sum insured"
    ],
    body: "Magma HDI is a joint venture between Magma Fincorp and HDI Gerling, offering extremely flexible retail health insurance plans.",
    reliability: 94,
    website: "https://www.magmahdi.com",
    requiredDocuments: [
      "Magma HDI claim form",
      "Biopsy stage oncology report",
      "Original discharge card and invoices",
      "Cancelled cheque"
    ],
    contactPerson: "Mr. Rajive Kumaraswami (MD & CEO)",
    contactEmail: "rajive.k@magma-hdi.co.in",
    contactPhone: "+91-22-40407070"
  },
  {
    name: "Zuno General Insurance Ltd.",
    regNumber: "141",
    sector: "Private Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "6,000+ Cashless Hospitals",
    networkSize: 6000,
    primaryPolicy: "Zuno Health Insurance (Cancer Care)",
    policyFeatures: [
      "Earn premium discounts by meeting monthly dynamic walking steps targets",
      "Covers inpatient cancer surgery, chemotherapy, radiation, and diagnostic labs",
      "Complete daycare admissions covered cashless across network"
    ],
    body: "Zuno (formerly Raheja QBE) is a digitally modernized private insurer focusing on wellness and custom health tracking rewards.",
    reliability: 92,
    website: "https://www.zunogi.com",
    requiredDocuments: [
      "Digital claim request uploaded via Zuno app",
      "Biopsy or stage biopsy pathology report",
      "Treating oncologist summary sheet",
      "Discharge summary card and itemized hospital bills",
      "KYC ID copy"
    ],
    contactPerson: "Ms. Shanai Ghosh (MD & CEO)",
    contactEmail: "shanai.ghosh@zunogi.com",
    contactPhone: "+91-22-69022000"
  },
  {
    name: "Kotak Mahindra General Insurance Co. Ltd.",
    regNumber: "152",
    sector: "Private Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "8,000+ Cashless Hospitals",
    networkSize: 8000,
    primaryPolicy: "Kotak Secure Shield (Cancer)",
    policyFeatures: [
      "100% lump-sum payout upon diagnosis of early or advanced stage cancers",
      "Income loss protection benefit rider providing supplementary financial support",
      "Tax savings under Section 80D with lifelong renewal option"
    ],
    body: "Part of the Kotak Mahindra Group, Kotak General is a fast-growing private insurer delivering high-quality retail and digital critical care plans.",
    reliability: 96,
    website: "https://www.kotakgeneral.com",
    requiredDocuments: [
      "Official Kotak claim papers",
      "Aadhaar Card and residency proofs",
      "Hospital discharge summary card containing diagnostic notes",
      "Biopsy report and staging index",
      "Cancelled cheque"
    ],
    contactPerson: "Mr. Suresh Agarwal (MD & CEO)",
    contactEmail: "suresh.agarwal@kotak.com",
    contactPhone: "+91-22-66520000"
  },
  {
    name: "Agriculture Insurance Company of India Limited (AIC)",
    regNumber: "126",
    sector: "Public Sector",
    hq: "New Delhi",
    networkHospitals: "Specialized rural schemes (Non-cashless)",
    networkSize: 0,
    primaryPolicy: "Restructured Crop Insurance (Cancer Trust)",
    policyFeatures: [
      "Primarily crop and yield cover but features a critical oncology welfare grant for farmer families",
      "Direct Benefit Transfer (DBT) of welfare funds to farmer bank accounts",
      "Subsidized premiums funded by Central and State Governments"
    ],
    body: "AIC of India is a specialized public sector crop insurer that maintains central welfare trusts to support farming households experiencing cancer diagnosis.",
    reliability: 90,
    website: "https://www.aicofindia.com",
    requiredDocuments: [
      "Welfare scheme claim sheet signed by village Sarpanch",
      "Farming land holding records (Patta / Khatauni)",
      "Biopsy report and cancer diagnosis from government hospital",
      "Bank passbook copy for DBT"
    ],
    contactPerson: "Mr. Girish Radhakrishnan (CMD)",
    contactEmail: "cmd@aicofindia.com",
    contactPhone: "+91-11-23318536"
  },
  {
    name: "ECGC Limited",
    regNumber: "101",
    sector: "Public Sector",
    hq: "Mumbai, Maharashtra",
    networkHospitals: "Corporate health allowances (Non-cashless)",
    networkSize: 0,
    primaryPolicy: "Corporate Stakeholder Cancer Welfare Benefit",
    policyFeatures: [
      "Welfare oncology allowances for small-medium exporters and associated stakeholders",
      "Comprehensive medical checkup reimbursements",
      "Direct grant support of up to ₹2 Lakhs for low-income exporter families"
    ],
    body: "Owned by the Government of India, ECGC is primarily an export credit agency that operates dedicated welfare critical care funds for exporters and stakeholders.",
    reliability: 95,
    website: "https://www.ecgc.in",
    requiredDocuments: [
      "Exporter enrollment certificate and claim form",
      "Official biopsy report showing malignant staging",
      "Treating RCC oncologist prescription copy",
      "Detailed medical invoices",
      "Cancelled cheque copy"
    ],
    contactPerson: "Mr. M. Senthilnathan (CMD)",
    contactEmail: "cmd@ecgc.in",
    contactPhone: "+91-22-66590500"
  }
];

function getSchemeAttributes(s: Scheme): {
  ageGroup: string;
  profession: string;
  benefitType: string;
  incomeLimit: string;
  coverageAmount: string;
  coverageNum: number;
  gender: string;
} {
  const title = s.title.toLowerCase();
  const body = s.body.toLowerCase();
  const bulletsStr = s.bullets.join(" ").toLowerCase();
  const desc = (s.description || "").toLowerCase();
  
  // 1. Determine Age Group
  let ageGroup = "All Ages";
  if (title.includes("u-18") || bulletsStr.includes("under 18") || body.includes("children under 18")) {
    ageGroup = "Child (0-18)";
  } else if (title.includes("old age") || bulletsStr.includes("old age") || bulletsStr.includes("pensioners") || bulletsStr.includes("destitute pensioner")) {
    ageGroup = "Senior (60+)";
  } else if (bulletsStr.includes("18 to 60") || body.includes("18 to 60")) {
    ageGroup = "Adult (18-60)";
  }

  // 2. Determine Profession
  let profession = "General Public";
  if (title.includes("bocw") || title.includes("construction") || bulletsStr.includes("construction worker") || bulletsStr.includes("builders")) {
    profession = "Construction Worker";
  } else if (title.includes("transport") || bulletsStr.includes("transport workers") || body.includes("transport worker")) {
    profession = "Transport Worker";
  } else if (title.includes("ex-servicemen") || bulletsStr.includes("ex-servicemen") || title.includes("affdf")) {
    profession = "Ex-Servicemen / Veterans";
  } else if (title.includes("cghs") || bulletsStr.includes("government employees") || bulletsStr.includes("govt employee")) {
    profession = "Govt Employee / Pensioner";
  } else if (title.includes("tea tribes") || bulletsStr.includes("tea tribes")) {
    profession = "Tea Tribes / Adivasi";
  }

  // 3. Determine Benefit Type
  let benefitType = "One-time Financial Grant";
  if (title.includes("concession") || bulletsStr.includes("fare concession") || body.includes("airfare") || body.includes("ticket discount") || body.includes("railway")) {
    benefitType = "Travel Concession";
  } else if (title.includes("pension") || bulletsStr.includes("monthly pension") || bulletsStr.includes("monthly financial aid") || bulletsStr.includes("₹3,000 per month") || bulletsStr.includes("₹2,000 per month") || bulletsStr.includes("₹500/month")) {
    benefitType = "Monthly Pension";
  } else if (bulletsStr.includes("cashless") || body.includes("cashless") || title.includes("yojana") || title.includes("bima") || title.includes("aarogyasri") || title.includes("mjpjay") || title.includes("swasthya sathi") || title.includes("mhis") || title.includes("kasp") || title.includes("himcare")) {
    benefitType = "Cashless Treatment";
  }

  // 4. Determine Income Limit
  let incomeLimit = "Any Income";
  if (bulletsStr.includes("bpl") || body.includes("bpl") || desc.includes("bpl") || title.includes("ran") || title.includes("hmcpf") || title.includes("hmdg")) {
    incomeLimit = "BPL Only";
  } else if (bulletsStr.includes("1,50,000") || bulletsStr.includes("1.5 lakh") || bulletsStr.includes("1.50 lakh") || desc.includes("1,50,000")) {
    incomeLimit = "Under ₹1.5 Lakhs";
  } else if (bulletsStr.includes("4 lakh") || bulletsStr.includes("5 lakh") || bulletsStr.includes("6 lakh") || body.includes("income limit") || body.includes("income ceiling")) {
    incomeLimit = "Under ₹4-6 Lakhs";
  }

  // 5. Determine Coverage Amount and Numeric value
  let coverageAmount = "₹1 Lakh - ₹5 Lakhs";
  let coverageNum = 500000;

  if (benefitType === "Travel Concession") {
    coverageAmount = "Travel Concessions / Other";
    coverageNum = 5000;
  } else if (benefitType === "Monthly Pension") {
    coverageAmount = "Monthly Pension Support";
    if (bulletsStr.includes("3,000") || body.includes("3,000")) {
      coverageNum = 36000;
    } else if (bulletsStr.includes("2,000") || body.includes("2,000")) {
      coverageNum = 24000;
    } else {
      coverageNum = 12000;
    }
  } else if (
    bulletsStr.includes("15 lakh") ||
    bulletsStr.includes("15,0,000") ||
    bulletsStr.includes("10 lakh") ||
    bulletsStr.includes("10,00,000") ||
    body.includes("15 lakh") ||
    body.includes("10 lakh") ||
    desc.includes("15 lakh")
  ) {
    coverageAmount = "Above ₹5 Lakhs";
    if (bulletsStr.includes("15 lakh") || bulletsStr.includes("15,0,000") || body.includes("15 lakh")) {
      coverageNum = 1500000;
    } else {
      coverageNum = 1000000;
    }
  } else if (
    bulletsStr.includes("50,000") ||
    bulletsStr.includes("50k") ||
    bulletsStr.includes("25,000") ||
    bulletsStr.includes("30,000") ||
    bulletsStr.includes("15,000") ||
    body.includes("50,000") ||
    body.includes("discretionary grant") ||
    title.includes("discretionary") ||
    bulletsStr.includes("up to ₹1 lakh")
  ) {
    coverageAmount = "Up to ₹1 Lakh";
    if (bulletsStr.includes("50,000") || body.includes("50,000") || title.includes("discretionary")) {
      coverageNum = 50000;
    } else if (bulletsStr.includes("25,000")) {
      coverageNum = 25000;
    } else {
      coverageNum = 20000;
    }
  } else if (
    bulletsStr.includes("5 lakh") ||
    bulletsStr.includes("5,00,000") ||
    bulletsStr.includes("3 lakh") ||
    bulletsStr.includes("2 lakh") ||
    bulletsStr.includes("4 lakh") ||
    body.includes("5 lakh") ||
    title.includes("yojana") ||
    title.includes("bima")
  ) {
    coverageAmount = "₹1 Lakh - ₹5 Lakhs";
    if (bulletsStr.includes("5 lakh") || bulletsStr.includes("5,00,000")) {
      coverageNum = 500000;
    } else if (bulletsStr.includes("3 lakh")) {
      coverageNum = 300000;
    } else if (bulletsStr.includes("2 lakh")) {
      coverageNum = 200000;
    } else {
      coverageNum = 400000;
    }
  }

  // 6. Determine Gender Focus
  let gender = "General / All Genders";
  if (
    title.includes("female") ||
    title.includes("woman") ||
    title.includes("women") ||
    title.includes("breast cancer") ||
    body.includes("breast cancer") ||
    bulletsStr.includes("breast cancer") ||
    bulletsStr.includes("women") ||
    bulletsStr.includes("female") ||
    desc.includes("breast cancer") ||
    desc.includes("women")
  ) {
    gender = "Female Only";
  }

  return { ageGroup, profession, benefitType, incomeLimit, coverageAmount, coverageNum, gender };
}

export default function Schemes() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All India");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeDetailedScheme, setActiveDetailedScheme] = useState<Scheme | null>(null);

  // Dual catalog active tab derived from route path
  const location = useLocation();
  const activeTab: "schemes" | "insurances" = location.pathname.includes("insurance") ? "insurances" : "schemes";
  const [selectedSector, setSelectedSector] = useState("All");

  // Advanced filters state
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("Any Age");
  const [selectedProfession, setSelectedProfession] = useState("Any Profession");
  const [selectedBenefitType, setSelectedBenefitType] = useState("Any Benefit");
  const [selectedIncomeLimit, setSelectedIncomeLimit] = useState("Any Income Limit");
  const [selectedCoverageAmount, setSelectedCoverageAmount] = useState("Any Coverage");
  const [selectedGender, setSelectedGender] = useState("Any Gender");
  const [sortBy, setSortBy] = useState("Default");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeDetailedInsurance, setActiveDetailedInsurance] = useState<Insurance | null>(null);

  // Wizard States
  const [wizardState, setWizardState] = useState("All India");
  const [wizardAge, setWizardAge] = useState("");
  const [wizardGender, setWizardGender] = useState("General / All Genders");
  const [wizardProfession, setWizardProfession] = useState("General Public");
  const [wizardIncome, setWizardIncome] = useState("Any Income");
  const [showWizard, setShowWizard] = useState(false);

  const catalogRef = useRef<HTMLDivElement>(null);

  // Esc key closes the drawer/modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDetailedScheme(null);
        setActiveDetailedInsurance(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when drawer/modal is open
  useEffect(() => {
    if (activeDetailedScheme || activeDetailedInsurance) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeDetailedScheme, activeDetailedInsurance]);

  const handleApplyWizard = () => {
    // 1. Domicile state
    setSelectedState(wizardState);
    
    // 2. Age parsing
    if (wizardAge !== "") {
      const ageNum = parseInt(wizardAge);
      if (ageNum <= 18) {
        setSelectedAgeGroup("Child (0-18)");
      } else if (ageNum >= 60) {
        setSelectedAgeGroup("Senior (60+)");
      } else {
        setSelectedAgeGroup("Adult (18-60)");
      }
    } else {
      setSelectedAgeGroup("Any Age");
    }

    // 3. Gender Focus
    setSelectedGender(wizardGender === "Female Only" ? "Female Only" : "Any Gender");

    // 4. Profession
    setSelectedProfession(wizardProfession);

    // 5. Income Status
    setSelectedIncomeLimit(wizardIncome === "Any Income" ? "Any Income Limit" : wizardIncome);

    // 6. Force opening the advanced collapsible filter panel
    setShowAdvancedFilters(true);

    // 7. Scroll smoothly to results
    setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      // 1. Text Search Filter
      const searchLower = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (searchLower) {
        matchesSearch =
          s.title.toLowerCase().includes(searchLower) ||
          s.body.toLowerCase().includes(searchLower) ||
          s.state.toLowerCase().includes(searchLower) ||
          s.description.toLowerCase().includes(searchLower) ||
          s.bullets.some((b) => b.toLowerCase().includes(searchLower));
      }

      // 2. Category Filter
      let matchesCategory = true;
      if (selectedCategory !== "All") {
        matchesCategory = s.category === selectedCategory;
      }

      // 3. State Filter
      let matchesState = true;
      if (selectedState !== "All India") {
        matchesState = s.state === selectedState || s.state === "All India";
      }

      // 4. Dynamic Attribute Classification
      const attrs = getSchemeAttributes(s);

      // 5. Age Group Filter
      let matchesAge = true;
      if (selectedAgeGroup !== "Any Age") {
        matchesAge = attrs.ageGroup === "All Ages" || attrs.ageGroup === selectedAgeGroup;
      }

      // 6. Profession Filter
      let matchesProfession = true;
      if (selectedProfession !== "Any Profession") {
        matchesProfession = attrs.profession === "General Public" || attrs.profession === selectedProfession;
      }

      // 7. Benefit Type Filter
      let matchesBenefit = true;
      if (selectedBenefitType !== "Any Benefit") {
        matchesBenefit = attrs.benefitType === selectedBenefitType;
      }

      // 8. Income Limit Filter
      let matchesIncome = true;
      if (selectedIncomeLimit !== "Any Income Limit") {
        if (selectedIncomeLimit === "Any Income") {
          matchesIncome = attrs.incomeLimit === "Any Income";
        } else if (selectedIncomeLimit === "BPL Only") {
          matchesIncome = attrs.incomeLimit === "BPL Only";
        } else if (selectedIncomeLimit === "Under ₹1.5 Lakhs") {
          matchesIncome = attrs.incomeLimit !== "BPL Only";
        } else if (selectedIncomeLimit === "Under ₹4-6 Lakhs") {
          matchesIncome = attrs.incomeLimit === "Under ₹4-6 Lakhs" || attrs.incomeLimit === "Any Income";
        }
      }

      // 9. Coverage Amount Filter
      let matchesCoverage = true;
      if (selectedCoverageAmount !== "Any Coverage") {
        matchesCoverage = attrs.coverageAmount === selectedCoverageAmount;
      }

      // 10. Gender Filter
      let matchesGender = true;
      if (selectedGender !== "Any Gender") {
        if (selectedGender === "Female Only") {
          matchesGender = attrs.gender === "Female Only";
        } else {
          matchesGender = attrs.gender === "General / All Genders";
        }
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesState &&
        matchesAge &&
        matchesProfession &&
        matchesBenefit &&
        matchesIncome &&
        matchesCoverage &&
        matchesGender
      );
    });
  }, [
    searchQuery,
    selectedState,
    selectedCategory,
    selectedAgeGroup,
    selectedProfession,
    selectedBenefitType,
    selectedIncomeLimit,
    selectedCoverageAmount,
    selectedGender
  ]);

  const sortedAndFilteredSchemes = useMemo(() => {
    if (sortBy === "Default") {
      return filteredSchemes;
    }

    return [...filteredSchemes].sort((a, b) => {
      const attrsA = getSchemeAttributes(a);
      const attrsB = getSchemeAttributes(b);

      if (sortBy === "Coverage (High to Low)") {
        return attrsB.coverageNum - attrsA.coverageNum;
      } else if (sortBy === "Reliability (High to Low)") {
        return b.reliability - a.reliability;
      } else if (sortBy === "Name (A-Z)") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filteredSchemes, sortBy]);

  const filteredInsurers = useMemo(() => {
    return generalInsurers.filter((ins) => {
      // 1. Text Search Filter
      const searchLower = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (searchLower) {
        matchesSearch =
          ins.name.toLowerCase().includes(searchLower) ||
          ins.primaryPolicy.toLowerCase().includes(searchLower) ||
          ins.hq.toLowerCase().includes(searchLower) ||
          ins.body.toLowerCase().includes(searchLower) ||
          ins.policyFeatures.some((f) => f.toLowerCase().includes(searchLower));
      }

      // 2. Sector Filter
      let matchesSector = true;
      if (selectedSector !== "All") {
        matchesSector = ins.sector === selectedSector;
      }

      return matchesSearch && matchesSector;
    });
  }, [searchQuery, selectedSector]);

  const sortedAndFilteredInsurers = useMemo(() => {
    if (sortBy === "Default") {
      return filteredInsurers;
    }

    return [...filteredInsurers].sort((a, b) => {
      if (sortBy === "Network Size (High to Low)") {
        return b.networkSize - a.networkSize;
      } else if (sortBy === "Claim Ratio (High to Low)") {
        return b.reliability - a.reliability;
      } else if (sortBy === "Name (A-Z)") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [filteredInsurers, sortBy]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedState("All India");
    setSelectedCategory("All");
    setSelectedAgeGroup("Any Age");
    setSelectedProfession("Any Profession");
    setSelectedBenefitType("Any Benefit");
    setSelectedIncomeLimit("Any Income Limit");
    setSelectedCoverageAmount("Any Coverage");
    setSelectedGender("Any Gender");
    setSortBy("Default");
    setSelectedSector("All");
  };

  return (
    <AppShell>
      <div className="p-md md:p-lg max-w-container-max mx-auto relative">
        
        {/* Header */}
        <div className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
            {activeTab === "schemes" ? t("sc_title") : t("sc_tab_insurances")}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            {activeTab === "schemes"
              ? t("sc_subtitle")
              : (language === "en" ? "Empowering cancer patients and their families by providing a comprehensive, verified directory of IRDAI registered public, private, and standalone health insurers in India." :
                 language === "hi" ? "भारत में आईआरडीएआई पंजीकृत सार्वजनिक, निजी और स्टैंडअलोन स्वास्थ्य बीमाकर्ताओं की सत्यापित निर्देशिका।" :
                 language === "mr" ? "भारतातील आयआरडीएआई (IRDAI) नोंदणीकृत आरोग्य विमा कंपन्यांची मार्गदर्शिका." :
                 language === "kn" ? "ಭಾರತದಲ್ಲಿ ಐಆರ್‌ಡಿಎಐ (IRDAI) ನೋಂದಾಯಿತ ಆರೋಗ್ಯ ವಿಮೆಗಾರರ ​​ಪರಿಶೀಲಿಸಿದ ವಿವರಗಳು." :
                 "ভারতে আইআরডিএআই (IRDAI) নিবন্ধিত স্বাস্থ্য বীমাকারীদের যাচাইকৃত ডিরেক্টরি।")}
          </p>
        </div>

        {/* Smart Eligibility Matcher Card */}
        {activeTab === "schemes" && (
          <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-surface-container-lowest border border-primary/20 shadow-md rounded-2xl p-md md:p-lg mb-lg">
            <div className="flex justify-between items-center mb-sm">
              <h2 className="font-headline-sm text-[18px] md:text-headline-sm text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary text-[24px]">explore</span>
                {language === "en" ? "Smart Scheme Matcher" : language === "hi" ? "स्मार्ट योजना मिलानकर्ता" : language === "mr" ? "स्मार्ट योजना मार्गदर्शक" : language === "kn" ? "ಸ್ಮಾರ್ಟ್ ಯೋಜನೆ ಶೋಧಕ" : "স্মার্ট স্কিম ম্যাচিং"}
              </h2>
              <button
                onClick={() => setShowWizard(!showWizard)}
                className="text-primary hover:text-primary-container font-label-md text-label-md flex items-center gap-2"
              >
                {showWizard ? (language === "en" ? "Minimize Matcher" : language === "hi" ? "छोटा करें" : language === "mr" ? "लहान करा" : language === "kn" ? "ಕುಗ್ಗಿಸು" : "ছোট করুন") : (language === "en" ? "Launch Profile Matcher" : language === "hi" ? "प्रोफ़ाइल मिलानकर्ता शुरू करें" : language === "mr" ? "पात्रता तपासा" : language === "kn" ? "ಪ್ರೊಫೈಲ್ ಶೋಧಕ ಚಾಲನೆಗೊಳಿಸಿ" : "প্রোফাইল ম্যাচিং শুরু করুন")}
                <span className="material-symbols-outlined">
                  {showWizard ? "expand_less" : "expand_more"}
                </span>
              </button>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl mb-md">
              {language === "en" ? "Answer a few questions about your profile (Age, State, Gender, Occupation, Income) and we will instantly find all eligible central and state schemes you qualify for." : language === "hi" ? "अपनी प्रोफ़ाइल (आयु, राज्य, लिंग, व्यवसाय, आय) के बारे में कुछ प्रश्नों के उत्तर दें और हम तुरंत उन सभी पात्र केंद्रीय और राज्य योजनाओं को ढूंढेंगे जिनके लिए आप योग्य हैं।" : language === "mr" ? "तुमच्या प्रोफाइल (वय, राज्य, लिंग, व्यवसाय, उत्पन्न) बद्दल काही प्रश्नांची यादी आणि तुमच्यासाठी पात्र असलेल्या सर्व केंद्रीय आणि राज्य योजना आम्ही शोधू." : language === "kn" ? "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ (ವಯಸ್ಸು, ರಾಜ್ಯ, ಲಿಂಗ, ವೃತ್ತಿ, ಆದಾಯ) ಬಗ್ಗೆ ಕೆಲವು ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ ಮತ್ತು ನೀವು ಅರ್ಹರಾಗಿರುವ ಎಲ್ಲಾ ಯೋಜನೆಗಳನ್ನು ನಾವು ಹುಡುಕುತ್ತೇವೆ." : "আপনার প্রোফাইল (বয়স, রাজ্য, লিঙ্গ, পেশা, আয়) সম্পর্কে কয়েকটি প্রশ্নের উত্তর দিন এবং আমরা অবিলম্বে আপনার যোগ্য সমস্ত কেন্দ্রীয় ও রাজ্য প্রকল্পগুলি খুঁজে বের করব।"}
            </p>

            {showWizard && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-sm border-t border-outline-variant/40 pt-md mt-xs animate-fade-in">
                {/* State */}
                <div className="flex flex-col gap-xs">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">{t("it_state")}</label>
                  <select
                    value={wizardState}
                    onChange={(e) => setWizardState(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none cursor-pointer"
                  >
                    {statesList.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* Age */}
                <div className="flex flex-col gap-xs">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">{language === "en" ? "Age (Years)" : language === "hi" ? "आयु (वर्ष)" : language === "mr" ? "वय (वर्षे)" : language === "kn" ? "ವಯಸ್ಸು (ವರ್ಷಗಳು)" : "বয়স (বছর)"}</label>
                  <input
                    type="number"
                    value={wizardAge}
                    onChange={(e) => setWizardAge(e.target.value)}
                    placeholder="Enter age (e.g. 45)"
                    className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none"
                    min="0"
                    max="120"
                  />
                </div>

                {/* Gender */}
                <div className="flex flex-col gap-xs">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">{language === "en" ? "Gender Focus" : language === "hi" ? "लिंग फोकस" : language === "mr" ? "लिंग" : language === "kn" ? "ಲಿಂಗ" : "লিঙ্গ"}</label>
                  <select
                    value={wizardGender}
                    onChange={(e) => setWizardGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none cursor-pointer"
                  >
                    <option value="General / All Genders">{language === "en" ? "All Genders / General" : language === "hi" ? "सभी लिंग / सामान्य" : language === "mr" ? "सर्व लिंग / सामान्य" : language === "kn" ? "ಎಲ್ಲಾ ಲಿಂಗಗಳು / ಸಾಮಾನ್ಯ" : "সব লিঙ্গ / সাধারণ"}</option>
                    <option value="Female Only">{language === "en" ? "Female focus" : language === "hi" ? "महिला फोकस" : language === "mr" ? "महिला विशेष" : language === "kn" ? "ಮಹಿಳಾ ವಿಶೇಷ" : "মহিলা বিশেষ"}</option>
                  </select>
                </div>

                {/* Occupation */}
                <div className="flex flex-col gap-xs">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">{language === "en" ? "Occupation" : language === "hi" ? "व्यवसाय" : language === "mr" ? "व्यवसाय" : language === "kn" ? "ವೃತ್ತಿ" : "পেশা"}</label>
                  <select
                    value={wizardProfession}
                    onChange={(e) => setWizardProfession(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none cursor-pointer"
                  >
                    <option value="General Public">{language === "en" ? "General Public (Any)" : language === "hi" ? "सामान्य जनता (कोई भी)" : language === "mr" ? "सामान्य जनता" : language === "kn" ? "ಸಾಮಾನ್ಯ ಸಾರ್ವಜನಿಕರು" : "সাধারণ জনগণ"}</option>
                    <option value="Construction Worker">{language === "en" ? "Construction / BOCW" : language === "hi" ? "निर्माण / बीओसीडब्ल्यू" : language === "mr" ? "बांधकाम कामगार" : language === "kn" ? "ಕಟ್ಟಡ ಕಾರ್ಮಿಕರು" : "নির্মাণকর্মী"}</option>
                    <option value="Transport Worker">{language === "en" ? "Transport Worker" : language === "hi" ? "परिवहन कार्यकर्ता" : language === "mr" ? "परिवहन कामगार" : language === "kn" ? "ಸಾರಿಗೆ ಕಾರ್ಮಿಕರು" : "পরিবহন কর্মী"}</option>
                    <option value="Ex-Servicemen / Veterans">{language === "en" ? "Ex-Servicemen / Sainik" : language === "hi" ? "पूर्व सैनिक / सैनिक" : language === "mr" ? "माजी सैनिक" : language === "kn" ? "ಮಾಜಿ ಸೈನಿಕರು" : "প্রাক্তন সৈনিক"}</option>
                    <option value="Govt Employee / Pensioner">{language === "en" ? "Govt Employee / Pensioner" : language === "hi" ? "सरकारी कर्मचारी / पेंशनभोगी" : language === "mr" ? "शासकीय कर्मचारी / निवृत्तीवेतनधारक" : language === "kn" ? "ಸರ್ಕಾರಿ ನೌಕರರು / ಪಿಂಚಣಿದಾರರು" : "সরকারি কর্মচারী / পেনশনভোগী"}</option>
                    <option value="Tea Tribes / Adivasi">{language === "en" ? "Tea Tribes / Adivasi" : language === "hi" ? "चाय जनजाति / आदिवासी" : language === "mr" ? "चहा जमाती / आदिवासी" : language === "kn" ? "ಚಹಾ ಬುಡಕಟ್ಟುಗಳು" : "চা উপজাতি / আদিবাসী"}</option>
                  </select>
                </div>

                {/* Income */}
                <div className="flex flex-col gap-xs">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">{t("it_income")}</label>
                  <select
                    value={wizardIncome}
                    onChange={(e) => setWizardIncome(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-bright font-body-sm text-on-surface outline-none cursor-pointer"
                  >
                    <option value="Any Income">{language === "en" ? "General / Any Income" : language === "hi" ? "सामान्य / कोई भी आय" : language === "mr" ? "सामान्य / कोणतीही उत्पन्न मर्यादा नाही" : language === "kn" ? "ಸಾಮಾನ್ಯ / ಯಾವುದೇ ಆದಾಯ" : "সাধারণ / যেকোনো আয়"}</option>
                    <option value="BPL Only">{language === "en" ? "Below Poverty Line (BPL)" : language === "hi" ? "गरीबी रेखा से नीचे (बीपीएल)" : language === "mr" ? "दारिद्र्यरेषेखालील (BPL)" : language === "kn" ? "ದಾರಿದ್ರ್ಯ ರೇಖೆಗಿಂತ ಕೆಳಗೆ (ಬಿಪಿಎಲ್)" : "দারিদ্র্য সীমার নিচে (বিपीএল)"}</option>
                    <option value="Under ₹1.5 Lakhs">{language === "en" ? "Low Income (Under 1.5L/yr)" : language === "hi" ? "कम आय (1.5L/वर्ष से कम)" : language === "mr" ? "अल्प उत्पन्न (१.५ लाखांपेक्षा कमी/वर्ष)" : language === "kn" ? "ಕಡಿಮೆ ಆದಾಯ (ವಾರ್ಷಿಕ ೧.೫ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ)" : "কম আয় (বার্ষিক ১.৫ লাখের কম)"}</option>
                    <option value="Under ₹4-6 Lakhs">{language === "en" ? "Middle Income (Under 4-6L/yr)" : language === "hi" ? "मध्यम आय (4-6L/वर्ष से कम)" : language === "mr" ? "मध्यम उत्पन्न (४-६ लाखांपेक्षा कमी/वर्ष)" : language === "kn" ? "ಮಧ್ಯಮ ಆದಾಯ (ವಾರ್ಷಿಕ ೪-೬ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ)" : "মধ্যম আয় (বার্ষিক ৪-৬ লাখের কম)"}</option>
                  </select>
                </div>

                <div className="col-span-1 sm:col-span-2 md:col-span-5 flex justify-end gap-sm mt-md border-t border-dashed border-outline-variant/30 pt-md">
                  <button
                    onClick={() => {
                      setWizardState("All India");
                      setWizardAge("");
                      setWizardGender("General / All Genders");
                      setWizardProfession("General Public");
                      setWizardIncome("Any Income");
                      resetFilters();
                    }}
                    className="px-md py-2 border border-outline text-outline font-label-md text-label-md rounded-xl hover:bg-surface-container transition-all font-bold text-xs"
                  >
                    {language === "en" ? "Reset Form" : language === "hi" ? "फॉर्म रीसेट करें" : language === "mr" ? "फॉर्म रीसेट करा" : language === "kn" ? "ನಮೂನೆ ಮರುಹೊಂದಿಸಿ" : "ফর্ম রিসেট করুন"}
                  </button>
                  <button
                    onClick={handleApplyWizard}
                    className="px-lg py-2.5 bg-primary text-on-primary font-label-md text-label-md rounded-xl hover:brightness-110 shadow-md active:scale-95 transition-all flex items-center gap-xs font-bold text-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    {language === "en" ? "Find My Eligible Schemes" : language === "hi" ? "मेरी पात्र योजनाएं खोजें" : language === "mr" ? "माझ्या पात्र योजना शोधा" : language === "kn" ? "ನನ್ನ ಅರ್ಹ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ" : "আমার যোগ্য প্রকল্প খুঁজুন"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters Layout */}
        <div className="bg-surface-container-low p-sm md:p-md rounded-2xl border border-outline-variant/60 shadow-sm mb-lg">
          {activeTab === "schemes" ? (
            <div className="flex flex-col lg:flex-row gap-sm items-stretch lg:items-center">
              
              {/* Search Input */}
              <div className="relative flex-grow">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline/80">
                  search
                </span>
                <input
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface-container-lowest outline-none transition-all font-body-md"
                  placeholder={t("sc_search_placeholder")}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-all"
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              {/* State Select Dropdown */}
              <div className="relative min-w-[200px] flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-outline/80 z-10 pointer-events-none">
                  map
                </span>
                <select
                  className="w-full pl-12 pr-8 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-md text-on-surface outline-none appearance-none cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                >
                  {statesList.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 text-outline pointer-events-none">
                  expand_more
                </span>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center justify-center gap-xs px-md py-3 rounded-xl border font-label-md text-label-md transition-all active:scale-[0.98] ${
                  showAdvancedFilters || selectedAgeGroup !== "Any Age" || selectedProfession !== "Any Profession" || selectedBenefitType !== "Any Benefit" || selectedIncomeLimit !== "Any Income Limit" || selectedCoverageAmount !== "Any Coverage" || selectedGender !== "Any Gender"
                    ? "bg-primary text-on-primary border-primary hover:brightness-110 shadow-sm"
                    : "border-outline text-outline hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                {language === "en" ? "Advanced Filters" : language === "hi" ? "उन्नत फ़िल्टर" : language === "mr" ? "प्रगत फिल्टर" : language === "kn" ? "ಸುಧಾರಿತ ಶೋಧಕಗಳು" : "উন্নত ফিল্টার"}
                {(selectedAgeGroup !== "Any Age" || selectedProfession !== "Any Profession" || selectedBenefitType !== "Any Benefit" || selectedIncomeLimit !== "Any Income Limit" || selectedCoverageAmount !== "Any Coverage" || selectedGender !== "Any Gender") && (
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse ml-xs" />
                )}
              </button>

              {/* Reset Button */}
              {(searchQuery || selectedState !== "All India" || selectedCategory !== "All" || selectedAgeGroup !== "Any Age" || selectedProfession !== "Any Profession" || selectedBenefitType !== "Any Benefit" || selectedIncomeLimit !== "Any Income Limit" || selectedCoverageAmount !== "Any Coverage" || selectedGender !== "Any Gender") && (
                <button
                  onClick={resetFilters}
                  className="flex items-center justify-center gap-xs px-md py-3 rounded-xl border border-outline text-outline font-label-md hover:bg-surface-container hover:text-primary transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span> {language === "en" ? "Reset" : language === "hi" ? "रीसेट" : language === "mr" ? "रीसेट" : language === "kn" ? "ಮರುಹೊಂದಿಸಿ" : "রিসেট"}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-sm items-stretch lg:items-center">
              {/* Insurers Search Input */}
              <div className="relative flex-grow">
                <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none">search</span>
                <input
                  type="text"
                  placeholder={language === "en" ? "Search insurers by name, sector, or HQ..." : language === "hi" ? "नाम, क्षेत्र या मुख्यालय से बीमाकर्ता खोजें..." : language === "mr" ? "नाव, क्षेत्र किंवा मुख्यालयानुसार बीमाकर्ता शोधा..." : language === "kn" ? "ಹೆಸರು, ವಲಯ ಅಥವಾ ಪ್ರಧಾನ ಕಚೇರಿ ಮೂಲಕ ವಿಮೆದಾರರನ್ನು ಹುಡುಕಿ..." : "নাম, সেক্টর বা সদর দপ্তর দিয়ে বীমাকারী খুঁজুন..."}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Sector filter dropdown */}
              <div className="relative shrink-0">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">filter_list</span>
                <select
                  className="pl-10 pr-8 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-md text-on-surface outline-none appearance-none cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                >
                  <option value="All">{language === "en" ? "All Sectors" : language === "hi" ? "सभी क्षेत्र" : language === "mr" ? "सर्व क्षेत्रे" : language === "kn" ? "ಎಲ್ಲಾ ವಲಯಗಳು" : "সব সেক্টর"}</option>
                  <option value="Public Sector">{language === "en" ? "Public Sector" : language === "hi" ? "सार्वजनिक क्षेत्र" : language === "mr" ? "सार्वजनिक क्षेत्र" : language === "kn" ? "ಸಾರ್ವಜನಿಕ ವಲಯ" : "সরকারি সেক্টর"}</option>
                  <option value="Private Sector">{language === "en" ? "Private Sector" : language === "hi" ? "निजी क्षेत्र" : language === "mr" ? "खाजगी क्षेत्र" : language === "kn" ? "ಖಾಸಗಿ ವಲಯ" : "বেসরকারি সেক্টর"}</option>
                  <option value="Standalone Health">{language === "en" ? "Standalone Health" : language === "hi" ? "स्टैंडअलोन स्वास्थ्य" : language === "mr" ? "स्वतंत्र आरोग्य" : language === "kn" ? "ಸ್ವತಂತ್ರ ಆರೋಗ್ಯ" : "স্বতন্ত্র স্বাস্থ্য"}</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
          )}

          {/* Advanced Collapsible Filter Panel (only under Schemes tab) */}
          {activeTab === "schemes" && showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-sm mt-sm pt-sm border-t border-outline-variant/40 animate-slide-down">
              {/* Age Group Filter */}
              <div className="flex flex-col gap-xs">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1 select-none font-bold">
                  {language === "en" ? "Age Group" : language === "hi" ? "आयु वर्ग" : language === "mr" ? "वयोगट" : language === "kn" ? "ವಯೋಮಾನ" : "বয়स ग्रुप"}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[16px] pointer-events-none">
                    face
                  </span>
                  <select
                    className="w-full pl-8 pr-7 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-sm text-[12px] text-on-surface outline-none appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary/20"
                    value={selectedAgeGroup}
                    onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  >
                    <option value="Any Age">{language === "en" ? "Any Age" : language === "hi" ? "कोई भी आयु" : language === "mr" ? "कोणतेही वय" : language === "kn" ? "ಯಾವುದೇ ವಯಸ್ಸು" : "যেকোনো বয়স"}</option>
                    <option value="Child (0-18)">{language === "en" ? "Child (0-18 yrs)" : language === "hi" ? "बच्चा (0-18 वर्ष)" : language === "mr" ? "मूल (०-१८ वर्षे)" : language === "kn" ? "ಮಗು (೦-೧೮ ವರ್ಷ)" : "শিশু (০-১৮ বছর)"}</option>
                    <option value="Adult (18-60)">{language === "en" ? "Adult (18-60 yrs)" : language === "hi" ? "वयस्क (18-60 वर्ष)" : language === "mr" ? "प्रौढ (१८-६० वर्षे)" : language === "kn" ? "ವಯಸ್ಕರು (೧೮-೬೦ ವರ್ಷ)" : "প্রাপ্তবয়স্ক (১৮-৬০ বছর)"}</option>
                    <option value="Senior (60+)">{language === "en" ? "Senior (60+ yrs)" : language === "hi" ? "वरिष्ठ (60+ वर्ष)" : language === "mr" ? "ज्येष्ठ नागरिक (६०+ वर्षे)" : language === "kn" ? "ಹಿರಿಯರು (೬೦+ ವರ್ಷ)" : "বয়স্ক (৬০+ বছর)"}</option>
                    <option value="All Ages">{language === "en" ? "All Ages / Universal" : language === "hi" ? "सभी उम्र / सार्वभौमिक" : language === "mr" ? "सर्व वयोगट" : language === "kn" ? "ಎಲ್ಲಾ ವಯಸ್ಸಿನವರಿಗೆ" : "সব বয়স / সার্বজনীন"}</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 text-outline pointer-events-none text-[16px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Profession Filter */}
              <div className="flex flex-col gap-xs">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1 select-none font-bold">
                  {language === "en" ? "Target Profession" : language === "hi" ? "लक्षित व्यवसाय" : language === "mr" ? "लक्षित व्यवसाय" : language === "kn" ? "ಲಕ್ಷಿತ ವೃತ್ತಿ" : "উদ্দিষ্ট পেশা"}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[16px] pointer-events-none">
                    work
                  </span>
                  <select
                    className="w-full pl-8 pr-7 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-sm text-[12px] text-on-surface outline-none appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary/20"
                    value={selectedProfession}
                    onChange={(e) => setSelectedProfession(e.target.value)}
                  >
                    <option value="Any Profession">{language === "en" ? "Any Profession" : language === "hi" ? "कोई भी व्यवसाय" : language === "mr" ? "कोणताही व्यवसाय" : language === "kn" ? "ಯಾವುದೇ ವೃತ್ತಿ" : "যেকোনো পেশা"}</option>
                    <option value="General Public">{language === "en" ? "General Public (Any)" : language === "hi" ? "सामान्य जनता (कोई भी)" : language === "mr" ? "सामान्य जनता" : language === "kn" ? "ಸಾಮಾನ್ಯ ಸಾರ್ವಜನಿಕರು" : "সাধারণ জনগণ"}</option>
                    <option value="Construction Worker">{language === "en" ? "Construction / BOCW" : language === "hi" ? "निर्माण / बीओसीडब्ल्यू" : language === "mr" ? "बांधकाम कामगार" : language === "kn" ? "ಕಟ್ಟಡ ಕಾರ್ಮಿಕರು" : "নির্মাণকর্মী"}</option>
                    <option value="Transport Worker">{language === "en" ? "Transport Worker" : language === "hi" ? "परिवहन कार्यकर्ता" : language === "mr" ? "परिवहन कामगार" : language === "kn" ? "ಸಾರಿಗೆ ಕಾರ್ಮಿಕರು" : "পরিবহন কর্মী"}</option>
                    <option value="Ex-Servicemen / Veterans">{language === "en" ? "Ex-Servicemen / Sainik" : language === "hi" ? "पूर्व सैनिक / सैनिक" : language === "mr" ? "माजी सैनिक" : language === "kn" ? "ಮಾಜಿ ಸೈನಿಕರು" : "প্রাক্তন সৈনিক"}</option>
                    <option value="Govt Employee / Pensioner">{language === "en" ? "Govt Employee / Pensioner" : language === "hi" ? "सरकारी कर्मचारी / पेंशनभोगी" : language === "mr" ? "शासकीय कर्मचारी / निवृत्तीवेतनधारक" : language === "kn" ? "ಸರ್ಕಾರಿ ನೌಕರರು / ಪಿಂಚಣಿದಾರರು" : "সরকারি কর্মচারী / পেনশনভোগী"}</option>
                    <option value="Tea Tribes / Adivasi">{language === "en" ? "Tea Tribes / Adivasi" : language === "hi" ? "चाय जनजाति / आदिवासी" : language === "mr" ? "चहा जमाती / आदिवासी" : language === "kn" ? "ಚಹಾ ಬುಡಕಟ್ಟುಗಳು" : "চা উপজাতি / আদিবাসী"}</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 text-outline pointer-events-none text-[16px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Benefit Type Filter */}
              <div className="flex flex-col gap-xs">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1 select-none font-bold">
                  {language === "en" ? "Benefit Category" : language === "hi" ? "लाभ की श्रेणी" : language === "mr" ? "लाभ प्रकार" : language === "kn" ? "ಪ್ರಯೋಜನದ ವರ್ಗ" : "সুবিধার বিভাগ"}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[16px] pointer-events-none">
                    card_membership
                  </span>
                  <select
                    className="w-full pl-8 pr-7 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-sm text-[12px] text-on-surface outline-none appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary/20"
                    value={selectedBenefitType}
                    onChange={(e) => setSelectedBenefitType(e.target.value)}
                  >
                    <option value="Any Benefit">{language === "en" ? "Any Benefit Form" : language === "hi" ? "लाभ का कोई भी रूप" : language === "mr" ? "कोणतेही लाभ प्रकार" : language === "kn" ? "ಯಾವುದೇ ಪ್ರಯೋಜನ" : "যেকোনো ধরণের সুবিধা"}</option>
                    <option value="Cashless Treatment">{language === "en" ? "Cashless Treatment" : language === "hi" ? "कैशलेस उपचार" : language === "mr" ? "मोफत/कॅशलेस उपचार" : language === "kn" ? "ನಗದು ರಹಿತ ಚಿಕಿತ್ಸೆ" : "ক্যাশলেস চিকিৎসা"}</option>
                    <option value="One-time Financial Grant">{language === "en" ? "One-time Financial Grant" : language === "hi" ? "एकमुश्त वित्तीय अनुदान" : language === "mr" ? "एकवेळचे आर्थिक सहाय्य" : language === "kn" ? "ಏಕಕಾಲದ ಆರ್ಥಿಕ ಧನಸಹಾಯ" : "এককালীন আর্থিক অনুদান"}</option>
                    <option value="Monthly Pension">{language === "en" ? "Monthly Pension Support" : language === "hi" ? "मासिक पेंशन सहायता" : language === "mr" ? "मासिक पेन्शन मदत" : language === "kn" ? "ಮಾಸಿಕ ಪಿಂಚಣಿ ನೆರವು" : "মাসিক পেনশন সহায়তা"}</option>
                    <option value="Travel Concession">{language === "en" ? "Travel / Transit Concession" : language === "hi" ? "यात्रा / पारगमन रियायत" : language === "mr" ? "प्रवास सवलत" : language === "kn" ? "ಪ್ರಯಾಣ ಸವಲತ್ತು" : "ভ্রমণ / ট্রানজিট ছাড়"}</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 text-outline pointer-events-none text-[16px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Income Limit Filter */}
              <div className="flex flex-col gap-xs">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1 select-none font-bold">
                  {language === "en" ? "Financial Criteria" : language === "hi" ? "वित्तीय मानदंड" : language === "mr" ? "उत्पन्न निकष" : language === "kn" ? "ಆರ್ಥಿಕ ಅರ್ಹತೆ" : "আর্থিক মানদণ্ড"}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[16px] pointer-events-none">
                    savings
                  </span>
                  <select
                    className="w-full pl-8 pr-7 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-sm text-[12px] text-on-surface outline-none appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary/20"
                    value={selectedIncomeLimit}
                    onChange={(e) => setSelectedIncomeLimit(e.target.value)}
                  >
                    <option value="Any Income Limit">{language === "en" ? "Any Income Status" : language === "hi" ? "कोई भी आय स्थिति" : language === "mr" ? "कोणतीही उत्पन्न मर्यादा" : language === "kn" ? "ಯಾವುದೇ ಆದಾಯ ಮಿತಿ" : "যেকোনো আয়ের স্তর"}</option>
                    <option value="Any Income">{language === "en" ? "Any Income (Universal)" : language === "hi" ? "कोई भी आय (सार्वभौमिक)" : language === "mr" ? "सर्व उत्पन्नाचे गट" : language === "kn" ? "ಯಾವುದೇ ಆದಾಯ (ಸಾರ್ವತ್ರಿಕ)" : "যেকোনো আয় (সার্বজনীন)"}</option>
                    <option value="BPL Only">{language === "en" ? "Below Poverty Line (BPL)" : language === "hi" ? "गरीबी रेखा से नीचे (बीपीएल)" : language === "mr" ? "दारिद्र्यरेषेखालील (BPL)" : language === "kn" ? "ದಾರಿದ್ರ್ಯ ರೇಖೆಗಿಂತ ಕೆಳಗೆ (ಬಿಪಿಎಲ್)" : "দারিদ্র্য সীমার নিচে (বিপিএল)"}</option>
                    <option value="Under ₹1.5 Lakhs">{language === "en" ? "Under ₹1.5 Lakhs / yr" : language === "hi" ? "₹1.5 लाख/वर्ष से कम" : language === "mr" ? "१.५ लाखांपेक्षा कमी/वर्ष" : language === "kn" ? "ವಾರ್ಷಿಕ ೧.೫ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ" : "বার্ষিক ১.৫ লাখের নিচে"}</option>
                    <option value="Under ₹4-6 Lakhs">{language === "en" ? "Under ₹4-6 Lakhs / yr" : language === "hi" ? "₹4-6 लाख/वर्ष से कम" : language === "mr" ? "४-६ लाखांपेक्षा कमी/वर्ष" : language === "kn" ? "ವಾರ್ಷಿಕ ೪-೬ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ" : "বার্ষিক ৪-৬ লাখের নিচে"}</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 text-outline pointer-events-none text-[16px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Treatment Coverage Filter */}
              <div className="flex flex-col gap-xs">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1 select-none font-bold">
                  {language === "en" ? "Treatment Coverage" : language === "hi" ? "उपचार कवरेज" : language === "mr" ? "उपचार विमा छत्र" : language === "kn" ? "ಚಿಕಿತ್ಸಾ ರಕ್ಷಣೆ ಮೊತ್ತ" : "চিকিৎসা কভারেজ"}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[16px] pointer-events-none">
                    payments
                  </span>
                  <select
                    className="w-full pl-8 pr-7 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-sm text-[12px] text-on-surface outline-none appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary/20"
                    value={selectedCoverageAmount}
                    onChange={(e) => setSelectedCoverageAmount(e.target.value)}
                  >
                    <option value="Any Coverage">{language === "en" ? "Any Coverage" : language === "hi" ? "कोई भी कवरेज" : language === "mr" ? "कोणतीही रक्कम" : language === "kn" ? "ಯಾವುದೇ ಮೊತ್ತ" : "যেকোনো কভারেজ"}</option>
                    <option value="Up to ₹1 Lakh">{language === "en" ? "Up to ₹1 Lakh" : language === "hi" ? "₹1 लाख तक" : language === "mr" ? "१ लाखांपर्यंत" : language === "kn" ? "₹೧ ಲಕ್ಷದವರೆಗೆ" : "১ লক্ষ পর্যন্ত"}</option>
                    <option value="₹1 Lakh - ₹5 Lakhs">{language === "en" ? "₹1 Lakh - ₹5 Lakhs" : language === "hi" ? "₹1 लाख - ₹5 लाख" : language === "mr" ? "१ ते ५ लाख" : language === "kn" ? "₹೧ ರಿಂದ ೫ ಲಕ್ಷ" : "১ লক্ষ - ৫ লক্ষ"}</option>
                    <option value="Above ₹5 Lakhs">{language === "en" ? "Above ₹5 Lakhs" : language === "hi" ? "₹5 लाख से ऊपर" : language === "mr" ? "५ लाखांपेक्षा जास्त" : language === "kn" ? "₹೫ ಲಕ್ಷಕ್ಕೂ ಹೆಚ್ಚು" : "৫ লক্ষের উপরে"}</option>
                    <option value="Monthly Pension Support">{language === "en" ? "Monthly Pension" : language === "hi" ? "मासिक पेंशन" : language === "mr" ? "मासिक पेन्शन" : language === "kn" ? "ಮಾಸಿಕ ಪಿಂಚಣಿ" : "মাসিক পেনশন"}</option>
                    <option value="Travel Concessions / Other">{language === "en" ? "Concessions / Other" : language === "hi" ? "रियायतें / अन्य" : language === "mr" ? "सवलती / इतर" : language === "kn" ? "ಸವಲತ್ತುಗಳು / ಇತರೆ" : "ছাড় / অন্যান্য"}</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 text-outline pointer-events-none text-[16px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Gender focus Filter */}
              <div className="flex flex-col gap-xs">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1 select-none font-bold">
                  {language === "en" ? "Gender Focus" : language === "hi" ? "लिंग फोकस" : language === "mr" ? "लिंग" : language === "kn" ? "ಲಿಂಗ" : "লিঙ্গ"}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[16px] pointer-events-none">
                    wc
                  </span>
                  <select
                    className="w-full pl-8 pr-7 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest font-body-sm text-[12px] text-on-surface outline-none appearance-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary/20"
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                  >
                    <option value="Any Gender">{language === "en" ? "Any Gender" : language === "hi" ? "कोई भी लिंग" : language === "mr" ? "कोणतेही लिंग" : language === "kn" ? "ಯಾವುದೇ ಲಿಂಗ" : "যেকোনো লিঙ্গ"}</option>
                    <option value="Female Only">{language === "en" ? "Female Only" : language === "hi" ? "केवल महिला" : language === "mr" ? "केवळ महिला" : language === "kn" ? "ಮಹಿಳೆಯರು ಮಾತ್ರ" : "শুধুমাত্র মহিলা"}</option>
                    <option value="General / All Genders">{language === "en" ? "General / All Genders" : language === "hi" ? "सामान्य / सभी लिंग" : language === "mr" ? "सर्व लिंग / सामान्य" : language === "kn" ? "ಎಲ್ಲಾ ಲಿಂಗಗಳು / ಸಾಮಾನ್ಯ" : "সব লিঙ্গ / সাধারণ"}</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 text-outline pointer-events-none text-[16px]">
                    expand_more
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* Active Filter Tags (only under schemes tab) */}
          {activeTab === "schemes" && (selectedAgeGroup !== "Any Age" || selectedProfession !== "Any Profession" || selectedBenefitType !== "Any Benefit" || selectedIncomeLimit !== "Any Income Limit" || selectedCoverageAmount !== "Any Coverage" || selectedGender !== "Any Gender") && (
            <div className="flex flex-wrap gap-xs mt-sm pt-xs border-t border-outline-variant/40 animate-fade-in font-bold text-xs">
              <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center pr-xs select-none font-bold">
                {language === "en" ? "Active Criteria:" : language === "hi" ? "सक्रिय मानदंड:" : language === "mr" ? "सक्रिय निकष:" : language === "kn" ? "ಸಕ್ರಿಯ ಶೋಧಕಗಳು:" : "সक्रिय মানদণ্ড:"}
              </span>
              
              {selectedAgeGroup !== "Any Age" && (
                <span className="inline-flex items-center gap-xs px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-[12px] font-semibold">
                  <span>{language === "en" ? "Age" : language === "hi" ? "आयु" : language === "mr" ? "वय" : language === "kn" ? "ವಯಸ್ಸು" : "বয়স"}: {selectedAgeGroup}</span>
                  <button onClick={() => setSelectedAgeGroup("Any Age")} className="hover:bg-secondary/20 rounded-full p-0.5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                  </button>
                </span>
              )}

              {selectedProfession !== "Any Profession" && (
                <span className="inline-flex items-center gap-xs px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-[12px] font-semibold">
                  <span>{language === "en" ? "Occupation" : language === "hi" ? "व्यवसाय" : language === "mr" ? "व्यवसाय" : language === "kn" ? "ವೃತ್ತಿ" : "পেশা"}: {selectedProfession}</span>
                  <button onClick={() => setSelectedProfession("Any Profession")} className="hover:bg-secondary/20 rounded-full p-0.5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                  </button>
                </span>
              )}

              {selectedBenefitType !== "Any Benefit" && (
                <span className="inline-flex items-center gap-xs px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-[12px] font-semibold">
                  <span>{language === "en" ? "Benefit" : language === "hi" ? "लाभ" : language === "mr" ? "लाभ" : language === "kn" ? "ಪ್ರಯೋಜನ" : "সুবিধা"}: {selectedBenefitType}</span>
                  <button onClick={() => setSelectedBenefitType("Any Benefit")} className="hover:bg-secondary/20 rounded-full p-0.5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                  </button>
                </span>
              )}

              {selectedIncomeLimit !== "Any Income Limit" && (
                <span className="inline-flex items-center gap-xs px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-[12px] font-semibold">
                  <span>{language === "en" ? "Income" : language === "hi" ? "आय" : language === "mr" ? "उत्पन्न" : language === "kn" ? "ಆದಾಯ" : "আয়"}: {selectedIncomeLimit}</span>
                  <button onClick={() => setSelectedIncomeLimit("Any Income Limit")} className="hover:bg-secondary/20 rounded-full p-0.5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                  </button>
                </span>
              )}

              {selectedCoverageAmount !== "Any Coverage" && (
                <span className="inline-flex items-center gap-xs px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-[12px] font-semibold">
                  <span>{language === "en" ? "Coverage" : language === "hi" ? "कवरेज" : language === "mr" ? "विमा छत्र" : language === "kn" ? "ರಕ್ಷಣೆ ಮೊತ್ತ" : "কভারেজ"}: {selectedCoverageAmount}</span>
                  <button onClick={() => setSelectedCoverageAmount("Any Coverage")} className="hover:bg-secondary/20 rounded-full p-0.5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                  </button>
                </span>
              )}

              {selectedGender !== "Any Gender" && (
                <span className="inline-flex items-center gap-xs px-2.5 py-1 bg-secondary/10 text-secondary rounded-lg text-[12px] font-semibold">
                  <span>{language === "en" ? "Gender" : language === "hi" ? "लिंग" : language === "mr" ? "लिंग" : language === "kn" ? "ಲಿಂಗ" : "লিঙ্গ"}: {selectedGender}</span>
                  <button onClick={() => setSelectedGender("Any Gender")} className="hover:bg-secondary/20 rounded-full p-0.5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Category Tabs (only under Schemes tab) */}
          {activeTab === "schemes" && (
            <div className="flex gap-xs mt-sm overflow-x-auto pb-xs custom-scrollbar">
              {[
                { id: "All", label: language === "en" ? "All Schemes" : language === "hi" ? "सभी योजनाएं" : language === "mr" ? "सर्व योजना" : language === "kn" ? "ಎಲ್ಲಾ ಯೋಜನೆಗಳು" : "সব স্কিম", count: schemes.length },
                { id: "Breast Cancer Specific", label: language === "en" ? "Breast Cancer Focus" : language === "hi" ? "स्तन कैंसर फोकस" : language === "mr" ? "स्तन कर्करोग विशेष" : language === "kn" ? "ಸ್ತನ ಕ್ಯಾನ್ಸರ್ ವಿಶೇಷ" : "স্তন ক্যান্সার ফোকাস", count: schemes.filter(s => s.category === "Breast Cancer Specific").length },
                { id: "General", label: language === "en" ? "National & Central Programs" : language === "hi" ? "राष्ट्रीय एवं केंद्रीय कार्यक्रम" : language === "mr" ? "राष्ट्रीय आणि केंद्रीय कार्यक्रम" : language === "kn" ? "ರಾಷ್ಟ್ರೀಯ ಮತ್ತು ಕೇಂದ್ರ ಕಾರ್ಯಕ್ರಮಗಳು" : "জাতীয় ও কেন্দ্রীয় কর্মসূচি", count: schemes.filter(s => s.category === "General").length },
                { id: "State Specific", label: language === "en" ? "State Government Schemes" : language === "hi" ? "राज्य सरकार की योजनाएं" : language === "mr" ? "राज्य शासकीय योजना" : language === "kn" ? "ರಾಜ್ಯ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು" : "রাজ্য সরকারের প্রকল্প", count: schemes.filter(s => s.category === "State Specific").length }
              ].map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-xs px-md py-2.5 rounded-full font-label-sm text-[13px] whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-on-primary shadow-md transform -translate-y-[1px]"
                        : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/50"
                    }`}
                  >
                    {cat.label}
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                      isActive ? "bg-on-primary/20 text-on-primary" : "bg-surface-container text-on-surface-variant"
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Featured Hero: Ayushman Bharat (only shown when in Schemes tab, selected state is All India, and no search query exists) */}
        {activeTab === "schemes" && selectedState === "All India" && selectedCategory !== "State Specific" && !searchQuery && (
          <section className="mb-lg">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-container text-on-primary p-md md:p-lg flex flex-col md:flex-row items-stretch gap-md shadow-xl border border-primary/20">
              <div className="flex-grow z-10 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-xs px-3 py-1 bg-on-primary/20 rounded-full font-label-sm text-label-sm mb-sm border border-on-primary/10">
                    <span className="material-symbols-outlined fill-icon text-[16px] text-tertiary-fixed">star</span>
                    {language === "en" ? "National Health Assurance Priority" : language === "hi" ? "राष्ट्रीय स्वास्थ्य आश्वासन प्राथमिकता" : language === "mr" ? "राष्ट्रीय आरोग्य हमी प्राधान्य" : language === "kn" ? "ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ವಿಮಾ ಆದ್ಯತೆ" : "জাতীয় স্বাস্থ্য আশ্বাস অগ্রাধিকার"}
                  </div>
                  <h2 className="font-headline-lg text-[26px] md:text-headline-lg mb-sm">
                    Ayushman Bharat (PM-JAY)
                  </h2>
                  <p className="font-body-md md:font-body-lg mb-md max-w-2xl text-on-primary/90 leading-relaxed">
                    {language === "en" ? "Provides ₹5 Lakh medical coverage per family per year for secondary and tertiary care hospitalization. Covers major cancer procedures completely cashless." : language === "hi" ? "माध्यमिक और तृतीयक देखभाल अस्पताल में भर्ती होने के लिए प्रति परिवार प्रति वर्ष ₹5 लाख चिकित्सा कवरेज प्रदान करता है। प्रमुख कैंसर प्रक्रियाओं को पूरी तरह से कैशलेस कवर करता है।" : language === "mr" ? "माध्यमिक आणि तृतीयक उपचारांसाठी प्रति कुटुंब प्रति वर्ष ₹५ लाख वैद्यकीय संरक्षण मिळते. कर्करोगाच्या मुख्य शस्त्रक्रिया पूर्णपणे मोफत (कॅशलेस) केल्या जातात." : language === "kn" ? "ದ್ವಿತೀಯಕ ಮತ್ತು ತೃತೀಯಕ ಆರೈಕೆಗಾಗಿ ಪ್ರತಿ ಕುಟುಂಬಕ್ಕೆ ವರ್ಷಕ್ಕೆ ₹೫ ಲಕ್ಷ ವೈದ್ಯಕೀಯ ರಕ್ಷಣೆ ನೀಡುತ್ತದೆ. ಪ್ರಮುಖ ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆಗಳನ್ನು ನಗದು ರಹಿತವಾಗಿ ಒಳಗೊಳ್ಳುತ್ತದೆ." : "মাধ্যমিক ও টারশিয়ারি কেয়ারের জন্য পরিবার প্রতি বার্ষিক ₹৫ লক্ষ চিকিৎসা কভার প্রদান করে। প্রধান ক্যান্সারের চিকিৎসা সম্পূর্ণ ক্যাশলেস করা হয়।"}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-sm md:gap-md mb-md border-t border-on-primary/10 pt-md">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">{language === "en" ? "Coverage Amount" : language === "hi" ? "कवरेज राशि" : language === "mr" ? "संरक्षण रक्कम" : language === "kn" ? "ವಿಮಾ ಮೊತ್ತ" : "বীমা কভারেজের পরিমাণ"}</p>
                      <p className="font-headline-sm text-headline-sm text-tertiary-fixed font-bold">₹5,00,000 /yr</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">{language === "en" ? "Cancer Care" : language === "hi" ? "कैंसर देखभाल" : language === "mr" ? "कर्करोग काळजी" : language === "kn" ? "ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ" : "ক্যান্সার চিকিৎসা"}</p>
                      <p className="font-headline-sm text-headline-sm font-semibold">{language === "en" ? "Full Assistance" : language === "hi" ? "पूर्ण सहायता" : language === "mr" ? "पूर्ण मदत" : language === "kn" ? "ಪೂರ್ಣ ನೆರವು" : "সম্পূর্ণ সহায়তা"}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">{language === "en" ? "Network Hospitals" : language === "hi" ? "नेटवर्क अस्पताल" : language === "mr" ? "पॅनेलवरील रुग्णालये" : language === "kn" ? "ನೆಟ್‌ವರ್ಕ್ ಆಸ್ಪತ್ರೆಗಳು" : "নেটওয়ার্ক হাসপাতাল"}</p>
                      <p className="font-headline-sm text-headline-sm font-semibold">{language === "en" ? "27,000+ Pan-India" : language === "hi" ? "27,000+ अखिल भारतीय" : language === "mr" ? "२७,०००+ संपूर्ण भारत" : language === "kn" ? "೨೭,೦೦೦+ ಭಾರತದಾದ್ಯಂತ" : "২৭,০০০+ সারা ভারত"}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-sm flex-wrap pt-xs">
                  <button
                    onClick={() => setActiveDetailedScheme(schemes[0])}
                    className="px-md py-3 bg-white text-primary rounded-xl font-label-md text-label-md hover:bg-surface-bright transition-all shadow-md active:scale-95 flex items-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">launch</span> {language === "en" ? "Read Application Guide" : language === "hi" ? "आवेदन गाइड पढ़ें" : language === "mr" ? "अर्ज मार्गदर्शिका वाचा" : language === "kn" ? "ಅರ್ಜಿ ಮಾರ್ಗದರ್ಶಿ ಓದಿ" : "আবেদন নির্দেশিকা পড়ুন"}
                  </button>
                  <a
                    href="https://beneficiary.nha.gov.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-md py-3 border border-white/60 text-on-primary rounded-xl font-label-md text-label-md hover:bg-on-primary/10 transition-all active:scale-95 flex items-center gap-xs"
                  >
                    {language === "en" ? "Check Eligibility Online →" : language === "hi" ? "पात्रता ऑनलाइन जांचें →" : language === "mr" ? "पात्रता ऑनलाईन तपासा →" : language === "kn" ? "ಅರ್ಹತೆಯನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ →" : "অনলাইনে যোগ্যতা পরীক্ষা করুন →"}
                  </a>
                </div>
              </div>
              <div className="hidden lg:flex w-64 h-64 rounded-2xl bg-on-primary/5 items-center justify-center flex-shrink-0 border border-white/10 self-center">
                <span className="material-symbols-outlined text-[130px] text-on-primary/40 select-none">local_hospital</span>
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Catalog Section Header */}
        <div ref={catalogRef} className="flex justify-between items-center mb-md border-b border-outline-variant/40 pb-sm">
          <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[24px]">
              {activeTab === "schemes" ? "list_alt" : "shield"}
            </span>
            {activeTab === "schemes" ? (
              <>
                {filteredSchemes.length === schemes.length 
                  ? (language === "en" ? "All Catalogue Programs" : language === "hi" ? "सभी कैटलॉग कार्यक्रम" : language === "mr" ? "सर्व कॅटलॉग योजना" : language === "kn" ? "ಎಲ್ಲಾ ಕ್ಯಾಟಲಾಗ್ ಯೋಜನೆಗಳು" : "সমস্ত ক্যাটালগ প্রোগ্রাম")
                  : (language === "en" ? "Filtered Matches" : language === "hi" ? "फ़िल्टर किए गए मिलान" : language === "mr" ? "फिल्टर केलेले सामने" : language === "kn" ? "ಫಿಲ್ಟರ್ ಮಾಡಿದ ಹೊಂದಾಣಿಕೆಗಳು" : "ফিল্টার করা ফলাফল")}
                <span className="text-body-sm font-normal text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                  {filteredSchemes.length} {language === "en" ? "programs found" : language === "hi" ? "कार्यक्रम मिले" : language === "mr" ? "योजना मिळाल्या" : language === "kn" ? "ಯೋಜನೆಗಳು ಪತ್ತೆಯಾಗಿವೆ" : "টি প্রোগ্রাম পাওয়া গেছে"}
                </span>
              </>
            ) : (
              <>
                {language === "en" ? "IRDAI Registered General Insurers" : language === "hi" ? "आईआरडीएआई पंजीकृत सामान्य बीमाकर्ता" : language === "mr" ? "IRDAI नोंदणीकृत सामान्य विमा कंपन्या" : language === "kn" ? "IRDAI ನೋಂದಾಯಿತ ಸಾಮಾನ್ಯ ವಿಮೆದಾರರು" : "IRDAI নিবন্ধিত সাধারণ বীমাকারী"}
                <span className="text-body-sm font-normal text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                  {sortedAndFilteredInsurers.length} {language === "en" ? "insurers listed" : language === "hi" ? "बीमा कंपनियां सूचीबद्ध" : language === "mr" ? "विमा कंपन्या सूचीबद्ध" : language === "kn" ? "ವಿಮೆದಾರರನ್ನು ಪಟ್ಟಿ ಮಾಡಲಾಗಿದೆ" : "টি বীমাকারী তালিকাভুক্ত"}
                </span>
              </>
            )}
          </h2>
          {/* Active Tab Sort dropdown */}
          <div className="flex items-center gap-xs">
            <label className="text-[12px] font-bold text-on-surface-variant hidden md:block">
              {language === "en" ? "Sort By" : language === "hi" ? "इसके अनुसार क्रमबद्ध करें" : language === "mr" ? "यानुसार वर्गीकरण करा" : language === "kn" ? "ಮೂಲಕ ವಿಂಗಡಿಸು" : "ক্রমানুসারে সাজান"}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-bright font-body-sm text-[12px] text-on-surface outline-none cursor-pointer"
            >
              {activeTab === "schemes" ? (
                <>
                  <option value="Default">{language === "en" ? "Default Order" : language === "hi" ? "डिफ़ॉल्ट क्रम" : language === "mr" ? "डीफॉल्ट क्रम" : language === "kn" ? "ಡೀಫಾಲ್ಟ್ ಆದೇಶ" : "ডিফল্ট ক্রম"}</option>
                  <option value="Coverage (High to Low)">{language === "en" ? "Coverage (High to Low)" : language === "hi" ? "कवरेज (उच्च से निम्न)" : language === "mr" ? "संरक्षण (जास्त ते कमी)" : language === "kn" ? "ಕವರೇಜ್ (ಹೆಚ್ಚಿನದರಿಂದ ಕಡಿಮೆ)" : "কভারেজ (উচ্চ থেকে নিম্ন)"}</option>
                  <option value="Reliability (High to Low)">{language === "en" ? "Reliability (High to Low)" : language === "hi" ? "विश्वसनीयता (उच्च से निम्न)" : language === "mr" ? "विश्वासार्हता (जास्त ते कमी)" : language === "kn" ? "ವಿಶ್ವಾಸಾರ್ಹತೆ (ಹೆಚ್ಚಿನದರಿಂದ ಕಡಿಮೆ)" : "নির্ভরযোগ্যতা (উচ্চ থেকে নিম্ন)"}</option>
                  <option value="Name (A-Z)">{language === "en" ? "Name (A-Z)" : language === "hi" ? "नाम (A-Z)" : language === "mr" ? "नाव (A-Z)" : language === "kn" ? "ಹೆಸರು (A-Z)" : "নাম (A-Z)"}</option>
                </>
              ) : (
                <>
                  <option value="Default">{language === "en" ? "Registration Number" : language === "hi" ? "पंजीकरण संख्या" : language === "mr" ? "नोंदणी क्रमांक" : language === "kn" ? "ನೋಂದಣಿ ಸಂಖ್ಯೆ" : "নিবন্ধন নম্বর"}</option>
                  <option value="Network Size (High to Low)">{language === "en" ? "Network Size (High to Low)" : language === "hi" ? "नेटवर्क आकार (उच्च से निम्न)" : language === "mr" ? "नेटवर्क आकार (जास्त ते कमी)" : language === "kn" ? "ನೆಟ್‌ವರ್ಕ್ ಗಾತ್ರ (ಹೆಚ್ಚಿನದರಿಂದ ಕಡಿಮೆ)" : "নেটওয়ার্কের আকার (উচ্চ থেকে নিম্ন)"}</option>
                  <option value="Claim Ratio (High to Low)">{language === "en" ? "Claim Ratio (High to Low)" : language === "hi" ? "दावा अनुपात (उच्च से निम्न)" : language === "mr" ? "दावा मंजुरी दर (जास्त ते कमी)" : language === "kn" ? "ಕ್ಲೈಮ್ ಅನುಪಾತ (ಹೆಚ್ಚಿನದರಿಂದ ಕಡಿಮೆ)" : "দাবি নিষ্পত্তির অনুপাত (উচ্চ থেকে নিম্ন)"}</option>
                  <option value="Name (A-Z)">{language === "en" ? "Company Name (A-Z)" : language === "hi" ? "कंपनी का नाम (A-Z)" : language === "mr" ? "कंपनीचे नाव (A-Z)" : language === "kn" ? "ಕಂಪನಿಯ ಹೆಸರು (A-Z)" : "কোম্পানির নাম (A-Z)"}</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Catalog Grid */}
        {activeTab === "schemes" ? (
          sortedAndFilteredSchemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter animate-fade-in">
              {sortedAndFilteredSchemes.map((s) => (
                <SchemeTile
                  key={s.title}
                  scheme={s}
                  onViewDetails={() => setActiveDetailedScheme(s)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-xl bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/80 p-lg text-center shadow-inner">
              <span className="material-symbols-outlined text-[64px] text-outline/50 mb-sm">
                info_i
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                {language === "en" ? "No matching schemes found" : language === "hi" ? "कोई मिलान योजना नहीं मिली" : language === "mr" ? "कोणतीही योजना आढळली नाही" : language === "kn" ? "ಯಾವುದೇ ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ" : "কোনো যোগ্য স্কিম পাওয়া যায়নি"}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-md">
                {language === "en" ? `We couldn't find any schemes in ${selectedState !== "All India" ? selectedState : "India"} matching "${searchQuery}" under the active filters.` :
                 language === "hi" ? `हमें सक्रिय फ़िल्टर के तहत "${searchQuery}" से मेल खाने वाली ${selectedState !== "All India" ? selectedState : "भारत"} में कोई योजना नहीं मिली।` :
                 language === "mr" ? `आम्हाला सक्रिय फिल्टर अंतर्गत "${searchQuery}" शी जुळणारी ${selectedState !== "All India" ? selectedState : "भारत"} मध्ये कोणतीही योजना आढळली नाही.` :
                 language === "kn" ? `ಸಕ್ರಿಯ ಫಿಲ್ಟರ್‌ಗಳ ಅಡಿಯಲ್ಲಿ "${searchQuery}" ಗೆ ಹೊಂದುವ ${selectedState !== "All India" ? selectedState : "ಭಾರತ"} ದಲ್ಲಿ ಯಾವುದೇ ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.` :
                 `সক্রিয় ফিল্টারের অধীনে "${searchQuery}" এর সাথে মেলে এমন কোনো প্রকল্প ${selectedState !== "All India" ? selectedState : "ভারত"} -এ পাওয়া যায়নি।`}
              </p>
              <button
                onClick={resetFilters}
                className="px-lg py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:bg-primary/95 transition-all shadow-md active:scale-95 flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span> {language === "en" ? "Clear Filter Options" : language === "hi" ? "फ़िल्टर विकल्प साफ़ करें" : language === "mr" ? "फिल्टर पर्याय साफ करा" : language === "kn" ? "ಫಿಲ್ಟರ್ ಆಯ್ಕೆಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ" : "ফিল্টার অপশন মুছুন"}
              </button>
            </div>
          )
        ) : (
          sortedAndFilteredInsurers.length > 0 ? (
            (() => {
              // After a breast-cancer diagnosis it becomes a pre-existing
              // condition. Almost all retail health / critical-illness plans are
              // then declined for that condition; only a handful of insurers may
              // consider applicants, and only at very high premiums with long
              // waiting periods and the existing cancer excluded.
              const postDiagnosisApplicable = new Set([
                "Star Health & Allied Insurance Co. Ltd.",
                "Care Health Insurance Ltd.",
                "Aditya Birla Health Insurance Co. Ltd."
              ]);
              const applicable = sortedAndFilteredInsurers.filter((i) => postDiagnosisApplicable.has(i.name));
              const notApplicable = sortedAndFilteredInsurers.filter((i) => !postDiagnosisApplicable.has(i.name));
              return (
                <div className="space-y-lg animate-fade-in">
                  {/* Post-diagnosis advisory */}
                  <div className="bg-tertiary-container/40 border border-tertiary/30 rounded-2xl p-md flex gap-sm">
                    <span className="material-symbols-outlined text-tertiary shrink-0">info</span>
                    <div className="space-y-1">
                      <h4 className="font-headline-sm text-sm text-on-surface font-bold">
                        {language === "en" ? "Insurance after a diagnosis" : language === "hi" ? "निदान के बाद बीमा" : "Insurance after a diagnosis"}
                      </h4>
                      <p className="text-body-sm text-on-surface-variant leading-relaxed">
                        {language === "en"
                          ? "Most health and critical-illness policies must be bought BEFORE a diagnosis. Once breast cancer is diagnosed it becomes a pre-existing condition, so new retail cover for it is usually declined — or offered by only a few insurers at very high premiums, with long waiting periods and the existing condition excluded. Always confirm eligibility directly with the insurer. Government schemes (see the Schemes tab) remain your strongest option."
                          : language === "hi"
                          ? "अधिकांश स्वास्थ्य और गंभीर-बीमारी पॉलिसी निदान से पहले ही खरीदी जानी चाहिए। स्तन कैंसर का निदान होने पर यह पूर्व-मौजूद स्थिति बन जाती है, इसलिए इसके लिए नई रिटेल कवर आमतौर पर अस्वीकृत की जाती है — या केवल कुछ बीमाकर्ता बहुत अधिक प्रीमियम, लंबी प्रतीक्षा अवधि और मौजूदा स्थिति को बाहर रखते हुए देते हैं। पात्रता की पुष्टि सीधे बीमाकर्ता से करें। सरकारी योजनाएँ (योजनाएँ टैब देखें) सबसे मजबूत विकल्प बनी रहती हैं।"
                          : "Most health and critical-illness policies must be bought BEFORE a diagnosis. Once breast cancer is diagnosed it becomes a pre-existing condition, so new retail cover for it is usually declined — or offered by only a few insurers at very high premiums, with long waiting periods and the existing condition excluded. Always confirm eligibility directly with the insurer. Government schemes (see the Schemes tab) remain your strongest option."}
                      </p>
                    </div>
                  </div>

                  {/* Group 1: may consider applicants post-diagnosis */}
                  {applicable.length > 0 && (
                    <div className="space-y-sm">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
                        <h3 className="font-headline-sm text-sm text-on-surface font-bold">
                          {language === "en" ? "May consider applicants after diagnosis (high premium)" : language === "hi" ? "निदान के बाद आवेदकों पर विचार कर सकते हैं (उच्च प्रीमियम)" : "May consider applicants after diagnosis (high premium)"}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">{applicable.length}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                        {applicable.map((ins) => (
                          <div key={ins.name} className="rounded-3xl ring-2 ring-secondary/40 ring-offset-2 ring-offset-background">
                            <InsuranceTile insurance={ins} onViewDetails={() => setActiveDetailedInsurance(ins)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group 2: typically unavailable post-diagnosis */}
                  {notApplicable.length > 0 && (
                    <div className="space-y-sm">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-outline text-[20px]">block</span>
                        <h3 className="font-headline-sm text-sm text-on-surface font-bold">
                          {language === "en" ? "Best bought before diagnosis — usually not available after" : language === "hi" ? "निदान से पहले लेना सर्वोत्तम — बाद में आमतौर पर उपलब्ध नहीं" : "Best bought before diagnosis — usually not available after"}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">{notApplicable.length}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter opacity-90">
                        {notApplicable.map((ins) => (
                          <InsuranceTile
                            key={ins.name}
                            insurance={ins}
                            onViewDetails={() => setActiveDetailedInsurance(ins)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center py-xl bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/80 p-lg text-center shadow-inner">
              <span className="material-symbols-outlined text-[64px] text-outline/50 mb-sm">
                info_i
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                {language === "en" ? "No insurers found" : language === "hi" ? "कोई बीमाकर्ता नहीं मिला" : language === "mr" ? "विमा कंपनी आढळली नाही" : language === "kn" ? "ಯಾವುದೇ ವಿಮೆದಾರರು ಕಂಡುಬಂದಿಲ್ಲ" : "কোনো বীমাকারী পাওয়া যায়নি"}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-md">
                {language === "en" ? `We couldn't find any general insurers matching "${searchQuery}" under "${selectedSector}".` :
                 language === "hi" ? `हमें "${selectedSector}" के तहत "${searchQuery}" से मेल खाने वाले कोई सामान्य बीमाकर्ता नहीं मिले।` :
                 language === "mr" ? `आम्हाला "${selectedSector}" अंतर्गत "${searchQuery}" शी जुळणारी कोणतीही सामान्य विमा कंपनी आढळली नाही.` :
                 language === "kn" ? `"${selectedSector}" ಅಡಿಯಲ್ಲಿ "${searchQuery}" ಗೆ ಹೊಂದುವ ಯಾವುದೇ सामान्य ವಿಮೆದಾರರು ಕಂಡುಬಂದಿಲ್ಲ.` :
                 `"${selectedSector}" এর অধীনে "${searchQuery}" এর সাথে মেলে এমন কোনো সাধারণ বীমাকারী পাওয়া যায়নি।`}
              </p>
              <button
                onClick={resetFilters}
                className="px-lg py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:bg-primary/95 transition-all shadow-md active:scale-95 flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span> {language === "en" ? "Clear Filter Options" : language === "hi" ? "फ़िल्टर विकल्प साफ़ करें" : language === "mr" ? "फिल्टर पर्याय साफ करा" : language === "kn" ? "ಫಿಲ್ಟರ್ ಆಯ್ಕೆಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ" : "ফিল্টার অপশন মুছুন"}
              </button>
            </div>
          )
        )}
      </div>

      {/* Slide-over Detailed Scheme Drawer / Modal */}
      {activeDetailedScheme && (
        <div className="fixed inset-0 z-50 flex justify-end transition-all duration-300">
          
          {/* Backdrop glassmorphic */}
          <div
            onClick={() => setActiveDetailedScheme(null)}
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          />

          {/* Panel Container */}
          <div className="relative w-full max-w-2xl bg-surface-bright h-full shadow-2xl flex flex-col justify-between border-l border-outline-variant/40 animate-slide-in overflow-hidden">
            
            {/* Header */}
            <div className="p-md md:p-lg border-b border-outline-variant/40 flex justify-between items-start bg-surface-container-low">
              <div className="flex-grow pr-sm">
                <div className="flex items-center gap-sm mb-sm flex-wrap">
                  <span className={`px-3 py-1 text-[12px] rounded-full font-label-sm ${
                    activeDetailedScheme.tagTone === "tertiary-container"
                      ? "bg-tertiary-container text-on-tertiary-container font-bold"
                      : "bg-surface-variant text-on-surface-variant font-bold"
                  }`}>
                    {activeDetailedScheme.tag}
                  </span>
                  <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-[12px] font-semibold flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]">map</span>
                    {activeDetailedScheme.state}
                  </span>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[12px] font-semibold flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]">category</span>
                    {activeDetailedScheme.category}
                  </span>
                </div>
                <h2 className="font-headline-md text-headline-md text-primary leading-tight">
                  {activeDetailedScheme.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveDetailedScheme(null)}
                className="p-2 hover:bg-surface-container-high rounded-full text-outline hover:text-on-surface transition-all flex items-center justify-center"
                aria-label="Close details"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Scrollable details container */}
            <div className="p-md md:p-lg overflow-y-auto flex-grow space-y-md custom-scrollbar">
              
              {/* Detailed Description */}
              <div>
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-xs">
                  {language === "en" ? "About the Scheme" : language === "hi" ? "योजना के बारे में" : language === "mr" ? "योजना माहिती" : language === "kn" ? "ಯೋಜನೆಯ ಬಗ್ಗೆ" : "প্রকল্প সম্পর্কে"}
                </h3>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                  {activeDetailedScheme.description || activeDetailedScheme.body}
                </p>
                {/* Target Audience Summary Grid */}
                {(() => {
                  const attrs = getSchemeAttributes(activeDetailedScheme);
                  return (
                    <div className="grid grid-cols-3 gap-xs bg-surface-container-low p-sm rounded-xl border border-outline-variant/40 mt-sm">
                      <div className="text-center p-xs border-r border-b border-outline-variant/30 md:border-b-0 pb-sm">
                        <span className="material-symbols-outlined text-primary text-[20px] mb-[2px]">face</span>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider leading-none">{language === "en" ? "Age Suitability" : language === "hi" ? "आयु उपयुक्तता" : language === "mr" ? "योग्य वयोगट" : language === "kn" ? "ಸೂಕ್ತವಾದ ವಯಸ್ಸು" : "উপযুক্ত বয়স"}</p>
                        <p className="text-[11px] font-semibold text-on-surface mt-[2px]">{attrs.ageGroup}</p>
                      </div>
                      <div className="text-center p-xs border-r border-b border-outline-variant/30 md:border-b-0 pb-sm">
                        <span className="material-symbols-outlined text-primary text-[20px] mb-[2px]">work</span>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider leading-none">{language === "en" ? "Profession" : language === "hi" ? "व्यवसाय" : language === "mr" ? "व्यवसाय" : language === "kn" ? "ವೃತ್ತಿ" : "পেশা"}</p>
                        <p className="text-[11px] font-semibold text-on-surface mt-[2px] line-clamp-1">{attrs.profession}</p>
                      </div>
                      <div className="text-center p-xs border-b border-outline-variant/30 md:border-b-0 pb-sm">
                        <span className="material-symbols-outlined text-primary text-[20px] mb-[2px]">wc</span>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider leading-none">{language === "en" ? "Gender Focus" : language === "hi" ? "लिंग फोकस" : language === "mr" ? "लिंग" : language === "kn" ? "ಲಿಂಗ" : "লিঙ্গ"}</p>
                        <p className="text-[11px] font-semibold text-on-surface mt-[2px]">{attrs.gender}</p>
                      </div>
                      <div className="text-center p-xs border-r pt-sm">
                        <span className="material-symbols-outlined text-primary text-[20px] mb-[2px]">card_membership</span>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider leading-none">{language === "en" ? "Benefit Form" : language === "hi" ? "लाभ का रूप" : language === "mr" ? "मदत प्रकार" : language === "kn" ? "ಸಹಾಯದ ರೂಪ" : "সুবিধার ধরণ"}</p>
                        <p className="text-[11px] font-semibold text-on-surface mt-[2px]">{attrs.benefitType}</p>
                      </div>
                      <div className="text-center p-xs border-r pt-sm">
                        <span className="material-symbols-outlined text-primary text-[20px] mb-[2px]">savings</span>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider leading-none">{language === "en" ? "Income Limit" : language === "hi" ? "आय सीमा" : language === "mr" ? "उत्पन्न मर्यादा" : language === "kn" ? "ಆದಾಯ ಮಿತಿ" : "আয়ের সীমা"}</p>
                        <p className="text-[11px] font-semibold text-on-surface mt-[2px] line-clamp-1">{attrs.incomeLimit}</p>
                      </div>
                      <div className="text-center p-xs pt-sm">
                        <span className="material-symbols-outlined text-primary text-[20px] mb-[2px]">payments</span>
                        <p className="text-[9px] uppercase font-bold text-outline tracking-wider leading-none">{language === "en" ? "Coverage Max" : language === "hi" ? "अधिकतम कवरेज" : language === "mr" ? "कमाल संरक्षण" : language === "kn" ? "ಗರಿಷ್ಠ ವಿಮೆ" : "সর্বোচ্চ কভারেজ"}</p>
                        <p className="text-[11px] font-semibold text-on-surface mt-[2px] line-clamp-1">{attrs.coverageAmount}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Key Benefits Bullet points */}
              <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/60">
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined text-secondary text-[18px]">verified</span> {t("sc_key_benefits")}
                </h3>
                <div className="space-y-sm">
                  {activeDetailedScheme.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-sm">
                      <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5 select-none">
                        check_circle
                      </span>
                      <span className="font-body-md text-body-md text-on-surface">
                        {bullet}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typically Required Documents */}
              {activeDetailedScheme.requiredDocuments && activeDetailedScheme.requiredDocuments.length > 0 && (
                <div>
                  <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-sm flex items-center gap-xs">
                    <span className="material-symbols-outlined text-outline text-[18px]">folder_open</span> {t("sc_req_docs")}
                  </h3>
                  <ul className="grid grid-cols-1 gap-xs pl-sm text-body-sm text-on-surface-variant list-disc">
                    {activeDetailedScheme.requiredDocuments.map((doc, idx) => (
                      <li key={idx} className="leading-relaxed">{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trust/Reliability Meter */}
              <div className="bg-surface-container-low p-md rounded-xl flex items-center gap-md border border-outline-variant/40">
                <div className="w-14 h-14 relative flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-outline-variant/30"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="text-secondary transition-all duration-1000"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${activeDetailedScheme.reliability}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="absolute text-[12px] font-bold text-secondary">
                    {activeDetailedScheme.reliability}%
                  </span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">{language === "en" ? "Reliability Score: Verified" : language === "hi" ? "विश्वसनीयता स्कोर: सत्यापित" : language === "mr" ? "विश्वासार्हता: सत्यापित" : language === "kn" ? "ವಿಶ್ವಾಸಾರ್ಹತೆ ಸ್ಕೋರ್: ಪರಿಶೀಲಿಸಲಾಗಿದೆ" : "নির্ভরযোগ্যতা স্কোর: যাচাইকৃত"}</p>
                  <p className="text-[12px] text-on-surface-variant leading-tight">
                    {language === "en" ? "This program has a verified approval success rate based on community feedback." : language === "hi" ? "सामुदायिक प्रतिक्रिया के आधार पर इस कार्यक्रम की सत्यापित स्वीकृति सफलता दर है।" : language === "mr" ? "सामूहिक अभिप्रायाच्या आधारे या योजनेचा यश दर सत्यापित केला गेला आहे." : language === "kn" ? "ಸಮುದಾಯದ ಪ್ರತಿಕ್ರಿಯೆಯ ಆಧಾರದ ಮೇಲೆ ಈ ಯೋಜನೆಯು ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟ ಯಶಸ್ಸಿನ ಪ್ರಮಾಣವನ್ನು ಹೊಂದಿದೆ." : "সামাজিক প্রতিক্রিয়ার ভিত্তিতে এই প্রকল্পের যাচাইকৃত সাফল্যের হার রয়েছে।"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-md md:p-lg border-t border-outline-variant/40 bg-surface-container-low flex flex-col sm:flex-row gap-sm items-stretch">
              
              {/* Primary Action Buttons */}
              {activeDetailedScheme.links && activeDetailedScheme.links.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-sm w-full">
                  {activeDetailedScheme.links.map((link, idx) => {
                    const isOfficial = link.type === "official";
                    const isHospital = link.type === "hospitals";
                    const isEligibility = link.type === "eligibility";
                    const isGuide = link.type === "guide";

                    let btnClass = "flex-grow flex items-center justify-center gap-xs px-md py-3 rounded-xl font-label-md text-label-md transition-all active:scale-[0.98] shadow-sm ";
                    let iconName = "open_in_new";

                    if (isOfficial) {
                      btnClass += "bg-primary text-on-primary hover:bg-primary/95";
                      iconName = "language";
                    } else if (isEligibility) {
                      btnClass += "bg-secondary text-on-secondary hover:bg-secondary/95";
                      iconName = "check_box";
                    } else if (isHospital) {
                      btnClass += "bg-surface-container-lowest text-primary border border-primary hover:bg-surface-container-high";
                      iconName = "local_hospital";
                    } else if (isGuide) {
                      btnClass += "bg-error-container text-on-error-container hover:bg-error-container/90";
                      iconName = "video_library";
                    } else {
                      btnClass += "bg-surface-container-lowest text-on-surface-variant border border-outline hover:bg-surface-container-high";
                    }

                    return (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={btnClass}
                      >
                        <span className="material-symbols-outlined text-[18px]">{iconName}</span>
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center w-full py-2 font-label-sm text-outline text-[12px]">
                  {language === "en" ? "No external links configured for this offline program." : language === "hi" ? "इस ऑफ़लाइन कार्यक्रम के लिए कोई बाहरी लिंक कॉन्फ़िगर नहीं किया गया है।" : language === "mr" ? "या ऑफलाइन योजनेसाठी कोणतीही लिंक उपलब्ध नाही." : language === "kn" ? "ಈ ಆಫ್‌ಲೈನ್ ಯೋಜನೆಗಾಗಿ ಯಾವುದೇ ಬಾಹ್ಯ ಲಿಂಕ್‌ಗಳನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾಗಿಲ್ಲ." : "এই অফলাইন প্রকল্পের জন্য কোনো বাহ্যিক লিঙ্ক উপলব্ধ নেই।"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Detailed Insurance Drawer / Modal */}
      {activeDetailedInsurance && (
        <div className="fixed inset-0 z-50 flex justify-end transition-all duration-300">
          
          {/* Backdrop glassmorphic */}
          <div
            onClick={() => setActiveDetailedInsurance(null)}
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          />

          {/* Panel Container */}
          <div className="relative w-full max-w-2xl bg-surface-bright h-full shadow-2xl flex flex-col justify-between border-l border-outline-variant/40 animate-slide-in overflow-hidden">
            
            {/* Header */}
            <div className="p-md md:p-lg border-b border-outline-variant/40 flex justify-between items-start bg-surface-container-low">
              <div className="flex-grow pr-sm">
                <div className="flex items-center gap-sm mb-sm flex-wrap">
                  <span className="px-3 py-1 text-[12px] rounded-full font-label-sm bg-primary-container text-on-primary-container font-bold">
                    {activeDetailedInsurance.sector}
                  </span>
                  <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-[12px] font-semibold flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]">badge</span>
                    IRDAI Reg: {activeDetailedInsurance.regNumber}
                  </span>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[12px] font-semibold flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]">map</span>
                    HQ: {activeDetailedInsurance.hq.split(",")[0]}
                  </span>
                </div>
                <h2 className="font-headline-md text-headline-md text-primary leading-tight">
                  {activeDetailedInsurance.name}
                </h2>
              </div>
              <button
                onClick={() => setActiveDetailedInsurance(null)}
                className="p-2 hover:bg-surface-container-high rounded-full text-outline hover:text-on-surface transition-all flex items-center justify-center"
                aria-label="Close details"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Scrollable details container */}
            <div className="p-md md:p-lg overflow-y-auto flex-grow space-y-md custom-scrollbar">
              
              {/* Detailed Description */}
              <div>
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-xs">
                  About the Insurer
                </h3>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                  {activeDetailedInsurance.body}
                </p>

                {/* Grid stats comparing details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-xs bg-surface-container-low p-sm rounded-xl border border-outline-variant/40 mt-sm">
                  <div className="text-center p-xs border-r border-outline-variant/30 last:border-r-0">
                    <span className="material-symbols-outlined text-primary text-[20px] mb-[2px]">payments</span>
                    <p className="text-[10px] uppercase font-bold text-outline tracking-wider leading-none">Claim Ratio</p>
                    <p className="text-[12px] font-semibold text-on-surface mt-[2px]">{activeDetailedInsurance.reliability}%</p>
                  </div>
                  <div className="text-center p-xs border-r border-outline-variant/30 last:border-r-0">
                    <span className="material-symbols-outlined text-primary text-[20px] mb-[2px]">local_hospital</span>
                    <p className="text-[10px] uppercase font-bold text-outline tracking-wider leading-none">Cashless outlets</p>
                    <p className="text-[12px] font-semibold text-on-surface mt-[2px] line-clamp-1">{activeDetailedInsurance.networkHospitals}</p>
                  </div>
                  <div className="text-center p-xs border-r border-outline-variant/30 last:border-r-0">
                    <span className="material-symbols-outlined text-primary text-[20px] mb-[2px]">category</span>
                    <p className="text-[10px] uppercase font-bold text-outline tracking-wider leading-none">Regulated By</p>
                    <p className="text-[12px] font-semibold text-on-surface mt-[2px]">IRDAI Authority</p>
                  </div>
                  <div className="text-center p-xs">
                    <span className="material-symbols-outlined text-primary text-[20px] mb-[2px]">business</span>
                    <p className="text-[10px] uppercase font-bold text-outline tracking-wider leading-none">Registered HQ</p>
                    <p className="text-[12px] font-semibold text-on-surface mt-[2px] line-clamp-1">{activeDetailedInsurance.hq.split(",")[0]}</p>
                  </div>
                </div>
              </div>

              {/* Oncology Policy description */}
              <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/60">
                <div className="flex items-center gap-xs mb-sm">
                  <span className="material-symbols-outlined text-secondary text-[22px]">health_and_safety</span>
                  <h3 className="font-headline-sm text-[16px] text-secondary font-bold">
                    Primary Oncology Cover: {activeDetailedInsurance.primaryPolicy}
                  </h3>
                </div>
                <div className="space-y-sm">
                  {activeDetailedInsurance.policyFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-sm">
                      <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5 select-none">
                        check_circle
                      </span>
                      <span className="font-body-md text-body-md text-on-surface">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* IRDAI Official Contact Representative */}
              <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/60">
                <div className="flex items-center gap-xs mb-sm">
                  <span className="material-symbols-outlined text-primary text-[22px]">contact_phone</span>
                  <h3 className="font-headline-sm text-[16px] text-primary font-bold">
                    Official IRDAI Representative Contact
                  </h3>
                </div>
                <p className="text-body-sm text-on-surface-variant mb-md leading-relaxed">
                  Below are the official IRDAI-registered key contact details and grievance escalation channels for this company:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
                  <div className="bg-surface-container-lowest p-sm rounded-xl border border-outline-variant/40 flex items-start gap-xs">
                    <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">person</span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-outline tracking-wider leading-none">Principal Officer</p>
                      <p className="font-label-md text-label-md text-on-surface font-semibold mt-1">{activeDetailedInsurance.contactPerson}</p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-sm rounded-xl border border-outline-variant/40 flex items-start gap-xs">
                    <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">mail</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase font-bold text-outline tracking-wider leading-none">Official E-mail</p>
                      <a href={`mailto:${activeDetailedInsurance.contactEmail}`} className="font-label-md text-label-md text-primary font-semibold mt-1 hover:underline block truncate" title={activeDetailedInsurance.contactEmail}>
                        {activeDetailedInsurance.contactEmail}
                      </a>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-sm rounded-xl border border-outline-variant/40 flex items-start gap-xs">
                    <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">phone_in_talk</span>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-outline tracking-wider leading-none">Telephone Contact</p>
                      <a href={`tel:${activeDetailedInsurance.contactPhone}`} className="font-label-md text-label-md text-primary font-semibold mt-1 hover:underline block">
                        {activeDetailedInsurance.contactPhone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Required Documents checklist */}
              <div>
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-outline mb-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined text-outline text-[18px]">folder_open</span>
                  Step-by-Step Claim Filing Documents Checklist
                </h3>
                <p className="text-body-sm text-on-surface-variant mb-xs pl-1">
                  To file a cashless or reimbursement oncology claim with {activeDetailedInsurance.name}, keep the following checklist of official documents ready:
                </p>
                <ul className="grid grid-cols-1 gap-xs pl-sm text-body-sm text-on-surface-variant list-disc">
                  {activeDetailedInsurance.requiredDocuments.map((doc, idx) => (
                    <li key={idx} className="leading-relaxed">{doc}</li>
                  ))}
                </ul>
              </div>

              {/* Trust Claim settlement info */}
              <div className="bg-surface-container-low p-md rounded-xl flex items-center gap-md border border-outline-variant/40">
                <div className="w-14 h-14 relative flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-outline-variant/30"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="text-secondary transition-all duration-1000"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${activeDetailedInsurance.reliability}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="absolute text-[12px] font-bold text-secondary">
                    {activeDetailedInsurance.reliability}%
                  </span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">Claim Settlement Ratio: Verified</p>
                  <p className="text-[12px] text-on-surface-variant leading-tight">
                    This insurer has a verified settlement success rate of {activeDetailedInsurance.reliability}% under IRDAI auditing protocols.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-md md:p-lg border-t border-outline-variant/40 bg-surface-container-low flex items-stretch">
              <a
                href={activeDetailedInsurance.website}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-xs px-md py-3 rounded-xl font-label-md text-label-md transition-all active:scale-[0.98] shadow-sm bg-primary text-on-primary hover:bg-primary/95"
              >
                <span className="material-symbols-outlined text-[18px]">language</span>
                Check Policies on Official Portal
              </a>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

interface SchemeTileProps {
  scheme: Scheme;
  onViewDetails: () => void;
}

function SchemeTile({ scheme, onViewDetails }: SchemeTileProps) {
  const tagCls =
    scheme.tagTone === "tertiary-container"
      ? "bg-tertiary-container text-on-tertiary-container font-semibold"
      : "bg-surface-variant text-on-surface-variant font-semibold";

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
      
      {/* Top Banner section */}
      <div className="p-md border-b border-outline-variant/40 bg-surface-container-low flex justify-between items-center">
        <div className="bg-primary/5 p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined text-primary text-[22px]">{scheme.icon}</span>
        </div>
        <div className="flex gap-xs items-center">
          <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-[11px] ${tagCls}`}>
            {scheme.tag}
          </span>
          <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full text-[10px] font-medium flex items-center gap-[2px]">
            <span className="material-symbols-outlined text-[10px]">map</span>
            {scheme.state === "All India" ? "National" : scheme.state}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-md flex-grow flex flex-col justify-between">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary mb-xs group-hover:text-primary-container transition-colors line-clamp-2 min-h-[48px]">
            {scheme.title}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-xs line-clamp-3">
            {scheme.body}
          </p>

          {/* Dynamic Badges */}
          {(() => {
            const attrs = getSchemeAttributes(scheme);
            return (
              <div className="flex flex-wrap gap-xs mb-sm">
                <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-md text-[10px] font-medium flex items-center gap-[2px] select-none">
                  <span className="material-symbols-outlined text-[12px]">payments</span>
                  {attrs.benefitType}
                </span>
                {attrs.profession !== "General Public" && (
                  <span className="px-2 py-0.5 bg-secondary-container/20 text-on-secondary-container rounded-md text-[10px] font-medium flex items-center gap-[2px] select-none">
                    <span className="material-symbols-outlined text-[12px]">work</span>
                    {attrs.profession}
                  </span>
                )}
                {attrs.ageGroup !== "All Ages" && (
                  <span className="px-2 py-0.5 bg-tertiary-container/10 text-on-tertiary-container rounded-md text-[10px] font-medium flex items-center gap-[2px] select-none">
                    <span className="material-symbols-outlined text-[12px]">face</span>
                    {attrs.ageGroup}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-secondary-container/10 text-on-secondary-container rounded-md text-[10px] font-medium flex items-center gap-[2px] select-none">
                  <span className="material-symbols-outlined text-[12px]">currency_rupee</span>
                  {attrs.coverageAmount.split(" ")[0]}
                </span>
                {attrs.gender !== "General / All Genders" && (
                  <span className="px-2 py-0.5 bg-error-container/20 text-on-error-container rounded-md text-[10px] font-medium flex items-center gap-[2px] select-none">
                    <span className="material-symbols-outlined text-[12px]">wc</span>
                    {attrs.gender.split(" ")[0]}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Quick highlights */}
          <div className="space-y-xs mb-md border-t border-dashed border-outline-variant/40 pt-md">
            {scheme.bullets.slice(0, 2).map((b, idx) => (
              <div key={idx} className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-secondary text-[16px] flex-shrink-0 select-none">
                  check_circle
                </span>
                <span className="font-body-sm text-[12px] text-on-surface line-clamp-1">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reliability Score section */}
        <div>
          <div className="bg-surface-container-low p-2 rounded-xl flex items-center gap-sm mb-md">
            <div className="w-9 h-9 relative flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-outline-variant/30"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path
                  className="text-secondary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${scheme.reliability}, 100`}
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
              </svg>
              <span className="absolute text-[9px] font-bold text-secondary">
                {scheme.reliability}%
              </span>
            </div>
            <div>
              <p className="font-label-sm text-[11px] text-on-surface font-bold">Reliability Score</p>
              <p className="text-[10px] text-on-surface-variant/80 leading-none">Community verified</p>
            </div>
          </div>

          {/* CTA View details */}
          <button
            onClick={onViewDetails}
            className="w-full py-2.5 border border-primary text-primary rounded-xl font-label-md text-label-md hover:bg-primary/5 transition-all flex items-center justify-center gap-xs active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">launch</span> View Application Details
          </button>
        </div>
      </div>
    </div>
  );
}

interface InsuranceTileProps {
  insurance: Insurance;
  onViewDetails: () => void;
}

function InsuranceTile({ insurance, onViewDetails }: InsuranceTileProps) {
  const isStandalone = insurance.sector === "Standalone Health";
  const isPublic = insurance.sector === "Public Sector";
  
  const tagCls = isStandalone
    ? "bg-tertiary-container text-on-tertiary-container font-semibold"
    : isPublic
    ? "bg-primary-container text-on-primary-container font-semibold"
    : "bg-surface-variant text-on-surface-variant font-semibold";

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
      
      {/* Top Banner section */}
      <div className="p-md border-b border-outline-variant/40 bg-surface-container-low flex justify-between items-center">
        <div className="bg-primary/5 p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined text-primary text-[22px]">
            {isStandalone ? "star_rate" : isPublic ? "domain" : "business"}
          </span>
        </div>
        <div className="flex gap-xs items-center">
          <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-[11px] ${tagCls}`}>
            {insurance.sector}
          </span>
          <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full text-[10px] font-medium flex items-center gap-[2px]">
            <span className="material-symbols-outlined text-[10px]">badge</span>
            IRDAI Reg. {insurance.regNumber}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-md flex-grow flex flex-col justify-between">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary mb-xs group-hover:text-primary-container transition-colors line-clamp-2 min-h-[48px]">
            {insurance.name}
          </h3>
          <p className="text-[11px] text-outline font-bold uppercase tracking-wider mb-xs">
            HQ: {insurance.hq}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-sm line-clamp-3">
            {insurance.body}
          </p>

          {/* Primary Oncology Policy Card */}
          <div className="bg-surface-container-low p-sm rounded-xl border border-outline-variant/40 mb-md">
            <div className="flex items-center gap-xs mb-1">
              <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary leading-none">Primary Cancer Cover</p>
            </div>
            <p className="font-label-md text-label-md text-on-surface font-semibold line-clamp-1">{insurance.primaryPolicy}</p>
          </div>

          {/* Policy Highlights */}
          <div className="space-y-xs mb-md border-t border-dashed border-outline-variant/40 pt-md">
            {insurance.policyFeatures.slice(0, 2).map((feat, idx) => (
              <div key={idx} className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-secondary text-[16px] flex-shrink-0 select-none">
                  check_circle
                </span>
                <span className="font-body-sm text-[12px] text-on-surface line-clamp-1">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Network & Reliability Section */}
        <div>
          <div className="bg-surface-container-low p-2 rounded-xl flex justify-between items-center mb-md border border-outline-variant/40">
            <div className="flex items-center gap-sm">
              <div className="bg-secondary/10 p-1.5 rounded-lg">
                <span className="material-symbols-outlined text-secondary text-[18px]">local_hospital</span>
              </div>
              <div>
                <p className="font-label-sm text-[10px] text-outline font-bold leading-none">Cashless Network</p>
                <p className="text-[12px] text-on-surface font-semibold leading-normal">
                  {insurance.networkSize > 0 ? insurance.networkHospitals.split(" ")[0] : "Reimbursement"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-xs pr-1">
              <span className="material-symbols-outlined text-tertiary text-[18px]">percent</span>
              <div>
                <p className="font-label-sm text-[10px] text-outline font-bold leading-none">Claim Ratio</p>
                <p className="text-[12px] text-on-surface font-semibold leading-normal">{insurance.reliability}%</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onViewDetails}
            className="w-full py-2.5 border border-primary text-primary rounded-xl font-label-md text-label-md hover:bg-primary/5 transition-all flex items-center justify-center gap-xs active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">launch</span> View Policy & Claim Guide
          </button>
        </div>
      </div>
    </div>
  );
}
