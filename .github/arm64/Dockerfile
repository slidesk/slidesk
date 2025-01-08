# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install with --production (exclude devDependencies)
FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
WORKDIR /usr/src/app
COPY --from=install /temp/prod/node_modules node_modules
COPY . .
RUN bun make:exe --target=bun-linux-arm64
RUN chmod +x exe/slidesk

FROM ubuntu:jammy
COPY --from=prerelease /usr/src/app/exe/slidesk /bin/slidesk
WORKDIR /slidesk
CMD slidesk