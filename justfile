set dotenv-load := true

root_dir := justfile_directory()

deps: deps-root

deps-root:
    pnpm install

lint target="all":
    #!/usr/bin/env bash
    set -euox pipefail
    case "{{ target }}" in
      all)
        just lint justfile
        just lint config
        just lint go
        ;;
      justfile)
        just --fmt --unstable
        ;;
      config)
        npx prettier --write "**/*.{json,yml,yaml,md}"
        ;;
      go)
        gofmt -w src/backend
        ;;
      *)
        echo "Unknown target: {{ target }}"
        exit 1
        ;;
    esac

run target:
    #!/usr/bin/env bash
    set -euox pipefail
    case "{{ target }}" in
      backend)
        cd src/backend && air
        ;;
      *)
        echo "Unknown target: {{ target }}"
        exit 1
        ;;
    esac

test target="all":
    #!/usr/bin/env bash
    set -euox pipefail
    case "{{ target }}" in
      all)
        just test backend
        ;;
      backend)
        cd src/backend && go test -v ./...
        ;;
      *)
        echo "Unknown target: {{ target }}"
        exit 1
        ;;
    esac
