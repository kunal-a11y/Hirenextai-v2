import { createTransport } from "nodemailer";

interface JobForEmail {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  skills?: string[];
  isFresher?: boolean;
  isRemote?: boolean;
  matchScore?: number;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return "";
  const toL = (n: number) => `₹${(n / 100000).toFixed(1)}L`;
  if (min && max) return `${toL(min)} – ${toL(max)} PA`;
  if (min) return `From ${toL(min)} PA`;
  return `Up to ${toL(max!)} PA`;
}

function scoreLabel(score: number): string {
  if (score >= 75) return "🟢 Excellent Match";
  if (score >= 50) return "🟡 Good Match";
  return "🔵 Possible Match";
}

function buildJobAlertEmail(
  userName: string,
  jobs: JobForEmail[],
  frequency: string,
  unsubscribeUrl: string,
): { subject: string; html: string; text: string } {
  const period = frequency === "weekly" ? "this week" : "today";
  const subject = `🎯 ${jobs.length} new job match${jobs.length > 1 ? "es" : ""} for you – HirenextAI`;

  const jobCards = jobs.map(j => {
    const salary = formatSalary(j.salaryMin, j.salaryMax);
    const matchLabel = j.matchScore ? scoreLabel(j.matchScore) : "";
    const topSkills = (j.skills ?? []).slice(0, 4).join(" · ");
    return `
    <div style="border:1px solid #2d2d50;border-radius:12px;padding:16px 20px;margin-bottom:12px;background:#16162a;">
      ${matchLabel ? `<p style="margin:0 0 6px;font-size:12px;color:#a78bfa;font-weight:600;">${matchLabel}</p>` : ""}
      <h3 style="margin:0 0 4px;font-size:16px;color:#ffffff;font-weight:700;">${j.title}</h3>
      <p style="margin:0 0 4px;font-size:14px;color:#9ca3af;">${j.company} · ${j.location}${j.isRemote ? " · Remote" : ""}</p>
      ${salary ? `<p style="margin:0 0 6px;font-size:13px;color:#34d399;font-weight:600;">${salary}</p>` : ""}
      ${j.isFresher ? `<span style="display:inline-block;padding:2px 8px;border-radius:20px;background:#1e3a5f;color:#60a5fa;font-size:11px;font-weight:600;margin-bottom:6px;">🎓 Fresher Friendly</span>` : ""}
      ${topSkills ? `<p style="margin:6px 0 0;font-size:12px;color:#6b7280;">${topSkills}</p>` : ""}
    </div>`;
  }).join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;">HirenextAI</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">Your AI-Powered Career Assistant</p>
    </div>

    <!-- Main card -->
    <div style="background:#0f0f1a;border:1px solid #1f1f3a;border-radius:16px;padding:28px 24px;">
      <h2 style="margin:0 0 6px;font-size:20px;color:#ffffff;font-weight:700;">
        Hi ${userName} 👋
      </h2>
      <p style="margin:0 0 20px;font-size:15px;color:#9ca3af;line-height:1.6;">
        We found <strong style="color:#a78bfa;">${jobs.length} new job${jobs.length > 1 ? "s" : ""}</strong> matching your preferences ${period}. Here are your top picks:
      </p>

      ${jobCards}

      <div style="text-align:center;margin-top:24px;">
        <a href="https://hirenextai.replit.app/dashboard/jobs" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
          View All Jobs →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:12px;color:#4b5563;line-height:1.6;">
        You're receiving this because you have job alerts enabled on HirenextAI.<br>
        <a href="${unsubscribeUrl}" style="color:#6366f1;text-decoration:underline;">Manage alerts</a> or unsubscribe.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Hi ${userName},\n\nWe found ${jobs.length} new job(s) matching your preferences ${period}:\n\n${
    jobs.map(j => `• ${j.title} at ${j.company} (${j.location})`).join("\n")
  }\n\nView all jobs: https://hirenextai.replit.app/dashboard/jobs\n\nManage your alerts: ${unsubscribeUrl}`;

  return { subject, html, text };
}

export async function sendJobAlertEmail(
  to: string,
  userName: string,
  jobs: JobForEmail[],
  frequency: string,
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[EmailService] SMTP not configured — skipping email to ${to}`);
    return false;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@hirenextai.com";
  const unsubscribeUrl = "https://hirenextai.replit.app/dashboard/job-alerts";
  const { subject, html, text } = buildJobAlertEmail(userName, jobs, frequency, unsubscribeUrl);

  try {
    await transporter.sendMail({ from, to, subject, html, text });
    console.log(`[EmailService] Job alert sent to ${to} (${jobs.length} jobs)`);
    return true;
  } catch (err: any) {
    console.error(`[EmailService] Failed to send to ${to}: ${err.message}`);
    return false;
  }
}
