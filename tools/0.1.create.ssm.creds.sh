#!/bin/bash
set -e

aws ssm put-parameter --name "/accessKeyId" --type "String" --value "update-it-manually-in-ssm"
aws ssm put-parameter --name "/accessKeySecret" --type "String" --value "update-it-manually-in-ssm"
aws ssm put-parameter --name "/postgresPassword" --type "String" --value "update-it-manually-in-ssm"
aws ssm put-parameter --name "/sendgridToken" --type "String" --value "update-it-manually-in-ssm"
