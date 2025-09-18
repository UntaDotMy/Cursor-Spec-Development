<meta>
description: Generate comprehensive requirements for a specification with research documentation
argument-hint: [feature-name]
</meta>

<requirements_command>

  <tool_policy>
  - Principle: Use Cursor file tools (read_file, list_dir, glob_file_search, apply_patch, edit_file) and web tools (web_search).
  - Enhanced: Use web_search for research and documentation before requirements generation.
  - Self-Review: After code changes, mandatory re-read all modified files to check for mistakes.
  - Shell: Do not use shell. If a capability gap is encountered, stop and report instead of attempting a workaround.
  </tool_policy>

  <self_review_enhancement>
  
  ## Self-Review & Mistake Detection (NEW)
  
  **MANDATORY**: After any code modifications, perform systematic self-review:
  
  ### Mistake Detection Process
  1. **Re-read ALL modified files** using read_file tool
  2. **Check systematically** for:
     - Syntax errors and typos
     - Logic errors and integration issues  
     - Missing imports or dependencies
     - Performance and security issues
  3. **Document mistakes** in `{{KNOWLEDGE_DIR}}/errors/mistake-{description}-{number}.md`
  4. **Self-correction loop**: Fix mistakes immediately and re-read until clean
  5. **Only proceed to testing** after self-review confirms no obvious mistakes
  
  ### Mistake Documentation
  ```markdown
  # Mistake: {Type/Description}
  
  ## Detection Details
  - **File(s)**: [affected files]
  - **Mistake Type**: [syntax/logic/integration/performance]  
  - **Context**: [implementation context]
  
  ## Correction Applied  
  - **Fix**: [detailed correction]
  - **Verification**: [how fix was verified]
  ```
  
  </self_review_enhancement>

  <research_phase>
  
  ## ⚠️ CRITICAL: MANDATORY RESEARCH FIRST ⚠️
  
  **YOU CANNOT PROCEED TO REQUIREMENTS GENERATION WITHOUT COMPLETING RESEARCH FIRST**

  This command has been structured to FORCE research before requirements generation. You must complete ALL research steps and produce the required documentation files before you can proceed to generate requirements.

  ## STEP 1: FORCED RESEARCH PHASE (CANNOT BE SKIPPED)

  ### 1.1 Execute Mandatory Web Search (NO EXCEPTIONS)

  **STOP HERE AND PERFORM RESEARCH IMMEDIATELY - DO NOT PROCEED WITHOUT COMPLETING THIS**

  Execute the following web_search commands RIGHT NOW - you cannot continue until you have real research data:

  1. **REQUIRED Web Search Query 1**: Search for "latest version [technology stack relevant to feature] 2025 2026 official documentation"
     - **EXECUTE NOW**: Use web_search tool immediately
     - **REQUIRED OUTPUT**: Save results to `{{KNOWLEDGE_DIR}}/research-latest-versions-001.md`

  2. **REQUIRED Web Search Query 2**: Search for "[feature type] best practices implementation examples GitHub"
     - **EXECUTE NOW**: Use web_search tool immediately  
     - **REQUIRED OUTPUT**: Save results to `{{KNOWLEDGE_DIR}}/research-best-practices-001.md`

  3. **REQUIRED Web Search Query 3**: Search for "[feature name] implementation challenges common issues Stack Overflow"
     - **EXECUTE NOW**: Use web_search tool immediately
     - **REQUIRED OUTPUT**: Save results to `{{KNOWLEDGE_DIR}}/research-challenges-001.md`

  ### 1.2 Create Research Documentation (MANDATORY OUTPUT)

  **YOU MUST CREATE THESE FILES - REQUIREMENTS GENERATION DEPENDS ON THEM**

  For EACH web_search result, create documentation using this EXACT format:
  
  ### Knowledge Documentation Format
  For each research finding, create structured documentation:
  
  ```markdown
  # Research: {Topic} - {Date}
  
  ## Source
  - **Search Query**: [exact search query used]
  - **Date Retrieved**: [current date]
  
  ## Key Findings
  - **Latest Version**: [version info]
  - **Major Features**: [list key features]
  - **Breaking Changes**: [recent breaking changes]
  - **Best Practices**: [recommended approaches]
  
  ## Implementation Relevance
  - **Applicable to Project**: [yes/no with reasoning]
  - **Integration Notes**: [how it affects our requirements]
  - **Constraints/Limitations**: [any limitations to consider]
  
  ## Next Steps
  - **Further Research Needed**: [if any]
  - **Requirements Impact**: [how this affects requirements]
  ```
  
  
  ## ✅ STEP 2: VALIDATION CHECKPOINT

  **BEFORE PROCEEDING TO REQUIREMENTS, VERIFY YOU HAVE COMPLETED:**

  - [ ] ✅ Executed Web Search Query 1 and saved results
  - [ ] ✅ Executed Web Search Query 2 and saved results  
  - [ ] ✅ Executed Web Search Query 3 and saved results
  - [ ] ✅ Created research documentation files in `{{KNOWLEDGE_DIR}}/`
  - [ ] ✅ Have real web research data (not assumptions)

  **IF ANY CHECKBOX IS EMPTY, STOP AND GO BACK TO STEP 1**

  ## STEP 3: CONTEXT LOADING (ONLY AFTER RESEARCH COMPLETED)

  ### Load Research-Based Context
  **FIRST**: Read and incorporate your research findings:
  - **REQUIRED**: Read `{{KNOWLEDGE_DIR}}/research-latest-versions-001.md`
  - **REQUIRED**: Read `{{KNOWLEDGE_DIR}}/research-best-practices-001.md`  
  - **REQUIRED**: Read `{{KNOWLEDGE_DIR}}/research-challenges-001.md`
  
  </research_phase>

  <requirements_generation>

    <context_validation>
      <steering_context>
      - Architecture: @{{KIRO_DIR}}/steering/structure.md
      - Technical constraints: @{{KIRO_DIR}}/steering/tech.md
      - Product context: @{{KIRO_DIR}}/steering/product.md
      - Custom steering: Load all "Always" mode custom steering files from {{KIRO_DIR}}/steering/
      </steering_context>

      <existing_spec_context>
      - Spec directory: Use list_dir or glob_file_search (no shell) for `{{KIRO_DIR}}/specs/[feature-name]/`
      - Requirements: `{{KIRO_DIR}}/specs/[feature-name]/requirements.md`
      - Spec metadata: `{{KIRO_DIR}}/specs/[feature-name]/spec.json`
      </existing_spec_context>
    </context_validation>

    <language_policy>
    - Purpose: `spec.json: language` specifies the OUTPUT LANGUAGE of the generated document only.
    - Validation: Read and parse JSON; ensure `language` is a non-empty string (e.g., `ja`, `en`).
    - Behavior:
      - If valid: Generate all document text strictly in `language`.
      - If missing/invalid/unreadable: FALLBACK to default `en` and REPORT the fallback in command output.
    - Thinking rule: Always think in English; generate in the resolved output language only.
    </language_policy>

    <task>
      <step id="1">Read existing requirements.md created by spec-init to extract the project description.</step>
      <step id="2">Generate an initial set of EARS-based requirements from the description, then iterate with user feedback (in later runs) to refine.</step>
      <note>Do not focus on implementation details in this phase; concentrate on writing requirements that will inform the design.</note>
    </task>

    <guidelines>
    1. Focus on core functionality from the user's idea.
    2. Use EARS format for all acceptance criteria.
    3. Avoid sequential questions on first pass; propose an initial version.
    4. Keep scope manageable; enable expansion through review.
    5. Choose an appropriate subject: For software projects, use the concrete system/service name (e.g., "Checkout Service"). For non-software, select a responsible subject (e.g., process/workflow, team/role, artifact/document, campaign, protocol).
    </guidelines>

    <ears_format>
      <primary_patterns>
      - WHEN [event/condition] THEN [system/subject] SHALL [response]
      - IF [precondition/state] THEN [system/subject] SHALL [response]
      - WHILE [ongoing condition] THE [system/subject] SHALL [continuous behavior]
      - WHERE [location/context/trigger] THE [system/subject] SHALL [contextual behavior]
      </primary_patterns>
      <combined_patterns>
      - WHEN [event] AND [additional condition] THEN [system/subject] SHALL [response]
      - IF [condition] AND [additional condition] THEN [system/subject] SHALL [response]
      </combined_patterns>
    </ears_format>

    <document_structure>
Update requirements.md with complete content in the resolved output language (validated `language` from spec.json or fallback `en`).

```markdown
# Requirements Document

## Introduction
[Clear introduction summarizing the feature and its business value]

## Requirements

### Requirement 1: [Major Objective Area]
**Objective:** As a [role/stakeholder], I want [feature/capability/outcome], so that [benefit]

#### Acceptance Criteria
This section should have EARS requirements

1. WHEN [event] THEN [system/subject] SHALL [response]
2. IF [precondition] THEN [system/subject] SHALL [response]
3. WHILE [ongoing condition] THE [system/subject] SHALL [continuous behavior]
4. WHERE [location/context/trigger] THE [system/subject] SHALL [contextual behavior]

### Requirement 2: [Next Major Objective Area]
**Objective:** As a [role/stakeholder], I want [feature/capability/outcome], so that [benefit]

1. WHEN [event] THEN [system/subject] SHALL [response]
2. WHEN [event] AND [condition] THEN [system/subject] SHALL [response]

### Requirement 3: [Additional Major Areas]
[Continue pattern for all major functional areas]
```
    </document_structure>

    <metadata_update>
Update spec.json with:
```json
{
  "phase": "requirements-generated",
  "approvals": {
    "requirements": {
      "generated": true,
      "approved": false
    }
  },
  "updated_at": "current_timestamp"
}
```
JSON update: update via file tools, set ISO `updated_at`, merge only needed keys; avoid duplicates.
    </metadata_update>

    <document_generation_only>
    Generate the requirements document content ONLY. Do not include any review or approval instructions in the actual document file.
    </document_generation_only>

  </requirements_generation>

  <ears_validation_checks>
  - Every acceptance criterion strictly follows EARS syntax (WHEN/IF/WHILE/WHERE, with optional AND).
  - Each criterion is observable and yields a single, testable outcome.
  - No ambiguous or subjective wording (e.g., quickly, appropriately); quantify where necessary.
  - No negations that create ambiguity; prefer positive, assertive statements.
  - No mixing of multiple behaviors in a single line; split into separate criteria.
  - Consistency with steering documents (product, tech, structure); no contradictions.
  - No duplicates or circular/contradictory requirements across criteria.
  </ears_validation_checks>

  <next_phase>
  After generating requirements.md, review the requirements and choose:

  - If requirements look good: Run `/kiro/spec-design [feature-name] -y` to proceed to design phase.
  - If requirements need modification: Request changes, then re-run this command after modifications.

  The `-y` flag auto-approves requirements and generates design directly, streamlining the workflow while maintaining review enforcement.
  </next_phase>

  <instructions>
  1. Validate spec.json `language` — if valid, generate strictly in that language; if missing/invalid, fall back to `en` and report the fallback.
  2. Generate initial requirements based on the feature idea WITHOUT asking sequential questions first.
  3. Apply EARS format — use proper EARS syntax patterns for all acceptance criteria.
  4. Focus on core functionality — start with essential features and user workflows.
  5. Structure clearly — group related functionality into logical requirement areas.
  6. Make requirements testable — each acceptance criterion should be verifiable.
  7. Update tracking metadata upon completion.
  </instructions>

  <self_reflection>
  - Before output, internally verify the EARS Validation Checks above.
  - If any check fails, silently revise and regenerate up to two times.
  - Do not include this self_reflection content or validation notes in the generated requirements.md.
  </self_reflection>

</requirements_command>
