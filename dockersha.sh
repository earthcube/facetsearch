#!/usr/bin/env bash
# find_qlever_tag.sh
# Searches all adfreiburg/qlever tags on Docker Hub for a specific SHA
# (checks both image manifest digest and layer digests)
#
# Usage: ./find_qlever_tag.sh
# Requirements: curl, jq

set -euo pipefail

TARGET_SHA="f7eae5f566d6bc557099697c41cc9bc99c33da5e76416cb9870d5116ea78330d"
REPO="adfreiburg/qlever"
REGISTRY="https://registry-1.docker.io"
HUB_API="https://hub.docker.com/v2/repositories/${REPO}/tags"

echo "Searching adfreiburg/qlever for SHA: ${TARGET_SHA}"
echo "─────────────────────────────────────────────────────────────────"

# ── 1. Get an anonymous auth token for the registry ──────────────────────────
echo "[1/3] Fetching auth token..."
TOKEN=$(curl -sf \
  "https://auth.docker.io/token?service=registry.docker.io&scope=repository:${REPO}:pull" \
  | jq -r '.token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "ERROR: Could not obtain registry token. Check your internet connection."
  exit 1
fi

# ── 2. Page through all tags from Docker Hub ─────────────────────────────────
echo "[2/3] Fetching tag list from Docker Hub..."
ALL_TAGS=()
NEXT_URL="${HUB_API}?page_size=100"

while [[ -n "$NEXT_URL" && "$NEXT_URL" != "null" ]]; do
  RESPONSE=$(curl -sf "$NEXT_URL")
  PAGE_TAGS=$(echo "$RESPONSE" | jq -r '.results[].name')
  while IFS= read -r tag; do
    ALL_TAGS+=("$tag")
  done <<< "$PAGE_TAGS"
  NEXT_URL=$(echo "$RESPONSE" | jq -r '.next // empty')
done

echo "    Found ${#ALL_TAGS[@]} tags. Inspecting manifests..."
echo "[3/3] Checking each tag for SHA match..."
echo ""

FOUND=0

for TAG in "${ALL_TAGS[@]}"; do
  # Fetch the manifest (accept both v2 manifest and manifest list)
  MANIFEST=$(curl -sf \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Accept: application/vnd.docker.distribution.manifest.v2+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.oci.image.index.v1+json" \
    "${REGISTRY}/v2/${REPO}/manifests/${TAG}" 2>/dev/null || echo "{}")

  # Check top-level manifest digest (the Docker-Content-Digest header is more
  # reliable, but we can also hash the body ourselves)
  MANIFEST_DIGEST=$(echo "$MANIFEST" | jq -r '.config.digest // empty' | sed 's/sha256://')

  # Check all layer digests
  LAYER_DIGESTS=$(echo "$MANIFEST" | jq -r '
    (.layers // .manifests // [])[] |
    (.digest // .config.digest // empty)
  ' | sed 's/sha256://')

  # Also check nested manifests in a manifest list
  NESTED_DIGESTS=$(echo "$MANIFEST" | jq -r '
    (.manifests // [])[] | .digest // empty
  ' | sed 's/sha256://')

  ALL_DIGESTS="${MANIFEST_DIGEST}"$'\n'"${LAYER_DIGESTS}"$'\n'"${NESTED_DIGESTS}"

  if echo "$ALL_DIGESTS" | grep -qF "$TARGET_SHA"; then
    echo "✅  MATCH FOUND!"
    echo "    Tag:    ${TAG}"
    echo "    Pull:   docker pull ${REPO}:${TAG}"
    echo ""
    FOUND=1
  fi
done

if [[ $FOUND -eq 0 ]]; then
  echo "❌  SHA not found in any tag's manifest or layer digests."
  echo ""
  echo "Note: The SHA might be a compressed layer blob digest, which requires"
  echo "a separate blob inspection. Try pulling a candidate image and running:"
  echo "  docker image inspect <image_id>"
  echo "to compare the layer DiffIDs."
fi

echo "─────────────────────────────────────────────────────────────────"
echo "Done."
