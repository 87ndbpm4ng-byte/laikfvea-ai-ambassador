export type GuideId = "emily" | "daniel";

export type Guide = {
  id: GuideId;
  initial: string;
  name: string;
  role: string;
  introduction: string;
  focusAreas: readonly string[];
  communicationStyle: string;
};
