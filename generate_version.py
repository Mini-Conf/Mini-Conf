from __future__ import print_function

import json
import subprocess
import sys
from time import strftime


def get_version_info():
    now = strftime("%Y-%m-%d %H:%M:%S")
    # If we would like the short form, add '--short' option
    # sha = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'])
    sha = subprocess.check_output(["git", "rev-parse", "HEAD"])
    # For Python3, convert bytes to str
    sha = sha.decode() if isinstance(sha, bytes) else sha
    sha = sha.strip()
    version = {"date": now, "sha": sha}
    return json.dumps(version, indent=4)


def show_usage():
    print("Usage: python[3] %s output_file" % sys.argv[0])


def writeFile(path, string):
    f = open(path, "w")
    f.write(string)
    f.close()


if __name__ == "__main__":
    if len(sys.argv) == 2:
        file_path = sys.argv[1]
        json_string = get_version_info()
        writeFile(file_path, json_string)
    else:
        show_usage()
