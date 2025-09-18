<meta>
description: Generate implementation tasks for a specification
argument-hint: [feature-name] [-y]
</meta>

# Implementation Tasks

Generate detailed implementation tasks for feature: **[feature-name]**

## Task: Generate Implementation Tasks

### Prerequisites & Context Loading
- If invoked with `-y`: Auto-approve requirements and design in `spec.json`
- Otherwise: Stop if requirements/design missing or unapproved with message:
  "Run `/kiro/spec-requirements` and `/kiro/spec-design` first, or use `-y` flag to auto-approve"
- If tasks.md exists: Prompt [o]verwrite/[m]erge/[c]ancel

**Context Loading (Full Paths)**:
1. `.kiro/specs/[feature-name]/requirements.md` - Feature requirements (EARS format)
2. `.kiro/specs/[feature-name]/design.md` - Technical design document
3. `.kiro/steering/` - Project-wide guidelines and constraints:
   - **Core files (always load)**:
     - `.kiro/steering/product.md` - Business context, product vision, user needs
     - `.kiro/steering/tech.md` - Technology stack, frameworks, libraries
     - `.kiro/steering/structure.md` - File organization, naming conventions, code patterns
   - **Custom steering files** (load all EXCEPT "Manual" mode in `AGENTS.md`):
     - Any additional `*.md` files in `.kiro/steering/` directory
     - Examples: `api.md`, `testing.md`, `security.md`, etc.
   - (Task planning benefits from comprehensive context)
4. `.kiro/specs/[feature-name]/tasks.md` - Existing tasks (only if merge mode)

### Effort & Scope Guidelines (by classification)
- Simple Addition: 主要タスクは2–3件、各サブは1–2件に抑制。設計で確立済みのパターンを再利用し、不要な比較や図示は省略。
- Extension: 主要タスクは3–5件、各サブは2–3件。統合ポイント、既存境界の尊重、移行影響に重点。
- New Feature / Complex Integration: 主要タスクは5–8件、各サブは2–4件。早期スケルトン、統合・検証のマイルストーン、重要リスク低減を明記。

適用ルール: 上記ガイドに従って、非該当のタスク群（例: デプロイ/運用）は生成しない。必要なタスク群のみを過不足なく含める。

### Required Task Numbering Rules

Follow strictly: sequential major task numbering and two-level hierarchy.
- Major tasks: 1, 2, 3, 4, 5... (MUST increment sequentially)
- Sub-tasks: 1.1, 1.2, 2.1, 2.2... (reset per major task)
- **Maximum 2 levels of hierarchy** (no 1.1.1 or deeper)
- Format exactly as:
```markdown
- [ ] 1. Major task description
- [ ] 1.1 Sub-task description
  - Detail item 1
  - Detail item 2
  - _Requirements: X.X, Y.Y_

- [ ] 1.2 Sub-task description
  - Detail items...
  - _Requirements: X.X_

- [ ] 2. Next major task (NOT 1 again!)
- [ ] 2.1 Sub-task...
```

### Task Generation Rules

1. **Natural language descriptions**: Focus on capabilities and outcomes, not code structure
   - Describe **what functionality to achieve**, not file locations or code organization
   - Specify **business logic and behavior**, not method signatures or type definitions
   - Reference **features and capabilities**, not class names or API contracts
   - Use **domain language**, not programming constructs
   - **Avoid**: File paths, function/method names, type signatures, class/interface names, specific data structures
   - **Include**: User-facing functionality, business rules, system behaviors, data relationships
   - Implementation details (files, methods, types) come from design.md
   - When helpful, reference identifiers defined in design.md to avoid ambiguity; do not introduce new code constructs here.
2. **Task integration & progression**:
   - Each task must build on previous outputs (no orphaned code)
   - End with integration tasks to wire everything together
   - No hanging features - every component must connect to the system
   - Incremental complexity - no big jumps between tasks
   - Validate core functionality early in the sequence
3. **Task sizing (scoped)**:
   - Adjust the number of major tasks and subtasks per the Effort & Scope Guidelines above.
   - Aim for a density that a reviewer can grasp in a single pass; avoid over-fragmentation.
   - Sub-tasks are typically 1–3 hours, but vary with complexity. Use 3–10 detail bullets only when helpful for complex subs; keep minimal for Simple Addition.
   - Group by cohesion, not arbitrary counts.
4. **Requirements mapping**: End details with `_Requirements: X.X, Y.Y_` or `_Requirements: [description]_`
5. **Code-only focus**: Include ONLY coding/testing tasks, exclude deployment/docs/user testing

### Example Structure (FORMAT REFERENCE ONLY)

```markdown
# Implementation Plan

- [ ] 1. Set up project foundation and infrastructure
  - Initialize project with required technology stack
  - Configure server infrastructure and request handling
  - Establish data storage and caching layer
  - Set up configuration and environment management
  - _Requirements: All requirements need foundational setup_

- [ ] 2. Build authentication and user management system
- [ ] 2.1 Implement core authentication functionality
  - Set up user data storage with validation rules
  - Implement secure authentication mechanism
  - Build user registration functionality
  - Add login and session management features
  - _Requirements: 7.1, 7.2_

- [ ] 2.2 Enable email service integration
  - Implement secure credential storage system
  - Build authentication flow for email providers
  - Create email connection validation logic
  - Develop email account management features
  - _Requirements: 5.1, 5.2, 5.4_
```

### Requirements Coverage Check
- **MANDATORY**: Ensure ALL requirements from requirements.md are covered
- Cross-reference every requirement ID with task mappings
- If gaps found: Do not generate tasks.md; return with actionable guidance to revisit requirements or design.
- No requirement should be left without corresponding tasks

### Document Generation
- Generate `.kiro/specs/[feature-name]/tasks.md` using the exact numbering format above
- **Language**: Use language from `spec.json.language` field, default to English
- **Task descriptions**: Use natural language for "what to do" (implementation details in design.md)
- Update `.kiro/specs/[feature-name]/spec.json`:
  - Set `phase: "tasks-generated"`
  - Set `tasks.generated: true`
  - If `-y` flag used: Set `requirements.approved: true` and `design.approved: true`
  - Preserve existing metadata (language, creation date, etc.)
- Use file tools only (no shell commands)

---

## INTERACTIVE APPROVAL IMPLEMENTED (Not included in document)

The following is for Coding Agent conversation only - NOT for the generated document:

## Next Phase: Implementation Ready

After generating tasks.md, review the implementation tasks:

**If tasks look good:**
Begin implementation following the generated task sequence

**If tasks need modification:**
Request changes and re-run this command after modifications

Tasks represent the final planning phase - implementation can begin once tasks are approved.

**Final approval process for implementation**:
```
📋 Tasks review completed. Ready for implementation.
📄 Generated: .kiro/specs/[feature-name]/tasks.md
✅ All phases approved. Implementation can now begin.
```

### Review Checklist (for user reference):
- [ ] Tasks are properly sized (1-3 hours each)
- [ ] All requirements are covered by tasks
- [ ] Task dependencies are correct
- [ ] Technology choices match the design
- [ ] Testing tasks are included

### Implementation Instructions
When tasks are approved, the implementation phase begins:
1. Work through tasks sequentially
2. Mark tasks as completed in tasks.md
3. Each task should produce working, tested code
4. Commit code after each major task completion

### Self-Reflection (NOT included in tasks.md)
Perform a brief internal check before finalizing tasks.md (keep to 5–7 sentences; do not output this section):
- Coverage: Are all requirements mapped to tasks without gaps?
- Scope: Does the plan match classification guidelines, removing non-applicable task groups and duplicates?
- Order: Do dependencies flow naturally with early validation of core paths?
- Risk: Are major risks (integration, migration, security) addressed by concrete tasks?
- Testing: Are smoke/contract/integration tests placed early where beneficial?
- Done criteria: Do subtasks imply clear completion outcomes?
- Consistency: Are language, tone, and the two-level sequential numbering consistent?