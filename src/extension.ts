import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as crypto from 'crypto';
import { AgentOrchestrator } from './services/agent';

function computeDestPath(rulesDir: string, destFileName: string): string {
  try {
    const isWindsurf = /[\\\/]\.windsurf[\\\/]rules/.test(rulesDir);
    if (isWindsurf) {
      const mdName = destFileName.endsWith('.mdc') ? destFileName.replace(/\.mdc$/i, '.md') : destFileName;
      return path.join(rulesDir, mdName);
    }
    return path.join(rulesDir, destFileName);
  } catch {
    return path.join(rulesDir, destFileName);
  }
}

class SpecDevProvider {
  private static currentPanel: vscode.WebviewPanel | undefined;
  private readonly extensionUri: vscode.Uri;
  private readonly context: vscode.ExtensionContext;
  private currentFeature: string = '';
  private fileWatcher: vscode.FileSystemWatcher | undefined;
  private fileChangeTimeout: NodeJS.Timeout | undefined;
  private webviewPanel: vscode.WebviewPanel | undefined;
  private orchestrator: AgentOrchestrator | undefined;

  constructor(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    this.extensionUri = extensionUri;
    this.context = context;
  }

  public static createOrShow(context: vscode.ExtensionContext) {
    const extensionUri = context.extensionUri;
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (SpecDevProvider.currentPanel) {
      SpecDevProvider.currentPanel.reveal(column);
      return;
    }

    const retain = vscode.workspace.getConfiguration('specdev').get<boolean>('webview.retainContextWhenHidden', false);
    const panel = vscode.window.createWebviewPanel(
      'specdev',
      'SpecDev',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: retain,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'webview', 'build')
        ],
      }
    );

    SpecDevProvider.currentPanel = panel;
    const provider = new SpecDevProvider(extensionUri, context);
    provider.setupWebview(panel);

    panel.onDidDispose(
      () => {
        SpecDevProvider.currentPanel = undefined;
        provider.dispose();
      },
      null,
    );
  }

  public setupWebview(panel: vscode.WebviewPanel) {
    this.webviewPanel = panel;
    // Prefer React-built webview if available, else fallback to legacy inline HTML
    panel.webview.html = this.getReactHtml(panel.webview) || this.getHtmlForWebview(panel.webview);
    
    // Setup file watcher for real-time updates
    this.setupFileWatcher();

    // Initialize agent orchestrator
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      this.orchestrator = new AgentOrchestrator(workspaceFolder.uri.fsPath);
    }

    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'loadFeatures':
            const features = await this.getAvailableFeatures();
            panel.webview.postMessage({
              command: 'featuresLoaded',
              features: features
            });
            break;
          case 'loadFiles':
            this.currentFeature = message.feature; // Track the current feature
            const fileContent = await this.loadSpecDevFiles(message.feature);
            panel.webview.postMessage({
              command: 'filesLoaded',
              content: fileContent,
              currentFeature: message.feature
            });
            break;
          case 'saveFile':
            await this.saveSpecDevFile(message.type, message.content, message.feature);
            break;
          case 'createFeature':
            await this.createFeature(message.featureName);
            this.currentFeature = message.featureName; // Set the newly created feature as current
            
            // Send feature created notification first
            panel.webview.postMessage({
              command: 'featureCreated',
              featureName: message.featureName
            });
            
            // Update features list
            const updatedFeatures = await this.getAvailableFeatures();
            panel.webview.postMessage({
              command: 'featuresLoaded',
              features: updatedFeatures
            });
            
            // Automatically load the newly created feature's files
            const newFeatureContent = await this.loadSpecDevFiles(message.featureName);
            panel.webview.postMessage({
              command: 'filesLoaded',
              content: newFeatureContent,
              currentFeature: message.featureName
            });
            break;
          case 'regenerate':
          // Regeneration is handled by Cursor agent using the .mdc rules
          // The extension provides context and templates, Cursor agent does the generation
          vscode.window.showInformationMessage(
            `To regenerate ${message.type}, use the Cursor chat with the current spec context. ` +
            `The SpecDev rules will guide the agent to regenerate based on latest best practices.`
          );
          break;
        case 'summarizeContext':
          // Trigger context summarization
          const summaryPath = await this.createContextSummary(message.feature);
          panel.webview.postMessage({
            command: 'summaryCreated',
            summaryPath: summaryPath
          });
            break;
        case 'persistState':
          try {
            await this.context.workspaceState.update('specdev.state', message.state || {});
          } catch (e) {
            // ignore
          }
          break;
        case 'loadPersistedState':
          const saved = this.context.workspaceState.get('specdev.state');
          panel.webview.postMessage({ command: 'hydratedState', state: saved });
          break;
        case 'docCacheFetch': {
          const { url, force } = message;
          const result = await this.fetchAndCacheDocument(url, !!force);
          panel.webview.postMessage({ command: 'docCacheFetched', result });
          break;
        }
        case 'docCacheList': {
          const list = this.listCachedDocuments();
          panel.webview.postMessage({ command: 'docCacheList', list });
          break;
        }
        case 'docCacheInvalidate': {
          const { url } = message;
          const ok = this.invalidateCachedDocument(url);
          panel.webview.postMessage({ command: 'docCacheInvalidated', url, ok });
          break;
        }
        case 'docCacheRefresh': {
          const { url } = message;
          const result = await this.fetchAndCacheDocument(url, true);
          panel.webview.postMessage({ command: 'docCacheFetched', result });
          break;
        }
        case 'agentStart': {
          try {
            const feature = message.feature || this.currentFeature || 'general';
            const goal = message.goal || `Automated orchestration for feature: ${feature}`;
            const options = message.options || {};
            // Allow toggling orchestrator options as well
            if (this.orchestrator && options) {
              this.orchestrator.setOptions({
                autoResearchPrestep: options.autoResearchPrestep ?? true,
                enableAutomationHooks: options.enableAutomationHooks ?? true,
              });
            }
            const run = this.orchestrator?.startRun(feature, goal, {
              roles: Array.isArray(options.roles) ? options.roles : undefined,
              autoResearchPrestep: options.autoResearchPrestep,
              enableAutomationHooks: options.enableAutomationHooks,
            });
            panel.webview.postMessage({ command: 'agentUpdate', run });
          } catch (e:any) {
            vscode.window.showErrorMessage(`Agent start failed: ${e?.message || e}`);
          }
          break;
        }
        case 'agentListRuns': {
          try {
            const runs = this.orchestrator?.listRuns() || [];
            panel.webview.postMessage({ command: 'agentRuns', runs });
          } catch (e:any) {
            vscode.window.showErrorMessage(`Agent list failed: ${e?.message || e}`);
          }
          break;
        }
        case 'agentStepAction': {
          try {
            const { runId, stepId, action, details, error } = message;
            const statusMap: Record<string, 'queued' | 'running' | 'paused' | 'completed' | 'failed'> = {
              start: 'running',
              pause: 'paused',
              complete: 'completed',
              fail: 'failed',
              retry: 'running',
            };
            const status = statusMap[(action || '').toLowerCase()] || 'queued';
            const updated = this.orchestrator?.updateStepStatus(runId, stepId, status, { details, error });
            if (updated) {
              panel.webview.postMessage({ command: 'agentRunUpdated', run: updated });
            }
          } catch (e:any) {
            vscode.window.showErrorMessage(`Agent action failed: ${e?.message || e}`);
          }
          break;
        }
        case 'agentAddNote': {
          try {
            const { runId, stepId, note } = message;
            const updated = this.orchestrator?.addStepNote(runId, stepId, note);
            if (updated) {
              panel.webview.postMessage({ command: 'agentRunUpdated', run: updated });
            }
          } catch (e:any) {
            vscode.window.showErrorMessage(`Add note failed: ${e?.message || e}`);
          }
          break;
        }
        case 'agentListErrors': {
          try {
            const errors = this.orchestrator?.listErrors() || [];
            panel.webview.postMessage({ command: 'agentErrors', errors });
          } catch (e:any) {
            vscode.window.showErrorMessage(`List errors failed: ${e?.message || e}`);
          }
          break;
        }
        case 'agentGetPersonas': {
          try {
            const { runId } = message;
            const personas = runId ? (this.orchestrator?.getPersonasForRun(runId) || {}) : {};
            panel.webview.postMessage({ command: 'agentPersonas', runId, personas });
          } catch (e:any) {
            vscode.window.showErrorMessage(`Get personas failed: ${e?.message || e}`);
          }
          break;
        }
        case 'agentUpdateRoles': {
          try {
            const { runId, roles, merge } = message;
            const updated = this.orchestrator?.updateRunRoles(runId, roles || [], !!merge);
            if (updated) {
              panel.webview.postMessage({ command: 'agentRunUpdated', run: updated });
            }
          } catch (e:any) {
            vscode.window.showErrorMessage(`Update roles failed: ${e?.message || e}`);
          }
          break;
        }
        case 'agentListKnowledge': {
          try {
            const list = this.orchestrator?.listKnowledge() || [];
            panel.webview.postMessage({ command: 'knowledgeList', list });
          } catch (e:any) {
            vscode.window.showErrorMessage(`List knowledge failed: ${e?.message || e}`);
          }
          break;
        }
        case 'agentSearchKnowledge': {
          try {
            const { query } = message;
            const list = this.orchestrator?.searchKnowledge(query || '') || [];
            panel.webview.postMessage({ command: 'knowledgeSearchResults', list, query });
          } catch (e:any) {
            vscode.window.showErrorMessage(`Search knowledge failed: ${e?.message || e}`);
          }
          break;
        }
        case 'agentGetKnowledge': {
          try {
            const { idOrPath } = message;
            const item = this.orchestrator?.getKnowledge(idOrPath);
            panel.webview.postMessage({ command: 'knowledgeItem', item });
          } catch (e:any) {
            vscode.window.showErrorMessage(`Get knowledge failed: ${e?.message || e}`);
          }
          break;
        }
        case 'agentSaveResearch': {
          try {
            const { title, content, runId, stepId, errorId, tags } = message;
            const item = this.orchestrator?.saveResearch(title, content, { runId, stepId, errorId, tags });
            if (item) {
              panel.webview.postMessage({ command: 'researchSaved', item });
            }
          } catch (e:any) {
            vscode.window.showErrorMessage(`Save research failed: ${e?.message || e}`);
          }
          break;
        }
      }
    },
    undefined,
  );
  }

  private async getAvailableFeatures(): Promise<string[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return [];
    }

    const specsPath = path.join(workspaceFolder.uri.fsPath, '.specdev', 'specs');
    
    // Ensure .specdev/specs directory exists
    if (!fs.existsSync(specsPath)) {
      fs.mkdirSync(specsPath, { recursive: true });
    }

    try {
      const features = fs.readdirSync(specsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      return features;
    } catch (error) {
      console.error('Error reading features:', error);
      return [];
    }
  }

  private async createFeature(featureName: string): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const featurePath = path.join(workspaceFolder.uri.fsPath, '.specdev', 'specs', featureName);
    
    // Ensure feature directory exists
    if (!fs.existsSync(featurePath)) {
      fs.mkdirSync(featurePath, { recursive: true });
    }

    // Create default files for the feature
    const files = {
      'requirements.md': this.getDefaultRequirementsContent(featureName),
      'design.md': this.getDefaultDesignContent(featureName),
      'tasks.md': this.getDefaultTasksContent(featureName)
    };

    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(featurePath, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }

    vscode.window.showInformationMessage(`Feature "${featureName}" created successfully`);
  }

  private getDefaultRequirementsContent(featureName: string): string {
    return `# Requirements Document - ${featureName}

## Introduction
[Introduction text here for ${featureName}]

## Requirements

### Requirement 1
**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
This section should have EARS requirements
1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]

### Requirement 2
**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
1. WHEN [event] THEN [system] SHALL [response]
2. WHEN [event] AND [condition] THEN [system] SHALL [response]
`;
  }

  private getDefaultDesignContent(featureName: string): string {
    return `# Design Document - ${featureName}

## Architecture Overview
\`\`\`mermaid
graph TD
    A[User Interface] --> B[Business Logic]
    B --> C[Data Layer]
    C --> D[Storage]
\`\`\`

## System Components

### Component 1
Description of component 1

### Component 2  
Description of component 2

## Data Flow
\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant S as System
    participant D as Database
    
    U->>S: Request
    S->>D: Query
    D->>S: Response
    S->>U: Result
\`\`\`
`;
  }

  private getDefaultTasksContent(featureName: string): string {
    return `# Task List - ${featureName}

> **CRITICAL**: All tasks MUST have checkboxes [ ] or [x]. Use Start button for main tasks. Every task REQUIRES passing unit tests before completion.

## Sprint 0: Testing Framework Setup (MANDATORY FIRST)

- [ ] 0.1: Testing Strategy and Framework Setup
  - [ ] 0.1.1: Research appropriate testing framework for technology stack
  - [ ] 0.1.2: Install and configure testing framework (Jest/Vitest/xUnit/pytest)
  - [ ] 0.1.3: Setup test file structure and naming conventions
  - [ ] 0.1.4: Configure test coverage reporting and thresholds
  - [ ] 0.1.5: Create testing documentation and guidelines
  - **Testing Required**: ✅ Framework installation tests pass
  - **Coverage Minimum**: N/A (setup phase)
  - **Validation**: Testing framework functional and ready

## Sprint 1: Foundation with Testing

- [ ] 1.1: Dependencies Research and Installation
  - [ ] 1.1.1: Research latest versions of required packages
  - [ ] 1.1.2: Install and configure base dependencies
  - [ ] 1.1.3: Setup development environment
  - [ ] 1.1.4: Configure build tools and scripts
  - [ ] 1.1.5: Write tests for configuration utilities
  - **Testing Required**: ✅ Configuration tests (5+ tests, 80%+ coverage)
  - **Test Types**: Unit tests for config validation, environment setup
  - **Validation**: All dependency installations verified with tests

- [ ] 1.2: Core Architecture Implementation
  - [ ] 1.2.1: Create project structure following best practices
  - [ ] 1.2.2: Implement base configuration files
  - [ ] 1.2.3: Setup error handling framework
  - [ ] 1.2.4: Add logging and monitoring setup
  - [ ] 1.2.5: Write comprehensive unit tests for architecture components
  - **Testing Required**: ✅ Architecture tests (10+ tests, 85%+ coverage)
  - **Test Types**: Unit tests for error handlers, logging, core utilities
  - **Validation**: All architecture components tested and verified

- [ ] 1.3: Feature Implementation with TDD
  - [ ] 1.3.1: Research implementation patterns for ${featureName}
  - [ ] 1.3.2: Write failing tests for ${featureName} functionality (TDD)
  - [ ] 1.3.3: Implement core feature functionality to pass tests
  - [ ] 1.3.4: Add comprehensive error handling with tests
  - [ ] 1.3.5: Add thorough code documentation and example tests
  - **Testing Required**: ✅ Feature tests (15+ tests, 90%+ coverage)
  - **Test Types**: Unit, integration, error scenario tests
  - **Validation**: Complete feature test suite passing

## Sprint 2: Advanced Testing and Quality

- [ ] 2.1: Comprehensive Testing Implementation
  - [ ] 2.1.1: Add integration tests for component interactions
  - [ ] 2.1.2: Implement end-to-end tests for critical user flows
  - [ ] 2.1.3: Add performance and load testing
  - [ ] 2.1.4: Implement accessibility and security tests
  - [ ] 2.1.5: Setup automated test execution in CI/CD
  - **Testing Required**: ✅ Integration & E2E tests (10+ tests, 75%+ coverage)
  - **Test Types**: Integration, E2E, performance, security tests
  - **Validation**: Full test suite automated and passing

- [ ] 2.2: Quality Assurance with Test Validation
  - [ ] 2.2.1: Code review with test quality assessment
  - [ ] 2.2.2: Security audit with penetration testing
  - [ ] 2.2.3: Performance optimization with benchmark tests
  - [ ] 2.2.4: Documentation completion with example tests
  - [ ] 2.2.5: Final test suite optimization and cleanup
  - **Testing Required**: ✅ Quality tests (5+ tests, 80%+ coverage)
  - **Test Types**: Security, performance, documentation tests
  - **Validation**: All quality gates pass with test verification

---
**MANDATORY Testing Rules:**
1. 🧪 EVERY task MUST have passing unit tests before completion
2. 🧪 MINIMUM 75% code coverage required for each task
3. 🧪 NO task completion without test validation dialog
4. 🧪 TDD approach: Write tests first, then implement
5. 🧪 All tests MUST pass before proceeding to next task
6. 🧪 Integration tests required for component interactions
7. 🧪 E2E tests required for user-facing functionality

**Testing Framework by Technology:**
- **Web/React**: Jest + React Testing Library + Playwright
- **Web/Vue**: Vue Test Utils + Jest/Vitest + Cypress
- **Desktop/Electron**: Jest + Playwright for Electron
- **Mobile/React Native**: Jest + React Native Testing Library + Detox
- **Backend/Node.js**: Jest + Supertest + integration tests
- **Desktop/.NET**: xUnit/NUnit + UI automation framework
- **Mobile/Flutter**: Flutter Test + integration_test package

**Quality Standards:**
- ✅ Unit tests for all functions and components
- ✅ Integration tests for component interactions
- ✅ E2E tests for critical user workflows
- ✅ Error scenario testing for all edge cases
- ✅ Performance testing for critical operations
- ✅ Security testing for user inputs and data handling
`;
  }

  private async loadSpecDevFiles(feature: string): Promise<{requirements: string, design: string, tasks: string}> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return { requirements: '', design: '', tasks: '' };
    }

    const featurePath = path.join(workspaceFolder.uri.fsPath, '.specdev', 'specs', feature);
    
    // Ensure feature directory exists
    if (!fs.existsSync(featurePath)) {
      fs.mkdirSync(featurePath, { recursive: true });
    }

    const files = ['requirements.md', 'design.md', 'tasks.md'];
    const content: any = {};

    for (const file of files) {
      const filePath = path.join(featurePath, file);
      const key = file.replace('.md', '');
      
      try {
        if (fs.existsSync(filePath)) {
          content[key] = fs.readFileSync(filePath, 'utf8');
        } else {
          // Create default content if file doesn't exist
          const defaultContent = this.getDefaultContentForFile(file, feature);
          fs.writeFileSync(filePath, defaultContent, 'utf8');
          content[key] = defaultContent;
        }
      } catch (error) {
        content[key] = '';
      }
    }

    return content;
  }

  private getDefaultContentForFile(filename: string, feature: string): string {
    switch (filename) {
      case 'requirements.md':
        return this.getDefaultRequirementsContent(feature);
      case 'design.md':
        return this.getDefaultDesignContent(feature);
      case 'tasks.md':
        return this.getDefaultTasksContent(feature);
      default:
        return '';
    }
  }

  private async saveSpecDevFile(type: string, content: string, feature: string): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const featurePath = path.join(workspaceFolder.uri.fsPath, '.specdev', 'specs', feature);
    
    // Ensure feature directory exists
    if (!fs.existsSync(featurePath)) {
      fs.mkdirSync(featurePath, { recursive: true });
    }

    const filePath = path.join(featurePath, `${type}.md`);
    
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      vscode.window.showInformationMessage(`${type}.md saved successfully for feature "${feature}"`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save ${type}.md: ${error}`);
    }
  }

  private setupFileWatcher() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    // Watch .specdev directory for changes
    const specdevPattern = new vscode.RelativePattern(workspaceFolder, '.specdev/**/*');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(specdevPattern);

    // Handle file changes
    this.fileWatcher.onDidChange((uri) => this.handleFileChange(uri));
    this.fileWatcher.onDidCreate((uri) => this.handleFileChange(uri));
    this.fileWatcher.onDidDelete((uri) => this.handleFileChange(uri));
  }

  private async handleFileChange(uri: vscode.Uri) {
    // Debounce rapid changes
    clearTimeout(this.fileChangeTimeout);
    this.fileChangeTimeout = setTimeout(async () => {
      if (this.webviewPanel) {
        // Reload features list
        const features = await this.getAvailableFeatures();
        this.webviewPanel.webview.postMessage({
          command: 'featuresLoaded',
          features: features
        });

        // If a specific feature file changed, reload its content
        const fileName = path.basename(uri.fsPath);
        if (['requirements.md', 'design.md', 'tasks.md'].includes(fileName)) {
          const featureName = path.basename(path.dirname(uri.fsPath));
          if (featureName === this.currentFeature) {
            const content = await this.loadFeatureFile(featureName, fileName.replace('.md', ''));
            this.webviewPanel.webview.postMessage({
              command: 'contentUpdated',
              type: fileName.replace('.md', ''),
              content: content
            });
          }
        }
      }
    }, 300); // 300ms debounce
  }

  private async loadFeatureFile(featureName: string, type: string): Promise<string> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return '';

    const specdevPath = path.join(workspaceFolder.uri.fsPath, '.specdev');
    const featurePath = path.join(specdevPath, 'specs', featureName);
    const filePath = path.join(featurePath, `${type}.md`);

    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      }
    } catch (error) {
      console.error(`Error loading ${type}.md for feature ${featureName}:`, error);
    }

    return '';
  }

  private async createContextSummary(featureName: string): Promise<string> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return '';

    const summariesPath = path.join(workspaceFolder.uri.fsPath, '.specdev', 'summaries');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const summaryFileName = `conversation-summary-${timestamp}.md`;
    const summaryPath = path.join(summariesPath, summaryFileName);

    // Create a basic summary template that the Cursor agent can fill in
    const summaryTemplate = `# Conversation Summary - ${new Date().toLocaleDateString()}

## Project Context
- **Feature**: ${featureName}
- **Date**: ${new Date().toLocaleDateString()}
- **Summary Created**: ${new Date().toLocaleString()}

## Key Decisions Made
<!-- Cursor agent should fill this section with key decisions from the conversation -->

## Requirements Summary
<!-- Cursor agent should fill this section with current requirements status -->

## Design Decisions
<!-- Cursor agent should fill this section with design choices made -->

## Task Progress
<!-- Cursor agent should fill this section with current task status -->

## Error Patterns & Solutions
<!-- Cursor agent should fill this section with any errors encountered and solutions -->

## Next Actions
<!-- Cursor agent should fill this section with planned next steps -->

---
*This summary was generated automatically. The Cursor agent will populate the sections above based on the conversation context.*
`;

    try {
      fs.writeFileSync(summaryPath, summaryTemplate);
      vscode.window.showInformationMessage(`Context summary template created: ${summaryFileName}. Use Cursor agent to populate with conversation details.`);
      return summaryPath;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create summary: ${error}`);
      return '';
    }
  }

  public dispose() {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
    if (this.fileChangeTimeout) {
      clearTimeout(this.fileChangeTimeout);
    }
  }

  // ---------- Document Cache Utilities ----------
  private getCacheDir(): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const root = workspaceFolder ? workspaceFolder.uri.fsPath : this.extensionUri.fsPath;
    const cacheDir = path.join(root, '.specdev', 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    return cacheDir;
  }

  private getCacheIndexPath(): string {
    return path.join(this.getCacheDir(), 'index.json');
  }

  private readCacheIndex(): Record<string, { etag?: string; lastModified?: string; cachedPath: string; lastFetched: string; size: number; }> {
    const p = this.getCacheIndexPath();
    if (!fs.existsSync(p)) return {} as any;
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8')) || {};
    } catch {
      return {} as any;
    }
  }

  private writeCacheIndex(idx: Record<string, { etag?: string; lastModified?: string; cachedPath: string; lastFetched: string; size: number; }>) {
    fs.writeFileSync(this.getCacheIndexPath(), JSON.stringify(idx, null, 2));
  }

  private hashUrl(url: string): string {
    return crypto.createHash('sha1').update(url).digest('hex');
  }

  private async httpFetch(url: string, headers: Record<string, string>): Promise<{ status: number; headers: any; body?: Buffer; }> {
    const lib = url.startsWith('https') ? https : http;
    return new Promise((resolve, reject) => {
      const req = lib.request(url, { method: 'GET', headers }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          resolve({ status: res.statusCode || 0, headers: res.headers, body });
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  private listCachedDocuments() {
    const idx = this.readCacheIndex();
    return Object.entries(idx).map(([url, meta]) => ({ url, ...meta }));
  }

  private invalidateCachedDocument(url: string): boolean {
    const idx = this.readCacheIndex();
    const entry = idx[url];
    if (!entry) return false;
    try {
      if (fs.existsSync(entry.cachedPath)) fs.unlinkSync(entry.cachedPath);
    } catch {}
    delete idx[url];
    this.writeCacheIndex(idx);
    return true;
  }

  private async fetchAndCacheDocument(url: string, force: boolean): Promise<{ url: string; fromCache: boolean; path?: string; error?: string; size?: number; lastFetched?: string; }> {
    if (!url || typeof url !== 'string') return { url, fromCache: false, error: 'Invalid URL' } as any;
    const ttlDays = vscode.workspace.getConfiguration().get<number>('specdev.cache.ttlDays', 7);
    const idx = this.readCacheIndex();
    const existing = idx[url];
    const now = new Date();

    if (existing && !force) {
      const last = new Date(existing.lastFetched);
      const ageDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < ttlDays && fs.existsSync(existing.cachedPath)) {
        return { url, fromCache: true, path: existing.cachedPath, size: existing.size, lastFetched: existing.lastFetched } as any;
      }
    }

    // Conditional fetch with ETag/Last-Modified
    const headers: Record<string, string> = {};
    if (existing?.etag) headers['If-None-Match'] = existing.etag;
    if (existing?.lastModified) headers['If-Modified-Since'] = existing.lastModified;

    try {
      const res = await this.httpFetch(url, headers);
      if (res.status === 304 && existing && fs.existsSync(existing.cachedPath)) {
        existing.lastFetched = now.toISOString();
        this.writeCacheIndex(idx);
        return { url, fromCache: true, path: existing.cachedPath, size: existing.size, lastFetched: existing.lastFetched } as any;
      }
      if (res.status >= 200 && res.status < 300 && res.body) {
        const cacheDir = this.getCacheDir();
        const filename = `${this.hashUrl(url)}.txt`;
        const filePath = path.join(cacheDir, filename);
        fs.writeFileSync(filePath, res.body);

        const updated = {
          etag: (res.headers['etag'] as string) || existing?.etag,
          lastModified: (res.headers['last-modified'] as string) || existing?.lastModified,
          cachedPath: filePath,
          lastFetched: now.toISOString(),
          size: res.body.length,
        };
        idx[url] = updated as any;
        this.writeCacheIndex(idx);
        return { url, fromCache: false, path: filePath, size: updated.size, lastFetched: updated.lastFetched } as any;
      }
      return { url, fromCache: false, error: `HTTP ${res.status}` } as any;
    } catch (e: any) {
      return { url, fromCache: false, error: String(e?.message || e) } as any;
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SpecDev</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                font-size: var(--vscode-font-size);
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            .feature-selector {
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .feature-selector select {
                padding: 8px 12px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                min-width: 200px;
            }
            .feature-selector button {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 4px;
            }
            .feature-selector button:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .tabs {
                display: flex;
                border-bottom: 1px solid var(--vscode-panel-border);
                margin-bottom: 20px;
            }
            .tab {
                padding: 10px 20px;
                background: var(--vscode-tab-inactiveBackground);
                border: none;
                color: var(--vscode-tab-inactiveForeground);
                cursor: pointer;
                border-bottom: 2px solid transparent;
            }
            .tab.active {
                background: var(--vscode-tab-activeBackground);
                color: var(--vscode-tab-activeForeground);
                border-bottom-color: var(--vscode-tab-activeBorder);
            }
            .content {
                display: none;
            }
            .content.active {
                display: block;
            }
            textarea {
                width: 100%;
                height: 500px;
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                padding: 10px;
                font-family: 'Courier New', monospace;
                resize: vertical;
            }
            .toolbar {
                margin-bottom: 10px;
            }
            button {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 6px 12px;
                cursor: pointer;
                margin-right: 10px;
            }
            button:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .no-features {
                text-align: center;
                padding: 40px;
                color: var(--vscode-descriptionForeground);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>SpecDev - Specification Development</h1>
            
            <div class="feature-selector">
                <label for="feature-select">Feature:</label>
                <select id="feature-select" onchange="loadFeature()">
                    <option value="">Select a feature...</option>
                </select>
                <button onclick="createNewFeature()">Create New Feature</button>
            </div>

            <div id="no-features" class="no-features" style="display: none;">
                <h3>No features found</h3>
                <p>Create your first feature to get started with SpecDev.</p>
                <button onclick="createNewFeature()">Create First Feature</button>
            </div>

            <div id="main-content" style="display: none;">
                <div class="tabs">
                    <button class="tab active" onclick="showTab('requirements')">Requirements</button>
                    <button class="tab" onclick="showTab('design')">Design</button>
                    <button class="tab" onclick="showTab('tasks')">Tasks</button>
                </div>

                <div id="requirements" class="content active">
                    <div class="toolbar">
                        <button onclick="saveFile('requirements')">Save Requirements</button>
                    </div>
                    <textarea id="requirements-content" placeholder="Enter requirements in markdown format..."></textarea>
                </div>

                <div id="design" class="content">
                    <div class="toolbar">
                        <button onclick="saveFile('design')">Save Design</button>
                    </div>
                    <textarea id="design-content" placeholder="Enter design documentation with Mermaid diagrams..."></textarea>
                </div>

                <div id="tasks" class="content">
                    <div class="toolbar">
                        <button onclick="saveFile('tasks')">Save Tasks</button>
                    </div>
                    <textarea id="tasks-content" placeholder="Enter tasks in markdown format with checkboxes..."></textarea>
                </div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            let currentContent = { requirements: '', design: '', tasks: '' };
            let currentFeature = '';
            let availableFeatures = [];

            // Load features on startup
            vscode.postMessage({ command: 'loadFeatures' });

            // Handle messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'featuresLoaded':
                        availableFeatures = message.features || [];
                        updateFeatureDropdown();
                        break;
                    case 'filesLoaded':
                        currentContent = message.content;
                        currentFeature = message.currentFeature;
                        updateTextareas();
                        break;
                    case 'contentUpdated':
                        // Real-time content update
                        if (currentContent && message.type) {
                            currentContent[message.type] = message.content;
                            updateTextareas();
                        }
                        break;
                }
            });

            function updateFeatureDropdown() {
                const select = document.getElementById('feature-select');
                const noFeatures = document.getElementById('no-features');
                const mainContent = document.getElementById('main-content');
                
                // Clear existing options
                select.innerHTML = '<option value="">Select a feature...</option>';
                
                if (availableFeatures.length === 0) {
                    noFeatures.style.display = 'block';
                    mainContent.style.display = 'none';
                } else {
                    noFeatures.style.display = 'none';
                    mainContent.style.display = 'block';
                    
                    // Add feature options
                    availableFeatures.forEach(feature => {
                        const option = document.createElement('option');
                        option.value = feature;
                        option.textContent = feature;
                        select.appendChild(option);
                    });
                }
            }

            function loadFeature() {
                const select = document.getElementById('feature-select');
                const selectedFeature = select.value;
                
                if (selectedFeature) {
                    vscode.postMessage({
                        command: 'loadFiles',
                        feature: selectedFeature
                    });
                }
            }

            function createNewFeature() {
                const featureName = prompt('Enter feature name:');
                if (featureName && featureName.trim()) {
                    vscode.postMessage({
                        command: 'createFeature',
                        featureName: featureName.trim()
                    });
                }
            }

            function showTab(tabName) {
                // Hide all content
                const contents = document.querySelectorAll('.content');
                contents.forEach(content => content.classList.remove('active'));
                
                // Remove active from all tabs
                const tabs = document.querySelectorAll('.tab');
                tabs.forEach(tab => tab.classList.remove('active'));
                
                // Show selected content and tab
                document.getElementById(tabName).classList.add('active');
                event.target.classList.add('active');
            }

            function saveFile(type) {
                if (!currentFeature) {
                    alert('Please select a feature first');
                    return;
                }
                
                const content = document.getElementById(type + '-content').value;
                vscode.postMessage({
                    command: 'saveFile',
                    type: type,
                    content: content,
                    feature: currentFeature
                });
            }

            function updateTextareas() {
                document.getElementById('requirements-content').value = currentContent.requirements || getDefaultContent('requirements');
                document.getElementById('design-content').value = currentContent.design || getDefaultContent('design');
                document.getElementById('tasks-content').value = currentContent.tasks || getDefaultContent('tasks');
            }

            function getDefaultContent(type) {
                switch(type) {
                    case 'requirements':
                        return \`# Requirements Document\n\n## Introduction\n[Introduction text here]\n\n## Requirements\n\n### Requirement 1\n**User Story:** As a [role], I want [feature], so that [benefit]\n\n#### Acceptance Criteria\nThis section should have EARS requirements\n1. WHEN [event] THEN [system] SHALL [response]\n2. IF [precondition] THEN [system] SHALL [response]\n\n### Requirement 2\n**User Story:** As a [role], I want [feature], so that [benefit]\n\n#### Acceptance Criteria\n1. WHEN [event] THEN [system] SHALL [response]\n2. WHEN [event] AND [condition] THEN [system] SHALL [response]\n\`;
                    case 'design':
                        return \`# Design Document\n\n## Architecture Overview\n\\\`\\\`\\\`mermaid\ngraph TD\n    A[User Interface] --> B[Business Logic]\n    B --> C[Data Layer]\n    C --> D[Storage]\n\\\`\\\`\\\`\n\n## System Components\n\n### Component 1\nDescription of component 1\n\n### Component 2  \nDescription of component 2\n\n## Data Flow\n\\\`\\\`\\\`mermaid\nsequenceDiagram\n    participant U as User\n    participant S as System\n    participant D as Database\n    \n    U->>S: Request\n    S->>D: Query\n    D->>S: Response\n    S->>U: Result\n\\\`\\\`\\\`\n\`;
                    case 'tasks':
                        return \`# Task List\n\n## Sprint 1\n\n- [ ] Task 1: Implement user authentication\n  - [ ] Create login form\n  - [ ] Add validation\n  - [ ] Integrate with backend API\n\n- [ ] Task 2: Design database schema\n  - [x] Define user table\n  - [ ] Define product table\n  - [ ] Create relationships\n\n- [ ] Task 3: Setup project infrastructure\n  - [x] Initialize repository\n  - [x] Setup CI/CD pipeline\n  - [ ] Configure deployment\n\`;
                    default:
                        return '';
                }
            }
        </script>
    </body>
    </html>`;
  }

  private getReactHtml(webview: vscode.Webview): string | undefined {
    try {
      const buildDir = path.join(this.extensionUri.fsPath, 'webview', 'build');
      const indexPath = path.join(buildDir, 'index.html');
      if (!fs.existsSync(indexPath)) {
        return undefined;
      }

      let html = fs.readFileSync(indexPath, 'utf8');
      const baseUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'webview', 'build')).toString();
      const nonce = crypto.randomBytes(16).toString('base64');

      // Inject CSP compatible with VS Code webviews
      const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}' ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; connect-src ${webview.cspSource} https: http:;">`;
      html = html.replace('</title>', '</title>\n' + csp);

      // Fix absolute asset paths to webview URIs
      html = html.replace(/(href|src)="\/(static\/[^"]+)"/g, (_m, attr, p1) => `${attr}="${baseUri}/${p1}"`);
      html = html.replace(/href="\/favicon\.ico"/g, `href="${baseUri}/favicon.ico"`);
      html = html.replace(/href="\/manifest\.json"/g, `href="${baseUri}/manifest.json"`);

      // Add nonce to all script tags
      html = html.replace(/<script\b/gi, `<script nonce="${nonce}"`);

      // Expose VS Code API to the React app (inline script needs nonce)
      html = html.replace('</body>', `<script nonce="${nonce}">try{window.vscode = acquireVsCodeApi();}catch(e){}</script>\n</body>`);
      return html;
    } catch (err) {
      console.error('Failed to load React webview:', err);
      return undefined;
    }
  }
}

async function analyzeExistingProject(projectPath: string) {
  const specdevPath = path.join(projectPath, '.specdev');
  const analysisPath = path.join(specdevPath, 'project-analysis.json');
  
  // Create project analysis data for Cursor agent
  const analysis = {
    timestamp: new Date().toISOString(),
    projectPath: projectPath,
    detectedFeatures: await detectExistingFeatures(projectPath),
    techStack: await detectTechStack(projectPath),
    projectStructure: await analyzeProjectStructure(projectPath),
    existingSpecs: await findExistingSpecs(specdevPath),
    recommendations: []
  };
  
  // Save analysis for Cursor agent context
  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
  
  // Create a summary file that Cursor can easily read
  const summaryPath = path.join(specdevPath, 'project-summary.md');
  const summary = generateProjectSummary(analysis);
  fs.writeFileSync(summaryPath, summary);
}

async function detectExistingFeatures(projectPath: string): Promise<string[]> {
  const features: string[] = [];
  
  // Check common feature indicators
  const indicators = [
    { pattern: /auth|login|signin|signup/i, feature: 'authentication' },
    { pattern: /user|profile|account/i, feature: 'user-management' },
    { pattern: /payment|checkout|cart|order/i, feature: 'e-commerce' },
    { pattern: /api|endpoint|route/i, feature: 'api-endpoints' },
    { pattern: /database|db|model/i, feature: 'database-integration' },
    { pattern: /upload|file|image/i, feature: 'file-management' },
    { pattern: /notification|email|sms/i, feature: 'notifications' },
    { pattern: /admin|dashboard|panel/i, feature: 'admin-panel' },
    { pattern: /search|filter|sort/i, feature: 'search-functionality' },
    { pattern: /chat|message|comment/i, feature: 'messaging-system' }
  ];
  
  // Scan files for feature indicators
  try {
    const files = await scanProjectFiles(projectPath);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8').toLowerCase();
      const fileName = path.basename(file).toLowerCase();
      
      for (const indicator of indicators) {
        if (indicator.pattern.test(content) || indicator.pattern.test(fileName)) {
          if (!features.includes(indicator.feature)) {
            features.push(indicator.feature);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error detecting features:', error);
  }
  
  return features;
}

async function detectTechStack(projectPath: string): Promise<any> {
  const techStack = {
    frontend: [] as string[],
    backend: [] as string[],
    database: [] as string[],
    tools: [] as string[],
    languages: [] as string[]
  };
  
  // Check package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Analyze dependencies
      Object.keys(deps).forEach(dep => {
        if (/^react$/i.test(dep)) techStack.frontend.push('React');
        if (/^vue$/i.test(dep)) techStack.frontend.push('Vue');
        if (/^angular/i.test(dep)) techStack.frontend.push('Angular');
        if (/^next$/i.test(dep)) techStack.frontend.push('Next.js');
        if (/^nuxt/i.test(dep)) techStack.frontend.push('Nuxt.js');
        if (/^express$/i.test(dep)) techStack.backend.push('Express.js');
        if (/^fastify$/i.test(dep)) techStack.backend.push('Fastify');
        if (/^mongodb|mongoose/i.test(dep)) techStack.database.push('MongoDB');
        if (/^pg|postgres/i.test(dep)) techStack.database.push('PostgreSQL');
        if (/^mysql/i.test(dep)) techStack.database.push('MySQL');
        if (/^sqlite/i.test(dep)) techStack.database.push('SQLite');
        if (/^typescript$/i.test(dep)) techStack.languages.push('TypeScript');
      });
    } catch (error) {
      console.error('Error parsing package.json:', error);
    }
  }
  
  // Check for other config files
  if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) {
    techStack.languages.push('Python');
  }
  if (fs.existsSync(path.join(projectPath, 'Gemfile'))) {
    techStack.languages.push('Ruby');
  }
  if (fs.existsSync(path.join(projectPath, 'pom.xml'))) {
    techStack.languages.push('Java');
  }
  if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
    techStack.languages.push('Go');
  }
  
  return techStack;
}

async function analyzeProjectStructure(projectPath: string): Promise<any> {
  const structure = {
    hasTests: false,
    hasDocumentation: false,
    hasCICD: false,
    hasDocker: false,
    folderStructure: []
  };
  
  // Check for common files/folders
  structure.hasTests = fs.existsSync(path.join(projectPath, 'test')) || 
                      fs.existsSync(path.join(projectPath, 'tests')) ||
                      fs.existsSync(path.join(projectPath, '__tests__'));
                      
  structure.hasDocumentation = fs.existsSync(path.join(projectPath, 'README.md')) ||
                              fs.existsSync(path.join(projectPath, 'docs'));
                              
  structure.hasCICD = fs.existsSync(path.join(projectPath, '.github')) ||
                     fs.existsSync(path.join(projectPath, '.gitlab-ci.yml'));
                     
  structure.hasDocker = fs.existsSync(path.join(projectPath, 'Dockerfile')) ||
                       fs.existsSync(path.join(projectPath, 'docker-compose.yml'));
  
  return structure;
}

async function findExistingSpecs(specdevPath: string): Promise<string[]> {
  const specs: string[] = [];
  const specsPath = path.join(specdevPath, 'specs');
  
  if (fs.existsSync(specsPath)) {
    try {
      const folders = fs.readdirSync(specsPath);
      for (const folder of folders) {
        const folderPath = path.join(specsPath, folder);
        if (fs.statSync(folderPath).isDirectory()) {
          specs.push(folder);
        }
      }
    } catch (error) {
      console.error('Error finding existing specs:', error);
    }
  }
  
  return specs;
}

async function scanProjectFiles(projectPath: string): Promise<string[]> {
  const files: string[] = [];
  const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rb', '.php'];
  
  function scanDirectory(dir: string) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip common directories to avoid
          if (!['node_modules', '.git', 'dist', 'build', '.next', '__pycache__'].includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }
  
  scanDirectory(projectPath);
  return files.slice(0, 100); // Limit to first 100 files to avoid performance issues
}

function generateProjectSummary(analysis: any): string {
  return `# Project Analysis Summary

## Generated: ${analysis.timestamp}

## Detected Features
${analysis.detectedFeatures.map((f: string) => `- ${f}`).join('\n')}

## Technology Stack
**Frontend**: ${analysis.techStack.frontend.join(', ') || 'Not detected'}
**Backend**: ${analysis.techStack.backend.join(', ') || 'Not detected'}
**Database**: ${analysis.techStack.database.join(', ') || 'Not detected'}
**Languages**: ${analysis.techStack.languages.join(', ') || 'JavaScript'}

## Project Structure
- Tests: ${analysis.projectStructure.hasTests ? '✅ Present' : '❌ Missing'}
- Documentation: ${analysis.projectStructure.hasDocumentation ? '✅ Present' : '❌ Missing'}
- CI/CD: ${analysis.projectStructure.hasCICD ? '✅ Present' : '❌ Missing'}
- Docker: ${analysis.projectStructure.hasDocker ? '✅ Present' : '❌ Missing'}

## Existing Specifications
${analysis.existingSpecs.length > 0 ? analysis.existingSpecs.map((s: string) => `- ${s}`).join('\n') : 'No existing specifications found'}

## Recommendations for Next Features
Based on the analysis, consider adding:
- Enhanced error handling and logging
- Comprehensive testing suite
- API documentation
- Security improvements
- Performance optimizations
- User experience enhancements

*This analysis provides context for the Cursor agent to better understand your project and suggest relevant improvements.*
`;
}

async function checkForUpdates() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const specdevPath = path.join(workspaceFolder.uri.fsPath, '.specdev');
  const versionInfoPath = path.join(specdevPath, 'version-info.json');
  
  // Only check if SpecDev is already initialized
  if (!fs.existsSync(specdevPath) || !fs.existsSync(versionInfoPath)) {
    return;
  }

  try {
    const versionInfo = JSON.parse(fs.readFileSync(versionInfoPath, 'utf8'));
    const currentVersion = versionInfo.specdevVersion || '0.1.0';
    const latestVersion = '0.3.0';
    
    if (currentVersion !== latestVersion) {
      // Show non-intrusive update notification
      const choice = await vscode.window.showInformationMessage(
        `SpecDev update available: ${currentVersion} → ${latestVersion}. New features include context summarization and real-time updates.`,
        'Update Now',
        'Later'
      );
      
      if (choice === 'Update Now') {
        vscode.commands.executeCommand('specdev.update');
      }
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

/**
 * Forces update of all SpecDev rules, overwriting existing ones
 * Used during updates to ensure new rules are copied even when old rules exist
 */
async function forceUpdateRules() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const cursorRulesPath = getAgentRulesPath(workspaceFolder.uri.fsPath);
  
  // Ensure .cursor/rules directory exists
  if (!fs.existsSync(cursorRulesPath)) fs.mkdirSync(cursorRulesPath, { recursive: true });
  
  // Always copy all rules (force update) - ALL 20 FILES
  const rulesToCopy = [
    { src: 'enhanced-spec-workflow.mdc', dest: 'specdev-enhanced-workflow.mdc' },
    { src: 'project-analysis-rules.mdc', dest: 'specdev-project-analysis.mdc' },
    { src: 'error-tracking-rules.mdc', dest: 'specdev-error-tracking.mdc' },
    { src: 'enhanced-error-handling.mdc', dest: 'specdev-enhanced-error-handling.mdc' },
    { src: 'comprehensive-project-templates.mdc', dest: 'specdev-project-templates.mdc' },
    { src: 'web-search-rules.mdc', dest: 'specdev-web-search-rules.mdc' },
    { src: 'codebase-steering-rules.mdc', dest: 'specdev-codebase-steering.mdc' },
    { src: 'testing-and-quality-rules.mdc', dest: 'specdev-testing-quality.mdc' },
    { src: 'mandatory-testing-validation.mdc', dest: 'specdev-mandatory-testing.mdc' },
    { src: 'package-installation-workflow.mdc', dest: 'specdev-package-workflow.mdc' },
    { src: 'requirements-optimization-rules.mdc', dest: 'specdev-requirements-optimization.mdc' },
    { src: 'prompt-optimization-rules.mdc', dest: 'specdev-prompt-optimization.mdc' },
    { src: 'context-summarization-rules.mdc', dest: 'specdev-context-summarization.mdc' },
    { src: 'version-migration-rules.mdc', dest: 'specdev-version-migration.mdc' },
    { src: 'research-first-development.mdc', dest: 'specdev-research-first.mdc' },
    { src: 'parallel-processing-optimization.mdc', dest: 'specdev-parallel-processing.mdc' },
    { src: 'high-quality-requirements-design-tasks.mdc', dest: 'specdev-high-quality-deliverables.mdc' },
    { src: 'think-first-development.mdc', dest: 'specdev-think-first.mdc' },
    { src: 'agent-personas.mdc', dest: 'specdev-agent-personas.mdc' },
    { src: 'spec.mdc', dest: 'specdev-spec.mdc' },
    { src: 'tasks.mdc', dest: 'specdev-tasks.mdc' }
  ];
  
  let copiedCount = 0;
  let skippedCount = 0;
  
  rulesToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(__dirname, '..', 'prompts and rules', src);
    const destPath = computeDestPath(cursorRulesPath, dest);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
    } else {
      console.warn(`Rule file not found: ${src}`);
      skippedCount++;
    }
  });

  // Create .specdev directory structure
  const specdevPath = path.join(workspaceFolder.uri.fsPath, '.specdev');
  const specsPath = path.join(specdevPath, 'specs');
  const summariesPath = path.join(specdevPath, 'summaries');
  const backupPath = path.join(specdevPath, 'backup');
  if (!fs.existsSync(specdevPath)) fs.mkdirSync(specdevPath, { recursive: true });
  if (!fs.existsSync(specsPath)) fs.mkdirSync(specsPath, { recursive: true });
  if (!fs.existsSync(summariesPath)) fs.mkdirSync(summariesPath, { recursive: true });
  if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath, { recursive: true });
  
  // Initialize error database
  const errorDbPath = path.join(specdevPath, 'error-database.json');
  if (!fs.existsSync(errorDbPath)) {
    const emptyDb = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      errors: []
    };
    fs.writeFileSync(errorDbPath, JSON.stringify(emptyDb, null, 2));
  }

  // Initialize/update version tracking
  const versionInfoPath = path.join(specdevPath, 'version-info.json');
  const currentVersion = '0.3.0'; // Update this when releasing new versions
  
  let versionInfo = {
    specdevVersion: currentVersion,
    rulesVersion: currentVersion,
    lastUpdated: new Date().toISOString(),
    installedFeatures: [
      'enhanced-workflow',
      'project-analysis', 
      'error-tracking',
      'context-summarization',
      'version-migration',
      'testing-quality',
      'research-first-development',
      'parallel-processing-optimization', 
      'high-quality-deliverables',
      'think-first-development'
    ],
    migrationHistory: [] as Array<{
      fromVersion: string;
      toVersion: string;
      migratedAt: string;
      changes: string[];
    }>
  };

  if (fs.existsSync(versionInfoPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(versionInfoPath, 'utf8'));
      // Check if we need to migrate from older version
      if (existing.specdevVersion !== currentVersion) {
        versionInfo.migrationHistory = existing.migrationHistory || [];
        versionInfo.migrationHistory.push({
          fromVersion: existing.specdevVersion || '0.1.0',
          toVersion: currentVersion,
          migratedAt: new Date().toISOString(),
          changes: ['force updated all rules', 'added think-first development', 'enhanced research-first approach']
        });
      } else {
        versionInfo = existing; // Keep existing info if versions match
        versionInfo.lastUpdated = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error reading version info, creating new:', error);
    }
  }

  fs.writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2));

  return { copiedCount, skippedCount };
}

/**
 * Creates or updates .gitignore to exclude SpecDev development files
 * Preserves existing .gitignore content while adding SpecDev-specific exclusions
 */
async function updateGitIgnoreForProduction() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const gitignorePath = path.join(workspaceFolder.uri.fsPath, '.gitignore');
  
  // SpecDev-specific ignore patterns
  const specdevIgnorePatterns = [
    '',
    '# SpecDev - Development and specification files',
    '# Remove these lines if you want to include specs in your repository',
    '.specdev/',
    '.cursor/',
    '',
    '# SpecDev generated files',
    'requirements-template.md',
    'design-template.md', 
    'tasks-template.md',
    'project-analysis.json',
    'project-summary.md'
  ];

  let existingContent = '';
  let hasSpecdevSection = false;

  // Read existing .gitignore if it exists
  if (fs.existsSync(gitignorePath)) {
    existingContent = fs.readFileSync(gitignorePath, 'utf8');
    hasSpecdevSection = existingContent.includes('# SpecDev - Development and specification files');
  }

  // Only add SpecDev section if it doesn't already exist
  if (!hasSpecdevSection) {
    const newContent = existingContent.trim() + '\n' + specdevIgnorePatterns.join('\n') + '\n';
    fs.writeFileSync(gitignorePath, newContent);
    
    return {
      created: !fs.existsSync(gitignorePath),
      updated: fs.existsSync(gitignorePath),
      patternsAdded: specdevIgnorePatterns.length - 3 // Exclude comment lines
    };
  }

  return { created: false, updated: false, patternsAdded: 0 };
}

async function initializeRulesIfNeeded() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const cursorRulesPath = getAgentRulesPath(workspaceFolder.uri.fsPath);
  const specdevRulesExist = fs.existsSync(path.join(cursorRulesPath, 'specdev-enhanced-workflow.mdc'));
  
  // Auto-initialize rules if they don't exist
  if (!specdevRulesExist) {
    if (!fs.existsSync(cursorRulesPath)) fs.mkdirSync(cursorRulesPath, { recursive: true });
    
    // Copy enhanced rules with proper .mdc format - ALL 20 FILES
    const rulesToCopy = [
      { src: 'enhanced-spec-workflow.mdc', dest: 'specdev-enhanced-workflow.mdc' },
      { src: 'project-analysis-rules.mdc', dest: 'specdev-project-analysis.mdc' },
      { src: 'error-tracking-rules.mdc', dest: 'specdev-error-tracking.mdc' },
      { src: 'comprehensive-project-templates.mdc', dest: 'specdev-project-templates.mdc' },
      { src: 'web-search-rules.mdc', dest: 'specdev-web-search-rules.mdc' },
      { src: 'testing-and-quality-rules.mdc', dest: 'specdev-testing-quality.mdc' },
      { src: 'requirements-optimization-rules.mdc', dest: 'specdev-requirements-optimization.mdc' },
      { src: 'prompt-optimization-rules.mdc', dest: 'specdev-prompt-optimization.mdc' },
      { src: 'context-summarization-rules.mdc', dest: 'specdev-context-summarization.mdc' },
      { src: 'version-migration-rules.mdc', dest: 'specdev-version-migration.mdc' },
      { src: 'research-first-development.mdc', dest: 'specdev-research-first.mdc' },
      { src: 'parallel-processing-optimization.mdc', dest: 'specdev-parallel-processing.mdc' },
      { src: 'high-quality-requirements-design-tasks.mdc', dest: 'specdev-high-quality-deliverables.mdc' },
      { src: 'think-first-development.mdc', dest: 'specdev-think-first.mdc' },
      { src: 'agent-personas.mdc', dest: 'specdev-agent-personas.mdc' },
      { src: 'spec.mdc', dest: 'specdev-spec.mdc' },
      { src: 'tasks.mdc', dest: 'specdev-tasks.mdc' }
    ];
    
    rulesToCopy.forEach(({ src, dest }) => {
      const srcPath = path.join(__dirname, '..', 'prompts and rules', src);
      const destPath = computeDestPath(cursorRulesPath, dest);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    });

    // Create .specdev directory structure
    const specdevPath = path.join(workspaceFolder.uri.fsPath, '.specdev');
    const specsPath = path.join(specdevPath, 'specs');
    const summariesPath = path.join(specdevPath, 'summaries');
    const backupPath = path.join(specdevPath, 'backup');
    if (!fs.existsSync(specdevPath)) fs.mkdirSync(specdevPath, { recursive: true });
    if (!fs.existsSync(specsPath)) fs.mkdirSync(specsPath, { recursive: true });
    if (!fs.existsSync(summariesPath)) fs.mkdirSync(summariesPath, { recursive: true });
    if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath, { recursive: true });
    
    // Initialize error database
    const errorDbPath = path.join(specdevPath, 'error-database.json');
    if (!fs.existsSync(errorDbPath)) {
      const emptyDb = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        errors: []
      };
      fs.writeFileSync(errorDbPath, JSON.stringify(emptyDb, null, 2));
    }

    // Initialize/update version tracking
    const versionInfoPath = path.join(specdevPath, 'version-info.json');
    const currentVersion = '0.3.0'; // Update this when releasing new versions
    
    let versionInfo = {
      specdevVersion: currentVersion,
      rulesVersion: currentVersion,
      lastUpdated: new Date().toISOString(),
      installedFeatures: [
        'enhanced-workflow',
        'project-analysis', 
        'error-tracking',
        'context-summarization',
        'version-migration',
        'testing-quality',
        'research-first-development',
        'parallel-processing-optimization', 
        'high-quality-deliverables',
        'think-first-development'
      ],
      migrationHistory: [] as Array<{
        fromVersion: string;
        toVersion: string;
        migratedAt: string;
        changes: string[];
      }>
    };

    if (fs.existsSync(versionInfoPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(versionInfoPath, 'utf8'));
        // Check if we need to migrate from older version
        if (existing.specdevVersion !== currentVersion) {
          versionInfo.migrationHistory = existing.migrationHistory || [];
          versionInfo.migrationHistory.push({
            fromVersion: existing.specdevVersion || '0.1.0',
            toVersion: currentVersion,
            migratedAt: new Date().toISOString(),
            changes: ['added version migration', 'enhanced context summarization', 'improved real-time updates']
          });
        } else {
          versionInfo = existing; // Keep existing info if versions match
          versionInfo.lastUpdated = new Date().toISOString();
        }
      } catch (error) {
        console.error('Error reading version info, creating new:', error);
      }
    }

    fs.writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2));

    // Update .gitignore for production-ready repositories
    const gitIgnoreResult = await updateGitIgnoreForProduction();
    
    let gitIgnoreMessage = '';
    if (gitIgnoreResult?.created) {
      gitIgnoreMessage = '\n📁 Created .gitignore with SpecDev exclusions for production';
    } else if (gitIgnoreResult?.updated) {
      gitIgnoreMessage = '\n📁 Updated .gitignore with SpecDev exclusions for production';
    }

    vscode.window.showInformationMessage('SpecDev Enhanced rules automatically initialized! All 20 rule files copied. Cursor agent now has access to enhanced workflow, QA/QC, testing validation, and adaptive project analysis.' + gitIgnoreMessage);
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Auto-initialize rules when extension activates
  initializeRulesIfNeeded();
  
  // Check for updates (non-intrusive)
  checkForUpdates();

  const provider = vscode.commands.registerCommand('specdev.openSpecDev', () => {
    SpecDevProvider.createOrShow(context);
  });

  // /specdev steering - for existing projects
  const steeringCmd = vscode.commands.registerCommand('specdev.steering', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
      return;
    }

    // Ensure .specdev directory exists
    const specdevPath = path.join(workspaceFolder.uri.fsPath, '.specdev');
    const specsPath = path.join(specdevPath, 'specs');
    const summariesPath = path.join(specdevPath, 'summaries');
    const backupPath = path.join(specdevPath, 'backup');
    if (!fs.existsSync(specdevPath)) fs.mkdirSync(specdevPath, { recursive: true });
    if (!fs.existsSync(specsPath)) fs.mkdirSync(specsPath, { recursive: true });
    if (!fs.existsSync(summariesPath)) fs.mkdirSync(summariesPath, { recursive: true });
    if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath, { recursive: true });

    // Initialize/update error database
    const errorDbPath = path.join(specdevPath, 'error-database.json');
    if (!fs.existsSync(errorDbPath)) {
      const emptyDb = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        errors: []
      };
      fs.writeFileSync(errorDbPath, JSON.stringify(emptyDb, null, 2));
    }

    // Ensure enhanced .cursor/rules files are up to date
    const cursorRulesPath = getAgentRulesPath(workspaceFolder.uri.fsPath);
    if (!fs.existsSync(cursorRulesPath)) fs.mkdirSync(cursorRulesPath, { recursive: true });
    
    // Copy/update enhanced rules including steering-specific rules - ALL 20 FILES
    const rulesToCopy = [
      { src: 'enhanced-spec-workflow.mdc', dest: 'specdev-enhanced-workflow.mdc' },
      { src: 'project-analysis-rules.mdc', dest: 'specdev-project-analysis.mdc' },
      { src: 'error-tracking-rules.mdc', dest: 'specdev-error-tracking.mdc' },
      { src: 'comprehensive-project-templates.mdc', dest: 'specdev-project-templates.mdc' },
      { src: 'web-search-rules.mdc', dest: 'specdev-web-search-rules.mdc' },
      { src: 'codebase-steering-rules.mdc', dest: 'specdev-codebase-steering.mdc' },
      { src: 'testing-and-quality-rules.mdc', dest: 'specdev-testing-quality.mdc' },
      { src: 'requirements-optimization-rules.mdc', dest: 'specdev-requirements-optimization.mdc' },
      { src: 'prompt-optimization-rules.mdc', dest: 'specdev-prompt-optimization.mdc' },
      { src: 'context-summarization-rules.mdc', dest: 'specdev-context-summarization.mdc' },
      { src: 'version-migration-rules.mdc', dest: 'specdev-version-migration.mdc' },
      { src: 'research-first-development.mdc', dest: 'specdev-research-first.mdc' },
      { src: 'parallel-processing-optimization.mdc', dest: 'specdev-parallel-processing.mdc' },
      { src: 'high-quality-requirements-design-tasks.mdc', dest: 'specdev-high-quality-deliverables.mdc' },
      { src: 'think-first-development.mdc', dest: 'specdev-think-first.mdc' },
      { src: 'agent-personas.mdc', dest: 'specdev-agent-personas.mdc' },
      { src: 'spec.mdc', dest: 'specdev-spec.mdc' },
      { src: 'tasks.mdc', dest: 'specdev-tasks.mdc' }
    ];
    
    rulesToCopy.forEach(({ src, dest }) => {
      const srcPath = path.join(__dirname, '..', 'prompts and rules', src);
      const destPath = computeDestPath(cursorRulesPath, dest);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    });

    // Check for existing specs and warn user
    const existingSpecs = await findExistingSpecs(specdevPath);
    if (existingSpecs.length > 0) {
      const choice = await vscode.window.showWarningMessage(
        `Found existing specifications: ${existingSpecs.join(', ')}. Running steering will analyze your codebase but preserve existing specs.`,
        'Continue with Analysis',
        'Cancel'
      );
      if (choice !== 'Continue with Analysis') {
        return;
      }
    }

    // Analyze existing project and generate feature summary (preserves existing specs)
    await analyzeExistingProject(workspaceFolder.uri.fsPath);
    
    // Update .gitignore for production-ready repositories
    const gitIgnoreResult = await updateGitIgnoreForProduction();
    
    let gitIgnoreMessage = '';
    if (gitIgnoreResult?.created) {
      gitIgnoreMessage = '\n📁 Created .gitignore with SpecDev exclusions for production';
    } else if (gitIgnoreResult?.updated) {
      gitIgnoreMessage = '\n📁 Updated .gitignore with SpecDev exclusions for production';
    }
    
    vscode.window.showInformationMessage('Project steering analysis complete! Existing specs preserved. Cursor agent now has enhanced context about your project and can help with next features.' + gitIgnoreMessage);
  });

  // /specdev init
  const initCmd = vscode.commands.registerCommand('specdev.init', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;
    
    // Create .specdev directory structure
    const specdevPath = path.join(workspaceFolder.uri.fsPath, '.specdev');
    const specsPath = path.join(specdevPath, 'specs');
    const summariesPath = path.join(specdevPath, 'summaries');
    
    // Check for existing .specdev directory and warn user
    if (fs.existsSync(specdevPath)) {
      const existingSpecs = await findExistingSpecs(specdevPath);
      if (existingSpecs.length > 0) {
        const choice = await vscode.window.showWarningMessage(
          `SpecDev is already initialized with existing specifications: ${existingSpecs.join(', ')}. This will not overwrite existing specs but will update system files.`,
          'Continue with Init',
          'Use Steering Instead',
          'Cancel'
        );
        if (choice === 'Cancel') {
          return;
        } else if (choice === 'Use Steering Instead') {
          vscode.commands.executeCommand('specdev.steering');
          return;
        }
      }
    }
    
    if (!fs.existsSync(specdevPath)) fs.mkdirSync(specdevPath, { recursive: true });
    if (!fs.existsSync(specsPath)) fs.mkdirSync(specsPath, { recursive: true });
    if (!fs.existsSync(summariesPath)) fs.mkdirSync(summariesPath, { recursive: true });
    
    // Initialize error database
    const errorDbPath = path.join(specdevPath, 'error-database.json');
    if (!fs.existsSync(errorDbPath)) {
      const emptyDb = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        errors: []
      };
      fs.writeFileSync(errorDbPath, JSON.stringify(emptyDb, null, 2));
    }
    
    // Generate enhanced .cursor/rules files
    const cursorRulesPath = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
    if (!fs.existsSync(cursorRulesPath)) fs.mkdirSync(cursorRulesPath, { recursive: true });
    
    // Copy enhanced rules with proper .mdc format - ALL 20 FILES
    const rulesToCopy = [
      { src: 'enhanced-spec-workflow.mdc', dest: 'specdev-enhanced-workflow.mdc' },
      { src: 'project-analysis-rules.mdc', dest: 'specdev-project-analysis.mdc' },
      { src: 'error-tracking-rules.mdc', dest: 'specdev-error-tracking.mdc' },
      { src: 'comprehensive-project-templates.mdc', dest: 'specdev-project-templates.mdc' },
      { src: 'web-search-rules.mdc', dest: 'specdev-web-search-rules.mdc' },
      { src: 'testing-and-quality-rules.mdc', dest: 'specdev-testing-quality.mdc' },
      { src: 'requirements-optimization-rules.mdc', dest: 'specdev-requirements-optimization.mdc' },
      { src: 'prompt-optimization-rules.mdc', dest: 'specdev-prompt-optimization.mdc' },
      { src: 'context-summarization-rules.mdc', dest: 'specdev-context-summarization.mdc' },
      { src: 'version-migration-rules.mdc', dest: 'specdev-version-migration.mdc' },
      { src: 'research-first-development.mdc', dest: 'specdev-research-first.mdc' },
      { src: 'parallel-processing-optimization.mdc', dest: 'specdev-parallel-processing.mdc' },
      { src: 'high-quality-requirements-design-tasks.mdc', dest: 'specdev-high-quality-deliverables.mdc' },
      { src: 'think-first-development.mdc', dest: 'specdev-think-first.mdc' },
      { src: 'agent-personas.mdc', dest: 'specdev-agent-personas.mdc' },
      { src: 'spec.mdc', dest: 'specdev-spec.mdc' },
      { src: 'tasks.mdc', dest: 'specdev-tasks.mdc' }
    ];
    
    rulesToCopy.forEach(({ src, dest }) => {
      const srcPath = path.join(__dirname, '..', 'prompts and rules', src);
      const destPath = computeDestPath(cursorRulesPath, dest);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    });
    
    // Update .gitignore for production-ready repositories
    const gitIgnoreResult = await updateGitIgnoreForProduction();
    
    let gitIgnoreMessage = '';
    if (gitIgnoreResult?.created) {
      gitIgnoreMessage = '\n📁 Created .gitignore with SpecDev exclusions for production';
    } else if (gitIgnoreResult?.updated) {
      gitIgnoreMessage = '\n📁 Updated .gitignore with SpecDev exclusions for production';
    }

    vscode.window.showInformationMessage('SpecDev Enhanced System initialized! All 20 rule files copied: enhanced workflow, testing validation, error handling, package workflow, QA/QC, 2025-2026 web search, and adaptive project analysis rules added to .cursor/rules/' + gitIgnoreMessage);
  });

  // /specdev generate requirements from prompt
  const genReqCmd = vscode.commands.registerCommand('specdev.generateRequirementsFromPrompt', async () => {
    // This command guides users to use Cursor agent with SpecDev rules for generation
    // Extension provides templates and context, Cursor agent does the actual generation
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
      return;
    }

    // Create a requirements template for the Cursor agent to fill in
    const specdevPath = path.join(workspaceFolder.uri.fsPath, '.specdev');
    if (!fs.existsSync(specdevPath)) {
      vscode.window.showErrorMessage('SpecDev not initialized. Run "SpecDev: Init SpecDev Project" first.');
      return;
    }

    const templatePath = path.join(specdevPath, 'requirements-template.md');
    const templateContent = `# Requirements Generation Template

## Instructions for Cursor Agent
Use the SpecDev rules to generate high-quality requirements based on the user's prompt.

## User Prompt
[Paste your project description/prompt here]

## Generated Requirements
[Cursor agent will fill this section using SpecDev requirements rules]

---
*This template guides the Cursor agent to generate requirements using SpecDev best practices and research-first approach.*
`;

    fs.writeFileSync(templatePath, templateContent);
    const doc = await vscode.workspace.openTextDocument(templatePath);
    await vscode.window.showTextDocument(doc);
    
    vscode.window.showInformationMessage(
      'Requirements template created! Add your prompt and ask the Cursor agent to generate requirements using SpecDev rules.'
    );
  });

  // /specdev generate design from requirements
  const genDesignCmd = vscode.commands.registerCommand('specdev.generateDesignFromRequirements', async () => {
    // This command guides users to use Cursor agent with SpecDev rules for design generation
    // Extension provides templates and context, Cursor agent does the actual generation
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
      return;
    }

    const specdevPath = path.join(workspaceFolder.uri.fsPath, '.specdev');
    if (!fs.existsSync(specdevPath)) {
      vscode.window.showErrorMessage('SpecDev not initialized. Run "SpecDev: Init SpecDev Project" first.');
      return;
    }

    const templatePath = path.join(specdevPath, 'design-template.md');
    const templateContent = `# Design Generation Template

## Instructions for Cursor Agent
Use the SpecDev design rules to generate high-quality system design based on the requirements.

## Requirements Reference
[Copy the requirements here or reference the requirements file]

## Generated Design
[Cursor agent will fill this section using SpecDev design rules and best practices]

### Architecture Decisions
[Agent will research and document architecture choices]

### Technology Stack
[Agent will research latest versions and best practices]

### Security Considerations
[Agent will apply OWASP and security best practices]

### Performance Considerations
[Agent will include performance optimization strategies]

---
*This template guides the Cursor agent to generate design using SpecDev research-first approach and industry best practices.*
`;

    fs.writeFileSync(templatePath, templateContent);
    const doc = await vscode.workspace.openTextDocument(templatePath);
    await vscode.window.showTextDocument(doc);
    
    vscode.window.showInformationMessage(
      'Design template created! Reference your requirements and ask the Cursor agent to generate design using SpecDev rules.'
    );
  });

  // /specdev generate tasks from design
  const genTasksCmd = vscode.commands.registerCommand('specdev.generateTasksFromDesign', async () => {
    // This command guides users to use Cursor agent with SpecDev rules for task generation
    // Extension provides templates and context, Cursor agent does the actual generation
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
      return;
    }

    const specdevPath = path.join(workspaceFolder.uri.fsPath, '.specdev');
    if (!fs.existsSync(specdevPath)) {
      vscode.window.showErrorMessage('SpecDev not initialized. Run "SpecDev: Init SpecDev Project" first.');
      return;
    }

    const templatePath = path.join(specdevPath, 'tasks-template.md');
    const templateContent = `# Tasks Generation Template

## Instructions for Cursor Agent
Use the SpecDev task rules to generate high-quality implementation tasks based on the design.

## Design Reference
[Copy the design here or reference the design file]

## Generated Tasks
[Cursor agent will fill this section using SpecDev task rules and best practices]

### Task Structure
Each task should include:
- Research-backed implementation approach
- Step-by-step instructions with latest best practices
- Quality gates and validation criteria
- Error handling and rollback plans
- Testing strategies

### Implementation Guidelines
- Always research latest versions and best practices
- Include proper error handling and root cause analysis
- Add comprehensive comments for code clarity
- Implement minimal, targeted changes
- Document all decisions and research sources

---
*This template guides the Cursor agent to generate tasks using SpecDev research-first, think-first approach.*
`;

    fs.writeFileSync(templatePath, templateContent);
    const doc = await vscode.workspace.openTextDocument(templatePath);
    await vscode.window.showTextDocument(doc);
    
    vscode.window.showInformationMessage(
      'Tasks template created! Reference your design and ask the Cursor agent to generate implementation tasks using SpecDev rules.'
    );
  });

  // Context summarization command
  const summarizeCmd = vscode.commands.registerCommand('specdev.summarize', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
      return;
    }

    // Get current feature from user input or use default
    const featureName = await vscode.window.showInputBox({
      prompt: 'Enter feature name for context summary (optional)',
      placeHolder: 'Leave empty for general project summary'
    });

    const providerForSummary = new SpecDevProvider(context.extensionUri, context);
    const summaryPath = await (providerForSummary as any).createContextSummary(featureName || 'general');
    
    if (summaryPath) {
      // Open the created summary file
      const document = await vscode.workspace.openTextDocument(summaryPath);
      await vscode.window.showTextDocument(document);
      
      vscode.window.showInformationMessage(
        'Summary template created! Use your AI agent to populate it with conversation context. ' +
        'The context-summarization rules will guide the agent to fill in the details.'
      );
    }
  });

  // Update command
  const updateCmd = vscode.commands.registerCommand('specdev.update', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
      return;
    }

    const specdevPath = path.join(workspaceFolder.uri.fsPath, '.specdev');
    const versionInfoPath = path.join(specdevPath, 'version-info.json');
    
    // Check if SpecDev is initialized
    if (!fs.existsSync(specdevPath)) {
      const choice = await vscode.window.showInformationMessage(
        'SpecDev is not initialized in this project. Would you like to initialize it?',
        'Initialize SpecDev',
        'Cancel'
      );
      if (choice === 'Initialize SpecDev') {
        vscode.commands.executeCommand('specdev.init');
      }
      return;
    }

    // Read current version info
    let currentVersion = '0.1.0';
    let needsMigration = false;
    
    if (fs.existsSync(versionInfoPath)) {
      try {
        const versionInfo = JSON.parse(fs.readFileSync(versionInfoPath, 'utf8'));
        currentVersion = versionInfo.specdevVersion || '0.1.0';
      } catch (error) {
        console.error('Error reading version info:', error);
      }
    } else {
      needsMigration = true; // No version file means very old installation
    }

    const latestVersion = '0.3.0';
    
    if (currentVersion === latestVersion && !needsMigration) {
      vscode.window.showInformationMessage('SpecDev is already up to date!');
      return;
    }

    // Show update information
    const updateInfo = `SpecDev Update Available: ${currentVersion} → ${latestVersion}

NEW FEATURES:
✨ Context Summarization - Reduce token costs
✨ Real-time Spec Updates - Live file synchronization
✨ Enhanced Error Tracking - Better solution reuse
✨ Version Migration System - Safe updates

IMPROVEMENTS:
🔧 Updated rule format (.mdc)
🔧 Better project analysis
🔧 Performance optimizations

BACKUP: Automatic backup will be created
TIME: Estimated 30 seconds`;

    const choice = await vscode.window.showInformationMessage(
      updateInfo,
      { modal: true },
      'Update Now',
      'Cancel'
    );

    if (choice !== 'Update Now') {
      return;
    }

    // Create backup before updating
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(specdevPath, 'backup', `backup-${timestamp}`);
    
    try {
      // Create backup
      vscode.window.showInformationMessage('Creating backup...');
      if (!fs.existsSync(path.dirname(backupDir))) {
        fs.mkdirSync(path.dirname(backupDir), { recursive: true });
      }
      
      // Copy current state to backup
      const copyRecursive = (src: string, dest: string) => {
        if (fs.statSync(src).isDirectory()) {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          fs.readdirSync(src).forEach(item => {
            if (item !== 'backup') { // Don't backup the backup folder
              copyRecursive(path.join(src, item), path.join(dest, item));
            }
          });
        } else {
          fs.copyFileSync(src, dest);
        }
      };
      
      copyRecursive(specdevPath, backupDir);
      
      // Perform update by force-updating all rules (ensures new rules are copied)
      vscode.window.showInformationMessage('Updating SpecDev rules...');
      const updateResults = await forceUpdateRules();
      
      vscode.window.showInformationMessage(
        `✅ SpecDev updated successfully from ${currentVersion} to ${latestVersion}!\n\n` +
        `📋 Rules Updated: ${updateResults?.copiedCount || 0} rules copied/updated\n` +
        `💾 Backup created at: .specdev/backup/backup-${timestamp}/\n\n` +
        'New features are now available:\n' +
        '• Think-First Development Rules\n' +
        '• Research-First Implementation\n' +
        '• Parallel Processing Optimization\n' +
        '• Enhanced Quality Standards'
      );
      
    } catch (error) {
      vscode.window.showErrorMessage(
        `Update failed: ${error}\n\n` +
        `Your original installation is safe. Backup available at: .specdev/backup/backup-${timestamp}/`
      );
    }
  });

  // Register webview serializer so panel can be restored after reload
  const serializer = vscode.window.registerWebviewPanelSerializer('specdev', {
    async deserializeWebviewPanel(panel: vscode.WebviewPanel, _state: any) {
      const providerInstance = new SpecDevProvider(context.extensionUri, context);
      providerInstance.setupWebview(panel);
      // The webview will self-hydrate from saved state and workspace state
    }
  });

  context.subscriptions.push(
    provider,
    steeringCmd,
    initCmd,
    summarizeCmd,
    updateCmd,
    genReqCmd,
    genDesignCmd,
    genTasksCmd,
    serializer
  );
}

export function deactivate() {}

// Determine rules path to support multiple IDEs (Cursor, Windsurf, custom)
function getAgentRulesPath(projectPath: string): string {
  try {
    const cfg = vscode.workspace.getConfiguration('specdev');
    const location = (cfg.get<string>('rules.location') || 'auto').toLowerCase();
    const custom = cfg.get<string>('rules.customPath') || '';
    let target: string;

    if (location === 'custom' && custom) {
      target = path.isAbsolute(custom) ? custom : path.join(projectPath, custom);
    } else if (location === 'windsurf') {
      target = path.join(projectPath, '.windsurf', 'rules');
    } else if (location === 'cursor') {
      target = path.join(projectPath, '.cursor', 'rules');
    } else {
      // auto: prefer existing dirs, fallback to Cursor convention
      const windsurf = path.join(projectPath, '.windsurf', 'rules');
      const cursor = path.join(projectPath, '.cursor', 'rules');
      if (fs.existsSync(windsurf)) target = windsurf; else target = cursor;
    }

    if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
    return target;
  } catch {
    const fallback = path.join(projectPath, '.cursor', 'rules');
    if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}
