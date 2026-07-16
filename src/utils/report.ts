// Builds a self-contained, printable HTML report from the data Artham has
// saved locally (intake profile, extracted diagnosis / next steps, evidence
// vault). Opens it in a new window and triggers the browser's print dialog so
// the user can save it as a PDF. Falls back to downloading an .html file if the
// print window is blocked.

type VaultFileLike = {
  name?: string;
  category?: string;
  date?: string;
  amount?: string;
  notes?: string;
};

const get = (key: string, fallback = "Not specified") => {
  const v = localStorage.getItem(key);
  return v && v.trim() ? v : fallback;
};

const readJson = <T,>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function buildReportHtml(): string {
  const name = get("artham_user_name", "Guest");
  const hasIns = localStorage.getItem("artham_intake_has_insurance") !== "false";
  const provider = localStorage.getItem("artham_intake_insurance_provider");
  const insurance = hasIns ? provider || "Insured (details pending)" : "No Insurance";

  const profile: [string, string][] = [
    ["State", get("artham_intake_state")],
    ["Age", get("artham_intake_age")],
    ["Cancer Stage", get("artham_intake_stage")],
    ["HER2 / Hormone Status", get("artham_intake_hormone_status")],
    ["Surgery Planned", get("artham_intake_surgery")],
    ["Chemotherapy Planned", get("artham_intake_chemo")],
    ["Radiation Planned", get("artham_intake_radiation")],
    ["Hospital Type", get("artham_intake_hospital_type")],
    ["Insurance Status", insurance],
    ["Household Income", get("artham_intake_income_bracket")],
  ];

  const diagnosis = localStorage.getItem("artham_chatbot_diagnosis_details") || "";
  const nextSteps = localStorage.getItem("artham_chatbot_next_steps") || "";
  const vault = readJson<VaultFileLike[]>("artham_vault_files", []);

  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const profileRows = profile
    .map(
      ([k, v]) =>
        `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`
    )
    .join("");

  const vaultRows = vault.length
    ? vault
        .map(
          (f) =>
            `<tr><td>${esc(f.name || "Document")}</td><td>${esc(f.category || "—")}</td><td>${esc(
              f.date || "—"
            )}</td><td>${esc(f.amount ? "₹" + f.amount : "—")}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="4" class="muted">No documents uploaded yet.</td></tr>`;

  const section = (title: string, body: string) =>
    body ? `<section><h2>${esc(title)}</h2><p>${esc(body)}</p></section>` : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Artham Care Report — ${esc(name)}</title>
<style>
  :root { --coral: #e2725b; --ink: #2b2430; --muted: #7a7280; --line: #ece6ee; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: var(--ink); margin: 0; padding: 40px; background: #fff; }
  .wrap { max-width: 760px; margin: 0 auto; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid var(--coral); padding-bottom: 16px; margin-bottom: 24px; }
  .brand { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: var(--coral); }
  .brand small { display:block; font-size: 12px; font-weight: 600; color: var(--muted); letter-spacing: 0; }
  .meta { text-align: right; font-size: 12px; color: var(--muted); }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--coral); margin: 28px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
  tbody tr th { width: 42%; color: var(--muted); font-weight: 600; }
  .docs th { background: #faf7fb; color: var(--muted); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  p { font-size: 13px; line-height: 1.6; }
  .muted { color: var(--muted); }
  .disclaimer { margin-top: 32px; padding: 14px 16px; background: #faf7fb; border: 1px solid var(--line); border-radius: 10px; font-size: 11px; color: var(--muted); line-height: 1.5; }
  @media print { body { padding: 0; } @page { margin: 18mm; } }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">Artham<small>Cancer-care cost navigator</small></div>
      <div class="meta">Care Report<br/>Prepared for: <strong>${esc(name)}</strong><br/>${esc(today)}</div>
    </header>

    <h1>Patient Profile</h1>
    <table><tbody>${profileRows}</tbody></table>

    ${section("Diagnosis Details", diagnosis)}
    ${section("Recommended Next Steps", nextSteps)}

    <h2>Evidence Vault</h2>
    <table class="docs">
      <thead><tr><th>Document</th><th>Category</th><th>Date</th><th>Amount</th></tr></thead>
      <tbody>${vaultRows}</tbody>
    </table>

    <div class="disclaimer">
      This report is generated by Artham from the information you provided for financial-navigation
      support only. It is not medical advice and is not a substitute for consultation with a qualified
      oncologist. Cost figures are estimates and may vary by hospital, region and treatment plan.
    </div>
  </div>
</body>
</html>`;
}

export function downloadReport() {
  const html = buildReportHtml();
  const printWindow = window.open("", "_blank");

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Give the new document a tick to render before invoking print.
    setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        /* user can still print manually */
      }
    }, 400);
    return;
  }

  // Popup blocked — fall back to a direct file download.
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "artham-care-report.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
