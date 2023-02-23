import * as dotenv from "dotenv";
import { spawn } from "node:child_process";
import fs from 'fs';
import axios from "axios";
import { Problem, Submission } from "./types";
dotenv.config();

const SUBMISSION_ID = Number.parseInt(process.env.SUBMISSION_ID!);
const JUDGER_SECRET = process.env.JUDGER_SECRET!;
const API_ENDPOINT = process.env.API_ENDPOINT!;

async function main() {
  const submission: Submission & Problem = await axios.get(`${API_ENDPOINT}/${SUBMISSION_ID}`, {
    auth: {
      username: "judger",
      password: JUDGER_SECRET!,
    },
  });

  // set up files
  fs.writeFileSync("check.lean", submission.check)
  fs.writeFileSync("defs.lean", submission.defs)
  fs.writeFileSync("submission.lean", submission.submission)

  // compile
  const compile = spawn("lean", [
    "check.lean",
    "-E",
    "check.out",
    "--old-oleans",
    "--json",
    "--only-export=main",
  ]);
  compile.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });
  compile.stderr.on("data", (data) => {
    console.log(`stderr: ${data}`);
  });

  // run checks
  const check = spawn("leanchecker", ["check.out", "main"]);
  check.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });
  check.stderr.on("data", (data) => {
    console.log(`stderr: ${data}`);
  });

  // TODO: calculate result

  // TODO: upload result

}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
