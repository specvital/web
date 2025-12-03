module.exports = {
  "**/*.{json,yml,yaml,md}": () => "just lint config",
  justfile: () => "just lint justfile",
  "**/*.go": () => "just lint go",
};
