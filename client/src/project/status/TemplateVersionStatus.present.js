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

import React from "react";
import { Alert, Button, Spinner, UncontrolledCollapse } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faCheck } from "@fortawesome/free-solid-svg-icons";
import { ExternalLink, Loader } from "../../utils/UIComponents";
import { MigrationStatus } from "../Project";

const TEMPLATE_VERSION_SCENARIOS = {
  PROJECT_NOT_SUPPORTED: "PROJECT_NOT_SUPPORTED",
  TEMPLATE_NOT_VERSIONED: "TEMPLATE_NOT_VERSIONED",
  TEMPLATE_UP_TO_DATE: "TEMPLATE_UP_TO_DATE",
  NEW_TEMPLATE_AUTO: "NEW_TEMPLATE_AUTO", //new template auto with renku
  NEW_TEMPLATE_MANUAL: "NEW_TEMPLATE_MANUAL"
};

function getTemplateVersionStatus({
  project_supported, newer_template_available, automated_template_update, template_id }) {
  if (!project_supported) return TEMPLATE_VERSION_SCENARIOS.PROJECT_NOT_SUPPORTED;
  //is this the right way of checking template not versioned???
  if (template_id === null) return TEMPLATE_VERSION_SCENARIOS.TEMPLATE_NOT_VERSIONED;
  if (!newer_template_available) return TEMPLATE_VERSION_SCENARIOS.TEMPLATE_UP_TO_DATE;
  if (automated_template_update)
    return TEMPLATE_VERSION_SCENARIOS.NEW_TEMPLATE_AUTO;
  return TEMPLATE_VERSION_SCENARIOS.NEW_TEMPLATE_MANUAL;
}


function TemplateUpdateSection({ template_source, maintainer, projectTemplateStatus, migration_status, onMigrateProject,
  externalUrl, updateInstruction }) {

  const automaticUpdateAction = maintainer ?
  /* check if this is correct... maybe we can use the other button instead */
    <Button
      color="warning"
      className="float-end"
      disabled={migration_status === MigrationStatus.MIGRATING
                  || migration_status === MigrationStatus.FINISHED}
      onClick={() => onMigrateProject({ skip_migrations: true, skip_docker_update: true,
        force_template_update: false })}>
      {migration_status === MigrationStatus.MIGRATING || migration_status === MigrationStatus.FINISHED ?
        <span><Spinner size="sm" /> Updating...</span>
        :
        "Update"
      }
    </Button>
    :
    <p>
      <strong>You do not have the required permissions to upgrade this projects template.</strong>
            &nbsp;You can <ExternalLink role="text" size="sm"
        title="ask a project maintainer" url={`${externalUrl}/project_members`} /> to
      do that for you.
    </p>;

  return <Alert color="warning">
    <p>
      <FontAwesomeIcon icon={faExclamationTriangle} />&nbsp;
      A new version of the <strong>project template</strong> is available.
    </p>
    <p>
      If you wish to take advantage of new features, you can upgrade to the latest version of
      the <strong>template</strong>. <ExternalLink role="text" size="sm"
        title="See the template repository" url={`${template_source}`} /> to learn more about
      the new features.
      <br />
    </p>
    {projectTemplateStatus === TEMPLATE_VERSION_SCENARIOS.NEW_TEMPLATE_AUTO ?
      automaticUpdateAction : null }
    <br/><br/>
    <Button color="link" className="ps-0 mb-2 link-alert-warning text-start" id="btn_instructions_template">
      {
        projectTemplateStatus === TEMPLATE_VERSION_SCENARIOS.NEW_TEMPLATE_AUTO ?
          <i>Do you prefer manual instructions?</i>
          : <i>Automated update is not possible, but you can follow these instructions to update manually.</i>
      }
    </Button>
    <UncontrolledCollapse toggler="#btn_instructions_template">
      <p>{updateInstruction}</p>
    </UncontrolledCollapse>
  </Alert>;

}

function TemplateStatusBody(props) {

  const { maintainer, updateInstruction, externalUrl, loading, getErrorMessage } = props;

  const { project_supported, onMigrateProject, template_status,
    migration_status, check_error, migration_error, } = props.migration;

  const fetching = !template_status && check_error === null;

  let projectTemplateBody = null;

  if (loading || fetching) {
    projectTemplateBody = (<Loader />);
  }
  else if (check_error) {
    projectTemplateBody = getErrorMessage("checking", "project template", check_error.reason);
  }
  else if (migration_status === MigrationStatus.ERROR && migration_error && migration_error.template_update_failed) {
    //what is the structure of migration_error????
    projectTemplateBody = getErrorMessage("updating", "project template", migration_error.reason);
  }
  else {
    // do we do something with template_ref and template_id???
    const { automated_template_update, newer_template_available, template_id, template_ref, template_source }
    = template_status || {};

    const projectTemplateStatus = getTemplateVersionStatus({
      project_supported, newer_template_available, automated_template_update, template_id });

    switch (projectTemplateStatus) {
      case TEMPLATE_VERSION_SCENARIOS.PROJECT_NOT_SUPPORTED :
        projectTemplateBody = (
          <Alert color="warning">
            <FontAwesomeIcon icon={faExclamationTriangle} />&nbsp;
            Automatic upgrading of the <strong>template</strong> version is not supported with this project.
          </Alert>);
        break;
      case TEMPLATE_VERSION_SCENARIOS.TEMPLATE_NOT_VERSIONED :
        //if the template has no version it cant be migrated
        projectTemplateBody = (<p> This project does not use a versioned template.<br/></p>
        );
        break;
      case TEMPLATE_VERSION_SCENARIOS.TEMPLATE_UP_TO_DATE:
        projectTemplateBody = <Alert color="success">
          <FontAwesomeIcon icon={faCheck} /> This project is using the latest version of the template.</Alert >;
        break;
      case TEMPLATE_VERSION_SCENARIOS.NEW_TEMPLATE_AUTO:
        projectTemplateBody = <TemplateUpdateSection
          template_source={template_source}
          maintainer={maintainer}
          projectTemplateStatus={projectTemplateStatus}
          migration_status={migration_status}
          onMigrateProject={onMigrateProject}
          externalUrl={externalUrl}
          updateInstruction={updateInstruction}
        />;
        break;
      case TEMPLATE_VERSION_SCENARIOS.NEW_TEMPLATE_MANUAL:
        projectTemplateBody = <TemplateUpdateSection
          template_source={template_source}
          maintainer={maintainer}
          projectTemplateStatus={projectTemplateStatus}
          migration_status={migration_status}
          onMigrateProject={onMigrateProject}
          externalUrl={externalUrl}
          updateInstruction={updateInstruction}
        />;
        break;
      default:
        return null;
    }
  }

  //DO WE WANT TO DISPLAY THIS INFORMATION THIS WAY??? --> DOESN'T LOOK HELFPUL...
  const versionStatus = template_status && template_status.template_id ?
    <p>
      <strong>Latest Template Version:</strong> {template_status.latest_template_version}<br />
      <strong>Current Template Version:</strong> {template_status.project_template_version}<br />
      <strong>Template Ref:</strong> {template_status.template_ref}<br />
    </p> : null;

  return <div>
    {versionStatus}
    {projectTemplateBody}
  </div>;
}

export default TemplateStatusBody;
export { getTemplateVersionStatus, TEMPLATE_VERSION_SCENARIOS };
