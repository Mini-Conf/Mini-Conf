# pylint: disable=global-statement,redefined-outer-name
import argparse
import csv
import glob
import json
import os
import yaml

from flask import Flask, jsonify, redirect, render_template, send_from_directory
from flask_frozen import Freezer
from flaskext.markdown import Markdown

site_data = {}
by_uid = {}
archive_path_root = "archive"
archive_data_exists = False
archive_directories = []


def main(site_data_path):
    global site_data, extra_files, archive_path_root, archive_data_exists, archive_directories
    extra_files = ["README.md"]

    # Load all for your sitedata one time.
    for f in glob.glob(site_data_path + "/*"):
        extra_files.append(f)
        name, typ = f.split("/")[-1].split(".")
        if typ == "json":
            site_data[name] = json.load(open(f))
        elif typ in {"csv", "tsv"}:
            site_data[name] = list(csv.DictReader(open(f)))
        elif typ == "yml":
            site_data[name] = yaml.load(open(f).read(), Loader=yaml.SafeLoader)

    for typ in ["papers", "speakers", "tutorials", "workshops"]:
        by_uid[typ] = {}
        for p in site_data[typ]:
            by_uid[typ][p["UID"]] = p
    print("Current Data Successfully Loaded")

    # check if archive data directory exists
    archive_path_sitedata = archive_path_root + "/sitedata"
    archive_dir_exists = archive_directory_check(archive_path_sitedata)

    if archive_dir_exists:
        archive_directories = os.listdir(archive_path_sitedata)

        if len(archive_directories) > 0:
            for archive_year in archive_directories:
                archive_path = archive_path_sitedata + "/" + str(archive_year)

                # check if the archive year has data
                if os.path.isdir(archive_path):
                    if not os.listdir(archive_path):
                        print(str(archive_path) + " directory is empty")
                    else:
                        # Load all archive data
                        for f in glob.glob(archive_path + "/*"):
                            extra_files.append(f)
                            name, typ = f.split("/")[-1].split(".")
                            if typ == "json":
                                site_data[archive_path_root] = {str(archive_year): {str(name): json.load(open(f))}}
                            elif typ in {"csv", "tsv"}:
                                site_data[archive_path_root] = {str(archive_year): {str(name): list(csv.DictReader(open(f)))}}
                            elif typ == "yml":
                                site_data[archive_path_root] = {str(archive_year): {str(name): yaml.load(open(f).read(), Loader=yaml.SafeLoader)}}

                        for typ in ["speakers"]:
                            by_uid[archive_path_root] = {str(archive_year): {str(typ): {}}}
                            for p in site_data[archive_path_root][archive_year][typ]:
                                by_uid[archive_path_root][archive_year][typ][p["UID"]] = p

                        archive_data_exists = True
                        print("Archive Data Successfully Loaded")
            site_data["archive"]["years_list"] = archive_directories
            site_data["archive"]["has_data"] = archive_data_exists
    return extra_files

# ------------- SERVER CODE -------------------->

app = Flask(__name__)
app.config.from_object(__name__)
freezer = Freezer(app)
markdown = Markdown(app)


# MAIN PAGES


def _data():
    data = {}
    data["config"] = site_data["config"]
    data["archive"] = site_data["archive"]
    return data


@app.route("/")
def index():
    return redirect("/index.html")


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(site_data_path, "favicon.ico")


# REDIRECTS TO SUPPORT EARLIER LINKS
@app.route("/registration")
def registration():
    return redirect("/register.html", code=302)


@app.route("/agenda")
def agenda():
    return redirect("/calendar.html", code=302)


@app.route("/keynote")
def keynote():
    return redirect("/calendar.html", code=302)


@app.route("/toc")
def toc():
    return redirect("/papers.html", code=302)


@app.route("/acm-chil-track-1-cfp")
def track1():
    return redirect("/call-for-papers.html", code=302)


@app.route("/acm-chil-track-2-cfp")
def track2():
    return redirect("/call-for-papers.html", code=302)


@app.route("/acm-chil-track-3-cfp")
def track3():
    return redirect("/call-for-papers.html", code=302)


@app.route("/acm-chil-track-4-cfp")
def track4():
    return redirect("/call-for-papers.html", code=302)


@app.route("/call-for-tutorials")
def call_tutorials():
    return redirect("/call-for-papers.html", code=302)


@app.route("/doctoral-consortium-call-for-phd-students")
def call_doctoral():
    return redirect("/call-for-papers.html", code=302)


@app.route("/financial-support")
def financial_support():
    return redirect("/sponsor.html", code=302)


@app.route("/acm-chil-2020-sponsorship-policy")
def sponsorship_policy():
    return redirect("/sponsor.html", code=302)


@app.route("/organizing-committees")
def organizing_committee():
    return redirect("/committee.html", code=302)


@app.route("/reviewers")
def reviewers():
    return redirect("/committee.html#tab-reviewers", code=302)


@app.route("/faqs")
def faqs():
    return redirect("/help.html", code=302)


# TOP LEVEL PAGES


@app.route("/index.html")
def home():
    data = _data()
    data["index"] = open("./templates/content/index.md").read()
    data["committee"] = site_data["committee"]["committee"]
    return render_template("index.html", **data)


@app.route("/help.html")
def about():
    data = _data()
    data["FAQ"] = site_data["faq"]["FAQ"]
    return render_template("help.html", **data)


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
    data["speakers"] = site_data["speakers"]
    data["tutorials"] = [
        format_workshop(tutorial) for tutorial in site_data["tutorials"]
    ]
    data["schedule"] = open("./templates/content/schedule.md").read()

    return render_template("schedule.html", **data)


@app.route("/workshops.html")
def workshops():
    data = _data()
    data["workshops"] = [
        format_workshop(workshop) for workshop in site_data["workshops"]
    ]
    return render_template("workshops.html", **data)


@app.route("/register.html")
def register():
    data = _data()
    data["register"] = open("./templates/content/register.md").read()
    return render_template("register.html", **data)


@app.route("/sponsor.html")
def sponsor():
    data = _data()
    data["sponsor"] = open("./templates/content/sponsor.md").read()
    return render_template("sponsor.html", **data)


@app.route("/call-for-papers.html")
def call_for_papers():
    data = _data()
    data["call_for_papers"] = open("./templates/content/call-for-papers.md").read()
    data["call_for_papers_author_info"] = open("./templates/content/call-for-papers-author-info.md").read()
    data["call_for_papers_track_1"] = open("./templates/content/call-for-papers-track-1.md").read()
    data["call_for_papers_track_2"] = open("./templates/content/call-for-papers-track-2.md").read()
    data["call_for_papers_track_3"] = open("./templates/content/call-for-papers-track-3.md").read()
    return render_template("call-for-papers.html", **data)


@app.route("/committee.html")
def committee():
    data = _data()
    data["committee"] = open("./templates/content/committee.md").read()
    data["committee_governing_board"] = open(
        "./templates/content/committee-governing-board.md"
    ).read()
    data["committee_steering_committee"] = open(
        "./templates/content/committee-steering-committee.md"
    ).read()
    return render_template("committee.html", **data)


@app.route("/past-events/<year>/<template>.html")
def archive(year, template):
    global archive_path_root
    data = _data()

    if ((year in by_uid[archive_path_root]) and (template in by_uid[archive_path_root][year] or template == "highlights")):
        if template == "speakers":
            data[template] = site_data[archive_path_root][year][template]
            return render_template(f"past-events-{template}.html", **data)
        elif template == "workshops":
            return None
        elif template == "sponsors":
            return None
        elif template == "highlights":
            data["highlights"] = open(f"./{archive_path_root}/sitedata/{year}/{template}.md").read()
            data["archive_year"] = year
            return render_template(f"past-events-{template}.html", **data)
    else:
        error = {
            "title": "Oops!",
            "type": "routing",
            "message": f"No archive data for {template} in {year}"
        }
        data["error"] = error
        return render_template("error.html", **data)


def archive_directory_check(dir_path):
    return True if os.path.exists(dir_path) and os.path.isdir(dir_path) else False

def extract_list_field(v, key):
    value = v.get(key, "")
    if isinstance(value, list):
        return value
    else:
        return value.split("|")


def format_paper(v):
    list_keys = ["authors", "keywords", "sessions"]
    list_fields = {}
    for key in list_keys:
        list_fields[key] = extract_list_field(v, key)

    return {
        "UID": v["UID"],
        "title": v["title"],
        "forum": v["UID"],
        "authors": list_fields["authors"],
        "keywords": list_fields["keywords"],
        "abstract": v["abstract"],
        "TLDR": v["abstract"],
        "recs": [],
        "sessions": list_fields["sessions"],
        # links to external content per poster
        "pdf_url": v.get("pdf_url", ""),  # render poster from this PDF
        "code_link": "https://github.com/Mini-Conf/Mini-Conf",  # link to code
        "link": "https://arxiv.org/abs/2007.12238",  # link to paper
    }


def format_workshop(v):
    list_keys = ["authors"]
    list_fields = {}
    for key in list_keys:
        list_fields[key] = extract_list_field(v, key)

    return {
        "id": v["UID"],
        "title": v["title"],
        "organizers": list_fields["authors"],
        "abstract": v["abstract"],
    }


# ITEM PAGES


@app.route("/poster_<poster>.html")
def poster(poster):
    uid = poster
    v = by_uid["papers"][uid]
    data = _data()
    data["paper"] = format_paper(v)
    return render_template("poster.html", **data)


@app.route("/speaker_<speaker>.html")
def speaker(speaker):
    uid = speaker
    v = by_uid["speakers"][uid]
    data = _data()
    data["speaker"] = v
    return render_template("speaker.html", **data)


@app.route("/workshop_<workshop>.html")
def workshop(workshop):
    uid = workshop
    v = by_uid["workshops"][uid]
    data = _data()
    data["workshop"] = format_workshop(v)
    return render_template("workshop.html", **data)

@app.route("/tutorial_<tutorial>.html")
def tutorial(tutorial):
    uid = tutorial
    v = by_uid["tutorials"][uid]
    data = _data()
    data["tutorial"] = format_workshop(v)
    return render_template("tutorial.html", **data)


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
    for speaker in site_data["speakers"]:
        yield "speaker", {"speaker": str(speaker["UID"])}
    for tutorial in site_data["tutorials"]:
        yield "tutorial", {"tutorial": str(tutorial["UID"])}
    for workshop in site_data["workshops"]:
        yield "workshop", {"workshop": str(workshop["UID"])}

    for year in site_data["archive"]["years_list"]:
        yield f"/past-events/{year}/highlights.html"

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

    args = parser.parse_args()
    return args


if __name__ == "__main__":
    args = parse_arguments()

    site_data_path = args.path
    extra_files = main(site_data_path)

    if args.build:
        freezer.freeze()
    else:
        debug_val = False
        if os.getenv("FLASK_DEBUG") == "True":
            debug_val = True

        app.run(port=5000, debug=debug_val, extra_files=extra_files)
