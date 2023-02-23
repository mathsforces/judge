import * as dotenv from "dotenv";
import { exec, spawn } from "node:child_process";
import fs from 'fs';
import axios from "axios";
import { Problem, Submission } from "./types";
dotenv.config();

const SUBMISSION_ID = Number.parseInt(process.env.SUBMISSION_ID!);
const JUDGER_SECRET = process.env.JUDGER_SECRET!;
const API_ENDPOINT = process.env.API_ENDPOINT!;

async function main() {
  const submission: Submission & { problem: Problem} = (await axios.get(`${API_ENDPOINT}/${SUBMISSION_ID}`, {
    auth: {
      username: "judger",
      password: JUDGER_SECRET!,
    },
  })).data;

  // set up files
  fs.writeFileSync("check.lean", submission.problem.check)
  fs.writeFileSync("defs.lean", submission.problem.defs)
  fs.writeFileSync("submission.lean", submission.submission)

  // compile
  console.log("compile")
  exec('lean check.lean -E check.out --old-oleans --json --only-export=main', (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }
  
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
  
    console.log(`stdout:\n${stdout}`);
  });
  

  // run checks
  console.log("check")
  exec('leanchecker check.out main', (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }
  
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
  
    console.log(`stdout:\n${stdout}`);
  });

  // TODO: calculate result

  // TODO: upload result

}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
