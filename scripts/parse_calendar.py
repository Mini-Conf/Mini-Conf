import argparse
import json
import re

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
    parser.add_argument(
        "--strip-url-domain",
        action="store_true",
        help="Whether to strip domain in URLs",
    )

    return parser.parse_args()


# pylint: disable=redefined-outer-name
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
        tpe = "---"

        # check for starting hashtag
        parts = title.split(" ")
        if parts[0].startswith("#"):
            tpe = parts[0][1:]
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

        link = e.location
        if args.strip_url_domain:
            link = re.sub(r"https?://(.*?)/", "./", link)

        json_event = {
            "title": title,
            "start": e.begin.for_json(),
            "end": e.end.for_json(),
            "location": link,
            "link": link,
            "category": "time",
            "calendarId": tpe,
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
