name: Keep Backend Alive

on:
  schedule:
    - cron: "*/5 * * * *"
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest

    steps:
      - name: Ping backend (retry logic)
        run: |
          echo "Pinging backend..."

          success=false

          for i in {1..5}
          do
            echo "Attempt $i..."
            if curl --silent --show-error --fail https://divinesky-613l.onrender.com/health; then
              success=true
              break
            fi
            echo "Retrying in 10 seconds..."
            sleep 10
          done

          if [ "$success" = false ]; then
            echo "All attempts failed ❌"
            exit 1
          fi

          echo "Backend is awake ✅"