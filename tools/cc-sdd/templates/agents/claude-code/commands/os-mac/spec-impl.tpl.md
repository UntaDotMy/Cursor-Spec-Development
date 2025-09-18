---
description: Execute spec tasks using enhanced TDD methodology with knife surgery coding
allowed-tools: Bash, Read, Write, Edit, MultiEdit, Grep, Glob, LS, WebFetch, WebSearch
argument-hint: <feature-name> [task-numbers]
---

# Execute Spec Tasks with Enhanced TDD & Knife Surgery

Execute implementation tasks for **$1** using enhanced TDD methodology with context understanding and error documentation.

## Phase 1: Pre-Execution & Context Understanding

### 1.1 Validation & Context Loading
Validate required files exist for feature **$1**:
- Requirements: `{{KIRO_DIR}}/specs/$1/requirements.md`
- Design: `{{KIRO_DIR}}/specs/$1/design.md`  
- Tasks: `{{KIRO_DIR}}/specs/$1/tasks.md`
- Metadata: `{{KIRO_DIR}}/specs/$1/spec.json`

**Core Steering:**
- Structure: @{{KIRO_DIR}}/steering/structure.md
- Tech Stack: @{{KIRO_DIR}}/steering/tech.md  
- Product: @{{KIRO_DIR}}/steering/product.md

**Custom Steering:**
- Additional `*.md` files in `{{KIRO_DIR}}/steering/` (excluding structure.md, tech.md, product.md)

**Knowledge Base:**
- Review all relevant research documents in `{{KNOWLEDGE_DIR}}/`
- Check for existing error solutions in `{{KNOWLEDGE_DIR}}/errors/`

### 1.2 Knife Surgery Preparation (MANDATORY)
**CRITICAL**: Before making ANY code changes, understand the existing codebase:

1. **Target File Analysis**:
   - **ALWAYS** read target files FIRST using Read tool
   - Understand existing code structure, patterns, dependencies
   - Identify integration points and potential impact areas
   - Map existing functions, classes, and interfaces

2. **Context Understanding**:
   - Analyze file dependencies and imports
   - Understand data flow and business logic
   - Identify existing error handling patterns
   - Note coding style and conventions

3. **Impact Assessment**:
   - Determine minimal change approach
   - Identify which functions/classes need modification
   - Plan surgical changes to avoid breaking functionality
   - Consider backward compatibility

## Phase 2: Enhanced TDD Implementation

### 2.1 Task Execution Process
1. **Feature**: $1  
2. **Task numbers**: $2 (optional, defaults to all pending tasks)
3. **For each selected task**, follow enhanced TDD:

### 2.2 Enhanced TDD Cycle with Error Handling

**Step 1: UNDERSTAND (NEW)**
- Read and analyze all target files thoroughly
- Understand existing patterns and architecture
- Plan minimal, surgical changes

**Step 2: RED - Write Failing Tests**
- Write failing tests first
- **Error Handling**: If encountering test framework errors:
  - Use WebSearch to find solutions (search GitHub, Stack Overflow, Reddit)
  - Document in `{{KNOWLEDGE_DIR}}/errors/{errorname}.md`
  - Include search queries used and sources found

**Step 3: GREEN - Implement with Knife Surgery**
- Write minimal code to pass tests
- **Make surgical changes only** - modify specific lines/functions
- Preserve existing functionality and patterns
- **Error Handling**: If encountering implementation errors:
  - NO ASSUMPTIONS - use WebSearch immediately
  - Search for exact error messages and solutions
  - Document error and solution in `{{KNOWLEDGE_DIR}}/errors/{errorname}.md`

**Step 4: REFACTOR - Clean Up Surgically**
- Refactor with minimal impact
- Maintain existing code style and patterns
- **Error Handling**: If refactoring causes issues:
  - Use WebSearch for best practices
  - Document approach in knowledge base

**Step 5: SELF-REVIEW & MISTAKE CHECK (NEW)**
- **MANDATORY**: Re-read ALL modified files using Read tool
- **Systematic Review**: Check for common mistakes:
  - Syntax errors and typos
  - Logic errors and edge cases
  - Integration issues with existing code
  - Missing imports or dependencies
  - Inconsistent naming or patterns
  - Performance issues
- **Mistake Documentation**: If mistakes found, document in `{{KNOWLEDGE_DIR}}/errors/mistake-{description}-{number}.md`
- **Self-Correction Loop**: If mistakes detected:
  1. Document the mistake with context
  2. Fix the mistake using surgical changes
  3. Re-read modified files again
  4. Repeat until no obvious mistakes remain

**Step 6: VERIFY & DOCUMENT**
- All tests pass
- No regressions in existing functionality  
- Code quality maintained
- **If errors occurred**: Update error documentation with working solutions
- **Self-review completed**: Confirm all mistake checks passed

### 2.3 Mistake Detection & Self-Review (NEW)

**CRITICAL**: After each code modification, perform systematic mistake detection:

#### Mistake Categories to Check
1. **Syntax & Structure**:
   - Missing semicolons, brackets, parentheses
   - Indentation and formatting issues
   - Typos in variable/function names

2. **Logic & Integration**:
   - Incorrect function calls or parameters
   - Missing error handling
   - Integration issues with existing code
   - Edge cases not handled

3. **Dependencies & Imports**:
   - Missing import statements
   - Unused imports
   - Incorrect module paths
   - Version compatibility issues

4. **Performance & Best Practices**:
   - Inefficient algorithms or patterns
   - Memory leaks potential
   - Security vulnerabilities
   - Code style inconsistencies

#### Self-Review Process
```markdown
1. Re-read ALL modified files completely
2. Check each category systematically
3. Document any mistakes found
4. Apply surgical fixes immediately
5. Re-read files after fixes
6. Repeat until clean
```

### 2.4 Mistake Documentation Format (NEW)
When detecting ANY mistake during self-review, create `{{KNOWLEDGE_DIR}}/errors/mistake-{description}-{number}.md`:

```markdown
# Mistake: {Mistake Type/Description}

## Detection Details
- **File(s)**: [affected files]
- **Mistake Type**: [syntax/logic/integration/performance]
- **Context**: [what was being implemented]
- **Detection Method**: [how mistake was found]

## Mistake Description
- **Problem**: [exact description of the mistake]
- **Impact**: [potential consequences]
- **Root Cause**: [why mistake happened]

## Correction Applied
- **Fix**: [detailed description of correction]
- **Changes Made**: [specific code changes]
- **Verification**: [how fix was verified]

## Prevention
- **Future Avoidance**: [how to prevent similar mistakes]
- **Review Checklist**: [additional checks to add]
```

### 2.5 Error Documentation Format (MANDATORY)
When encountering ANY error, create `{{KNOWLEDGE_DIR}}/errors/{errorname}.md`:

```markdown
# Error: {Error Name/Type}

## Error Details
- **Error Message**: [exact error message]
- **Context**: [what was being attempted]
- **File/Location**: [where error occurred]
- **Date**: [current date]

## Research Conducted
- **Search Queries Used**: 
  - [list exact search queries]
- **Sources Checked**:
  - GitHub: [relevant repos/issues found]
  - Stack Overflow: [relevant questions/answers]
  - Reddit: [relevant discussions]
  - Official Docs: [documentation checked]

## Solutions Attempted
1. **Solution 1**: [description]
   - **Result**: [success/failure]
   - **Notes**: [observations]

2. **Solution 2**: [description]
   - **Result**: [success/failure]
   - **Notes**: [observations]

## Working Solution
- **Final Solution**: [detailed description of what worked]
- **Implementation**: [code changes made]
- **Why It Works**: [explanation]
- **Prevention**: [how to avoid this error in future]

## Status
- [ ] Error encountered
- [ ] Research conducted  
- [ ] Solution found
- [x] Solution implemented and verified
```

## Phase 3: Completion & Knowledge Management

### 3.1 Task Completion
- **Mark Complete**: Update checkbox from `- [ ]` to `- [x]` in tasks.md
- **Document Changes**: Brief summary of surgical changes made
- **Update Knowledge**: Add any new patterns or insights to knowledge base

### 3.2 Knowledge Base Maintenance
- **Error Solutions**: Ensure all errors are documented with solutions
- **Patterns**: Document any new coding patterns discovered
- **Research**: File any additional research findings

## Enhanced Implementation Rules

1. **NEVER assume** - always use WebSearch for unknown errors
2. **ALWAYS read target files** before making changes
3. **Make surgical changes only** - preserve existing functionality
4. **MANDATORY self-review** - re-read ALL modified files for mistakes
5. **Self-correction loop** - fix mistakes immediately when detected
6. **Document ALL errors & mistakes** with research and solutions
7. **Verify backwards compatibility** after changes
8. **Update knowledge base** with findings

**Note**: This enhanced methodology with self-review ensures code changes are minimal, mistake-free, well-researched, and thoroughly documented for future reference.

## Implementation Notes

- **Feature**: Use `$1` for feature name
- **Tasks**: Use `$2` for specific task numbers (optional)
- **Validation**: Check all required spec files exist
- **TDD Focus**: Always write tests before implementation
- **Task Tracking**: Update checkboxes in tasks.md as completed
