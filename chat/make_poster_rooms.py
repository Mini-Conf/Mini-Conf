import csv
import random
import string

from requests import sessions
from pprint import pprint
from rocketchat_API.rocketchat import RocketChat
import yaml

config = yaml.load(open("config.yml"))
papers = list(csv.DictReader(open("../sitedata/papers.csv")))

with sessions.Session() as session:
    rocket = RocketChat(config["username"],
                        config["password"],
                        server_url=config["server"],
                        session=session)

    for paper in papers:
        channel_name = "paper_" + paper["UID"]
        print(channel_name, rocket.channels_create(channel_name).json())
        id = rocket.channels_info(channel = channel_name).json()["channel"]["_id"]

        # Change to topic of papers. 
        topic = "%s - %s"%(
            paper["title"],
            paper["authors"],
        )
        rocket.channels_set_topic(id, topic).json()

        print("Created " + channel_name + " topic " + topic)
        


