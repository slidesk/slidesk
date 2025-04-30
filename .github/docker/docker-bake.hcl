
variable "TAG_VERSION" {}

group "default" {
  targets = ["all"]
}

target "docker-metadata-action" {}

target "all" {
  inherits = [ "docker-metadata-action" ]
  context = "../.."
  dockerfile = ".github/docker/Dockerfile"
  platforms = [
    "linux/amd64", "linux/arm64"
  ]
  tags = [ "gouz/slidesk:latest", "gouz/slidesk:${TAG_VERSION}" ]
}
