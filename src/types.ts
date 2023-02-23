export type SubmissionStatus = "PENDING" | "JUDGING" | "COMPLETED";

export type SubmissionResult = "PASS" | "FAILED";

export type Submission = {
  id: number;
  createdAt: string;
  judgingStartedAt: string | null;
  judgingFinishedAt: string | null;
  status: SubmissionStatus;
  submission: string;
  stdout: string | null;
  stderr: string | null;
  result: SubmissionResult | null;
  userId: string;
  problemId: number;
};

export type Problem = {
  defs: string;
  check: string;
};

export type Severity = "info" | "warning" | "error"

export type LeanOutput = {
  caption: string;
  file_name: string;
  pos_col: number;
  pos_line: number;
  severity: Severity;
  text: string;
};