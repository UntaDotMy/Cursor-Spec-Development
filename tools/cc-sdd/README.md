# cc-ssd-enh

✨ **Enhanced Spec-Driven Development with WebSearch Integration & Knowledge Management**

<!-- npm badges -->
[![npm version](https://img.shields.io/npm/v/cc-ssd-enh?logo=npm)](https://www.npmjs.com/package/cc-ssd-enh?activeTab=readme)
[![install size](https://packagephobia.com/badge?p=cc-ssd-enh)](https://packagephobia.com/result?p=cc-ssd-enh)
[![license: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://github.com/gotalab/cc-sdd/workflows/CI/badge.svg)](https://github.com/gotalab/cc-sdd/actions)

> **Enhanced version of [cc-sdd](https://github.com/gotalab/cc-sdd) by [Gota](https://github.com/gotalab)** with WebSearch integration, knowledge management, error documentation, and knife surgery coding capabilities.

<div align="center" style="margin-bottom: 1rem; font-size: 1.2rem;"><sub>
English | <a href="https://github.com/gotalab/cc-sdd/blob/main/tools/cc-sdd/README_ja.md">日本語</a> | <a href="https://github.com/gotalab/cc-sdd/blob/main/tools/cc-sdd/README_zh-TW.md">繁體中文</a>
</sub></div>

Brings **AI-DLC (AI Driven Development Lifecycle)** to Claude Code, Cursor IDE and Gemini CLI. **AI-native processes** with **minimal human approval gates**: AI drives execution while humans validate critical decisions at each phase.

🎯 **Perfect for**: Escaping the 70% overhead trap of traditional development (meetings, documentation, ceremonies) to achieve **weeks-to-hours delivery** with AI-native execution and human quality gates.

> **Kiro compatible** — Same proven workflow used in professional environments.

## 🚀 Installation

```bash
# Basic installation (defaults: English docs, Claude Code agent)
npx cc-ssd-enh@latest

# With language options (default: --lang en)
npx cc-ssd-enh@latest --lang ja    # Japanese
npx cc-ssd-enh@latest --lang zh-TW # Traditional Chinese
# Supported languages: en, ja, zh-TW, zh, es, pt, de, fr, ru, it, ko, ar

# With agent options (default: claude-code)
npx cc-ssd-enh@latest --gemini-cli --lang ja # For Gemini CLI instead
npx cc-ssd-enh@latest --cursor --lang ja # For Cursor IDE instead
```

## 🌐 Supported Languages

- English (`en`)
- Japanese (`ja`)
- Traditional Chinese (`zh-TW`)
- Chinese (`zh`)
- Spanish (`es`)
- Portuguese (`pt`)
- German (`de`)
- French (`fr`)
- Russian (`ru`)
- Italian (`it`)
- Korean (`ko`)
- Arabic (`ar`)

## ✨ Quick Start

### For New Projects
```bash
# Launch AI agent and start spec-driven development immediately
/kiro:spec-init Build a user authentication system with OAuth  # AI creates structured plan
/kiro:spec-requirements auth-system                            # AI asks clarifying questions
/kiro:spec-design auth-system                                  # Human validates, AI designs
/kiro:spec-tasks auth-system                                   # Break into implementation tasks
/kiro:spec-impl auth-system                                    # Execute with TDD
```

![design.md - System Flow Diagram](https://raw.githubusercontent.com/gotalab/cc-sdd/refs/heads/main/assets/design-system_flow.png)
*Example of system flow during the design phase `design.md`*

### For Existing Projects (Recommended)
```bash
# First establish project context, then proceed with development
/kiro:steering                                                 # AI learns existing project context

/kiro:spec-init Add OAuth to existing auth system              # AI creates enhancement plan
/kiro:spec-requirements oauth-enhancement                      # AI asks clarifying questions
/kiro:validate-gap oauth-enhancement                           # Optional: Analyze existing vs requirements
/kiro:spec-design oauth-enhancement                            # Human validates, AI designs
/kiro:validate-design oauth-enhancement                        # Optional: Validate design integration  
/kiro:spec-tasks oauth-enhancement                             # Break into implementation tasks
/kiro:spec-impl oauth-enhancement                              # Execute with TDD
```

**30-second setup** → **AI-driven "bolts" (not sprints)** → **Hours-to-delivery results**

## ✨ Key Features

- **🚀 AI-DLC Methodology** - AI-native processes with human approval. Core pattern: AI executes, human validates
- **📋 Spec-First Development** - Comprehensive specifications as single source of truth driving entire lifecycle
- **🔍 WebSearch Integration** - Automatic research for latest versions, best practices, and official documentation
- **📚 Knowledge Management** - Structured documentation in `{kiro-dir}/knowledge/` with research findings and error solutions
- **⚡ Knife Surgery Coding** - Context-aware code changes with minimal impact, reads target files before modification
- **🔍 Self-Review & Mistake Detection** - Automatically re-reads modified files to detect and fix mistakes before testing
- **🛠️ Error Documentation** - Web-searched solutions documented for reuse, no assumptions allowed
- **🧠 Persistent Project Memory** - AI maintains comprehensive context across all sessions via steering documents  
- **🌍 Team-Ready** - Multi-language, cross-platform, standardized workflows with quality gates

## 🤖 Supported AI Agents

| Agent | Status | Commands | Config |
|-------|--------|----------|--------|
| **Claude Code** | ✅ Full | 10 slash commands | `CLAUDE.md` |
| **Gemini CLI** | ✅ Full | 10 commands | `GEMINI.md` |
| **Cursor IDE** | ✅ Full | 10 commands | `AGENTS.md` |
| Others | 📅 Planned | - | - |
 
## 📋 Commands

### Spec-Driven Development Workflow (Specs Methodology)
```bash
/kiro:spec-init <description>             # Initialize feature spec
/kiro:spec-requirements <feature_name>    # Generate requirements
/kiro:spec-design <feature_name>          # Create technical design  
/kiro:spec-tasks <feature_name>           # Break into implementation tasks
/kiro:spec-impl <feature_name> <tasks>    # Execute with TDD
/kiro:spec-status <feature_name>          # Check progress
```

> **Specifications as the Foundation**: Based on [Kiro's specs](https://kiro.dev/docs/specs/) - specs transform ad-hoc development into systematic workflows, bridging ideas to implementation with clear AI-human collaboration points.

> **Kiro IDE Integration**: Specs are portable to [Kiro IDE](https://kiro.dev) for enhanced implementation with guardrails and team collaboration features.

### Quality Validation (Optional - Brownfield Development)
```bash
# Before spec-design (analyze existing functionality vs requirements):
/kiro:validate-gap <feature_name>         # Analyze existing functionality and identify gaps with requirements

# After spec-design (validate design against existing system):
/kiro:validate-design <feature_name>      # Review design compatibility with existing architecture
```

> **Optional for Brownfield Development**: `validate-gap` analyzes existing vs required functionality; `validate-design` checks integration compatibility. Both are optional quality gates for existing systems.

### Project Memory & Context (Essential)
```bash
/kiro:steering                            # Create/update project memory and context
/kiro:steering-custom                     # Add specialized domain knowledge
```

> **Critical Foundation Commands**: Steering creates persistent project memory - context, rules, and architecture that AI uses across all sessions. **Run first for existing projects** to dramatically improve spec quality.

## ⚙️ Configuration

```bash
# Language and platform
npx cc-ssd-enh@latest --lang ja --os mac   # macOS
npx cc-ssd-enh@latest --lang ja --os linux # Linux (shares mac templates)

# Safe operations  
npx cc-ssd-enh@latest --dry-run --backup

# Custom directory
npx cc-ssd-enh@latest --kiro-dir docs/specs
```

## 📁 Project Structure

After installation, your project gets:

```
project/
├── .claude/commands/kiro/    # Enhanced slash commands
├── .kiro/
│   ├── specs/                # Feature specifications
│   ├── steering/             # AI guidance rules
│   └── knowledge/            # Research & error documentation (NEW)
│       ├── research-*.md     # Web research findings
│       ├── docs-*.md         # Fetched documentation
│       └── errors/           # Error solutions
└── CLAUDE.md                 # Enhanced project configuration
```

## 🗑️ Uninstall Instructions

### Remove Generated Files

```bash
# Remove all generated files and folders
rm -rf .claude .cursor .gemini .kiro CLAUDE.md AGENTS.md GEMINI.md

# Windows PowerShell
Remove-Item -Recurse -Force .claude, .cursor, .gemini, .kiro, CLAUDE.md, AGENTS.md, GEMINI.md
```

### Agent-Specific Cleanup

**Claude Code**
```bash
rm -rf .claude CLAUDE.md
```

**Cursor IDE**  
```bash
rm -rf .cursor AGENTS.md
```

**Gemini CLI**
```bash
rm -rf .gemini GEMINI.md
```

### Global Package Removal
```bash
# If installed globally
npm uninstall -g cc-ssd-enh
```

## 🆕 Enhanced Features

### WebSearch Integration
- **Requirements Phase**: Automatic research for latest versions and best practices
- **Design Phase**: Technology analysis and architecture patterns research  
- **Error Handling**: Web search for solutions (GitHub, Stack Overflow, Reddit)

### Knowledge Management
- **Research Documentation**: `{kiro-dir}/knowledge/research-{topic}-{number}.md`
- **Error Solutions**: `{kiro-dir}/knowledge/errors/{errorname}.md` with working solutions
- **Best Practices**: `{kiro-dir}/knowledge/bestpractices-{type}-{number}.md`

### Knife Surgery Coding
- **Context Understanding**: Always reads target files before making changes
- **Minimal Impact**: Surgical modifications preserving existing functionality
- **Self-Review & Mistake Detection**: Automatically re-reads all modified files to check for mistakes
- **Self-Correction Loop**: Detects and fixes mistakes immediately before testing
- **No Assumptions**: Mandatory web search for unknown errors

## 📚 Documentation & Support

- **[Original Project](https://github.com/gotalab/cc-sdd)** - Created by [Gota](https://github.com/gotalab)
- **[Full Documentation](https://github.com/gotalab/cc-sdd/tree/main/docs/README)** - Complete setup guide
- **[Issues & Support](https://github.com/gotalab/cc-sdd/issues)** - Bug reports and questions
- **[Kiro IDE](https://kiro.dev)** - Professional spec-driven development environment

## 🙏 Credits

This enhanced version is built upon the excellent foundation of [cc-sdd](https://github.com/gotalab/cc-sdd) created by **[Gota](https://github.com/gotalab)**. All core spec-driven development methodology and AI-DLC concepts are credited to the original author.

**Enhancements**: WebSearch integration, knowledge management, error documentation, self-review mistake detection, and knife surgery coding capabilities.

---

**Enhanced Release v1.3.0** - Ready for production use with advanced research, documentation, and self-review mistake detection capabilities. 

MIT License | Built with ❤️ on the foundation by [Gota](https://github.com/gotalab)

### Platform Support
- Supported OS: macOS, Linux, Windows (auto-detected by default)
- Linux uses the same command templates as macOS. Windows has dedicated templates
- CI/CD automated builds and testing across all platforms
