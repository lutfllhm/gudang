#!/bin/bash

#################################################################
# Tail logs from all containers
# Version: 1.0.0
#################################################################

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

if [ -z "$1" ]; then
    # Show all logs
    docker-compose logs -f
else
    # Show specific service logs
    docker-compose logs -f $1
fi
