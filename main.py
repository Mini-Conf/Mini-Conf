from flask import Flask, render_template, render_template_string, make_response
from flask import jsonify, send_from_directory, redirect
from flask_frozen import Freezer
import pickle, json, yaml, csv
import os, sys, argparse
import glob

site_data = {}
papers_by_uid = {}
speakers_by_uid = {}
def main(site_data_path):
    global site_data, papers_by_uid, speakers_by_ud

    # Load all for your sitedata one time.
    for f in glob.glob(site_data_path +"/*"):
        name, typ = f.split("/")[-1].split(".")
        if typ == "json":
            site_data[name] = json.load(open(f))
        elif typ == "csv" or typ == "tsv":
            site_data[name] = list(csv.DictReader(open(f)))
        elif typ == "yml":
            site_data[name] = yaml.load(open(f).read(),
                                        Loader=yaml.BaseLoader)
    
    """
    Fill-in: Any data preprocessing
    """
    for p in site_data["papers"]:
        papers_by_uid[p["UID"]] = p
    for p in site_data["speakers"]:
        speakers_by_uid[p["UID"]] = p
        
    print("Data Successfully Loaded")


# ------------- SERVER CODE -------------------->

app = Flask(__name__)
app.config.from_object(__name__)
freezer = Freezer(app)

# MAIN PAGES

def _data():
    data = {}
    data["config"] = site_data["config"]
    return data

@app.route('/')
def index():
    return redirect('/index.html')

@app.route('/index.html')
def home():
    data = _data()
    data["committee"] = site_data["committee"]["committee"]
    return render_template('index.html', **data)

@app.route('/about.html')
def about():
    data = _data()
    data["FAQ"] = site_data["faq"]["FAQ"]
    return render_template('about.html', **data)

@app.route('/papers.html')
def papers():
    data = _data()
    data["papers"] = site_data["papers"]
    return render_template('papers.html', **data)

@app.route('/paper_vis.html')
def paperVis():
    data = _data()
    return render_template('papers_vis.html', **data)


@app.route('/calendar.html')
def schedule():
    data = _data()
    data["day"] = {"speakers": site_data["speakers"],
                   "highlighted": [format_paper(papers_by_uid[h["UID"]])
                                   for h in site_data["highlighted"]]}
    return render_template('schedule.html', **data)


def format_paper(v):
    return {
            "id": v["UID"],
            "forum": v["UID"],
            "content": {"title": v["title"],
                        "authors": v["authors"].split("|"),
                        "keywords": v["keywords"].split("|"),
                        "abstract": v["abstract"],
                        "TLDR": v["abstract"],
                        "recs": [],
                        "session": v.get("session", "").split("|"),
            }}

@app.route('/poster_<poster>.html')
def poster(poster):
    uid = poster
    v = papers_by_uid[uid]
    data = _data()
    data["paper"] =  format_paper(v)
    return render_template('poster.html', **data)

@app.route('/speaker_<speaker>.html')
def speaker(speaker):
    uid = speaker
    v = speakers_by_uid[uid]
    data = _data()
    data["speaker"] =  v
    return render_template('speaker.html', **data)

@app.route('/papers.json')
def paper_json():
    json = []
    for v in site_data["papers"]:
        json.append(format_paper(v))
    return jsonify(json)


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


# --------------- DRIVER CODE -------------------------->
# Code to turn it all static


@freezer.register_generator
def generator():

    for paper in site_data["papers"]:
        yield "poster", {"poster": str(paper["UID"])}
    for speaker in site_data["speakers"]:
        yield "speaker", {"speaker": str(speaker["UID"])}



def parse_arguments():
    parser = argparse.ArgumentParser(description="MiniConf Portal Command Line")

    parser.add_argument('--build', action='store_true', default=False,
                        help="Convert the site to static assets")

    parser.add_argument('-b', action='store_true', default=False, dest="build",
                        help="Convert the site to static assets")

    parser.add_argument('path',
                        help="Pass the JSON data path and run the server")

    args = parser.parse_args()
    return args

if __name__ == "__main__":
    args = parse_arguments()

    site_data_path = args.path
    main(site_data_path)

    if args.build:
        freezer.freeze()
    else:
        debug_val = False
        if(os.getenv("FLASK_DEBUG") == "True"):
            debug_val = True

        app.run(port=5000, debug=debug_val)
