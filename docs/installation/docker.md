# Use directly from a docker image

Slidesk has a DockerHub repository ! https://hub.docker.com/r/gouz/slidesk

To use it with your current working directory as your slidesk directory

```sh
docker run -it -v "$(pwd)"/:/slidesk/ -p 1337:1337 gouz/slidesk:latest
```

Slidesk is now accessible through http://localhost:1337. If you need additional arguments, specify them after specifying the slidesk binary.
Example :

```sh
docker run -it -v "$(pwd)"/:/slidesk/ -p 1337:1337 gouz/slidesk:latest slidesk -tn
```
