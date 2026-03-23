#!/bin/bash
mkdir -p /home/runner/mysql-data /tmp/mysql

MARIADB_DIR=$(dirname $(dirname $(which mysqld)))
DATA_DIR=/home/runner/mysql-data

# Initialize only if the mysql system schema doesn't exist
if [ ! -d "$DATA_DIR/mysql" ]; then
  echo "[MySQL] Initializing data directory..."
  mysql_install_db \
    --datadir="$DATA_DIR" \
    --basedir="$MARIADB_DIR" \
    --auth-root-authentication-method=normal \
    --skip-test-db 2>&1 || true
  echo "[MySQL] Initialization complete."
fi

echo "[MySQL] Starting MariaDB server..."
exec mysqld \
  --user=runner \
  --datadir="$DATA_DIR" \
  --socket=/tmp/mysql/mysql.sock \
  --port=3306 \
  --bind-address=127.0.0.1 \
  --pid-file=/tmp/mysql/mysql.pid \
  --log-error=/tmp/mysql/error.log \
  --innodb-buffer-pool-size=64M \
  --skip-name-resolve \
  --skip-grant-tables \
  --console
