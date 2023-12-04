FROM arunvelsriram/utils:latest as build
RUN curl -s https://api.github.com/repos/gouz/slidesk/releases/latest | grep "/release_mac.tar.gz" | cut -d : -f 2,3 | tr -d \" | wget -qi -
RUN tar -xzf release_mac.tar.gz && \
    chmod +x exe/slidesk

FROM ubuntu:jammy
COPY --from=build /home/utils/exe/slidesk /bin/slidesk
WORKDIR /slidesk
CMD slidesk