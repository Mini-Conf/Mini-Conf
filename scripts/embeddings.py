import argparse
import csv

import torch
from sentence_transformers import SentenceTransformer


def parse_arguments():
    parser = argparse.ArgumentParser(description="MiniConf Portal Command Line")

    parser.add_argument("papers", default=False, help="papers file to parse")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()

    model = SentenceTransformer("allenai-specter")

    with open(args.papers, "r") as f:
        papers = [row["title"] + "[SEP]" + row["abstract"] for row in csv.DictReader(f)]

    embeddings = model.encode(papers, convert_to_tensor=True)
    torch.save(embeddings, "embeddings.torch")
