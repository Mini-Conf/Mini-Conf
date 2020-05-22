import argparse
import json

import requests

from ics.icalendar import Calendar

# import ics


def parse_arguments():
    parser = argparse.ArgumentParser(description="MiniConf Calendar Command Line")

    parser.add_argument(
        "--ics",
        default="sample_cal.ics",
        type=str,
        help="ICS file to parse (local or via http)",
    )

    parser.add_argument(
        "--out", default="../sitedata/main_calendar.json", help="ICS file to parse"
    )

    return parser.parse_args()


def convert(args):
    file_ics: str = args.ics
    if not file_ics.startswith("http"):
        with open(file_ics, "r") as f:
            c = Calendar(f.read())
    else:
        c = Calendar(requests.get(file_ics).text)

    collector = []
    for e in c.events:
        title = e.name
        type = "---"

        # check for starting hashtag
        parts = title.split(" ")
        if parts[0].startswith("#"):
            type = parts[0][1:]
            title = " ".join(parts[1:])

        # // const
        # toreturn = {
        #            // title,
        # // "location": "",
        # // id: '' + id,
        # // calendarId: title.startsWith("Poster") ? '1': '2', // + (id % 2 + 1),
        # // category: 'time',
        # // dueDateClass: ''
        #                  //
        #                  //};

        json_event = {
            "title": title,
            "start": e.begin.for_json(),
            "end": e.end.for_json(),
            "location": e.location,
            "link": e.location,
            "category": "time",
            "calendarId": type,
        }
        collector.append(json_event)
        print(json_event)

    with (open(args.out, "w")) as f:
        json.dump(collector, f)

    # print(c.events)

    pass


if __name__ == "__main__":
    args = parse_arguments()
    convert(args)
