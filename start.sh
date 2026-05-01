#!/bin/sh
export PATH="/Users/yuki.k/.gemini/antigravity/playground/molten-whirlpool/node-v20.11.1-darwin-arm64/bin:$PATH"
cd /Users/yuki.k/task-dashboard
exec node node_modules/.bin/next dev --port 3000
