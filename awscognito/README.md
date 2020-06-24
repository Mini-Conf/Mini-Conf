We use AWS Cognito to manage user pools.
See [here](https://github.com/acl-org/acl-2020-virtual-conference/issues/53) for documents.

This folder contains some helper scripts to manage the user pool.


* Create a new user.
```bash
./create_new_user.sh username@example.com "FirstName LastName"
```

* Verify a user email. This command will not be needed for new users as we have set that field in 
`create_new_user.sh` script now. The `email_verified` must be true in order to allow the user to
reset their passwords.
```
./verify_user_email.sh username@example.com
```

* Create user(s) from .xlsx or .csv file.  This will set `email_verified` to true as well
```bash
python cognito_users.py user.csv aws_profile.yml
```

* To check/disable/enable user(s) from .xlsx or .csv file.

```bash
python cognito_users.py --check user.csv aws_profile.yml
python cognito_users.py -d user.csv aws_profile.yml
python cognito_users.py -e user.csv aws_profile.yml
```

* Get help message of using cognito_users.py

```bash
python cognito_users.py -h
```

* Create dry run user(s) from .xlsx or .csv file.  This will set `email_verified` to true as well
```bash
python dry_run_users.py user.csv aws_profile.yml
```

* To check/disable/enable user(s) from .xlsx or .csv file.

```bash
python dry_run_users.py --check user.csv aws_profile.yml
python dry_run_users.py -d user.csv aws_profile.yml
python dry_run_users.py -e user.csv aws_profile.yml
```

* Get help message of using dry_run_users.py

```bash
python cognito_users.py -h
```

.
