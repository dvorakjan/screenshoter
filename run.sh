#!/bin/sh
cd ${0%/*}
mkdir -p logs
forever stop screenshoter.js > /dev/null 2>&1
forever start -a -p . --minUptime 1000 --spinSleepTime 100 -o logs/out.log -e logs/err.log -l logs/forever.log --pidFile ./forever.pid -w --watchIgnore "logs/*" screenshoter.js
