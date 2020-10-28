async function make_cal(handleResize = true) {

  const current_tz = getUrlParameter("tz") || moment.tz.guess();
  const tzNames = [...moment.tz.names()];

  const setupTZSelector = () => {
    const tzOptons = d3.select("#tzOptions");
    tzOptons
      .selectAll("option")
      .data(tzNames)
      .join("option")
      .attr("data-tokens", (d) => d.split("/").join(" "))
      .text((d) => d);
    $(".selectpicker")
      .selectpicker("val", current_tz)
      .on("changed.bs.select", function (
        e,
        clickedIndex,
        isSelected,
        previousValue
      ) {
        new_tz = tzNames[clickedIndex];
        window.open(`${window.location.pathname}?tz=${new_tz}`, "_self");
      });
  };
  setupTZSelector();

  // requires moments.js
  const enumerateDaysBetweenDates = function (startDate, endDate) {
    const dates = [];

    // console.log(startDate, endDate, "--- startDate, endDate");

    const currDate = moment(startDate);
    const lastDate = moment(endDate);

    dates.push(currDate.clone());
    while (currDate.add(1, "days").diff(lastDate) < 0) {
      // console.log(currDate, "--- currDate");
      dates.push(currDate.clone());
    }

    dates.push(lastDate);
    return dates;
  };

  const config = await API.getConfig();
  const events = await API.getCalendar();

  const all_cals = [];
  const timezoneName = current_tz;

  // determine min date
  const min_date = d3.min(events.map((e) => e.start));
  let min_hours =
    d3.min(events.map((e) => moment(e.start).tz(timezoneName).hours())) - 1;
  let max_hours =
    d3.max(events.map((e) => moment(e.end).tz(timezoneName).hours())) + 1;
  if (min_hours < 0 || max_hours > 24) {
    min_hours = 0;
    max_hours = 24;
  }

  const {Calendar} = tui;
  const calendar = new Calendar("#calendar", {
    defaultView: "week",
    isReadOnly: true,
    // useDetailPopup: true,
    taskView: false,
    scheduleView: ["time"],
    usageStatistics: false,
    week: {
      workweek: !config.calendar.sunday_saturday,
      hourStart: min_hours,
      hourEnd: max_hours,
    },
    timezones: [
      {
        timezoneOffset: -moment.tz
          .zone(timezoneName)
          .utcOffset(moment(min_date)),
        displayLabel: timezoneName,
        tooltip: timezoneName,
      },
    ],
    // timezones: [{
    //     getTimezoneOffset: 540,
    //     displayLabel: 'a',
    //     tooltip: timezoneName
    // }],
    template: {
      monthDayname(dayname) {
        return `<span class="calendar-week-dayname-name">${dayname.label}</span>`;
      },
      time(schedule) {
        return `<strong>${moment(schedule.start.getTime())
          .tz(timezoneName)
          .format("hh:mm")}</strong> ${schedule.title}`;
      },
      milestone(schedule) {
        return `<span class="calendar-font-icon ic-milestone-b"></span> <span style="background-color: ${schedule.bgColor}"> M: ${schedule.title}</span>`;
      },
      weekDayname(model) {
        const parts = model.renderDate.split("-");
        return `<span class="tui-full-calendar-dayname-name"> ${parts[1]}/${parts[2]}</span>&nbsp;&nbsp;<span class="tui-full-calendar-dayname-name">${model.dayName}</span>`;
      },
    },
  });
  calendar.setDate(Date.parse(min_date));
  calendar.createSchedules(events);
  calendar.on({
    clickSchedule(e) {
      const s = e.schedule;
      if (s.location.length > 0) {
        window.open(s.location, "_blanket");
      }
    },
  });

  all_cals.push(calendar);

  const cols = config.calendar.colors;
  if (cols) {
    const cals = [];
    Object.keys(cols).forEach((k) => {
      const v = cols[k];
      cals.push({
        id: k,
        name: k,
        bgColor: v,
      });
    });
    calendar.setCalendars(cals);
  }

  const week_dates = enumerateDaysBetweenDates(
    calendar.getDateRangeStart().toDate(),
    calendar.getDateRangeEnd().toDate()
  );

  const c_sm = d3.select("#calendar_small");
  let i = 0;
  for (const day of week_dates) {
    c_sm.append("div").attr("id", `cal__${i}`);
    const cal = new Calendar(`#cal__${i}`, {
      defaultView: "day",
      isReadOnly: true,
      // useDetailPopup: true,
      taskView: false,
      scheduleView: ["time"],
      usageStatistics: false,

      timezones: [
        {
          timezoneOffset: -moment.tz
            .zone(timezoneName)
            .utcOffset(moment(min_date)),
          displayLabel: timezoneName,
          tooltip: timezoneName,
        },
      ],
    });

    cal.setDate(day.toDate());
    cal.createSchedules(events);
    cal.on({
      clickSchedule(e) {
        const s = e.schedule;
        if (s.location.length > 0) {
          window.open(s.location, "_blanket");
        }
      },
    });

    all_cals.push(cal);
    const cols = config.calendar.colors;
    if (cols) {
      const cals = [];
      Object.keys(cols).forEach((k) => {
        const v = cols[k];
        cals.push({
          id: k,
          name: k,
          bgColor: v,
        });
      });

      cal.setCalendars(cals);
    }

    i++;
  }


  const renderAll = () => {all_cals.forEach(c => c.render(true));}
  renderAll();

  if (handleResize) {
    $(window).on(
      "resize",
      _.debounce(renderAll, 100)
    );
  }

  // return the render function for outsie control
  return {
    render: renderAll
  }

}
