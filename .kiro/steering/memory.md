---
inclusion: always
---

# Persistent Memory Guidelines (MCP Memory)

You use the connected MCP memory server to maintain continuity across development sessions in this frontend project. You must strictly follow this protocol:

## 1. Session Initialization (Mandatory Reading)
* At the beginning of **any** new conversation or task related to code, architecture, or styling, you must invoke the memory read tool (e.g., `memory_read` or the tool provided by your MCP server) to load the main memory index (`MEMORY.md`).
* Use this initial context to recall:
  * Previous design and style decisions (e.g., Tailwind, CSS Modules, color palettes, design tokens).
  * Approved or prohibited component libraries and tools.
  * The current state of the frontend task workflow.

## 2. During Development (Targeted Queries)
* If the user mentions a previous feature, a complex component, or a specific workflow not in the general index, use the search tools (e.g., `memory_search`) before assuming a new implementation.
* Strictly respect past technical decisions recorded in memory to avoid contradictions in folder structure, naming conventions, or global state choices.

## 3. Task Completion or Milestones (Updates)
* When a major task is completed, a significant architectural decision is made (e.g., "switched from Zustand to Redux Toolkit for global state"), or a meaningful working session ends, you must invoke the memory write/update tool (e.g., `memory_append` or `memory_append_session`).
* The records you save must be **concise, durable, and focused on code or workflows** (avoiding trivial conversational details):
  * *What was decided* (e.g., standardizing forms with Zod + React Hook Form).
  * *Why it was decided* (e.g., for performance and shared typed validation).
  * *Current task workflow status* (which components are finished and which remain pending).