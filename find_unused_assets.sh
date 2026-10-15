#!/usr/bin/env bash

###########################################################
#  Finds (and optionally deletes unused files and images
#  in assets/files/ and assets/images/
#
# Use the arg 'delete' to deleted unused files/images
###########################################################

set -e
shopt -s globstar nullglob dotglob

setup_echo_colours() {
  # Exit the script on any error
  set -e

  # shellcheck disable=SC2034
  if [ "${MONOCHROME}" = true ]; then
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    BLUE2=''
    DGREY=''
    NC='' # No Colour
  else 
    RED='\033[1;31m'
    GREEN='\033[1;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[1;34m'
    BLUE2='\033[1;34m'
    DGREY='\e[90m'
    NC='\033[0m' # No Colour
  fi
}

debug_value() {
  local name="$1"; shift
  local value="$1"; shift
  
  if [ "${IS_DEBUG}" = true ]; then
    echo -e "${DGREY}DEBUG ${name}: ${value}${NC}"
  fi
}

debug() {
  local str="$1"; shift
  
  if [ "${IS_DEBUG}" = true ]; then
    echo -e "${DGREY}DEBUG ${str}${NC}"
  fi
}

# Returns 0 if the pattern is found in the content, 1 if it is not.
# Exits the script if rg fails for any other reason, e.g. a bad pattern or
# a missing directory, so that an error is never mistaken for an unused asset
# (which, with the 'delete' arg, would delete it).
is_referenced() {
  local exit_code=0
  rg --quiet "$@" content/en/ || exit_code=$?

  if [[ "${exit_code}" -eq 0 ]]; then
    return 0
  elif [[ "${exit_code}" -eq 1 ]]; then
    return 1
  else
    echo -e "${RED}ERROR${NC}: rg failed with exit code ${exit_code}" \
      "for args [$*], aborting"
    exit 1
  fi
}

main() {
  IS_DEBUG=false
  SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
  local assets_dir="${SCRIPT_DIR}/assets"
  local images_dir="${assets_dir}/images"
  local files_dir="${assets_dir}/files"
  local do_delete=false
  if [[ "${1}" = "delete" ]]; then
    do_delete=true
  fi

  setup_echo_colours

  if ! command -v rg > /dev/null; then
    echo -e "${RED}ERROR${NC}: You need to install ripgrep (rg)"
    exit 1
  fi

  echo "Searching for unused images in ${images_dir}"
  for asset_file in "${images_dir}"/**/*; do
    if [[ "${asset_file}" =~ \.(puml\.svg|svg|png)$ ]] \
      && [[ ! "${asset_file}" =~ /assets/images/stroom-ui/ ]]; then
      local asset_filename
      asset_filename="$(basename "${asset_file}")"
      local pattern="[\"/]${asset_filename//./\.}\""
      #echo "  Testing file ${asset_file}"
      if ! is_referenced \
        --type md \
        "${pattern}"; then

        if [[ "${do_delete}" = true ]]; then
          rm "${asset_file}"
          echo "  Deleted: ${asset_file}"
        else
          echo "  Found: ${asset_file}"
        fi
      fi
    fi
  done

  echo "Searching for unused files in ${files_dir}"
  for asset_file in "${files_dir}"/**/*; do
    if [[ ! -f "${asset_file}" ]]; then
      continue
    fi
    local asset_filename
    asset_filename="$(basename "${asset_file}")"
    #echo "  Testing file ${asset_file}"
    if ! is_referenced \
      --fixed-strings \
      --type md \
      "${asset_filename}"; then

      if [[ "${do_delete}" = true ]]; then
        rm "${asset_file}"
        echo "  Deleted: ${asset_file}"
      else
        echo "  Found: ${asset_file}"
      fi
    fi
  done
}

main "$@"
