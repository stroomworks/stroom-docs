#!/usr/bin/env bash
#
# Sourced by the container_build scripts (and generate_reference_docs.sh). It makes them
# work the same under rootful and rootless docker: it decides which user the build
# containers run as, and provides ensure_buildx_builder.
#
# The repository is bind mounted into each container and the containers write into it
# (public/, .puml.svg files, stroom-docs.pdf, generated pages), so files must end up
# owned by the person running the script. How to achieve that depends on the docker
# daemon:
#
#   rootful docker   Container UIDs are host UIDs, so the container runs as your own
#                    UID/GID.
#   rootless docker  The daemon runs as you, and container UID 0 is mapped to your host
#                    UID. Any other container UID maps to a subordinate UID that cannot
#                    write to your files, so the container must run as UID 0. That is
#                    not root on the host: it is you.
#
# Sets:
#   container_user_id   the UID to bake into the images (build arg USER_ID)
#   container_group_id  the GID to bake into the images (build arg GROUP_ID)
#   is_rootless_docker  true or false

is_rootless_docker=false
if docker info --format '{{json .SecurityOptions}}' 2>/dev/null | grep -q 'name=rootless'; then
  is_rootless_docker=true
fi

if [[ "${is_rootless_docker}" = true ]]; then
  container_user_id=0
  container_group_id=0
else
  container_user_id="$(id -u)"
  container_group_id="$(id -g)"
fi

# Makes sure the named buildx builder exists and can reach the docker daemon in use,
# then selects it.
#
# A builder is tied to the docker endpoint it was created against, so one created under
# rootful docker (unix:///var/run/docker.sock) cannot reach a rootless daemon, or the other
# way round, and every build then fails to connect. Such a builder is removed and created
# again against the current docker context.
ensure_buildx_builder() {
  local name="$1"; shift
  # inspect exits 0 even when the builder cannot connect, so check the node's status.
  if ! docker buildx inspect --bootstrap "${name}" 2>&1 | grep -q '^Status: *running'; then
    echo "Creating buildx builder ${name} for docker context $(docker context show)"
    docker buildx rm "${name}" >/dev/null 2>&1 || true
    docker buildx \
      create \
      --name "${name}" \
      "$(docker context show)"
  fi
  docker buildx \
    use \
    "${name}"
}
