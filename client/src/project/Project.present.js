/*!
 * Copyright 2018 - Swiss Data Science Center (SDSC)
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

/**
 *  incubator-renku-ui
 *
 *  Project.present.js
 *  Presentational components.
 */


import React, { Component, Fragment, useState, useEffect } from "react";
import { Link, Route, Switch } from "react-router-dom";
import {
  Alert, Badge, Button, ButtonGroup, Card, CardBody, CardHeader, Col, DropdownItem,
  Modal, Row, Nav, NavItem, UncontrolledTooltip
} from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import {
  faCodeBranch, faExclamationTriangle, faExternalLinkAlt, faGlobe, faInfoCircle, faLock, faPlay, faSearch,
  faStar as faStarSolid, faUserFriends
} from "@fortawesome/free-solid-svg-icons";

import {
  ButtonWithMenu, ExternalIconLink, ExternalLink, GoBackButton,
  InfoAlert, Loader, RenkuMarkdown, RenkuNavLink, TimeCaption
} from "../utils/UIComponents";
import { Url } from "../utils/url";
import { SpecialPropVal } from "../model/Model";
import { ProjectTagList } from "./shared";
import { Notebooks, ShowSession, StartNotebookServer } from "../notebooks";
import Issue from "../collaboration/issue/Issue";
import {
  CollaborationList, collaborationListTypeMap
} from "../collaboration/lists/CollaborationList.container";
import FilesTreeView from "./filestreeview/FilesTreeView";
import DatasetsListView from "./datasets/DatasetsListView";
import { ACCESS_LEVELS } from "../api-client";
import ProjectVersionStatus, { displayWarningSignForVersion } from "./status/ProjectVersionStatus.present";
import { NamespaceProjects } from "../namespace";
import { ProjectOverviewCommits, ProjectOverviewStats } from "./overview";
import { ForkProject } from "./new";
import { ProjectSettingsGeneral, ProjectSettingsNav, ProjectSettingsSessions } from "./settings";

import "./Project.css";

function filterPaths(paths, blacklist) {
  // Return paths to do not match the blacklist of regexps.
  const result = paths.filter(p => blacklist.every(b => p.match(b) === null));
  return result;
}

function isRequestPending(props, request) {
  const transient = props.transient || {};
  const requests = transient.requests || {};
  return requests[request] === SpecialPropVal.UPDATING;
}

function webhookError(props) {
  if (props == null || props === SpecialPropVal.UPDATING || props === true || props === false)
    return false;

  return true;
}

function isKgDown(webhook) {
  return webhook === false ||
    (webhook.status === false && webhook.created !== true) ||
    webhookError(webhook.status);
}

function ProjectVisibilityLabel({ visibilityLevel }) {
  let text = null;
  switch (visibilityLevel) {
    case "private":
      text = <Fragment><FontAwesomeIcon icon={faLock} /> Private</Fragment>;
      break;
    case "internal":
      text = <Fragment><FontAwesomeIcon icon={faUserFriends} /> Internal</Fragment>;
      break;
    case "public":
      text = <Fragment><FontAwesomeIcon icon={faGlobe} /> Public</Fragment>;
      break;
    default:
      text = null;
  }
  if (text == null) return null;
  return <span className="ms-3">
    <Badge color="secondary" style={{ verticalAlign: "middle" }}>{text}</Badge>&nbsp;
  </span>;
}

/**
 * Shows a warning icon when Renku version is outdated or Knowledge Graph integration is not active.
 *
 * @param {Object} webhook - project.webhook store object
 * @param {bool} migration_required - whether it's necessary to migrate the project or not
 * @param {bool} template_update_possible - whether it's necessary to migrate the template or not
  * @param {bool} docker_update_possible - whether it's necessary to migrate the docker image or not
 * @param {Object} history - react history object
 * @param {string} overviewStatusUrl - overview status url
 */
class ProjectStatusIcon extends Component {
  render() {
    const { webhook, overviewStatusUrl, history, migration } = this.props;
    const kgDown = isKgDown(webhook);

    const warningSignForVersionDisplayed = displayWarningSignForVersion(migration);

    if (!warningSignForVersionDisplayed && !kgDown)
      return null;

    const versionInfo = warningSignForVersionDisplayed ?
      "Current project is outdated. " :
      null;
    const kgInfo = kgDown ?
      "Knowledge Graph integration not active. " :
      null;

    return (
      <span className="warningLabel" style={{ verticalAlign: "baseline" }}>
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          onClick={() => history.push(overviewStatusUrl)}
          id="warningStatusLink" />
        <UncontrolledTooltip placement="top" target="warningStatusLink">
          {versionInfo}
          {kgInfo}
          Click to see details.
        </UncontrolledTooltip>
      </span>
    );
  }
}

function GitLabConnectButton(props) {
  const size = (props.size) ? props.size : "md";
  const { userLogged, gitlabIDEUrl } = props;
  if (!props.externalUrl)
    return null;
  const gitlabProjectButton = <ExternalLink url={props.externalUrl} title="View in GitLab" />;

  const onClick = () => window.open(gitlabIDEUrl, "_blank");
  const gitlabIDEButton = userLogged ?
    (<DropdownItem onClick={onClick} size={size}>View in Web IDE</DropdownItem>) :
    null;

  let button = gitlabIDEButton ?
    (<ButtonWithMenu default={gitlabProjectButton} size={size}>{gitlabIDEButton}</ButtonWithMenu>) :
    (<ExternalLink url={props.externalUrl} size={size} title="View in GitLab" />);

  return (<div>{button}</div>);
}

class ForkProjectModal extends Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
    this.toggleFunction = this.toggle.bind(this);
  }

  toggle() {
    this.setState({ open: !this.state.open });
  }

  render() {
    let content = null;
    // this prevents flashing wrong content during the close animation
    if (this.state.open) {
      content = (
        <ForkProject
          client={this.props.client}
          id={this.props.id}
          history={this.props.history}
          model={this.props.model}
          notifications={this.props.notifications}
          title={this.props.title}
          toggleModal={this.toggleFunction}
        />
      );
    }
    return (
      <Fragment>
        <Button outline color="primary" className="border-light" onClick={this.toggleFunction}>
          <FontAwesomeIcon icon={faCodeBranch} /> fork
        </Button>
        <Modal isOpen={this.state.open} toggle={this.toggleFunction}>
          {content}
        </Modal>
      </Fragment>
    );
  }
}

function ProjectIdentifier(props) {
  const forkedFromText = (props.forkedFromLink == null) ?
    null :
    [" ", <b key="forked">forked</b>, " from ", props.forkedFromLink];
  const forkedFrom = (forkedFromText) ?
    <Fragment><span className="text-rk-text fs-small">{forkedFromText}</span><br /></Fragment> :
    null;
  const projectId = props.core.path_with_namespace;
  const projectTitle = props.core.title;

  return (
    <Fragment>
      <div className="flex-grow-1">
        <h2 className="mb-0">
          <ProjectStatusIcon
            history={props.history}
            webhook={props.webhook}
            overviewStatusUrl={props.overviewStatusUrl}
            migration={props.migration}
          />{projectTitle}
          <ProjectVisibilityLabel visibilityLevel={props.visibility.level} />
        </h2>
        <span className="text-rk-text fs-small">{projectId}</span> {forkedFrom}
      </div>
    </Fragment>);
}

function ProjectViewHeaderMinimal(props) {
  const titleColSize = "col-12";

  return (
    <Fragment>
      <Row className="d-flex rk-project-header gx-2 justify-content-md-between justify-content-sm-start">
        <Col className={"order-1 d-flex align-items-start " + titleColSize}>
          <ProjectIdentifier {...props} />
          <StartSessionButton {...props} />
        </Col>
      </Row>
    </Fragment>);
}

function ProjectViewHeaderOverviewDescription({ settingsReadOnly, description, settingsUrl }) {
  if (description) {
    return <RenkuMarkdown markdownText={description} fixRelativePaths={false}
      className="p-mb-0 fs-6 rk-project-description"/>;
  }
  if (!settingsReadOnly) {
    return <div className="p-mb-0 fs-6"><i>(This project has no description.
      You can provide one on the <Link to={settingsUrl}>settings tab</Link>.)</i></div>;
  }
  return null;
}

class ProjectViewHeaderOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      updating_star: false
    };
  }

  star(event) {
    event.preventDefault();
    this.setState({ updating_star: true });
    this.props.onStar().then(
      result => {
        this.setState({ updating_star: false });
      });
  }

  render() {
    const system = this.props.system;

    let starElement;
    let starText;
    if (this.state.updating_star) {
      starElement = (<Loader inline size={14} />);
      if (this.props.starred)
        starText = "un-starring...";
      else
        starText = "starring...";
    }
    else {
      if (this.props.starred) {
        starText = "unstar";
        starElement = (<FontAwesomeIcon icon={faStarSolid} />);
      }
      else {
        starText = "star";
        starElement = (<FontAwesomeIcon icon={faStarRegular} />);
      }
    }

    const gitlabIDEUrl = this.props.externalUrl !== "" && this.props.externalUrl.includes("/gitlab/") ?
      this.props.externalUrl.replace("/gitlab/", "/gitlab/-/ide/project/") : null;
    const description = <ProjectViewHeaderOverviewDescription
      description={this.props.core.description}
      settingsReadOnly={this.props.settingsReadOnly}
      settingsUrl={this.props.settingsUrl} />;
    const titleColSize = "col-12 col-md-8";

    return (
      <Fragment>
        <Row className="d-flex rk-project-header gy-2 gx-2 pb-2 justify-content-md-between justify-content-sm-start">
          <Col className={"order-1 d-flex " + titleColSize}>
            { this.props.core.avatar_url ?
              <div className="flex-shrink-0 pe-3" style={{ width: "120px" }}>
                <img src={this.props.core.avatar_url} className=" rounded" alt=""
                  style={{ objectFit: "cover", width: "100%", height: "90px" }}/>
              </div>
              : null }
            <div className="flex-grow-1">
              <span className="text-rk-text fs-small">{description}</span>
            </div>
          </Col>
          <Col className="text-sm-start text-md-end order-2 col-12 col-md-4 ">
            <ButtonGroup size="sm">
              <ForkProjectModal
                client={this.props.client}
                history={this.props.history}
                model={this.props.model}
                notifications={this.props.notifications}
                title={this.props.core && this.props.core.title ? this.props.core.title : ""}
                id={this.props.core && this.props.core.id ? this.props.core.id : 0}
              />
              <Button
                outline
                color="primary"
                className="border-light"
                href={`${this.props.externalUrl}/-/forks`} target="_blank" rel="noreferrer noopener">
                {system.forks_count}
              </Button>
            </ButtonGroup>
            <ButtonGroup size="sm" className="ms-1">
              <Button outline color="primary"
                className="border-light"
                disabled={this.state.updating_star}
                onClick={this.star.bind(this)}>
                {starElement} {starText}
              </Button>
              <Button outline color="primary"
                className="border-light"
                style={{ cursor: "default" }}>{system.star_count}</Button>
            </ButtonGroup>
            <ButtonGroup size="sm" className="ms-1">
              <GitLabConnectButton size="sm"
                externalUrl={this.props.externalUrl}
                gitlabIDEUrl={gitlabIDEUrl}
                userLogged={this.props.user.logged} />
            </ButtonGroup>
            { this.props.system.tag_list.length > 0 ?
              <div className="pt-2">
                <ProjectTagList tagList={this.props.system.tag_list} />
              </div>
              : null }
            <div className="pt-1">
              <TimeCaption key="time-caption" time={this.props.core.last_activity_at} className="text-rk-text"/>
            </div>
          </Col>
        </Row>
      </Fragment>);
  }
}

function StartSessionButton(props) {
  const { launchNotebookUrl, sessionAutostartUrl } = props;

  const defaultAction = (
    <Link className="btn btn-primary btn-sm" to={sessionAutostartUrl}>
      <FontAwesomeIcon className="me-1" icon={faPlay} /> Start
    </Link>
  );
  return (
    <ButtonGroup size="sm" className="ms-1">
      <ButtonWithMenu className="startButton" size="sm" default={defaultAction} color="primary">
        <DropdownItem>
          <Link className="text-decoration-none" to={launchNotebookUrl}>Start with options</Link>
        </DropdownItem>
      </ButtonWithMenu>
    </ButtonGroup>
  );
}

class ProjectViewHeader extends Component {
  render() {
    let forkedFromLink = null;
    if (this.props.system.forked_from_project != null &&
      Object.keys(this.props.system.forked_from_project).length > 0) {
      const forkedFrom = this.props.system.forked_from_project;
      const projectsUrl = this.props.projectsUrl;
      forkedFromLink = <Link key="forkedFrom" to={`${projectsUrl}/${forkedFrom.metadata.core.path_with_namespace}`}>
        {forkedFrom.metadata.core.path_with_namespace || "no title"}
      </Link>;
    }

    return <ProjectViewHeaderMinimal key="minimalHeader" forkedFromLink={forkedFromLink} {...this.props} />;
  }
}

class ProjectNav extends Component {
  render() {
    return (
      <div className="pb-3 rk-search-bar pt-4 mt-1">
        <Col className="d-flex pb-2 mb-1 justify-content-start" md={12} lg={12}>
          <Nav pills className="nav-pills-underline">
            <NavItem>
              <RenkuNavLink to={this.props.baseUrl} alternate={this.props.overviewUrl} title="Overview" />
            </NavItem>
            <NavItem>
              <RenkuNavLink exact={false} to={this.props.issuesUrl}
                alternate={this.props.collaborationUrl} title="Collaboration" />
            </NavItem>
            <NavItem>
              <RenkuNavLink exact={false} to={this.props.filesUrl} title="Files" />
            </NavItem>
            <NavItem>
              <RenkuNavLink exact={false} to={this.props.datasetsUrl} title="Datasets" />
            </NavItem>
            <NavItem>
              <RenkuNavLink exact={false} to={this.props.notebookServersUrl} title="Sessions" />
            </NavItem>
            <NavItem className="pe-0">
              <RenkuNavLink exact={false} to={this.props.settingsUrl} title="Settings" />
            </NavItem>
          </Nav>
        </Col>
      </div>
    );
  }
}

class ProjectFilesNav extends Component {
  render() {
    const loading = isRequestPending(this.props, "filesTree");
    const allFiles = this.props.filesTree || [];
    if ((loading && Object.keys(allFiles).length < 1) || this.props.filesTree === undefined)
      return <Loader />;

    return <FilesTreeView
      data={this.props.filesTree}
      lineageUrl={this.props.lineagesUrl}
      projectUrl={this.props.fileContentUrl}
      setOpenFolder={this.props.setOpenFolder}
      setLastNode={this.props.setLastNode}
      hash={this.props.filesTree.hash}
      fileView={this.props.filesTreeView}
      currentUrl={this.props.location.pathname}
      history={this.props.history}
      limitHeight={true} />;
  }
}

class ProjectViewReadme extends Component {
  componentDidMount() {
    this.props.fetchOverviewData();
  }

  render() {
    const readmeText = this.props.readme.text;
    const loading = isRequestPending(this.props, "readme");
    if (loading && readmeText === "")
      return <Loader />;

    return (
      <Card className="border-rk-light">
        <CardHeader className="bg-white p-3 ps-4">README.md</CardHeader>
        <CardBody style={{ overflow: "auto" }} className="p-4">
          <RenkuMarkdown
            projectPathWithNamespace = {this.props.core.path_with_namespace}
            filePath={""}
            fixRelativePaths={true}
            markdownText={this.props.readme.text}
            client={this.props.client}
            projectId={this.props.core.id}
          />
        </CardBody>
      </Card>
    );
  }
}

function ProjectViewGeneral(props) {
  let forkedFromLink = null;
  if (props.system.forked_from_project != null &&
    Object.keys(props.system.forked_from_project).length > 0) {
    const forkedFrom = props.system.forked_from_project;
    const projectsUrl = props.projectsUrl;
    forkedFromLink = <Link key="forkedFrom" to={`${projectsUrl}/${forkedFrom.metadata.core.path_with_namespace}`}>
      {forkedFrom.metadata.core.path_with_namespace || "no title"}
    </Link>;
  }

  return <Fragment>
    <ProjectViewHeaderOverview
      key="overviewHeader"
      forkedFromLink={forkedFromLink} {...props} />
    <ProjectViewReadme {...props} />
  </Fragment>;

}

function ProjectKGStatus(props) {
  const loading = false;

  let body = null;
  if (loading)
    body = (<Loader />);
  else
    body = props.kgStatusView(true);

  return (
    <Card className="border-rk-light">
      <CardHeader className="bg-white p-3 ps-4">Knowledge Graph Integration</CardHeader>
      <CardBody className="p-4 pt-3 pb-3 lh-lg">
        <Row>
          <Col>{body}</Col>
        </Row>
      </CardBody>
    </Card>
  );
}

class ProjectViewOverviewNav extends Component {

  render() {
    // Add when results are handled:
    // <NavItem>
    //   <RenkuNavLink to={`${this.props.overviewUrl}/results`} title="Results" />
    // </NavItem>
    return (
      <Nav className="flex-column nav-light">
        <NavItem>
          <RenkuNavLink to={this.props.baseUrl} title="General" id="nav-overview-general" />
        </NavItem>
        <NavItem>
          <RenkuNavLink to={this.props.statsUrl} title="Stats" />
        </NavItem>
        <NavItem>
          <RenkuNavLink to={this.props.overviewCommitsUrl} title="Commits" />
        </NavItem>
        <NavItem>
          <RenkuNavLink to={this.props.overviewStatusUrl} title="Status" />
        </NavItem>
      </Nav>
    );
  }
}

class ProjectViewOverview extends Component {
  render() {
    const { projectCoordinator } = this.props;
    return <Col key="overview">
      <Row>
        <Col key="nav" sm={12} md={2}>
          <ProjectViewOverviewNav {...this.props} />
        </Col>
        <Col key="content" sm={12} md={10}>
          <Switch>
            <Route exact path={this.props.baseUrl} render={props => {
              return <ProjectViewGeneral readme={this.props.data.readme} {...this.props} />;
            }} />
            <Route exact path={this.props.statsUrl} render={props =>
              <ProjectOverviewStats
                projectCoordinator={projectCoordinator}
                branches={this.props.system.branches}
              />
            }
            />
            <Route exact path={this.props.overviewCommitsUrl} render={props =>
              <ProjectOverviewCommits
                location={this.props.location}
                history={props.history}
                projectCoordinator={projectCoordinator}
              />}
            />
            <Route exact path={this.props.overviewStatusUrl} render={props =>
              <Fragment>
                <ProjectVersionStatus {...this.props} isLoading={isRequestPending(this.props, "readme")} />
                <ProjectKGStatus {...this.props} />
              </Fragment>}
            />
          </Switch>
        </Col>
      </Row>
    </Col>;
  }
}

class ProjectDatasetsNav extends Component {

  render() {
    const allDatasets = this.props.core.datasets || [];

    if (allDatasets.length === 0)
      return null;

    return <DatasetsListView
      datasets_kg={this.props.core.datasets_kg}
      datasets={this.props.core.datasets}
      datasetsUrl={this.props.datasetsUrl}
      newDatasetUrl={this.props.newDatasetUrl}
      visibility={this.props.visibility}
      graphStatus={this.props.isGraphReady}
    />;
  }
}

function ProjectAddDataset(props) {

  const [newDataset, setNewDataset] = useState(true);
  function toggleNewDataset() {
    setNewDataset(!newDataset);
  }

  return <Col>
    { props.visibility.accessLevel > ACCESS_LEVELS.DEVELOPER ? [
      <Row key="header">
        <Col>
          <h3 className="uk-heading-divider uk-text-center pb-1 mb-4">Add Dataset</h3>
        </Col>
      </Row>,
      <Row key="switch-button" className="d-inline-block pb-3">
        <Col>
          <ButtonGroup className="rk-btn-group-light mb-4">
            <Button color="rk-white" onClick={toggleNewDataset} active={newDataset}>
              Create Dataset
            </Button>
            <Button color="rk-white" onClick={toggleNewDataset} active={!newDataset}>
              Import Dataset
            </Button>
          </ButtonGroup>
        </Col>
      </Row>,
      <Row key="text-details" className="pb-3">
        <Col>
          <small className="mb-4 text-muted">
            {
              newDataset ?
                <span>
                  Create a new dataset by providing metadata and content. Use&nbsp;
                  <Button className="p-0" style={{ verticalAlign: "baseline" }}
                    color="link" onClick={() => setNewDataset(false)}>
                    <small>Import Dataset</small>
                  </Button>
                &nbsp;to reuse an existing dataset.
                </span>
                :
                <span>
                  Import a published dataset from Zenodo, Dataverse, or from another Renku project. Use&nbsp;
                  <Button className="p-0" style={{ verticalAlign: "baseline" }}
                    color="link" onClick={() => setNewDataset(true)}>
                    <small>Create Dataset</small>
                  </Button>
                &nbsp;to make a new dataset.
                </span>
            }
          </small>
        </Col>
      </Row>
    ]
      : null
    }
    { newDataset ?
      props.newDataset(props)
      : props.importDataset(props)
    }
  </Col>;
}

function EmptyDatasets(props) {
  return <Alert timeout={0} color="primary">
    No datasets found for this project.
    { props.membership ?
      <div><br /><FontAwesomeIcon icon={faInfoCircle} />  If you recently activated the knowledge graph or
        added the datasets try refreshing the page. <br /><br />
        You can also click on the button to
        &nbsp;<Link className="btn btn-primary btn-sm" to={props.newDatasetUrl}>Add a Dataset</Link></div>
      : null
    }
  </Alert>;
}

/**
 * Shows a warning Alert when Renku version is outdated or Knowledge Graph integration is not active.
 *
 * @param {Object} webhook - project.webhook store object
 * @param {bool} migration_required - whether it's necessary to migrate the project or not
 * @param {Object} history - react history object
 * @param {string} overviewStatusUrl - overview status url
 */
function ProjectStatusAlert(props) {
  const { webhook, migration_required, overviewStatusUrl, history } = props;
  const kgDown = isKgDown(webhook);

  if (!migration_required && !kgDown)
    return null;

  const versionInfo = migration_required ?
    <span>
      <FontAwesomeIcon icon={faExclamationTriangle} className="pe-1" />
      <strong>A new version of renku is available. </strong>
      An upgrade is necessary to allow modification of datasets and is recommended for all projects.&nbsp;
    </span> :
    null;
  const kgInfo = kgDown ?
    <span>
      <FontAwesomeIcon icon={faExclamationTriangle} className="pe-1" />
      <strong>Knowledge Graph integration not active. </strong>
      This means that some operations on datasets are not possible, we recommend activating it.
    </span> :
    null;

  const conditionalSpace = versionInfo && kgInfo ? <br /> : null;

  return (
    <Alert color="warning">
      {versionInfo}
      {conditionalSpace}
      {conditionalSpace}
      {kgInfo}
      <br />
      <br />
      <Button color="warning" onClick={() => history.push(overviewStatusUrl)}>
        See details
      </Button>
    </Alert>
  );
}

function ProjectViewDatasets(props) {

  const kgDown = isKgDown(props.webhook);

  const migrationMessage = <ProjectStatusAlert
    history={props.history}
    overviewStatusUrl={props.overviewStatusUrl}
    migration_required={props.migration.migration_required}
    webhook={props.webhook}
  />;

  useEffect(()=>{
    const loading = props.core.datasets === SpecialPropVal.UPDATING;
    if (loading) return;
    props.fetchDatasets(props.location.state && props.location.state.reload);
    props.fetchGraphStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = props.core.datasets === SpecialPropVal.UPDATING || props.core.datasets === undefined;
  if (loading)
    return <Loader />;

  if (props.core.datasets.error) {
    return <Col sm={12}>
      <Alert color="danger">
        There was an error fetching the datasets, please try <Button color="danger" size="sm" onClick={
          () => window.location.reload()
        }> reloading </Button> the page.</Alert>
    </Col>;
  }

  if (!loading && props.core.datasets !== undefined && props.core.datasets.length === 0
    && props.location.pathname !== props.newDatasetUrl) {
    return <Col sm={12}>
      {migrationMessage}
      <EmptyDatasets
        membership={props.visibility.accessLevel > ACCESS_LEVELS.DEVELOPER}
        newDatasetUrl={props.newDatasetUrl}
      />
    </Col>;
  }

  return <Col sm={12}>
    {migrationMessage}
    <Switch>
      <Route path={props.newDatasetUrl}
        render={p =>[
          <Col key="btn" md={12}>
            <GoBackButton label="Back to list" url={props.datasetsUrl}/>
          </Col>,
          <ProjectAddDataset key="projectsAddDataset" {...props} />
        ]}/>
      <Route path={props.editDatasetUrl}
        render={p => [
          <Col key="btn" md={12}>
            <GoBackButton label="Back to dataset" url={`${props.datasetsUrl}/${p.match.params.datasetId}/`}/>
          </Col>,
          props.editDataset({ ...props, ...p })]
        }/>
      <Route path={props.datasetUrl} render={p =>[
        <Col key="btn" md={12}>
          <GoBackButton key="btn" label="Back to list" url={props.datasetsUrl}/>
        </Col>,
        props.datasetView(p, !kgDown)
      ]} />
      <Route exact path={props.datasetsUrl} render={p =>
        <ProjectDatasetsNav {...props} />
      }/>
    </Switch>
  </Col>;
}

class ProjectViewCollaborationNav extends Component {
  render() {
    const issuesUrl = `${this.props.externalUrl}/-/issues`;
    const mrUrl = `${this.props.externalUrl}/-/merge_requests`;
    // CR: This is necessary to get spacing to work correctly; do not understand why.
    const navItemStyle = { padding: "8px 0px" };
    return <Nav className="flex-column nav-light">
      <NavItem style={navItemStyle}>
        <RenkuNavLink to={this.props.issuesUrl} matchPath={true} title="Issues" className="d-inline" />
        <ExternalIconLink url={issuesUrl} tooltip="Open GitLab issues in new tab"
          title="" icon={faExternalLinkAlt} role="text" className="d-inline" />
      </NavItem>
      <NavItem style={navItemStyle}>
        <RenkuNavLink to={this.props.mergeRequestsOverviewUrl} matchPath={true}
          title="Merge Requests" className="d-inline" />
        <ExternalIconLink url={mrUrl} tooltip="Open GitLab merge requests in new tab"
          title="" icon={faExternalLinkAlt} role="text" className="d-inline" />
      </NavItem>
    </Nav>;
  }
}

class ProjectViewCollaboration extends Component {
  render() {
    return <Col key="collaborationContent">
      <Switch>
        <Route path={this.props.mergeRequestUrl} render={props =>
          <ProjectMergeRequestList mrIid={props.match.params.mrIid} {...this.props} />} />
        <Route path={this.props.mergeRequestsOverviewUrl} render={props =>
          <ProjectMergeRequestList {...this.props} />} />
        <Route exact path={this.props.issueNewUrl} render={props =>
          <Issue.New {...props} model={this.props.model}
            projectPathWithNamespace={this.props.core.path_with_namespace}
            client={this.props.client} />} />
        <Route path={this.props.issueUrl} render={props =>
          <ProjectIssuesList issueIid={props.match.params.issueIid} {...this.props} />} />
        <Route path={this.props.issuesUrl} render={props =>
          <ProjectIssuesList {...this.props} />} />
      </Switch>
    </Col>;
  }
}

class ProjectIssuesList extends Component {

  render() {
    return <Row>
      <Col key="nav" sm={12} md={2}>
        <ProjectViewCollaborationNav {...this.props} />
      </Col>
      <Col key="issuesList" sm={12} md={10}>
        <CollaborationList
          key="issuesList"
          listType={collaborationListTypeMap.ISSUES}
          externalUrl={this.props.externalUrl}
          collaborationUrl={this.props.collaborationUrl}
          issueNewUrl={this.props.issueNewUrl}
          projectId={this.props.core.id}
          user={this.props.user}
          location={this.props.location}
          thingIid={this.props.issueIid}
          client={this.props.client}
          history={this.props.history}
          fetchElements={this.props.client.getProjectIssues}
        />
      </Col>
    </Row>;
  }
}

class ProjectMergeRequestList extends Component {

  componentDidMount() {
    this.props.fetchMrSuggestions();
  }

  render() {
    return <Row>
      <Col key="nav" sm={12} md={2}>
        <ProjectViewCollaborationNav {...this.props} />
      </Col>
      <Col sm={12} md={10}>
        <CollaborationList
          collaborationUrl={this.props.collaborationUrl}
          externalUrl={this.props.externalUrl}
          listType={collaborationListTypeMap.MREQUESTS}
          projectId={this.props.core.id}
          user={this.props.user}
          location={this.props.location}
          client={this.props.client}
          thingIid={this.props.mrIid}
          history={this.props.history}
          mergeRequestsOverviewUrl={this.props.mergeRequestsOverviewUrl}
          fetchElements={this.props.client.getMergeRequests}
        />
      </Col>
    </Row>;
  }
}

class ProjectViewFiles extends Component {
  componentDidMount() {
    this.props.fetchFiles();
  }

  render() {
    return [
      <Col key="files" md={4} lg={3} xl={2}>
        <ProjectFilesNav {...this.props} />
      </Col>,
      <Col key="content" md={8} lg={9} xl={10}>
        <Switch>
          <Route path={this.props.lineageUrl}
            render={p => this.props.lineageView(p)} />
          <Route path={this.props.fileContentUrl}
            render={props => this.props.fileView(props)} />
        </Switch>
      </Col>
    ];
  }
}


class ProjectSessions extends Component {
  render() {
    const backButton = (<GoBackButton label="Back to sessions list" url={this.props.notebookServersUrl} />);
    return [
      <Col key="content" xs={12}>
        <Switch>
          <Route exact path={this.props.notebookServersUrl}
            render={props => <ProjectNotebookServers {...this.props} />} />
          <Route path={this.props.launchNotebookUrl}
            render={props => (
              <Fragment>
                {backButton}
                <ProjectStartNotebookServer key="startNotebookForm" {...this.props} />
              </Fragment>
            )} />
          <Route path={this.props.sessionShowUrl}
            render={props => (
              <Fragment>
                {backButton}
                <ProjectShowSession {...this.props} match={props.match} />
              </Fragment>
            )} />
        </Switch>
      </Col>
    ];
  }
}

function notebookWarning(userLogged, accessLevel, fork, postLoginUrl, externalUrl) {
  if (!userLogged) {
    const to = Url.get(Url.pages.login.link, { pathname: postLoginUrl });
    return (
      <InfoAlert timeout={0} key="permissions-warning">
        <p>
          <FontAwesomeIcon icon={faExclamationTriangle} /> As
          an anonymous user, you can start <ExternalLink role="text" title="Sessions"
            url="https://renku.readthedocs.io/en/latest/developer/services/notebooks_service.html" />, but
          you cannot save your work.
        </p>
        <p className="mb-0">
          <Link className="btn btn-primary btn-sm" to={to}>Log in</Link> for
          full access.
        </p>
      </InfoAlert>
    );
  }
  else if (accessLevel < ACCESS_LEVELS.DEVELOPER) {
    return (
      <InfoAlert timeout={0} key="permissions-warning">
        <p>
          <FontAwesomeIcon icon={faExclamationTriangle} /> You have limited permissions for this
          project. You can launch a session, but you will not be able to save
          any changes. If you want to save your work, consider one of the following:
        </p>
        <ul className="mb-0">
          <li>
            <Button size="sm" color="primary" onClick={(event) => fork(event)}>
              Fork the project
            </Button> and start a session from your fork.
          </li>
          <li className="pt-1">
            <ExternalLink size="sm" title="Contact a maintainer"
              url={`${externalUrl}/project_members`} /> and ask them
            to <a href="https://renku.readthedocs.io/en/latest/user/collaboration.html#added-to-project"
              target="_blank" rel="noreferrer noopener">
              grant you the necessary permissions
            </a>.
          </li>
        </ul>
      </InfoAlert>
    );
  }
  return null;
}


class ProjectShowSession extends Component {
  render() {
    const {
      blockAnonymous, client, externalUrl, history, launchNotebookUrl, location, match, model,
      notifications, toggleForkModal, user, visibility
    } = this.props;
    const warning = notebookWarning(
      user.logged, visibility.accessLevel, toggleForkModal, location.pathname, externalUrl
    );

    return (
      <ShowSession
        blockAnonymous={blockAnonymous}
        client={client}
        history={history}
        location={location}
        match={match}
        message={warning}
        model={model}
        notifications={notifications}
        scope={{ namespace: this.props.core.namespace_path, project: this.props.core.project_path }}
        standalone={false}
        urlNewSession={launchNotebookUrl}
      />
    );
  }
}

class ProjectNotebookServers extends Component {
  render() {
    const {
      client, model, user, visibility, toggleForkModal, location, externalUrl, launchNotebookUrl,
      blockAnonymous
    } = this.props;
    const warning = notebookWarning(
      user.logged, visibility.accessLevel, toggleForkModal, location.pathname, externalUrl
    );

    return (
      <Notebooks standalone={false} client={client} model={model} location={location}
        message={warning}
        urlNewSession={launchNotebookUrl}
        blockAnonymous={blockAnonymous}
        scope={{ namespace: this.props.core.namespace_path, project: this.props.core.project_path }}
      />
    );
  }
}

class ProjectStartNotebookServer extends Component {
  render() {
    const {
      client, model, user, visibility, toggleForkModal, externalUrl, system, location,
      fetchBranches, notebookServersUrl, history, blockAnonymous, notifications
    } = this.props;
    const warning = notebookWarning(
      user.logged, visibility.accessLevel, toggleForkModal, location.pathname, externalUrl
    );

    const locationEnhanced = location && location.state && location.state.successUrl ?
      location :
      {
        ...this.props.location,
        state: {
          ...this.props.location.state,
          successUrl: notebookServersUrl
        }
      };

    return (
      <StartNotebookServer client={client} model={model} history={history} location={locationEnhanced}
        message={warning}
        branches={system.branches}
        autosaved={system.autosaved}
        refreshBranches={fetchBranches}
        externalUrl={externalUrl}
        successUrl={notebookServersUrl}
        blockAnonymous={blockAnonymous}
        notifications={notifications}
        scope={{ namespace: this.props.core.namespace_path, project: this.props.core.project_path }}
      />
    );
  }
}

function ProjectSettings(props) {
  return (
    <Col key="settings">
      <Row>
        <Col key="nav" sm={12} md={2}>
          <ProjectSettingsNav {...props} />
        </Col>
        <Col key="content" sm={12} md={10}>
          <Switch>
            <Route exact path={props.settingsUrl}
              render={renderProps => {
                return <ProjectSettingsGeneral {...props} />;
              }}
            />
            <Route exact path={props.settingsSessionsUrl}
              render={renderProps => {
                return <ProjectSettingsSessions {...props} />;
              }}
            />
          </Switch>
        </Col>
      </Row>
    </Col>
  );
}

class ProjectViewNotFound extends Component {
  render() {
    let tip;
    if (this.props.logged) {
      tip = <InfoAlert timeout={0}>
        <p>
          <FontAwesomeIcon icon={faInfoCircle} /> If you are sure the project exists,
          you may want to try the following:
        </p>
        <ul className="mb-0">
          <li>Do you have multiple accounts? Are you logged in with the right user?</li>
          <li>
            If you received this link from someone, ask that person to make sure you have access to the project.
          </li>
        </ul>
      </InfoAlert>;
    }
    else {
      const to = Url.get(Url.pages.login.link, { pathname: this.props.location.pathname });
      tip = <InfoAlert timeout={0}>
        <p className="mb-0">
          <FontAwesomeIcon icon={faInfoCircle} /> You might need to be logged in to see this project.
          Please try to <Link className="btn btn-primary btn-sm" to={to}>Log in</Link>
        </p>
      </InfoAlert>;
    }

    return <Row>
      <Col>
        <h1>Error 404</h1>
        <h3>Project not found <FontAwesomeIcon icon={faSearch} flip="horizontal" /></h3>
        <div>&nbsp;</div>
        <p>We could not find project with path {this.props.projectPathWithNamespace}.</p>
        <p>
          It is possible that the project has been deleted by its owner or you don&apos;t have permission to access it.
        </p>
        {tip}
      </Col>
    </Row>;
  }
}

class ProjectViewLoading extends Component {
  render() {
    const info = this.props.projectId ?
      <h3>Identifying project number {this.props.projectId}...</h3> :
      <h3>Loading project {this.props.projectPathWithNamespace}...</h3>;
    return <Row>
      <Col>
        {info}
        <Loader />
      </Col>
    </Row>;
  }
}

class NotFoundInsideProject extends Component {
  render() {
    return <Col key="notFound">
      <Row>
        <Col xs={12} md={12}>
          <Alert color="primary">
            <h4>404 - Page not found</h4>
            The URL
            <strong> {this.props.location.pathname.replace(this.props.match.url, "")} </strong>
            was not found inside this project. You can explore the current project using the tabs on top.
          </Alert>
        </Col>
      </Row>
    </Col>;
  }
}

class ProjectView extends Component {
  render() {
    const available = this.props.core ? this.props.core.available : null;
    const projectPathWithNamespaceOrId = this.props.projectPathWithNamespace ?
      this.props.projectPathWithNamespace
      : this.props.projectId;

    if (this.props.namespace && !this.props.projectPathWithNamespace) {
      return (
        <NamespaceProjects
          namespace={this.props.namespace}
          client={this.props.client}
        />
      );
    }
    else if (available == null || available === SpecialPropVal.UPDATING || this.props.projectId) {
      return (
        <ProjectViewLoading
          projectPathWithNamespace={this.props.projectPathWithNamespace}
          projectId={this.props.projectId} />
      );
    }
    else if (available === false) {
      const { logged } = this.props.user;
      return (
        <ProjectViewNotFound
          projectPathWithNamespace={projectPathWithNamespaceOrId}
          logged={logged}
          location={this.props.location} />
      );
    }

    return [
      <Switch key="projectHeader">
        <Route exact path={this.props.baseUrl}
          render={props => <ProjectViewHeader {...this.props} minimalistHeader={false}/>} />
        <Route path={this.props.overviewUrl}
          render={props => <ProjectViewHeader {...this.props} minimalistHeader={false}/>} />
        <Route component={()=><ProjectViewHeader {...this.props} minimalistHeader={true}/>} />
      </Switch>,
      <ProjectNav key="nav" {...this.props} />,
      <Row key="content">
        <Switch>
          <Route exact path={this.props.baseUrl}
            render={props => <ProjectViewOverview key="overview" {...this.props} />} />
          <Route path={this.props.overviewUrl}
            render={props => <ProjectViewOverview key="overview" {...this.props} />} />
          <Route path={this.props.collaborationUrl}
            render={props => <ProjectViewCollaboration key="collaboration" {...this.props} />} />
          <Route path={this.props.filesUrl}
            render={props => <ProjectViewFiles key="files" {...this.props} />} />
          <Route path={this.props.datasetsUrl}
            render={props => <ProjectViewDatasets key="datasets" {...this.props} />} />
          <Route path={this.props.settingsUrl}
            render={props => <ProjectSettings key="settings" {...this.props} />} />
          <Route path={this.props.notebookServersUrl}
            render={props => <ProjectSessions key="sessions" {...this.props} />} />
          <Route component={NotFoundInsideProject} />
        </Switch>
      </Row>
    ];

  }
}

export default { ProjectView };

// For testing
export { filterPaths };
