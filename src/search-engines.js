import priv from "./conf.priv.js"
import util from "./util.js"

const {
  escapeHTML,
  createSuggestionItem,
  createURLItem,
  prettyDate,
  getDuckduckgoFaviconUrl,
  localStorage,
  runtimeHttpRequest,
} = util

// TODO: use a Babel loader to import these images
const wpDefaultIcon = "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2056%2056%22%20enable-background%3D%22new%200%200%2056%2056%22%3E%0A%20%20%20%20%3Cpath%20fill%3D%22%23eee%22%20d%3D%22M0%200h56v56h-56z%22%2F%3E%0A%20%20%20%20%3Cpath%20fill%3D%22%23999%22%20d%3D%22M36.4%2013.5h-18.6v24.9c0%201.4.9%202.3%202.3%202.3h18.7v-25c.1-1.4-1-2.2-2.4-2.2zm-6.2%203.5h5.1v6.4h-5.1v-6.4zm-8.8%200h6v1.8h-6v-1.8zm0%204.6h6v1.8h-6v-1.8zm0%2015.5v-1.8h13.8v1.8h-13.8zm13.8-4.5h-13.8v-1.8h13.8v1.8zm0-4.7h-13.8v-1.8h13.8v1.8z%22%2F%3E%0A%3C%2Fsvg%3E%0A"
const cbDefaultIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAAAAAByaaZbAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAACYktHRAD/h4/MvwAAAAlwSFlzAAAOwwAADsMBx2+oZAAAAAd0SU1FB+EICxEMErRVWUQAAABOdEVYdFJhdyBwcm9maWxlIHR5cGUgZXhpZgAKZXhpZgogICAgICAyMAo0NTc4Njk2NjAwMDA0OTQ5MmEwMDA4MDAwMDAwMDAwMDAwMDAwMDAwCnwMkD0AAAGXSURBVEjH1ZRvc4IwDMb7/T8dbVr/sEPlPJQd3g22GzJdmxVOHaQa8N2WN7wwvyZ5Eh/hngzxTwDr0If/TAK67POxbqxnpgCIx9dkrkEvswYnAFiutFSgtQapS4ejwFYqbXQXBmC+QxawuI/MJb0LiCq0DICNHoZRKQdYLKQZEhATcQmwDYD5GR8DDtfqaYAMActvTiVMaUvqhZPVYhYAK2SBAwGMTHngnc4wVmFPW9L6k1PJxbSCkfvhqolKSQhsWSClizNyxwAWdzIADixQRXRmdWSHthsg+TknaztFMZgC3vh/nG/qo68TLAKrCSrUg1ulp3cH+BpItBp3DZf0lFXVOIDnBdwKkLO4D5Q3QMO6HJ+hUb1NKNWMGJn3jf4ejPKn99CXOtsuyab95obGL/rpdZ7oIJK87iPiumG01drbdggoCZuq/f0XaB8/FbG62Ta5cD97XJwuZUT7ONbZTIK5m94hBuQs8535MsL5xxPw6ZoNj0DiyzhhcyMf9BJ0Jk1uRRpNyb4y0UaM9UI7E8+kt/EHgR/R6042JzmiwgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxNy0wOC0xMVQxNzoxMjoxOC0wNDowMLy29LgAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTctMDgtMTFUMTc6MTI6MTgtMDQ6MDDN60wEAAAAAElFTkSuQmCC"

const locale = typeof navigator !== "undefined" ? navigator.language : ""

const localServer = "http://localhost:9919"

const completions = {}

const googleCustomSearch = (opts) => {
  let favicon = "https://google.com/favicon.ico"
  if (opts.favicon) {
    favicon = opts.favicon
  } else if (opts.domain) {
    favicon = getDuckduckgoFaviconUrl(`https://${opts.domain}`)
  } else if (opts.search) {
    favicon = getDuckduckgoFaviconUrl(opts.search)
  }
  return {
    favicon,
    compl: `https://www.googleapis.com/customsearch/v1?key=${priv.keys.google_cs}&cx=${priv.keys[`google_cx_${opts.alias}`]}&q=`,
    search: `https://cse.google.com/cse/publicurl?cx=${priv.keys[`google_cx_${opts.alias}`]}&q=`,
    callback: (response) => {
      const res = JSON.parse(response.text).items
      return res.map((s) => createSuggestionItem(`
        <div>
          <div class="title"><strong>${s.htmlTitle}</strong></div>
          <div>${s.htmlSnippet}</div>
        </div>
      `, { url: s.link }))
    },
    priv: true,
    ...opts,
  }
}

// // ****** Arch Linux ****** //

// // Arch Linux official repos
// completions.al = googleCustomSearch({
//   alias: "al",
//   name: "archlinux",
//   search: "https://www.archlinux.org/packages/?arch=x86_64&q=",
// })

// // Arch Linux AUR
// completions.au = {
//   alias: "au",
//   name: "AUR",
//   search: "https://aur.archlinux.org/packages/?O=0&SeB=nd&outdated=&SB=v&SO=d&PP=100&do_Search=Go&K=",
//   compl: "https://aur.archlinux.org/rpc?v=5&type=suggest&arg=",
// }

// completions.au.callback = (response) => {
//   const res = JSON.parse(response.text)
//   return res.map((s) => createURLItem(s, `https://aur.archlinux.org/packages/${encodeURIComponent(s)}`))
// }

// // Arch Linux Wiki
// completions.aw = {
//   alias: "aw",
//   name: "archwiki",
//   search: "https://wiki.archlinux.org/index.php?go=go&search=",
//   compl: "https://wiki.archlinux.org/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
// }

// completions.aw.callback = (response) => JSON.parse(response.text)[1]

// // Arch Linux Forums
// completions.af = googleCustomSearch({
//   alias: "af",
//   name: "archforums",
//   domain: "bbs.archlinux.org",
// })

// ****** Technical Resources ****** //

// AWS
// completions.aw = {
//   alias:  "aw",
//   name:   "aws",
//   search: "https://aws.amazon.com/search/?searchQuery=",
//   compl:  "https://aws.amazon.com/api/dirs/typeahead-suggestions/items?locale=en_US&limit=250#",
// }
//
// completions.aw.callback = (response) => {
//   console.log({ response })
//   const res = JSON.parse(response.text)
//   return res.items.map((s) => {
//     const { name } = s
//     return createSuggestionItem(`
//       <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
//         <!-- <img style="width:60px" src="\${icUrl}" alt="\${escape(s.Name)}"> -->
//         <div>
//           <div class="title"><strong>${name}</strong> ${s.additionalFields.desc}</div>
//         </div>
//       </div>
//     `, { url: `https://${s.additionalFields.primaryUrl}` })
//   })
// }

// AlternativeTo
completions.at = {
  alias: "at",
  name: "alternativeTo",
  search: "https://alternativeto.net/browse/search/?q=",
  compl: `https://zidpns2vb0-dsn.algolia.net/1/indexes/fullitems?x-algolia-application-id=ZIDPNS2VB0&x-algolia-api-key=${priv.keys.alternativeTo}&attributesToRetrieve=Name,UrlName,TagLine,Description,Likes,HasIcon,IconId,IconExtension,InternalUrl&query=`,
  priv: true,
}

completions.at.callback = async (response) => {
  const res = JSON.parse(response.text)
  return res.hits.map((s) => {
    let title = s.Name
    let prefix = ""
    if (s._highlightResult) {
      if (s._highlightResult.Name) {
        title = s._highlightResult.Name.value
      }
    }
    if (s.Likes) {
      prefix += `[↑${parseInt(s.Likes, 10)}] `
    }
    const icon = s.HasIcon ? `https://d2.alternativeto.net/dist/icons/${s.UrlName}_${s.IconId}${s.IconExtension}?width=100&height=100&mode=crop&upscale=false` : wpDefaultIcon

    return createSuggestionItem(`
      <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
        <img style="width:60px" src="${encodeURI(icon)}" alt="${escapeHTML(s.Name)}">
        <div>
          <div class="title"><strong>${(prefix)}${(title)}</strong></div>
          <span>${escapeHTML(s.TagLine || s.Description || "")}</span>
        </div>
      </div>
    `, { url: `https://${s.InternalUrl}` })
  })
}

// Chrome Webstore
completions.cs = googleCustomSearch({
  alias: "cs",
  name: "chromestore",
  search: "https://chrome.google.com/webstore/search/",
})

// const parseFirefoxAddonsRes = (response) => JSON.parse(response.text).results.map((s) => {
//   let { name } = s
//   if (typeof name === "object") {
//     if (name[navigator.language] !== undefined) {
//       name = name[navigator.language]
//     } else {
//       [name] = Object.values(name)
//     }
//   }
//   name = escapeHTML(name)
//   let prefix = ""
//   switch (s.type) {
//     case "extension":
//       prefix += "🧩 "
//       break
//     case "statictheme":
//       prefix += "🖌 "
//       break
//     default:
//       break
//   }

//   return createSuggestionItem(`
//     <div style="padding:5px;display:grid;grid-template-columns:2em 1fr;grid-gap:15px">
//         <img style="width:2em" src="${encodeURI(s.icon_url)}">
//         <div>
//           <div class="title"><strong>${escapeHTML(prefix)}${escapeHTML(name)}</strong></div>
//         </div>
//       </div>
//     `, { url: s.url })
// })

// // Firefox Addons
// completions.fa = {
//   alias: "fa",
//   name: "firefox-addons",
//   search: `https://addons.mozilla.org/${locale}/firefox/search/?q=`,
//   compl: "https://addons.mozilla.org/api/v4/addons/autocomplete/?q=",
//   callback: parseFirefoxAddonsRes,
// }

// // Firefox Themes
// completions.ft = {
//   alias: "ft",
//   name: "firefox-themes",
//   search: `https://addons.mozilla.org/${locale}/firefox/search/?type=statictheme&q=`,
//   compl: "https://addons.mozilla.org/api/v4/addons/autocomplete/?type=statictheme&q=",
//   callback: parseFirefoxAddonsRes,
// }

// // Firefox Extensions
// completions.fe = {
//   alias: "fe",
//   name: "firefox-extensions",
//   search: `https://addons.mozilla.org/${locale}/firefox/search/?type=extension&q=`,
//   compl: "https://addons.mozilla.org/api/v4/addons/autocomplete/?type=extension&q=",
//   callback: parseFirefoxAddonsRes,
// }

// OWASP Wiki
completions.ow = {
  alias: "ow",
  name: "owasp",
  search: "https://www.owasp.org/index.php?go=go&search=",
  compl: "https://www.owasp.org/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
}

completions.ow.callback = (response) => JSON.parse(response.text)[1]

// StackOverflow
completions.so = {
  alias: "so",
  name: "stackoverflow",
  search: "https://stackoverflow.com/search?q=",
  compl: "https://api.stackexchange.com/2.2/search/advanced?pagesize=10&order=desc&sort=relevance&site=stackoverflow&q=",
}

completions.so.callback = (response) => JSON.parse(response.text).items.map((s) => createURLItem(`[${s.score}] ${s.title}`, s.link, { query: false }))

// StackExchange - all sites
completions.se = {
  alias: "se",
  name: "stackexchange",
  search: "https://stackexchange.com/search?q=",
  compl: "https://duckduckgo.com/ac/?q=!stackexchange%20",
}

completions.se.callback = (response) => JSON.parse(response.text).map((r) => r.phrase.replace(/^!stackexchange /, ""))

// DockerHub repo search
completions.dh = {
  alias: "dh",
  name: "dockerhub",
  search: "https://hub.docker.com/search/?page=1&q=",
  compl: "https://hub.docker.com/v2/search/repositories/?page_size=20&query=",
}

completions.dh.callback = (response) => JSON.parse(response.text).results.map((s) => {
  let meta = ""
  let repo = s.repo_name
  meta += `[★${escapeHTML(s.star_count)}] `
  meta += `[↓${escapeHTML(s.pull_count)}] `
  if (repo.indexOf("/") === -1) {
    repo = `_/${repo}`
  }
  return createSuggestionItem(`
      <div>
        <div class="title"><strong>${escapeHTML(repo)}</strong></div>
        <div>${meta}</div>
        <div>${escapeHTML(s.short_description)}</div>
      </div>
    `, { url: `https://hub.docker.com/r/${encodeURIComponent(repo)}` })
})

// GitHub
completions.gh = {
  alias: "gh",
  name: "github",
  search: "https://github.com/search?q=",
  compl: "https://api.github.com/search/repositories?sort=stars&order=desc&q=",
}

completions.gh.callback = (response) => JSON.parse(response.text).items.map((s) => {
  let prefix = ""
  if (s.stargazers_count) {
    prefix += `[★${parseInt(s.stargazers_count, 10)}] `
  }
  return createURLItem(prefix + s.full_name, s.html_url, { query: s.full_name, desc: s.description })
})

// Domainr domain search
completions.do = {
  alias: "do",
  name: "domainr",
  search: "https://domainr.com/?q=",
  compl: "https://5jmgqstc3m.execute-api.us-west-1.amazonaws.com/v1/domainr?q=",
}

completions.do.callback = (response) => Object.entries(JSON.parse(response.text))
  .map(([domain, data]) => {
    let color = "inherit"
    let symbol = "<strong>?</strong> "
    switch (data.summary) {
      case "inactive":
        color = "#23b000"
        symbol = "✔ "
        break
      case "unknown":
        break
      default:
        color = "#ff4d00"
        symbol = "✘ "
    }
    return createSuggestionItem(
      `<div><div class="title" style="color:${color}"><strong>${symbol}${escapeHTML(domain)}</strong></div></div>`,
      { url: `https://domainr.com/${encodeURIComponent(domain)}` },
    )
  })

// // Vim Wiki
// completions.vw = {
//   alias: "vw",
//   name: "vimwiki",
//   search: "https://vim.fandom.com/wiki/Special:Search?query=",
//   compl: "https://vim.fandom.com/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
// }

// completions.vw.callback = (response) => JSON.parse(response.text)[1]
//   .map((r) => createURLItem(r, `https://vim.fandom.com/wiki/${encodeURIComponent(r)}`, { query: false }))

// ****** Shopping & Food ****** //

// Amazon
completions.az = {
  alias: "az",
  name: "amazon",
  search: "https://smile.amazon.com/s/?field-keywords=",
  compl: "https://completion.amazon.com/search/complete?method=completion&mkt=1&search-alias=aps&q=",
}

completions.az.callback = (response) => JSON.parse(response.text)[1]

// // Craigslist
// completions.cl = {
//   alias: "cl",
//   name: "craigslist",
//   search: "https://www.craigslist.org/search/sss?query=",
//   compl: "https://www.craigslist.org/suggest?v=12&type=search&cat=sss&area=1&term=",
// }

// completions.cl.callback = (response) => JSON.parse(response.text)

// // EBay
// completions.eb = {
//   alias: "eb",
//   name: "ebay",
//   search: "https://www.ebay.com/sch/i.html?_nkw=",
//   compl: "https://autosug.ebay.com/autosug?callback=0&sId=0&kwd=",
// }

// completions.eb.callback = (response) => JSON.parse(response.text).res.sug

// // Yelp
// completions.yp = {
//   alias: "yp",
//   name: "yelp",
//   search: "https://www.yelp.com/search?find_desc=",
//   compl: "https://www.yelp.com/search_suggest/v2/prefetch?prefix=",
// }

// completions.yp.callback = (response) => {
//   const res = JSON.parse(response.text).response
//   const words = []
//   res.forEach((r) => {
//     r.suggestions.forEach((s) => {
//       const w = s.query
//       if (words.indexOf(w) === -1) {
//         words.push(w)
//       }
//     })
//   })
//   return words
// }

// ****** General References, Calculators & Utilities ****** //
completions.un = {
  alias: "un",
  name: "unicode",
  search: "https://unicode-table.com/en/search/?q=",
  compl: `${localServer}/s/unicode?q=`,
  local: true,
}

completions.un.callback = (response) => {
  const res = JSON.parse(response.text).slice(0, 20)
  const titleCase = (s) => s.split(" ")
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.length > 1 ? word.slice(1) : ""}`)
    .join(" ")
  const codeSpan = (text) => `<span style="font-family: monospace; background-color: rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.4); border-radius: 5px; padding: 2px 4px; opacity: 70%">${escapeHTML(text)}</span>`
  return res.map(({ symbol, name, value }) => createSuggestionItem(`
    <span style="font-size: 2em; font-weight: bold; min-width: 1em; margin-left: 0.5em; display: inline-block">
      ${symbol}
    </span> ${codeSpan(`U+${parseInt(value, 10)}`)} ${codeSpan(`&#${parseInt(value, 16)};`)} ${escapeHTML(titleCase(name.toLowerCase()))}
`, { url: `https://unicode-table.com/en/${encodeURIComponent(value)}/`, copy: symbol }))
}

const parseDatamuseRes = (res, o = {}) => {
  const opts = {
    maxDefs: -1,
    ellipsis: false,
  }
  Object.assign(opts, o)

  return res.map((r) => {
    const defs = []
    let defsHtml = ""
    if ((opts.maxDefs <= -1 || opts.maxDefs > 0) && r.defs && r.defs.length > 0) {
      for (const d of r.defs.slice(0, opts.maxDefs <= -1 ? undefined : opts.maxDefs)) {
        const ds = d.split("\t")
        const partOfSpeech = `(${escapeHTML(ds[0])})`
        const def = escapeHTML(ds[1])
        defs.push(`<span><em>${partOfSpeech}</em> ${def}</span>`)
      }
      if (opts.ellipsis && r.defs.length > opts.maxDefs) {
        defs.push("<span><em>&hellip;</em></span>")
      }
      defsHtml = `<div>${defs.join("<br />")}</div>`
    }
    return createSuggestionItem(`
        <div>
          <div class="title"><strong>${escapeHTML(r.word)}</strong></div>
          ${defsHtml}
        </div>
    `, { url: `${opts.wordBaseURL}${r.word}` })
  })
}

// Dictionary
completions.de = {
  alias: "de",
  name: "define",
  search: "http://onelook.com/?w=",
  compl: "https://api.datamuse.com/words?md=d&sp=%s*",
  opts: {
    maxDefs: 16,
    ellipsis: true,
    wordBaseURL: "http://onelook.com/?w=",
  },
}

completions.de.callback = (response) => {
  const res = JSON.parse(response.text)
  return parseDatamuseRes(res, completions.de.opts)
}

// Thesaurus
completions.th = {
  alias: "th",
  name: "thesaurus",
  search: "https://www.onelook.com/thesaurus/?s=",
  compl: "https://api.datamuse.com/words?md=d&ml=%s",
  opts: {
    maxDefs: 3,
    ellipsis: true,
    wordBaseURL: "http://onelook.com/thesaurus/?s=",
  },
}

completions.th.callback = (response) => {
  const res = JSON.parse(response.text)
  return parseDatamuseRes(res, completions.th.opts)
}

// Wikipedia
completions.wp = {
  alias: "wp",
  name: "wikipedia",
  search: "https://en.wikipedia.org/w/index.php?search=",
  compl: "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=prefixsearch&prop=info|pageprops%7Cpageimages%7Cdescription&redirects=&ppprop=displaytitle&piprop=thumbnail&pithumbsize=100&pilimit=6&inprop=url&gpssearch=",
}

completions.wp.callback = (response) => Object.values(JSON.parse(response.text).query.pages)
  .map((p) => {
    const img = p.thumbnail ? encodeURI(p.thumbnail.source) : wpDefaultIcon
    return createSuggestionItem(
      `
      <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
        <img style="width:60px" src="${img}">
        <div>
          <div class="title"><strong>${escapeHTML(p.title)}</strong></div>
          <div class="title">${escapeHTML(p.description ?? "")}</div>
        </div>
      </div>
    `,
      { url: p.fullurl },
    )
  })

// Wikipedia - Simple English version
completions.ws = {
  alias: "ws",
  name: "wikipedia-simple",
  search: "https://simple.wikipedia.org/w/index.php?search=",
  compl: "https://simple.wikipedia.org/w/api.php?action=query&format=json&generator=prefixsearch&prop=info|pageprops%7Cpageimages%7Cdescription&redirects=&ppprop=displaytitle&piprop=thumbnail&pithumbsize=100&pilimit=6&inprop=url&gpssearch=",
  callback: completions.wp.callback,
}

// Wiktionary
completions.wt = {
  alias: "wt",
  name: "wiktionary",
  search: "https://en.wiktionary.org/w/index.php?search=",
  compl: "https://en.wiktionary.org/w/api.php?action=query&format=json&generator=prefixsearch&gpssearch=",
}

completions.wt.callback = (response) => Object.values(JSON.parse(response.text).query.pages)
  .map((p) => p.title)

// WolframAlpha
completions.wa = {
  alias: "wa",
  name: "wolframalpha",
  search: "http://www.wolframalpha.com/input/?i=",
  compl: `http://api.wolframalpha.com/v2/query?appid=${priv.keys.wolframalpha}&format=plaintext,image&output=json&reinterpret=true&input=%s`,
  priv: true,
}

completions.wa.callback = (response, { query }) => {
  const res = JSON.parse(response.text).queryresult

  if (res.error) {
    return [createSuggestionItem(`
      <div>
        <div class="title"><strong>Error</strong> (Code ${escapeHTML(res.error.code)})</div>
        <div class="title">${escapeHTML(res.error.msg)}</div>
      </div>`, { url: "https://www.wolframalpha.com/" })]
  }

  if (!res.success) {
    if (res.tips) {
      return [createSuggestionItem(`
        <div>
          <div class="title"><strong>No Results</strong></div>
          <div class="title">${escapeHTML(res.tips.text)}</div>
        </div>`, { url: "https://www.wolframalpha.com/" })]
    }
    if (res.didyoumeans) {
      return res.didyoumeans.map((s) => createSuggestionItem(`
        <div>
            <div class="title"><strong>Did you mean...?</strong></div>
            <div class="title">${escapeHTML(s.val)}</div>
        </div>`, { url: "https://www.wolframalpha.com/" }))
    }
    return [createSuggestionItem(`
      <div>
        <div class="title"><strong>Error</strong></div>
        <div class="title">An unknown error occurred.</div>
      </div>`, { url: "https://www.wolframalpha.com/" })]
  }

  const results = []
  res.pods.forEach((p) => {
    const result = {
      title: escapeHTML(p.title),
      values: [],
      url: `http://www.wolframalpha.com/input/?i=${encodeURIComponent(query)}`,
    }
    if (p.numsubpods > 0) {
      if (p.subpods[0].plaintext) {
        result.url = encodeURIComponent(p.subpods[0].plaintext)
        result.copy = p.subpods[0].plaintext
      }
      p.subpods.forEach((sp) => {
        let v = ""
        if (sp.title) {
          v = `<strong>${escapeHTML(sp.title)}</strong>: `
        }
        if (sp.img) {
          v = `
            <div>${v}</div>
            <div>
              <img
                src="${encodeURI(sp.img.src)}"
                width="${parseInt(sp.img.width, 10) ?? ""}"
                height="${parseInt(sp.img.height, 10) ?? ""}"
                style="margin-top: 6px; padding: 12px; border-radius: 12px; background: white"
              >
            </div>
          `
        } else if (sp.plaintext) {
          v = `${v}${escapeHTML(sp.plaintext)}`
        }
        if (v) {
          v = `<div class="title">${v}</div>`
        }
        result.values.push(v)
      })
    }
    if (result.values.length > 0) {
      results.push(result)
    }
  })

  return results.map((r) => createSuggestionItem(`
    <div>
      <div class="title"><strong>${r.title}</strong></div>
      ${r.values.join("\n")}
    </div>`, { url: r.url, copy: r.copy, query: r.query }))
}

// ****** Business Utilities & References ****** //

const parseCrunchbase = (response, parse) => {
  const res = JSON.parse(response.text).data.items
  if (res.length === 0) {
    return [createSuggestionItem(`
      <div>
        <div class="title"><strong>No Results</strong></div>
        <div class="title">Nothing matched your query</div>
      </div>`, { url: "https://www.crunchbase.com/" })]
  }
  const objs = res.map((obj) => parse(obj))
  return objs.map((p) => {
    const domain = p.domain ? ` | <a href="${encodeURI(`https://${p.domain}`)}" target="_blank">${escapeHTML(p.domain)}</a>` : ""
    const location = p.loc ? ` located in <em>${escapeHTML(p.loc)}</em>` : ""
    return createSuggestionItem(`
      <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
        <img style="width:60px" src="${encodeURI(p.img)}">
        <div style="display:grid;grid-template-rows:1fr 1fr 0.8fr">
          <div class="title"><strong style="font-size: 1.2em">${escapeHTML(p.name)}</strong></div>
          <div class="title" style="font-size: 1.2em">${escapeHTML(p.desc)}</div>
          <div class="title"><em>${escapeHTML(p.role)}</em>${location}${domain}</div>
        </div>
      </div>`, { url: p.url })
  })
}

// Crunchbase Organization Search
completions.co = {
  alias: "co",
  name: "crunchbase-orgs",
  search: "https://www.crunchbase.com/textsearch?q=",
  compl: `https://api.crunchbase.com/v/3/odm_organizations?user_key=${priv.keys.crunchbase}&query=%s`,
  priv: true,
}

completions.co.callback = (response) => parseCrunchbase(response, (org) => {
  const r = org.properties
  const p = {
    name: escapeHTML(r.name),
    domain: r.domain !== null ? escapeHTML(r.domain).replace(/\/$/, "") : null,
    desc: escapeHTML(r.short_description),
    role: escapeHTML(r.primary_role),
    img: cbDefaultIcon,
    loc: "",
    url: `https://www.crunchbase.com/${encodeURIComponent(r.web_path)}`,
  }

  p.loc += (r.city_name !== null) ? escapeHTML(r.city_name) : ""
  p.loc += (r.region_name !== null && p.loc !== "") ? ", " : ""
  p.loc += (r.region_name !== null) ? escapeHTML(r.region_name) : ""
  p.loc += (r.country_code !== null && p.loc !== "") ? ", " : ""
  p.loc += (r.country_code !== null) ? escapeHTML(r.country_code) : ""

  if (r.profile_image_url !== null) {
    const u = r.profile_image_url
    const img = u.slice(u.indexOf("t_api_images") + "t_api_images".length + 1)
    p.img = `https://res-4.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_100,w_100,f_auto,b_white,q_auto:eco/${encodeURIComponent(img)}`
  }

  return p
})

// Crunchbase People Search
completions.cp = {
  alias: "cp",
  name: "crunchbase-people",
  search: "https://www.crunchbase.com/app/search/?q=",
  compl: `https://api.crunchbase.com/v/3/odm_people?user_key=${priv.keys.crunchbase}&query=%s`,
  priv: true,
}

completions.cp.callback = (response) => parseCrunchbase(response, (person) => {
  const r = person.properties
  const p = {
    name: `${escapeHTML(r.first_name)} ${escapeHTML(r.last_name)}`,
    desc: "",
    img: cbDefaultIcon,
    role: "",
    loc: "",
    url: `https://www.crunchbase.com/${encodeURIComponent(r.web_path)}`,
  }

  p.desc += (r.title !== null) ? escapeHTML(r.title) : ""
  p.desc += (r.organization_name !== null && p.desc !== "") ? ", " : ""
  p.desc += (r.organization_name !== null) ? escapeHTML(r.organization_name) : ""

  p.loc += (r.city_name !== null) ? escapeHTML(r.city_name) : ""
  p.loc += (r.region_name !== null && p.loc !== "") ? ", " : ""
  p.loc += (r.region_name !== null) ? escapeHTML(r.region_name) : ""
  p.loc += (r.country_code !== null && p.loc !== "") ? ", " : ""
  p.loc += (r.country_code !== null) ? escapeHTML(r.country_code) : ""

  if (r.profile_image_url !== null) {
    const url = r.profile_image_url
    const path = url.split("/")
    const img = encodeURIComponent(path[path.length - 1])
    p.img = `http://public.crunchbase.com/t_api_images/v1402944794/c_pad,h_50,w_50/${img}`
  }

  return p
})

// ****** Search Engines ****** //

// DuckDuckGo
completions.dd = {
  alias: "dd",
  name: "duckduckgo",
  search: "https://duckduckgo.com/?q=",
  compl: "https://duckduckgo.com/ac/?q=",
}

completions.dd.callback = (response) => JSON.parse(response.text).map((r) => r.phrase)

// DuckDuckGo - I'm Feeling Lucky
completions.D = {
  alias: "D",
  name: "duckduckgo-lucky",
  search: "https://duckduckgo.com/?q=\\",
  compl: "https://duckduckgo.com/ac/?q=\\",
  callback: completions.dd.callback,
}

// DuckDuckGo Images
completions.di = {
  alias: "di",
  name: "duckduckgo-images",
  search: "https://duckduckgo.com/?ia=images&iax=images&q=",
  compl: "https://duckduckgo.com/ac/?ia=images&iax=images&q=",
  callback: completions.dd.callback,
}

// DuckDuckGo Videos
completions.dv = {
  alias: "dv",
  name: "duckduckgo-videos",
  search: "https://duckduckgo.com/?ia=videos&iax=videos&q=",
  compl: "https://duckduckgo.com/ac/?ia=videos&iax=videos&q=",
  callback: completions.dd.callback,
}

// DuckDuckGo News
completions.dn = {
  alias: "dn",
  name: "duckduckgo-news",
  search: "https://duckduckgo.com/?iar=news&ia=news&q=",
  compl: "https://duckduckgo.com/ac/?iar=news&ia=news&q=",
  callback: completions.dd.callback,
}

// DuckDuckGo Maps
completions.dm = {
  alias: "dm",
  name: "duckduckgo-maps",
  search: "https://duckduckgo.com/?ia=maps&iax=maps&iaxm=places&q=",
  compl: "https://duckduckgo.com/ac/?ia=maps&iax=maps&iaxm=places&q=",
  callback: completions.dd.callback,
}

// Google
completions.go = {
  alias: "go",
  name: "google",
  search: "https://www.google.com/search?q=",
  compl: "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=",
}

completions.go.callback = (response) => JSON.parse(response.text)[1]

// Google Images
completions.gi = {
  alias: "gi",
  name: "google-images",
  search: "https://www.google.com/search?tbm=isch&q=",
  compl: "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&ds=i&q=",
  callback: completions.go.callback,
}

// Google Images (reverse image search by URL)
completions.gI = {
  alias: "gI",
  name: "google-reverse-image",
  search: "https://www.google.com/searchbyimage?image_url=",
}

// Google - I'm Feeling Lucky
completions.G = {
  alias: "G",
  name: "google-lucky",
  search: "https://www.google.com/search?btnI=1&q=",
  compl: "https://www.google.com/complete/search?client=chrome-omni&gs_ri=chrome-ext&oit=1&cp=1&pgcl=7&q=",
  callback: completions.go.callback,
}

// Google Scholar
completions.gs = {
  alias: "gs",
  name: "google-scholar",
  search: "https://scholar.google.com/scholar?q=",
  compl: "https://scholar.google.com/scholar_complete?q=",
}

completions.gs.callback = (response) => JSON.parse(response.text).l

// Kagi
completions.ka = {
  alias: "ka",
  name: "kagi",
  search: "https://kagi.com/search?q=",
  compl: "https://kagi.com/autosuggest?q=",
  callback: (response) => JSON.parse(response.text).map((r) => {
    const u = new URL("https://kagi.com/search")
    u.searchParams.append("q", r.t)
    if (r.goto) {
      u.href = r.goto
    }

    const thumbImg = document.createElement("img")
    thumbImg.style = "width: 32px"
    thumbImg.src = r.img ? new URL(r.img, "https://kagi.com") : wpDefaultIcon

    const txtNode = document.createElement("div")
    txtNode.className = "title"
    txtNode.innerText = r.txt ?? ""

    return createSuggestionItem(
      `
      <div style="padding: 5px; display: grid; grid-template-columns: 32px 1fr; grid-gap: 15px">
        ${thumbImg.outerHTML}
        <div>
          <div class="title"><strong>${r.t}</strong></div>
          ${txtNode.outerHTML}
        </div>
      </div>
    `,
      { url: u.href },
    )
  }),
}

// //  ****** Elixir ****** //

// // Hex.pm
// completions.hx = {
//   alias: "hx",
//   name: "hex",
//   search: "https://hex.pm/packages?sort=downloads&search=",
//   compl: "https://hex.pm/api/packages?sort=downloads&hx&search=",
// }

// completions.hx.callback = (response) => JSON.parse(response.text).map((s) => {
//   let dls = ""
//   let desc = ""
//   let liscs = ""
//   if (s.downloads && s.downloads.all) {
//     dls = `[↓${escapeHTML(s.downloads.all)}] `
//   }
//   if (s.meta) {
//     if (s.meta.description) {
//       desc = escapeHTML(s.meta.description)
//     }
//     if (s.meta.licenses) {
//       s.meta.licenses.forEach((l) => {
//         liscs += `[&copy;${escapeHTML(l)}] `
//       })
//     }
//   }
//   return createSuggestionItem(`
//     <div>
//       <div class="title">${escapeHTML(s.repository)}/<strong>${escapeHTML(s.name)}</strong></div>
//       <div>${dls}${liscs}</div>
//       <div>${desc}</div>
//     </div>
//   `, { url: s.html_url })
// })

// // hexdocs
// // Same as hex but links to documentation pages
// completions.hd = {
//   alias: "hd",
//   name: "hexdocs",
//   search: "https://hex.pm/packages?sort=downloads&search=",
//   compl: "https://hex.pm/api/packages?sort=downloads&hd&search=",
// }

// completions.hd.callback = (response) => JSON.parse(response.text).map((s) => {
//   let dls = ""
//   let desc = ""
//   if (s.downloads && s.downloads.all) {
//     dls = `[↓${escapeHTML(s.downloads.all)}]`
//   }
//   if (s.meta) {
//     if (s.meta.description) {
//       desc = escapeHTML(s.meta.description)
//     }
//   }
//   return createSuggestionItem(`
//       <div>
//         <div class="title">${escapeHTML(s.repository)}/<strong>${escapeHTML(s.name)}</strong>${dls}</div>
//         <div></div>
//         <div>${desc}</div>
//       </div>
//     `, { url: `https://hexdocs.pm/${encodeURIComponent(s.name)}` })
// })

// // Exdocs
// // Similar to `hd` but searches inside docs using Google Custom Search
// completions.ex = googleCustomSearch({
//   alias: "ex",
//   name: "exdocs",
//   search: "https://hex.pm/packages?sort=downloads&ex&search=",
// })

// completions.ex.callback = (response) => JSON.parse(response.text).items.map((s) => {
//   let hash = ""

//   const snippet = s.htmlSnippet
//   const openTag = "<b>"
//   const closeTag = "</b>"
//   const openArgs = "("
//   const closeArgs = ")"

//   let f1 = snippet.indexOf(openTag)
//   if (f1 === -1) {
//     return null
//   }
//   const f2 = snippet.indexOf(closeTag)
//   if (f2 === -1) {
//     return null
//   }

//   f1 += openTag.length
//   const f3 = f2 + closeTag.length
//   const fname = snippet.slice(f1, f2)
//   const snippetEnd = snippet.slice(f3)

//   const a1 = snippetEnd.indexOf(openArgs)
//   if (a1 !== 0) {
//     return null
//   }
//   let a2 = snippetEnd.indexOf(closeArgs)
//   if (a2 === -1) {
//     return null
//   }

//   a2 += closeArgs.length
//   const fargs = snippetEnd.slice(a1, a2)
//   const fary = fargs.replace(new RegExp(openArgs + closeArgs), "").split(",").length
//   hash = escapeHTML(`${fname}/${fary}`)

//   const moduleName = escapeHTML(s.title).split(" –")[0]

//   let subtitle = ""
//   if (hash) {
//     subtitle = `
//         <div style="font-size:1.1em; line-height:1.25em">
//           <em>${moduleName}</em>.<strong>${hash}</strong>
//         </div>`
//   }
//   return createSuggestionItem(`
//       <div>
//         <div class="title"><strong>${s.htmlTitle}</strong></div>
//         ${subtitle}
//         <div>${s.htmlSnippet}</div>
//       </div>
//     `, { url: `${s.link}#${hash}` })
// }).filter((s) => s !== null)

// ****** Golang ****** //

// Golang Docs
completions.gg = googleCustomSearch({
  alias: "gg",
  name: "golang",
  domain: "golang.org",
})

// Godoc
// TODO: migrate to pkg.go.dev
// completions.gd = {
//   alias:  "gd",
//   name:   "godoc",
//   search: "https://godoc.org/?q=",
//   compl:  "https://api.godoc.org/search?q=",
// }
//
// completions.gd.callback = (response) => JSON.parse(response.text).results.map((s) => {
//   let prefix = ""
//   if (s.import_count) {
//     prefix += `[↓${s.import_count}] `
//   }
//   if (s.stars) {
//     prefix += `[★${s.stars}] `
//   }
//   return createURLItem(prefix + s.path, `https://godoc.org/${s.path}`)
// })

// // ****** Haskell ****** //

// // Hackage
// // TODO: Re-enable
// // completions.ha = {
// //   alias:  "ha",
// //   name:   "hackage",
// //   search: "https://hackage.haskell.org/packages/search?terms=",
// //   compl:  "https://hackage.haskell.org/packages/search.json?terms=",
// // }
// //
// // completions.ha.callback = (response) => JSON.parse(response.text)
// //   .map((s) => createURLItem(s.name, `https://hackage.haskell.org/package/${s.name}`))

// // Hoogle
// completions.ho = {
//   alias: "ho",
//   name: "hoogle",
//   search: "https://www.haskell.org/hoogle/?hoogle=",
//   compl: "https://www.haskell.org/hoogle/?mode=json&hoogle=",
// }
//
// completions.ha.callback = (response) => JSON.parse(response.text)
//   .map((s) => createURLItem(s.name, `https://hackage.haskell.org/package/${s.name}`))

// // Hoogle
// completions.ho = {
//   alias: "ho",
//   name: "hoogle",
//   search: "https://www.haskell.org/hoogle/?hoogle=",
//   compl: "https://www.haskell.org/hoogle/?mode=json&hoogle=",
// }

// completions.ho.callback = (response) => JSON.parse(response.text).map((s) => {
//   const pkgInfo = s.package.name && s.module.name
//     ? `<div style="font-size:0.8em; margin-bottom: 0.8em; margin-top: 0.8em">[${escapeHTML(s.package.name)}] ${escapeHTML(s.module.name)}</div>`
//     : ""
//   return createSuggestionItem(`
//       <div>
//         <div class="title" style="font-size: 1.1em; font-weight: bold">${escapeHTML(s.item)}</div>
//         ${pkgInfo}
//         <div style="padding: 0.5em">${escapeHTML(s.docs)}</div>
//       </div>
//     `, { url: s.url })
// })

// completions.ho.callback = (response) => JSON.parse(response.text).map((s) => {
//   const pkgInfo = s.package.name && s.module.name
//     ? `<div style="font-size:0.8em; margin-bottom: 0.8em; margin-top: 0.8em">[${s.package.name}] ${s.module.name}</div>`
//     : ""
//   return createSuggestionItem(`
//       <div>
//         <div class="title" style="font-size: 1.1em; font-weight: bold">${s.item}</div>
//         ${pkgInfo}
//         <div style="padding: 0.5em">${s.docs}</div>
//       </div>
//     `, { url: s.url })
// })

// // Haskell Wiki
// completions.hw = {
//   alias: "hw",
//   name: "haskellwiki",
//   search: "https://wiki.haskell.org/index.php?go=go&search=",
//   compl: "https://wiki.haskell.org/api.php?action=opensearch&format=json&formatversion=2&namespace=0&limit=10&suggest=true&search=",
// }

// completions.hw.callback = (response) => JSON.parse(response.text)[1]

// ****** HTML, CSS, JavaScript, NodeJS, ... ****** //

// caniuse
completions.ci = {
  alias: "ci",
  name: "caniuse",
  search: "https://caniuse.com/?search=",
  compl: "https://caniuse.com/process/query.php?search=",
  favicon: "https://caniuse.com/img/favicon-128.png",
}

completions.ci.getData = async () => {
  const storageKey = "completions.ci.data"
  const storedData = await localStorage.get(storageKey)
  if (storedData) {
    //   console.log("data found in localStorage", { storedData })
    return JSON.parse(storedData)
  }
  // console.log("data not found in localStorage", { storedData })
  const data = JSON.parse(await runtimeHttpRequest("https://caniuse.com/data.json"))
  // console.log({ dataRes })
  // const data = await dataRes.json()
  //
  // console.log({ data })
  localStorage.set(storageKey, JSON.stringify(data))
  return data
}

completions.ci.callback = async (response) => {
  const { featureIds } = JSON.parse(response.text)
  const allData = await completions.ci.getData()
  // console.log("featureIds", featureIds)
  // console.log("allData", allData)
  return featureIds.map((featId) => {
    const feat = allData.data[featId]
    return feat
      ? createSuggestionItem(`
          <div>
            <div class="title"><strong>${escapeHTML(feat.title)}</strong></div>
            <div>${escapeHTML(feat.description)}</div>
          </div>
        `, { url: "https://caniuse.com/?search=" })
      : null
  })
    .filter(Boolean)

  // const [allDataRes, featureDataRes] = await Promise.all([
  //   completions.ci.getData(),
  //   fetch(`https://caniuse.com/process/get_feat_data.php?type=support-data&feat=${featureIds.join(",")}`),
  // ])
  // const featureData = await featureDataRes.json()
  // console.log("featureIds", featureIds)
  // console.log("featureData", featureData)
  // return featureData.map((feat) =>
  //   createSuggestionItem(`
  //     <div>
  //       <span>${feat.description ?? feat.title ?? ""}</span>
  //     </div>
  //   `, { url: "https://caniuse.com/?search=" }))
}

// jQuery API documentation
completions.jq = googleCustomSearch({
  alias: "jq",
  name: "jquery",
  domain: "jquery.com",
})

// NodeJS standard library documentation
completions.no = googleCustomSearch({
  alias: "no",
  name: "node",
  domain: "nodejs.org",
})

// Mozilla Developer Network (MDN)
completions.md = {
  alias: "md",
  name: "mdn",
  search: "https://developer.mozilla.org/search?q=",
  compl: "https://developer.mozilla.org/api/v1/search?q=",
}

completions.md.callback = (response) => {
  // console.log({response})
  const res = JSON.parse(response.text)
  return res.documents.map((s) =>
    createSuggestionItem(`
      <div>
        <div class="title"><strong>${escapeHTML(s.title)}</strong></div>
        <div style="font-size:0.8em"><em>${escapeHTML(s.slug)}</em></div>
        <div>${escapeHTML(s.summary)}</div>
      </div>
    `, { url: `https://developer.mozilla.org/${encodeURLComponent(s.locale)}/docs/${encodeURIComponent(s.slug)}` }))
}

// NPM registry search
completions.np = {
  alias: "np",
  name: "npm",
  search: "https://www.npmjs.com/search?q=",
  compl: "https://api.npms.io/v2/search/suggestions?size=20&q=",
  favicon: getDuckduckgoFaviconUrl("https://www.npmjs.com"),
}

completions.np.callback = (response) => JSON.parse(response.text)
  .map((s) => {
    let flags = ""
    let desc = ""
    let date = ""
    if (s.package.description) {
      desc = escapeHTML(s.package.description)
    }
    if (s.flags) {
      Object.keys(s.flags).forEach((f) => {
        flags += `[<span style='color:#ff4d00'>⚑</span> ${escapeHTML(f)}] `
      })
    }
    if (s.package.date) {
      date = prettyDate(new Date(s.package.date))
    }
    return createSuggestionItem(`
      <div>
        <style>
          .title > em {
            font-weight: bold;
          }
        </style>
        <div>
          <span class="title">${s.highlight}</span>
          <span style="font-size: 0.8em">v${escapeHTML(s.package.version)}</span>
        </div>
        <div>
          <span>${date}</span>
          <span>${flags}</span>
        </div>
        <div>${desc}</div>
      </div>
    `, { url: s.package.links.npm })
  })

// ****** Social Media & Entertainment ****** //

// Hacker News (YCombinator)
completions.hn = {
  alias: "hn",
  name: "hackernews",
  domain: "news.ycombinator.com",
  search: "https://hn.algolia.com/?query=",
  compl: "https://hn.algolia.com/api/v1/search?tags=(story,comment)&query=",
}

completions.hn.callback = (response) => {
  const res = JSON.parse(response.text)
  return res.hits.map((s) => {
    let title = ""
    let prefix = ""
    if (s.points) {
      prefix += `[↑${escapeHTML(s.points)}] `
    }
    if (s.num_comments) {
      prefix += `[↲${escapeHTML(s.num_comments)}] `
    }
    switch (s._tags[0]) {
      case "story":
        title = s.title
        break
      case "comment":
        title = s.comment_text
        break
      default:
        title = s.objectID
    }
    const url = `https://news.ycombinator.com/item?id=${encodeURIComponent(s.objectID)}`
    return createSuggestionItem(`
      <div>
        <div class="title">${prefix}${escapeHTML(title)}</div>
        <div class="url">${encodeURI(url)}</div>
      </div>
    `, { url })
  })
}

// Twitter
completions.tw = {
  alias: "tw",
  name: "twitter",
  search: "https://twitter.com/search?q=",
  compl: "https://duckduckgo.com/ac/?q=twitter%20",
}

completions.tw.callback = (response, { query }) => {
  const results = JSON.parse(response.text).map((r) => {
    const q = r.phrase.replace(/^twitter /, "")
    return createURLItem(q, `https://twitter.com/search?q=${encodeURIComponent(q)}`)
  })
  if (query.length >= 2 && query.match(/^@/)) {
    results.unshift(createURLItem(query, `https://twitter.com/${encodeURIComponent(query.replace(/^@/, ""))}`))
  }
  return results
}

// Reddit
completions.re = {
  alias: "re",
  name: "reddit",
  search: "https://www.reddit.com/search?sort=relevance&t=all&q=",
  compl: "https://api.reddit.com/search?syntax=plain&sort=relevance&limit=20&q=",
}

completions.re.thumbs = {
  default: "https://i.imgur.com/VCm94xa.png",
  image: "https://i.imgur.com/OaAUUaQ.png",
  nsfw: "https://i.imgur.com/lnmJrXP.png",
  self: "https://i.imgur.com/KQ8uYZz.png",
  spoiler: "https://i.imgur.com/gx2tGsv.png",
}

completions.re.callback = async (response, { query }) => {
  const [_, sub, __, q = ""] = query.match(/^\s*\/?(r\/[a-zA-Z0-9]+)(\s+(.*))?/) ?? [null, null, null, query]
  if (sub && q) {
    response = {
      text: await runtimeHttpRequest(`https://api.reddit.com/${encodeURIComponent(sub)}/search?syntax=plain&sort=relevance&restrict_sr=on&limit=20&q=${encodeURIComponent(q)}`)
    }
  } else if (sub) {
    const res = await runtimeHttpRequest(`https://www.reddit.com/api/search_reddit_names.json?typeahead=true&exact=false&query=${encodeURIComponent(sub)}`)
    return JSON.parse(res).names.map((name) => createURLItem(`r/${name}`, `https://reddit.com/r/${encodeURIComponent(name)}`, { query: `r/${name}` }))
  }
  return JSON.parse(response.text).data.children.map(({ data }) => {
    const thumb = data.thumbnail?.match(/^https?:\/\//) ? data.thumbnail : completions.re.thumbs[data.thumbnail] ?? completions.re.thumbs["default"]
    const relDate = prettyDate(new Date(parseInt(data.created, 10) * 1000))
    return createSuggestionItem(`
        <div style="display: flex; flex-direction: row">
          <img style="width: 70px; height: 50px; margin-right: 0.8em" alt="thumbnail" src="${encodeURI(thumb)}">
          <div>
            <div>
              <strong><span style="font-size: 1.2em; margin-right: 0.2em">↑</span>${escapeHTML(data.score)}</strong> ${escapeHTML(data.title)} <span style="font-size: 0.8em; color: rgba(0,0,0,0.5)">(${escapeHTML(data.domain)})</span>
            </div>
            <div>
              <span style="font-size: 0.8em"><span style="color: rgba(0,0,0,0.7)">r/${escapeHTML(data.subreddit)}</span> • <span style="color: rgba(0,0,0,0.7)">${parseInt(data.num_comments, 10) ?? "unknown"}</span> <span style="color: rgba(0,0,0,0.5)">comments</span> • <span style="color: rgba(0,0,0,0.5)">submitted ${relDate} by</span> <span style="color: rgba(0,0,0,0.7)">${escapeHTML(data.author)}</span></span>
            </div>
          </div>
        </div>
      `, { url: `https://reddit.com${encodeURIComponent(data.permalink)}` })
  })
}

// YouTube
completions.yt = {
  alias: "yt",
  name: "youtube",
  search: "https://www.youtube.com/search?q=",
  compl: `https://www.googleapis.com/youtube/v3/search?maxResults=20&part=snippet&type=video,channel&key=${priv.keys.google_yt}&safeSearch=none&q=`,
  priv: true,
}

completions.yt.callback = (response) => JSON.parse(response.text).items
  .map((s) => {
    const thumb = s.snippet.thumbnails.default
    switch (s.id.kind) {
      case "youtube#channel":
        return createSuggestionItem(`
          <div style="display: flex; flex-direction: row">
            <img style="width: ${parseInt(thumb.width ?? 120, 10)}px; height: ${parseInt(thumb.height ?? 90, 10)}px; margin-right: 0.8em" alt="thumbnail" src="${encodeURI(thumb.url)}">
            <div>
              <div>
                <strong>${escapeHTML(s.snippet.channelTitle)}</strong>
              </div>
              <div>
                <span>${escapeHTML(s.snippet.description)}</span>
              </div>
              <div>
                <span style="font-size: 0.8em"><span style="color: rgba(0,0,0,0.7)">channel</span></span>
              </div>
            </div>
          </div>
        `, { url: `https://youtube.com/channel/${s.id.channelId}` })
      case "youtube#video":
        const relDate = prettyDate(new Date(s.snippet.publishTime))
        return createSuggestionItem(`
          <div style="display: flex; flex-direction: row">
            <img style="width: ${parseInt(thumb.width ?? 120, 10)}px; height: ${parseInt(thumb.height ?? 90, 10)}px; margin-right: 0.8em" alt="thumbnail" src="${encodeURI(thumb.url)}">
            <div>
              <div>
                <strong>${escapeHTML(s.snippet.title)}</strong>
              </div>
              <div>
                <span>${escapeHTML(s.snippet.description)}</span>
              </div>
              <div>
                <span style="font-size: 0.8em"><span style="color: rgba(0,0,0,0.7)">video</span> <span style="color: rgba(0,0,0,0.5)">by</span> <span style="color: rgba(0,0,0,0.7)">${escapeHTML(s.snippet.channelTitle)}</span> • <span style="color: rgba(0,0,0,0.7)">${escapeHTML(relDate)}</span></span>
              </div>
            </div>
          </div>
        `, { url: `https://youtu.be/${encodeURIComponent(s.id.videoId)}` })
      default:
        return null
    }
  }).filter((s) => s !== null)

// Baidu
completions.bd = {
  alias: "bd",
  name: "baidu",
  search: "https://www.baidu.com/s?wd=",
  compl: "https://www.baidu.com/sugrec?ie=utf-8&json=1&prod=pc&from=pc_web&wd=",
}

completions.bd.callback = (response) => JSON.parse(response.text).g.map((s) => s.q)

// Bing
completions.bi = {
  alias: "bi",
  name: "bing",
  search: "https://www.bing.com/search?setmkt=en-us&setlang=en-us&q=",
  compl: "https://api.bing.com/osjson.aspx?query=",
}

completions.bi.callback = (response) => JSON.parse(response.text)[1]

// Douban
completions.db = {
  alias: "db",
  name: "douban",
  search: "https://www.douban.com/search?source=suggest&q=",
  compl: "https://www.douban.com/j/search_suggest?q=",
}

completions.db.callback = (response) => {
  const res = JSON.parse(response.text)
  const cards = res.cards;
  const words = res.words;
  let cardItems = cards.map((card) => {
    const url = card.url;
    return createSuggestionItem(`
      <div style="padding:5px;display:grid;grid-template-columns:60px 1fr;grid-gap:15px">
        <img style="width:60px" src="${card.cover_url}" alt="${escapeHTML(card.title)}">
        <div>
          <div class="title"><strong>${card.title}</strong> ${card.year ? `${card.year}` : ''}</div>
          ${card.card_subtitle}
        </div>
      </div>

    `, { url })
  })
  return cardItems.concat(words);
}

// Weibo
completions.wb = {
  alias: "wb",
  name: "weibo",
  search: "https://s.weibo.com/weibo/",
  compl: "https://s.weibo.com/Ajax_Search/suggest?where=weibo&type=weibo&key=",
}

completions.wb.callback = (response) => {
  const res = JSON.parse(response.text)
  if (res.code !== 100000) {
    return [];
  }
  return res.data.map((d) => {
    return d.suggestion;
  });
}

// Weixin
completions.wx = {
  alias: "wx",
  name: "weixin",
  search: "https://weixin.sogou.com/weixin?type=2&query=",
  compl: "https://weixin.sogou.com/sugg/ajaj_json.jsp?type=wxart&pr=web&key=",
}

completions.wx.callback = (response) => {
  const sIdx = response.text.indexOf("[");
  const eIdx = response.text.lastIndexOf("]");
  const res = JSON.parse(response.text.substring(sIdx, eIdx + 1))
  return res[1];
}

// Douyin
completions.dy = {
  alias: "dy",
  name: "douyin",
  search: "https://www.douyin.com/search/",
  compl: "https://www.douyin.com/aweme/v1/web/search/sug/?device_platform=webapp&aid=6383&channel=channel_pc_web&source=aweme_video_web&keyword=",
}

completions.dy.callback = (response) => JSON.parse(response.text).sug_list.map((s) => s.content)

// SMZDM
completions.sm = {
  alias: "sm",
  name: "smzdm",
  search: "https://search.smzdm.com/?c=home&s=",
  compl: "https://search.smzdm.com/ajax/suggestion/suggestion_jsonp?callback=jQuery&keyword=",
}

completions.sm.callback = (response) => {
  const sIdx = response.text.indexOf("{");
  const eIdx = response.text.lastIndexOf("}");
  const res = JSON.parse(response.text.substring(sIdx, eIdx + 1))
  if (res.error_code !== 0) {
    return [];
  }
  return res.data;
}

export default completions
