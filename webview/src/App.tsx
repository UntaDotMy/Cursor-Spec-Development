import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import MarkdownEditor from './components/MarkdownEditor';
import TaskList from './components/TaskList';

type TabType = 'requirements' | 'design' | 'tasks';

interface FileContent {
  requirements: string;
  design: string;
  tasks: string;
}

type AgentStatus = 'queued' | 'running' | 'completed' | 'failed' | 'paused';
type RoleType = 'PM' | 'TechLead' | 'Dev' | 'QA' | 'Docs' | 'Research' | 'DevOps' | 'Security' | 'Performance' | 'UX' | 'Data';

interface AgentStep {
  id: string;
  role: RoleType;
  summary: string;
  details?: string;
  startedAt: string;
  finishedAt?: string;
  status: AgentStatus;
}
interface AgentRun {
  id: string;
  feature: string;
  goal: string;
  status: AgentStatus;
  startedAt: string;
  finishedAt?: string;
  steps: AgentStep[];
}

interface AgentError {
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('requirements');
  const [fileContent, setFileContent] = useState<FileContent>({
    requirements: '',
    design: '',
    tasks: ''
  });
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
  const [currentFeature, setCurrentFeature] = useState<string>('');
  const [showCreateFeature, setShowCreateFeature] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState('');
  
  // Review status for each doc
  const [reviewStatus, setReviewStatus] = useState<{
    requirements: 'pending' | 'approved' | 'rejected';
    design: 'pending' | 'approved' | 'rejected';
    tasks: 'pending' | 'approved' | 'rejected';
  }>({
    requirements: 'pending',
    design: 'pending',
    tasks: 'pending',
  });
  const [showAgentInfo, setShowAgentInfo] = useState(true);
  // Agent orchestration
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentGoal, setAgentGoal] = useState('');
  const [showRuns, setShowRuns] = useState(false);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [showPersonas, setShowPersonas] = useState(false);
  const [personas, setPersonas] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [errors, setErrors] = useState<AgentError[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showRoleEditor, setShowRoleEditor] = useState(false);
  const [roleSelections, setRoleSelections] = useState<Record<RoleType, boolean>>({
    PM: true, TechLead: true, Dev: true, QA: true, Docs: true,
    Research: true, DevOps: false, Security: false, Performance: false, UX: false, Data: false,
  });
  const allRoles: RoleType[] = ['Research','PM','TechLead','Dev','QA','Docs','DevOps','Security','Performance','UX','Data'];

  // Knowledge panel
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [knowledgeQuery, setKnowledgeQuery] = useState('');
  const [knowledgeList, setKnowledgeList] = useState<Array<{id: string; title: string; file: string; createdAt: string}>>([]);
  const [knowledgeItem, setKnowledgeItem] = useState<{title: string; content: string; file: string} | null>(null);
  // Start options
  const [autoResearchPrestep, setAutoResearchPrestep] = useState(true);
  const [enableAutomationHooks, setEnableAutomationHooks] = useState(true);
  // Docs cache UI
  const [showCache, setShowCache] = useState(false);
  const [cacheUrl, setCacheUrl] = useState('');
  const [cacheList, setCacheList] = useState<Array<{url: string; cachedPath?: string; lastFetched?: string; size?: number}>>([]);

  useEffect(() => {
    // Hydrate from webview state first for instant restore
    try {
      const state = (window as any)?.vscode?.getState?.();
      if (state) {
        if (state.activeTab) setActiveTab(state.activeTab);
        if (state.currentFeature) setCurrentFeature(state.currentFeature);
        if (state.reviewStatus) setReviewStatus(state.reviewStatus);
        if (typeof state.showAgentInfo === 'boolean') setShowAgentInfo(state.showAgentInfo);
      }
    } catch {}
    loadFeatures();
    // Ask extension for any workspace-level persisted state
    window.vscode?.postMessage({ command: 'loadPersistedState' });
    // Ask extension for cached docs list
    window.vscode?.postMessage({ command: 'docCacheList' });
  }, []);

  useEffect(() => {
    // Listen for messages from the extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'featuresLoaded':
          setAvailableFeatures(message.features || []);
          // DON'T change current feature - stay where user is
          break;
        case 'filesLoaded':
          setFileContent(message.content);
          if (message.currentFeature && message.currentFeature !== currentFeature) {
            // Only update if explicitly loading a different feature
            setCurrentFeature(message.currentFeature);
          }
          break;
        case 'contentUpdated':
          // Real-time content update - preserve current feature selection
          if (message.type && currentFeature) {
            setFileContent(prev => ({
              ...prev,
              [message.type]: message.content
            }));
          }
          break;
        case 'featureCreated':
          // New feature created - automatically switch to it and load its content
          if (message.featureName) {
            setCurrentFeature(message.featureName);
            loadSpecDevFiles(message.featureName);
          }
          break;
        case 'hydratedState': {
          const st = message.state || {};
          if (st.activeTab) setActiveTab(st.activeTab);
          if (st.currentFeature) {
            setCurrentFeature(st.currentFeature);
            loadSpecDevFiles(st.currentFeature);
          }
          if (st.reviewStatus) setReviewStatus(st.reviewStatus);
          if (typeof st.showAgentInfo === 'boolean') setShowAgentInfo(st.showAgentInfo);
          break;
        }
        case 'docCacheList': {
          const list = (message.list || []).map((i: any) => ({
            url: i.url,
            cachedPath: i.cachedPath || i.cached_path || i.cachedPath,
            lastFetched: i.lastFetched,
            size: i.size,
          }));
          setCacheList(list);
          break;
        }
        case 'docCacheFetched': {
          // Refresh list after fetch
          window.vscode?.postMessage({ command: 'docCacheList' });
          break;
        }
        case 'docCacheInvalidated': {
          window.vscode?.postMessage({ command: 'docCacheList' });
          break;
        }
        case 'agentUpdate': {
          setAgentRunning(true);
          break;
        }
        case 'agentRuns': {
          setRuns(message.runs || []);
          break;
        }
        case 'agentRunUpdated': {
          const updated: AgentRun = message.run;
          setRuns(prev => prev.map(r => (r.id === updated.id ? updated : r)));
          break;
        }
        case 'agentErrors': {
          setErrors(message.errors || []);
          break;
        }
        case 'agentPersonas': {
          setPersonas(message.personas || {});
          break;
        }
        case 'knowledgeList': {
          setKnowledgeList(message.list || []);
          setKnowledgeItem(null);
          break;
        }
        case 'knowledgeSearchResults': {
          setKnowledgeList(message.list || []);
          break;
        }
        case 'knowledgeItem': {
          setKnowledgeItem(message.item || null);
          break;
        }
        case 'researchSaved': {
          // Refresh list to include the new item
          window.vscode?.postMessage({ command: 'agentListKnowledge' });
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentFeature]); // Add currentFeature as dependency to access it in the handler

  const loadFeatures = async () => {
    try {
      window.vscode?.postMessage({ command: 'loadFeatures' });
    } catch (error) {
      console.error('Failed to load features:', error);
    }
  };

  const loadSpecDevFiles = async (feature: string) => {
    try {
      window.vscode?.postMessage({ 
        command: 'loadFiles',
        feature
      });
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const saveFile = async (type: TabType, content: string) => {
    if (!currentFeature) {
      alert('Please select a feature first');
      return;
    }

    setFileContent(prev => ({ ...prev, [type]: content }));
    
    // Save to .specdev/specs/{feature} folder
    try {
      await window.vscode?.postMessage({
        command: 'saveFile',
        type,
        content,
        feature: currentFeature
      });
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleFeatureChange = (feature: string) => {
    if (feature) {
      setCurrentFeature(feature);
      loadSpecDevFiles(feature);
    } else {
      setCurrentFeature('');
      setFileContent({ requirements: '', design: '', tasks: '' });
    }
  };

  const handleCreateFeature = async () => {
    if (newFeatureName.trim()) {
      try {
        const featureName = newFeatureName.trim();
        await window.vscode?.postMessage({
          command: 'createFeature',
          featureName: featureName
        });
        
        // Immediately update UI state to show the new feature
        setCurrentFeature(featureName);
        setNewFeatureName('');
        setShowCreateFeature(false);
        
        // The extension will send updates, but we're already prepared
      } catch (error) {
        console.error('Failed to create feature:', error);
      }
    }
  };

  const getInitialContent = (type: TabType): string => {
    switch (type) {
      case 'requirements':
        return `# Requirements Document

## Introduction
[Introduction text here]

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

      case 'design':
        return `# Design Document

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

      case 'tasks':
        return `# Task List

## Sprint 1

- [ ] Task 1: Implement user authentication
  - [ ] Create login form
  - [ ] Add validation
  - [ ] Integrate with backend API

- [ ] Task 2: Design database schema
  - [x] Define user table
  - [ ] Define product table
  - [ ] Create relationships

- [ ] Task 3: Setup project infrastructure
  - [x] Initialize repository
  - [x] Setup CI/CD pipeline
  - [ ] Configure deployment
`;
      default:
        return '';
    }
  };

  // Review checkpoint handlers
  const handleReview = (type: TabType, status: 'approved' | 'rejected') => {
    setReviewStatus(prev => ({ ...prev, [type]: status }));
  };
  const handleRegenerate = (type: TabType) => {
    // Send message to backend to regenerate (to be implemented)
    window.vscode?.postMessage({ command: 'regenerate', type });
    setReviewStatus(prev => ({ ...prev, [type]: 'pending' }));
  };

  // Visual indicator for incomplete/pending review
  const renderStatusBanner = () => {
    const status = reviewStatus[activeTab];
    if (status === 'pending') {
      return <div className="status-banner">Pending review: Please review and approve this document.</div>;
    }
    if (status === 'rejected') {
      return <div className="status-banner rejected">Document rejected. Please edit and regenerate.</div>;
    }
    return null;
  };

  const currentContent = fileContent[activeTab] || getInitialContent(activeTab);

  return (
    <div className="specdev-app">
      {showAgentInfo && (
        <div className="agent-info-banner">
          <span>
            <b>Note:</b> Document generation (requirements, design, tasks) is performed by the <b>Cursor agent/chat</b>, not directly by this extension. Use the agent to generate and review documents. <a href="https://github.com/yourusername/specdev-cursor-plugin#kiro-workflow--agent-integration" target="_blank" rel="noopener noreferrer">Learn more</a>.
          </span>
          <button className="close-banner" onClick={() => setShowAgentInfo(false)}>×</button>
        </div>
      )}
      <header className="app-header">
        <h1>SpecDev - Specification Development</h1>
      </header>
      
      <div className="feature-selector">
        <label htmlFor="feature-select">Feature:</label>
        <select 
          id="feature-select" 
          value={currentFeature}
          onChange={(e) => handleFeatureChange(e.target.value)}
        >
          <option value="">Select a feature...</option>
          {availableFeatures.map(feature => (
            <option key={feature} value={feature}>
              {feature}
            </option>
          ))}
        </select>
        <button onClick={() => setShowCreateFeature(true)}>Create New Feature</button>
        <button onClick={() => setShowCache(s => !s)}>{showCache ? 'Hide Docs Cache' : 'Docs Cache'}</button>
        <input
          style={{ flex: 1, minWidth: 200 }}
          placeholder="Agent goal (optional)"
          value={agentGoal}
          onChange={(e) => setAgentGoal(e.target.value)}
        />
        <button
          onClick={() => {
            if (!currentFeature) { alert('Select a feature first'); return; }
            window.vscode?.postMessage({ command: 'agentStart', feature: currentFeature, goal: agentGoal, options: { autoResearchPrestep, enableAutomationHooks } });
            setAgentRunning(true);
          }}
        >{agentRunning ? 'Agent Running...' : 'Start Agent'}</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <input type="checkbox" checked={autoResearchPrestep} onChange={(e) => setAutoResearchPrestep(e.target.checked)} /> Auto Research
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <input type="checkbox" checked={enableAutomationHooks} onChange={(e) => setEnableAutomationHooks(e.target.checked)} /> Automation Hooks
        </label>
        <button
          onClick={() => {
            setShowRuns(s => !s);
            window.vscode?.postMessage({ command: 'agentListRuns' });
          }}
        >{showRuns ? 'Hide Runs' : 'Runs'}</button>
        <button
          onClick={() => {
            setShowErrors(s => !s);
            window.vscode?.postMessage({ command: 'agentListErrors' });
          }}
        >{showErrors ? 'Hide Errors' : 'Errors'}</button>
        <button
          onClick={() => {
            setShowKnowledge(s => !s);
            window.vscode?.postMessage({ command: 'agentListKnowledge' });
          }}
        >{showKnowledge ? 'Hide Knowledge' : 'Knowledge'}</button>
      </div>

      {showRuns && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--vscode-panel-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <b>Agent Runs</b>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => window.vscode?.postMessage({ command: 'agentListRuns' })}>Refresh</button>
              {selectedRunId && (
                <button onClick={() => {
                  window.vscode?.postMessage({ command: 'agentGetPersonas', runId: selectedRunId });
                  setShowPersonas(true);
                }}>Get Personas</button>
              )}
            </div>
          </div>
          {runs.length === 0 ? (
            <div style={{ color: 'var(--vscode-descriptionForeground)', marginTop: 8 }}>No runs yet.</div>
          ) : (
            <ul>
              {runs.map(run => (
                <li key={run.id} style={{ margin: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span><b>{run.feature}</b> — {run.goal}</span>
                    <button onClick={() => setSelectedRunId(prev => prev === run.id ? null : run.id)}>
                      {selectedRunId === run.id ? 'Hide Details' : 'Details'}
                    </button>
                    {selectedRunId === run.id && (
                      <>
                        <button onClick={() => {
                          window.vscode?.postMessage({ command: 'agentGetPersonas', runId: run.id });
                          setShowPersonas(true);
                        }}>Get Personas</button>
                        <button onClick={() => {
                          // Initialize selections from current run
                          const sel: Record<RoleType, boolean> = { PM:false, TechLead:false, Dev:false, QA:false, Docs:false, Research:false, DevOps:false, Security:false, Performance:false, UX:false, Data:false } as any;
                          for (const s of run.steps) sel[s.role as RoleType] = true;
                          setRoleSelections(sel);
                          setShowRoleEditor(s => !s);
                        }}>{showRoleEditor ? 'Close Roles' : 'Edit Roles'}</button>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--vscode-descriptionForeground)' }}>
                    {run.status} • started {new Date(run.startedAt).toLocaleString()}
                  </div>
                  {selectedRunId === run.id && showRoleEditor && (
                    <div style={{ marginTop: 6, padding: 8, border: '1px solid var(--vscode-panel-border)' }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Roles</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {allRoles.map(r => (
                          <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input type="checkbox" checked={!!roleSelections[r]} onChange={(e) => setRoleSelections(prev => ({ ...prev, [r]: e.target.checked }))} /> {r}
                          </label>
                        ))}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => {
                          const roles = allRoles.filter(r => roleSelections[r]);
                          window.vscode?.postMessage({ command: 'agentUpdateRoles', runId: run.id, roles, merge: true });
                        }}>Apply (Merge)</button>
                        <button style={{ marginLeft: 8 }} onClick={() => {
                          const roles = allRoles.filter(r => roleSelections[r]);
                          window.vscode?.postMessage({ command: 'agentUpdateRoles', runId: run.id, roles, merge: false });
                        }}>Apply (Replace)</button>
                      </div>
                    </div>
                  )}
                  {selectedRunId === run.id && (
                    <ul style={{ marginTop: 6 }}>
                      {run.steps?.map(step => (
                        <li key={step.id} style={{ fontSize: 12, marginBottom: 8 }}>
                          <div>
                            <b>{step.role}</b>: {step.summary} — <i>{step.status}</i>
                          </div>
                          {step.details && (
                            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--vscode-descriptionForeground)' }}>{step.details}</div>
                          )}
                          {showPersonas && personas[step.role] && (
                            <div style={{ marginTop: 6, padding: 6, borderLeft: '3px solid var(--vscode-panel-border)' }}>
                              <div style={{ fontWeight: 600 }}>Persona — {step.role}</div>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{personas[step.role]}</div>
                            </div>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                            <button onClick={() => window.vscode?.postMessage({ command: 'agentStepAction', runId: run.id, stepId: step.id, action: 'start' })}>Start</button>
                            <button onClick={() => window.vscode?.postMessage({ command: 'agentStepAction', runId: run.id, stepId: step.id, action: 'pause' })}>Pause</button>
                            <button onClick={() => window.vscode?.postMessage({ command: 'agentStepAction', runId: run.id, stepId: step.id, action: 'complete' })}>Complete</button>
                            <button onClick={() => window.vscode?.postMessage({ command: 'agentStepAction', runId: run.id, stepId: step.id, action: 'fail', error: { message: 'Manual failure' } })}>Fail</button>
                            <button onClick={() => window.vscode?.postMessage({ command: 'agentStepAction', runId: run.id, stepId: step.id, action: 'retry' })}>Retry</button>
                            {step.role === 'Research' && step.details && (
                              <button onClick={() => {
                                const defaultTitle = `Research Findings - ${run.feature}`;
                                window.vscode?.postMessage({ command: 'agentSaveResearch', title: defaultTitle, content: step.details, runId: run.id, stepId: step.id, tags: ['research', run.feature] });
                              }}>Save to Knowledge</button>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <input
                              style={{ flex: 1, minWidth: 200 }}
                              placeholder="Add note..."
                              value={notes[step.id] || ''}
                              onChange={(e) => setNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                            />
                            <button onClick={() => {
                              const note = notes[step.id];
                              if (note && note.trim()) {
                                window.vscode?.postMessage({ command: 'agentAddNote', runId: run.id, stepId: step.id, note });
                                setNotes(prev => ({ ...prev, [step.id]: '' }));
                              }
                            }}>Add Note</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showErrors && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--vscode-panel-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b>Agent Errors</b>
            <button onClick={() => window.vscode?.postMessage({ command: 'agentListErrors' })}>Refresh</button>
          </div>
          {errors.length === 0 ? (
            <div style={{ color: 'var(--vscode-descriptionForeground)', marginTop: 8 }}>No errors recorded.</div>
          ) : (
            <ul>
              {errors.map(err => (
                <li key={err.id} style={{ margin: '6px 0' }}>
                  <div><b>{err.severity?.toUpperCase() || 'INFO'}</b> — {err.message}</div>
                  <div style={{ fontSize: 12, color: 'var(--vscode-descriptionForeground)' }}>
                    {new Date(err.timestamp).toLocaleString()} • run {err.runId}{err.stepId ? ` • step ${err.stepId}` : ''}{err.role ? ` • ${err.role}` : ''}
                  </div>
                  {err.details && <div style={{ whiteSpace: 'pre-wrap' }}>{err.details}</div>}
                  {err.suggestion && <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}><i>Suggestion:</i> {err.suggestion}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showKnowledge && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--vscode-panel-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b>Knowledge</b>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Search knowledge..." value={knowledgeQuery} onChange={(e) => setKnowledgeQuery(e.target.value)} />
              <button onClick={() => window.vscode?.postMessage({ command: 'agentSearchKnowledge', query: knowledgeQuery })}>Search</button>
              <button onClick={() => window.vscode?.postMessage({ command: 'agentListKnowledge' })}>List All</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              {knowledgeList.length === 0 ? (
                <div style={{ color: 'var(--vscode-descriptionForeground)' }}>No knowledge items yet.</div>
              ) : (
                <ul>
                  {knowledgeList.map(item => (
                    <li key={item.id} style={{ margin: '6px 0' }}>
                      <button onClick={() => window.vscode?.postMessage({ command: 'agentGetKnowledge', idOrPath: item.id })}>
                        {item.title}
                      </button>
                      <div style={{ fontSize: 12, color: 'var(--vscode-descriptionForeground)' }}>Created {new Date(item.createdAt).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid var(--vscode-panel-border)', paddingLeft: 12 }}>
              {knowledgeItem ? (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{knowledgeItem.title}</div>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{knowledgeItem.content}</pre>
                </div>
              ) : (
                <div style={{ color: 'var(--vscode-descriptionForeground)' }}>Select a knowledge item to view</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCache && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--vscode-panel-border)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ flex: 1 }}
              placeholder="https://docs.example.com/page"
              value={cacheUrl}
              onChange={(e) => setCacheUrl(e.target.value)}
            />
            <button onClick={() => window.vscode?.postMessage({ command: 'docCacheFetch', url: cacheUrl })}>Fetch</button>
            <button onClick={() => window.vscode?.postMessage({ command: 'docCacheFetch', url: cacheUrl, force: true })}>Force Refresh</button>
          </div>
          <div style={{ marginTop: 10 }}>
            <b>Cached Docs:</b>
            <ul>
              {cacheList.map(item => (
                <li key={item.url}>
                  <span title={item.cachedPath}>{item.url}</span>
                  {item.lastFetched && <span> — last fetched: {new Date(item.lastFetched).toLocaleString()}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {showCreateFeature && (
        <div className="create-feature-modal">
          <div className="modal-content">
            <h3>Create New Feature</h3>
            <input
              type="text"
              placeholder="Enter feature name..."
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFeature()}
            />
            <div className="modal-actions">
              <button onClick={handleCreateFeature}>Create</button>
              <button onClick={() => setShowCreateFeature(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {availableFeatures.length === 0 && !showCreateFeature ? (
        <div className="no-features">
          <h3>No features found</h3>
          <p>Create your first feature to get started with SpecDev.</p>
          <button onClick={() => setShowCreateFeature(true)}>Create First Feature</button>
        </div>
      ) : (
        <div className="feature-info">
          {currentFeature && (
            <div className="current-feature-info">
              <h3>Current Feature: {currentFeature}</h3>
              <div className="feature-status">
                <span className="status-indicator active">⚡ Active</span>
                <span className="last-updated">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {currentFeature ? (
        <>
          <nav className="tab-navigation">
            {(['requirements', 'design', 'tasks'] as TabType[]).map((tab) => (
              <button
                key={tab}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          <main className="main-content">
            {renderStatusBanner()}
            {activeTab === 'tasks' ? (
              <TaskList
                content={currentContent}
                onChange={(content) => saveFile('tasks', content)}
                // Add more props for review and workflow as needed
              />
            ) : (
              <MarkdownEditor
                content={currentContent}
                onChange={(content) => saveFile(activeTab, content)}
                enableMermaid={activeTab === 'design'}
                reviewStatus={reviewStatus[activeTab]}
                onReview={(status) => handleReview(activeTab, status)}
                onRegenerate={() => handleRegenerate(activeTab)}
              />
            )}
          </main>
        </>
      ) : availableFeatures.length > 0 ? (
        <div className="select-feature">
          <h3>Select a Feature</h3>
          <p>Choose a feature from the dropdown above to view and edit its specifications.</p>
          <div className="available-features">
            <h4>Available Features:</h4>
            <ul>
              {availableFeatures.map(feature => (
                <li key={feature}>
                  <button 
                    className="feature-button"
                    onClick={() => handleFeatureChange(feature)}
                  >
                    📋 {feature}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
};

declare global {
  interface Window {
    vscode?: {
      postMessage: (message: any) => void;
      setState?: (state: any) => void;
      getState?: () => any;
    };
  }
}

export default App;
