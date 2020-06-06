import csv
import glob
import json
from typing import Any, Dict, List

import yaml


def load_site_data(
    site_data_path: str, site_data: Dict[str, Any], by_uid: Dict[str, Any]
) -> List[str]:
    """Load all for your sitedata one time."""
    extra_files = ["README.md"]
    for f in glob.glob(site_data_path + "/*"):
        extra_files.append(f)
        name, typ = f.split("/")[-1].split(".")
        if typ == "json":
            site_data[name] = json.load(open(f))
        elif typ in {"csv", "tsv"}:
            site_data[name] = list(csv.DictReader(open(f)))
        elif typ == "yml":
            site_data[name] = yaml.load(open(f).read(), Loader=yaml.SafeLoader)

    for typ in ["papers", "speakers", "workshops"]:
        by_uid[typ] = {}
        for p in site_data[typ]:
            by_uid[typ][p["UID"]] = p

    print("Data Successfully Loaded")
    return extra_files
