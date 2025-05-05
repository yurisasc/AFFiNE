#!/bin/bash

# Path to the local file
LOCAL_FILE="refresh-all-prompts.mjs"
# Path inside the container
CONTAINER_PATH="/app/refresh-all-prompts.mjs"
# Name of the running container
CONTAINER_NAME="affine_server"

echo "Copying $LOCAL_FILE to $CONTAINER_NAME:$CONTAINER_PATH ..."
docker cp "$LOCAL_FILE" "$CONTAINER_NAME":"$CONTAINER_PATH"

if [ $? -eq 0 ]; then
  echo "Successfully copied $LOCAL_FILE to $CONTAINER_NAME:$CONTAINER_PATH"
else
  echo "Failed to copy $LOCAL_FILE to $CONTAINER_NAME:$CONTAINER_PATH"
  exit 1
fi

echo "Running $CONTAINER_PATH inside $CONTAINER_NAME ..."
docker exec -it "$CONTAINER_NAME" node "$CONTAINER_PATH"