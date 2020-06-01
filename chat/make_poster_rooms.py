import argparse
import csv
import random
import string

from requests import sessions
from pprint import pprint
from rocketchat_API.rocketchat import RocketChat
import yaml

def parse_arguments():
    parser = argparse.ArgumentParser(description="MiniConf Portal Command Line")
    parser.add_argument("--config", default="config.yml", help="Configuration yaml")
    parser.add_argument("--papers", default="../sitedata/papers.csv", help="Papers CSV")
    parser.add_argument("--test", action='store_true')
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()


    config = yaml.load(open(args.config))
    papers = list(csv.DictReader(open(args.papers)))

    with sessions.Session() as session:
        rocket = RocketChat(config["username"],
                            config["password"],
                            server_url=config["server"],
                            session=session)

        for paper in papers:
            channel_name = "paper_" + paper["UID"]
            if not args.test:
                created = rocket.channels_create(channel_name).json()
                print(channel_name, created)
            id = rocket.channels_info(channel = channel_name).json()["channel"]["_id"]

            
            # Change to topic of papers. 
            topic = "%s - %s"%(
                paper["title"],
                paper["authors"],
            )
            if not args.test:
                rocket.channels_set_topic(id, topic).json()

            print("Creating " + channel_name + " topic " + topic)



