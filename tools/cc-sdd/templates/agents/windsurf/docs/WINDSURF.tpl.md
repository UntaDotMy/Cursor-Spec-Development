# AI-DLC and Spec-Driven Development for Windsurf IDE

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle) for Windsurf IDE

## Project Context

### Paths
- Steering: `{{KIRO_DIR}}/steering/`
- Specs: `{{KIRO_DIR}}/specs/`
- Workflows: `.windsurf/workflows/`
- Knowledge Base: `{{KNOWLEDGE_DIR}}/`

### Steering vs Specification

**Steering** (`{{KIRO_DIR}}/steering/`) - Guide AI with project-wide rules and context
**Specs** (`{{KIRO_DIR}}/specs/`) - Formalize development process for individual features

### Enhanced Capabilities

**Research-Driven Development**: All requirements generation includes mandatory web research using latest 2025-2026 information
**Knowledge Management**: Automated documentation of research findings and error solutions
**Accuracy Gates**: Iterative search validation to ensure information accuracy
**Knife Surgery Coding**: Precise code modifications with mandatory file reading before changes
**Self-Review & Mistake Detection**: Automated code review before testing with mistake documentation

### Knowledge Organization
- **Research Documentation**: `{{KNOWLEDGE_DIR}}/research-{topic}-{number}.md`
- **Best Practices**: `{{KNOWLEDGE_DIR}}/bestpractices-{type}-{number}.md`
- **Error Solutions**: `{{KNOWLEDGE_DIR}}/errors/{errorname}.md`

### Active Specifications
- Check `{{KIRO_DIR}}/specs/` for active specifications
- Use `/kiro-spec-status [feature-name]` to check progress

## Enhanced Workflow

### Phase 0: Steering (Optional)
`/kiro-steering` - Create/update steering documents
`/kiro-steering-custom` - Create custom steering for specialized contexts

**Note**: Optional for new features or small additions. Can proceed directly to spec-init.

### Phase 1: Specification Creation (Research-Enhanced)
1. `/kiro-spec-init [detailed description]` - Initialize spec with detailed project description
2. `/kiro-spec-requirements [feature]` - **MANDATORY RESEARCH PHASE** → Generate requirements document
3. `/kiro-spec-design [feature]` - Interactive: "Have you reviewed requirements.md? [y/N]"
4. `/kiro-spec-tasks [feature]` - Interactive: Confirms both requirements and design review

### Phase 2: Implementation (Enhanced)
5. `/kiro-spec-impl [feature] [task-numbers]` - **KNIFE SURGERY + SELF-REVIEW** → Execute tasks
6. **Automated Self-Review**: Check for mistakes before testing
7. **Error Documentation**: Auto-document and research solutions for any errors

### Phase 3: Progress Tracking
`/kiro-spec-status [feature]` - Check current progress and phases

## Enhanced Features

### 1. Mandatory Web Research
- **Every requirements generation** triggers web search for latest versions, best practices, and official documentation
- **2025-2026 context** ensures up-to-date information
- **Knowledge documentation** captures all research findings

### 2. Accuracy Gate & Iterative Search
- **Multiple source validation** ensures information accuracy
- **Automatic query refinement** when data is incomplete
- **No assumption policy** - everything must be web-verified

### 3. Knife Surgery Implementation
- **Mandatory file reading** before any code modifications
- **Precise targeting** to minimize impact and reduce errors
- **Context understanding** before making changes

### 4. Self-Review & Mistake Detection
- **Automatic code review** after any modifications
- **Mistake documentation** with context and solutions
- **Self-correction loop** until no obvious mistakes remain

### 5. Error Intelligence
- **Automatic error research** using web search when issues occur
- **Solution documentation** for future reference
- **No assumption policy** for error resolution

## Development Guidelines
{{DEV_GUIDELINES}}

## Development Rules
1. **Research First**: All planning requires web research and knowledge documentation
2. **Accuracy Validation**: Iterative search until information is verified accurate
3. **Read Before Modify**: Always read target files before making changes
4. **Self-Review Process**: Check for mistakes before testing
5. **Document Everything**: Research findings, errors, and solutions go to knowledge/
6. **Follow 3-phase workflow**: Requirements → Design → Tasks → Implementation
7. **No Assumptions**: Use web search instead of relying on model knowledge cutoff
8. **Knowledge Reuse**: Check existing knowledge/ before researching same topics

## Windsurf-Specific Features

### Integration with Windsurf AI
- Leverage Windsurf's Cascade AI for enhanced code understanding
- Utilize Windsurf's multi-file editing capabilities during implementation
- Take advantage of Windsurf's autonomous execution for complex tasks

### Command Execution in Windsurf
- Commands integrate with Windsurf's built-in terminal and AI assistant
- Seamless workflow within Windsurf's AI-powered environment
- Enhanced collaboration with Windsurf's AI agents

## Steering Configuration

### Current Steering Files
Managed by `/kiro/steering` command. Updates here reflect command changes.

### Active Steering Files
- `product.md`: Always included - Product context and business objectives
- `tech.md`: Always included - Technology stack and architectural decisions
- `structure.md`: Always included - File organization and code patterns

### Custom Steering Files
<!-- Added by /kiro/steering-custom command -->
<!-- Format:
- `filename.md`: Mode - Pattern(s) - Description
  Mode: Always|Conditional|Manual
  Pattern: File patterns for Conditional mode
-->

### Inclusion Modes
- **Always**: Loaded in every interaction (default)
- **Conditional**: Loaded for specific file patterns (e.g., `"*.test.js"`)
- **Manual**: Reference with `@filename.md` syntax
