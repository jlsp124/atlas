FROM node:24.11.1-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node server ./server
COPY --chown=node:node src/core ./src/core
COPY --chown=node:node src/content ./src/content
RUN mkdir -p /app/data && chown node:node /app/data
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787 DATA_DIR=/app/data
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "umask 077; exec node --import tsx server/main.ts"]
