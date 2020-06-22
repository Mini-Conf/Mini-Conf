# pylint: disable=global-statement,redefined-outer-name
import argparse
import os
from datetime import timedelta
from typing import Any, Dict

import pytz
from flask import (
    Flask,
    jsonify,
    make_response,
    redirect,
    render_template,
    send_from_directory,
)
from flask_frozen import Freezer
from flaskext.markdown import Markdown
from icalendar import Calendar, Event

from miniconf.load_site_data import load_site_data
from miniconf.site_data import Poster, Tutorial, Workshop

site_data: Dict[str, Any] = {}
by_uid: Dict[str, Any] = {}
qa_session_length_hr = 1

# ------------- SERVER CODE -------------------->

app = Flask(__name__)
app.config.from_object(__name__)
freezer = Freezer(app)
markdown = Markdown(app)

# MAIN PAGES


def _data():
    data = {"config": site_data["config"]}
    return data


@app.route("/")
def index():
    return redirect("/index.html")


# TOP LEVEL PAGES


@app.route("/index.html")
def home():
    data = _data()
    data["readme"] = open("README.md").read()
    data["committee"] = site_data["committee"]
    return render_template("index.html", **data)


@app.route("/about.html")
def about():
    data = _data()
    data["FAQ"] = site_data["faq"]
    data["CodeOfConduct"] = site_data["code_of_conduct"]
    return render_template("about.html", **data)


@app.route("/papers.html")
def papers():
    data = _data()
    data["papers"] = site_data["papers"]
    return render_template("papers.html", **data)


@app.route("/paper_vis.html")
def paper_vis():
    data = _data()
    return render_template("papers_vis.html", **data)


@app.route("/schedule.html")
def schedule():
    data = _data()
    for day, item in site_data["schedule"].items():
        data[day] = item
    return render_template("schedule.html", **data)


@app.route("/tutorials.html")
def tutorials():
    data = _data()
    data["tutorials"] = site_data["tutorials"]
    return render_template("tutorials.html", **data)


@app.route("/workshops.html")
def workshops():
    data = _data()
    data["workshops"] = site_data["workshops"]
    return render_template("workshops.html", **data)


@app.route("/sponsors.html")
def sponsors():
    data = _data()
    data["sponsors"] = site_data["sponsors"]
    return render_template("sponsors.html", **data)


@app.route("/socials.html")
def socials():
    data = _data()
    data["socials"] = site_data["socials"]
    return render_template("socials.html", **data)


# ITEM PAGES


@app.route("/poster_<uid>.html")
def poster(uid):
    data = _data()

    v: Poster
    v = by_uid["posters"][uid]
    data["id"] = uid
    data["openreview"] = v
    data["paper"] = v
    data["paper_recs"] = [by_uid["posters"][n] for n in site_data["paper_recs"][uid]][
        1:
    ]

    return render_template("poster.html", **data)


@app.route("/poster_<poster>.<session>.ics")
def poster_ics(poster, session):
    session = int(session)
    start = by_uid["papers"][poster]["sessions"][session]["time"]
    start = start.replace(tzinfo=pytz.utc)

    cal = Calendar()
    cal.add("prodid", "-//ACL//acl2020.org//")
    cal.add("version", "2.0")
    cal["X-WR-TIMEZONE"] = "GMT"
    cal["X-WR-CALNAME"] = "ACL: " + by_uid["papers"][poster]["title"]

    event = Event()
    link = (
        '<a href="'
        + site_data["config"]["site_url"]
        + '/poster_%s.html">Poster Page</a>' % (poster)
    )
    event.add("summary", by_uid["papers"][poster]["title"])
    event.add("description", link)
    event.add("uid", "-".join(["ACL2020", poster, str(session)]))
    event.add("dtstart", start)
    event.add("dtend", start + timedelta(hours=qa_session_length_hr))
    event.add("dtstamp", start)
    cal.add_component(event)

    response = make_response(cal.to_ical())
    response.mimetype = "text/calendar"
    response.headers["Content-Disposition"] = (
        "attachment; filename=poster_" + poster + "." + str(session) + ".ics"
    )
    return response


@app.route("/speaker_<uid>.html")
def speaker(uid):
    data = _data()
    data["speaker"] = by_uid["speakers"][uid]
    return render_template("speaker.html", **data)


@app.route("/tutorial_<uid>.html")
def tutorial(uid):
    data = _data()
    data["tutorial"] = by_uid["tutorials"][uid]
    return render_template("tutorial.html", **data)


@app.route("/workshop_<uid>.html")
def workshop(uid):
    data = _data()
    data["workshop"] = by_uid["workshops"][uid]
    return render_template("workshop.html", **data)


@app.route("/sponsor_<uid>.html")
def sponsor(uid):
    data = _data()
    data["sponsor"] = by_uid["sponsors"][uid]
    return render_template("sponsor.html", **data)


@app.route("/chat.html")
def chat():
    data = _data()
    return render_template("chat.html", **data)


# FRONT END SERVING


@app.route("/papers.json")
def papers_json():
    return jsonify(site_data["posters"])


@app.route("/static/<path:path>")
def send_static(path):
    return send_from_directory("static", path)


@app.route("/serve_<path>.json")
def serve(path):
    return jsonify(site_data[path])


# --------------- DRIVER CODE -------------------------->
# Code to turn it all static


@freezer.register_generator
def generator():

    for paper in site_data["papers"]:
        yield "poster", {"uid": str(paper["UID"])}
    for speaker in site_data["speakers"]:
        yield "speaker", {"uid": str(speaker["UID"])}
    tutorial: Tutorial
    for tutorial in site_data["tutorials"]:
        yield "tutorial", {"uid": tutorial.id}
    workshop: Workshop
    for workshop in site_data["workshops"]:
        yield "workshop", {"uid": workshop.id}

    for sponsors_at_level in site_data["sponsors"]:
        for sponsor in sponsors_at_level["sponsors"]:
            yield "sponsor", {"uid": str(sponsor["UID"])}

    for i in by_uid["papers"].keys():
        for j in range(2):
            yield "poster_ics", {"poster": i, "session": str(j)}

    for key in site_data:
        yield "serve", {"path": key}


def parse_arguments():
    parser = argparse.ArgumentParser(description="MiniConf Portal Command Line")
    parser.add_argument(
        "--build",
        action="store_true",
        default=False,
        help="Convert the site to static assets",
    )
    parser.add_argument(
        "-b",
        action="store_true",
        default=False,
        dest="build",
        help="Convert the site to static assets",
    )
    parser.add_argument("path", help="Pass the JSON data path and run the server")

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()

    extra_files = load_site_data(args.path, site_data, by_uid, qa_session_length_hr)

    if args.build:
        freezer.freeze()
    else:
        debug_val = False
        if os.getenv("FLASK_DEBUG") == "True":
            debug_val = True

        app.run(port=5000, debug=debug_val, extra_files=extra_files)
