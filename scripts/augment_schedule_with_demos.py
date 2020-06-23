import argparse
import csv
import re

import yaml


def parse_args():
    parser = argparse.ArgumentParser(
        description="Augment main paper schedule with demo paper schedule"
    )
    parser.add_argument("--old-schedule", type=str, help="paper_schedule.yml")
    parser.add_argument("--demo-tsv", type=str, help="DemoPapers_SHARED.tsv")
    parser.add_argument("--out", type=str, help="new paper_schedule.yml")
    return parser.parse_args()


def format_date(date, start_time):
    # Example str: Monday, July 6, 2020 UTC+0
    demo_date_exp = r".+, (.+) (.+), (.+) UTC\+0"
    match = re.match(demo_date_exp, date)
    day, month, year = "{:02d}".format(int(match.group(2))), "07", "2020"
    return "{yy}-{mm}-{dd}_{st}:00".format(yy=year, mm=month, dd=day, st=start_time)


def format_session(sess):
    # example str Demo Session 3A
    sess_num = re.match(r"Demo Session (.+)", sess).group(1)
    return "D{sn}".format(sn=sess_num)


def read_demo_tsv(fname):
    with open(fname, "r") as fd:
        data = list(csv.DictReader(fd, delimiter="\t"))
    sched = {}
    for dat in data:
        sess_name = format_session(dat["session"])
        sched[sess_name] = sched.get(
            sess_name,
            {"date": format_date(dat["Day Date"], dat["Ses Time"]), "papers": []},
        )
        sched[sess_name]["papers"].append(
            {
                "id": dat["UID"],
                "join_link": "https://www.google.com",  # Dummy link for now
            }
        )
    return sched


def read_old_schedule(fname):
    with open(fname, "r") as fd:
        data = yaml.safe_load(fd)
    return data


def merge_schedules(out, schedule, demo_schedule):
    schedule.update(demo_schedule)
    with open(out, "w") as fd:
        yaml.safe_dump(schedule, fd, default_flow_style=False)


def main():
    args = parse_args()
    demo_schedule = read_demo_tsv(args.demo_tsv)
    old_schedule = read_old_schedule(args.old_schedule)
    merge_schedules(args.out, old_schedule, demo_schedule)


if __name__ == "__main__":
    main()
