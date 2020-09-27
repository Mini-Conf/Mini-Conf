let allPapers = [];
const allKeys = {
  authors: [],
  keywords: [],
  sessions: [],
  titles: [],
};
const filters = {
  authors: null,
  keywords: null,
  session: null,
  title: null,
};

// names for render modes
const MODE = {
  mini: "mini",
  compact: "compact",
  detail: "detail"
}


let render_mode = MODE.compact;

const updateCards = (papers) => {
  Promise.all([
    API.markGetAll(API.storeIDs.visited),
    API.markGetAll(API.storeIDs.bookmarked)
  ]).then(
    ([visitedPapers, bookmarks]) => {

      papers.forEach((paper) => {
        paper.UID = paper.UID;
        paper.read = visitedPapers[paper.UID] || false;
        paper.bookmarked = bookmarks[paper.UID] || false;
      });

      const visitedCard = (iid, new_value) => {
        API.markSet(API.storeIDs.visited, iid, new_value).then();
      };

      const bookmarkedCard = (iid, new_value) => {
        API.markSet(API.storeIDs.bookmarked, iid, new_value).then();
      };


      const all_mounted_cards = d3
        .select(".cards")
        .selectAll(".myCard", (paper) => paper.UID)
        .data(papers, (d) => d.number)
        .join("div")
        .attr("class", "myCard col-xs-6 col-md-4")
        .html(card_html);

      all_mounted_cards.select(".card-title").on("click", function (d) {
        const iid = d.UID;
        // to avoid hierarchy issues, search for card again
        all_mounted_cards
          .filter((dd) => dd.UID === iid)
          .select(".checkbox-paper")
          .classed("selected", function () {
            const new_value = true; //! d3.select(this).classed('not-selected');
            visitedCard(iid, new_value);
            return new_value;
          });
      });

      all_mounted_cards.select(".checkbox-paper").on("click", function (d) {
        const new_value = !d3.select(this).classed("selected");
        visitedCard(d.UID, new_value);
        d3.select(this).classed("selected", new_value);
      });

      all_mounted_cards.select(".checkbox-bookmark").on("click", function (d) {
        const new_value = !d3.select(this).classed("selected");
        bookmarkedCard(d.UID, new_value);
        d3.select(this).classed("selected", new_value);
      });


      lazyLoader();


    }
  )
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

const render = () => {
  const f_test = [];

  updateSession();

  Object.keys(filters).forEach((k) => {
    filters[k] ? f_test.push([k, filters[k]]) : null;
  });

  // console.log(f_test, filters, "--- f_test, filters");
  if (f_test.length === 0) updateCards(allPapers);
  else {
    const fList = allPapers.filter((d) => {
      let i = 0;
      let pass_test = true;
      while (i < f_test.length && pass_test) {
        if (f_test[i][0] === "titles") {
          pass_test &=
            d.title.toLowerCase().indexOf(f_test[i][1].toLowerCase()) >
            -1;
        } else if (f_test[i][0] === "session") {
          pass_test &= d["sessions"].indexOf(f_test[i][1]) > -1;
        } else {
          pass_test &= d[f_test[i][0]].indexOf(f_test[i][1]) > -1;
        }
        i++;
      }
      return pass_test;
    });
    // console.log(fList, "--- fList");
    updateCards(fList);
  }
};

const updateFilterSelectionBtn = (value) => {
  d3.selectAll(".filter_option label").classed("active", function () {
    const v = d3.select(this).select("input").property("value");
    return v === value;
  });
};

const updateSession = () => {
  const urlSession = getUrlParameter("session");
  if (urlSession) {
    filters.session = urlSession;
    d3.select("#session_name").text(urlSession);
    d3.select(".session_notice").classed("d-none", null);
    return true;
  }
  filters.session = null;
  return false;
};

/**
 * START here and load JSON.
 */
const start = () => {
  const urlFilter = getUrlParameter("filter") || "keywords";
  setQueryStringParameter("filter", urlFilter);
  updateFilterSelectionBtn(urlFilter);

  Promise.all([API.getPapers(), API.getConfig()])
    .then(([papers, config]) => {
      console.log(papers, "--- papers");

      // persistor = new Persistor("miniconf-" + config.name);

      shuffleArray(papers);

      allPapers = papers;
      calcAllKeys(allPapers, allKeys);
      setTypeAhead(urlFilter, allKeys, filters, render);
      updateCards(allPapers);

      const urlSearch = getUrlParameter("search");
      if (urlSearch !== "" || updateSession()) {
        filters[urlFilter] = urlSearch;
        $(".typeahead_all").val(urlSearch);
        render();
      }
    })
    .catch((e) => console.error(e));
};

/**
 * VIEW EVENTS (card events are in updateCards() )
 * * */

d3.selectAll(".filter_option input").on("click", function () {
  const me = d3.select(this);

  const filter_mode = me.property("value");
  setQueryStringParameter("filter", filter_mode);
  setQueryStringParameter("search", "");
  updateFilterSelectionBtn(filter_mode);

  setTypeAhead(filter_mode, allKeys, filters, render);
  render();
});

d3.selectAll(".remove_session").on("click", () => {
  setQueryStringParameter("session", "");
  render();
});

d3.selectAll(".render_option input").on("click", function () {
  const me = d3.select(this);
  render_mode = me.property("value");

  render();
});

d3.select(".reshuffle").on("click", () => {
  shuffleArray(allPapers);

  render();
});

/**
 * CARDS
 */

const keyword = (kw) => `<a href="papers.html?filter=keywords&search=${kw}"
                       class="text-secondary text-decoration-none">${kw.toLowerCase()}</a>`;

const card_image = (paper, show) => {
  if (show)
    return ` <center><img class="lazy-load-img cards_img" data-src="${API.thumbnailPath(paper)}" width="80%"/></center>`;
  return "";
};

const card_detail = (paper, show) => {
  if (show)
    return ` 
     <div class="pp-card-header" style="overflow-y: auto;">
     <div style="width:100%; ">
        <p class="card-text"><span class="font-weight-bold">Keywords:</span>
            ${paper.keywords.map(keyword).join(", ")}
        </p>
        <p class="card-text"> ${paper.TLDR}</p>
        </div>
    </div>
`;
  return "";
};

const card_time_small = (paper, show) => {
  const cnt = paper;
  return show
    ? `
<!--    <div class="pp-card-footer">-->
    <div class="text-center" style="margin-top: 10px;">
    ${cnt.sessions
      .filter((s) => s.match(/.*[0-9]/g))
      .map(
        (s, i) =>
          `<a class="card-subtitle text-muted" href="?session=${encodeURIComponent(
            s
          )}">${s.replace("Session ", "")}</a> ${card_live(
            cnt.session_links[i]
          )} ${card_cal(paper, i)} `
      )
      .join(", ")}
    </div>
<!--    </div>-->
    `
    : "";
};

const card_icon_video = icon_video(16);
const card_icon_cal = icon_cal(16);

const card_live = (link) =>
  `<a class="text-muted" href="${link}">${card_icon_video}</a>`;
const card_cal = (paper, i) =>
  `<a class="text-muted" href="${API.posterICS(paper,i)}">${card_icon_cal}</a>`;

const card_time_detail = (paper, show) => {
  return show ? `
<!--    <div class="pp-card-footer">-->
    <div class="text-center text-monospace small" style="margin-top: 10px;">
    ${paper.sessions.filter(s => s.match(/.*[0-9]/g))
    .map((s, i) => `${s} ${paper.session_times[i]} ${card_live(
      paper.session_links[i])}   `)
    .join('<br>')}
    </div>
<!--    </div>-->
    ` : '';
}

// language=HTML
const card_html = (paper) =>
  `
        <div class="pp-card pp-mode-${render_mode} ">
            <div class="pp-card-header" style="">
            <div class="checkbox-paper far ${paper.read ? "selected" : ""}" 
            style="display: block;position: absolute; bottom:${render_mode === MODE.detail ? 375 : 35}px;left: 35px;">&#xf058;</div>
            <div class="checkbox-bookmark fas  ${paper.bookmarked ? "selected" : ""}" 
            style="display: block;position: absolute; top:-5px;right: 25px;">&#xf02e;</div>
            
<!--                ✓-->
                <a href="${API.posterLink(paper)}"
                target="_blank"
                   class="text-muted">
                   <h5 class="card-title" align="center"> ${
    paper.title
  } </h5></a>
                <h6 class="card-subtitle text-muted" align="center">
                        ${paper.authors.join(", ")}
                </h6>
                ${card_image(paper, render_mode !== MODE.mini)}
                
            </div>
               
                ${card_detail(paper, render_mode === MODE.detail)}
        </div>`;
