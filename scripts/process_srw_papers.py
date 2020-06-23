import argparse
import csv

import pandas as pd

from scripts.paper_import import clean_abstract, clean_title


def main(srw_papers_csv: str, srw_ids_xlsx: str, output_file: str) -> pd.DataFrame:
    srw_papers_df = pd.read_csv(
        srw_papers_csv, sep=",", encoding="utf-8", na_values=None, keep_default_na=False
    )
    srw_ids_df = pd.read_excel(srw_ids_xlsx)
    srw_ids_df.set_index("SubID", inplace=True, drop=True, verify_integrity=True)
    sub_ids = [int(row.get("UID")[4:]) for _, row in srw_papers_df.iterrows()]
    srw_papers_df["abstract"] = srw_papers_df["abstract"].apply(clean_abstract)
    srw_papers_df["title"] = srw_papers_df["title"].apply(clean_title)
    srw_papers_df["pdf_url"] = srw_ids_df.loc[sub_ids].loc[:, "Anthology link"].tolist()

    srw_papers_df.to_csv(
        output_file, sep=",", index=False, encoding="utf-8", quoting=csv.QUOTE_ALL
    )


if __name__ == "__main__":
    cmdline_parser = argparse.ArgumentParser(description=__doc__)
    cmdline_parser.add_argument(
        "--srw-papers-file", help="old srw_papers.csv without pdf_url"
    )
    cmdline_parser.add_argument(
        "--srw-ids-file",
        help="srw-ids.xlsx from https://github.com/acl-org/acl-2020-virtual-conference/issues/157#issuecomment-647821450",
    )
    cmdline_parser.add_argument("--output-file", help="ooutput srw_papers.csv file")
    args = cmdline_parser.parse_args()

    main(
        srw_papers_csv=args.srw_papers_file,
        srw_ids_xlsx=args.srw_ids_file,
        output_file=args.output_file,
    )
