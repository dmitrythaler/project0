#!/bin/bash
ROLE_NAME=ebProject0Role
POLICY_NAME=ebProject0Policies
AWS_PROFILE_NAME=awsProject0Profile

T=`aws iam --profile $AWS_PROFILE_NAME get-role --role-name "$ROLE_NAME" --query "Role.Arn" --output text 2>/dev/null`
if [[ ! -z "$T" ]]; then
  echo "The role \"$ROLE_NAME\" is already created: $T"
  exit 0
fi

aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://eb-p0-assume.json
aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth --role-name $ROLE_NAME
aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy --role-name $ROLE_NAME
aws iam put-role-policy --role-name $ROLE_NAME --policy-name $POLICY_NAME --policy-document file://eb-p0-policies.json
