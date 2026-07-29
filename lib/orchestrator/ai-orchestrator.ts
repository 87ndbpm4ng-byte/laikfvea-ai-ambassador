import "server-only";

import {
  OrchestratorPipeline,
} from "@/lib/orchestrator/orchestrator-pipeline";
import type {
  OrchestrateMessageInput,
  OrchestratorResult,
} from "@/lib/orchestrator/orchestrator-types";

/**
 * Single server-side entry point for text conversation orchestration.
 *
 * AIOrchestrator delegates the complete workflow to OrchestratorPipeline and
 * contains no session, experience, response, prompt, or provider business
 * logic.
 */
export class AIOrchestrator {
  constructor(private readonly pipeline: OrchestratorPipeline) {}

  handleMessage(
    input: OrchestrateMessageInput,
  ): Promise<OrchestratorResult> {
    return this.pipeline.execute(input);
  }
}
