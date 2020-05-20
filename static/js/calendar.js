function make_cal(name) {
    $.get(name).then(function (data) {
        // parse the ics data
        var jcalData = ICAL.parse(data.trim());
        var comp = new ICAL.Component(jcalData);
        var eventComps = comp.getAllSubcomponents("vevent");
        // map them to FullCalendar events
        var events = $.map(eventComps, function (item, id) {

            if (item.getFirstPropertyValue("class") == "PRIVATE") {
                return null;
            } else {
                const title = item.getFirstPropertyValue("summary")
                const toreturn = {
                    title,
                    "location": "",
                    id: '' + id,
                    calendarId: title.startsWith("Poster") ? '1' : '2',// + (id % 2 + 1),
                    category: 'time',
                    dueDateClass: ''

                };
                const rrule = item.getFirstPropertyValue("rrule");
                if (rrule != null) { //event recurs
                    toreturn.rrule = {};
                    if (rrule.freq) toreturn.rrule.freq = rrule.freq;
                    if (rrule.parts.BYDAY) toreturn.rrule.byweekday = rrule.parts.BYDAY;
                    if (rrule.until) toreturn.rrule.until = rrule.until.toString();
                    if (rrule.until) toreturn.rrule.until = rrule.until.toString();
                    if (rrule.interval) toreturn.rrule.interval = rrule.interval;
                    var dtstart = item.getFirstPropertyValue("dtstart")
                      .toString();
                    var dtend = item.getFirstPropertyValue("dtend").toString();
                    toreturn.rrule.dtstart = dtstart;

                    //count duration ms
                    var startdate = new Date(dtstart);
                    var enddate = new Date(dtend);
                    toreturn.duration = enddate - startdate;
                } else {
                    if (item.getFirstPropertyValue("dtstart") == null)
                        return null;
                    if (item.getFirstPropertyValue("dtend") == null)
                        return null;

                    toreturn.start = item.getFirstPropertyValue("dtstart")
                      .toString();
                    toreturn.end = item.getFirstPropertyValue("dtend")
                      .toString();
                    toreturn.location = item.getFirstPropertyValue('location')
                    toreturn.raw = item;
                }
                return toreturn;
            }
        });

        //     {
        //     id: '1',
        //     calendarId: '1',
        //     title: 'my schedule',
        //     category: 'time',
        //     dueDateClass: '',
        //     start: '2018-01-18T22:30:00+09:00',
        //     end: '2018-01-19T02:30:00+09:00'
        // },

        const Calendar = tui.Calendar;
        const calendar = new Calendar('#calendar', {
            defaultView: 'week',
            isReadOnly: true,
            // useDetailPopup: true,
            taskView: false,
            scheduleView: ['time'],
            usageStatistics: false,
            week: {
                workweek: true
            },
            template: {
                monthDayname: function (dayname) {
                    return '<span class="calendar-week-dayname-name">' + dayname.label + '</span>';
                },
                time: function (schedule) {
                    return '<strong>' + moment(schedule.start.getTime())
                      .format('HH:mm') + '</strong> ' + schedule.title;
                },
                milestone: function (schedule) {
                    return '<span class="calendar-font-icon ic-milestone-b"></span> <span style="background-color: ' + schedule.bgColor + '"> M: ' + schedule.title + '</span>';
                },
                weekDayname: function (model) {
                    const parts = model.renderDate.split('-');
                    return '<span class="tui-full-calendar-dayname-name"> ' + parts[1] + '/' + parts[2] + '</span>&nbsp;&nbsp;<span class="tui-full-calendar-dayname-name">' + model.dayName + '</span>';
                },
                schedule: function (schedule) {

                    // use another functions instead of 'schedule'
                    // milestone: function() {...}
                    // task: function() {...}
                    // allday: function() {...}

                    var tpl;

                    switch (category) {
                        case 'milestone':
                            tpl = '<span class="calendar-font-icon ic-milestone-b"></span> <span style="background-color: ' + schedule.bgColor + '">' + schedule.title + schedule.start + '</span>';
                            break;
                        case 'task':
                            tpl = '#' + schedule.title;
                            break;
                        case 'allday':
                            tpl = getTimeTemplate(schedule, true);
                            break;
                    }
                    console.log(tpl, "--- tpl");
                    return tpl;
                },
            },
        });
        calendar.setDate(new Date(2020, 3, 27));
        console.log(events, "--- events");
        calendar.createSchedules(events);
        calendar.setCalendarColor('1', {
            bgColor: "#bed972",
            borderColor: '#333'
        })
        // calendar.setCalendars([
        //         {
        //             id: '1',
        //             name: 'My Calendar',
        //             color: '#ffffff',
        //             bgColor: '#9e5fff',
        //             dragBgColor: '#9e5fff',
        //             borderColor: '#9e5fff'
        //         }])
        calendar.on({
            'clickSchedule': function (e) {
                const s = e.schedule
                if (s.location.length > 0) {
                    window.open(s.location, '_blanket');
                }
                console.log('clickSchedule', e);
            },
        })

        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = new Date()
        const dayOfWeek = days[today.getUTCDay()];
        $(".fc-scroller").scrollTop(
          $(`.fc-widget-header:contains('${dayOfWeek}')`).position().top);

    });

}
