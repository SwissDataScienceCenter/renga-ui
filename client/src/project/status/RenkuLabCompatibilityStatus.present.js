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
import { Alert, Button, Spinner } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faCheck } from "@fortawesome/free-solid-svg-icons";
import { ExternalLink, Loader } from "../../utils/UIComponents";
import { MigrationStatus } from "../Project";
import { getRenkuVersionStatus, RENKU_VERSION_SCENARIOS } from "./RenkuVersionStatus.present";

const RENKULAB_COMPATIBILITY_SCENARIOS = {
  PROJECT_NOT_SUPPORTED: "PROJECT_NOT_SUPPORTED",
  RENKULAB_UP_TO_DATE: "RENKULAB_UP_TO_DATE",
  NEW_VERSION_SHOW_BUTTON: "NEW_VERSION_SHOW_BUTTON",
  NEW_VERSION_NO_BUTTON: "NEW_VERSION_NO_BUTTON"
};

function getRenkuLabCompatibilityStatus({ project_supported, migration_required, renkuVersionStatus }) {
  if (!project_supported) return RENKULAB_COMPATIBILITY_SCENARIOS.PROJECT_NOT_SUPPORTED;
  if (!migration_required) return RENKULAB_COMPATIBILITY_SCENARIOS.RENKULAB_UP_TO_DATE;
  if (renkuVersionStatus === RENKU_VERSION_SCENARIOS.NEW_VERSION_REQUIRED_AUTO
    || renkuVersionStatus === RENKU_VERSION_SCENARIOS.NEW_VERSION_NOT_REQUIRED_AUTO) {
    // in this case the dockerfile and metadata will be upgraded at once
    //so we don't display the button
    return RENKULAB_COMPATIBILITY_SCENARIOS.NEW_VERSION_NO_BUTTON;
  }
  return RENKULAB_COMPATIBILITY_SCENARIOS.NEW_VERSION_SHOW_BUTTON;
}


function RenkuLabUiCompatibilityBody(props) {
  const { project_supported, core_compatibility_status, check_error, dockerfile_renku_status,
    getErrorMessage, migration_status, migration_error //are this two available ???
  } = props.migration;

  const { project_metadata_version, current_metadata_version, migration_required } = core_compatibility_status || {};
  const { newer_renku_available, automated_dockerfile_update } = dockerfile_renku_status || {};

  const loading = props.loading;
  const fetching = project_supported === null && check_error === null;

  let body = null;

  if (loading || fetching) {
    body = (<Loader />);
  }
  else if (check_error) {
    body = getErrorMessage("checking", "renku", check_error.reason);
  }
  else if (migration_status === MigrationStatus.ERROR && migration_error
  // eslint-disable-next-line
  && (migration_error.dockerfile_update_failed || migration_error.migrations_failed)) {
    body = getErrorMessage("updating", "renku", migration_error.reason);
  }
  else {

    const renkuVersionStatus = getRenkuVersionStatus(
      { project_supported, newer_renku_available, automated_dockerfile_update, migration_required });

    const renkuLabCompatibilityStatus = getRenkuLabCompatibilityStatus(
      { project_supported, migration_required, renkuVersionStatus }) ;

    switch (renkuLabCompatibilityStatus) {
      case RENKULAB_COMPATIBILITY_SCENARIOS.PROJECT_NOT_SUPPORTED:
        body = (
          <Alert color="warning">
            <FontAwesomeIcon icon={faExclamationTriangle} />&nbsp;
            This project appears to be using an experimental version of Renku.&nbsp;<br /><br />
            You can work with datasets in interactive sessions, but creating or modifying datasets&nbsp;
            are not supported from the UI.
          </Alert>);
        break;
      case RENKULAB_COMPATIBILITY_SCENARIOS.RENKULAB_UP_TO_DATE:
        body = (<Alert color="success">
          <FontAwesomeIcon icon={faCheck} /> This project is up to date with the UI.
        </Alert>);
        break;
      case RENKULAB_COMPATIBILITY_SCENARIOS.NEW_VERSION_SHOW_BUTTON:
        body = <Alert color="warning">
          <p>
            <FontAwesomeIcon icon={faExclamationTriangle} /> A new version of <strong>renku</strong> is available.
          </p>
          <p>
            You can work with datasets in interactive sessions, but to create or modify datasets,
            you will need to upgrade the <strong>renku version.</strong>
          </p>
        </Alert>;
        break;
      case RENKULAB_COMPATIBILITY_SCENARIOS.NEW_VERSION_NO_BUTTON:
        body = <Alert color="warning">
          <p>
            <FontAwesomeIcon icon={faExclamationTriangle} /> A new version of <strong>renku</strong> is available.
          </p>
          <p>
            You can work with datasets in interactive sessions, but to create or modify datasets,
            you will need to upgrade the <strong>project metadata version.</strong>
          </p>
          {props.maintainer ?
          /* check if this is correct... maybe we can use the other button instead */
            <Button
              color="warning"
              className="float-end"
              disabled={migration_status === MigrationStatus.MIGRATING
                  || migration_status === MigrationStatus.FINISHED}
              onClick={() => props.onMigrateProject({ skip_migrations: false, skip_docker_update: true,
                skip_template_update: true,
                force_template_update: false })}>
              {migration_status === MigrationStatus.MIGRATING || migration_status === MigrationStatus.FINISHED ?
                <span><Spinner size="sm" /> Updating...</span>
                :
                "Update"
              }
            </Button>
            :
            <p>
              <strong>You do not have the required permissions to upgrade this projects metadata.</strong>
            &nbsp;You can <ExternalLink role="text" size="sm"
                title="ask a project maintainer" url={`${props.externalUrl}/project_members`} /> to
              do that for you.
            </p>}
        </Alert>;
        break;
      default:
        return null;
    }
  }


  const versionStatus = core_compatibility_status ?
    <p>
      <strong>Project Metadata Version:</strong> {project_metadata_version}<br />
      { project_metadata_version !== current_metadata_version ?
        <Fragment><strong>Server Metadata Version:</strong> {current_metadata_version} </Fragment>
        : null }
    </p> : null;

  return (
    <div>
      {versionStatus}
      {body}
    </div>
  );
}

export default RenkuLabUiCompatibilityBody;
export { getRenkuLabCompatibilityStatus, RENKULAB_COMPATIBILITY_SCENARIOS };
