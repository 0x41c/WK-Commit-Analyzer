"use strict";
import * as dt from "dotenv";

dt.config({ debug: true });

import { Cache } from "./storage.js";
import { analyzeCommits } from "./commits.js";
import { Kit, slog, slogcommit, titleize, _createKit } from "./utilities.js";

_createKit();

const repoDetails = {
  owner: "WebKit",
  repo: "WebKit",
};

// Currently no available command line arguments. We could change this in the future
// but it's not worthwhile at the moment. We basically just need something to point
// us in the right direction when it comes to commits with fixes for bugs that have
// some sort of security implication. We could track the patches to a blame and determine
// who is the most prone to implementing security vulnerabilites. That way we could also
// list changes they've made for research.


// Ok I lied.

if (process.argv[2] == "--dump") {

  const log = (message) => console.log(message);

  log(`Dumping security patches (most recent):`)

  let pnum = 1;

  for (const patch of Cache.security_patches) {
    log(`- Patch ${pnum} (${patch.commit.committer.date}):`);
    log(`    - Verified: ${patch.commit.verification.verified} (${patch.commit.verification.reason})`);
    log(`    - SHA: ${patch.sha}`);
    log(`    - Link: ${patch.html_url}`);
    for (const personKey of ["author", "committer"]) {
      log(`    - ${titleize(personKey)}:`);
      log(`        - Name: ${patch.commit[personKey].name}`);
      log(`        - Email: ${patch.commit[personKey].email}`);
      log(`        - Date: ${patch.commit[personKey].date}`);
    }
    log(`    - Message: ${patch.commit.message.truncate(75).replace()}`);
    pnum++;
  }

  process.exit();
}



(async () => {
  let remoteHead = (
    await Kit.repos.listCommits({ ...repoDetails, per_page: 1 })
  ).data[0];

  // TODO: Actually use this
  if (Cache.head != "") {
    if (Cache.gaps.length > 0) {
      slog(`[•] Resolving commit gaps between head and tail`);
      do {
        let gap = Cache.gaps.shift();
        await analyzeCommits(
          gap.head,
          gap.head,
          `[+] Finished resolving gaps`,
          foundSecurityPatch,
          foundUnmarked
        );
      } while (Cache.gaps.length > 0);
    }

    let currentHead = (
      await Kit.repos.getCommit({
        ...repoDetails,
        ref: Cache.head,
      })
    ).data;

    if (currentHead.commit.committer.date != remoteHead.commit.committer.date) {
      slog(
        `Remote has changes, resolving (${remoteHead.sha} -> ${currentHead.sha})`
      );
      await analyzeCommits(
        remoteHead.sha,
        currentHead.sha,
        `[+] Finished resolving remote changes`,
        foundSecurityPatch,
        foundUnmarked
      );
    }
  }

  Cache.head = remoteHead.sha;

  // Just run the analyzer, print out found commit refs.
  await analyzeCommits(
    Cache.tail != ''
      ? Cache.tail
      : (() => {
        slog(`Starting back from head...`);
        return Cache.head;
      })(),
    "",
    "wow... how long has this been running?????",
    foundSecurityPatch,
    foundUnmarked
  );
})();

async function foundSecurityPatch(patch) {
  slog(`------- Security -------`);
  slog(`Found security commit "${patch.sha}"`);
  slogcommit(patch);
  slog(`------------------------`);

  Cache.security_patches.push(patch);
}

async function foundUnmarked(patch) {
  slog(`------- Unmarked -------`);
  slog(`Found unmarked commit "${patch.sha}"`);
  slogcommit(patch);
  slog(`------------------------`);

  Cache.unmarked_patches.push(patch.sha);
}
