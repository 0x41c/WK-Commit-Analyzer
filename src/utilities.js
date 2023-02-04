"use strict";

import fetch from "node-fetch";
import { Octokit } from "@octokit/rest";

export function getWebkitURL(commit) {
  let matches = commit.message.match(
    /(http[s?]:\/\/bugs.webkit.org\/show_bug\.cgi\?id=(\d*)\b)/m
  );

  if (matches != null) return matches;
}

export async function checkWebkitURL(url) {
  let response = await fetch(url);
  let body = (await response.text()).trim().slice(0, 70).replace(/(?:\r\n|\r|\n)/g, ' ');

  //slog(`- Body (${url}): ${body}`);

  if (!response.ok) 
    throw new Error("[-] Couldn't fetch webkit content!");

  if (body.includes("Bug Access Denied")) return true;
  return false;
}

export let Kit = null;
export function _createKit() {
  Kit = new Octokit({
    auth: process.env.GITHUB_PERSONAL_API_KEY,
    throttle: {
      onRateLimit: (retryAfter, options, octokit) => {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );

        console.log(`Retrying after ${retryAfter} seconds!`);

        // Never give up... a wise man once said.
        return true;
      },
      onSecondaryRateLimit: (retryAfter, options, octokit) => {
        // does not retry, only logs a warning
        octokit.log.warn(
          `Secondary quota detected for request ${options.method} ${options.url}`
        );
      },
    },
  });
}

export const slog = (message) => console.log(`Status: ${message}`);
export const wlog = (message) => console.warning(`Warning: ${message}`);
export const vlog = (message) =>
  process.env.VERBOSE && console.log(`Verbose: ${message}`);

String.prototype.truncate = function (length) {
  return `${this.substring(0, length)}...`;
};

export function slogcommit(commit) {
  slog(`- Link: ${commit.html_url}`);
  slog(
    `- Author: ${commit.commit.author.name} (@${commit.commit.author.email}) - ${commit.commit.author.date}`
  );
  if (commit.commit.author.name != commit.commit.committer.name)
    slog(
      `- Committer: ${commit.commit.committer.name} (${commit.commit.committer.email}) - ${commit.commit.committer.date}`
    );
  slog(`- Message: ${commit.commit.message.truncate(35)}`);
}


// Code from due to benchmarking https://stackoverflow.com/a/6475125/13343654 
export function titleize(input) {
  let upper = true
  let newStr = ""
  for (let i = 0, l = input.length; i < l; i++) {
      // Note that you can also check for all kinds of spaces  with
      // str[i].match(/\s/)
      if (input[i] == " ") {
          upper = true
          newStr += input[i]
          continue
      }
      newStr += upper ? input[i].toUpperCase() : input[i].toLowerCase()
      upper = false
  }
  return newStr
}