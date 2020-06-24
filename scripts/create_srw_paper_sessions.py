import argparse
import re
from collections import defaultdict
from datetime import datetime
from typing import Any, DefaultDict, Dict

import pandas as pd
import yaml

re_session_extract = re.compile(
    r"\w+ (\w+) (\d+), (\d+) SRW Session (\d+\w) (\d+):(\d\d) UTC(.*)"
)


def extract_date(x):
    (month, date, year, session, hour, mins, timezone) = re_session_extract.match(
        x
    ).groups()
    month_int = datetime.strptime(month, "%B").month
    parsed_date = datetime(int(year), month_int, int(date), int(hour), int(mins))
    assert timezone == "+0"
    return parsed_date, session


def main(srw_papers_xlsx: str, output_file: str):
    srw_papers_df = pd.read_excel(
        srw_papers_xlsx, na_values=None, keep_default_na=False
    )

    session_time_map: DefaultDict[str, Dict[str, Any]] = defaultdict(
        lambda: {"date": "", "papers": []}
    )
    for _, row in srw_papers_df.iterrows():
        uid = f"srw.{row.get('Submission ID')}"
        for slot_name in ["QA Slot 1", "QA Slot 2"]:
            time = row.get(slot_name)
            if not time:
                continue
            date, session_name = extract_date(time)
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
        "--srw-papers-file",
        help="ACL.SRW.2020.Live.QA.Slots.for.website.xlsx from SRW chairs",
    )
    cmdline_parser.add_argument(
        "--output-file", help="ooutput srw_paper_sessions.yml file"
    )
    return cmdline_parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()
    main(
        srw_papers_xlsx=args.srw_papers_file, output_file=args.output_file,
    )
