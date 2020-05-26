function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  const regex = new RegExp(`[\\?&]${name}=([^&#]*)`);
  const results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function setQueryStringParameter(name, value) {
  // console.log("name", name, "value", value);
  const params = new URLSearchParams(window.location.search);
  params.set(name, value);
  window.history.replaceState(
    {},
    "",
    decodeURIComponent(`${window.location.pathname}?${params}`)
  );
}

const initTypeAhead = (list, css_sel, name, callback) => {
  const bh = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: list,
    sufficient: 20,
    identify(obj) {
      return obj;
    },
  });
  function bhDefaults(q, sync) {
    if (q === "" && name == "session") {
      sync(bh.all()); // This is the only change needed to get 'ALL' items as the defaults
    } else {
      bh.search(q, sync);
    }
  }

  // remove old
  $(css_sel)
    .typeahead("destroy")
    .off("keydown")
    .off("typeahead:selected")
    .val("");

  $(css_sel)
    .typeahead(
      {
        hint: true,
        highlight: true /* Enable substring highlighting */,
        minLength: 0 /* Specify minimum characters required for showing suggestions */,
        limit: 20,
      },
      { name, source: bhDefaults }
    )
    .on("keydown", function (e) {
      if (e.which === 13) {
        // e.preventDefault();
        callback(e, e.target.value);
        $(css_sel).typeahead("close");
      }
    })
    .on("typeahead:selected", function (evt, item) {
      callback(evt, item);
    });

  $(`${css_sel}_clear`).on("click", function () {
    $(css_sel).val("");
    callback(null, "");
  });
};

const setTypeAhead = (subset, allKeys, filters, render) => {
  Object.keys(filters).forEach((k) => (filters[k] = null));

  initTypeAhead(allKeys[subset], ".typeahead_all", subset, (e, it) => {
    setQueryStringParameter("search", it);
    filters[subset] = it.length > 0 ? it : null;
    render();
  });
};

const calcAllKeys = function (allPapers, allKeys) {
  const collectAuthors = new Set();
  const collectKeywords = new Set();
  const collectSessions = new Set();

  allPapers.forEach((d) => {
    d.content.authors.forEach((a) => collectAuthors.add(a));
    d.content.keywords.forEach((a) => collectKeywords.add(a));
    d.content.session.forEach((a) => collectSessions.add(a));
    allKeys.titles.push(d.content.title);
  });
  allKeys.authors = Array.from(collectAuthors);
  allKeys.keywords = Array.from(collectKeywords);
  allKeys.session = Array.from(collectSessions);
  allKeys.session.sort();
};
