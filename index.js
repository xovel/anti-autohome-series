const fs = require('fs')
const xlsx = require('node-xlsx').default
const argv = require('psargv').argv

const getHTML = require('./util/getHTML')

let url = ''

if (argv.id) {
  url = `https://car.autohome.com.cn/config/series/${argv.id}.html`
} else {
  process.exit(0)
}

if (!fs.existsSync('excel')) {
  fs.mkdirSync('excel')
}

getHTML(url).then(source => {

  const title = (source.match(/<title>【(.+?)】(?:.+?)<\/title>/) || [])[1] || '参数配置表'

  function extractText(content, begin, end, condition) {
    const ret = []
    const s1 = content.split(begin)
    for (let i = 1; i < s1.length; i++) {
      const s2 = s1[i].split(end)
      const s3 = s2[0]
      if (condition) {
        if (condition(s3)) {
          ret.push(s3)
        }
      }
    }
    return ret
  }

  global.createElement = () => ({})
  global.head = {
    appendChild: () => ({})
  }

  global.fake = {}

  const reName = /function\s+\$GetClassName\$\s*\(\$index\$\)\s*{\s*return\s+'\.hs_kw'\s+\+\s+\$index\$\s+\+\s+'_(\w+?)';\s*\}/

  const scripts = extractText(source, '<script>', '</script>', (text) => text.slice(-11) === '(document);')

  scripts.forEach(text => {
    const name = text.match(reName)[1]
    global.fake[name] = []

    const txtFake = text.replace('$InsertRule$($index$, $temp$);', `global.fake['${name}'].push($temp$);`).replace('})(document);', 'function $GetWindow$() {return global}})(global)')

    eval(txtFake)
  })

  let configScript = extractText(source, '<script type="text/javascript">', '</script>', text => text.indexOf('var config =') > -1)[0]

  configScript = configScript.replace(/<span class='hs_kw(\d+?)_(\w+?)'><\/span>/g, function (_, index, mode) {
    return global.fake[mode][index]
  }).replace(/&nbsp;?/g, ' ').replace('var config ', 'global.config').replace('var option ', 'global.option ')

  eval(configScript)


  const data = []

  config.result.paramtypeitems.forEach(item => {
    data.push([], [item.name], [])
    item.paramitems.forEach(p => {
      const value = []
      value.push(p.name)
      p.valueitems.forEach(v => {
        value.push(v.value)
      })
      data.push(value)
    })
  })

  option.result.configtypeitems.forEach(item => {
    data.push([], [item.name], [])
    item.configitems.forEach(p => {
      const value = []
      value.push(p.name)
      p.valueitems.forEach(v => {
        value.push(v.value)
      })
      data.push(value)
    })
  })

  const buffer = xlsx.build([{
    name: title,
    data
  }])

  fs.writeFileSync(`excel/${title}.xlsx`, buffer)

})
