import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DraftDocument } from "../types/import-types";

export async function writeDraft(
  draftRoot: string,
  draft: DraftDocument,
): Promise<string> {
  const resolvedRoot = path.resolve(draftRoot);
  const outputPath = path.resolve(draftRoot, draft.relativePath);
  if (
    path.basename(resolvedRoot).toLocaleLowerCase("en") !== "drafts" ||
    !outputPath.startsWith(`${resolvedRoot}${path.sep}`) ||
    path.isAbsolute(draft.relativePath)
  ) {
    throw new Error(
      'Draft output must remain inside a configured directory named "drafts".',
    );
  }
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, draft.content, { encoding: "utf8", flag: "wx" });
  return outputPath;
}
