group "default" {
  targets = ["all"]
}

target "all" {
  context = "../.."
  dockerfile = ".github/docker/Dockerfile"
  platforms = [
    "linux/amd64", "linux/arm64"
  ]
  tags = [ "yodamad/slidesk:latest" ]
}
