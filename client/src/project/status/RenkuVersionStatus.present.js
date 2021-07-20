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
import { Alert, Button, Spinner, UncontrolledCollapse } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faCheck } from "@fortawesome/free-solid-svg-icons";
import { ExternalLink, Loader } from "../../utils/UIComponents";
import { MigrationStatus } from "../Project";


/**
 * WHAT DO WE DO WITH
 * -- dockerfile_renku_version and latest_renku_version inside dockerfile_renku_status
 *
 *
 */
const RENKU_VERSION_SCENARIOS = {
  PROJECT_NOT_SUPPORTED: "PROJECT_NOT_SUPPORTED",
  RENKU_UP_TO_DATE: "RENKU_UP_TO_DATE",
  NEW_VERSION_NOT_REQUIRED_AUTO: "NEW_VERSION_NOT_REQUIRED_AUTO",
  NEW_VERSION_REQUIRED_AUTO: "NEW_VERSION_REQUIRED_AUTO",
  NEW_VERSION_NOT_REQUIRED_MANUAL: "NEW_VERSION_NOT_REQUIRED_MANUAL",
  NEW_VERSION_REQUIRED_MANUAL: "NEW_VERSION_REQUIRED_MANUAL"
};

function getRenkuVersionStatus({
  project_supported, newer_renku_available, automated_dockerfile_update, migration_required }) {
  if (!project_supported) return RENKU_VERSION_SCENARIOS.PROJECT_NOT_SUPPORTED;
  if (!newer_renku_available) return RENKU_VERSION_SCENARIOS.RENKU_UP_TO_DATE;
  if (automated_dockerfile_update) {
    if (migration_required)
      return RENKU_VERSION_SCENARIOS.NEW_VERSION_REQUIRED_AUTO;
    return RENKU_VERSION_SCENARIOS.NEW_VERSION_NOT_REQUIRED_AUTO;
  }
  else if (migration_required) { return RENKU_VERSION_SCENARIOS.NEW_VERSION_REQUIRED_MANUAL; }
  return RENKU_VERSION_SCENARIOS.NEW_VERSION_NOT_REQUIRED_MANUAL;
}


function RenkuVersionAutomaticUpdateSection(
  { renkuVersionStatus, maintainer, migration_status, onMigrateProject, updateInstruction, externalUrl }
) {
  return <Fragment>
    {
      renkuVersionStatus === RENKU_VERSION_SCENARIOS.NEW_VERSION_NOT_REQUIRED_AUTO ?
        <p>
          If you wish to take advantage of new features, you can upgrade to the latest version of
          <strong> renku</strong>.
        </p>
        :
        <p>An upgrade is necessary to work with datasets from the UI.</p>
    }
    {
      maintainer ?
        <Button
          color="warning"
          className="float-end"
          disabled={migration_status === MigrationStatus.MIGRATING || migration_status === MigrationStatus.FINISHED}
          onClick={onMigrateProject}
        >
          {migration_status === MigrationStatus.MIGRATING || migration_status === MigrationStatus.FINISHED ?
            <span><Spinner size="sm" /> Updating...</span> : "Update"
          }
        </Button>
        :
        <p>
          <strong>You do not have the required permissions to upgrade this project.</strong>
            &nbsp;You can <ExternalLink role="text" size="sm"
            title="ask a project maintainer" url={`${externalUrl}/project_members`} /> to
          do that for you.
        </p>
    }
    <br/><br/>
    <Button color="link" className="ps-0 mb-2 link-alert-warning text-start" id="btn_instructions">
      <i>Do you prefer manual instructions?</i>
    </Button>
    <UncontrolledCollapse toggler="#btn_instructions">
      <p>{updateInstruction}</p>
    </UncontrolledCollapse>
  </Fragment>;
}

function RenkuVersionManualUpdateSection({ renkuVersionStatus, updateInstruction }) {
  // Shall we display a different message for maintainer / not maintainer
  return <Fragment>
    {
      renkuVersionStatus === RENKU_VERSION_SCENARIOS.NEW_VERSION_NOT_REQUIRED_MANUAL ?
        <p>
          If you wish to take advantage of new features, you can upgrade to the latest version of renku.
        </p>
        :
        <p>
          An upgrade is necessary to work with datasets from the UI.
        </p>
    }
    <Button color="link" className="ps-0 mb-2 link-alert-warning text-start" id="btn_instructions">
      <i>Automated update is not possible, but you can follow these instructions to update manually.</i>
    </Button>
    <UncontrolledCollapse toggler="#btn_instructions">
      <p>{updateInstruction}</p>
    </UncontrolledCollapse>
  </Fragment>;
}

function RenkuVersionStatusBody(props) {
  const { project_supported, core_renku_version, project_renku_version, check_error, getErrorMessage,
    migration_required, migration_status, migration_error, dockerfile_renku_status } = props.migration;

  const loading = props.loading;
  const fetching = migration_required === null && check_error === null;

  let body = null;

  if (loading || fetching) {
    body = (<Loader />);
  }
  else if (check_error) {
    body = getErrorMessage("checking", "renku", check_error.reason);
  }
  else if (migration_status === MigrationStatus.ERROR && migration_error
  && (migration_error.dockerfile_update_failed || migration_error.migrations_failed)) {
    body = getErrorMessage("updating", "renku", migration_error.reason);
  }
  else {
    let updateSection = null;
    const { maintainer, onMigrateProject, updateInstruction, externalUrl } = props;
    const { automated_dockerfile_update, newer_renku_available } = dockerfile_renku_status || {};

    const renkuVersionStatus = getRenkuVersionStatus(
      { project_supported, newer_renku_available, automated_dockerfile_update, migration_required });

    switch (renkuVersionStatus) {
      case RENKU_VERSION_SCENARIOS.PROJECT_NOT_SUPPORTED :
        body = (
          <Alert color="warning">
            <FontAwesomeIcon icon={faExclamationTriangle} />&nbsp;
            { // should we do it like this???
              // should project_renku_version be dockerfile_renku_version???
              project_renku_version ?
                <Fragment>
                  This project appears to be using an experimental version of Renku. Migration is not supported.&nbsp;
                </Fragment>
                : <Fragment>
                  Automatic upgrading of <strong>renku</strong> version is not supported with this project.
                </Fragment>
            }
          </Alert>);
        break;
      case RENKU_VERSION_SCENARIOS.RENKU_UP_TO_DATE :
        body = (<Alert color="success">
          <FontAwesomeIcon icon={faCheck} /> This project is using the latest version of renku.
        </Alert>);
        break;
      case RENKU_VERSION_SCENARIOS.NEW_VERSION_NOT_REQUIRED_AUTO:
      case RENKU_VERSION_SCENARIOS.NEW_VERSION_REQUIRED_AUTO :
        updateSection = <RenkuVersionAutomaticUpdateSection
          renkuVersionStatus={renkuVersionStatus}
          maintainer={maintainer}
          migration_status={migration_status}
          onMigrateProject={onMigrateProject}
          updateInstruction={updateInstruction}
          externalUrl={externalUrl} />;
        break;
      case RENKU_VERSION_SCENARIOS.NEW_VERSION_NOT_REQUIRED_MANUAL:
      case RENKU_VERSION_SCENARIOS.NEW_VERSION_REQUIRED_MANUAL:
        updateSection = <RenkuVersionManualUpdateSection
          renkuVersionStatus={renkuVersionStatus}
          // maintainer={maintainer} shall we make a maintainer version?
          updateInstruction={updateInstruction}
        />;
        break;
      default:
        return null;
    }

    // new version available
    if (body === null && updateSection) {
      body = (
        <Alert color="warning">
          <p>
            <FontAwesomeIcon icon={faExclamationTriangle} />&nbsp;
            A new version of <strong>renku</strong> is available.
          </p>
          {updateSection}
        </Alert>
      );
    }
  }

  const versionStatus = dockerfile_renku_status ?
    <p>
      <strong>Latest Renku Version:</strong> {project_renku_version}<br />
      <strong>Project Renku Version:</strong> {core_renku_version}<br />
    </p> : null;

  return (
    <div>
      {versionStatus}
      {body}
    </div>
  );
}

export default RenkuVersionStatusBody;
export { getRenkuVersionStatus, RENKU_VERSION_SCENARIOS };
