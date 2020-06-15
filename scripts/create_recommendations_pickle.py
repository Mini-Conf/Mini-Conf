import argparse
import csv
import pickle

import openreview  # type: ignore

# No type hints for openreview-py package. Ignore mypy


def read_entries(papers_csv):
    with open(papers_csv, "r") as fd:
        entries = list(csv.reader(fd, skipinitialspace=True))
        entries = entries[1:]  # skip header

    return entries


def dump_cached_or(entries, out_pickle):
    cached_or = {}
    for entry in entries:
        cached_or[entry[0]] = openreview.Note(  # id
            "", [], [], [], {"abstract": entry[3], "title": entry[1]}
        )  # Hack. ICLR Recommender script accepts Openreview notes

    with open(out_pickle, "wb") as fd:
        pickle.dump(cached_or, fd)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Convert CSV from original ACL format to Miniconf "
        "compatible format"
    )
    parser.add_argument("--inp", type=str, help="papers.csv")
    parser.add_argument(
        "--out",
        type=str,
        help="Dump entries into a pickle compatible with " "ICLR Recommendation engine",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    entries = read_entries(args.inp)
    dump_cached_or(entries, args.out)


if __name__ == "__main__":
    main()
