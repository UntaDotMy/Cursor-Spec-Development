# Changelog - cc-ssd-enh

All notable changes to this enhanced version of cc-sdd will be documented in this file.

## [1.3.0] - 2024-09-18

### Added - Self-Review & Mistake Detection
- **Self-Review Phase**: Mandatory re-reading of all modified files after code changes
- **Mistake Detection**: Systematic checking for syntax, logic, integration, and performance issues
- **Self-Correction Loop**: Automatic mistake detection and fixing before proceeding to testing
- **Mistake Documentation**: Structured documentation of detected mistakes and their solutions
- **Enhanced TDD**: Added Step 5 (Self-Review) to the TDD cycle before verification

### Enhanced
- **Template Updates**: All agent templates (Claude Code, Cursor IDE, Gemini CLI) now include self-review instructions
- **Cross-Platform**: Self-review feature available on Windows, macOS, and Linux
- **Knowledge Management**: Added mistake documentation in `{kiro-dir}/knowledge/errors/mistake-*.md`

## [1.2.0] - 2024-09-18

### Added - Core Enhancements
- **WebSearch Integration**: Automatic research for latest versions, best practices, and official documentation
- **Knowledge Management System**: Structured documentation in `{kiro-dir}/knowledge/` directory
- **Error Documentation**: Web-searched solutions documented for reuse
- **Knife Surgery Coding**: Context-aware code changes with minimal impact
- **Enhanced Templates**: All command templates enhanced with research capabilities

### Features
- **Research Documentation**: 
  - `research-{topic}-{number}.md` - Research findings
  - `docs-{technology}-{number}.md` - Fetched documentation
  - `bestpractices-{type}-{number}.md` - Best practices research
  - `errors/{errorname}.md` - Error solutions
- **No Assumptions Policy**: Mandatory web search for unknown errors
- **Multi-Agent Support**: Enhanced capabilities for Claude Code, Cursor IDE, and Gemini CLI

### Infrastructure
- **CI/CD Pipeline**: GitHub Actions workflow for automated testing and building
- **Cross-Platform Testing**: Ubuntu, Windows, macOS with Node.js 18, 20, 22
- **NPM Publishing**: Automated publishing pipeline

## [1.0.0] - Original cc-sdd
Based on the excellent foundation by [Gota](https://github.com/gotalab) at [cc-sdd](https://github.com/gotalab/cc-sdd)

### Original Features (Inherited)
- AI-DLC (AI-Driven Development Life Cycle) methodology
- Spec-driven development workflow
- Multi-language support (12+ languages)
- Multi-agent support (Claude Code, Cursor IDE, Gemini CLI)
- Project memory via steering documents
- Quality gates and approval workflow

---

## Credits
This enhanced version builds upon the excellent foundation of [cc-sdd](https://github.com/gotalab/cc-sdd) created by **[Gota](https://github.com/gotalab)**. All core spec-driven development methodology and AI-DLC concepts are credited to the original author.
