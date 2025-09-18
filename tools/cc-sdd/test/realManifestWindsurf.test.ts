import { describe, it, expect } from 'vitest';
import { runCli } from '../src/index';
import { join } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';

const runtime = { platform: 'darwin' } as const;

const makeIO = () => {
  const logs: string[] = [];
  const errs: string[] = [];
  return {
    io: {
      log: (m: string) => logs.push(m),
      error: (m: string) => errs.push(m),
      exit: (_c: number) => {},
    },
    get logs() {
      return logs;
    },
    get errs() {
      return errs;
    },
  };
};

describe('real windsurf manifest', () => {
  it('dry-run prints plan for windsurf.json with placeholders applied (mac)', async () => {
    const repoRoot = join(process.cwd(), '..', '..');
    const manifestPath = join(repoRoot, 'tools/cc-sdd/templates/manifests/windsurf.json');
    const ctx = makeIO();
    const code = await runCli(['--dry-run', '--lang', 'en', '--agent', 'windsurf', '--manifest', manifestPath], runtime, ctx.io, {});
    expect(code).toBe(0);
    const out = ctx.logs.join('\n');
    expect(out).toMatch(/Plan \(dry-run\)/);
    expect(out).toContain('[templateDir] commands_os_mac: templates/agents/windsurf/commands/os-mac -> .windsurf/commands/kiro');
    expect(out).toContain('[templateFile] doc_main: templates/agents/windsurf/docs/WINDSURF.tpl.md -> ./WINDSURF.md');
  });
  
  it('dry-run prints plan including commands for linux via windows template', async () => {
    const repoRoot = join(process.cwd(), '..', '..');
    const manifestPath = join(repoRoot, 'tools/cc-sdd/templates/manifests/windsurf.json');
    const ctx = makeIO();
    const runtimeLinux = { platform: 'linux' } as const;
    const code = await runCli(['--dry-run', '--lang', 'en', '--agent', 'windsurf', '--manifest', manifestPath], runtimeLinux, ctx.io, {});
    expect(code).toBe(0);
    const out = ctx.logs.join('\n');
    expect(out).toMatch(/Plan \(dry-run\)/);
    expect(out).toContain('[templateDir] commands_os_windows: templates/agents/windsurf/commands/os-windows -> .windsurf/commands/kiro');
    expect(out).toContain('[templateFile] doc_main: templates/agents/windsurf/docs/WINDSURF.tpl.md -> ./WINDSURF.md');
  });
  
  it('shows windsurf setup completion message after applying plan', async () => {
    const repoRoot = join(process.cwd(), '..', '..');
    const manifestPath = join(repoRoot, 'tools/cc-sdd/templates/manifests/windsurf.json');
    const ctx = makeIO();
    
    // Create a temporary directory for execution 
    const tmpDir = await mkdtemp(join(tmpdir(), 'ccsdd-windsurf-test-'));
    
    // Use the actual templates directory from the project
    const templatesRoot = join(repoRoot, 'tools/cc-sdd');
    
    const code = await runCli(['--lang', 'en', '--agent', 'windsurf', '--manifest', manifestPath, '--yes'], runtime, ctx.io, {}, { cwd: tmpDir, templatesRoot });
    
    expect(code).toBe(0);
    const out = ctx.logs.join('\n');
    
    // Check that the setup completion message is present
    expect(out).toMatch(/Setup completed: written=\d+, skipped=\d+/);
  });
});
