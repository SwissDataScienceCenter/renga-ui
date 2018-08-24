#!/bin/bash
#
# Copyright 2018 - Swiss Data Science Center (SDSC)
# A partnership between École Polytechnique Fédérale de Lausanne (EPFL) and
# Eidgenössische Technische Hochschule Zürich (ETHZ).
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e

MINIKUBE_IP=`minikube ip`
CURRENT_CONTEXT=`kubectl config current-context`
WELCOME_PAGE=`echo "## Welcome to Renku through telepresence
Some deployment-specific information will be read from the your values.yaml file and be displayed as markdown file." | base64`

echo "You are going to exchange k8s deployments using the following context: ${CURRENT_CONTEXT}"
read -p "Do you want to proceed? [y/n]"
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi
tee > ./public/config.json << EOF
{
  "BASE_URL": "http://${MINIKUBE_IP}",
  "JUPYTERHUB_URL": "http://${MINIKUBE_IP}/jupyterhub",
  "GATEWAY_URL": "http://${MINIKUBE_IP}/api",
  "WELCOME_PAGE": "${WELCOME_PAGE}"
}
EOF

echo "================================================================================================================="
echo "Once telepresence has started, type the following command to start the development server:"
echo "BROWSER=none npm start"
echo "================================================================================================================="

BROWSER=none telepresence --swap-deployment renku-ui --namespace renku --method inject-tcp --expose 3000:80 --run-shell
