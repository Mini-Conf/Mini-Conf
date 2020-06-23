import argparse
import csv


def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert CSV from original ACL format to Miniconf "
        "compatible format"
    )
    parser.add_argument("--inp", nargs="+", help="papers.csv files")
    parser.add_argument(
        "--out", type=str, help="Merged papers csv file",
    )
    return parser.parse_args()


def merge_paper_csvs(out_file, csvs):
    data = []
    for fname in csvs:
        with open(fname, "r") as fd:
            data = data + list(csv.DictReader(fd))
    common_keys = [
        "UID",
        "title",
        "authors",
        "abstract",
        "keywords",
        "track",
        "paper_type",
        "pdf_url",
    ]
    data = [{k: v for k, v in paper.items() if k in common_keys} for paper in data]
    with open(out_file, "w") as fd:
        dict_writer = csv.DictWriter(fd, common_keys)
        dict_writer.writeheader()
        dict_writer.writerows(data)


if __name__ == "__main__":
    args = parse_args()
    merge_paper_csvs(args.out, args.inp)
