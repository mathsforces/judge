enum SubmissionStatus {
  PENDING,
  JUDGING,
  COMPLETED,
}

enum SubmissionResult {
  PASS,
  FAILED,
}

type Submission = {
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

type Problem = {
  defs: string;
  check: string;
}