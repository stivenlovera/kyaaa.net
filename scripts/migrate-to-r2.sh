#!/usr/bin/env bash
# Copia los buckets de Contabo a Cloudflare R2 con rclone, conservando keys, Content-Type y Cache-Control.
# Es idempotente: se puede repetir (solo copia lo nuevo o lo que cambió) y no borra nada en el destino.
#
# Uso:
#   export CONTABO_KEY=... CONTABO_SECRET=...
#   export R2_ACCOUNT_ID=... R2_KEY=... R2_SECRET=...
#   ./scripts/migrate-to-r2.sh                      # copia public, private y static
#   ./scripts/migrate-to-r2.sh private              # solo un bucket
#   DRY_RUN=1 ./scripts/migrate-to-r2.sh            # muestra qué copiaría
#
# Los buckets deben existir ya en R2 con el mismo nombre (o usa SRC:DST, p. ej. `public:packs-public`).
# Requiere rclone >= 1.60 (https://rclone.org/install/).
set -euo pipefail

: "${CONTABO_KEY:?falta CONTABO_KEY}" "${CONTABO_SECRET:?falta CONTABO_SECRET}"
: "${R2_ACCOUNT_ID:?falta R2_ACCOUNT_ID}" "${R2_KEY:?falta R2_KEY}" "${R2_SECRET:?falta R2_SECRET}"

# Remotes definidos por variables de entorno: no se escribe ningún rclone.conf.
export RCLONE_CONFIG_CONTABO_TYPE=s3
export RCLONE_CONFIG_CONTABO_PROVIDER=Other
export RCLONE_CONFIG_CONTABO_ENDPOINT="${CONTABO_ENDPOINT:-https://usc1.contabostorage.com}"
export RCLONE_CONFIG_CONTABO_ACCESS_KEY_ID="$CONTABO_KEY"
export RCLONE_CONFIG_CONTABO_SECRET_ACCESS_KEY="$CONTABO_SECRET"
export RCLONE_CONFIG_CONTABO_FORCE_PATH_STYLE=true

export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_KEY"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET"
export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true

BUCKETS=("$@")
[ ${#BUCKETS[@]} -eq 0 ] && BUCKETS=(public private static)

EXTRA=()
[ "${DRY_RUN:-0}" = "1" ] && EXTRA+=(--dry-run)

for entry in "${BUCKETS[@]}"; do
    src="${entry%%:*}"
    dst="${entry#*:}"
    echo "==> contabo:${src}  ->  r2:${dst}"
    # --metadata conserva Cache-Control, Content-Disposition, etc.; --checksum compara por MD5/ETag.
    rclone copy "contabo:${src}" "r2:${dst}" \
        --metadata --checksum \
        --transfers 32 --checkers 64 \
        --s3-upload-cutoff 100M --s3-chunk-size 64M \
        --progress --stats-one-line \
        "${EXTRA[@]}"
    if [ "${DRY_RUN:-0}" != "1" ]; then
        echo "==> verificando ${src}"
        rclone check "contabo:${src}" "r2:${dst}" --one-way --size-only
    fi
done

echo "Listo. Cambia AWS_ENPOINT / AWS_REGION / credenciales y apunta los dominios públicos a R2."
