#!/bin/bash

# ==========================================
# CLONY Development Environment Launcher
# ==========================================

echo "🚀 Starting all CLONY servers..."

# 1. Start Python Backend API (Terminal 1)
# Using Python from virtual environment
echo "▶️ Launching Backend Server (port 8000)..."
osascript -e 'tell app "Terminal"
    do script "cd '$HOME'/Desktop/CLONY && source .venv/bin/activate && python server/main.py"
end tell'

# 2. Start Expo Mobile App (Terminal 2)
echo "▶️ Launching Expo Mobile App (port 8081)..."
osascript -e 'tell app "Terminal"
    do script "cd '$HOME'/Desktop/CLONY && npx expo start -c"
end tell'

# 3. Start Admin Dashboard (Terminal 3)
echo "▶️ Launching Admin Web Dashboard (port 5174)..."
osascript -e 'tell app "Terminal"
    do script "cd '$HOME'/Desktop/clony-admin && npm run dev"
end tell'

# Optional: Start clony-project if exists
if [ -d "$HOME/Desktop/clony-project" ]; then
    echo "▶️ Launching Web Project (port 5173)..."
    osascript -e 'tell app "Terminal"
        do script "cd '$HOME'/Desktop/clony-project && npm run dev"
    end tell'
fi

echo "✅ All servers have been launched in separate terminal windows!"
