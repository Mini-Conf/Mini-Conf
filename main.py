from flask import Flask, render_template, render_template_string, make_response
from flask import jsonify, send_from_directory, redirect
from flask_frozen import Freezer
import pickle, json, yaml, csv
import os, sys, argparse
import glob

site_data = {}

def main(site_data_path):
    global site_data

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
            
    print("Data Successfully Loaded")


# ------------- SERVER CODE -------------------->

app = Flask(__name__)
app.config.from_object(__name__)


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
    return render_template('pages/index.html', **data)

@app.route('/about.html')
def about():
    data = _data()
    data["FAQ"] = site_data["faq"]["FAQ"]
    return render_template('pages/about.html', **data)

@app.route('/papers.html')
def papers():
    data = _data()
    data["papers"] = site_data["papers"]
    return render_template('pages/papers.html', **data)

@app.route('/paper_vis.html')
def paperVis():
    data = _data()
    return render_template('pages/papers_vis.html', **data)


@app.route('/calendar.html')
def schedule():
    data = _data()
    return render_template('pages/schedule.html', **data)


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
    uid = int(poster) - 1
    v = site_data["papers"][uid]
    data = _data()
    data = {"paper": format_paper(v)}
    return render_template('pages/page.html', **data)

@app.route('/papers.json')
def paper_json():
    json = []
    for v in site_data["papers"]:
        json.append(format_paper(v))
    return jsonify(json)

@app.route('/embeddings_<emb>.json')
def embeddings(emb):
    try:
        return send_from_directory('static', 'embeddings_' + emb + '.json')
    except FileNotFoundError:
        return ""

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


# --------------- DRIVER CODE -------------------------->
# Code to turn it all static
freezer = Freezer(app, with_no_argument_rules=False, log_url_for=False)

@freezer.register_generator
def generator():
    yield "home", {}
    yield "index", {}
    yield "about", {}
    yield "papers", {}
    yield "schedule", {}
    yield "paperVis", {}
    yield "paper_json", {}
    yield "schedule", {}
    yield "embeddings", {"emb":"tsne"}

    for i in site_data["papers"].keys():
        yield "poster", {"poster": str(i)}





def parse_arguments():
    parser = argparse.ArgumentParser(description="ICLR Portal Command Line")

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
