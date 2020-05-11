add_local_tz = selector  => {
    const regex_time = new RegExp('\\((.*)-(.*) (.*)\\)')
    const guess_tz = moment.tz.guess(true);


    $(selector).each(function(){
        const t = $(this).text()
        const res = regex_time.exec(t)
        if (res){
            const start_time = moment.utc('2020-04-30 '+res[1]);
            const end_time = moment.utc('2020-04-30 '+res[2]);
            // console.log(start_time,end_time,"--- start_time,end_time");
            // console.log(start_time.tz(guess_tz).format('h:mm A'),"--- start_time.");
            // console.log(end_time.tz(guess_tz).format('h:mm A z'),"--- start_time.");
            const local_start = start_time.tz(guess_tz).format('HH:mm');
            const local_end_and_tz = end_time.tz(guess_tz).format('HH:mm z');
            $(this).text(`(${res[1]}-${res[2]} ${res[3]} / ${local_start}-${local_end_and_tz})`)

        }
    })
}
