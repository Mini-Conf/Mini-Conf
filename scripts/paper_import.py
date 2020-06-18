import argparse
import re

import pandas as pd

re_author_split = re.compile(" and |, ")
re_curly_brace = re.compile("{([A-Za-z0-9 ]+)}")

acceptable_chars = r"['`\/:\-()?\w\s\d.,]+"
re_newline = re.compile("[ ]*\n[ ]*")
re_inline_italics = re.compile(r"{\\(?:em|it) (" + acceptable_chars + ")}")
re_italics = re.compile(r"\\(?:emph|textit){(" + acceptable_chars + ")}")
re_inline_sc = re.compile(r"{\\sc (" + acceptable_chars + ")}")
re_textsc = re.compile(r"\\textsc{(" + acceptable_chars + ")}")
re_inline_bf = re.compile(r"{\\bf (" + acceptable_chars + ")}")
re_textbf = re.compile(r"\\textbf{(" + acceptable_chars + ")}")
re_textrm = re.compile(r"\\textrm{(" + acceptable_chars + ")}")
re_url = re.compile(r"\\url{(" + acceptable_chars + ")}")
re_footnote = re.compile(r"\\footnote{(" + acceptable_chars + ")}")
re_mathmode = re.compile(r"\$(.*?)\$")
re_cite = re.compile(r"~?\\cite[pt]?{(" + acceptable_chars + ")}")
re_multi_space = re.compile(r"\s+")
re_superscript = re.compile(r"\\textsuperscript{(\d+)}")
re_subscript = re.compile(r"\\textsubscript{(\d+)}")

re_session_extract = re.compile(
    r"\w+ \w+ \d+, \d+ \d+\w ([\w\d\s:\-.,()]+)-\d+ \d+:\d\d UTC.*"
)

direct_replacements = {
    "\\%": "%",
    "\\&": "&",
    "$\\sim$": "~",
    "\\alpha": "ɑ",
    "\\beta": "β",
    "\\gamma": "ɣ",
    "\\propto": "∝",
    "\\Rightarrow": "⇒",
    "\\Leftrightarrow": "⇔",
    "\\Leftarrow": "⇐",
}

subscript_map = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
}
superscript_map = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
}


def convert_superscript_match(match):
    return "".join([superscript_map[char] for char in str(match.group(1))])


def convert_subscript_match(match):
    return "".join([subscript_map[char] for char in str(match.group(1))])


def clean_abstract(abstract):
    for source, dest in direct_replacements.items():
        abstract = abstract.replace(source, dest)
    abstract = re_newline.sub(" ", abstract)
    abstract = re_superscript.sub(convert_superscript_match, abstract)
    abstract = re_subscript.sub(convert_subscript_match, abstract)
    abstract = re_textsc.sub(r"\1", abstract)
    abstract = re_inline_sc.sub(r"\1", abstract)
    abstract = re_textrm.sub(r"\1", abstract)
    abstract = re_textbf.sub(r"\1", abstract)
    abstract = re_inline_bf.sub(r"\1", abstract)
    abstract = re_cite.sub(" ", abstract)
    abstract = re_url.sub(r"\1", abstract)
    abstract = re_footnote.sub(r" (\1)", abstract)
    abstract = re_mathmode.sub(r"\1", abstract)
    abstract = re_inline_italics.sub(r"\1", abstract)
    abstract = re_italics.sub(r"\1", abstract)
    abstract = re_multi_space.sub(" ", abstract)
    return abstract


def clean_title(paper_title):
    for source, dest in direct_replacements.items():
        paper_title = paper_title.replace(source, dest)
    paper_title = re_curly_brace.sub(r"\1", paper_title)
    return paper_title


def miniconf_join_list(lst):
    return "|".join(lst)


def parse_authors(author_string):
    return re_author_split.split(author_string)


def extract_slot(qa_session_info):
    return re_session_extract.match(qa_session_info)[1]


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Format paper details into MiniConf format"
    )
    parser.add_argument(
        "--volume",
        help="Volume in the ACL Anthology that these papers are part of",
        action="store",
        type=str,
        required=True,
    )
    parser.add_argument(
        "--accepted-papers-file",
        help="CSV of paper title, authors, abstract, and submission type",
        action="store",
        type=str,
        default="ACL2020 Accepted Papers Information (to share with other chairs) - Sheet1.csv",
    )
    parser.add_argument(
        "--track-file",
        help="Excel spreadsheet giving each paper's track and ID in the proceedings",
        action="store",
        type=str,
        default="paper_tracks.xls",
    )
    return parser.parse_args()


def main():
    args = parse_arguments()
    papers = pd.read_csv(args.accepted_papers_file)
    track_details = pd.read_excel(args.track_file)

    assert set(papers["Submission ID"].values) == set(track_details["ID"].values)
    papers = papers.merge(right=track_details, left_on="Submission ID", right_on="ID")

    acl_id_stub = str(args.volume) + "."

    papers["authors"] = papers["Authors"].apply(
        lambda x: miniconf_join_list(parse_authors(x))
    )
    papers["Abstract"] = papers["Abstract"].apply(clean_abstract)
    papers["title"] = papers["title"].apply(clean_title)
    papers["UID"] = papers["Line order"].apply(lambda x: acl_id_stub + str(x))
    papers["paper_type"] = papers["Submission Type"]
    papers.rename(columns={"Abstract": "abstract"}, inplace=True)
    papers["keywords"] = ""

    track_slot1 = papers["slot 1"].apply(extract_slot)
    track_slot2 = papers["slot2"].apply(extract_slot)
    assert track_slot1.equals(track_slot2)
    papers["track"] = track_slot1

    papers = papers.loc[
        :,
        [
            "Line order",
            "UID",
            "title",
            "authors",
            "abstract",
            "keywords",
            "track",
            "paper_type",
        ],
    ]
    papers.sort_values(by="Line order", axis=0, inplace=True)
    papers.drop(columns="Line order", inplace=True)
    papers.to_csv("papers.csv", index=False)


if __name__ == "__main__":
    main()
