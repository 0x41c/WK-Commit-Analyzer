# WebKit Commit Analyzer

This project is a simple commit checker that looks for bug IDs in the webkit commit messages. After finding them, it will look them up on <https://bugs.webkit.org> and determine the access level for the bug. Bugs that we don't have access to have security implications which are exactly what we're looking for.

TLDR: It tracks security bugs in webkit.

To have the script run properly, create a `.env` file at the base of the repository. After creating a personal-access-token from your github settings, add it to the `.env` file like this:

```env
GITHUB_PERSONAL_API_KEY="github_THIS_IS_NOThE5Nyd_4141414141_g2Ah9AXcw_YOUR_TOKEN_iviL5YYBXGOUySSEdJ5"
```

After that has been set up, you should be able to run the program after installing dependancies: `node .`

To dump found bugs, run the project with this command: `node . --dump`

## Disclaimer

I didn't add a help, or other commands because it's not a priority. If this sees some traffic, make an issue, or a PR and I'll move it up my schedule.

Finally (this is an important one), I don't claim responsibility for any security vulnerabilities/patches found with this tool; Neither do I claim responsibility for your actions with this tool. Using this tool on more than one computer can cause DDOS on webkit bugzilla servers, and that is illegal in most areas. Use this project wisely and responsibly.
