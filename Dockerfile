FROM node:20-alpine
WORKDIR /app

# OpenSSL für Prisma (Alpine braucht das explizit)
RUN apk add --no-cache openssl

# Dependencies
COPY package.json package-lock.json* ./
# npm ci ist reproduzierbar und schneller, braucht aber eine passende
# package-lock.json. Fällt auf npm install zurück, falls die Lockfile fehlt.
RUN npm ci || npm install

# Source code
COPY . .

# Prisma Client generieren & Build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# Datenordner anlegen
RUN mkdir -p /data

EXPOSE 3000
ENV NODE_ENV=production

# Migrationen ausführen & App starten
CMD sh -c "npx prisma migrate deploy && npm start"
