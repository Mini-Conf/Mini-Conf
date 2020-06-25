let allPapers = [];
const allKeys = {
    authors: [],
    keywords: [],
    session: [],
    titles: [],
}
const filters = {
    authors: null,
    keywords: null,
    session: null,
    title: null,
};

let render_mode = 'compact';

const persistor = new Persistor('Mini-Conf-Papers');

const updateCards = (papers) => {
    const storedPapers = persistor.getAll();
    papers.forEach(
      openreview => {
          openreview.content.read = storedPapers[openreview.id] || false
      })

    const readCard = (iid, new_value) => {
        persistor.set(iid, new_value);
        // storedPapers[iid] = new_value ? 1 : null;
        // Cookies.set('papers-selected', storedPapers, {expires: 365});
    }

    const all_mounted_cards = d3.select('.cards')
      .selectAll('.myCard', openreview => openreview.id)
      .data(papers, d => d.number)
      .join('div')
      .attr('class', 'myCard col-xs-6 col-md-4')
      .html(card_html)

    all_mounted_cards.select('.card-title')
      .on('click', function (d) {
          const iid = d.id;
          all_mounted_cards.filter(d => d.id === iid)
            .select(".checkbox-paper").classed('selected', function () {
              const new_value = true;//!d3.select(this).classed('not-selected');
              readCard(iid, new_value);
              return new_value;
          })
      })

    all_mounted_cards.select(".checkbox-paper")
      .on('click', function (d) {
          const iid = d.id;
          const new_value = !d3.select(this).classed('selected');
          readCard(iid, new_value);
          d3.select(this).classed('selected', new_value)
      })


    lazyLoader();
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

    Object.keys(filters)
      .forEach(k => {filters[k] ? f_test.push([k, filters[k]]) : null})

    //  console.log(f_test, filters, "--- f_test, filters");
    if (f_test.length === 0) updateCards(allPapers)
    else {
        const fList = allPapers.filter(
          d => {

              let i = 0, pass_test = true;
              while (i < f_test.length && pass_test) {
                  if (f_test[i][0] === 'titles') {
                      pass_test &= d.content['title'].toLowerCase()
                        .indexOf(f_test[i][1].toLowerCase()) > -1;

                  } else {
                      if (f_test[i][0] === 'session' || f_test[i][0] === 'sessions' ) {
                          pass_test &= d.content['sessions'].some(
                              function (item) {
                                  return item.session_name === f_test[i][1];
                              }
                          );
                      } else {
                          console.log(f_test[i])
                          pass_test &= d.content[f_test[i][0]].indexOf(
                            f_test[i][1]) > -1
                      }
                  }
                  i++;
              }
              return pass_test;
          });
        // console.log(fList, "--- fList");
        updateCards(fList)
    }

}

const updateFilterSelectionBtn = value => {
    d3.selectAll('.filter_option label')
      .classed('active', function () {
          const v = d3.select(this).select('input').property('value')
          return v === value;
      })
}

const updateSession = () => {
    const urlSession = getUrlParameter("session");
    if (urlSession) {
        filters['session'] = urlSession
        d3.select('#session_name').text(urlSession);
        d3.select('.session_notice').classed('d-none', null);
        return true;
    } else {
        filters['session'] = null
        return false;
    }
}

/**
 * START here and load JSON.
 */
const start = (path_to_papers_json) => {
    // const urlFilter = getUrlParameter("filter") || 'keywords';
    const urlFilter = getUrlParameter("filter") || 'titles';
    setQueryStringParameter("filter", urlFilter);
    updateFilterSelectionBtn(urlFilter);


    d3.json(path_to_papers_json).then(papers => {
        shuffleArray(papers);

        allPapers = papers;
        calcAllKeys(allPapers, allKeys);
        setTypeAhead(urlFilter,
          allKeys, filters, render);
        updateCards(allPapers);


        const urlSearch = getUrlParameter("search");
        if ((urlSearch !== '') || updateSession()) {
            filters[urlFilter] = urlSearch;
            $('.typeahead_all').val(urlSearch);
            render();
        }


    }).catch(e => console.error(e))
};


/**
 * EVENTS
 * **/

d3.selectAll('.filter_option input').on('click', function () {
    const me = d3.select(this);

    const filter_mode = me.property('value');
    setQueryStringParameter("filter", filter_mode);
    setQueryStringParameter("search", '');
    updateFilterSelectionBtn(filter_mode);


    setTypeAhead(filter_mode, allKeys, filters, render);
    render();
});

d3.selectAll('.remove_session').on('click', () => {
    setQueryStringParameter("session", '');
    render();

});

d3.selectAll('.render_option input').on('click', function () {
    const me = d3.select(this);
    render_mode = me.property('value');

    render();
});

d3.select('.reshuffle').on('click', () => {
    shuffleArray(allPapers);

    render();
})

/**
 * CARDS
 */

const keyword = kw => `<a href="papers.html?filter=keywords&search=${kw}"
                       class="text-secondary text-decoration-none">${kw.toLowerCase()}</a>`;

const card_image = (openreview, show) => {
    if (show) return ` <center><img class="lazy-load-img cards_img" data-src="static/images/acl2020/papers/${openreview.id}.png" width="80%"/></center>`
    else return ''
};

const card_detail = (openreview, show) => {
    if (show)
        return ` 
     <div class="pp-card-header">
        <p class="card-text"> ${openreview.content.tldr}</p>
        <!--<p class="card-text"><span class="font-weight-bold">Keywords:</span>
            ${openreview.content.keywords.map(keyword).join(', ')}
        </p>-->
    </div>
`
    else return ''
};

//language=HTML
const card_html = openreview => `
        <div class="pp-card pp-mode-` + render_mode + ` ">
            <div class="pp-card-header">
            <div class="checkbox-paper ${openreview.content.read ? 'selected' : ''}" style="display: block;position: absolute; bottom:35px;left: 35px;">✓</div>    
                <a href="paper_${openreview.id}.html"
                target="_blank"
                   class="text-muted">
                   <h5 class="card-title" align="center"> ${openreview.content.title} </h5></a>
                <h6 class="card-subtitle text-muted" align="center">
                        ${openreview.content.authors.join(', ')}
                </h6>
                ${card_image(openreview, render_mode !== 'list')}
                
            </div>
               
                ${card_detail(openreview, (render_mode === 'detail'))}
        </div>`

