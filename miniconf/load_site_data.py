import copy
import csv
import glob
import json
import os
from collections import OrderedDict, defaultdict
from datetime import datetime, timedelta
from itertools import chain
from typing import Any, DefaultDict, Dict, List

import jsons
import pytz
import yaml

from miniconf.site_data import (
    CommitteeMember,
    Paper,
    PaperContent,
    SessionInfo,
    Tutorial,
    Workshop,
)


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
    registered_sitedata = {
        "config",
        # index.html
        "committee",
        # schedule.html
        "overall_calendar",
        "speakers",
        # tutorials.html
        "tutorials",
        # papers.html
        "main_papers",
        "demo_papers",
        "srw_papers",
        "paper_recs",
        "papers_projection",
        "main_paper_sessions",
        "demo_paper_sessions",
        "srw_paper_sessions",
        # socials.html
        "socials",
        # workshops.html
        "july5_workshop_calendar",
        "july9_workshop_calendar",
        "july10_workshop_calendar",
        "workshop_calendar",
        "workshops",
        # sponsors.html
        "sponsors",
        # about.html
        "code_of_conduct",
        "faq",
    }
    extra_files = ["README.md"]
    # Load all for your sitedata one time.
    for f in glob.glob(site_data_path + "/*"):
        filename = os.path.basename(f)
        if filename == "inbox":
            continue
        name, typ = filename.split(".")
        if name not in registered_sitedata:
            continue

        extra_files.append(f)
        if typ == "json":
            site_data[name] = json.load(open(f))
        elif typ in {"csv", "tsv"}:
            site_data[name] = list(csv.DictReader(open(f)))
        elif typ == "yml":
            site_data[name] = yaml.load(open(f).read(), Loader=yaml.SafeLoader)
    assert set(site_data.keys()) == registered_sitedata

    for typ in ["speakers"]:
        by_uid[typ] = {}
        for p in site_data[typ]:
            by_uid[typ][p["UID"]] = p

    display_time_format = "%H:%M"

    # index.html
    site_data["committee"] = build_committee(site_data["committee"]["committee"])

    # schedule.html
    site_data["schedule"] = build_plenary_sessions(site_data["speakers"])
    site_data["calendar"] = build_schedule(site_data["overall_calendar"])
    # tutorials.html
    tutorials = build_tutorials(site_data["tutorials"])
    site_data["tutorials"] = tutorials
    site_data["tutorial_calendar"] = build_tutorial_schedule(
        site_data["overall_calendar"]
    )
    # tutorial_<uid>.html
    by_uid["tutorials"] = {tutorial.id: tutorial for tutorial in tutorials}

    # papers.{html,json}
    papers = build_papers(
        raw_papers=site_data["main_papers"]
        + site_data["demo_papers"]
        + site_data["srw_papers"],
        all_paper_sessions=[
            site_data["main_paper_sessions"],
            site_data["demo_paper_sessions"],
            site_data["srw_paper_sessions"],
        ],
        qa_session_length_hr=qa_session_length_hr,
        # TODO: Should add a `webcal_url` to config instead? Is there a better way?
        calendar_stub=site_data["config"]["site_url"].replace("https", "webcal"),
        paper_recs=site_data["paper_recs"],
    )
    del site_data["main_papers"]
    del site_data["demo_papers"]
    del site_data["srw_papers"]
    del site_data["main_paper_sessions"]
    del site_data["demo_paper_sessions"]
    del site_data["srw_paper_sessions"]
    site_data["papers"] = papers
    demo_and_srw_tracks = ["Demo", "Student Research Workshop"]
    site_data["tracks"] = list(
        sorted(
            [
                track
                for track in {paper.content.track for paper in papers}
                if track not in demo_and_srw_tracks
            ]
        )
    )
    site_data["tracks"] += demo_and_srw_tracks
    # paper_<uid>.html
    by_uid["papers"] = {paper.id: paper for paper in papers}

    # workshops.html
    workshops = build_workshops(site_data["workshops"])
    site_data["workshops"] = workshops
    # workshop_<uid>.html
    by_uid["workshops"] = {workshop.id: workshop for workshop in workshops}

    # sponsors.html
    build_sponsors(site_data, by_uid, display_time_format)

    # about.html
    site_data["faq"] = site_data["faq"]["FAQ"]
    site_data["code_of_conduct"] = site_data["code_of_conduct"]["CodeOfConduct"]

    print("Data Successfully Loaded")
    return extra_files


def extract_list_field(v, key):
    value = v.get(key, "")
    if isinstance(value, list):
        return value
    else:
        return value.split("|")


def build_committee(raw_committee: List[Dict[str, Any]]) -> List[CommitteeMember]:
    return [jsons.load(item, cls=CommitteeMember) for item in raw_committee]


def build_plenary_sessions(
    raw_keynotes: List[Dict[str, Any]]
) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
    # TODO: define a better dataclass and use Keynote
    return {
        day: {"speakers": [item for item in raw_keynotes if item["day"] == day]}
        for day in ["Monday", "Tuesday", "Wednesday"]
    }


def build_schedule(overall_calendar: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    events = [
        copy.deepcopy(event)
        for event in overall_calendar
        if event["type"]
        in {"Plenary Sessions", "Tutorials", "Workshops", "QA Sessions", "Socials"}
    ]

    for event in events:
        event_type = event["type"]
        if event_type == "Plenary Sessions":
            event["classNames"] = ["calendar-event-plenary"]
            event["url"] = event["link"]
        elif event_type == "Tutorials":
            event["classNames"] = ["calendar-event-tutorial"]
            event["url"] = event["link"]
        elif event_type == "Workshops":
            event["classNames"] = ["calendar-event-workshops"]
            event["url"] = event["link"]
        elif event_type == "QA Sessions":
            event["classNames"] = ["calendar-event-qa"]
            event["url"] = event["link"]
        elif event_type == "Socials":
            event["classNames"] = ["calendar-event-socials"]
            event["url"] = event["link"]
        else:
            event["classNames"] = ["calendar-event-other"]
            event["url"] = event["link"]

        event["classNames"].append("calendar-event")
    return events


def build_tutorial_schedule(
    overall_calendar: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    events = [
        copy.deepcopy(event)
        for event in overall_calendar
        if event["type"] in {"Tutorials"}
    ]

    for event in events:
        event["classNames"] = ["calendar-event-tutorial"]
        event["url"] = event["link"]
        event["classNames"].append("calendar-event")
    return events


def normalize_track_name(track_name: str) -> str:
    if track_name == "SRW":
        return "Student Research Workshop"
    return track_name


def build_papers(
    raw_papers: List[Dict[str, str]],
    all_paper_sessions: List[Dict[str, Dict[str, Any]]],
    qa_session_length_hr: int,
    calendar_stub: str,
    paper_recs: Dict[str, List[str]],
) -> List[Paper]:
    """Builds the site_data["papers"].

    Each entry in the papers has the following fields:
    - UID: str
    - title: str
    - authors: str (separated by '|')
    - keywords: str (separated by '|')
    - track: str
    - paper_type: str (i.e., "Long", "Short", "SRW", "Demo")
    - pdf_url: str
    - demo_url: str

    The paper_schedule file contains the live QA session slots for each paper.
    An example paper_sessions.yml file is shown below.
    ```yaml
    1A:
      date: 2020-07-06_05:00:00
      papers:
      - main.1
      - main.2
    2A:
      date: 2020-07-06_08:00:00
      papers:
      - main.17
      - main.19
    ```
    """
    # build the lookup from paper to slots
    sessions_for_paper: DefaultDict[str, List[SessionInfo]] = defaultdict(list)
    for session_name, session_info in chain(
        *[paper_sessions.items() for paper_sessions in all_paper_sessions]
    ):
        date = session_info["date"]
        start_time = datetime.strptime(date, "%Y-%m-%d_%H:%M:%S")
        end_time = start_time + timedelta(hours=qa_session_length_hr)
        for paper_id in session_info["papers"]:
            session_offset = len(sessions_for_paper[paper_id])
            sessions_for_paper[paper_id].append(
                SessionInfo(
                    session_name=session_name,
                    start_time=start_time,
                    end_time=end_time,
                    zoom_link="https://zoom.com",
                    # TODO: the prefix should be configurable?
                    ical_link=f"{calendar_stub}/paper_{paper_id}.{session_offset}.ics",
                )
            )

    papers = [
        Paper(
            id=item["UID"],
            forum=item["UID"],
            content=PaperContent(
                title=item["title"],
                authors=extract_list_field(item, "authors"),
                keywords=extract_list_field(item, "keywords"),
                abstract=item["abstract"],
                tldr=item["abstract"][:250] + "...",
                pdf_url=item.get("pdf_url", ""),
                demo_url=item.get("demo_url", ""),
                track=normalize_track_name(item.get("track", "")),
                sessions=sessions_for_paper[item["UID"]],
                similar_paper_uids=paper_recs.get(item["UID"], [item["UID"]]),
            ),
        )
        for item in raw_papers
    ]

    # throw warnings for missing information
    for paper in papers:
        if not paper.content.track:
            print(f"WARNING: track not set for {paper.id}")
        if len(paper.content.sessions) != 2:
            print(
                f"WARNING: found {len(paper.content.sessions)} sessions for {paper.id}"
            )
        if not paper.content.similar_paper_uids:
            print(f"WARNING: empty similar_paper_uids for {paper.id}")

    return papers


def build_tutorials(raw_tutorials: List[Dict[str, Any]]) -> List[Tutorial]:
    return [
        Tutorial(
            id=item["UID"],
            title=item["title"],
            organizers=extract_list_field(item, "organizers"),
            abstract=item["abstract"],
            material=item["material"],
            prerecorded=item.get("prerecorded", ""),
            livestream=item.get("livestream", ""),
            virtual_format_description=item["virtual_format_description"],
        )
        for item in raw_tutorials
    ]


def build_workshops(raw_workshops: List[Dict[str, Any]]) -> List[Workshop]:
    return [
        Workshop(
            id=item["UID"],
            title=item["title"],
            organizers=extract_list_field(item, "organizers"),
            abstract=item["abstract"],
            material=item["material"],
        )
        for item in raw_workshops
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
            if zoom.get("end") is None:
                end = start + timedelta(hours=zoom["duration"])
            else:
                end = zoom["end"].astimezone(pytz.timezone("GMT"))
            day = start.strftime("%A")
            start_time = start.strftime(display_time_format)
            end_time = end.strftime(display_time_format)
            time_string = "{} ({}-{} GMT)".format(day, start_time, end_time)

            if day not in sponsor["zoom_times"]:
                sponsor["zoom_times"][day] = []

            sponsor["zoom_times"][day].append((time_string, zoom["label"]))
