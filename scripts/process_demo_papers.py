import argparse
import csv

import pandas as pd

from scripts.paper_import import (
    clean_abstract,
    clean_title,
    miniconf_join_list,
    parse_authors,
)


def main(demo_papers_xlsx: str, demo_ids_xlsx: str, output_file: str) -> pd.DataFrame:
    demo_papers_df = pd.read_excel(demo_papers_xlsx)
    demo_papers_df.drop_duplicates("UID", inplace=True, keep="first")
    demo_ids_df = pd.read_excel(demo_ids_xlsx)
    demo_ids_df.set_index("SubID", inplace=True, drop=True, verify_integrity=True)

    sub_ids = [row.get("UID") for _, row in demo_papers_df.iterrows()]
    demo_papers_df["abstract"] = demo_papers_df["abstract"].apply(clean_abstract)
    demo_papers_df["title"] = demo_papers_df["title"].apply(clean_title)
    demo_papers_df["authors"] = demo_papers_df["authors"].apply(
        lambda x: miniconf_join_list(parse_authors(x))
    )
    demo_papers_df["demo_url"] = demo_papers_df.loc[:, "URL"].tolist()
    demo_papers_df["keywords"] = ""
    demo_papers_df["pdf_url"] = demo_ids_df.loc[sub_ids].loc[:, "PDF"].tolist()

    colnames = [
        "UID",
        "title",
        "authors",
        "abstract",
        "keywords",
        "track",
        "paper_type",
        "pdf_url",
        "demo_url",
    ]
    demo_papers_df.to_csv(
        output_file,
        sep=",",
        index=False,
        encoding="utf-8",
        quoting=csv.QUOTE_ALL,
        columns=colnames,
    )


if __name__ == "__main__":
    cmdline_parser = argparse.ArgumentParser(description=__doc__)
    cmdline_parser.add_argument(
        "--demo-papers-file", help="DemoPapers_SHARED.xlsx from demo chairs"
    )
    cmdline_parser.add_argument(
        "--demo-ids-file",
        help="demo-ids.xlsx from https://github.com/acl-org/acl-2020-virtual-conference/issues/157#issuecomment-647821450",
    )
    cmdline_parser.add_argument("--output-file", help="ooutput demo_papers.csv file")
    args = cmdline_parser.parse_args()

    main(
        demo_papers_xlsx=args.demo_papers_file,
        demo_ids_xlsx=args.demo_ids_file,
        output_file=args.output_file,
    )
