import argparse
import csv
import json

import sklearn.manifold
import torch
import umap  # type: ignore

# No type stubs for umap-learn. Ignore mypy


def parse_arguments():
    parser = argparse.ArgumentParser(description="MiniConf Portal Command Line")
    parser.add_argument("papers", default=False, help="paper file")

    parser.add_argument("embeddings", default=False, help="embeddings file to shrink")
    parser.add_argument("--projection-method", default="tsne", help="[umap|tsne]")

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()
    emb = torch.load(args.embeddings)
    if args.projection_method == "tsne":
        out = sklearn.manifold.TSNE(n_components=2).fit_transform(emb.numpy())
    elif args.projection_method == "umap":
        out = umap.UMAP(
            n_neighbors=5, min_dist=0.3, metric="correlation", n_components=2
        ).fit_transform(emb.numpy())
    else:
        print("invalid projection-method: {}".format(args.projection_method))
        print("Falling back to T-SNE")
        out = sklearn.manifold.TSNE(n_components=2).fit_transform(emb.numpy())
    d = []
    with open(args.papers, "r") as f:
        abstracts = list(csv.DictReader(f))
        for i, row in enumerate(abstracts):
            d.append({"id": row["UID"], "pos": out[i].tolist()})
    print(json.dumps(d))
