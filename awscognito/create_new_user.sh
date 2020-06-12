#!/usr/bin/env bash

AWS_USER_POOL_ID="us-east-1_lr10OX54W"
AWS_PROFILE="virtual-acl2020"

email=$1
name=$2

aws cognito-idp admin-create-user \
  --profile ${AWS_PROFILE} \
  --user-pool-id "${AWS_USER_POOL_ID}" \
  --username "${email}" \
  --user-attributes "Name=email,Value=${email}" \
  --user-attributes "Name=custom:name,Value=${name}"
