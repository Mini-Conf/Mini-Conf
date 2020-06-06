import csv
import glob
import json
from typing import Any, Dict, List

import yaml


def load_site_data(
    site_data_path: str, site_data: Dict[str, Any], by_uid: Dict[str, Any]
) -> List[str]:
    """Loads all site data at once.

    Populates the `site_data` and `by_uid` using files under `site_data_path`.
    """
    extra_files = ["README.md"]
    for path in glob.glob(site_data_path + "/*"):
        extra_files.append(path)
        name, typ = path.split("/")[-1].split(".")
        with open(path) as file:
            if typ == "json":
                site_data[name] = json.load(file)
            elif typ in {"csv", "tsv"}:
                site_data[name] = list(csv.DictReader(file))
            elif typ == "yml":
                site_data[name] = yaml.load(file.read(), Loader=yaml.SafeLoader)

    for typ in ["papers", "speakers", "workshops"]:
        by_uid[typ] = {}
        for p in site_data[typ]:
            by_uid[typ][p["UID"]] = p

    print("Data Successfully Loaded")
    return extra_files
