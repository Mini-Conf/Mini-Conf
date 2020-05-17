import csv, argparse
import transformers

def parse_arguments():
    parser = argparse.ArgumentParser(description="MiniConf Portal Command Line")

    parser.add_argument('papers', default=False,
                        help="papers file to parse")
    return parser.parse_args()



if __name__ == "__main__":
    args = parse_arguments()
    tokenizer = transformers.AutoTokenizer.from_pretrained("deepset/sentence_bert")

    model = transformers.AutoModel.from_pretrained("deepset/sentence_bert")
    
    with open(args.papers, "r") as f:
        for row in list(csv.DictReader(f)):
            print(row["abstract"])
