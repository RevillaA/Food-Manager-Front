#!/bin/sh
set -e

if [ -f /usr/share/nginx/html/env.template.js ]; then
  envsubst '${API_URL}' \
    < /usr/share/nginx/html/env.template.js \
    > /usr/share/nginx/html/env.js
else
  cat <<EOF > /usr/share/nginx/html/env.js
window.__env = {
  API_URL: "${API_URL}"
};
EOF
fi

exec nginx -g 'daemon off;'
