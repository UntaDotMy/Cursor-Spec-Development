# SpecDev - Advanced Specification Development Tool

> **Enhanced by [UntaDotMy](https://github.com/UntaDotMy)** - Building on the solid foundation of the original SpecDev with research-first, think-first development principles.

## ⚡ Quickstart (TL;DR)

SpecDev now orchestrates a dynamic expert team per project with a mandatory Research agent and a built‑in knowledge base. It auto-detects the stack and spawns the right roles (e.g., PM, TechLead, Dev, QA, Docs, plus DevOps/Security/Performance/UX/Data as needed). Research is always included and feeds Docs and Dev.

- **Start**: Command Palette → “SpecDev: Open SpecDev” → choose a feature → set goal (optional) → Start Agent.
- **Roles**: Auto-generated from your goal. Edit per-run roles in the UI (Runs → Details → Edit Roles). Research is always on.
- **Automation Hooks**:
  - Dev step fails → Research is queued with the error context.
  - Research completes → Findings saved to `.specdev/knowledge/*.md` and linked to Docs.
  - Docs starts → Prefills internal knowledge references for quick documentation.
- **Personas**: Click “Get Personas” inside a run to view role-specific senior personas adapted to your stack.
- **Errors**: View `.specdev/error-database.json` via the “Errors” panel.
- **Knowledge**: “Knowledge” panel lets you list/search prior research and open items.

Files and paths:

- `.specdev/specs/{feature}/requirements.md|design.md|tasks.md` — specs per feature
- `.specdev/error-database.json` — recorded errors & suggestions
- `.specdev/knowledge/*.md` — saved Research findings (with metadata)

Minimal commands:

- Initialize: “SpecDev: Init SpecDev Project”
- Analyze an existing repo: “SpecDev: Analyze Existing Project (Steering)”
- Open UI: “SpecDev: Open SpecDev”

Note: If you edit the webview (React) code under `webview/src/`, build it once: `cd webview && npm install && npm run build`.

---

## 🚀 Overview

SpecDev is a comprehensive VS Code/Cursor extension that implements an advanced Kiro-style workflow for specification-driven development. Originally designed as a structured approach to managing requirements, design, and tasks, it has been enhanced with modern QA/QC processes, research-first development principles, adaptive project analysis, error tracking, and comprehensive quality assurance.

## ✨ Enhanced Features (v0.3.0)

### 🧠 **Think-First Development**
- **Never Assume**: Always research latest information before implementation
- **Root Cause Analysis**: Fix underlying issues, not symptoms
- **Minimal Changes**: Read current implementation, make targeted updates
- **Research-Backed Decisions**: Every technology choice backed by current research
- **Version Accuracy**: Always use latest researched versions with compatibility checks

### 🔍 **Research-First Implementation (2025-2026)**
- **Web Search Integration**: Prioritizes GitHub, Reddit, GitLab, and Stack Overflow for latest information
- **Parallel Processing**: Maximizes Cursor's parallel tool capabilities for faster research
- **Best Practices Focus**: Always searches for current best practices with real examples
- **Quality Sources**: Official documentation, active repositories, and community discussions
- **Version Verification**: Checks existing versions before installing/updating packages

### 🎯 **Comprehensive Project Intelligence**
- **Universal Platform Support**: Web, mobile (iOS/Android), desktop (Windows/Mac/Linux), API/backend, games
- **Smart Project Detection**: Analyzes codebase and requirements to understand context
- **Technology Stack Recognition**: Identifies and researches optimal technology choices
- **Business Domain Adaptation**: E-commerce, healthcare, finance, education, gaming domains
- **Existing Project Analysis**: `/steering` command analyzes ongoing projects without overwriting

### ✅ **Quality Assurance & Quality Control**
- **Requirements QA**: EARS format validation, completeness checks, ambiguity detection
- **Design QC**: Architecture consistency, technology alignment, security considerations
- **Task Validation**: Interactive user confirmation with detailed validation criteria
- **Code Quality**: Enforces comprehensive comments and documentation for newbie-friendly code
- **Quality Gates**: Each phase requires validation before proceeding

### 🚨 **Smart Error Tracking & Resolution**
- **Error Database**: Local JSON database tracks errors and solutions (`error-database.json`)
- **Solution Reuse**: Automatically suggests solutions from previous encounters
- **Root Cause Focus**: No workarounds - always identify and fix underlying causes
- **Prevention Guidelines**: Generates tips to prevent similar errors
- **Research-Backed Solutions**: Solutions include links to authoritative sources

### 🔄 **Version Migration & Updates**
- **Safe Updates**: Automatic backups before any update
- **Force Rule Updates**: Ensures new rules are copied even when old rules exist
- **Migration History**: Tracks all updates with detailed change logs
- **Rollback Capability**: Can restore from any backup if needed
- **Version Tracking**: Complete version management with feature tracking

### 💡 **Automatic Context Optimization**
- **Auto-Summarization**: Agent automatically summarizes long conversations to save tokens and costs
- **No Manual Action**: Context management happens seamlessly in background
- **Performance Optimization**: Maintains full understanding while improving response speed
- **Real-time Updates**: Spec tab updates dynamically when files are modified
- **Cost Savings**: Significant reduction in token usage during long development sessions

## 📋 Core Features

### **Three-Tab Interface**
- **Requirements**: EARS-format requirements with QA validation
- **Design**: Architecture with Mermaid diagrams and research-backed decisions
- **Tasks**: Interactive task management with detailed validation

### **Advanced File Management**
- **Feature Organization**: `.specdev/specs/{feature-name}/` structure
- **Backup System**: `.specdev/backup/` with timestamped backups
- **Context Summaries**: `.specdev/summaries/` for performance optimization
- **Error Database**: `.specdev/error-database.json` for solution tracking
- **Version Tracking**: `.specdev/version-info.json` for migration management

### **Cursor Agent Integration**
- **Rule-Based AI**: All AI generation handled by Cursor agent using `.mdc` rules
- **Template System**: Extension provides templates, agent fills with research-backed content
- **No Direct API Calls**: Fully compliant with Cursor's architecture constraints
- **Comprehensive Rules**: 17 specialized `.mdc` rule files guide agent behavior

## 🚀 Getting Started

### Step 1: Installation

#### From VSIX Package (Recommended)
1. Download `specdev-0.3.0.vsix` from releases
2. In VS Code: Extensions → "..." → "Install from VSIX..."
3. Select the downloaded `.vsix` file
4. Restart VS Code

### Step 2: Choose Your Path

#### 🆕 For New Projects
```
Command Palette (Ctrl+Shift+P) → "SpecDev: Init SpecDev Project"
```
**What this does:**
- Creates `.specdev/` directory structure
- Installs 17 specialized `.mdc` rule files in `.cursor/rules/`
- Sets up error database and version tracking
- Initializes context summarization system
- Prepares templates for requirements, design, and tasks
- Creates/updates `.gitignore` to exclude SpecDev files from production

**What you'll see:**
```
✅ SpecDev Enhanced System initialized!
📁 Created .specdev/ directory structure
📋 Installed 17 rule files in .cursor/rules/
🗄️ Initialized error database
📊 Set up version tracking
🎯 Ready for specification-driven development
```

#### 🔄 For Existing Projects
```
Command Palette (Ctrl+Shift+P) → "SpecDev: Analyze Existing Project (Steering)"
```
**What this does:**
- Analyzes your existing codebase and features
- Detects technology stack and project structure
- Identifies existing features and suggests next steps
- Creates project analysis report
- Sets up SpecDev WITHOUT overwriting existing work
- Creates/updates `.gitignore` to exclude SpecDev files from production

**What you'll see:**
```
🔍 Analyzing existing project...
📊 Detected: React + TypeScript + Node.js project
🎯 Found features: Authentication, User Management
📋 Generated analysis report in .specdev/project-analysis.json
💡 Suggested next features: Payment Integration, Admin Dashboard
```

### Step 3: Start Development

#### Option A: Create New Feature
1. **Open SpecDev Interface**:
   ```
   Command Palette → "SpecDev: Open SpecDev"
   ```

2. **Create Feature**:
   - Click "Create New Feature" 
   - Enter feature name (e.g., "user-authentication")
   - System creates feature directory with templates

3. **Start with Requirements**:
   - Use Cursor chat: *"Create requirements for user authentication with email/password login"*
   - Agent uses SpecDev rules to research latest practices
   - Generates EARS-format requirements with security considerations

#### Option B: Generate from Prompt
```
Command Palette → "SpecDev: Generate Requirements from Prompt"
```
- Creates template file with instructions for Cursor agent
- Add your project description
- Ask Cursor agent to generate requirements using SpecDev rules

### Step 4: Follow the Enhanced Workflow

#### Requirements Phase
```
Cursor Chat: "Create requirements for [your feature description]"
```
**Agent automatically:**
- 🔍 Researches latest best practices for your domain
- 📋 Generates EARS-format requirements
- 🔒 Includes security and compliance considerations
- ✅ Validates requirements quality before presenting
- 💾 Saves to `.specdev/specs/[feature]/requirements.md`

#### Design Phase
```
Cursor Chat: "Create design based on these requirements"
```
**Agent automatically:**
- 🏗️ Researches latest architecture patterns
- 🔧 Selects appropriate technologies with version research
- 📊 Creates Mermaid diagrams for visualization
- 🔐 Includes security and performance considerations
- ✅ Validates design against requirements

#### Tasks Phase
```
Cursor Chat: "Generate implementation tasks from this design"
```
**Agent automatically:**
- 📝 Creates detailed, research-backed tasks
- 🔍 Includes implementation best practices
- ✅ Adds validation criteria for each task
- 🚨 Includes error prevention measures
- 📚 Provides step-by-step instructions with examples

### Step 5: Implementation with Quality Assurance

#### Task Execution
- Open SpecDev interface and select your feature
- Work through tasks in the Tasks tab
- Check off completed tasks (triggers validation dialog)
- **Interactive Validation**: Confirm each task works correctly
- Agent tracks progress and learns from any errors

#### Automatic Context Management
- **No manual action needed** - Agent automatically summarizes when context gets long
- Saves tokens and reduces costs
- Maintains all critical project information
- Continues seamlessly with optimized context

### Step 6: Updates and Maintenance

#### Updating SpecDev
```
Command Palette → "SpecDev: Update SpecDev Installation"
```
**Automatic process:**
- Detects version differences
- Creates backup of current installation
- Force-updates all rules (ensures new features are included)
- Preserves all your project data and customizations
- Shows detailed update summary

#### Context Optimization
- **Automatic**: Agent summarizes long conversations to save costs
- **Manual**: Use `"SpecDev: Create Context Summary"` if needed
- Summaries stored in `.specdev/summaries/` for reference

## 🛠️ Installation & Setup

### Advanced Installation

#### From VSIX Package (Recommended)
1. Download `specdev-0.3.0.vsix` from releases
2. In VS Code: Extensions → "..." → "Install from VSIX..."
3. Select the downloaded `.vsix` file
4. Restart VS Code

### Development Setup
1. **Clone and Install**:
   ```bash
   git clone https://github.com/specdev/specdev-cursor-plugin.git
   cd specdev-cursor-plugin
   npm install
   ```

2. **Build Extension**:
   ```bash
   npm run compile
   cd webview && npm install && npm run build
   ```

3. **Package Extension**:
   ```bash
   npm install -g vsce
   vsce package
   ```

## 📖 Usage Guide

### 1. Initialize SpecDev
```
Command Palette → "SpecDev: Init SpecDev Project"
```
Creates the complete system with:
- 17 `.mdc` rule files in `.cursor/rules/`
- `.specdev/` directory structure
- Error database and version tracking
- Context summarization system

### 2. Analyze Existing Projects
```
Command Palette → "SpecDev: Analyze Existing Project (Steering)"
```
For ongoing projects:
- Analyzes existing codebase and features
- Suggests next development steps
- Preserves existing work
- Creates project analysis report

### 3. Enhanced Workflow with Cursor Agent

#### **Requirements Generation**
```
Command: "SpecDev: Generate Requirements from Prompt"
```
Creates template for Cursor agent to:
- Research domain-specific requirements
- Apply latest compliance standards
- Generate EARS-format specifications
- Include security and performance considerations

#### **Design Creation**
```
Command: "SpecDev: Generate Design from Requirements"  
```
Agent researches and creates:
- Latest architecture patterns for your stack
- Technology decisions with version research
- Mermaid diagrams with modern practices
- Security and performance design considerations

#### **Task Implementation**
```
Command: "SpecDev: Generate Tasks from Design"
```
Agent generates:
- Research-backed implementation approaches
- Step-by-step instructions with best practices
- Quality gates and validation criteria
- Error handling and rollback plans

### 4. Update Management
```
Command Palette → "SpecDev: Update SpecDev Installation"
```
- Detects version differences
- Creates automatic backup
- Force-updates all rules (ensures new rules are copied)
- Provides detailed update summary

### 5. Context Management
```
Command Palette → "SpecDev: Create Context Summary"
```
- Reduces token costs in long conversations
- Maintains agent understanding
- Improves performance
- Stores summaries in `.specdev/summaries/`

## 🎯 Enhanced Workflow Process

### Phase 1: Research & Analysis
1. **Project Analysis**: Understands codebase, tech stack, and domain
2. **Technology Research**: Searches for latest versions and best practices
3. **Requirements Research**: Finds domain-specific patterns and compliance needs
4. **Quality Validation**: Ensures requirements meet quality standards

### Phase 2: Design & Architecture
1. **Architecture Research**: Latest patterns for identified technology stack
2. **Security Research**: Current security best practices and vulnerabilities
3. **Performance Research**: Optimization techniques and benchmarks
4. **Design Validation**: Consistency and traceability checks

### Phase 3: Implementation & Validation
1. **Implementation Research**: Latest tutorials and examples
2. **Quality Enforcement**: Code comments and documentation standards
3. **Interactive Validation**: User confirms each task completion
4. **Error Tracking**: Documents and learns from any issues

## 📁 File Structure

```
your-project/
├── .gitignore                   # Automatically updated to exclude SpecDev files
├── .specdev/                    # Feature specifications (excluded from Git)
│   ├── specs/
│   │   └── {feature-name}/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   ├── summaries/               # Context summaries
│   ├── backup/                  # Update backups
│   │   └── backup-{timestamp}/
│   ├── error-database.json      # Error tracking
│   ├── version-info.json        # Version management
│   └── project-analysis.json    # Project analysis results
├── .cursor/rules/               # Agent rules (excluded from Git)
│   ├── specdev-enhanced-workflow.mdc
│   ├── specdev-research-first.mdc
│   ├── specdev-think-first.mdc
│   ├── specdev-parallel-processing.mdc
│   └── ... (13 more specialized rules)
└── ... (your project files)
```

## 🔧 Git Integration

### **Automatic .gitignore Management**

SpecDev automatically creates or updates your `.gitignore` file to exclude development files from production:

```gitignore
# SpecDev - Development and specification files
# Remove these lines if you want to include specs in your repository
.specdev/
.cursor/

# SpecDev generated files
requirements-template.md
design-template.md
tasks-template.md
project-analysis.json
project-summary.md
```

### **Production vs Development**

#### **For Production Repositories** (Default):
- ✅ **Clean commits** - Only your application code
- ✅ **No development artifacts** - Specifications stay local
- ✅ **Smaller repository** - Reduced clone size
- ✅ **Team flexibility** - Each developer can use their own specs

#### **For Team Specification Sharing**:
If you want to share specifications with your team, simply remove the SpecDev section from `.gitignore`:

```bash
# Edit .gitignore and remove or comment out:
# .specdev/
# .cursor/
```

This allows you to:
- 📋 **Version control specs** with your code
- 👥 **Share requirements and designs** with team members
- 🔄 **Collaborate on specifications** through Git
- 📊 **Track specification evolution** over time

### **Best Practices**

#### **For Individual Projects**:
- Keep default `.gitignore` settings
- Specifications remain local and personal
- Focus commits on actual code changes

#### **For Team Projects**:
- Decide as a team whether to include specifications
- Consider separate specification repository if needed
- Use Git LFS for large specification assets if required

## 🔧 Advanced Features

### **Adaptive Project Templates**

**Web Applications**:
- React/Vue/Angular latest version research
- Modern state management patterns
- Performance optimization techniques
- Security best practices (OWASP)

**Mobile Applications**:
- iOS/Android platform-specific requirements
- Cross-platform framework evaluation
- App store compliance guidelines
- Mobile performance patterns

**API/Backend Services**:
- Latest framework comparisons
- Database technology evaluation
- Security implementation patterns
- Scalability considerations

**Desktop Applications**:
- Platform-specific development patterns
- Cross-platform framework research
- Distribution and deployment strategies
- Performance optimization techniques

### **Quality Assurance Integration**

**Requirements Quality**:
- EARS format compliance checking
- Completeness validation
- Ambiguity detection
- Testability verification

**Design Quality**:
- Architecture consistency validation
- Technology alignment verification
- Security consideration checks
- Performance impact analysis

**Implementation Quality**:
- Code documentation enforcement
- Best practices compliance
- Error handling verification
- Test coverage requirements

## 🚀 Key Benefits

### **For Individual Developers**
- **Always Current**: Uses latest 2025-2026 information and practices
- **Research-Driven**: Every decision backed by current research
- **Quality-Focused**: Built-in quality gates prevent issues
- **Learning-Oriented**: Comprehensive documentation helps understanding

### **For Development Teams**
- **Consistent Quality**: Standardized processes across projects
- **Knowledge Sharing**: Error solutions shared across team
- **Reduced Debugging**: Error tracking prevents repeated issues
- **Documentation Standards**: Newbie-friendly code documentation

### **For Project Success**
- **Reduced Technical Debt**: Research-first approach prevents outdated choices
- **Better Architecture**: Latest patterns ensure maintainable code
- **Comprehensive Specs**: Full traceability from requirements to implementation
- **Quality Assurance**: Multiple validation gates ensure high standards

## 📊 Commands Reference

| Command | Purpose | Description |
|---------|---------|-------------|
| `SpecDev: Open SpecDev` | Launch Interface | Opens the main SpecDev webview |
| `SpecDev: Init SpecDev Project` | Initialize | Sets up complete SpecDev system |
| `SpecDev: Analyze Existing Project (Steering)` | Project Analysis | Analyzes existing codebase |
| `SpecDev: Update SpecDev Installation` | Update System | Updates to latest version |
| `SpecDev: Create Context Summary` | Optimize Context | Creates conversation summaries |
| `SpecDev: Generate Requirements from Prompt` | Requirements | Creates requirements template |
| `SpecDev: Generate Design from Requirements` | Design | Creates design template |
| `SpecDev: Generate Tasks from Design` | Tasks | Creates implementation template |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-enhancement-name`
3. Follow the research-first, think-first development principles
4. Add comprehensive tests and documentation
5. Ensure all quality gates pass
6. Submit pull request with detailed research and reasoning

## 📄 License

MIT License - Enhanced for modern development practices.

## 🙏 Credits

**Original SpecDev**: Foundation specification-driven development tool with Kiro workflow integration, markdown support, and Mermaid diagram capabilities.

**Enhanced by [UntaDotMy](https://github.com/UntaDotMy)**: Added research-first development, think-first principles, comprehensive quality assurance, error tracking, version migration, context optimization, and modern development practices.

## 📈 Version History

### v0.3.0 (Latest) - Enhanced Development
- ✨ Think-first development rules
- 🔍 Research-first implementation approach  
- 🔄 Parallel processing optimization
- 📋 High-quality deliverables framework
- 🔧 Fixed update mechanism (force rule updates)
- 💾 Version migration system
- 📝 Context summarization
- 🎯 Cursor compliance audit and fixes

### v0.2.0 - Quality & Intelligence
- 🎯 Comprehensive project analysis
- ✅ QA/QC integration
- 🚨 Error tracking and resolution
- 🔍 Web search integration
- 📊 Task validation system
- 🔄 Real-time UI updates

### v0.1.0 - Foundation
- 📋 Basic three-tab interface
- 📝 Markdown editing support
- 📊 Mermaid diagram support
- ✅ Interactive task checkboxes
- 📁 File organization system

## 🆘 Support

For issues, feature requests, or questions:
1. Check the error database for similar issues
2. Review the comprehensive documentation
3. Search existing GitHub issues
4. Create detailed issue with:
   - Project context and technology stack
   - Steps to reproduce
   - Expected vs actual behavior
   - Error logs and validation results

---

**SpecDev** - Building better software through intelligent, research-driven specification development with comprehensive quality assurance and modern development practices.

> *"Think first, research thoroughly, implement precisely, validate completely."*