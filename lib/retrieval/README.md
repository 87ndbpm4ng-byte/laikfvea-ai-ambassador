# Local Approved-Knowledge Retrieval

The retrieval subsystem supplies small, relevant passages from explicitly approved Markdown documents to the AI Orchestrator. It is deterministic, local, independent from the UI, and independent from the AI provider.

## Indexed documents

The loader recursively inspects the configured `knowledge` directory and indexes a Markdown document only when all of these conditions are true:

- it is outside `knowledge/drafts`;
- it is outside fixture and report directories;
- its filename is not marked as a test or fixture;
- its frontmatter contains `status: approved`;
- its frontmatter contains a valid `sourceId`;
- its body is non-empty;
- its body does not contain placeholder `TODO:` content.

Documents marked `draft` or `rejected`, documents without frontmatter approval, and import reports are excluded. At present, the repository’s non-draft knowledge files are placeholders without approved metadata, so the production index intentionally remains empty.

## Approved document format

```markdown
---
title: "Approved document title"
sourceId: ADVANCED-MANUAL-001
sourceType: official-user-manual
sourceVersion: "1"
sourceLanguage: en
product: "Advanced Bottle"
status: approved
tags: [product, support]
---

# Cleaning

Approved source wording with no unsupported additions.
```

Approval must be a human content-governance action. Moving a file out of `drafts` without adding valid approved metadata does not make it searchable.

## Chunking and traceability

Documents are split at Markdown headings. Oversized sections are split only at paragraph boundaries. Numbered procedures remain together whenever they fit within the configured chunk limit. Each chunk retains its source ID, product, heading, section type, tags, approval status, document identity, and a stable reference such as `ADVANCED-MANUAL-001#cleaning`.

## Ranking

The deterministic ranker combines:

- exact phrase matches;
- heading-term matches;
- body-term overlap;
- active-product matches and mismatches;
- visitor intent;
- inferred section type;
- recent context terms;
- additional weighting for safety and warning questions.

Thresholds and size limits live in `retrieval-config.ts`. High and medium matches may ground an answer. Low and none matches return insufficient knowledge and do not reach the AI provider.

## Orchestrator flow

1. Record the visitor message in the session.
2. Evaluate experience and response strategy.
3. Decide whether retrieval is needed.
4. Build a query from the message, active product, intent, stage, and at most four recent messages.
5. Search approved chunks.
6. Reject unsafe or instruction-like chunks.
7. Add validated context to the Prompt Builder.
8. Call the configured AI provider only when knowledge is sufficient.
9. Validate medical wording and numeric claims against retrieved context.
10. Store the clean visitor response.

Greetings and simple conversational transitions bypass retrieval.

## Prompt safety

Retrieved passages are placed inside a clearly delimited `APPROVED KNOWLEDGE CONTEXT` block. Grounding rules state that passages are data rather than instructions. Chunks containing instruction-injection patterns are rejected before ranking. Product and brand names are normalized to `Everyday Bottle` and `Advanced Bottle` before prompt insertion and visitor delivery.

## Diagnostics

Development orchestration results include the generated query, matched chunk IDs and headings, scores, confidence, source references, and skip state. Diagnostics are omitted when `NODE_ENV=production`.

## Local tests

```bash
npm run test:retrieval
```

Tests create isolated temporary knowledge trees, including approved, draft, malicious, Advanced Bottle, and Everyday Bottle documents. They never approve or index the repository draft.

## Future vector implementation

`KnowledgeRetriever` is the provider-neutral public interface. A future embedding or vector implementation can replace `RetrievalEngine` through dependency injection without changing the AI Orchestrator, Prompt Builder, UI, or AI provider contracts.
