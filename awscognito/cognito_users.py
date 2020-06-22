# pylint: disable=global-statement,redefined-outer-name
""" Script used to create|disable AWS Cognito user """
import argparse
import sys
from dataclasses import dataclass

import boto3
import pandas
import yaml


@dataclass(frozen=True)
class User:
    """ Class for AWS Cognito user """

    first_name: str
    last_name: str
    email: str
    middle_name: str = ""
    preferred_name: str = ""
    affiliation: str = ""
    timezone: str = ""
    country: str = ""

    def name(self) -> str:
        """ Generate the name field """
        return f"{self.first_name} {self.last_name}"


def create_user(client, profile, user):
    """ Creates a new user in the specified user pool """
    try:
        response = client.admin_create_user(
            UserPoolId=profile["user_pool_id"],
            Username=user.email,
            UserAttributes=[
                {"Name": "email", "Value": user.email},
                {"Name": "email_verified", "Value": "true"},
                {"Name": "custom:name", "Value": user.name()},
            ],
        )
        if response["ResponseMetadata"]["HTTPStatusCode"] == 200:
            print(f"User {user.email} was created successfully")
        return response
    except client.exceptions.UsernameExistsException as error:
        print(f"User {user.email} exists")
        return error.response
    except client.exceptions.ClientError as error:
        print(f"Fail to create user {user.email}")
        return error.response


def delete_user(client, profile, user):
    """ Deletes a user from the pool """
    try:
        response = client.admin_delete_user(
            UserPoolId=profile["user_pool_id"], Username=user.email
        )
        if response["ResponseMetadata"]["HTTPStatusCode"] == 200:
            print(f"User {user.email} was deleted successfully")
        return response
    except client.exceptions.UserNotFoundException as error:
        print(f"User {user.email} does not exist")
        return error.response
    except client.exceptions.ClientError as error:
        print(f"Fail to delete user {user.email}")
        return error.response


def disable_user(client, profile, user):
    """ Disables the specified user """
    try:
        response = client.admin_disable_user(
            UserPoolId=profile["user_pool_id"], Username=user.email
        )
        if response["ResponseMetadata"]["HTTPStatusCode"] == 200:
            print(f"User {user.email} was disabled successfully")
        return response
    except client.exceptions.UserNotFoundException as error:
        print(f"User {user.email} does not exist")
        return error.response
    except client.exceptions.ClientError as error:
        print(f"Fail to disable user {user.email}")
        return error.response


def parse_arguments():
    """ Parse Arguments """
    parser = argparse.ArgumentParser(
        description="AWS Cognito User Command Line",
        # usage="cognito_user.py [-h] [-d] user_file aws_profile",
    )
    parser.add_argument(
        "-d",
        "--disable",
        action="store_true",
        default=False,
        help="Disable users (instead of create) listed in the file",
    )
    parser.add_argument(
        "user_file", help="The file contains user information for AWS Cognito",
    )
    parser.add_argument("aws_profile", help="The file contains AWS profile")

    return parser.parse_args()


def parse_file(path):
    """ Parse user file to read user information """
    has_error = False
    error_message = ""
    users = []

    _, ext = path.split("/")[-1].split(".")
    if ext == "xlsx":
        dataframe = pandas.read_excel(path)
    elif ext == "csv":
        dataframe = pandas.read_csv(path)
    else:
        has_error = True
        error_message = f"File {path} is not supported"

    if has_error is False:
        # Check invalid rows/records
        no_last_name = dataframe["last_name"].isnull()
        no_first_name = dataframe["first_name"].isnull()
        no_email = dataframe["email"].isnull()
        invalid_rows = dataframe.loc[no_last_name | no_first_name | no_email]
        if len(invalid_rows.index) == 0:
            # No invalid records.  Let's go ahead
            users = [User(**kwargs) for kwargs in dataframe.to_dict(orient="records")]
        else:
            has_error = True
            error_message = "Invalid record(s) found"
            users = invalid_rows

    return has_error, users, error_message


if __name__ == "__main__":
    args = parse_arguments()
    user_file = args.user_file
    aws_profile = args.aws_profile
    profile = yaml.load(open(aws_profile).read(), Loader=yaml.SafeLoader)

    # Prepare the AWS client
    client = boto3.client(
        "cognito-idp",
        aws_access_key_id=profile["access_key_id"],
        aws_secret_access_key=profile["secret_access_key"],
        region_name=profile["region_name"],
    )

    # Prepare the user information
    failed, users, message = parse_file(user_file)
    if failed is False:
        # We can create or disable user now
        if args.disable:
            # Disable user
            for user in users:
                disable_user(client, profile, user)
        else:
            # Create user
            for user in users:
                create_user(client, profile, user)
    else:
        print(message)
        if isinstance(users, pandas.DataFrame):
            print(users)
        sys.exit(2)
