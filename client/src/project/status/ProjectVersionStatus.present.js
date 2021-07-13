/*!
 * Copyright 2020 - Swiss Data Science Center (SDSC)
 * A partnership between École Polytechnique Fédérale de Lausanne (EPFL) and
 * Eidgenössische Technische Hochschule Zürich (ETHZ).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Alert, Card, CardBody, CardHeader } from "reactstrap";
import { ACCESS_LEVELS } from "../../api-client";
import TemplateStatusBody from "./TemplateVersionStatus.present";
import RenkuLabUiCompatibilityBody, { getRenkuLabCompatibilityStatus, RENKULAB_COMPATIBILITY_SCENARIOS }
  from "./RenkuLabCompatibilityStatus.present";
import RenkuVersionStatusBody, { getRenkuVersionStatus, RENKU_VERSION_SCENARIOS }
  from "./RenkuVersionStatus.present";

function getErrorMessage(error_while, error_what, error_reason) {
  return <Alert color="danger">
    <p>
      Error while { error_while } the { error_what } version. Please reload the page to try again.
      If the problem persists you should contact the development team on&nbsp;
      <a href="https://gitter.im/SwissDataScienceCenter/renku"
        target="_blank" rel="noreferrer noopener">Gitter</a> or create an issue in&nbsp;
      <a href="https://github.com/SwissDataScienceCenter/renku/issues"
        target="_blank" rel="noreferrer noopener">GitHub</a>.
    </p>
    <div><strong>Error Message</strong><pre>{error_reason}</pre></div>
  </Alert>;
}

/**
 * This function is used to check if the warning sign in the project should be displayed.
 * Receives as a parameter the migration property that comes from the backend.
 *
 * Should we also display the sign if the user is not maintainer???
 */
function displayWarningSignForVersion(migration) {
  const { project_supported, core_compatibility_status, dockerfile_renku_status } = migration;

  const { migration_required } = core_compatibility_status || {};
  const { newer_renku_available, automated_dockerfile_update } = dockerfile_renku_status || {};

  const renkuVersionStatus = getRenkuVersionStatus(
    { project_supported, newer_renku_available, automated_dockerfile_update, migration_required });
  const renkuLabCompatibilityStatus = getRenkuLabCompatibilityStatus(
    { project_supported, migration_required, renkuVersionStatus });

  if (renkuVersionStatus === RENKU_VERSION_SCENARIOS.PROJECT_NOT_SUPPORTED ||
    renkuVersionStatus === RENKU_VERSION_SCENARIOS.NEW_VERSION_REQUIRED_AUTO ||
    renkuVersionStatus === RENKU_VERSION_SCENARIOS.NEW_VERSION_REQUIRED_MANUAL)
    return true;
  if (renkuLabCompatibilityStatus === RENKULAB_COMPATIBILITY_SCENARIOS.PROJECT_NOT_SUPPORTED ||
    renkuLabCompatibilityStatus === RENKULAB_COMPATIBILITY_SCENARIOS.NEW_VERSION_SHOW_BUTTON ||
    renkuLabCompatibilityStatus === RENKULAB_COMPATIBILITY_SCENARIOS.NEW_VERSION_NO_BUTTON)
    return true;

  return false;
}

function ProjectVersionStatusBody(props) {
  const maintainer = props.visibility.accessLevel >= ACCESS_LEVELS.MAINTAINER;
  const isLogged = props.user && props.user.logged;

  const updateInstruction = (
    <Fragment>
      You can launch
      a <Link to={props.launchNotebookUrl}>session</Link> and follow the&nbsp;
      <a href={`${"https://renku.readthedocs.io/en/latest/user/upgrading_renku.html" +
        "#upgrading-your-image-to-use-the-latest-renku-cli-version"}`}>
        instructions for upgrading</a>.
      When finished, you will need to run <code>renku migrate</code>.
    </Fragment>
  );

  if (!isLogged && !props.loading) return null;

  return [
    <Card key="renkuLabUICompatibility" className="border-rk-light mb-4">
      <CardHeader className="bg-white p-3 ps-4">RenkuLab UI Compatibility</CardHeader>
      <CardBody className="p-4 pt-3 pb-3 lh-lg">
        <Row><Col>
          <RenkuLabUiCompatibilityBody
            {...props}
            updateInstruction={updateInstruction}
            maintainer={maintainer}
            getErrorMessage={getErrorMessage}/>
        </Col></Row>
      </CardBody>
    </Card>,
    <Card key="renkuVersion" className="border-rk-light mb-4">
      <CardHeader className="bg-white p-3 ps-4">Renku Version</CardHeader>
      <CardBody className="p-4 pt-3 pb-3 lh-lg">
        <Row><Col>
          <RenkuVersionStatusBody
            {...props}
            updateInstruction={updateInstruction}
            maintainer={maintainer}
            getErrorMessage={getErrorMessage}/>
        </Col></Row>
      </CardBody>
    </Card>,
    <Card key="templateVersion" className="border-rk-light mb-4">
      <CardHeader className="bg-white p-3 ps-4">Template Version</CardHeader>
      <CardBody className="p-4 pt-3 pb-3 lh-lg pb-2">
        <Row><Col>
          <TemplateStatusBody
            {...props}
            updateInstruction={updateInstruction}
            maintainer={maintainer}
            getErrorMessage={getErrorMessage}/>
        </Col></Row>
      </CardBody>
    </Card>
  ];
}
export default ProjectVersionStatusBody;
export { displayWarningSignForVersion };
