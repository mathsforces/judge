export enum SubmissionStatus {
  PENDING,
  JUDGING,
  COMPLETED,
}

export enum SubmissionResult {
  PASS,
  FAILED,
}

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
}