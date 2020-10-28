let all_papers = [];
let all_pos = [];
const allKeys = {
  authors: [],
  keywords: [],
  titles: [],
};
const filters = {
  authors: null,
  keywords: null,
  title: null,
};

const summaryBy = "keywords"; // or: "abstract"

let currentTippy = null;
let brush = null;

const sizes = {
  margins: {l: 20, b: 20, r: 20, t: 20},
};

const explain_text_plot = d3.select("#explain_text_plot");
const summary_selection = d3.select("#summary_selection");
const sel_papers = d3.select("#sel_papers");


const plot_size = () => {
  const cont = document.getElementById("container");
  const wh = Math.max(window.innerHeight - 280, 300);
  let ww = Math.max(cont.offsetWidth - 210, 300);
  if (cont.offsetWidth < 768) ww = cont.offsetWidth - 10.0;

  if (wh / ww > 1.3) {
    const min = Math.min(wh, ww);
    return [min, min];
  }
  return [ww, wh];
};

const xS = d3.scaleLinear().range([0, 500]);
const yS = d3.scaleLinear().range([0, 500]);
const plot = d3.select(".plot");
const l_bg = plot.append("g");
const l_main = plot.append("g");
const l_fg = plot.append("g");

const brush_start = () => {
  // console.log(currentTippy, "--- currentTippy");
  currentTippy.forEach((t) => t.disable());
  brushed();
};
const brushed = () => {
  let [[x0, y0], [x1, y1]] = d3.event.selection;
  (x0 = Math.round(x0)), (y0 = Math.round(y0));
  (x1 = Math.round(x1)), (y1 = Math.round(y1));
  // console.log(x0, x1, y1, y0, "--- x0,x1,y1,y0");

  l_main.selectAll(".dot")
    .classed("rect_selected", d => {
      return (
        x0 <= d.posCola[0] &&
        x1 >= d.posCola[0] && // Check X coordinate
        y0 <= d.posCola[1] &&
        y1 >= d.posCola[1] // Check Y
      );
    });

  // extent[0][0] <= myCircle.attr("cx") && extent[1][0] >= myCircle.attr("cx") && // Check X coordinate
  //          extent[0][1] <= myCircle.attr("cy") && extent[1][1] >= myCircle.attr("cy")  // And Y coordinate
};

function brush_ended() {
  currentTippy.forEach((t) => t.enable());

  const all_sel = [];
  l_main.selectAll(".dot.rect_selected").each((d) => all_sel.push(d));

  const words_abstract = new Map();
  let parts = null;
  let count = 0;
  all_sel.forEach((paper) => {
    if (summaryBy === "keywords") {
      paper.keywords.forEach((kw) => {
        count = words_abstract.get(kw) || 0;
        count += 1;
        words_abstract.set(kw, count);
      });
    } else {
      parts = paper.abstract.split(/[.]?\s+/);
      parts.forEach((p) => {
        if (p.length < 3) return;
        p = p.toLowerCase();
        count = words_abstract.get(p) || 0;
        count += 1;
        words_abstract.set(p, count);
      });
    }
  });
  stopwords.forEach((sw) => words_abstract.delete(sw));
  const abstract_words = [...words_abstract.entries()]
    .sort((a, b) => -a[1] + b[1])
    .slice(0, 15);

  if (abstract_words.length > 0) {
    explain_text_plot.style("display", "none");
    const f_scale = d3
      .scaleLinear()
      .domain([1, abstract_words[0][1]])
      .range([10, 16]);
    summary_selection
      .selectAll(".topWords")
      .data(abstract_words)
      .join("div")
      .attr("class", "topWords")
      .style("font-size", (d) => `${f_scale(d[1])}px`)
      .text((d) => d[0]);
  } else {
    summary_selection.selectAll(".topWords").remove();
    explain_text_plot.style("display", null);
  }

  sel_papers
    .selectAll(".sel_paper")
    .data(all_sel)
    .join("div")
    .attr("class", "sel_paper")
    .html(
      (d) =>
        `<div class="p_title">${
          d.title
        }</div> <div class="p_authors">${d.authors.join(", ")}</div>`
    )
    .on("click", (d) => openPaper(d))
    .on("mouseenter", (d) => {
      l_main
        .selectAll(".dot")
        .filter((dd) => dd.UID === d.UID)
        .classed("highlight_sel", true)
        .each(function () {
          if (this._tippy) this._tippy.show();
        });
    })
    .on("mouseleave", (d) => {
      l_main
        .selectAll(".dot")
        .filter((dd) => dd.UID === d.UID)
        .classed("highlight_sel", false)
        .each(function () {
          if (this._tippy) this._tippy.hide();
        });
    });
}

const openPaper = d => {
  window.open(API.posterLink(d), "_blank");
  API.markSet(API.storeIDs.visited, d.UID, true).then();
}

const updateVis = () => {
  Promise.all([
    API.markGetAll(API.storeIDs.visited),
    API.markGetAll(API.storeIDs.bookmarked)
  ]).then(
    ([visitedPapers, bookmarks]) => {

      all_papers.forEach((paper) => {
        paper.read = visitedPapers[paper.UID] || false;
        paper.bookmarked = bookmarks[paper.UID] || false;
      });

      const is_filtered = filters.authors || filters.keywords || filters.titles;

      const [pW, pH] = plot_size();

      plot.attr("width", pW).attr("height", pH);
      d3.select("#table_info").style("height", `${pH}px`);

      xS.range([sizes.margins.l, pW - sizes.margins.r]);
      yS.range([sizes.margins.t, pH - sizes.margins.b]);

      brush.extent([
        [0, 0],
        [pW, pH],
      ]);
      l_bg.call(brush);

      all_pos = all_papers.map((d) => {
        const r2 = d.is_selected ? 8 : 4;
        const [x, y] = [xS(d.pos[0]), yS(d.pos[1])];
        return new cola.Rectangle(x - r2, x + r2, y - r2, y + r2);
      });

      cola.removeOverlaps(all_pos);

      l_main
        .selectAll(".dot")
        .data(all_papers, (d) => d.UID)
        .join("circle")
        .attr("class", "dot")
        .attr("r", (d) => (d.is_selected ? 8 : 6))
        .attr('transform', (d, i) => {
          const pos = [all_pos[i].cx(), all_pos[i].cy()];
          d.posCola = pos;
          return `translate(${pos.join(',')})`;
        })
        // .attr("cx", (d, i) => all_pos[i].cx())
        // .attr("cy", (d, i) => all_pos[i].cy())
        .classed("read", (d) => d.read)
        .classed("bookmarked", (d) => d.bookmarked)
        .classed("highlight", (d) => d.is_selected)
        .classed("non-highlight", (d) => !d.is_selected && is_filtered)
        .on("click", function (d) {
          openPaper(d);
          d3.select(this).classed("read", true);
        });

      if (!currentTippy) {
        currentTippy = tippy(".dot", {
          content(reference) {
            return d3.select(reference).datum().title;
            // return tooltip_template(d3.select(reference).datum());
          },
          onShow(instance) {
            const d = d3.select(instance.reference).datum();
            instance.setContent(tooltip_template(d));
          },
          allowHTML: true,
        });
      }
    })
};

const render = () => {
  const f_test = [];
  Object.keys(filters).forEach((k) => {
    filters[k] ? f_test.push([k, filters[k]]) : null;
  });

  let test = (d) => {
    let i = 0;
    let pass_test = true;
    while (i < f_test.length && pass_test) {
      if (f_test[i][0] === "titles") {
        pass_test &= d.title === f_test[i][1];
      } else {
        pass_test &= d[f_test[i][0]].indexOf(f_test[i][1]) > -1;
      }
      i++;
    }
    return pass_test;
  };

  if (f_test.length === 0) test = (d) => false;

  all_papers.forEach((paper) => (paper.is_selected = test(paper)));

  updateVis();
};

// language=HTML
const tooltip_template = (d) => `
    <div>
        <div class="tt-title">${d.title}</div>
        <p>${d.authors.join(", ")}</p>
        <img src="${API.thumbnailPath(d)}" width=100%/>
     </div>   
`;

const start = () => {
  API.getPapersAndProjection()
    .then(([papers, proj]) => {
      // all_proj = proj;

      const projMap = new Map();
      proj.forEach((p) => projMap.set(p.id, p.pos));

      papers.forEach((p) => {
        p.pos = projMap.get(p.UID);
      });

      all_papers = papers;

      calcAllKeys(all_papers, allKeys);
      setTypeAhead("authors", allKeys, filters, render);

      xS.domain(d3.extent(proj.map((p) => p.pos[0])));
      yS.domain(d3.extent(proj.map((p) => p.pos[1])));

      updateVis();
    })
    .catch((e) => console.error(e));

  brush = d3
    .brush()
    .on("start", brush_start)
    .on("brush", brushed)
    .on("end", brush_ended);
};

/**
 *  EVENTS
 * */

const updateFilterSelectionBtn = (value) => {
  d3.selectAll(".filter_option label").classed("active", function () {
    const v = d3.select(this).select("input").property("value");
    return v === value;
  });
};

d3.selectAll(".filter_option input").on("click", function () {
  const me = d3.select(this);

  const filter_mode = me.property("value");
  updateFilterSelectionBtn(filter_mode);

  setTypeAhead(filter_mode, allKeys, filters, render);
  render();
});

$(window).on("resize", _.debounce(updateVis, 150));

const stopwords = `i
me
my
myself
we
our
ours
ourselves
you
your
yours
yourself
yourselves
he
him
his
himself
she
her
hers
herself
it
its
itself
they
them
their
theirs
themselves
what
which
who
whom
this
that
these
those
am
is
are
was
were
be
been
being
have
has
had
having
do
does
did
doing
a
an
the
and
but
if
or
because
as
until
while
of
at
by
for
with
about
against
between
into
through
during
before
after
above
below
to
from
up
down
in
out
on
off
over
under
again
further
then
once
here
there
when
where
why
how
all
any
both
each
few
more
most
other
some
such
no
nor
not
only
own
same
so
than
too
very
s
t
can
will
just
don
should
now`.split("\n");
