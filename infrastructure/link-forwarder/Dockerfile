FROM node:24-alpine
WORKDIR /app
COPY server.mjs ./server.mjs
USER node
EXPOSE 8080
CMD ["node", "--max-old-space-size=32", "server.mjs"]
