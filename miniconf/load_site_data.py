import csv
import glob
import json
from collections import OrderedDict
from datetime import datetime, timedelta
from typing import Dict, Any, List

import jsons
import pytz
import yaml

from miniconf.site_data import CommitteeMember, Tutorial, Workshop, Poster, \
    PosterContent
from miniconf.utils import extract_list_field


def load_site_data(
    site_data_path: str,
    site_data: Dict[str, Any],
    by_uid: Dict[str, Any],
    qa_session_length_hr: int,
) -> List[str]:
    """Loads all site data at once.

    Populates the `committee` and `by_uid` using files under `site_data_path`.

    NOTE: site_data[filename][field]
    """
    extra_files = ["README.md"]
    # Load all for your sitedata one time.
    for f in glob.glob(site_data_path + "/*"):
        extra_files.append(f)
        name, typ = f.split("/")[-1].split(".")

        if name == "acl2020_accepted_papers":
            continue

        if typ == "json":
            site_data[name] = json.load(open(f))
        elif typ in {"csv", "tsv"}:
            site_data[name] = list(csv.DictReader(open(f)))
        elif typ == "yml":
            site_data[name] = yaml.load(open(f).read(), Loader=yaml.SafeLoader)

    for typ in ["papers", "speakers"]:
        by_uid[typ] = {}
        for p in site_data[typ]:
            by_uid[typ][p["UID"]] = p

    display_time_format = "%H:%M"

    # index.html
    site_data["committee"] = build_committee(site_data["committee"]["committee"])

    # schedule.html
    site_data["schedule"] = build_plenary_sessions(site_data["speakers"])

    # tutorials.html
    tutorials = build_tutorials(site_data["tutorials"])
    site_data["tutorials"] = tutorials
    # tutorial_<uid>.html
    by_uid["tutorials"] = {
        tutorial.id: tutorial
        for tutorial in tutorials
    }

    # papers.html
    build_papers(site_data, by_uid, display_time_format, qa_session_length_hr)
    # poster_<uid>.html
    posters = build_posters(site_data["papers"])
    # papers.json
    site_data["posters"] = posters
    by_uid["posters"] = {
        poster.id: poster
        for poster in posters
    }

    # workshops.html
    workshops = build_workshops(site_data["workshops"])
    site_data["workshops"] = workshops
    # workshop_<uid>.html
    by_uid["workshops"] = {
        workshop.id: workshop
        for workshop in workshops
    }

    # sponsors.html
    build_sponsors(site_data, by_uid, display_time_format)

    # about.html
    site_data["faq"] = site_data["faq"]["FAQ"]
    site_data["code_of_conduct"] = site_data["code_of_conduct"]["CodeOfConduct"]

    print("Data Successfully Loaded")
    return extra_files


def build_committee(raw_committee: List[Dict[str, Any]]) -> List[CommitteeMember]:
    return [jsons.load(item, cls=CommitteeMember) for item in raw_committee]


def build_plenary_sessions(raw_keynotes: List[Dict[str, Any]]) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
    # TODO: define a better dataclass and use Keynote
    return {
        day: {
            "speakers": [item for item in raw_keynotes if item["day"] == day]
        }
        for day in ["Monday", "Tuesday", "Wednesday"]
    }


def build_papers(site_data, by_uid, display_time_format: str, qa_session_length_hr: int) -> None:
    for session_name, session_info in site_data["poster_schedule"].items():
        for paper in session_info["posters"]:
            if "sessions" not in by_uid["papers"][paper["id"]]:
                by_uid["papers"][paper["id"]]["sessions"] = []
            time = datetime.strptime(session_info["date"], "%Y-%m-%d_%H:%M:%S")
            start_time = time.strftime(display_time_format)
            start_day = time.strftime("%a")
            end_time = (time + timedelta(hours=qa_session_length_hr)).strftime(display_time_format)
            time_string = "({}-{} GMT)".format(start_time, end_time)
            current_num_sessions = len(by_uid["papers"][paper["id"]]["sessions"])
            calendar_stub = site_data["config"]["site_url"].replace("https", "webcal")
            by_uid["papers"][paper["id"]]["sessions"].append(
                {
                    "time": time,
                    "time_string": time_string,
                    "session": " ".join([start_day, "Session", session_name]),
                    "zoom_link": paper["join_link"],
                    "ical_link": calendar_stub
                    + "/poster_{}.{}.ics".format(paper["id"], current_num_sessions),
                }
            )


def build_posters(raw_papers: List[Dict[str, Any]]) -> List[Poster]:
    return [
        Poster(
            id=item["UID"],
            forum=item["UID"],
            content=PosterContent(
                title=item["title"],
                authors=extract_list_field(item, "authors"),
                keywords=extract_list_field(item, "keywords"),
                abstract=item["abstract"],
                pdf_url=item.get("pdf_url", ""),
                demo_url=item.get("demo_url", ""),
                track=item.get("track", ""),
                sessions=item["sessions"],
                recs=[]
            )
        )
        for item in raw_papers
    ]


def build_tutorials(raw_tutorials: List[Dict[str, Any]]) -> List[Tutorial]:
    return [
        Tutorial(
            id=item["UID"],
            title=item["title"],
            organizers=extract_list_field(item, "organizers"),
            abstract=item["abstract"],
            material=item["material"]
        ) for item in raw_tutorials
    ]


def build_workshops(raw_workshops: List[Dict[str, Any]]) -> List[Workshop]:
    return [
        Workshop(
            id=item["UID"],
            title=item["title"],
            organizers=extract_list_field(item, "organizers"),
            abstract=item["abstract"],
            material=item["material"]
        ) for item in raw_workshops
    ]


def build_sponsors(site_data, by_uid, display_time_format) -> None:
    # TODO: should assign UID by sponsor name? What about sponsors with multiple levels?
    by_uid["sponsors"] = {
        sponsor["UID"]: sponsor
        for sponsors_at_level in site_data["sponsors"]
        for sponsor in sponsors_at_level["sponsors"]
    }

    # Format the session start and end times
    for sponsor in by_uid["sponsors"].values():
        sponsor["zoom_times"] = OrderedDict()
        for zoom in sponsor.get("zooms", []):
            start = zoom["start"].astimezone(pytz.timezone("GMT"))
            end = start + timedelta(hours=zoom["duration"])
            day = start.strftime("%A")
            start_time = start.strftime(display_time_format)
            end_time = end.strftime(display_time_format)
            time_string = "{} ({}-{} GMT)".format(day, start_time, end_time)

            if day not in sponsor["zoom_times"]:
                sponsor["zoom_times"][day] = []

            sponsor["zoom_times"][day].append((time_string, zoom["label"]))
