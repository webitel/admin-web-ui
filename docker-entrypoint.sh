#!/bin/bash
set -e

echo 'webUI '$VERSION

if [ "$SSL" ]; then
	sed -i 's/SSL/'$SSL'/g' /admin/config/config.json
else
	sed -i 's/SSL/false/g' /admin/config/config.json
fi

if [ "$LOGLEVEL" ]; then
	sed -i 's/LOGLEVEL/'$LOGLEVEL'/g' /admin/config/config.json
else
	sed -i 's/LOGLEVEL/warn/g' /admin/config/config.json
fi

if [ "$CDR_SERVER" ]; then
	sed -i 's/CDR_SERVER/'$CDR_SERVER'/g' /admin/config/config.json
fi

if [ "$CDR_HTTP" ]; then
	sed -i 's/CDR_HTTP/'$CDR_HTTP'/g' /admin/config/config.json
else
	sed -i 's/CDR_HTTP/http/g' /admin/config/config.json
fi

sed -i 's/SESSION_SECRET/'$(date | sha256sum | base64 | head -c 32)'/g' /admin/config/config.json

exec node app.js
