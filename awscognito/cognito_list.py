# pylint: disable=global-statement,redefined-outer-name
""" Script used to list AWS Cognito users """
import argparse
import sys
from dataclasses import asdict, dataclass

import boto3
import pandas
import yaml


@dataclass(frozen=True)
class User:
    """ Class for AWS Cognito user """

    email: str
    name: str
    committee: str = "attendee"

    # def name(self) -> str:
    #     """ Generate the name field """
    #     return f"{self.first_name} {self.last_name}"


def list_users(client, profile):
    """ Deletes a user from the pool """
    try:
        response = client.list_users(
            UserPoolId=profile["user_pool_id"],
            # AttributesToGet=['email']
        )
        if response["ResponseMetadata"]["HTTPStatusCode"] == 200:
            print("Get Users successfully")
            return response["Users"]

    except client.exceptions.ClientError as error:
        print("Fail to list users")
        print(error)
        sys.exit(2)

    return []


def load_data(aws_profile, is_debug=False):
    """ Load the profile data and get pool user """
    profile = yaml.load(open(aws_profile).read(), Loader=yaml.SafeLoader)

    # Prepare the AWS client
    client = boto3.client(
        "cognito-idp",
        aws_access_key_id=profile["access_key_id"],
        aws_secret_access_key=profile["secret_access_key"],
        region_name=profile["region_name"],
    )
    aws_users = list_users(client, profile)
    result = []
    for aws_user in aws_users:
        email: str = ""
        name: str = ""
        enabled = aws_user["Enabled"]

        # We assume all users with 'custom:name' attribute is created by our scripts
        for attr in aws_user["Attributes"]:
            attr_name = attr["Name"]
            if attr_name == "email":
                email = attr["Value"]
            elif attr_name == "custom:name":
                name = attr["Value"]

        if name:
            if is_debug:
                print(f"user: {name} <{email}>, enabled: {enabled}")
            result.append(User(name=name, email=email))

    return result


def parse_arguments():
    """ Parse Arguments """
    parser = argparse.ArgumentParser(
        description="AWS Cognito List Command Line",
        # usage="cognito_user.py [-h] aws_profile",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        default=False,
        help="Show the users is enabled or not",
    )
    parser.add_argument("aws_profile", help="The file contains AWS profile")

    return parser.parse_args()


def save_file(users, file_path):
    """ Save user information to the xlsx file """
    dataframe = pandas.DataFrame([asdict(x) for x in users])
    dataframe.to_excel(file_path)
    print(f"User information is written to {file_path}")


if __name__ == "__main__":
    args = parse_arguments()
    users = load_data(args.aws_profile, args.debug)

    save_file(users, "all_users.xlsx")
