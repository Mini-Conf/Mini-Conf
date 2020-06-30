add_local_tz = (selector) => {
  const regex_time = new RegExp("\\((.*)-(.*) (.*)\\)");
  const guess_tz = moment.tz.guess(true);

  $(selector).each(function () {
    const t = $(this).text();
    const res = regex_time.exec(t);
    if (res) {
      const start_time = moment.utc(`2020-04-30 ${res[1]}`);
      const end_time = moment.utc(`2020-04-30 ${res[2]}`);
      const local_start = start_time.tz(guess_tz);
      const local_start_and_tz = start_time.format("HH:mm");
      const local_end = end_time.tz(guess_tz);
      const local_end_and_tz = local_end.format("HH:mm z");
      const dd = local_end.dayOfYear() - end_time.utc().dayOfYear();
      let dd_str = "";
      if (dd > 0) {
        dd_str = ` +${dd}d`;
      } else if (dd < 0) {
        dd_str = ` ${dd}d`;
      }
      const start_dd = local_start.dayOfYear() - start_time.utc().dayOfYear();
      let start_dd_str = "";
      if (start_dd > 0) {
        start_dd_str = `(+${start_dd}d)`;
      } else if (start_dd < 0) {
        start_dd_str = `(${start_dd}d)`;
      }
      $(this).text(
        `(${res[1]}-${res[2]} ${res[3]} / ${local_start_and_tz}${start_dd_str}-${local_end_and_tz}${dd_str})`
      );
    }
  });
};
