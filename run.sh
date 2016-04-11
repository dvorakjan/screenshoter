#!/bin/sh
#/etc/init.d/screenshoter

export PATH=$PATH:/usr/local/bin
export NODE_PATH=$NODE_PATH:/usr/local/lib/node_modules

case "$1" in
  start)
  cd $(dirname `readlink -f $0 || realpath $0`)
  mkdir -p logs
  forever stop screenshoter.js > /dev/null 2>&1
  forever start -a -p . --minUptime 1000 --spinSleepTime 100 -o logs/out.log -e logs/err.log -l logs/forever.log --pidFile ./forever.pid -w --watchIgnore "logs/*" --watchIgnore "temp/*" screenshoter.js
  ;;
stop)
  exec forever stop screenshoter.js
  ;;
*)
  echo "Usage: /etc/init.d/screenshoter {start|stop}"
  exit 1
  ;;
esac

exit 0

