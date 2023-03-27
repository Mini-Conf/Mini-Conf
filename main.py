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

    for typ in ["papers", "speakers", "invited", "panels", "debates", 
                "tutorials", "proceedings", "roundtables", "workshops",
                "sponsors", "symposiums"]:
        by_uid[typ] = {}
        for p in site_data[typ]:
            by_uid[typ][p["UID"]] = p
    print("Current Data Successfully Loaded")

    # check if archive data directory exists
    archive_path_sitedata = archive_path_root + "/sitedata"
    archive_dir_exists = archive_directory_check(archive_path_sitedata)

    if archive_dir_exists:
        archive_directories = os.listdir(archive_path_sitedata)
        site_data[archive_path_root] = {}
        archive_root_dict = {}
        archive_year_summary_dict = {}
        archive_dict = {}
        by_uid_archive_path_root_dict = {}

        if len(archive_directories) > 0:
            for archive_year in archive_directories:
                archive_path = archive_path_sitedata + "/" + str(archive_year)
                archive_data_types = []

                # check if the archive year has data
                if os.path.isdir(archive_path):
                    if not os.listdir(archive_path):
                        print(str(archive_path) + " directory is empty")
                    else:
                        # Load all archive data
                        if not hasattr(archive_dict, archive_year):
                            archive_dict.update({str(archive_year): {}})

                        archive_year_summary_dict.update({str(archive_year): False})

                        for f in glob.glob(archive_path + "/*"):
                            extra_files.append(f)
                            name, typ = f.split("/")[-1].split(".")

                            if typ == "json":
                                archive_dict[archive_year][name] = json.load(open(f))
                                archive_data_types.append(name)
                            elif typ in {"csv", "tsv"}:
                                archive_dict[archive_year][name] = list(csv.DictReader(open(f)))
                                archive_data_types.append(name)
                            elif typ == "yml":
                                archive_dict[archive_year][name] = yaml.load(open(f).read(), Loader=yaml.SafeLoader)
                                archive_data_types.append(name)
                            elif typ == "md" and name == "highlights":
                                archive_year_summary_dict.update({str(archive_year): True})
                                archive_dict[archive_year][name] = open(f"./{archive_path_root}/sitedata/{archive_year}/{name}.md").read()

                        if len(archive_data_types) > 0:
                            archive_data_exists = True
                            by_uid_archive_year_type = {}

                            if not hasattr(by_uid_archive_path_root_dict, archive_year):
                                by_uid_archive_path_root_dict.update({str(archive_year): {}})

                            # list of archived site data file names
                            for typ in archive_data_types:
                                by_uid_archive_year_type_data = {}

                                for p in archive_dict[archive_year][typ]:
                                    by_uid_archive_year_type_data.update({str(p["UID"]): p})

                                by_uid_archive_year_type.update({str(typ):by_uid_archive_year_type_data})

                            by_uid_archive_path_root_dict[archive_year] = by_uid_archive_year_type
                            by_uid.update({str(archive_path_root): by_uid_archive_path_root_dict})

                        archive_root_dict.update(archive_dict)

            site_data["archive"] = archive_root_dict
            site_data["archive"]["years_list"] = archive_directories
            site_data["archive"]["has_data"] = archive_data_exists
            site_data["archive"]["has_summary"] = archive_year_summary_dict
            print("Archive Data Successfully Loaded")
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
    data["sponsors"] = site_data["sponsors"]
    return data


@app.route("/")
def index():
    return redirect("/index.html")


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(site_data_path, "favicon.ico")

@app.route("/chil-template-2022.zip")
def latex_template():
    return send_from_directory(site_data_path, "chil-template-2022.zip")

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
    # data["tutorials"] = [
    #     format_workshop(tutorial) for tutorial in site_data["tutorials"]
    # ]
    # data["roundtables"] = [
    #     format_workshop(roundtable) for roundtable in site_data["roundtables"]
    # ]
    # data["proceedings"] = [
    #     format_workshop(proceeding) for proceeding in site_data["proceedings"]
    # ]
    # data["workshops"] = [
    #     format_workshop(workshop) for workshop in site_data["workshops"]
    # ]
    data["schedule"] = {
        "thursday": site_data['schedule']['thursday'],
        "friday": site_data['schedule']['friday']
    }
    data["schedule_thurs"] = open("./templates/content/schedule-thurs.md").read()
    data["schedule_fri"] = open("./templates/content/schedule-fri.md").read()
    data["schedule_sat"] = open("./templates/content/schedule-sat.md").read()
    data["schedule_content"] = open("./templates/content/schedule.md").read()
    return render_template("schedule.html", **data)


# @app.route("/tentative-schedule.html")
# def schedule():
#     data = _data()
#     data["schedule_content"] = open("./templates/content/schedule.md").read()
#     return render_template("tentative-schedule.html", **data)


@app.route("/program.html")
def program():
    data = _data()
    data["speakers"] = site_data["speakers"]
    data["invited"] = site_data["invited"]
    data["debates"] = site_data["debates"]
    data["panels"] = site_data["panels"]
    data["tutorials"] = [
        format_workshop(tutorial) for tutorial in site_data["tutorials"]
    ]
    data["roundtables"] = [
        format_workshop(roundtable) for roundtable in site_data["roundtables"]
    ]
    data["proceedings"] = [
        format_workshop(proceeding) for proceeding in site_data["proceedings"]
    ]
    data["workshops"] = [
        format_workshop(workshop) for workshop in site_data["workshops"]
    ]

    return render_template("program.html", **data)


@app.route("/proceedings.html")
def proceedings():
    data = _data()
    data["proceedings"] = [
        format_workshop(proceeding) for proceeding in site_data["proceedings"]
    ]

    return render_template("proceedings.html", **data)


@app.route("/symposiums.html")
def symposiums():
    data = _data()
    data["symposiums"] = [
        format_workshop(symposium) for symposium in site_data["symposiums"]
    ]

    return render_template("symposiums.html", **data)


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


@app.route("/travel.html")
def travel():
    data = _data()
    data["travel"] = open("./templates/content/travel.md").read()
    return render_template("travel.html", **data)


@app.route("/sponsor.html")
def sponsor():
    data = _data()
    data["sponsor"] = open("./templates/content/sponsor.md").read()
    return render_template("sponsor.html", **data)

@app.route("/codeconduct.html")
def codeconduct():
    data = _data()
    data["codeconduct"] = open("./templates/content/codeconduct.md").read()
    return render_template("codeconduct.html", **data)


@app.route("/communityguidelines.html")
def communityguidelines():
    data = _data()
    data["communityguidelines"] = open("./templates/content/communityguidelines.md").read()
    return render_template("communityguidelines.html", **data)


@app.route("/call-for-doctoral.html")
def call_for_doctoral():
    data = _data()
    data["call_for_doctoral"] = open("./templates/content/call-for-doctoral.md").read()
    return render_template("call-for-doctoral.html", **data)

@app.route("/call-for-lightning.html")
def call_for_lightning():
    data = _data()
    data["call_for_lightning"] = open("./templates/content/call-for-lightning.md").read()
    return render_template("call-for-lightning.html", **data)

@app.route("/call-for-papers.html")
def call_for_papers():
    data = _data()
    data["call_for_papers"] = open("./templates/content/call-for-papers.md").read()
    data["call_for_papers_author_info"] = open("./templates/content/call-for-papers-author-info.md").read()
    data["call_for_papers_reviewer"] = open("./templates/content/call-for-papers-reviewer.md").read()
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


@app.route("/live.html")
def live():
    data = _data()
    data["live"] = open("./templates/content/live.md").read()
    data["media"] = open("./templates/content/media-release.md").read()
    return render_template("live.html", **data)


@app.route("/<year>/<template>.html")
def archive(year, template):
    global archive_path_root
    data = _data()
    data["isArchive"] = True
    data["archive_year"] = year

    if ((year in site_data[archive_path_root]) and (template in site_data[archive_path_root][year])):
        if template == "speakers":
            data[template] = site_data[archive_path_root][year][template]
            return render_template(f"past-events-{template}.html", **data)
        elif template == "proceedings":
            data[template] = [
                format_workshop(proceeding) for proceeding in site_data[archive_path_root][year][template]
            ]
            return render_template(f"past-events-{template}.html", **data)
        elif template == "symposiums":
            data[template] = [
                format_workshop(symposium) for symposium in site_data[archive_path_root][year][template]
            ]
            return render_template(f"past-events-{template}.html", **data)
        elif template == "workshops":
            data[template] = [
                format_workshop(workshop) for workshop in site_data[archive_path_root][year][template]
            ]
            return render_template(f"past-events-{template}.html", **data)
        elif template == "tutorials":
            data[template] = [
                format_workshop(tutorial) for tutorial in site_data[archive_path_root][year][template]
            ]
            return render_template(f"past-events-{template}.html", **data)
        elif template == "highlights":
            data[template] = site_data[archive_path_root][year][template]
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

    formatted_workshop = {
        "id": v["UID"],
        "title": v["title"],
        "organizers": list_fields["authors"],
        "abstract": v["abstract"],
    }

    if "bio" in v:
        formatted_workshop["bio"] = v["bio"]
    if "slideslive_id" in v:
        formatted_workshop["slideslive_id"] = v["slideslive_id"]
    if "slideslive_active_date" in v:
        formatted_workshop["slideslive_active_date"] = v["slideslive_active_date"]
    if "rocketchat_id" in v:
        formatted_workshop["rocketchat_id"] = v["rocketchat_id"]
    if "doi_link" in v:
        formatted_workshop["doi_link"] = v["doi_link"]
    if "image" in v:
        formatted_workshop["image"] = v["image"]

    return formatted_workshop

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
    data["by_uid"] = by_uid
    return render_template("speaker.html", **data)

@app.route("/<year>/speaker_<speaker>.html")
def past_speaker(year, speaker):
    uid = speaker
    v = by_uid["archive"][year]["speakers"][uid]
    data = _data()
    data["speaker"] = v
    data["year"] = year
    data["isArchive"] = True
    data["by_uid"] = by_uid
    return render_template("speaker.html", **data)


@app.route("/workshop_<workshop>.html")
def workshop(workshop):
    uid = workshop
    v = by_uid["workshops"][uid]
    data = _data()
    data["workshop"] = format_workshop(v)
    return render_template("workshop.html", **data)

@app.route("/<year>/workshop_<workshop>.html")
def past_workshop(year, workshop):
    uid = workshop
    v = by_uid["archive"][year]["workshops"][uid]
    data = _data()
    data["year"] = year
    data["isArchive"] = True
    data["workshop"] = format_workshop(v)
    return render_template("workshop.html", **data)

@app.route("/tutorial_<tutorial>.html")
def tutorial(tutorial):
    uid = tutorial
    v = by_uid["tutorials"][uid]
    data = _data()
    data["tutorial"] = format_workshop(v)
    return render_template("tutorial.html", **data)

@app.route("/<year>/tutorial_<tutorial>.html")
def past_tutorial(year,tutorial):
    uid = tutorial
    v = by_uid["archive"][year]["tutorials"][uid]
    data = _data()
    data["year"] = year
    data["isArchive"] = True
    data["tutorial"] = format_workshop(v)
    return render_template("tutorial.html", **data)

@app.route("/roundtable_<roundtable>.html")
def roundtable(roundtable):
    uid = roundtable
    v = by_uid["roundtables"][uid]
    data = _data()
    data["roundtable"] = format_workshop(v)
    return render_template("roundtable.html", **data)

@app.route("/<year>/roundtable_<roundtable>.html")
def past_roundtable(year,roundtable):
    uid = roundtable
    v = by_uid["archive"][year]["roundtables"][uid]
    data = _data()
    data["year"] = year
    data["isArchive"] = True
    data["roundtable"] = format_workshop(v)
    return render_template("roundtable.html", **data)

@app.route("/proceeding_<proceeding>.html")
def proceeding(proceeding):
    uid = proceeding
    v = by_uid["proceedings"][uid]
    data = _data()
    data["proceeding"] = format_workshop(v)
    return render_template("proceeding.html", **data)

@app.route("/<year>/proceeding_<proceeding>.html")
def past_proceeding(year, proceeding):
    uid = proceeding
    v = by_uid["archive"][year]["proceedings"][uid]
    data = _data()
    data["year"] = year
    data["isArchive"] = True
    data["proceeding"] = format_workshop(v)
    return render_template("proceeding.html", **data)

@app.route("/symposium_<symposium>.html")
def symposium(symposium):
    uid = symposium
    v = by_uid["symposiums"][uid]
    data = _data()
    data["symposium"] = format_workshop(v)
    return render_template("symposium.html", **data)

@app.route("/<year>/symposium_<symposium>.html")
def past_symposium(year, symposium):
    uid = symposium
    v = by_uid["archive"][year]["symposiums"][uid]
    data = _data()
    data["year"] = year
    data["isArchive"] = True
    data["symposium"] = format_workshop(v)
    return render_template("symposium.html", **data)

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
    for proceeding in site_data["proceedings"]:
        yield "proceeding", {"proceeding": str(proceeding["UID"])}
    for symposium in site_data["symposiums"]:
        yield "symposium", {"symposium": str(symposium["UID"])}
    for workshop in site_data["workshops"]:
        yield "workshop", {"workshop": str(workshop["UID"])}

    for year in site_data["archive"]["years_list"]:
        if site_data["archive"]["has_summary"][year] is True:
            yield f"/{year}/highlights.html"

        for typ in site_data["archive"][year]:
            if not typ == "highlights":
                yield "archive", {"year": year, "template": typ}
                routeName = "past_" + typ[:-1]

                for item in site_data["archive"][year][typ]:
                    yield str(routeName), {"year": year, str(typ[:-1]): str(item["UID"])}

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
