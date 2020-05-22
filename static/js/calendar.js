// eslint-disable-next-line camelcase,no-unused-vars
function make_cal(name) {
  // eslint-disable-next-line func-names
  $.get(name).then(function (data) {
    // parse the ics data
    const jcalData = ICAL.parse(data.trim()); // eslint-disable-line no-undef
    const comp = new ICAL.Component(jcalData); // eslint-disable-line no-undef
    const eventComps = comp.getAllSubcomponents("vevent");
    // map them to FullCalendar events
    // eslint-disable-next-line func-names
    const events = $.map(eventComps, function (item) {
      if (item.getFirstPropertyValue("class") === "PRIVATE") {
        return null;
      }
      const toreturn = {
        title: item.getFirstPropertyValue("summary"),
        location: "",
      };
      const rrule = item.getFirstPropertyValue("rrule");
      if (rrule != null) {
        // event recurs
        toreturn.rrule = {};
        if (rrule.freq) toreturn.rrule.freq = rrule.freq;
        if (rrule.parts.BYDAY) toreturn.rrule.byweekday = rrule.parts.BYDAY;
        if (rrule.until) toreturn.rrule.until = rrule.until.toString();
        if (rrule.until) toreturn.rrule.until = rrule.until.toString();
        if (rrule.interval) toreturn.rrule.interval = rrule.interval;
        const dtstart = item.getFirstPropertyValue("dtstart").toString();
        const dtend = item.getFirstPropertyValue("dtend").toString();
        toreturn.rrule.dtstart = dtstart;
        // count duration ms
        const startdate = new Date(dtstart);
        const enddate = new Date(dtend);
        toreturn.duration = enddate - startdate;
      } else {
        if (item.getFirstPropertyValue("dtstart") == null) return null;
        if (item.getFirstPropertyValue("dtend") == null) return null;

        toreturn.start = item.getFirstPropertyValue("dtstart").toString();
        toreturn.end = item.getFirstPropertyValue("dtend").toString();
      }
      return toreturn;
    });

    const calEl = document.getElementById("calendar");
    // eslint-disable-next-line no-undef
    const cal = new FullCalendar.Calendar(calEl, {
      plugins: ["timeGrid", "googleCalendar"],
      defaultView: "timeGridWeek",
      views: {
        listDay: { buttonText: "list day" },
      },
      header: { left: "", center: "", right: "" },
      eventTimeFormat: {
        // like '14:30:00'
        hour: "2-digit",
        minute: "2-digit",
        meridiem: false,
        hour12: false,
        timeZoneName: "long",
      },
      height: 1000,
      events,
      eventClick(info) {
        $(window).scrollTop(
          $(
            `#${info.event.title.split(" ").join("_").replace("?", "")}`
          ).position().top - 100
        );
      },
      eventRender(info) {
        // console.log(info.event);
        // append location
        if (
          info.event.extendedProps.location !== null &&
          info.event.extendedProps.location !== ""
        ) {
          info.el.append(info.event.extendedProps.location);
        }
      },
    });

    cal.gotoDate("2020-04-26");
    cal.render();

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = new Date();
    const dayOfWeek = days[today.getUTCDay()];
    $(".fc-scroller").scrollTop(
      $(`.fc-widget-header:contains('${dayOfWeek}')`).position().top
    );
  });
}
