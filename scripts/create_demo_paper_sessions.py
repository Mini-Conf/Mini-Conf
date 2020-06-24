import argparse
import re
from collections import defaultdict
from datetime import datetime
from typing import Any, DefaultDict, Dict

import pandas as pd
import yaml

re_session_extract = re.compile(r"(\w+), (\w+) (\d+), (\d+) UTC(.*)")


def extract_date(day_str: str, time: datetime):
    _, month, date, year, timezone = re_session_extract.match(day_str).groups()
    assert timezone == "+0"
    month_int = datetime.strptime(month, "%B").month
    parsed_date = datetime(int(year), month_int, int(date), time.hour, time.minute)
    return parsed_date


def main(demo_papers_xlsx: str, output_file: str):
    demo_papers_df = pd.read_excel(demo_papers_xlsx)

    session_time_map: DefaultDict[str, Dict[str, Any]] = defaultdict(
        lambda: {"date": "", "papers": []}
    )
    for _, row in demo_papers_df.iterrows():
        uid = f"demo.{row.get('UID')}"
        session_full_name = row.get("session")
        assert session_full_name.startswith("Demo ")
        if session_full_name.endswith("C"):
            # TODO: to be confirmed with Demo Chairs
            print(f"{uid} {row.get('session')} {row.get('Day Date')}")
            continue
        session_name = session_full_name[5:]
        date = extract_date(row.get("Day Date"), row.get("Ses Time"))
        if session_name not in session_time_map:
            session_time_map[session_name]["date"] = date
        else:
            registered_date = session_time_map[session_name]["date"]
            if date != registered_date:
                print(
                    f"{uid} {row.get('session')} {row.get('Day Date')} (previously seen {registered_date})"
                )
                continue
        session_time_map[session_name]["papers"].append(uid)

    # Sort everything
    for session_info in session_time_map.values():
        session_info["papers"].sort(key=lambda x: int(x.split(".")[1]))
    dict_items = list(sorted(session_time_map.items(), key=lambda x: x[1]["date"]))
    ordered_sessions = dict(dict_items)

    for session_info in session_time_map.values():
        session_info["date"] = session_info["date"].strftime("%Y-%m-%d_%H:%M:%S")

    with open(output_file, "w") as f:
        yaml.dump(ordered_sessions, f, default_flow_style=False, sort_keys=False)


def parse_arguments():
    cmdline_parser = argparse.ArgumentParser(description=__doc__)
    cmdline_parser.add_argument(
        "--demo-papers-file", help="DemoPapers_SHARED.xlsx from demo chairs"
    )
    cmdline_parser.add_argument(
        "--output-file", help="ooutput demo_paper_sessions.yml file"
    )
    return cmdline_parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()
    main(
        demo_papers_xlsx=args.demo_papers_file, output_file=args.output_file,
    )
