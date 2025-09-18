# Contributing to cc-ssd-enh

Thank you for your interest in contributing to cc-ssd-enh! This enhanced version builds upon the excellent foundation of [cc-sdd](https://github.com/gotalab/cc-sdd) by [Gota](https://github.com/gotalab).

## 🎯 Project Overview

**cc-ssd-enh** enhances the original cc-sdd with:
- WebSearch integration for research and planning
- Knowledge management system
- Error documentation with web-searched solutions  
- Self-review & mistake detection
- Knife surgery coding with context understanding

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Setup
```bash
git clone https://github.com/UntaDotMy/Cursor-Spec-Development.git
cd Cursor-Spec-Development/tools/cc-sdd
npm install
npm run build
```

### Testing
```bash
npm test                    # Run all tests
npm test -- --watch        # Run tests in watch mode
node dist/cli.js --help     # Test CLI
```

## 📝 Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Keep changes focused and atomic
- Follow existing code patterns
- Add tests for new functionality
- Update documentation as needed

### 3. Test Changes
```bash
npm run build
npm test
node dist/cli.js --dry-run --agent claude-code
```

### 4. Commit & Push
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 5. Create Pull Request
- Describe your changes clearly
- Reference any related issues
- Include testing instructions

## 🔄 Release Process

### Version Updates
When ready for release, update version in `package.json`:
```bash
npm version patch   # 1.3.0 -> 1.3.1
npm version minor   # 1.3.0 -> 1.4.0  
npm version major   # 1.3.0 -> 2.0.0
```

### Automated Release
1. **Update version** in `package.json`
2. **Push to main** branch
3. **GitHub Actions automatically**:
   - Detects version change
   - Runs full test suite
   - Creates GitHub release with changelog
   - Publishes to NPM

## 🧪 Testing Guidelines

### Test Structure
```
test/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests for workflows
└── e2e/           # End-to-end CLI tests
```

### Test Patterns
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies (WebSearch)
- Verify file system operations in isolation

### Adding Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('Enhanced Feature', () => {
  it('should handle WebSearch integration', async () => {
    // Test implementation
  });
});
```

## 📚 Documentation

### README Updates
- Keep README.md concise and focused
- Maintain proper attribution to original author
- Update feature lists when adding enhancements
- Include clear installation and usage examples

### Code Documentation
- Use JSDoc comments for public APIs
- Document complex algorithms and business logic
- Include examples in function documentation

## 🎨 Code Style

### TypeScript
- Use strict TypeScript configuration
- Define explicit types (avoid `any`)
- Use meaningful variable and function names
- Follow existing naming conventions

### File Organization
```
src/
├── cli/            # CLI argument parsing and configuration
├── manifest/       # Manifest processing and planning
├── plan/           # Plan execution and file operations
├── resolvers/      # Path and configuration resolvers
└── template/       # Template processing and rendering
```

## 🐛 Bug Reports

### Issue Template
```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Command used
2. Expected behavior
3. Actual behavior

**Environment**
- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
- Node.js version
- cc-ssd-enh version
- Agent: [Claude Code/Cursor IDE/Gemini CLI]

**Additional Context**
- Error messages
- Relevant configuration
- Screenshots if applicable
```

## ✨ Feature Requests

### Enhancement Template
```markdown
**Feature Description**
Clear description of the proposed enhancement

**Use Case**
Why is this feature needed?

**Proposed Implementation**
How might this be implemented?

**Compatibility**
Impact on existing functionality
```

## 🙏 Credits & Attribution

### Original Author
All contributions must respect and maintain attribution to the original author:
- **Original Project**: https://github.com/gotalab/cc-sdd
- **Original Author**: [Gota](https://github.com/gotalab)

### Enhanced Version
- **Enhanced by**: [UntaDotMy](https://github.com/UntaDotMy)
- **Repository**: https://github.com/UntaDotMy/Cursor-Spec-Development

## 📄 License

This project is licensed under the MIT License - same as the original cc-sdd project.

## 🤝 Code of Conduct

Please be respectful and constructive in all interactions. This project builds upon the excellent work of others, and we maintain the same high standards of professionalism and collaboration.

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/UntaDotMy/Cursor-Spec-Development/issues)
- **Discussions**: [GitHub Discussions](https://github.com/UntaDotMy/Cursor-Spec-Development/discussions)
- **Original Project**: [cc-sdd Repository](https://github.com/gotalab/cc-sdd)

Thank you for contributing to cc-ssd-enh! 🚀
