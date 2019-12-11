/*!
 * Copyright 2017 - Swiss Data Science Center (SDSC)
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
 *  Project.js
 *  Container components for project.
 */

import React, { Component } from 'react';
import { connect } from 'react-redux'

import { StateKind } from '../model/Model';
import Present from './Project.present'

import { ProjectModel, GraphIndexingStatus } from './Project.state'
import Issue from '../issue/Issue';
import { FileLineage } from '../file'
import { ACCESS_LEVELS } from '../api-client';
import { alertError } from '../utils/Errors';
import { MergeRequest, MergeRequestList } from '../merge-request';

import List from './list';
import New from './new';
import { ShowFile } from '../file';
import Fork from './fork';
import ShowDataset from '../dataset/Dataset.container';
import NewDataset from './datasets/new/index';

// TODO: This component has grown too much and needs restructuring. One option would be to insert
// TODO: another container component between this top-level project component and the presentational
// TODO: component displaying the project overview.
class View extends Component {
  constructor(props) {
    super(props);
    this.projectState = new ProjectModel(StateKind.REDUX);
  }

  componentWillMount(){
    if(this.props.projectPathWithNamespace === undefined && this.props.projectId !== undefined){
      this.redirectProjectWithNumericId();
    }
  }

  componentDidMount() {
    if(this.props.projectPathWithNamespace !== undefined){
      // fetch only if user data are already loaded
      if (this.props.user.available === true) {
        this.fetchAll();
      }

      // in case the route fails it tests weather it could be a projectid route
      const routes=['overview','issues','issue_new','files','lineage','notebooks','collaboration',
        'data','workflows','settings','pending','launchNotebook','notebookServers','datasets','environments'];
      const available = this.props.core ? this.props.core.available : null;
      const potentialProjectId = this.props.projectPathWithNamespace.split('/')[0];
      const potentialRoute = this.props.projectPathWithNamespace.split('/')[1];

      if(!available && !isNaN(potentialProjectId) && routes.indexOf(potentialRoute) > 0){
        this.redirectAfterFetchFails(this.props.projectPathWithNamespace,
          this.props.location.pathname.replace("/projects/"+potentialProjectId,''));
      }
    }
  }

  componentDidUpdate(prevProps) {
    // re-fetch when user data are available
    if (prevProps.user.available !== true && this.props.user.available === true) {
      this.fetchAll();
    }
  }

  async fetchProject() { return this.projectState.fetchProject(this.props.client, this.props.projectPathWithNamespace);}
  async fetchReadme() { return this.projectState.fetchReadme(this.props.client); }
  async fetchMergeRequests() { return this.projectState.fetchMergeRequests(this.props.client); }
  async fetchModifiedFiles() { return this.projectState.fetchModifiedFiles(this.props.client); }
  async fetchBranches() { return this.projectState.fetchBranches(this.props.client); }
  async createGraphWebhook() { return this.projectState.createGraphWebhook(this.props.client); }
  async stopCheckingWebhook() { this.projectState.stopCheckingWebhook(); }
  async fetchGraphWebhook() { this.projectState.fetchGraphWebhook(this.props.client, this.props.user); }
  async fetchProjectFilesTree() {
    return this.projectState.fetchProjectFilesTree(this.props.client, this.cleanCurrentURL());
  }
  async fetchProjectIssues() { this.projectState.fetchProjectIssues(this.props.client)}
  async setProjectOpenFolder(filepath) {
    this.projectState.setProjectOpenFolder(this.props.client, filepath);
  }
  async fetchProjectDatasets() {
    return this.projectState.fetchProjectDatasets(this.props.client);
  }
  async fetchGraphStatus() { return this.projectState.fetchGraphStatus(this.props.client); }

  async fetchAll() {
    if(this.props.projectPathWithNamespace)
      await this.fetchProject();
    if (this.props.user.id)
      this.checkGraphWebhook();
  }

  redirectProjectWithNumericId(){
    this.props.client.getProjectById(this.props.projectId)
      .then((project)=> {
        this.props.history.push('/projects/'+project.data.metadata.core.path_with_namespace);
      });
  }

  redirectAfterFetchFails(projectPathWithNamespace, urlInsideProject){
    this.props.client.getProjectById(projectPathWithNamespace.split('/')[0])
      .then((project)=> {
        this.props.history.push('/projects/'+project.data.metadata.core.path_with_namespace+urlInsideProject);
      })
  }

  cleanCurrentURL(){
    const subUrls = this.getSubUrls();
    if (subUrls.filesUrl === this.props.location.pathname || subUrls.filesUrl + '/' === this.props.location.pathname)
      return ""
    else
      return this.props.location.pathname
        .replace(this.props.match.projectPath, "")
        .replace(subUrls.lineagesUrl, "")
        .replace(subUrls.fileContentUrl, "");
  }

  // TODO: move all .set actions to Project.state.js
  checkGraphWebhook() {
    // check if data are available -- may remove this?
    if (this.projectState.get('core.available') !== true) {
      this.projectState.set('webhook.possible', false);
      return;
    }
    // check user permissions and fetch webhook status
    const webhookCreator = this.projectState.get('visibility.accessLevel') >= ACCESS_LEVELS.MAINTAINER ?
      true :
      false;
    this.projectState.set('webhook.possible', webhookCreator);
    if (webhookCreator) {
      this.projectState.fetchGraphWebhookStatus(this.props.client);
    }
  }

  getStarred(user) {
    if (user && user.starredProjects) {
      return user.starredProjects.map((project) => project.id).indexOf(this.projectState.get('core.id')) >= 0
    }
  }

  getSubUrls() {
    const match = this.props.match;
    const baseUrl =  match.url.endsWith('/') ? match.url.slice(0, -1) : match.url;
    const filesUrl = `${baseUrl}/files`;
    const fileContentUrl = `${filesUrl}/blob`;
    const collaborationUrl = `${baseUrl}/collaboration`;

    return {
      projectsUrl: '/projects',
      baseUrl: baseUrl,
      overviewUrl: `${baseUrl}/overview`,
      statsUrl: `${baseUrl}/overview/stats`,
      overviewDatasetsUrl: `${baseUrl}/overview/datasets`,
      datasetsUrl: `${baseUrl}/datasets`,
      newDatasetUrl: `${baseUrl}/datasets/new_dataset`,
      datasetUrl: `${baseUrl}/datasets/:datasetId`,
      issueNewUrl: `${baseUrl}/issue_new`,
      collaborationUrl:`${collaborationUrl}`,
      issuesUrl: `${collaborationUrl}/issues`,
      issueUrl: `${collaborationUrl}/issues/:issueIid`,
      mergeRequestsOverviewUrl: `${collaborationUrl}/mergerequests`,
      mergeRequestUrl: `${collaborationUrl}/mergerequests/:mrIid(\\d+)`,
      filesUrl: `${filesUrl}`,
      fileContentUrl: `${fileContentUrl}`,
      lineagesUrl: `${filesUrl}/lineage`,
      lineageUrl: `${filesUrl}/lineage/:filePath+`,
      notebookUrl: `${fileContentUrl}/:filePath([^.]+.ipynb)`,
      dataUrl: `${filesUrl}/data`,
      workflowsUrl: `${filesUrl}/workflows`,
      settingsUrl: `${baseUrl}/settings`,
      mrOverviewUrl: `${baseUrl}/pending`,
      mrUrl: `${baseUrl}/pending/:mrIid`,
      launchNotebookUrl: `${baseUrl}/environments/new`,
      notebookServersUrl: `${baseUrl}/environments`
    }
  }

  // TODO: Fix for MRs across forks.
  getMrSuggestions() {

    // Don't display any suggestions while the state is updating - leads to annoying flashing fo
    // wrong information while branches are there but merge_requests are not...
    if (this.projectState.get('system.merge_requests') === this.projectState._updatingPropVal) return [];
    if (this.projectState.get('system.branches') === this.projectState._updatingPropVal) return [];

    const mergeRequestBranches = this.projectState.get('system.merge_requests')
      .map(mr => mr.source_branch);

    return this.projectState.get('system.branches')
      .filter(branch => branch.name !== 'master')
      .filter(branch => !branch.merged)
      .filter(branch => mergeRequestBranches.indexOf(branch.name) < 0);
  }

  subComponents(projectId, ownProps) {
    const accessLevel = this.projectState.get('visibility.accessLevel');
    const externalUrl = this.projectState.get('core.external_url');
    const updateProjectView = this.forceUpdate.bind(this);
    const filesTree = this.projectState.get('filesTree');
    const datasets = this.projectState.get('core.datasets');
    const graphProgress = this.projectState.get('webhook.progress');
    const mergeRequests = this.projectState.get('system.merge_requests');
    const maintainer = this.projectState.get('visibility.accessLevel') >= ACCESS_LEVELS.MAINTAINER ?
      true :
      false;
    const forkedData = this.projectState.get('system.forked_from_project');
    const forked = (forkedData != null && Object.keys(forkedData).length > 0) ?
      true :
      false;
    const forkModalOpen = this.projectState.get('forkModalOpen');
    const projectPathWithNamespace = this.projectState.get('core.path_with_namespace');
    // Access to the project state could be given to the subComponents by connecting them here to
    // the projectStore. This is not yet necessary.
    const subUrls = this.getSubUrls();
    const subProps = {...ownProps, projectId, accessLevel, externalUrl, filesTree, projectPathWithNamespace, forkModalOpen, datasets};
    const branches = {
      all: this.projectState.get('system.branches'),
      fetch: () => { this.fetchBranches() }
    };

    const mapStateToProps = (state, ownProps) => {
      return {
        mergeRequests: mergeRequests === this.projectState._updatingPropVal ? [] : mergeRequests,
        externalMROverviewUrl: `${externalUrl}/merge_requests`,
        ...ownProps
      };
    };

    const ConnectedMergeRequestList = connect(mapStateToProps)(MergeRequestList);

    return {

      issueView: (p, toogleIsuesListVisibility, issuesListVisible) => <Issue.View key="issue" {...subProps}
        issueIid={p.match.params.issueIid}
        updateProjectView={updateProjectView}
        projectPath={projectPathWithNamespace}
        toogleIsuesListVisibility={toogleIsuesListVisibility}
        issuesListVisible={issuesListVisible}
      />,
      /* TODO Should we handle each type of file or just have a generic project files viewer? */

      lineageView: (p) => <FileLineage key="lineage" {...subProps}
        externalUrl={externalUrl}
        projectPath={projectPathWithNamespace}
        path={p.match.params.filePath}
        notebook={"Notebook"}
        accessLevel={accessLevel}
        progress={graphProgress}
        maintainer={maintainer}
        forked={forked}
        launchNotebookUrl={subUrls.launchNotebookUrl}
        projectNamespace={this.projectState.get('core.namespace_path')}
        projectPathOnly={this.projectState.get('core.project_path')}
        branches={branches}
        hashElement={filesTree !== undefined ? filesTree.hash[p.match.params.filePath] : undefined} />,

      fileView: (p) => <ShowFile
        key="filepreview" {...subProps}
        filePath={p.location.pathname}
        lineagesPath={subUrls.lineagesUrl}
        launchNotebookUrl={subUrls.launchNotebookUrl}
        projectNamespace={this.projectState.get('core.namespace_path')}
        projectPath={this.projectState.get('core.project_path')}
        branches={branches}
        hashElement={filesTree !== undefined ?
          filesTree.hash[p.location.pathname.replace(this.props.match.url + '/files/blob/', '')] :
          undefined} />,

      datasetView: (p) => <ShowDataset
        key="datasetpreview"  {...subProps}
        progress={graphProgress}
        maintainer={maintainer}
        forked={forked}
        insideProject={true}
        datasets={datasets}
        lineagesUrl={subUrls.lineagesUrl}
        fileContentUrl={subUrls.fileContentUrl}
        projectsUrl={subUrls.projectsUrl}
        selectedDataset={p.match.params.datasetId}
      />,

      newDataset: (p) => <NewDataset
        key="datasetpreview"  {...subProps}
        progress={graphProgress}
        maintainer={maintainer}
        forked={forked}
        insideProject={true}
        datasets={datasets}
        lineagesUrl={subUrls.lineagesUrl}
        fileContentUrl={subUrls.fileContentUrl}
        projectsUrl={subUrls.projectsUrl}
        selectedDataset={p.match.params.datasetId}
        client={this.props.client}
        history={this.props.history}
      />,

      mrList: <ConnectedMergeRequestList key="mrList" store={this.projectState.reduxStore}
        mergeRequestsOverviewUrl={subUrls.mergeRequestsOverviewUrl} />,

      mrView: (p) => <MergeRequest
        key="mr" {...subProps}
        match={p.match}
        iid={p.match.params.mrIid}
        updateProjectState={this.fetchAll.bind(this)} />,

      fork: () => <Fork
        projectId={projectId}
        title={this.projectState.get('core.title')}
        forkModalOpen={forkModalOpen}
        toogleForkModal={this.eventHandlers.toogleForkModal}
        history={this.props.history}
        client={this.props.client}
        user={this.props.user} />

    }
  }

  eventHandlers = {
    onProjectTagsChange: (tags) => {
      this.projectState.setTags(this.props.client, tags, this.props.userStateDispatch);
    },
    onProjectDescriptionChange: (description) => {
      this.projectState.setDescription(this.props.client, description, this.props.userStateDispatch);
    },
    onStar: (e) => {
      e.preventDefault();
      const user = this.props.user;
      if (!(user && user.id != null)) {
        alertError('Please login to star a project.');
        return;
      }
      const starred = this.getStarred(this.props.user);
      this.projectState.star(this.props.client, this.props.userStateDispatch, starred)
    },
    toogleForkModal: (e) => {
      e.preventDefault();
      this.projectState.toogleForkModal();
    },
    onCreateMergeRequest: (branch) => {
      const core = this.projectState.get('core');
      let newMRiid;
      // TODO: Again, it would be nice to update the local state rather than relying on the server
      // TODO: updating the information fast enough through all possible layers of caches, etc...
      this.props.client.createMergeRequest(core.id, branch.name, branch.name, 'master')
        .then((d) => {
          newMRiid = d.data.iid;
          return this.fetchAll()
        })
        .then(() => this.props.history.push(`${this.getSubUrls().mergeRequestsOverviewUrl}/${newMRiid}`))
    },
    onProjectRefresh: (e) => {
      e.preventDefault();
      this.fetchAll()
    },
    fetchOverviewData: () => { this.fetchReadme() },
    fetchMrSuggestions: async () => {
      await this.fetchMergeRequests();
      this.fetchBranches();
    },
    fetchFiles: () => {
      this.fetchProjectFilesTree();
      //this.fetchModifiedFiles();
    },
    fetchIssues: () => {
      this.fetchProjectIssues();
    },
    fetchDatasets : () => {
      this.fetchProjectDatasets();
    },
    setOpenFolder: (filePath) => {
      this.setProjectOpenFolder(filePath);
    },
    createGraphWebhook: (e) => {
      e.preventDefault();
      return this.createGraphWebhook();
    },
    onCloseGraphWebhook: () => {
      this.stopCheckingWebhook();
    },
    fetchGraphStatus: () => {
      return this.fetchGraphStatus();
    },
    fetchBranches: () => {
      return this.fetchBranches();
    }
  };

  mapStateToProps(state, ownProps) {
    const internalId = this.projectState.get('core.id') || parseInt(ownProps.match.params.id, 10);
    const starred = this.getStarred(ownProps.user);
    const settingsReadOnly = state.visibility.accessLevel < ACCESS_LEVELS.MAINTAINER;
    const suggestedMRBranches = this.getMrSuggestions();
    const externalUrl = this.projectState.get('core.external_url');
    const canCreateMR = state.visibility.accessLevel >= ACCESS_LEVELS.DEVELOPER;
    const forkModalOpen = this.projectState.get('forkModalOpen');

    return {
      ...this.projectState.get(),
      ...ownProps,
      ...this.getSubUrls(),
      ...this.subComponents.bind(this)(internalId, ownProps),
      starred,
      forkModalOpen,
      settingsReadOnly,
      suggestedMRBranches,
      externalUrl,
      canCreateMR,
    }
  }

  render() {
    const ConnectedProjectView = connect(
      this.mapStateToProps.bind(this), null, null, {storeKey: 'projectStore'}
    )(Present.ProjectView);
    const props = {...this.props, ...this.eventHandlers, projectStore: this.projectState.reduxStore};
    return <ConnectedProjectView {...props} />
  }
}

export default { New, View, List };
export { GraphIndexingStatus };
