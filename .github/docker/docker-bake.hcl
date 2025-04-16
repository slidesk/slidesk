group "default" {
  targets = ["amd64", "arm64"]
}

target "amd64" {
  context = "../.."
  dockerfile = ".github/docker/Dockerfile"
  args = {
    BUN_TARGET = "linux-x64-modern"
  }
  platforms = [
    "linux/amd64"
  ]
  tags = ["gouz/slidesk:latest-amd64"]
}

target "arm64" {
  context = "../.."
  dockerfile = ".github/docker/Dockerfile"
  args = {
    BUN_TARGET = "linux-arm64"
  }
  platforms = [
    "linux/arm64"
  ]
  tags = ["gouz/slidesk:latest-arm64"]
}
