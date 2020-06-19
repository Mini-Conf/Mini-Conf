#!/usr/bin/env bash

AWS_USER_POOL_ID="us-east-1_lr10OX54W"
AWS_PROFILE="virtual-acl2020"

email=$1
aws cognito-idp admin-update-user-attributes \
  --profile ${AWS_PROFILE} \
  --user-pool-id "${AWS_USER_POOL_ID}" \
  --username "${email}" \
  --user-attributes "Name=email_verified,Value=true"
