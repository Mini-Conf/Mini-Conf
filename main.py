import argparse
import os
from typing import Any, Dict

from flask import Flask, jsonify, redirect, render_template, send_from_directory
from flask_frozen import Freezer
from flaskext.markdown import Markdown

from miniconf.load_site_data import load_site_data
from miniconf.utils import format_paper, format_workshop

site_data: Dict[str, Any] = {}
by_uid: Dict[str, Any] = {}

# ------------- SERVER CODE -------------------->

app = Flask(__name__)
app.config.from_object(__name__)
freezer = Freezer(app)
markdown = Markdown(app)

# MAIN PAGES


def _data():
    return {"config": site_data["config"]}


@app.route("/")
def index():
    return redirect("/index.html")


# TOP LEVEL PAGES


@app.route("/index.html")
def home():
    data = _data()
    data["readme"] = open("README.md").read()
    data["committee"] = site_data["committee"]["committee"]
    return render_template("index.html", **data)


@app.route("/about.html")
def about():
    data = _data()
    data["FAQ"] = site_data["faq"]["FAQ"]
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


@app.route("/calendar.html")
def schedule():
    data = _data()
    data["day"] = {
        "speakers": site_data["speakers"],
        "highlighted": [
            format_paper(by_uid["papers"][h["UID"]]) for h in site_data["highlighted"]
        ],
    }
    return render_template("schedule.html", **data)


@app.route("/workshops.html")
def workshops():
    data = _data()
    data["workshops"] = [
        format_workshop(workshop) for workshop in site_data["workshops"]
    ]
    return render_template("workshops.html", **data)


# ITEM PAGES


@app.route("/poster_<uid>.html")
def poster(uid):
    v = by_uid["papers"][uid]
    data = _data()
    data["paper"] = format_paper(v)
    return render_template("poster.html", **data)


@app.route("/speaker_<uid>.html")
def speaker(uid):
    v = by_uid["speakers"][uid]
    data = _data()
    data["speaker"] = v
    return render_template("speaker.html", **data)


@app.route("/workshop_<uid>.html")
def workshop(uid):
    v = by_uid["workshops"][uid]
    data = _data()
    data["workshop"] = format_workshop(v)
    return render_template("workshop.html", **data)


@app.route("/chat.html")
def chat():
    data = _data()
    return render_template("chat.html", **data)


# FRONT END SERVING


@app.route("/papers.json")
def paper_json():
    json = []
    for v in site_data["papers"]:
        json.append(format_paper(v))
    return jsonify(json)


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
        yield "poster", {"poster": str(paper["UID"])}
    for speaker in site_data["speakers"]:  # pylint: disable=redefined-outer-name
        yield "speaker", {"speaker": str(speaker["UID"])}
    for workshop in site_data["workshops"]:  # pylint: disable=redefined-outer-name
        yield "workshop", {"workshop": str(workshop["UID"])}

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

    site_data_path = args.path
    extra_files = load_site_data(site_data_path, site_data, by_uid)

    if args.build:
        freezer.freeze()
    else:
        debug_val = False
        if os.getenv("FLASK_DEBUG") == "True":
            debug_val = True

        app.run(port=5000, debug=debug_val, extra_files=extra_files)
