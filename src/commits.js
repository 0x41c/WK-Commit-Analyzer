"use strict";
import { Cache } from "./storage.js";
import { checkWebkitURL, getWebkitURL, Kit, slog, vlog } from "./utilities.js";

const chunk_length = 100;
const repoInfo = {
  repo: "Webkit",
  owner: "Webkit",
};

let chunkCache = [];
let currentPage = 1;

async function getNextCommit() {
  if (chunkCache.length == 0) {
    chunkCache = (
      await Kit.repos.listCommits({
        ...repoInfo,
        per_page: chunk_length,
        page: currentPage++,
      })
    ).data;
  }

  return chunkCache.shift();
}

export async function analyzeCommits(
  startSHA,
  endSHA = "",
  endMessage = "Finished reaching end SHA",
  foundSecurityPatch,
  foundUnmarked
) {
  if (startSHA == "") return;

  let res = (
    await Kit.repos.getCommit({
      repo: "WebKit",
      owner: "WebKit",
      ref: startSHA,
    })
  ).data;

  slog(
    `Beginning backwards analysis starting at "${res.sha}" - (${res.commit.committer.date}})`
  );

  
  do {
    let truncated = res.commit.message.truncate(75).replace(/(?:\r\n|\r|\n)/g, " ")
    vlog(`Checking "${truncated}": ${res.sha} - (${res.commit.committer.date})`);
    
    const url = getWebkitURL(res.commit);
    if (url != null && (await checkWebkitURL(url[0])))
      await foundSecurityPatch(res);
    else if (url == null) await foundUnmarked(res);

    if (endSHA == "")
      Cache.tail = res.sha;

    res = await getNextCommit();

  } while (res.sha != endSHA);

  slog(endMessage);
}
