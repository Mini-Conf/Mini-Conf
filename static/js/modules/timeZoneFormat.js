function getTimezone() {
  const urlTz = window.getUrlParameter && getUrlParameter("tz");
  if (urlTz) return urlTz;

  const storageTz = window.localStorage.getItem("tz");
  if (storageTz) return storageTz;

  return moment.tz.guess();
}

function formatDate(element) {
  const current_tz = getTimezone();
  const atime = moment(element.text()).clone().tz(current_tz);
  element.html(atime.format("dddd, MMMM Do, YYYY"));
}

function formatDateTime(element) {
  const current_tz = getTimezone();
  const atime = moment(element.text()).clone().tz(current_tz);
  element.html(atime.format("dddd, MMMM Do, YYYY @ HH:mm"));
}

function formatTimeSpan(element, includeDate) {
  const current_tz = getTimezone();
  const parts = element.text().split(" – ");
  console.log(parts, "--- parts");
  const start = parts[0];
  const end = parts[1];

  const starttime = moment(start).clone().tz(current_tz);
  const endtime = moment(end).clone().tz(current_tz);

  // if(starttime.diff(endtime, "days") <= 0) // Making difference between the "D" numbers because the diff function
  // seems like not considering the timezone
  if (starttime.format("D") === endtime.format("D")) {
    if (includeDate)
      element.html(
        `${starttime.format(
          "dddd, MMM Do, YYYY @ HH:mm"
        )} &ndash; ${endtime.format("HH:mm")}`
      );
    else
      element.html(
        `${starttime.format("HH:mm")} &ndash; ${endtime.format("HH:mm")}`
      );
  } else {
    element.html(
      `${starttime.format("dddd, MMM Do @ HH:mm")} &ndash; ${endtime.format(
        "dddd, MMM Do @ HH:mm"
      )}`
    );
  }
}

function formatTime(element) {
  const current_tz = getTimezone();
  const atime = moment(element.text()).clone().tz(current_tz);
  element.html(atime.format("HH:mm"));
}

function timeZoneStart() {
  const current_tz = getTimezone();
  $("#tzCurrent").html(moment().tz(current_tz).format("Z"));

  // find all parseable dates and localize them
  $(".format-just-date").each((_i, element) => {
    formatDate($(element));
  });

  $(".format-date").each((_i, element) => {
    formatDateTime($(element));
  });

  $(".format-date-span").each((_i, element) => {
    formatTimeSpan($(element));
  });

  $(".format-date-span-short").each((_i, element) => {
    formatTimeSpan($(element), true);
  });

  $(".format-date-span-full").each((_i, element) => {
    formatTimeSpan($(element), true);
  });

  $(".format-time").each((_i, element) => {
    formatTime($(element));
  });
}
