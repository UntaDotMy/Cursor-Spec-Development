<div align="center" style="font-size: 1rem; margin-bottom: 1rem;"><sub>
<a href="./tools/cc-sdd/README.md">English</a> | <a href="./tools/cc-sdd/README_ja.md">日本語</a> | <a href="./tools/cc-sdd/README_zh-TW.md">繁體中文</a>
</sub></div>

# cc-ssd-enh (Enhanced)

✨ **Enhanced Spec-Driven Development with WebSearch Integration & Knowledge Management**

<!-- npm badges -->
[![npm version](https://img.shields.io/npm/v/cc-ssd-enh?logo=npm)](https://www.npmjs.com/package/cc-ssd-enh?activeTab=readme)
[![install size](https://packagephobia.com/badge?p=cc-ssd-enh)](https://packagephobia.com/result?p=cc-ssd-enh)
[![license: MIT](https://img.shields.io/badge/license-MIT-green.svg)](tools/cc-sdd/LICENSE)
[![Build Status](https://github.com/UntaDotMy/Cursor-Spec-Development/workflows/CI/badge.svg)](https://github.com/UntaDotMy/Cursor-Spec-Development/actions)
[![GitHub release](https://img.shields.io/github/release/UntaDotMy/Cursor-Spec-Development.svg)](https://github.com/UntaDotMy/Cursor-Spec-Development/releases)

> **Enhanced version of [cc-sdd](https://github.com/gotalab/cc-sdd) by [Gota](https://github.com/gotalab)** with WebSearch integration, knowledge management, error documentation, and knife surgery coding capabilities.

<div align="center">
<p><strong>📦 NPM Package:</strong> <a href="https://www.npmjs.com/package/cc-ssd-enh">cc-ssd-enh</a></p>
<p><strong>🏠 Repository:</strong> <a href="https://github.com/UntaDotMy/Cursor-Spec-Development">UntaDotMy/Cursor-Spec-Development</a></p>
<p><strong>👨‍💻 Enhanced by:</strong> <a href="https://github.com/UntaDotMy">@UntaDotMy</a></p>
</div>


One command installs **AI-DLC** (AI-Driven Development Life Cycle) with **SDD** (Spec-Driven Development) workflows for Claude Code, Cursor IDE, Gemini CLI and Windsurf IDE.

## ✨ Enhanced Features

- **🔍 WebSearch Integration** - Automatic research for latest versions, best practices, and official documentation
- **📚 Knowledge Management** - Structured documentation in `{kiro-dir}/knowledge/` with research findings and error solutions  
- **🔍 Self-Review & Mistake Detection** - Automatically re-reads modified files to detect and fix mistakes before testing
- **⚡ Knife Surgery Coding** - Context-aware code changes with minimal impact, reads target files before modification
- **🛠️ Error Documentation** - Web-searched solutions documented for reuse, no assumptions allowed

## 🚀 Quick Start

```bash
# Basic installation (default: Claude Code)
npx cc-ssd-enh@latest

# With language: --lang en|ja|zh-TW|zh|es|pt|de|fr|ru|it|ko|ar
# With OS: --os mac | --os windows | --os linux (if auto-detection fails)
npx cc-ssd-enh@latest --lang ja --os mac

# With different agents: gemini-cli, cursor, windsurf
npx cc-ssd-enh@latest --gemini-cli
npx cc-ssd-enh@latest --cursor
npx cc-ssd-enh@latest --windsurf

# Ready to go! Now Claude Code and Gemini CLI can leverage `/kiro:spec-init <what to build>` and the full enhanced SDD workflow
```

## ✨ What You Get

After running cc-sdd, you'll have:

- **10 powerful slash commands** (`/kiro:steering`, `/kiro:spec-requirements`, `/kiro:validate-gap`, etc.)
- **Project Memory (steering)** - AI learns your codebase, patterns, and preferences
- **Structured AI-DLC workflow** with quality gates and approvals
- **Spec-Driven Development** methodology built-in
- **Kiro IDE compatibility** for seamless spec management

**Perfect for**: Feature development, code reviews, technical planning, and maintaining development standards across your team.

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


---

## About

Brings to Claude Code, Cursor IDE, Gemini CLI and Windsurf IDE your project context, Project Memory (steering) and development patterns: **requirements → design → tasks → implementation**. **Kiro IDE compatible** — Reuse Kiro-style SDD specs and workflows seamlessly.

**【Claude Code/Cursor IDE/Gemini CLI】**
ワンライナーで **AI-DLC（AI-Driven Development Life Cycle）** と **Spec-Driven Development（仕様駆動開発）** のワークフローを導入。プロジェクト直下に **10個のSlash Commands** 一式と設定ファイル（Claude Code用の **CLAUDE.md** / Cursor IDE用の **AGENTS.md** / Gemini CLI用の **GEMINI.md**）を配置、プロジェクトの文脈と開発パターン（**要件 → 設計 → タスク → 実装**）、**プロジェクトメモリ（ステアリング）** を含む。

📝 **関連記事**  
**[Kiroの仕様書駆動開発プロセスをClaude Codeで徹底的に再現した](https://zenn.dev/gotalab/articles/3db0621ce3d6d2)** - Zenn記事

## Languages
> 📖 **Project Overview** (Spec-Driven Development workflow)
- 日本語: [README_ja.md](tools/cc-sdd/README_ja.md)
- English: [README.md](tools/cc-sdd/README.md)
- 繁體中文: [README_zh-TW.md](tools/cc-sdd/README_zh-TW.md)

**Transform your agentic development workflow with Spec-Driven Development**

---

## 🤖 Supported Coding Agents

- **✅ Claude Code** - Fully supported with all 10 custom slash commands and CLAUDE.md
- **✅ Gemini CLI** - Fully supported with all 10 custom commands and GEMINI.md
- **✅ Cursor IDE** - Fully supported with all 10 custom commands and AGENTS.md
- **✅ Windsurf IDE** - Fully supported with all 10 custom commands and WINDSURF.md
- **📅 More agents** - Additional AI coding assistants planned

*Currently optimized for Claude Code. Use `--agent claude-code` (default) for full functionality.*
 
## 📋 AI-DLC Workflow

### For New Projects
```bash
# Start spec-driven development immediately
/kiro:spec-init User authentication with OAuth and 2FA
/kiro:spec-requirements user-auth
/kiro:spec-design user-auth -y
/kiro:spec-tasks user-auth -y
/kiro:spec-impl user-auth 1.1,1.2,1.3
```

📁 **Example Spec**: See [photo-albums-en](.kiro/specs/photo-albums-en/) for a complete spec-driven development example with requirements, design, and tasks.

![design.md - System Flow Diagram](assets/design-system_flow.png)

### For Existing Projects (Recommended)
```bash
# First establish project context
/kiro:steering                                    # AI learns existing project context

# Then proceed with development
/kiro:spec-init Add OAuth to existing auth system
/kiro:spec-requirements oauth-enhancement
/kiro:validate-gap oauth-enhancement              # Optional: analyze existing vs requirements
/kiro:spec-design oauth-enhancement -y
/kiro:validate-design oauth-enhancement           # Optional: validate design integration
/kiro:spec-tasks oauth-enhancement -y
/kiro:spec-impl oauth-enhancement 1.1,1.2,1.3
```

**Quality Gates**: Each phase requires human approval before proceeding (use `-y` to auto-approve).

**Specs as Foundation**: Based on [Kiro's proven methodology](https://kiro.dev/docs/specs/) - specs transform ad-hoc development into systematic workflows. Created specs are portable to [Kiro IDE](https://kiro.dev) for enhanced implementation guardrails and team collaboration.


## 🎯 Advanced Options

```bash
# Choose language and OS
npx cc-ssd-enh@latest --lang ja --os mac

# Preview changes before applying
npx cc-ssd-enh@latest --dry-run

# Safe update with backup
npx cc-ssd-enh@latest --backup --overwrite force

# Custom specs directory
npx cc-ssd-enh@latest --kiro-dir docs/specs
```

### Update Mode and Mandatory Policies

```bash
# Refresh agent commands/workflows to the latest templates (preserves specs/knowledge)
npx cc-ssd-enh@latest --cursor --update
# or --claude-code / --gemini-cli / --windsurf
```

- Overwrites only agent commands/workflows; preserves `{{KIRO_DIR}}/specs` and `{{KNOWLEDGE_DIR}}/`.
- Mandatory policies: research-first (read docs before web tools), base-first implementation, required self-review/error docs, and no assumptions.

## Features

### Core Features (from original cc-sdd)
✅ **AI-DLC Integration** - Complete AI-Driven Development Life Cycle  
✅ **Project Memory** - Steering documents that maintain comprehensive context (architecture, patterns, rules, domain knowledge) across all sessions  
✅ **Spec-Driven Development** - Structured requirements → design → tasks → implementation  
✅ **Cross-Platform** - macOS, Linux, and Windows support with auto-detection (Linux reuses mac templates)  
✅ **Multi-Language** - Japanese, English, Traditional Chinese, and more  
✅ **Safe Updates** - Interactive prompts with backup options

### Enhanced Features (NEW in cc-ssd-enh)
🆕 **WebSearch Integration** - Mandatory research phase for requirements and design  
🆕 **Knowledge Management** - Structured documentation of research findings and solutions  
🆕 **Self-Review & Mistake Detection** - Automatic post-modification code review and correction  
🆕 **Knife Surgery Coding** - Context-aware modifications with minimal impact  
🆕 **Error Documentation** - Web-searched solutions with systematic documentation  
🆕 **Enhanced CI/CD** - Automated testing, releases, and NPM publishing  

## 📚 Related Resources

📝 **Related Articles**  
**[Kiroの仕様書駆動開発プロセスをClaude Codeで徹底的に再現した](https://zenn.dev/gotalab/articles/3db0621ce3d6d2)** - Zenn Article (Japanese)

🎯 **Presentations**  
**[Claude Codeは仕様駆動の夢を見ない](https://speakerdeck.com/gotalab555/claude-codehashi-yang-qu-dong-nomeng-wojian-nai)** - Speaker Deck Presentation (Japanese)

## 📦 Package Information

This repository contains the **cc-ssd-enh** NPM package located in [`tools/cc-sdd/`](tools/cc-sdd/).

For detailed documentation, installation instructions, and usage examples, see:
- [**Tool Documentation**](tools/cc-sdd/README.md) - Complete cc-ssd-enh tool guide
- [**Japanese Documentation**](tools/cc-sdd/README_ja.md) - 日本語版ツール説明
- [**NPM Package**](https://www.npmjs.com/package/cc-ssd-enh) - Published package
- [**GitHub Releases**](https://github.com/UntaDotMy/Cursor-Spec-Development/releases) - Version history

## Project Structure

```
Cursor-Spec-Development/
├── tools/cc-sdd/              # Main cc-ssd-enh NPM package
│   ├── src/                   # TypeScript source code
│   ├── templates/             # Enhanced agent templates (Claude Code, Cursor IDE, Gemini CLI)
│   │   └── agents/            # Agent-specific templates with enhanced features
│   ├── .github/workflows/     # CI/CD pipeline (NEW)
│   ├── scripts/               # Release and maintenance scripts (NEW)
│   ├── package.json           # Package configuration
│   ├── README.md              # Enhanced tool documentation
│   ├── CHANGELOG.md           # Version history (NEW)
│   └── CONTRIBUTING.md        # Contribution guidelines (NEW)
├── docs/                      # Documentation
├── .claude/                   # Example Claude Code commands
├── .gemini/                   # Example Gemini CLI commands
├── README.md                  # This file (Enhanced version)
├── README_ja.md               # Japanese project README
└── README_zh-TW.md            # Traditional Chinese project README
```


## 🙏 Credits & Attribution

### Original Author
This enhanced version is built upon the **excellent foundation** of [cc-sdd](https://github.com/gotalab/cc-sdd) created by **[Gota](https://github.com/gotalab)**.

**🌟 Original Project**: https://github.com/gotalab/cc-sdd  
**👨‍💻 Original Author**: [Gota](https://github.com/gotalab)  
**📦 Original NPM**: [cc-sdd](https://www.npmjs.com/package/cc-sdd)

All core spec-driven development methodology, AI-DLC concepts, and foundational architecture are **credited to the original author**.

### Enhanced Version  
**🚀 Enhanced by**: [UntaDotMy](https://github.com/UntaDotMy)  
**📦 Enhanced NPM**: [cc-ssd-enh](https://www.npmjs.com/package/cc-ssd-enh)  
**🏠 Enhanced Repository**: https://github.com/UntaDotMy/Cursor-Spec-Development

**✨ Enhancements Added**: WebSearch integration, knowledge management, error documentation, self-review mistake detection, and knife surgery coding capabilities.

---

## License

MIT License | Built with ❤️ on the foundation by [Gota](https://github.com/gotalab) | Enhanced by [UntaDotMy](https://github.com/UntaDotMy)
