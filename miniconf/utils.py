def get_paper_rocketchat(paper_id):
    return "paper-" + paper_id.replace(".", "-")


def format_paper(v, by_uid):
    list_keys = ["authors", "keywords"]
    list_fields = {}
    for key in list_keys:
        list_fields[key] = extract_list_field(v, key)

    return {
        "id": v["UID"],
        "forum": v["UID"],
        "rocketchat_channel": get_paper_rocketchat(v["UID"]),
        "content": {
            "title": v["title"],
            "authors": list_fields["authors"],
            "keywords": list_fields["keywords"],
            "abstract": v["abstract"],
            "TLDR": v["abstract"][:250] + "...",
            "pdf_url": v.get("pdf_url", ""),
            "demo_url": v.get("demo_url", ""),
            "track": v.get("track", ""),
            "sessions": v["sessions"],
            "recs": [],
        },
    }


def extract_list_field(v, key):
    value = v.get(key, "")
    if isinstance(value, list):
        return value
    else:
        return value.split("|")


