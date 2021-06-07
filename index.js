const fs = require('fs/promises')

main()

async function main () {
  const [skipped, , ...rest] = (await fs.readFile('./data.txt', 'utf-8')).split('\r\n')
  const obj = {}
  const parsedSkipped = compileSkippedObj(skipped)
  obj[parsedSkipped[0]] = parsedSkipped[1]
  rest
    .map(o => o.match(/private static final Map<String, String> (.+) = ImmutableMap\.builder\(\)(.+)\.build()/))
    .map(o => {
      let [, ...data] = o[2].split('.put')
      data = data.map(o => {
        const [, oldName, newName] = o.match(/\("(.+)", "(.+)"\)/)
        return [oldName, newName]
      })
      return [o[1], data]
    })
    .forEach(([name, data]) => {
      obj[name] = data
    })
  await fs.writeFile('output.json', JSON.stringify(obj, null, 2))
}

function compileSkippedObj (skipped) {
  const [, name, data] = skipped.match(/private static final Set<String> (.+) = ImmutableSet\.builder\(\)(.+)\.build()/)
  let [, ...splitData] = data.split('.add')
  splitData = splitData.map(o => o.match(/\("(.+)"\)/)[1])
  return [name, splitData]
}
