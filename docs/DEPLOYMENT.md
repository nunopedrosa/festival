> Deployment command updated 2026-11-01: see [SHARED_DEPLOYMENT.md](SHARED_DEPLOYMENT.md). Shared core/profile supersedes older commands and broad deletion. Keep the app-specific hosting, private paths and release requirements below.

# Deploy Festival to DreamHost

Canonical source: https://github.com/nunopedrosa/festival . This is a public repository; use its HTTPS clone URL. Deployment runs from an SSH shell on the DreamHost server, under the user who owns the website directory.

The app is static. The DreamHost server needs Bash and Git plus standard Unix utilities; it does **not** need Node, npm, Python, a database, GitHub tokens or a GitHub SSH key. Python is used only for optional development/test/data-maintenance tasks, never by the deployment script.

## 1. Commit the ready-to-run source

Add the app source to the GitHub repository, including:

- Root runtime files, assets/, vendor/ and docs/DATA_SOURCES.md.
- `deploy-files.txt`, generated and committed by `npm run build`.
- `scripts/deploy.sh` and `hosting/dreamhost.htaccess`.
- Normal development documentation and optional scripts/tests.

Do not commit node_modules/, dist/, credentials or local notes. The prepared root files are already built. Run `npm run build` on the development computer after runtime/data changes and commit the generated files and deployment manifest together. The server never rebuilds them.

## 2. Prepare DreamHost

Use the site's DreamHost **shell user** and enable HTTPS for the site's configured hostname. Use the actual existing document root shown in the DreamHost panel; the examples below intentionally use placeholders because a hostname/user was not supplied.

Over SSH, clone **outside** the public document root:

```sh
mkdir -p "$HOME/repos"
git clone https://github.com/nunopedrosa/festival.git "$HOME/repos/festival"
cd "$HOME/repos/festival"
```

The clone automatically tracks the repository's default branch. Keep this server checkout clean and pull-only; develop/commit/push from your development computer.

The public website directory must already exist and belong to the shell user's writable hosting account. Do not clone the repository directly into it: that would expose development files and Git metadata.

## 3. Deploy / update

From that checkout, run:

```sh
bash scripts/deploy.sh /home/YOUR_SHELL_USER/YOUR_WEBSITE_DIRECTORY
```

Replace the last argument with the **absolute path to the existing DreamHost web directory**. It can be a domain's document root or an existing app subdirectory. The script also works when invoked by its absolute pathname from a different working directory.

Use the same command for every subsequent update. It:

1. Resolves source/destination paths and refuses overlapping directories or a checkout inside the web directory.
2. Locks the checkout and destination against concurrent deployments.
3. Requires a clean tracked branch with no local/untracked work, fetches its configured upstream, rejects local-only/divergent commits, then runs `git pull --ff-only`.
4. Reads committed `deploy-files.txt` and checks every entry against the app-specific public allowlist. Refuses missing/uncommitted files and symlinked source/destination files or parent directories.
5. Stages all public bytes on the destination filesystem and sets file permissions to 0644 before publishing.
6. Publishes assets first, HTML next, and version/precache/service-worker entry files last. Each file replacement uses an atomic rename; **the release as a whole is not atomic**. A request during publication can see a mixed release. Prefer a quiet maintenance moment for updates.
7. Installs the supplied `.htaccess` only if none exists. An existing file is preserved; a concurrent creation is also protected from overwrite.
8. Prints the deployed commit and public-file count, then removes its own staging directory and locks.

No destination files are deleted. Previously deployed files no longer referenced by the app may remain and can be reviewed separately. A failed preflight/staging leaves public app files unchanged; the Git checkout may already have fast-forwarded. A failure after publication starts can leave some files updated; the script reports this and exits nonzero. Fix the failure and rerun. There is no automatic rollback or backup of the old website.

Do not edit the server checkout. If it contains work, the script stops; preserve/commit/push or move that work yourself. It never resets, stashes, cleans or pushes Git state.

## What gets published

`deploy-files.txt` is the committed list generated from the complete offline asset list plus `sw.js`, `precache.js` and `LICENSE`. Allowed entries are limited to the actual root runtime files, app artwork/flags, bundled vendor data/licenses and `docs/DATA_SOURCES.md`. The deployment script itself checks these categories; adding a development file to the manifest cannot publish it.

`.git/`, node_modules/, dist/, scripts/, tests/, package files, AGENTS.md and development documents are not published. `hosting/dreamhost.htaccess` is copied under the special first-install rule above, not exposed as a hosting/ directory.

## Apache cache headers

`hosting/dreamhost.htaccess` supplies index.html, SVG/manifest MIME types, disabled directory listing and `Cache-Control: no-cache, must-revalidate` for app assets. These are network-cache rules: the service worker independently keeps its complete offline release.

If the hosting directory already has `.htaccess`, review and merge the template manually, retaining its existing rewrite/access rules. This matters when a parent folder/site has aggressive cache settings. The deploy script never overwrites those rules or changes your DreamHost panel settings.

References:

- DreamHost shell/Git setup: https://help.dreamhost.com/hc/en-us/articles/216445317-Set-up-a-Git-repository
- DreamHost headers: https://help.dreamhost.com/hc/en-us/articles/215747598-Setting-headers-with-an-htaccess-file
- DreamHost cache control: https://help.dreamhost.com/hc/en-us/articles/216363157-Cache-a-website-with-an-htaccess-file

## After deployment

Open the actual HTTPS website and check the version, country/flag picker and holiday details. Confirm the offline-ready status, then test an offline reload. For an installed older version: Settings → Check for updates → Update app. Deployment never clears local user preferences.

A successful script exit verifies the local file publication only. It does not prove that DNS/HTTPS, Apache configuration, HTTP response headers or the installed iPhone PWA are functioning. No actual DreamHost deployment was performed while preparing this script.

If a process is killed without cleanup (for example SIGKILL), a lock can remain. Confirm that no deployment is running before removing the empty `festival-deploy.lock` in the checkout's Git directory or `.festival-deploy.lock` in the destination using `rmdir`. Never remove an active lock.

## Developer validation

```sh
bash -n scripts/deploy.sh
python3 scripts/test-deploy.py
```

The 17 regressions create temporary local Git remotes, checkouts and web directories. They do not contact GitHub, require credentials or touch a real hosting directory. They test publication/permissions, fast-forward pull, preservation of existing hosting files, dirty/untracked work, detached HEAD, no upstream, local-only/divergent commits, overlapping paths, missing files, source/target symlinks, unsafe manifests and concurrent locks.
