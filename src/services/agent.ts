import * as fs from 'fs';
import * as path from 'path';

export type AgentStatus = 'queued' | 'running' | 'completed' | 'failed' | 'paused';

export interface AgentStep {
  id: string;
  role: 'PM' | 'TechLead' | 'Dev' | 'QA' | 'Docs' | 'Research' | 'DevOps' | 'Security' | 'Performance' | 'UX' | 'Data';
  summary: string;
  details?: string;
  startedAt: string;
  finishedAt?: string;
  status: AgentStatus;
}

export interface AgentRun {
  id: string;
  feature: string;
  goal: string;
  status: AgentStatus;
  startedAt: string;
  finishedAt?: string;
  steps: AgentStep[];
}

export interface StartRunOptions {
  roles?: Array<AgentStep['role']>;
  autoResearchPrestep?: boolean;
  enableAutomationHooks?: boolean;
}

interface OrchestratorOptions {
  autoResearchPrestep: boolean;
  enableAutomationHooks: boolean;
}

export interface KnowledgeItem {
  id: string; // filename without extension
  title: string;
  file: string;
  createdAt: string;
  tags?: string[];
  relatedRunId?: string;
  relatedStepId?: string;
  relatedErrorId?: string;
}

interface OrchestratorState {
  runs: AgentRun[];
  lastRunId?: string;
}

export interface AgentError {
  id: string;
  timestamp: string;
  runId: string;
  stepId?: string;
  role?: AgentStep['role'];
  message: string;
  details?: string;
  file?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
}

interface ErrorDatabase {
  errors: AgentError[];
}

export class AgentOrchestrator {
  private projectPath: string;
  private stateFile: string;
  private errorDbFile: string;
  private knowledgeDir: string;
  private options: OrchestratorOptions;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    const specdev = path.join(projectPath, '.specdev');
    if (!fs.existsSync(specdev)) fs.mkdirSync(specdev, { recursive: true });
    this.stateFile = path.join(specdev, 'state.json');
    this.errorDbFile = path.join(specdev, 'error-database.json');
    this.knowledgeDir = path.join(specdev, 'knowledge');
    if (!fs.existsSync(this.knowledgeDir)) fs.mkdirSync(this.knowledgeDir, { recursive: true });
    this.options = { autoResearchPrestep: true, enableAutomationHooks: true };

    // Initialize if missing
    if (!fs.existsSync(this.stateFile)) {
      const initial: OrchestratorState = { runs: [] };
      fs.writeFileSync(this.stateFile, JSON.stringify(initial, null, 2));
    }
    if (!fs.existsSync(this.errorDbFile)) {
      const initialErrors: ErrorDatabase = { errors: [] };
      fs.writeFileSync(this.errorDbFile, JSON.stringify(initialErrors, null, 2));
    }
  }

  setOptions(opts: Partial<OrchestratorOptions>) {
    this.options = { ...this.options, ...opts };
  }

  startRun(feature: string, goal: string, opts?: StartRunOptions): AgentRun {
    const now = new Date().toISOString();
    // Determine roles
    const roles = this.computeDefaultRoles(goal, opts?.roles);
    const steps: AgentStep[] = roles.map((role, idx) => ({
      id: `step_${Date.now()}_${idx}_${role}`,
      role,
      summary: this.roleSummary(role),
      startedAt: now,
      status: 'queued',
    }));

    const run: AgentRun = {
      id: `run_${Date.now()}`,
      feature,
      goal,
      status: 'queued',
      startedAt: now,
      steps
    };

    // Auto-research prefill: attach internal knowledge references to Research step
    const autoResearch = (opts?.autoResearchPrestep ?? this.options.autoResearchPrestep);
    if (autoResearch) {
      const research = steps.find(s => s.role === 'Research');
      if (research) {
        research.details = this.prefillResearchFromKnowledge(goal);
        // Auto-start Research as a pre-step
        research.status = 'running';
        if (!research.startedAt) research.startedAt = now;
      }
    }

    const state = this.readState();
    state.runs.push(run);
    state.lastRunId = run.id;
    this.writeState(state);

    return run;
  }

  listRuns(): AgentRun[] {
    return this.readState().runs;
  }

  updateStepStatus(runId: string, stepId: string, status: AgentStatus, opts?: { details?: string; error?: Partial<AgentError> }): AgentRun | undefined {
    const state = this.readState();
    const run = state.runs.find(r => r.id === runId);
    if (!run) return undefined;
    const step = run.steps.find(s => s.id === stepId);
    if (!step) return undefined;

    const now = new Date().toISOString();
    step.status = status;
    if (opts?.details) step.details = (step.details ? step.details + '\n' : '') + opts.details;
    if (status === 'running') {
      if (!step.startedAt) step.startedAt = now;
    }
    if (status === 'completed' || status === 'failed' || status === 'paused') {
      step.finishedAt = now;
    }

    // Record error when failed
    if (status === 'failed' && opts?.error?.message) {
      const err: AgentError = {
        id: `err_${Date.now()}`,
        timestamp: now,
        runId: run.id,
        stepId: step.id,
        role: step.role,
        message: String(opts.error.message),
        details: opts.error.details,
        file: opts.error.file,
        severity: (opts.error.severity as any) || 'medium',
        suggestion: opts.error.suggestion,
      };
      this.appendError(err);
      step.details = (step.details ? step.details + '\n' : '') + `ErrorId: ${err.id}`;

      // Automation hook: when Dev fails, queue Research with context
      if (this.options.enableAutomationHooks && step.role === 'Dev') {
        const research = run.steps.find(s => s.role === 'Research');
        const note = `Investigate error ${err.id}: ${err.message}` + (err.details ? `\nDetails: ${err.details}` : '');
        if (research) {
          research.details = (research.details ? research.details + '\n' : '') + `[AutoHook] ${note}`;
          if (research.status === 'queued' || research.status === 'paused') {
            // leave as is; UI can start it
          }
        } else {
          // Insert research step at front if missing
          const rs: AgentStep = {
            id: `step_${Date.now()}_Research_auto`,
            role: 'Research',
            summary: this.roleSummary('Research'),
            startedAt: now,
            status: 'queued',
            details: `[AutoHook] ${note}`
          };
          run.steps.unshift(rs);
        }
      }
    }

    // Derive run status from steps
    run.status = this.computeRunStatus(run);
    if (run.status === 'completed') run.finishedAt = now;

    // Automation hook: when Docs starts running, suggest internal knowledge references
    if (this.options.enableAutomationHooks && step.role === 'Docs' && status === 'running') {
      const refs = this.prefillResearchFromKnowledge(run.goal);
      if (refs && refs.trim()) {
        step.details = (step.details ? step.details + '\n' : '') + refs;
        if (/No internal knowledge found/i.test(refs)) {
          // Notify Research to prepare documentation inputs
          const research = run.steps.find(s => s.role === 'Research');
          if (research) {
            research.details = (research.details ? research.details + '\n' : '') + `[Docs Request] Prepare documentation inputs for feature: ${run.feature}`;
          }
        }
      }
    }

    // Automation hook: when Research completes with details, persist to knowledge and notify Docs
    if (this.options.enableAutomationHooks && step.role === 'Research' && status === 'completed') {
      if (step.details && step.details.trim()) {
        const item = this.saveResearch(`Research Findings - ${run.feature}`, step.details, { runId: run.id, stepId: step.id, tags: ['research', run.feature] });
        const docs = run.steps.find(s => s.role === 'Docs');
        if (docs) {
          docs.details = (docs.details ? docs.details + '\n' : '') + `[Research Saved] ${item.title} → ${path.basename(item.file)}\n`;
        }
      }
    }

    this.writeState(state);
    return run;
  }

  addStepNote(runId: string, stepId: string, note: string): AgentRun | undefined {
    const state = this.readState();
    const run = state.runs.find(r => r.id === runId);
    if (!run) return undefined;
    const step = run.steps.find(s => s.id === stepId);
    if (!step) return undefined;
    step.details = (step.details ? step.details + '\n' : '') + `[Note ${new Date().toLocaleString()}] ${note}`;
    this.writeState(state);
    return run;
  }

  listErrors(): AgentError[] {
    try {
      const raw = fs.readFileSync(this.errorDbFile, 'utf8');
      const db = JSON.parse(raw) as ErrorDatabase;
      return db.errors || [];
    } catch {
      return [];
    }
  }

  // ---------- Knowledge Base (Research) ----------
  saveResearch(title: string, content: string, meta?: { runId?: string; stepId?: string; errorId?: string; tags?: string[] }): KnowledgeItem {
    const now = new Date();
    const safe = title.replace(/[^a-z0-9\-_]+/gi, '-').replace(/-+/g, '-').toLowerCase().slice(0, 80);
    const id = `${now.getTime()}-${safe || 'note'}`;
    const file = path.join(this.knowledgeDir, `${id}.md`);
    const header = `# ${title}\n\n- Created: ${now.toISOString()}\n` +
      (meta?.runId ? `- Run: ${meta.runId}\n` : '') +
      (meta?.stepId ? `- Step: ${meta.stepId}\n` : '') +
      (meta?.errorId ? `- Error: ${meta.errorId}\n` : '') +
      (meta?.tags?.length ? `- Tags: ${meta.tags.join(', ')}\n` : '') + '\n---\n\n';
    fs.writeFileSync(file, header + content, 'utf8');
    const item: KnowledgeItem = { id, title, file, createdAt: now.toISOString(), tags: meta?.tags, relatedRunId: meta?.runId, relatedStepId: meta?.stepId, relatedErrorId: meta?.errorId };
    return item;
  }

  listKnowledge(): KnowledgeItem[] {
    if (!fs.existsSync(this.knowledgeDir)) return [];
    const items: KnowledgeItem[] = [];
    const files = fs.readdirSync(this.knowledgeDir).filter(f => f.endsWith('.md'));
    for (const f of files) {
      const p = path.join(this.knowledgeDir, f);
      try {
        const txt = fs.readFileSync(p, 'utf8');
        const first = txt.split('\n')[0] || '';
        const title = first.replace(/^#\s*/, '').trim() || f.replace(/\.md$/, '');
        const stat = fs.statSync(p);
        items.push({ id: f.replace(/\.md$/, ''), title, file: p, createdAt: stat.birthtime.toISOString() });
      } catch {}
    }
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getKnowledge(idOrPath: string): { title: string; content: string; file: string } | undefined {
    const file = idOrPath.endsWith('.md') ? idOrPath : path.join(this.knowledgeDir, `${idOrPath}.md`);
    if (!fs.existsSync(file)) return undefined;
    const content = fs.readFileSync(file, 'utf8');
    const first = content.split('\n')[0] || '';
    const title = first.replace(/^#\s*/, '').trim() || path.basename(file, '.md');
    return { title, content, file };
  }

  searchKnowledge(query: string): KnowledgeItem[] {
    if (!query || !query.trim()) return this.listKnowledge();
    const q = query.toLowerCase();
    const results: KnowledgeItem[] = [];
    const files = fs.existsSync(this.knowledgeDir) ? fs.readdirSync(this.knowledgeDir).filter(f => f.endsWith('.md')) : [];
    for (const f of files) {
      const p = path.join(this.knowledgeDir, f);
      try {
        const txt = fs.readFileSync(p, 'utf8').toLowerCase();
        if (txt.includes(q) || f.toLowerCase().includes(q)) {
          const title = (txt.split('\n')[0] || '').replace(/^#\s*/, '').trim() || f.replace(/\.md$/, '');
          const stat = fs.statSync(p);
          results.push({ id: f.replace(/\.md$/, ''), title, file: p, createdAt: stat.birthtime.toISOString() });
        }
      } catch {}
    }
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
  }

  updateRunRoles(runId: string, roles: Array<AgentStep['role']>, merge: boolean = true): AgentRun | undefined {
    const state = this.readState();
    const run = state.runs.find(r => r.id === runId);
    if (!run) return undefined;
    const existing = new Set(run.steps.map(s => s.role));
    const now = new Date().toISOString();
    const toAdd = merge ? roles.filter(r => !existing.has(r)) : roles;
    if (!merge) {
      // replace
      run.steps = [];
    }
    for (const role of toAdd) {
      run.steps.push({
        id: `step_${Date.now()}_${role}`,
        role,
        summary: this.roleSummary(role),
        startedAt: now,
        status: 'queued',
      });
    }
    // Ensure Research role is always present
    if (!run.steps.some(s => s.role === 'Research')) {
      run.steps.unshift({
        id: `step_${Date.now()}_Research`,
        role: 'Research',
        summary: this.roleSummary('Research'),
        startedAt: now,
        status: 'queued',
      });
    }
    this.writeState(state);
    return run;
  }

  derivePersona(role: AgentStep['role'], context: { goal: string; feature?: string }): string {
    const { language, platform, frameworks } = this.detectLanguageAndPlatform(context.goal);
    const roleTitle = this.roleTitle(role);
    const domain = this.domainSummary(language, platform, frameworks);
    const communication = this.communicationStyle(role);
    const responsibilities = this.roleResponsibilities(role);
    return `You are a senior ${roleTitle}${domain ? ` specializing in ${domain}` : ''}.` +
      `\n- Always act with real-world, production-grade judgment. Avoid hallucinations; verify assumptions.` +
      `\n- ${communication}` +
      `\n- Responsibilities: ${responsibilities}` +
      (language ? `\n- Primary Language: ${language}` : '') +
      (platform ? `\n- Target Platform: ${platform}` : '') +
      (frameworks.length ? `\n- Frameworks/Tools: ${frameworks.join(', ')}` : '');
  }

  getPersonasForRun(runId: string): Record<string, string> {
    const state = this.readState();
    const run = state.runs.find(r => r.id === runId);
    if (!run) return {};
    const ctx = { goal: run.goal, feature: run.feature };
    const map: Record<string, string> = {};
    for (const step of run.steps) {
      map[step.role] = this.derivePersona(step.role, ctx);
    }
    return map;
  }

  private detectLanguageAndPlatform(text: string): { language?: string; platform?: string; frameworks: string[] } {
    const t = (text || '').toLowerCase();
    const langs: Array<[string, RegExp]> = [
      ['Python', /python|pyqt|pyside|fastapi|django|flask/],
      ['TypeScript', /typescript|ts\b/],
      ['JavaScript', /javascript|node\b|express\b|next\.js|react\b/],
      ['Go', /\bgo\b|golang/],
      ['Java', /\bjava\b|spring\b|spring-boot/],
      ['C#', /c#|\.net|dotnet|asp\.net|wpf|winforms/],
      ['C++', /c\+\+|qt\b/],
      ['Rust', /rust/],
      ['Ruby', /ruby|rails/],
      ['PHP', /php|laravel|symfony/],
      ['Kotlin', /kotlin/],
      ['Swift', /swift|ios/],
      ['Dart', /dart|flutter/],
    ];
    const plats: Array<[string, RegExp]> = [
      ['Windows', /windows|win32|win64|wpf|winforms|uwp|msix/],
      ['macOS', /macos|darwin/],
      ['Linux', /linux/],
      ['Android', /android/],
      ['iOS', /ios/],
      ['Web', /web|browser|frontend|react|next\.js|vite/],
      ['Backend', /backend|api|microservice|server/],
      ['Desktop', /desktop|electron|wpf|winforms|qt/],
      ['CLI', /cli|command-line/],
      ['Cloud', /aws|azure|gcp/],
    ];
    const frameworks: string[] = [];
    if (t.includes('electron')) frameworks.push('Electron');
    if (t.includes('react')) frameworks.push('React');
    if (t.includes('next.js') || t.includes('nextjs')) frameworks.push('Next.js');
    if (t.includes('fastapi')) frameworks.push('FastAPI');
    if (t.includes('django')) frameworks.push('Django');
    if (t.includes('flask')) frameworks.push('Flask');
    if (t.includes('spring')) frameworks.push('Spring');
    if (t.includes('wpf')) frameworks.push('WPF');
    if (t.includes('qt') || t.includes('pyqt') || t.includes('pyside')) frameworks.push('Qt');
    if (t.includes('playwright')) frameworks.push('Playwright');

    const lang = langs.find(([_, r]) => r.test(t))?.[0];
    const plat = plats.find(([_, r]) => r.test(t))?.[0];
    return { language: lang, platform: plat, frameworks };
  }

  private roleTitle(role: AgentStep['role']): string {
    switch (role) {
      case 'PM': return 'Product Manager';
      case 'TechLead': return 'Technical Lead';
      case 'Dev': return 'Software Engineer';
      case 'QA': return 'QA Engineer';
      case 'Docs': return 'Technical Writer';
      case 'Research': return 'Research Engineer';
      case 'DevOps': return 'DevOps Engineer';
      case 'Security': return 'Security Engineer';
      case 'Performance': return 'Performance Engineer';
      case 'UX': return 'UX Designer';
      case 'Data': return 'Data Engineer';
    }
  }

  private domainSummary(language?: string, platform?: string, frameworks: string[] = []): string {
    const parts: string[] = [];
    if (language) parts.push(language);
    if (platform) parts.push(`${platform} development`);
    if (frameworks.length) parts.push(frameworks.join('/'));
    return parts.join(' · ');
  }

  private communicationStyle(role: AgentStep['role']): string {
    switch (role) {
      case 'PM': return 'Communicate clearly, define scope, success metrics, and constraints.';
      case 'TechLead': return 'Explain reasoning, architecture trade-offs, and risk mitigation.';
      case 'Dev': return 'Provide implementation details, tests-first mindset, and commit-level clarity.';
      case 'QA': return 'Focus on test plans, coverage, negative cases, and clear pass/fail criteria.';
      case 'Docs': return 'Write concise, user-focused documentation with examples and release notes.';
      case 'Research': return 'Start from prior internal knowledge, verify against trusted sources, and cite. Provide precise, terse findings and best practices.';
      case 'DevOps': return 'Automate safely, prefer IaC, ensure CI/CD reliability and observability.';
      case 'Security': return 'Apply secure-by-default patterns, threat-model briefly, and reference standards (OWASP/CIS).';
      case 'Performance': return 'Use metrics-driven approach, profile, identify hotspots, and propose concrete optimizations.';
      case 'UX': return 'Ensure accessibility, usability, and clarity with concrete UI/UX recommendations.';
      case 'Data': return 'Define schemas, data flows, and validation with privacy/compliance considerations.';
    }
  }

  private roleResponsibilities(role: AgentStep['role']): string {
    switch (role) {
      case 'PM': return 'clarify requirements, validate user stories, acceptance criteria, and success metrics';
      case 'TechLead': return 'design architecture, choose tools, outline tasks and sequencing, enforce best practices';
      case 'Dev': return 'implement features, write unit/integration tests, ensure maintainability and performance';
      case 'QA': return 'create and run test plans, track defects, validate quality gates and performance';
      case 'Docs': return 'produce technical docs, changelogs, onboarding guides, and usage examples';
      case 'Research': return 'gather best practices, solutions for errors, compare alternatives, and summarize with citations';
      case 'DevOps': return 'set up CI/CD, monitoring, infrastructure as code, and deployment strategies';
      case 'Security': return 'enforce secure coding, dependency auditing, secrets handling, and threat mitigations';
      case 'Performance': return 'measure performance, set budgets, optimize critical paths, and validate improvements';
      case 'UX': return 'define user journeys, wireframes, accessibility checks, and UX acceptance criteria';
      case 'Data': return 'design schemas, migrations, data quality checks, and retention policies';
    }
  }

  private computeRunStatus(run: AgentRun): AgentStatus {
    const st = run.steps.map(s => s.status);
    if (st.every(s => s === 'completed')) return 'completed';
    if (st.some(s => s === 'failed')) return 'failed';
    if (st.some(s => s === 'running')) return 'running';
    if (st.every(s => s === 'paused')) return 'paused';
    return 'queued';
  }

  private appendError(err: AgentError) {
    try {
      const raw = fs.readFileSync(this.errorDbFile, 'utf8');
      const db = JSON.parse(raw) as ErrorDatabase;
      db.errors = db.errors || [];
      db.errors.push(err);
      fs.writeFileSync(this.errorDbFile, JSON.stringify(db, null, 2));
    } catch {
      const db: ErrorDatabase = { errors: [err] };
      fs.writeFileSync(this.errorDbFile, JSON.stringify(db, null, 2));
    }
  }

  private readState(): OrchestratorState {
    try {
      const raw = fs.readFileSync(this.stateFile, 'utf8');
      return JSON.parse(raw) as OrchestratorState;
    } catch {
      return { runs: [] };
    }
  }

  private writeState(state: OrchestratorState) {
    fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
  }

  // ---------- Helpers ----------
  private prefillResearchFromKnowledge(goal: string): string {
    const items = this.searchKnowledge(goal);
    if (!items.length) return 'No internal knowledge found. Prepare to research trusted sources.\n';
    const lines = items.slice(0, 10).map((i: KnowledgeItem) => `- ${i.title} (${path.basename(i.file)})`);
    return ['Internal knowledge references:', ...lines, '', 'Prepare to validate findings and cite external sources as needed.'].join('\n');
  }
  private computeDefaultRoles(goal: string, overrides?: Array<AgentStep['role']>): Array<AgentStep['role']> {
    if (overrides && overrides.length) {
      // Ensure Research is always included
      const set = new Set(overrides);
      set.add('Research');
      return Array.from(set);
    }

    const t = (goal || '').toLowerCase();
    const roles: Array<AgentStep['role']> = ['Research', 'PM', 'TechLead', 'Dev', 'QA', 'Docs'];
    if (/deploy|infrastructure|kubernetes|docker|ci\/?cd|pipeline|terraform/.test(t)) roles.splice(5, 0, 'DevOps');
    if (/security|auth|owasp|encryption|jwt|oauth/.test(t)) roles.splice(5, 0, 'Security');
    if (/performance|latency|throughput|optimi[sz]e|profil(e|ing)/.test(t)) roles.splice(5, 0, 'Performance');
    if (/ux|ui|design|accessibility|a11y|usability/.test(t)) roles.splice(5, 0, 'UX');
    if (/data|analytics|etl|warehouse|ml|ai|model/.test(t)) roles.splice(5, 0, 'Data');
    return roles;
  }

  private roleSummary(role: AgentStep['role']): string {
    switch (role) {
      case 'Research': return 'Research internal knowledge first, then external; compile best practices and references';
      case 'PM': return 'Validate requirements and success criteria';
      case 'TechLead': return 'Confirm architecture and plan';
      case 'Dev': return 'Implement tasks with tests';
      case 'QA': return 'Run tests and validate quality gates';
      case 'Docs': return 'Prepare release notes and docs; integrate research';
      case 'DevOps': return 'Prepare CI/CD, ops, and deployment strategy';
      case 'Security': return 'Perform security review and guidance';
      case 'Performance': return 'Profile and provide performance plan';
      case 'UX': return 'Provide UX guidelines and acceptance checks';
      case 'Data': return 'Define data models, flows, and checks';
    }
  }
}
