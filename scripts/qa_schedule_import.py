import argparse
import re
from collections import defaultdict
from datetime import datetime

import pandas as pd
import yaml

re_session_extract = re.compile(
    r"\w+ (\w+) (\d+), (\d+) (\d+\w) [\w\d\s:\-.,()]+-\d+ (\d+):(\d\d) UTC(.*)"
)


def extract_date(x):
    (month, date, year, session, hour, mins, timezone,) = re_session_extract.match(
        x
    ).groups()
    month_int = datetime.strptime(month, "%B").month
    parsed_date = datetime(int(year), month_int, int(date), int(hour), int(mins))
    assert timezone == "+0"
    return parsed_date, session


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Format paper details into MiniConf format"
    )
    parser.add_argument(
        "--volume",
        help="Volume in the ACL Anthology that these papers are part of",
        action="store",
        type=str,
        required=True,
    )
    parser.add_argument(
        "--track-file",
        help="Excel spreadsheet giving paper track, QA session times, and ID in the proceedings",
        action="store",
        type=str,
        default="paper_tracks.xls",
    )
    return parser.parse_args()


def main():
    args = parse_arguments()
    track_details = pd.read_excel(args.track_file)
    track_details.rename(columns={"Line order": "LineOrder"}, inplace=True)

    track_details["Date1"], track_details["Session1"] = zip(
        *track_details["slot 1"].map(extract_date)
    )
    track_details["Date2"], track_details["Session2"] = zip(
        *track_details["slot2"].map(extract_date)
    )

    session_time_map = defaultdict(lambda: {"date": "", "posters": []})

    volume = str(args.volume)

    for row in track_details.itertuples():
        session_time_map[row.Session1]["date"] = row.Date1
        session_time_map[row.Session1]["posters"].append(
            {
                "id": volume + "." + str(row.LineOrder),
                "join_link": "https://www.google.com/",
            }
        )
        session_time_map[row.Session2]["date"] = row.Date2
        session_time_map[row.Session2]["posters"].append(
            {
                "id": volume + "." + str(row.LineOrder),
                "join_link": "https://www.google.com/",
            }
        )

    # Sort everything
    for session_info in session_time_map.values():
        session_info["posters"].sort(key=lambda x: int(x["id"].split(".")[1]))
    dict_items = list(session_time_map.items())
    dict_items.sort(key=lambda x: x[1]["date"])
    ordered_sessions = dict(dict_items)

    for session_info in session_time_map.values():
        session_info["date"] = session_info["date"].strftime("%Y-%m-%d_%H:%M:%S")

    with open("paper_schedule.yml", "w") as f:
        yaml.dump(ordered_sessions, f, default_flow_style=False, sort_keys=False)


if __name__ == "__main__":
    main()
