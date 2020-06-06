def extract_list_field(v, key):
    value = v.get(key, "")
    if isinstance(value, list):
        return value
    else:
        return value.split("|")


def format_paper(v):
    list_keys = ["authors", "keywords", "session"]
    list_fields = {}
    for key in list_keys:
        list_fields[key] = extract_list_field(v, key)

    return {
        "id": v["UID"],
        "forum": v["UID"],
        "content": {
            "title": v["title"],
            "authors": list_fields["authors"],
            "keywords": list_fields["keywords"],
            "abstract": v["abstract"],
            "TLDR": v["abstract"],
            "recs": [],
            "session": list_fields["session"],
            "pdf_url": v.get("pdf_url", ""),
        },
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
