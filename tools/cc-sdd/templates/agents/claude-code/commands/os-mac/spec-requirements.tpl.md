---
description: Generate comprehensive requirements for a specification with research documentation
allowed-tools: Bash, Glob, Grep, LS, Read, Write, Edit, MultiEdit, Update, WebSearch, WebFetch
argument-hint: <feature-name>
---

# Requirements Generation with Research

Generate comprehensive requirements for feature: **$1** with automated research and knowledge documentation.

## ⚠️ CRITICAL: MANDATORY RESEARCH FIRST ⚠️

**YOU CANNOT PROCEED TO REQUIREMENTS GENERATION WITHOUT COMPLETING RESEARCH FIRST**

This command has been structured to FORCE research before requirements generation. You must complete ALL research steps and produce the required documentation files before you can proceed to generate requirements.

## STEP 1: FORCED RESEARCH PHASE (CANNOT BE SKIPPED)

### 1.1 Execute Mandatory WebSearch (NO EXCEPTIONS)

**STOP HERE AND PERFORM RESEARCH IMMEDIATELY - DO NOT PROCEED WITHOUT COMPLETING THIS**

Execute the following WebSearch commands RIGHT NOW - you cannot continue until you have real research data:

1. **REQUIRED WebSearch Query 1**: Search for "latest version [technology stack relevant to $1] 2025 2026 official documentation"
   - **EXECUTE NOW**: Use WebSearch tool immediately
   - **REQUIRED OUTPUT**: Save results to `{{KNOWLEDGE_DIR}}/research-latest-versions-001.md`

2. **REQUIRED WebSearch Query 2**: Search for "[feature type for $1] best practices implementation examples GitHub"
   - **EXECUTE NOW**: Use WebSearch tool immediately  
   - **REQUIRED OUTPUT**: Save results to `{{KNOWLEDGE_DIR}}/research-best-practices-001.md`

3. **REQUIRED WebSearch Query 3**: Search for "[feature name $1] implementation challenges common issues Stack Overflow"
   - **EXECUTE NOW**: Use WebSearch tool immediately
   - **REQUIRED OUTPUT**: Save results to `{{KNOWLEDGE_DIR}}/research-challenges-001.md`

### 1.2 Create Research Documentation (MANDATORY OUTPUT)

**YOU MUST CREATE THESE FILES - REQUIREMENTS GENERATION DEPENDS ON THEM**

For EACH WebSearch result, create documentation using this EXACT format:

### 1.2 Knowledge Documentation Format
For each research finding, create structured documentation:

```markdown
# Research: {Topic} - {Date}

## Source
- **URL**: [source URL]
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

- [ ] ✅ Executed WebSearch Query 1 and saved results
- [ ] ✅ Executed WebSearch Query 2 and saved results  
- [ ] ✅ Executed WebSearch Query 3 and saved results
- [ ] ✅ Created research documentation files in `{{KNOWLEDGE_DIR}}/`
- [ ] ✅ Have real web research data (not assumptions)

**IF ANY CHECKBOX IS EMPTY, STOP AND GO BACK TO STEP 1**

## STEP 3: CONTEXT LOADING (ONLY AFTER RESEARCH COMPLETED)

### Load Research-Based Context
**FIRST**: Read and incorporate your research findings:
- **REQUIRED**: Read `{{KNOWLEDGE_DIR}}/research-latest-versions-001.md`
- **REQUIRED**: Read `{{KNOWLEDGE_DIR}}/research-best-practices-001.md`  
- **REQUIRED**: Read `{{KNOWLEDGE_DIR}}/research-challenges-001.md`

### Load Project Context
- Architecture context: @{{KIRO_DIR}}/steering/structure.md
- Technical constraints: @{{KIRO_DIR}}/steering/tech.md
- Product context: @{{KIRO_DIR}}/steering/product.md
- Custom steering: Load all "Always" mode custom steering files from {{KIRO_DIR}}/steering/

### Load Existing Spec Context
- Current spec directory: !`ls -la {{KIRO_DIR}}/specs/$1/`
- Current requirements: `{{KIRO_DIR}}/specs/$1/requirements.md`
- Spec metadata: `{{KIRO_DIR}}/specs/$1/spec.json`

## STEP 4: REQUIREMENTS GENERATION (RESEARCH-INFORMED)

### 1. Read Existing Requirements Template
Read the existing requirements.md file created by spec-init to extract the project description.

### 4.2 Generate Research-Based Requirements

**CRITICAL**: Base ALL requirements on your completed research findings.

1. **Incorporate Latest Technology**: Use version information and capabilities from your research
2. **Apply Best Practices**: Implement patterns and approaches found in your research
3. **Address Known Challenges**: Include requirements that handle issues discovered in research
4. **Reference Research**: Each requirement section should reference relevant research findings

Generate an initial set of requirements in EARS format that is INFORMED BY YOUR RESEARCH, then iterate with the user to refine them until they are complete and accurate.

### Requirements Generation Guidelines
1. **Focus on Core Functionality**: Start with the essential features from the user's idea
2. **Use EARS Format**: All acceptance criteria must use proper EARS syntax
3. **No Sequential Questions**: Generate initial version first, then iterate based on user feedback
4. **Keep It Manageable**: Create a solid foundation that can be expanded through user review
5. **Choose an appropriate subject**: For software projects, use the concrete system/service name (e.g., "Checkout Service") instead of a generic subject. For non-software, choose a responsible subject (e.g., process/workflow, team/role, artifact/document, campaign, protocol).

### 3. EARS Format Requirements

**EARS (Easy Approach to Requirements Syntax)** is the recommended format for acceptance criteria:

**Primary EARS Patterns:**
- WHEN [event/condition] THEN [system/subject] SHALL [response]
- IF [precondition/state] THEN [system/subject] SHALL [response]
- WHILE [ongoing condition] THE [system/subject] SHALL [continuous behavior]
- WHERE [location/context/trigger] THE [system/subject] SHALL [contextual behavior]

**Combined Patterns:**
- WHEN [event] AND [additional condition] THEN [system/subject] SHALL [response]
- IF [condition] AND [additional condition] THEN [system/subject] SHALL [response]

### 4. Requirements Document Structure
Update requirements.md with complete content in the language specified in spec.json (check `{{KIRO_DIR}}/specs/$1/spec.json` for "language" field):

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

### 5. Update Metadata
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

### 6. Document Generation Only
Generate the requirements document content ONLY. Do not include any review or approval instructions in the actual document file.

---

## Next Phase: Interactive Approval

After generating requirements.md, review the requirements and choose:

**If requirements look good:**
Run `/kiro:spec-design $1 -y` to proceed to design phase

**If requirements need modification:**
Request changes, then re-run this command after modifications

The `-y` flag auto-approves requirements and generates design directly, streamlining the workflow while maintaining review enforcement.

## EXECUTION INSTRUCTIONS

**MANDATORY EXECUTION ORDER** (Cannot be changed):

1. **RESEARCH FIRST** - Execute ALL WebSearch queries and create documentation files
2. **VALIDATE RESEARCH** - Confirm you have real web data, not assumptions
3. **LOAD CONTEXTS** - Read research files and project contexts
4. **GENERATE REQUIREMENTS** - Create requirements based on research findings
5. **UPDATE METADATA** - Update spec.json upon completion

**REQUIREMENTS MUST INCLUDE**:
- Latest technology versions from research
- Best practices from research
- Solutions to challenges found in research
- References to research documents
- EARS format compliance
- Testable acceptance criteria

**FAILURE TO COMPLETE RESEARCH FIRST WILL RESULT IN INCOMPLETE/OUTDATED REQUIREMENTS**

**Remember: The quality of your requirements depends entirely on the quality of your research. Poor research = poor requirements. Thorough web research = excellent, up-to-date requirements.**
