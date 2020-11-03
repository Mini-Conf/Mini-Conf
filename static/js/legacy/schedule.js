const table_height = 900;
const conf_days = ["---", "Mon", "Tues", "Wed", "Thurs", "Fri"];

let sc = null;
let min_max_time = [];
let currentTimeZone = moment.tz.guess(true);
const tzNames = [...moment.tz.names(), "Star Date (TNG)"];

function updateTable() {
  const scale = d3
    .scaleTime()
    .domain(min_max_time)
    .range([25, table_height - 5]);

  const day_format = d3.utcFormat("%a %m/%e");
  const day_name = d3.utcFormat("%A");
  const day_parse = d3.utcParse("%Y-%m-%e");

  // TODO: replace
  const today = day_parse("2020-04-28");

  const days = d3
    .select(".main-table")
    .selectAll(".day")
    .data(sc.conference)
    .join((enter) => {
      const res = enter.append("div");
      res
        .append("div")
        .attr("class", "day_header")
        .text((d) => day_format(day_parse(d.day)))
        .attr("data-name", (d) => day_parse(d.day));

      return res;
    })
    .attr("class", (d) => "day")
    .classed("today", (d) => {
      return day_format(today) === day_format(day_parse(d.day));
    })
    // .style('margin-top', "30px")
    .style("height", `${table_height}px`);

  const slots = sc.time_slots;
  const parse_full_time = d3.utcParse("%Y-%m-%e %I:%M %p");
  const utc_time_format = d3.utcFormat("%I:%M %p");

  // const tf = d3.timeFormat('%I:%M %p')

  const tf = (date) => {
    if (currentTimeZone.startsWith("Star")) {
      return calendarDateToStardateTng(new Date(date));
    }
    return moment(date).tz(currentTimeZone).format("hh:mm A");
  };
  // const tf_moment_GMT = date => moment(date).tz('GMT').format('hh:mm A')
  const day_diff = (date) => {
    if (currentTimeZone.startsWith("Star")) return 0;
    const m = moment(date);
    return m.tz(currentTimeZone).dayOfYear() - m.utc().dayOfYear();
  };

  days
    .selectAll(".event")
    .data((d) =>
      d.events.map((event) => {
        event.time_slot = slots[event.slot];
        event.real_times = slots[event.slot].map((sl) =>
          parse_full_time(`${d.day} ${utc_time_format(sl)}`)
        );
        return event;
      })
    )
    .join("div")
    .attr("class", (d) => `event ${d.type}`)
    .style("top", (d) => `${scale(d.time_slot[0])}px`)
    .style(
      "height",
      (d) =>
        `${Math.max(20, scale(d.time_slot[1]) - scale(d.time_slot[0]) - 2)}px`
    )
    .html((d) => {
      let res = "";
      if (d.type === "poster") {
        const matches = d.short.match(/P([0-9]+)S([0-9]+)/);
        const dd = day_diff(d.real_times[1]);
        const dayID = matches[1];
        day = conf_days[dayID];

        res += `<div  class="time_slot"> ${tf(d.real_times[0])} - ${tf(
          d.real_times[1]
        )} ${dd > 0 ? `+${dd}d` : dd < 0 ? `${dd}d` : ""} </div>`;
        res +=
          ` <span class="session-title">` +
          `Poster Day ${matches[1]} Session ${matches[2]}</span>`;
      } else if (d.type === "qa" || d.type === "expo") {
        const dd = day_diff(d.real_times[1]);
        res +=
          `<span class="time_slot">${tf(d.real_times[0])}  ${
            dd > 0 ? `+${dd}d` : dd < 0 ? `${dd}d` : ""
          }</span> <span class="session-title">` + `${d.name} </span>`;
      }
      return res;
    })
    .on("click", (d) => {
      if (d.type === "poster") {
        const matches = d.short.match(/P([0-9]+)S([0-9]+)/);
        const dayID = matches[1];
        const day = conf_days[dayID];
        // window.open(`papers.html?session=${day}+Session+${matches[2]}`)
      } else if (d.type === "qa") {
        window.open(`speaker_${d.id}.html`);
      } else {
        window.open(d.link);
      }
    });
}

const start = () => {
  d3.json("schedule.json")
    .then((sch) => {
      sc = sch;
      // date conversions for times
      const parseTime = d3.utcParse("%I:%M %p");

      let all_ts = [];
      Object.keys(sch.time_slots).forEach((k) => {
        const timeSlot = sch.time_slots[k].map(parseTime);
        sch.time_slots[k] = timeSlot;
        all_ts.push(timeSlot);
      });
      all_ts = _.flatten(all_ts);
      min_max_time = d3.extent(all_ts);

      // d3.select('.info')
      //   .text(`Times are displayed for timezone: ${currentTimeZone}`)

      updateTable();
    })
    .catch((e) => console.error(e));

  const tzOptons = d3.select("#tzOptions");
  tzOptons
    .selectAll("option")
    .data(tzNames)
    .join("option")
    .attr("data-tokens", (d) => d.split("/").join(" "))
    .text((d) => d);
  $(".selectpicker")
    .selectpicker("val", currentTimeZone)
    .on("changed.bs.select", function (
      e,
      clickedIndex,
      isSelected,
      previousValue
    ) {
      currentTimeZone = tzNames[clickedIndex];
      updateTable();
    });
};

// credits to https://github.com/sumghai/StarTrek_StardateCalc/blob/master/stardateTNG.js

const starDateOrigin = new Date("July 5, 2318 12:00:00");

function calendarDateToStardateTng(calendarInput) {
  calendarInput.setSeconds(0);

  const millisecondsSinceStardateOrigin =
    calendarInput.getTime() - starDateOrigin.getTime();

  const stardateOut = millisecondsSinceStardateOrigin / 34367056.4;

  return stardateOut.toFixed(1);
}
