#!/usr/bin/env node
// cleans the titles of anime files from the high seas
const { parse, join } = require("path")
const prompts = require("prompts")
const execa = require("execa")
const { lookup } = require("mime-types")

const supportedTypes = ["image", "video"]

/**
 * @param {String} path
 * @returns {String}
 */
function clean(path) {
  const parsed = parse(path)
  const type = lookup(path)

  // check if we even want to rename this
  if (
    path.endsWith("DS_Store") ||
    (parsed.type && !(type && supportedTypes.includes(type.split("/")[0])))
  )
    return path

  // clean the name - basically everything before the period
  const cleanedName = parsed.name
    .replace(/\[[^\]]+\]|\([^)]*(\dp|\dx\d|\dbit)[^)]*\)/gi, "")
    .replace(/(_|\.)/g, " ")
    .trim()

  return join(parsed.dir, cleanedName + parsed.ext)
}

async function cli() {
  const folder = await prompts({
    type: "text",
    name: "value",
    message: "Which folder to rename?"
  })

  const { stdout } = await execa("find", [folder.value])
  const paths = stdout.split("\n").reverse()
  const renamedPaths = paths.map(path => clean(path))

  for (let i = 0; i < paths.length; i++) {
    if (paths[i] != renamedPaths[i])
      console.log(`${paths[i]} => ${renamedPaths[i]}`)
  }

  const rename = await prompts({
    type: "confirm",
    name: "value",
    message: "rename files/folders?"
  })

  if (!rename.value) return

  for (let i = 0; i < paths.length; i++) {
    if (paths[i] != renamedPaths[i])
      await execa("mv", [paths[i], renamedPaths[i]])
  }
}

cli()
