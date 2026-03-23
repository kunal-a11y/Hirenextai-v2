import { db, jobsTable } from "@workspace/db";
import { eq, and, like, or, sql, lt, desc } from "drizzle-orm";

/* ─── Normalised live job shape ─────────────────────────────────────────── */
export interface LiveJob {
  id: number;
  title: string;
  company: string;
  companyLogoUrl: string | null;
  location: string;
  isRemote: boolean;
  isFresher: boolean;
  type: string;
  category: string;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requirements: string[];
  skills: string[];
  applicationCount: number;
  experienceYears: number | null;
  source: string;
  applyUrl: string | null;
  postedAt: string;
  relevanceScore?: number;
}

/* ─── Fetch log (in-memory) ─────────────────────────────────────────────── */
export interface FetchLogEntry {
  source: string;
  fetched: number;
  errors: string[];
  lastFetchedAt: string;
  status: "ok" | "error" | "partial";
}

const fetchLog = new Map<string, FetchLogEntry>();

function logFetch(source: string, count: number, error?: string) {
  const existing = fetchLog.get(source);
  fetchLog.set(source, {
    source,
    fetched: error ? (existing?.fetched ?? 0) : count,
    errors: error ? [...(existing?.errors ?? []).slice(-2), error] : [],
    lastFetchedAt: new Date().toISOString(),
    status: error ? "error" : count > 0 ? "ok" : "partial",
  });
}

export function getFetchLog(): FetchLogEntry[] {
  return Array.from(fetchLog.values());
}

/* ─── Simple in-memory cache ─────────────────────────────────────────────── */
interface CacheEntry { jobs: LiveJob[]; ts: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function getCached(key: string): LiveJob[] | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.jobs;
  cache.delete(key);
  return null;
}
function setCached(key: string, jobs: LiveJob[]) {
  cache.set(key, { jobs, ts: Date.now() });
}

/* ─── Keyword expansion map ─────────────────────────────────────────────── */
const KEYWORD_EXPANSIONS: Record<string, string[]> = {
  cs: ["cyber security jobs india", "computer science jobs india", "it support fresher india", "network engineer india", "soc analyst india"],
  cyber: ["cyber security jobs india", "network security india", "information security analyst india", "ethical hacking india", "penetration tester india"],
  security: ["cyber security jobs india", "network security engineer india", "information security india", "security analyst india"],
  ai: ["machine learning engineer india", "data analyst fresher india", "python developer india", "data science india", "ai engineer india"],
  ml: ["machine learning engineer india", "deep learning jobs india", "data scientist india", "python ml developer india", "nlp engineer india"],
  "data science": ["data scientist india", "data analyst india", "machine learning india", "python data india", "business analyst india"],
  data: ["data analyst india", "data scientist india", "data engineer india", "sql developer india", "business analyst india"],
  bca: ["software developer fresher india", "web developer bca india", "technical support india", "qa tester fresher india", "it internship bca india"],
  mca: ["software developer mca india", "java developer india", "python developer india", "system analyst india", "software engineer mca india"],
  fresher: ["fresher software developer india", "entry level it jobs india", "internship it india", "graduate trainee india", "fresher developer india"],
  intern: ["internship software developer india", "fresher it jobs india", "trainee developer india", "engineering intern india", "it intern fresher india"],
  "entry level": ["fresher software developer india", "entry level developer india", "junior developer india", "graduate software engineer india"],
  devops: ["devops engineer india", "cloud engineer india", "kubernetes engineer india", "site reliability engineer india", "aws devops india"],
  cloud: ["cloud engineer india", "aws developer india", "devops engineer india", "azure cloud india", "gcp engineer india"],
  web: ["web developer india", "frontend developer india", "react developer india", "full stack developer india", "javascript developer india"],
  frontend: ["frontend developer india", "react developer india", "javascript developer india", "ui developer india", "angular developer india"],
  backend: ["backend developer india", "nodejs developer india", "java developer india", "python backend india", "api developer india"],
  fullstack: ["full stack developer india", "mern stack developer india", "mean stack india", "web developer india"],
  "full stack": ["full stack developer india", "mern stack developer india", "react node developer india"],
  java: ["java developer india", "spring boot developer india", "j2ee developer india", "java fresher india", "java backend india"],
  python: ["python developer india", "django developer india", "flask developer india", "data science python india", "python fresher india"],
  react: ["react developer india", "frontend developer india", "javascript react india", "ui developer react india"],
  node: ["nodejs developer india", "backend developer india", "express developer india", "full stack node india"],
  angular: ["angular developer india", "frontend developer india", "typescript developer india"],
  sql: ["sql developer india", "database administrator india", "data analyst sql india", "mysql developer india", "pl sql india"],
  database: ["database administrator india", "sql developer india", "mongodb developer india", "postgresql developer india"],
  network: ["network engineer india", "network administrator india", "ccna jobs india", "it infrastructure india", "network support india"],
  hr: ["hr executive india", "recruiter india", "talent acquisition india", "human resources manager india", "hr fresher india"],
  finance: ["finance jobs india", "accountant india", "financial analyst india", "ca jobs india", "finance fresher india"],
  account: ["accountant india", "tally accountant india", "financial analyst india", "accounts executive india"],
  marketing: ["digital marketing india", "seo executive india", "social media marketing india", "content marketing india"],
  "digital marketing": ["digital marketing executive india", "seo specialist india", "social media manager india", "performance marketing india"],
  seo: ["seo executive india", "digital marketing seo india", "content writer seo india", "search engine optimization india"],
  design: ["ui ux designer india", "graphic designer india", "web designer india", "product designer india", "figma designer india"],
  "ui ux": ["ui ux designer india", "product designer india", "figma designer india", "interaction designer india"],
  sales: ["sales executive india", "business development india", "inside sales india", "bdm india", "sales fresher india"],
  testing: ["qa tester india", "software tester india", "test engineer india", "automation tester india", "qa fresher india"],
  qa: ["qa engineer india", "software tester india", "automation testing india", "quality assurance india"],
  mobile: ["android developer india", "ios developer india", "flutter developer india", "react native developer india"],
  android: ["android developer india", "kotlin developer india", "java android india", "mobile developer india"],
  ios: ["ios developer india", "swift developer india", "objective c developer india", "react native ios india"],
  flutter: ["flutter developer india", "dart developer india", "mobile app developer india", "cross platform developer india"],
  blockchain: ["blockchain developer india", "web3 developer india", "solidity developer india", "smart contract india"],
  game: ["game developer india", "unity developer india", "unreal engine india", "c++ game developer india"],
  embedded: ["embedded systems engineer india", "firmware developer india", "iot engineer india", "c developer embedded india"],
  iot: ["iot developer india", "embedded systems india", "raspberry pi developer india", "arduino developer india"],
  government: ["government jobs india", "psu jobs india", "ssc jobs india", "bank jobs india", "upsc jobs india"],
  bank: ["banking jobs india", "bank po india", "bank clerk india", "finance banking india"],
};

/* ─── Related categories map ────────────────────────────────────────────── */
const RELATED_CATEGORIES: Record<string, string[]> = {
  cs: ["Cyber Security", "IT Support", "Engineering", "DevOps", "Internship"],
  cyber: ["Cyber Security", "IT Support", "DevOps", "Engineering"],
  ai: ["AI/ML", "Data Science", "Engineering", "Internship"],
  ml: ["AI/ML", "Data Science", "Engineering"],
  bca: ["IT Support", "Engineering", "Internship", "Data Entry"],
  mca: ["Engineering", "IT Support", "Data Science", "Internship"],
  fresher: ["Internship", "Engineering", "IT Support", "Data Entry"],
  intern: ["Internship", "Engineering", "IT Support"],
  devops: ["DevOps", "Engineering", "AI/ML"],
  cloud: ["DevOps", "Engineering", "AI/ML"],
  web: ["Engineering", "Design", "Product"],
  data: ["Data Science", "AI/ML", "Engineering", "Finance"],
  network: ["IT Support", "Cyber Security", "DevOps", "Engineering"],
  hr: ["HR", "Sales", "Finance"],
  finance: ["Finance", "Data Science", "Sales"],
  marketing: ["Digital Marketing", "Sales", "Design"],
  design: ["Design", "Engineering", "Product"],
  sales: ["Sales", "HR", "Digital Marketing"],
  testing: ["Engineering", "DevOps", "IT Support"],
  mobile: ["Engineering", "Design", "Product"],
  government: ["Government", "Finance", "HR"],
};

function getRelatedCategories(search: string): string[] {
  if (!search) return [];
  const s = search.toLowerCase().trim();
  for (const [key, cats] of Object.entries(RELATED_CATEGORIES)) {
    if (s.includes(key) || key.includes(s)) return cats;
  }
  return ["Engineering", "IT Support", "Internship"];
}

/* ─── Expand search keyword into multiple queries ───────────────────────── */
function expandKeywords(search: string): { queries: string[]; expandedTerms: string[] } {
  const s = search.toLowerCase().trim();
  for (const [key, expansions] of Object.entries(KEYWORD_EXPANSIONS)) {
    if (s === key || s.includes(key) || key.includes(s)) {
      return { queries: expansions, expandedTerms: expansions.map(e => e.replace(" jobs india", "").replace(" india", "").trim()) };
    }
  }
  return { queries: [`${s} jobs india`], expandedTerms: [] };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const INDIA_LOCATIONS = [
  "bangalore", "bengaluru", "hyderabad", "pune", "mumbai", "delhi", "chennai",
  "gurgaon", "gurugram", "noida", "kolkata", "ahmedabad", "india",
];

function isIndiaOrRemote(location: string, isRemote: boolean): boolean {
  if (isRemote) return true;
  const l = location.toLowerCase();
  return INDIA_LOCATIONS.some(loc => l.includes(loc));
}

function normalizeType(raw: string): string {
  const t = raw.toLowerCase().replace(/[_\-\s]+/g, "");
  if (t.includes("parttime") || t.includes("part")) return "part-time";
  if (t.includes("intern")) return "internship";
  if (t.includes("contract") || t.includes("freelance")) return "freelance";
  return "full-time";
}

const CATEGORY_KEYWORDS: Array<{ keywords: string[]; category: string }> = [
  { keywords: ["cyber security", "cybersecurity", "infosec", "network security", "ethical hacking", "penetration", "soc analyst"], category: "Cyber Security" },
  { keywords: ["machine learning", "deep learning", "nlp", "llm", "artificial intelligence", " ai ", "ml engineer"], category: "AI/ML" },
  { keywords: ["data scientist", "data science", "data analyst", "analytics"], category: "Data Science" },
  { keywords: ["devops", "devsecops", "kubernetes", "docker", "ci/cd", "site reliability", "sre"], category: "DevOps" },
  { keywords: ["digital marketing", "seo", "sem", "ppc", "social media marketing", "content marketi"], category: "Digital Marketing" },
  { keywords: ["data entry", "typing", "back office", "back-office"], category: "Data Entry" },
  { keywords: ["sales executive", "business development", "bdm", "sales manager", "inside sales"], category: "Sales" },
  { keywords: ["hr executive", "human resource", "recruiter", "talent acquisition", "hr manager"], category: "HR" },
  { keywords: ["finance", "accountant", "ca ", "chartered accountant", "cpa", "financial analyst", "bookkeeping"], category: "Finance" },
  { keywords: ["bca", "mca", "it support", "technical support", "helpdesk", "system admin", "desktop support"], category: "IT Support" },
  { keywords: ["government", "psu", "upsc", "ssc", "naukri sarkari", "public sector"], category: "Government" },
  { keywords: ["product manager", "product management", "product owner", "scrum master"], category: "Product" },
  { keywords: ["graphic design", "ui designer", "ux designer", "figma", "design"], category: "Design" },
  { keywords: ["intern", "internship", "trainee", "fresher", "entry level", "entry-level", "0 experience", "0-1 year"], category: "Internship" },
];

function detectCategory(title: string, description: string, skills: string[]): string {
  const text = `${title} ${description} ${skills.join(" ")}`.toLowerCase();
  for (const { keywords, category } of CATEGORY_KEYWORDS) {
    if (keywords.some(kw => text.includes(kw))) return category;
  }
  return "Engineering";
}

function isFresherJob(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return ["fresher", "entry level", "entry-level", "0 experience", "0-1 year", "0 to 1", "fresh graduate"].some(kw => text.includes(kw));
}

function extractSkills(title: string, description: string, rawTags: string[]): string[] {
  const tech = [
    "React", "Node.js", "Python", "Java", "TypeScript", "JavaScript", "Go", "Rust",
    "Angular", "Vue.js", "Django", "FastAPI", "Spring Boot", "PostgreSQL", "MySQL",
    "MongoDB", "Redis", "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Git",
    "Elasticsearch", "Kafka", "GraphQL", "REST", "Figma", "Sketch", "Tailwind",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy",
    "SQL", "Excel", "Power BI", "Tableau", "Salesforce", "SAP", "Linux",
    "Cyber Security", "Penetration Testing", "Nmap", "Wireshark", "Metasploit",
    "Digital Marketing", "SEO", "Google Ads", "HubSpot", "CRM",
    "HR", "Payroll", "Recruitment", "HRMS", "Finance", "Tally", "GST",
    "Flutter", "Kotlin", "Swift", "Unity", "C++", "Embedded", "IoT",
    "Blockchain", "Web3", "Solidity", "Selenium", "Cypress", "Jira",
  ];
  const text = `${title} ${description}`.toLowerCase();
  const found = tech.filter(s => text.includes(s.toLowerCase()));
  const cleaned = [...new Set([...rawTags.filter(t => t && t.length < 30), ...found])].slice(0, 8);
  return cleaned.length > 0 ? cleaned : ["General"];
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ─── Relevance Scoring ──────────────────────────────────────────────────── */
function scoreJob(job: LiveJob, searchTerms: string[], userLocation?: string): number {
  let score = 0;
  const daysOld = (Date.now() - new Date(job.postedAt).getTime()) / 86400000;
  score += Math.max(0, 40 - daysOld * 1.5);
  if (job.isRemote) score += 10;
  if (userLocation) {
    const loc = userLocation.toLowerCase();
    if (job.location.toLowerCase().includes(loc)) score += 20;
  }
  for (const term of searchTerms) {
    const t = term.toLowerCase();
    if (job.title.toLowerCase().includes(t)) score += 20;
    else if (job.description.toLowerCase().includes(t)) score += 5;
    if (job.skills.some(s => s.toLowerCase().includes(t))) score += 8;
    if (job.category.toLowerCase().includes(t)) score += 10;
  }
  const sourceBonus: Record<string, number> = {
    JSearch: 6, Adzuna: 5, Jooble: 5, Remotive: 4, Arbeitnow: 3, Database: 1,
  };
  score += sourceBonus[job.source] ?? 0;
  if (searchTerms.some(t => ["fresher", "intern", "entry", "bca", "mca"].includes(t)) && job.isFresher) {
    score += 15;
  }
  return score;
}

/* ─── API Fetchers ───────────────────────────────────────────────────────── */

async function fetchArbeitnow(): Promise<LiveJob[]> {
  const url = `https://www.arbeitnow.com/api/job-board-api?page=1`;
  try {
    const resp = await fetchWithTimeout(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json: any = await resp.json();
    const items: any[] = json.data ?? [];
    const jobs = items
      .filter(j => isIndiaOrRemote(j.location ?? "", !!j.remote))
      .slice(0, 30)
      .map((j) => {
        const title = j.title ?? "Job";
        const desc = j.description ?? "";
        const tags: string[] = j.tags ?? [];
        const skills = extractSkills(title, desc, tags);
        return {
          id: 0, title, company: j.company_name ?? "Unknown",
          companyLogoUrl: null, location: j.location ?? "Remote",
          isRemote: !!j.remote, isFresher: isFresherJob(title, desc),
          type: j.job_types?.[0] ? normalizeType(j.job_types[0]) : "full-time",
          category: detectCategory(title, desc, skills),
          salaryMin: null, salaryMax: null,
          description: desc.slice(0, 1000), requirements: [],
          skills, applicationCount: 0, experienceYears: null,
          source: "Arbeitnow", applyUrl: j.url ?? null,
          postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : new Date().toISOString(),
        } as LiveJob;
      });
    logFetch("Arbeitnow", jobs.length);
    return jobs;
  } catch (e: any) {
    logFetch("Arbeitnow", 0, e.message);
    return [];
  }
}

async function fetchRemotive(query: string): Promise<LiveJob[]> {
  const q = encodeURIComponent(query || "developer");
  const url = `https://remotive.com/api/remote-jobs?search=${q}&limit=25`;
  try {
    const resp = await fetchWithTimeout(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json: any = await resp.json();
    const items: any[] = json.jobs ?? [];
    const jobs = items.slice(0, 25).map((j) => {
      const title = j.title ?? "Job";
      const desc = (j.description ?? "").replace(/<[^>]*>/g, " ").slice(0, 1000);
      const tags: string[] = j.tags ?? [];
      const skills = extractSkills(title, desc, tags);
      return {
        id: 0, title, company: j.company_name ?? "Unknown",
        companyLogoUrl: j.company_logo ?? null,
        location: "Remote (India Eligible)", isRemote: true,
        isFresher: isFresherJob(title, desc),
        type: normalizeType(j.job_type ?? "full-time"),
        category: detectCategory(title, desc, skills),
        salaryMin: null, salaryMax: null,
        description: desc, requirements: [],
        skills, applicationCount: 0, experienceYears: null,
        source: "Remotive", applyUrl: j.url ?? null,
        postedAt: j.publication_date ? new Date(j.publication_date).toISOString() : new Date().toISOString(),
      } as LiveJob;
    });
    logFetch("Remotive", jobs.length);
    return jobs;
  } catch (e: any) {
    logFetch("Remotive", 0, e.message);
    return [];
  }
}

async function fetchJSearch(query: string): Promise<LiveJob[]> {
  const apiKey = process.env["RAPID_API_KEY"];
  if (!apiKey) { logFetch("JSearch", 0, "No RAPID_API_KEY"); return []; }
  const q = encodeURIComponent(`${query} india`);
  const url = `https://jsearch.p.rapidapi.com/search?query=${q}&num_pages=1&country=in&date_posted=month`;
  try {
    const resp = await fetchWithTimeout(url, {
      headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "jsearch.p.rapidapi.com" },
    }, 12000);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json: any = await resp.json();
    const items: any[] = json.data ?? [];
    const jobs = items
      .filter(j => isIndiaOrRemote(j.job_city ?? j.job_country ?? "", !!j.job_is_remote))
      .slice(0, 20)
      .map((j) => {
        const title = j.job_title ?? "Job";
        const desc = j.job_description ?? "";
        const highlight = j.job_highlights ?? {};
        const requirements: string[] = highlight.Qualifications ?? [];
        const skills = extractSkills(title, desc, j.job_required_skills ?? []);
        const location = j.job_is_remote ? "Remote" : `${j.job_city ?? ""}${j.job_city && j.job_country ? ", " : ""}${j.job_country ?? "India"}`.trim();
        return {
          id: 0, title, company: j.employer_name ?? "Unknown",
          companyLogoUrl: j.employer_logo ?? null,
          location, isRemote: !!j.job_is_remote,
          isFresher: isFresherJob(title, desc),
          type: normalizeType(j.job_employment_type ?? "full-time"),
          category: detectCategory(title, desc, skills),
          salaryMin: j.job_min_salary ?? null,
          salaryMax: j.job_max_salary ?? null,
          description: desc.slice(0, 1000), requirements: requirements.slice(0, 5),
          skills, applicationCount: 0,
          experienceYears: null,
          source: "JSearch", applyUrl: j.job_apply_link ?? null,
          postedAt: j.job_posted_at_datetime_utc ?? new Date().toISOString(),
        } as LiveJob;
      });
    logFetch("JSearch", jobs.length);
    return jobs;
  } catch (e: any) {
    logFetch("JSearch", 0, e.message);
    return [];
  }
}

async function fetchAdzuna(query: string, location: string): Promise<LiveJob[]> {
  const appId = process.env["ADZUNA_APP_ID"];
  const appKey = process.env["ADZUNA_APP_KEY"];
  if (!appId || !appKey) { logFetch("Adzuna", 0, "No ADZUNA credentials"); return []; }
  const q = encodeURIComponent(query);
  const loc = encodeURIComponent(location || "india");
  const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=25&what=${q}&where=${loc}&content-type=application/json`;
  try {
    const resp = await fetchWithTimeout(url, {}, 12000);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json: any = await resp.json();
    const items: any[] = json.results ?? [];
    const jobs = items.slice(0, 25).map((j) => {
      const title = j.title ?? "Job";
      const desc = (j.description ?? "").slice(0, 1000);
      const skills = extractSkills(title, desc, j.category?.label ? [j.category.label] : []);
      const loc = `${j.location?.area?.slice(-1)?.[0] ?? "India"}`;
      let salaryMin: number | null = null;
      let salaryMax: number | null = null;
      if (j.salary_min) salaryMin = Math.round(Number(j.salary_min));
      if (j.salary_max) salaryMax = Math.round(Number(j.salary_max));
      return {
        id: 0, title, company: j.company?.display_name ?? "Unknown",
        companyLogoUrl: null,
        location: loc, isRemote: false,
        isFresher: isFresherJob(title, desc),
        type: normalizeType(j.contract_time ?? "full-time"),
        category: detectCategory(title, desc, skills),
        salaryMin, salaryMax,
        description: desc, requirements: [],
        skills, applicationCount: 0, experienceYears: null,
        source: "Adzuna", applyUrl: j.redirect_url ?? null,
        postedAt: j.created ?? new Date().toISOString(),
      } as LiveJob;
    });
    logFetch("Adzuna", jobs.length);
    return jobs;
  } catch (e: any) {
    logFetch("Adzuna", 0, e.message);
    return [];
  }
}

async function fetchJooble(query: string, location: string): Promise<LiveJob[]> {
  const apiKey = process.env["JOOBLE_API_KEY"];
  if (!apiKey) { logFetch("Jooble", 0, "No JOOBLE_API_KEY"); return []; }
  const url = `https://jooble.org/api/${apiKey}`;
  try {
    const resp = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: query, location: location || "India", page: 1 }),
    }, 12000);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json: any = await resp.json();
    const items: any[] = json.jobs ?? [];
    const jobs = items
      .filter(j => isIndiaOrRemote(j.location ?? "", false))
      .slice(0, 25)
      .map((j) => {
        const title = j.title ?? "Job";
        const desc = (j.snippet ?? "").replace(/<[^>]*>/g, " ").slice(0, 1000);
        const skills = extractSkills(title, desc, []);
        let salaryMin: number | null = null;
        let salaryMax: number | null = null;
        if (j.salary) {
          const nums = String(j.salary).replace(/[^0-9.,-]/g, "").split(/[-,]/);
          if (nums[0]) salaryMin = Math.round(parseFloat(nums[0]) * 100) || null;
          if (nums[1]) salaryMax = Math.round(parseFloat(nums[1]) * 100) || null;
        }
        return {
          id: 0, title, company: j.company ?? "Unknown",
          companyLogoUrl: null,
          location: j.location ?? "India",
          isRemote: (j.location ?? "").toLowerCase().includes("remote"),
          isFresher: isFresherJob(title, desc),
          type: j.type ? normalizeType(j.type) : "full-time",
          category: detectCategory(title, desc, skills),
          salaryMin, salaryMax,
          description: desc, requirements: [],
          skills, applicationCount: 0, experienceYears: null,
          source: "Jooble", applyUrl: j.link ?? null,
          postedAt: j.updated ?? new Date().toISOString(),
        } as LiveJob;
      });
    logFetch("Jooble", jobs.length);
    return jobs;
  } catch (e: any) {
    logFetch("Jooble", 0, e.message);
    return [];
  }
}

/* ─── Deduplication ──────────────────────────────────────────────────────── */
function dedupe(jobs: LiveJob[]): LiveJob[] {
  const seen = new Set<string>();
  return jobs.filter(j => {
    const key = `${j.title.toLowerCase().slice(0, 35)}:::${j.company.toLowerCase().slice(0, 20)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ─── Company Logo Resolver (Clearbit) ──────────────────────────────────── */
function resolveCompanyLogo(company: string, existing?: string | null): string | null {
  if (existing) return existing;
  const domain = company
    .toLowerCase()
    .replace(/\s+(inc|ltd|limited|pvt|llc|corp|co|technologies|tech|solutions|services|group|global|india|systems|software)\.?$/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
  if (domain.length < 2) return null;
  return `https://logo.clearbit.com/${domain}.com`;
}

/* ─── Expired job cleanup (> 60 days old, no applications) ─────────────── */
export async function cleanupExpiredJobs(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const conditions = and(lt(jobsTable.postedAt, cutoff), sql`${jobsTable.applicationCount} = 0`);
    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(conditions);
    const count = Number(countRow?.count ?? 0);
    if (count > 0) {
      await db.delete(jobsTable).where(conditions);
      console.log(`[JobAggregator] Cleaned up ${count} expired jobs`);
    }
    return count;
  } catch (e) {
    console.error("[JobAggregator] Cleanup error:", e);
    return 0;
  }
}

/* ─── Remove seeded/demo jobs (source = "Database" with generic titles) ─── */
export async function removeNonApiJobs(): Promise<number> {
  try {
    const conditions = or(
      eq(jobsTable.source, "Demo"),
      eq(jobsTable.source, "Seed"),
      and(eq(jobsTable.source, "Database"), sql`${jobsTable.applicationCount} = 0`)
    );
    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(conditions);
    const count = Number(countRow?.count ?? 0);
    if (count > 0) await db.delete(jobsTable).where(conditions);
    return count;
  } catch {
    return 0;
  }
}

/* ─── DB Upsert ─────────────────────────────────────────────────────────── */
async function upsertJobsToDB(liveJobs: LiveJob[]): Promise<LiveJob[]> {
  if (liveJobs.length === 0) return [];
  const result: LiveJob[] = [];
  for (const job of liveJobs) {
    try {
      const existing = await db
        .select({ id: jobsTable.id })
        .from(jobsTable)
        .where(and(
          like(jobsTable.title, `%${job.title.slice(0, 40)}%`),
          like(jobsTable.company, `%${job.company.slice(0, 30)}%`)
        ))
        .limit(1);
      if (existing.length > 0) {
        result.push({ ...job, id: existing[0]!.id });
      } else {
        const titleSlice = job.title.slice(0, 200);
        const companySlice = job.company.slice(0, 200);
        await db.insert(jobsTable).values({
          title: titleSlice,
          company: companySlice,
          companyLogoUrl: resolveCompanyLogo(job.company, job.companyLogoUrl),
          location: job.location.slice(0, 200),
          isRemote: job.isRemote,
          isFresher: job.isFresher,
          type: (["full-time", "part-time", "internship", "freelance"].includes(job.type) ? job.type : "full-time") as any,
          category: job.category.slice(0, 100),
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          description: job.description.slice(0, 3000),
          requirements: job.requirements.slice(0, 10),
          skills: job.skills.slice(0, 10),
          applicationCount: 0,
          experienceYears: job.experienceYears,
          source: job.source,
          applyUrl: job.applyUrl,
          postedAt: new Date(job.postedAt),
        });
        const [inserted] = await db.select({ id: jobsTable.id })
          .from(jobsTable)
          .where(and(eq(jobsTable.title, titleSlice), eq(jobsTable.company, companySlice), eq(jobsTable.source, job.source)))
          .orderBy(desc(jobsTable.id))
          .limit(1);
        if (inserted) result.push({ ...job, id: inserted.id });
      }
    } catch { /* skip individual failures */ }
  }
  return result;
}

/* ─── Build search queries from category ────────────────────────────────── */
const CATEGORY_QUERIES: Record<string, string> = {
  "Cyber Security": "cyber security jobs india",
  "AI/ML": "machine learning AI jobs india",
  "Data Science": "data scientist analyst jobs india",
  "DevOps": "devops cloud engineer jobs india",
  "Digital Marketing": "digital marketing seo jobs india",
  "Data Entry": "data entry back office jobs india",
  "Sales": "sales business development jobs india",
  "HR": "HR recruiter human resources jobs india",
  "Finance": "finance accountant CA jobs india",
  "IT Support": "IT support helpdesk BCA MCA jobs india",
  "Government": "government PSU jobs india",
  "Product": "product manager jobs india",
  "Design": "UI UX designer jobs india",
  "Internship": "internship fresher jobs india",
  "Engineering": "software engineer developer jobs india",
};

/* ─── Main export ───────────────────────────────────────────────────────── */
export interface AggregateOptions {
  search?: string;
  category?: string;
  location?: string;
  remote?: boolean;
  type?: string;
  fresher?: boolean;
  forceRefresh?: boolean;
}

export interface AggregateResult {
  jobs: LiveJob[];
  sources: string[];
  fromCache: boolean;
  expandedTerms: string[];
  relatedCategories: string[];
  fallbackUsed: boolean;
  smartSearchActive: boolean;
  totalBeforeFilter: number;
}

export async function aggregateJobs(opts: AggregateOptions = {}): Promise<AggregateResult> {
  const cacheKey = `${opts.search}|${opts.category}|${opts.location}|${opts.remote}|${opts.type}|${opts.fresher}`;

  if (!opts.forceRefresh) {
    const cached = getCached(cacheKey);
    if (cached) {
      const filtered = filterAndScore(cached, opts);
      return {
        jobs: filtered,
        sources: [...new Set(cached.map(j => j.source))],
        fromCache: true,
        expandedTerms: [],
        relatedCategories: getRelatedCategories(opts.search ?? ""),
        fallbackUsed: false,
        smartSearchActive: false,
        totalBeforeFilter: cached.length,
      };
    }
  }

  // ── Build queries ──────────────────────────────────────────────────────
  let allQueries: string[] = [];
  let expandedTerms: string[] = [];
  let smartSearchActive = false;

  if (opts.category && CATEGORY_QUERIES[opts.category]) {
    allQueries = [CATEGORY_QUERIES[opts.category]!];
  } else if (opts.search) {
    const { queries, expandedTerms: terms } = expandKeywords(opts.search);
    allQueries = queries;
    expandedTerms = terms;
    smartSearchActive = terms.length > 0;
  } else {
    allQueries = ["software developer jobs india", "fresher it jobs india", "remote developer india"];
  }

  const primaryQuery = allQueries[0]!;
  const extraQueries = allQueries.slice(1, 3);

  // ── Fetch from all 5 APIs with primary query ────────────────────────────
  const [arbeitnow, primaryRemotive, primaryJSearch, adzuna, jooble] = await Promise.allSettled([
    fetchArbeitnow(),
    fetchRemotive(primaryQuery),
    fetchJSearch(primaryQuery),
    fetchAdzuna(opts.search || opts.category || "developer", opts.location || "india"),
    fetchJooble(opts.search || opts.category || "developer", opts.location || "India"),
  ]);

  const primaryJobs: LiveJob[] = [
    ...(arbeitnow.status === "fulfilled" ? arbeitnow.value : []),
    ...(primaryRemotive.status === "fulfilled" ? primaryRemotive.value : []),
    ...(primaryJSearch.status === "fulfilled" ? primaryJSearch.value : []),
    ...(adzuna.status === "fulfilled" ? adzuna.value : []),
    ...(jooble.status === "fulfilled" ? jooble.value : []),
  ];

  // ── Multi-query: fetch extra queries in parallel ────────────────────────
  let extraJobs: LiveJob[] = [];
  if (extraQueries.length > 0) {
    const extraFetches = await Promise.allSettled(
      extraQueries.map(q =>
        Promise.all([
          fetchRemotive(q),
          fetchJSearch(q),
          fetchJooble(q, opts.location || "India"),
        ]).then(([r, j, jb]) => [...r, ...j, ...jb])
      )
    );
    extraJobs = extraFetches.flatMap(r => r.status === "fulfilled" ? r.value : []);
  }

  const allLiveJobs = dedupe([...primaryJobs, ...extraJobs]);
  const withIds = await upsertJobsToDB(allLiveJobs);

  // ── Get existing real API jobs from DB ────────────────────────────────
  const dbJobs = await db.select().from(jobsTable)
    .limit(150)
    .orderBy(sql`${jobsTable.postedAt} DESC`);

  const dbMapped: LiveJob[] = dbJobs.map(j => ({
    id: j.id,
    title: j.title,
    company: j.company,
    companyLogoUrl: j.companyLogoUrl ?? null,
    location: j.location,
    isRemote: j.isRemote,
    isFresher: j.isFresher,
    type: j.type,
    category: j.category,
    salaryMin: j.salaryMin ?? null,
    salaryMax: j.salaryMax ?? null,
    description: j.description,
    requirements: j.requirements,
    skills: j.skills,
    applicationCount: j.applicationCount,
    experienceYears: j.experienceYears ?? null,
    source: j.source ?? "Database",
    applyUrl: j.applyUrl ?? null,
    postedAt: j.postedAt.toISOString(),
  }));

  const liveIds = new Set(withIds.map(j => j.id));
  const dbOnly = dbMapped.filter(j => !liveIds.has(j.id));
  const merged = dedupe([...withIds, ...dbOnly]);

  setCached(cacheKey, merged);

  // ── Apply filters + score ──────────────────────────────────────────────
  let filtered = filterAndScore(merged, opts);
  const totalBeforeFilter = merged.length;

  // ── Location fallback ──────────────────────────────────────────────────
  let fallbackUsed = false;
  if (filtered.length < 10 && opts.location) {
    const remoteJobs = merged.filter(j => j.isRemote);
    const withRemote = filterAndScore(dedupe([...filtered, ...remoteJobs]), { ...opts, location: undefined });
    if (withRemote.length > filtered.length) {
      filtered = withRemote;
      fallbackUsed = true;
    }
  }

  // ── Category relaxation fallback ───────────────────────────────────────
  if (filtered.length < 10 && opts.category) {
    const relaxed = filterAndScore(merged, { ...opts, category: undefined });
    const related = getRelatedCategories(opts.category);
    const relatedJobs = relaxed.filter(j => related.includes(j.category));
    filtered = dedupe([...filtered, ...relatedJobs]);
    if (filtered.length > 0) fallbackUsed = true;
  }

  // ── Search relaxation ──────────────────────────────────────────────────
  if (filtered.length < 10 && opts.search) {
    const relaxed = filterAndScore(merged, { ...opts, search: undefined });
    filtered = dedupe([...filtered, ...relaxed]);
    fallbackUsed = true;
  }

  // ── Fill from DB if still thin ─────────────────────────────────────────
  if (filtered.length < 10) {
    const extra = dbMapped.filter(j => !filtered.some(f => f.id === j.id)).slice(0, 15 - filtered.length);
    filtered = [...filtered, ...extra];
    if (extra.length > 0) fallbackUsed = true;
  }

  const sources = [...new Set(filtered.map(j => j.source))];
  return {
    jobs: filtered,
    sources,
    fromCache: false,
    expandedTerms,
    relatedCategories: getRelatedCategories(opts.search ?? opts.category ?? ""),
    fallbackUsed,
    smartSearchActive,
    totalBeforeFilter,
  };
}

function filterAndScore(jobs: LiveJob[], opts: AggregateOptions): LiveJob[] {
  let result = jobs;
  if (opts.remote === true) result = result.filter(j => j.isRemote);
  if (opts.type) result = result.filter(j => j.type === opts.type);
  if (opts.fresher) result = result.filter(j => j.isFresher || j.category === "Internship");
  if (opts.location) {
    const loc = opts.location.toLowerCase();
    result = result.filter(j => j.location.toLowerCase().includes(loc) || j.isRemote);
  }
  if (opts.category) {
    result = result.filter(j => j.category.toLowerCase() === opts.category!.toLowerCase());
  }
  if (opts.search) {
    const s = opts.search.toLowerCase();
    const { queries } = expandKeywords(s);
    const allTerms = [s, ...queries.map(q => q.replace(" jobs india", "").replace(" india", "").trim())];
    result = result.filter(j =>
      allTerms.some(t =>
        j.title.toLowerCase().includes(t) ||
        j.description.toLowerCase().includes(t) ||
        j.skills.some(sk => sk.toLowerCase().includes(t)) ||
        j.category.toLowerCase().includes(t) ||
        j.company.toLowerCase().includes(t)
      )
    );
  }
  const searchTerms = opts.search ? opts.search.toLowerCase().split(/\s+/) : [];
  return result
    .map(j => ({ ...j, relevanceScore: scoreJob(j, searchTerms, opts.location) }))
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
}
