import conf from "./conf.js"
import help from "./help.js"
import api from "./api.js"
import util from "./util.js"

const { categories } = help
const {
  mapkey,
  map,
  unmap,
  Clipboard,
  Front,
  removeSearchAlias,
  addSearchAlias,
  searchSelectedWith,
  vmapkey,
} = api

const registerKey = (domain, mapObj, siteleader) => {
  const {
    alias,
    callback,
    leader = (domain === "global") ? "" : siteleader,
    category = categories.misc,
    description = "",
    path = "(/.*)?",
  } = mapObj
  const opts = {}

  const key = `${leader}${alias}`

  if (domain !== "global") {
    const d = domain.replace(".", "\\.")
    opts.domain = new RegExp(`^http(s)?://(([a-zA-Z0-9-_]+\\.)*)(${d})${path}`)
  }

  const fullDescription = `#${category} ${description}`

  if (typeof mapObj.map !== "undefined") {
    map(alias, mapObj.map)
  } else {
    mapkey(key, fullDescription, callback, opts)
  }
}

const registerKeys = (maps, aliases, siteleader) => {
  const hydratedAliases = Object.entries(aliases)
    .flatMap(([baseDomain, aliasDomains]) =>
      aliasDomains.flatMap((a) => ({ [a]: maps[baseDomain] })))

  const mapsAndAliases = Object.assign({}, maps, ...hydratedAliases)

  Object.entries(mapsAndAliases).forEach(([domain, domainMaps]) =>
    domainMaps.forEach((mapObj) =>
      registerKey(domain, mapObj, siteleader)))
}

const registerSearchEngines = (searchEngines, searchleader) =>
  Object.values(searchEngines).forEach((s) => {
    const options = {
      favicon_url: s.favicon,
      skipMaps: true,
    }
    addSearchAlias(
      s.alias,
      s.name,
      s.search,
      "",
      s.compl,
      s.callback,
      undefined,
      options,
    )
    mapkey(`${searchleader}${s.alias}`, `#8Search ${s.name}`, () => Front.openOmnibar({ type: "SearchEngine", extra: s.alias }))
    mapkey(`c${searchleader}${s.alias}`, `#8Search ${s.name} with clipboard contents`, () => {
      Clipboard.read((c) => {
        Front.openOmnibar({ type: "SearchEngine", pref: c.data, extra: s.alias })
      })
    })
  })

const invokeSalaDict = () => {
  let sel = document.getSelection();
  if (!(sel.focusNode && sel.focusNode.textContent)) {
    return
  }

  let wordRng = util.getNearestWord(sel.focusNode.textContent, sel.focusOffset);
  let sOffset = wordRng[0]
  let eOffset = wordRng[0] + wordRng[1]
  if (eOffset <= sOffset) {
    return
  }
  let rng = document.createRange();
  rng.setStart(sel.anchorNode, sOffset);
  rng.setEnd(sel.focusNode, eOffset);
  sel.removeAllRanges();
  sel.addRange(rng);


  let cursor = document.querySelector("div.surfingkeys_cursor");
  let left = parseFloat(cursor.style.left);
  let top = parseFloat(cursor.style.top);
  let height = parseFloat(cursor.style.height);
  let fixedNodes = document.elementsFromPoint(left, top);
  let node = cursor;
  if (fixedNodes.length >= 2) {
    node = fixedNodes[1];
  }

  let downEvt = new MouseEvent('mousedown', {
    clientX: left,
    clientY: top + height / 2,
  });
  let upEvt = new MouseEvent('mouseup', {
    clientX: left,
    clientY: top + height / 2,
  });
  let clickEvt = new MouseEvent('click', {
    clientX: left,
    clientY: top + height / 2,
  });
  let dblClickEvt = new MouseEvent('dblclick', {
    clientX: left,
    clientY: top + height / 2,
  });
  // simulate double click
  node.dispatchEvent(downEvt);
  node.dispatchEvent(upEvt);
  node.dispatchEvent(clickEvt);
  node.dispatchEvent(downEvt);
  node.dispatchEvent(upEvt);
  node.dispatchEvent(clickEvt);
  node.dispatchEvent(dblClickEvt);

  // set a timeout callback to close SalaDict panel.
  setTimeout(() => {
    let saladict = document.querySelector("div.saladict-panel")
    function _removeSalaDict(e) {
      if (e.key === "Escape") {
        document.querySelector("#saladict-dictpanel-root > div").shadowRoot.querySelector("div.dictPanel-Head button[title='关闭查词面板']").click()
        document.body.removeEventListener("keyup", _removeSalaDict);
      }
    }
    if (saladict !== null) {
      document.body.addEventListener(
        "keyup",
        _removeSalaDict
      );
    }
  }, 1000)
}

const main = async () => {
  window.surfingKeys = api
  if (conf.settings) {
    Object.assign(
      settings,
      typeof conf.settings === "function" ? conf.settings() : conf.settings,
    )
  }

  if (conf.logLevels) {
    await chrome.storage.local.set({
      logLevels: conf.logLevels,
    })
  }

  if (conf.keys && conf.keys.unmaps) {
    const { unmaps } = conf.keys
    if (unmaps.mappings) {
      unmaps.mappings.forEach((m) => unmap(m))
    }
    if (unmaps.searchAliases) {
      Object.entries(unmaps.searchAliases).forEach(([leader, items]) => {
        items.forEach((v) => removeSearchAlias(v, leader))
      })
    }
  }

  if (conf.searchEngines) {
    registerSearchEngines(conf.searchEngines, conf.searchleader ?? "o")
  }

  if (conf.keys && conf.keys.maps) {
    const { keys } = conf
    const { maps, aliases = {} } = keys
    registerKeys(maps, aliases, conf.siteleader)

    maps.searchSelectedWith.map((entry) => {
      const se = conf.searchEngines[entry.alias]["search"]
      const name = conf.searchEngines[entry.alias]["name"]
      const category = categories.searchSelectedWith;
      const fullDescription = `#${category} search selected text with ${name}`
      vmapkey('s' + entry.key, fullDescription, () => { searchSelectedWith(se, false, false, entry.alias) });
    })
  }
  vmapkey('q', `#${categories.visualMode} translate with saladict`, invokeSalaDict);

}

if (typeof window !== "undefined") {
  main()
}
