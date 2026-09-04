# syntax = docker/dockerfile:1

ARG NODE_VERSION=24.2.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Astro"

WORKDIR /app

ENV NODE_ENV="production"

ARG PNPM_VERSION=11.5.2
RUN npm install -g pnpm@$PNPM_VERSION

FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/bio/package.json ./apps/bio/
COPY apps/dashboard/package.json ./apps/dashboard/
COPY apps/website/package.json ./apps/website/
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

RUN pnpm install --frozen-lockfile --filter @inbound/website...

COPY apps/website ./apps/website

RUN pnpm --filter @inbound/website build

FROM nginx

COPY --from=build /app/apps/website/dist /usr/share/nginx/html

EXPOSE 80
CMD [ "/usr/sbin/nginx", "-g", "daemon off;" ]
