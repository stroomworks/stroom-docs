#!/usr/bin/env bash
#
# Regenerates the documentation pages that are generated from the Stroom source:
# content/en/docs/reference/{documents,jobs,response-codes,pipeline-elements,
# expression-functions,configuration-properties}.md, the pipeline element map in
# layouts/shortcodes/pipe-elm.html and the element/document icons in
# assets/images/stroom-ui/.
#
# Usage:
#   ./generate_reference_docs.sh /path/to/stroom
#
# The path is a checkout of the Stroom repository at the version these docs describe.
# Uses a local node (16 or later) if there is one, otherwise runs node inside the same
# docker image the site is built with.
#
# The output is committed, so the site build never needs the Stroom source. Review the
# diff before committing it. See content/en/community/documentation/building.md.

set -euo pipefail

main() {
  local script_dir
  script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

  if [[ $# -ne 1 ]] || [[ ! -d "$1" ]]; then
    echo "Usage: $0 /path/to/stroom" >&2
    exit 1
  fi
  local stroom_src
  stroom_src="$( cd "$1" && pwd )"

  cd "${script_dir}"

  local node_major=0
  if command -v node >/dev/null 2>&1; then
    node_major="$(node -p 'process.versions.node.split(".")[0]')"
  fi

  if [[ "${node_major}" -ge 16 ]]; then
    STROOM_SRC="${stroom_src}" node scripts/docs/gen-docs-reference.mjs
  else
    echo "No local node 16+, running in docker"
    # Your UID under rootful docker, UID 0 (which is you) under rootless.
    # shellcheck source=container_build/docker_env.sh
    source "${script_dir}/container_build/docker_env.sh"
    docker run \
      --rm \
      --user "${container_user_id}:${container_group_id}" \
      --mount "type=bind,src=${script_dir},dst=/builder/shared" \
      --mount "type=bind,src=${stroom_src},dst=/stroom,readonly" \
      --workdir /builder/shared \
      --env STROOM_SRC=/stroom \
      --entrypoint node \
      klakegg/hugo:0.95.0-ext-alpine \
      scripts/docs/gen-docs-reference.mjs
  fi
}

main "$@"
