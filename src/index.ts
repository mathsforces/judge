import * as dotenv from "dotenv";
import { exec } from "node:child_process";
import fs from "fs";
import axios from "axios";
import { LeanOutput, Problem, Submission, SubmissionResult } from "./types";
dotenv.config();

const SUBMISSION_ID = Number.parseInt(process.env.SUBMISSION_ID!);
const JUDGER_SECRET = process.env.JUDGER_SECRET!;
const API_ENDPOINT = `${process.env.API_ENDPOINT!}/${SUBMISSION_ID}`;
const AXIOMS = [
  "axiom propext : Π {a b : Prop}, (a <-> b) -> a = b",
  "axiom classical.choice : Π {α : Sort u}, nonempty α -> α",
  "axiom quot.sound : Π {α : Sort u}, Π {r : α -> α -> Prop}, Π {a b : α}, r a b -> quot.mk r a = quot.mk r b",
];
const AUTH = {
  username: "judger",
  password: JUDGER_SECRET,
};
async function main() {
  const submission: Submission & { problem: Problem } = (
    await axios.get(API_ENDPOINT, {
      auth: AUTH,
    })
  ).data;
  const START_TIME = new Date();
  // set up files
  fs.writeFileSync("check.lean", submission.problem.check);
  fs.writeFileSync("defs.lean", submission.problem.defs);
  fs.writeFileSync("submission.lean", submission.submission);

  console.log("Compiling");
  exec(
    "lean check.lean -E check.out --old-oleans --json --only-export=main",
    (error, stdout, stderr) => {
      const compileSysErr = error ? error.message : "";
      const compileStdErr = stderr;
      const compileStdOut = stdout;

      console.log("Checking");
      exec("leanchecker check.out main", (error, stdout, stderr) => {
        const checkSysErr = error ? error.message : null;
        const checkStdErr = stderr;
        const checkStdOut = stdout;

        // calculate result
        let result: SubmissionResult = "PASS";
        if (compileSysErr !== "") {
          result = "FAILED";
        }
        if (compileStdErr !== "") {
          result = "FAILED";
        }
        compileStdOut.split("\n").forEach((line) => {
          if (line === "") {
            return;
          }
          const output: LeanOutput = JSON.parse(line);
          if (output.severity === 'error' || output.severity === 'warning') {
            result = "FAILED"
          }
        });
        if (checkSysErr !== "") {
          result = "FAILED";
        }
        if (checkStdErr !== "") {
          result = "FAILED";
        }
        const outputs = checkStdOut.split("\n");
        if (outputs.length === 0) {
          result = "FAILED";
        } else {
          outputs.slice(0, -1).forEach((line) => {
            if (!AXIOMS.includes(line)) {
              result = "FAILED";
              return;
            }
          });
        }
        const END_TIME = new Date();
        const judgerComment = "TODO:";
        // upload result
        axios.post(
          API_ENDPOINT,
          {
            judgingStartedAt: START_TIME,
            judgingFinishedAt: END_TIME,
            result,
            compileSysErr,
            compileStdErr,
            compileStdOut,
            checkSysErr,
            checkStdErr,
            checkStdOut,
            judgerComment,
          },
          {
            auth: AUTH,
          }
        );
      });
    }
  );
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
