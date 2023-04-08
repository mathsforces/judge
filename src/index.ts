import * as dotenv from "dotenv";
import { exec } from "node:child_process";
import fs from "fs";
import axios from "axios";
import { LeanOutput, Problem, Submission, SubmissionResult } from "./types";
dotenv.config();

// const SUBMISSION_ID = Number.parseInt(process.env.SUBMISSION_ID!);
const JUDGER_SECRET = process.env.JUDGER_SECRET!;
const API_ENDPOINT = process.env.API_ENDPOINT!;
const AXIOMS = [
  "axiom propext : Π {a b : Prop}, (a <-> b) -> a = b",
  "axiom classical.choice : Π {α : Sort u}, nonempty α -> α",
  "axiom quot.sound : Π {α : Sort u}, Π {r : α -> α -> Prop}, Π {a b : α}, r a b -> quot.mk r a = quot.mk r b",
];

async function main() {
  const submission: Submission & { problem: Problem } = (
    await axios.get(API_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${JUDGER_SECRET}`,
      },
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
        const checkSysErr = error ? error.message : "";
        const checkStdErr = stderr;
        const checkStdOut = stdout;
        const judgerComments: string[] = [];
        // calculate result
        let result: SubmissionResult = "PASS";
        if (compileSysErr !== "") {
          result = "FAILED";
          judgerComments.push("compile system error");
        }
        if (compileStdErr !== "") {
          result = "FAILED";
          judgerComments.push("received compile stderr");
        }
        compileStdOut.split("\n").forEach((line) => {
          if (line === "") {
            return;
          }
          const output: LeanOutput = JSON.parse(line);
          if (output.severity === "error" || output.severity === "warning") {
            result = "FAILED";
            judgerComments.push("received warning or error messages from lean");
          }
        });
        if (checkSysErr !== "") {
          result = "FAILED";
          judgerComments.push("check system error");
        }
        if (checkStdErr !== "") {
          result = "FAILED";
          judgerComments.push("received checker stderr");
        }
        const outputs = checkStdOut.split("\n");
        if (outputs.length < 3) {
          result = "FAILED";
          judgerComments.push(
            "checker should output at least one line of output"
          );
        } else {
          outputs.slice(0, -3).forEach((line) => {
            if (!AXIOMS.includes(line)) {
              result = "FAILED";
              judgerComments.push("checker reports extra axioms");
              return;
            }
          });
        }
        const END_TIME = new Date();
        const judgerComment = judgerComments.join("\n");
        // upload result
        axios.post(
          `${API_ENDPOINT}/${submission.id}`,
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
            headers: {
              Authorization: `Bearer ${JUDGER_SECRET}`,
            },
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
