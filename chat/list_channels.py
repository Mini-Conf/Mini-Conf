import argparse
import json
from typing import Any, Dict, List

import pandas as pd
import yaml
from requests import sessions
from rocketchat_API.rocketchat import RocketChat
from tqdm import tqdm


def parse_arguments():
    parser = argparse.ArgumentParser(description="MiniConf Portal Command Line")
    parser.add_argument(
        "--config",
        "-c",
        default="./config.yml",
        help="Configuration yaml filepath. Default: ./config.yml",
    )
    parser.add_argument(
        "--output_file",
        "-o",
        default="channels.csv",
        help="Output csv filepath. Default: ./channels.csv",
    )
    parser.add_argument(
        "--regexp",
        "--regex",
        "-r",
        default=None,
        help="Regular expression for filtering channels by name",
    )
    parser.add_argument(
        "--filter_featured",
        "--featured",
        "-f",
        action="store_true",
        help="Output only featured channels",
    )
    return parser.parse_args()


def postprocess(channels: pd.DataFrame) -> pd.DataFrame:
    if "t" in channels:
        channel_types = {
            "d": "Direct chat",
            "c": "Chat",
            "p": "Private chat",
            "l": "Livechat",
        }
        channels.rename(columns={"t": "channelType"}, inplace=True)
        channels["channelType"] = channels["channelType"].map(channel_types)

    if "msgs" in channels:
        channels.rename(columns={"msgs": "messagesCount"}, inplace=True)

    if "_updatedAt" in channels:
        channels.rename(columns={"_updatedAt": "lastUpdate"}, inplace=True)

    return channels


def get_params(filter_featured: bool = False, regexp: str = None) -> Dict[str, str]:
    # t: channel type (d: Direct chat, c: Chat, p: Private chat, l: Livechat)
    # msgs: number of messages
    fields = ["name", "msgs", "usersCount", "featured", "t", "topic", "_updatedAt"]

    query: Dict[str, Any] = {}
    if filter_featured:
        query["featured"] = True
    if regexp is not None:
        query["name"] = {"$regex": regexp}

    params = {
        "fields": json.dumps({f: True for f in fields}),
        "query": json.dumps(query),
    }
    return params


if __name__ == "__main__":
    args = parse_arguments()
    config = yaml.load(open(args.config), Loader=yaml.SafeLoader)

    with sessions.Session() as session:
        rocket = RocketChat(
            user_id=config["user_id"],
            auth_token=config["auth_token"],
            server_url=config["server"],
            session=session,
        )
        channels_params = get_params(args.filter_featured, args.regexp)

        channels_list: List[Dict] = []
        channels_json = rocket.channels_list(**channels_params).json()
        channels_list.extend(channels_json["channels"])

        count, total = 50, channels_json["total"]
        print(f"Found {total} channels")

        for offset in tqdm(range(count, total, count)):
            channels_json = rocket.channels_list(
                offset=offset, count=count, **channels_params
            ).json()
            channels_list.extend(channels_json["channels"])

        channels_df = postprocess(pd.DataFrame(channels_list))
        channels_df.to_csv(args.output_file, index=False)
