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
import { Row, Col, Alert, Button, Spinner, Card, CardBody, CardHeader, UncontrolledCollapse } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faCheck } from "@fortawesome/free-solid-svg-icons";
import { ExternalLink, Loader } from "../../utils/UIComponents";
import { ACCESS_LEVELS } from "../../api-client";
import { MigrationStatus } from "../Project";

function TemplateStatusBody(props) {
  const { docker_update_possible, project_supported, template_update_possible,
    current_template_version, migration_status, check_error, migration_error, migration_required
  } = props.migration;
  const loading = props.loading;
  const fetching = migration_required === null && check_error === null;

  let projectTemplateBody = null;

  if (loading || fetching) {
    projectTemplateBody = (<Loader />);
  }
  else if (check_error) {
    projectTemplateBody = getErrorMessage("checking", "project template", check_error.reason);
  }
  else if (migration_status === MigrationStatus.ERROR && migration_error.template_update_failed) {
    //what is the structure of migration_error????
    projectTemplateBody = getErrorMessage("updating", "project template", migration_error);
  }
  else if (!current_template_version) { // current_template_version === null
    //if the template has no version it cant be migrated
    projectTemplateBody = (
      <p>
        This project does not use a versioned template.<br/>
      </p>
    );
  }
  else if (!project_supported) {
    projectTemplateBody = <Alert color="warning">
      <p>
        <FontAwesomeIcon icon={faExclamationTriangle} />&nbsp;
        The current project is not supported, template migration operations are not possible.&nbsp;
        <a href="https://renku.readthedocs.io/en/latest/user/upgrading_renku.html">More info about renku migrate</a>.
      </p>
    </Alert>;
  }
  else {
    if (template_update_possible) {
      let updateSection = null;
      if (props.maintainer) {
        if (docker_update_possible || migration_required) {
          updateSection = (
            <Fragment>
              Upgrading the Renku Version automatically will also upgrade the template.
            </Fragment>
          );
        }
        else {
          updateSection = (
            <Fragment>
              <p>
                Upgrading the Renku Version is not {migration_required ? "possible " : "needed "}
                you can upgrade only the project template.
              </p>
              {/* check if this is correct... maybe we can use the other button instead */}
              <Button
                color="warning"
                disabled={migration_status === MigrationStatus.MIGRATING}
                onClick={() => props.onMigrateProject({ skip_migrations: true, skip_docker_update: true,
                  force_template_update: false })}>
                {migration_status === MigrationStatus.MIGRATING ?
                  <span><Spinner size="sm" /> Updating...</span>
                  :
                  "Update"
                }
              </Button>
              <Button color="link" id="btn_instructions"><i>Do you prefer manual instructions?</i></Button>
              <UncontrolledCollapse toggler="#btn_instructions">
                <br />
                <p>{props.updateInstruction}</p>
              </UncontrolledCollapse>
            </Fragment>
          );
        }
      }
      else {
        updateSection = <p><strong>You do not have the required permissions to upgrade this project.</strong>
          &nbsp;You can <ExternalLink role="text" size="sm"
            title="ask a project maintainer" url={`${props.externalUrl}/project_members`} /> to
          do that for you.</p>;
      }
      projectTemplateBody = (
        <Alert color="warning">
          <p>
            <FontAwesomeIcon icon={faExclamationTriangle} />&nbsp;
            A new version of the <strong>project template</strong> is available.
            You can learn more about the changes in the template repository.
          </p>
          {updateSection}
        </Alert>
      );
    }
    else {
      projectTemplateBody = <Alert color="success">
        <FontAwesomeIcon icon={faCheck} />
        The current version is up to date.
      </Alert >;
    }
  }
  return <div>
    {projectTemplateBody}
  </div>;
}

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

function RenkuVersionStatusBody(props) {
  const { migration_required, project_supported, docker_update_possible,
    latest_version, project_version, migration_status, check_error, migration_error
  } = props.migration;
  const loading = props.loading;
  const fetching = migration_required === null && check_error === null;
  const { maintainer } = props;

  let body = null;

  if (loading || fetching) {
    body = (<Loader />);
  }
  else if (check_error) {
    body = getErrorMessage("checking", "renku", check_error.reason);
  }
  else if (migration_status === MigrationStatus.ERROR
  && (migration_error.dockerfile_update_failed || migration_error.migrations_failed)) {
    body = getErrorMessage("updating", "renku", migration_error);
  }
  else if (!project_supported) {
    body = (
      <Alert color="warning">
        <FontAwesomeIcon icon={faExclamationTriangle} />&nbsp;
        The current project is not supported, renku migration operations are not possible.&nbsp;
        <a href="https://renku.readthedocs.io/en/latest/user/upgrading_renku.html">More info about renku migrate</a>.
      </Alert>);
  }
  else if (migration_required || docker_update_possible) {
    let updateSection = null;
    if (maintainer) {
      if (docker_update_possible) {
        updateSection = (
          <Fragment>
            <Button
              color="warning"
              disabled={migration_status === MigrationStatus.MIGRATING}
              onClick={props.onMigrateProject}
            >
              {migration_status === MigrationStatus.MIGRATING ?
                <span><Spinner size="sm" /> Updating...</span> : "Update"
              }
            </Button>
            <Button color="link" id="btn_instructions"><i>Do you prefer manual instructions?</i></Button>
            <UncontrolledCollapse toggler="#btn_instructions">
              <br />
              <p>{props.updateInstruction}</p>
            </UncontrolledCollapse>
          </Fragment>
        );
      }
      else {
        updateSection = (
          <p>
            <strong>Updating this project automatically is not possible.</strong>
            <br /> {props.updateInstruction}
          </p>
        );
      }
    }
    else {
      updateSection = (
        <p>
          <strong>You do not have the required permissions to upgrade this project.</strong>
            &nbsp;You can <ExternalLink role="text" size="sm"
            title="ask a project maintainer" url={`${props.externalUrl}/project_members`} /> to
          do that for you.
        </p>
      );
    }
    body = (
      <Alert color="warning">
        <p>
          <FontAwesomeIcon icon={faExclamationTriangle} /> A new version of <strong>renku</strong> is available.
          The project needs to be migrated to keep working.
        </p>
        {updateSection}
      </Alert>
    );
  }
  // migration not needed
  else {
    body = (<Alert color="success"><FontAwesomeIcon icon={faCheck} /> The current version is up to date.</Alert>);
  }

  const versionStatus = <p>
    <strong>Project Version:</strong> {project_version}<br />
    <strong>Latest Renku Version:</strong> {latest_version}
  </p>;

  return (
    <div>
      {versionStatus}
      {body}
    </div>
  );
}

function ProjectVersionStatusBody(props) {
  const maintainer = props.visibility.accessLevel >= ACCESS_LEVELS.MAINTAINER;
  const isLogged = props.user && props.user.logged;

  const updateInstruction = (
    <Fragment>
      You can launch
      an <Link to={props.launchNotebookUrl}>interactive environment</Link> and follow the&nbsp;
      <a href="https://renku-python.readthedocs.io/en/latest/commands.html#module-renku.cli.migrate">
        instructions for upgrading</a>.
      When finished, you will need to run <code>renku migrate</code>.
    </Fragment>
  );

  if (!isLogged && !props.loading) return null;

  return (
    <Card className="border-0">
      <CardHeader>Renku Version</CardHeader>
      <CardBody>
        <Row><Col>
          <RenkuVersionStatusBody
            {...props}
            updateInstruction={updateInstruction}
            maintainer={maintainer}/>
        </Col></Row>
      </CardBody>
      <CardHeader>Template Version</CardHeader>
      <CardBody>
        <Row><Col>
          <TemplateStatusBody
            {...props}
            updateInstruction={updateInstruction}
            maintainer={maintainer}/>
        </Col></Row>
      </CardBody>
    </Card>
  );
}
export default ProjectVersionStatusBody;
