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
