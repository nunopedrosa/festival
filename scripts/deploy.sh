#!/usr/bin/env bash
# Run on DreamHost from a clean Git checkout outside the public web directory.
# All code is parsed into main before pulling, so a pulled script change applies next run.
set -Eeuo pipefail

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
usage() {
  cat <<'USAGE'
Usage: bash scripts/deploy.sh /absolute/path/to/existing/web-directory

Pull the tracked upstream branch with --ff-only, validate the committed public-file
manifest, then stage and publish static files. Run on the DreamHost server.
No build, npm, Python, secrets or hosting credentials are required.
Unrelated files and an existing .htaccess are preserved. No files are deleted.
USAGE
}
# Paths passed here are trusted roots plus already validated relative paths.
check_path() {
  local root=$1 relative=$2 kind=$3 piece current=$1
  local -a pieces
  IFS='/' read -r -a pieces <<< "$relative"
  for piece in "${pieces[@]}"; do
    current="$current/$piece"
    [[ ! -L "$current" ]] || fail "Refusing symlink: $current"
    if [[ "$current" != "$root/$relative" ]]; then
      [[ ! -e "$current" || -d "$current" ]] || fail "Parent is not a directory: $current"
    fi
  done
  if [[ "$kind" == source ]]; then
    [[ -f "$current" && -r "$current" ]] || fail "Missing/unreadable public source: $relative"
  else
    [[ ! -e "$current" || -f "$current" ]] || fail "Destination is not a regular file: $current"
  fi
}
cleanup() {
  local result=$?
  trap - EXIT
  if [[ -n "${stage:-}" && -d "$stage" ]]; then rm -rf -- "$stage"; fi
  if [[ -n "${destination_lock:-}" ]]; then rmdir -- "$destination_lock" 2>/dev/null || true; fi
  if [[ -n "${checkout_lock:-}" ]]; then rmdir -- "$checkout_lock" 2>/dev/null || true; fi
  if (( result != 0 )) && [[ "${publishing:-false}" == true ]]; then
    printf 'Publication did not finish. Some public files may have changed; fix the error and rerun.\n' >&2
  fi
  exit "$result"
}
main() {
  if [[ "${1:-}" == --help || "${1:-}" == -h ]]; then usage; return; fi
  [[ $# == 1 ]] || { usage >&2; exit 2; }
  [[ "$1" == /* ]] || fail 'The web-directory path must be absolute.'
  [[ -d "$1" && -w "$1" && -x "$1" ]] || fail 'The web directory must already exist and be writable.'
  [[ ! -L "${BASH_SOURCE[0]}" ]] || fail 'Run the real deploy script, not a symlink.'
  local source_root destination git_root git_dir branch remote upstream ahead behind
  source_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
  destination=$(cd -- "$1" && pwd -P)
  [[ "$destination" != / ]] || fail 'Refusing to publish into the filesystem root.'
  case "$destination/" in "$source_root/"*) fail 'The web directory cannot be inside the checkout.';; esac
  case "$source_root/" in "$destination/"*) fail 'Keep the checkout outside the public web directory.';; esac
  command -v git >/dev/null 2>&1 || fail 'Git is required.'
  git_root=$(git -C "$source_root" rev-parse --show-toplevel 2>/dev/null) || fail 'This folder is not a Git checkout. Clone the public repository first.'
  git_root=$(cd -- "$git_root" && pwd -P)
  [[ "$git_root" == "$source_root" ]] || fail 'The app must be at the root of its own Git checkout.'
  git_dir=$(git -C "$source_root" rev-parse --absolute-git-dir)
  checkout_lock=''
  destination_lock=''
  stage=''
  publishing=false
  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  # Only mark a lock as owned after successfully creating it.
  mkdir -- "$git_dir/festival-deploy.lock" 2>/dev/null || fail 'Another deployment holds the checkout lock. Do not remove an active lock.'
  checkout_lock="$git_dir/festival-deploy.lock"
  mkdir -- "$destination/.festival-deploy.lock" 2>/dev/null || fail 'Another deployment holds the destination lock. Do not remove an active lock.'
  destination_lock="$destination/.festival-deploy.lock"
  [[ -z "$(git -C "$source_root" status --porcelain --untracked-files=all)" ]] || fail 'The checkout contains local changes or untracked files. Commit/push or move them before deploying.'
  branch=$(git -C "$source_root" symbolic-ref --quiet --short HEAD) || fail 'Detached HEAD: check out the deployment branch first.'
  upstream=$(git -C "$source_root" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null) || fail 'The current branch must track an upstream branch.'
  remote=$(git -C "$source_root" config --get "branch.$branch.remote") || fail 'No upstream remote is configured.'
  [[ "$remote" != . ]] || fail 'The upstream must be a remote repository, not a local branch.'
  printf 'Checking upstream for %s…\n' "$branch"
  git -C "$source_root" fetch --quiet -- "$remote"
  read -r ahead behind <<< "$(git -C "$source_root" rev-list --left-right --count "HEAD...@{upstream}")"
  [[ "$ahead" == 0 ]] || fail 'The checkout has local-only/divergent commits. Push or resolve them elsewhere; nothing was published.'
  git -C "$source_root" pull --ff-only --quiet
  [[ -z "$(git -C "$source_root" status --porcelain --untracked-files=all)" ]] || fail 'The checkout changed during the pull. Nothing was published.'
  local commit manifest relative duplicate required
  commit=$(git -C "$source_root" rev-parse HEAD)
  manifest="$source_root/deploy-files.txt"
  check_path "$source_root" deploy-files.txt source
  git -C "$source_root" ls-files --error-unmatch -- deploy-files.txt >/dev/null 2>&1 || fail 'deploy-files.txt must be committed.'
  local -a files=()
  while IFS= read -r relative || [[ -n "$relative" ]]; do
    [[ -n "$relative" ]] || continue
    [[ "$relative" =~ ^[A-Za-z0-9_./-]+$ ]] || fail 'Invalid characters in the public-file manifest.'
    case "$relative" in /*|*/../*|../*|*/..|*/./*|./*|*//*|*/|.*) fail "Unsafe public path: $relative";; esac
    # App-specific public allowlist. Development files cannot be published by adding them to the manifest.
    case "$relative" in
      index.html|styles.css|app.js|icons.js|engine.js|i18n.js|manifest.webmanifest|version.json|precache.js|sw.js|LICENSE|docs/DATA_SOURCES.md) ;;
      assets/*.svg|assets/*.png|vendor/*.js|vendor/*.json|vendor/ATTRIBUTION.md|vendor/*LICENSE*.txt) ;;
      *) fail "Path is outside the public allowlist: $relative";;
    esac
    for duplicate in "${files[@]}"; do [[ "$duplicate" != "$relative" ]] || fail "Duplicate public path: $relative"; done
    git -C "$source_root" ls-files --error-unmatch -- "$relative" >/dev/null 2>&1 || fail "Public file is not committed: $relative"
    check_path "$source_root" "$relative" source
    check_path "$destination" "$relative" destination
    files+=("$relative")
  done < "$manifest"
  for required in index.html sw.js precache.js version.json vendor/world-data.js vendor/supplement-data.js; do
    local found=false
    for relative in "${files[@]}"; do [[ "$relative" != "$required" ]] || found=true; done
    [[ "$found" == true ]] || fail "Manifest is missing $required"
  done
  # Stage all public bytes before changing the live files.
  umask 022
  stage=$(mktemp -d "$destination/.festival-deploy.XXXXXXXX")
  for relative in "${files[@]}"; do
    mkdir -p -- "$stage/$(dirname -- "$relative")"
    cp -- "$source_root/$relative" "$stage/$relative"
    chmod 0644 -- "$stage/$relative"
  done
  check_path "$source_root" hosting/dreamhost.htaccess source
  git -C "$source_root" ls-files --error-unmatch -- hosting/dreamhost.htaccess >/dev/null 2>&1 || fail 'The DreamHost configuration template must be committed.'
  check_path "$destination" .htaccess destination
  local install_headers=false
  if [[ ! -e "$destination/.htaccess" ]]; then
    cp -- "$source_root/hosting/dreamhost.htaccess" "$stage/.htaccess"
    chmod 0644 -- "$stage/.htaccess"
    install_headers=true
  fi
  [[ "$(git -C "$source_root" rev-parse HEAD)" == "$commit" ]] || fail 'Checkout HEAD changed during staging.'
  [[ -z "$(git -C "$source_root" status --porcelain --untracked-files=all)" ]] || fail 'Checkout changed during staging.'
  # Recheck after staging as well; refuse changed/symlinked public targets.
  for relative in "${files[@]}"; do
    cmp -s -- "$source_root/$relative" "$stage/$relative" || fail "Source changed during staging: $relative"
    check_path "$destination" "$relative" destination
  done
  publishing=true
  # Static assets first, HTML next, service-worker metadata last. Each file rename is atomic;
  # the release as a whole is not a directory-level atomic transaction.
  local -a publish_order=()
  for relative in "${files[@]}"; do
    case "$relative" in index.html|version.json|precache.js|sw.js) ;; *) publish_order+=("$relative");; esac
  done
  publish_order+=(index.html version.json precache.js sw.js)
  for relative in "${publish_order[@]}"; do
    check_path "$destination" "$relative" destination
    mkdir -p -- "$destination/$(dirname -- "$relative")"
    mv -f -- "$stage/$relative" "$destination/$relative"
  done
  if [[ "$install_headers" == true ]]; then
    check_path "$destination" .htaccess destination
    # A hard link creates the file exclusively: never overwrite a concurrently created .htaccess.
    if ln -- "$stage/.htaccess" "$destination/.htaccess" 2>/dev/null; then
      printf 'Installed the default DreamHost .htaccess.\n'
    else
      printf 'Preserved a newly created .htaccess; merge the template manually if needed.\n'
    fi
  else
    printf 'Preserved existing .htaccess. Review hosting/dreamhost.htaccess for the PWA cache headers.\n'
  fi
  publishing=false
  printf 'Published %s public files to %s\nCommit: %s\n' "${#files[@]}" "$destination" "$commit"
}
main "$@"
