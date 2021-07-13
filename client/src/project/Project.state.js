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
 *  Project.state.js
 *  Redux-based state-management code.
 */

import { API_ERRORS } from "../api-client";
import { StateModel, SpecialPropVal, projectSchema, projectGlobalSchema } from "../model";
import { isNullOrUndefined } from "util";
import { splitAutosavedBranches } from "../utils/HelperFunctions";


const GraphIndexingStatus = {
  NO_WEBHOOK: -2,
  NO_PROGRESS: -1,
  MIN_VALUE: 0,
  MAX_VALUE: 100
};

const MigrationStatus = {
  MIGRATING: "MIGRATING",
  FINISHED: "FINISHED",
  ERROR: "ERROR"
};

class ProjectModel extends StateModel {
  constructor(stateBinding, stateHolder, initialState) {
    super(projectSchema, stateBinding, stateHolder, initialState);
  }

  fetchMigrationCheck(client) {
    return client.getProjectIdFromService(this.get("system.http_url"))
      .then((response)=>{
        if (response.data && response.data.error !== undefined) {
          this.set("migration.check_error", response.data.error.reason);
        }
        else {
          client.performMigrationCheck(response)
            .then((response)=>{
              if (response.data && response.data.error !== undefined)
                this.set("migration.check_error", response.data.error);

              else
                this.set("migration", response.data.result);
            });
        }
      });
  }

  migrateProject(client, params) {
    if (this.get("migration.migration_status") === MigrationStatus.MIGRATING)
      return;
    this.set("migration.migration_status", MigrationStatus.MIGRATING);
    client.getProjectIdFromService(this.get("system.http_url"))
      .then((projectId)=>{
        client.performMigration(projectId, params)
          .then((response)=>{
            if (response.data.error) {
              this.set("migration.migration_status", MigrationStatus.ERROR);
              this.set("migration.migration_error", response.data.error);
            }
            else {
              this.fetchMigrationCheck(client).then(response => {
                this.set("migration.migration_status", MigrationStatus.FINISHED);
                this.set("migration.migration_error", null);
              });
            }
          });
      });
  }

  stopCheckingWebhook() {
    this.set("webhook.stop", true);
  }

  fetchGraphWebhook(client, user) {
    if (!user) {
      this.set("webhook.possible", false);
      return;
    }
    const userIsOwner = this.get("core.owner.id") === user.data.id;
    this.set("webhook.possible", userIsOwner);
    if (userIsOwner)
      this.fetchGraphWebhookStatus(client, this.get("core.id"));
  }

  fetchGraphStatus(client) {
    return client.checkGraphStatus(this.get("core.id"))
      .then((resp) => {
        let progress;
        if (resp.progress == null)
          progress = GraphIndexingStatus.NO_PROGRESS;

        if (resp.progress === 0 || resp.progress)
          progress = resp.progress;

        this.set("webhook.progress", progress);
        return progress;
      })
      .catch((err) => {
        if (err.case === API_ERRORS.notFoundError) {
          const progress = GraphIndexingStatus.NO_WEBHOOK;
          this.set("webhook.progress", progress);
          return progress;
        }

        throw err;

      });
  }

  fetchGraphWebhookStatus(client) {
    this.set("webhook.created", false);
    this.setUpdating({ webhook: { status: true } });
    return client.checkGraphWebhook(this.get("core.id"))
      .then((resp) => {
        this.set("webhook.status", resp);
      })
      .catch((err) => {
        this.set("webhook.status", err);
      });
  }

  createGraphWebhook(client) {
    this.setUpdating({ webhook: { created: true } });
    return client.createGraphWebhook(this.get("core.id"))
      .then((resp) => {
        this.set("webhook.created", resp);
      })
      .catch((err) => {
        this.set("webhook.created", err);
      });
  }

  // TODO: Do we really want to re-fetch the entire project on every change?
  fetchProject(client, projectPathWithNamespace) {
    this.setUpdating({ core: { available: true } });
    return client.getProject(projectPathWithNamespace, { statistics: true })
      .then(resp => resp.data)
      .then(d => {
        const updatedState = {
          core: { ...d.metadata.core, available: true },
          system: {
            ...d.metadata.system,
            tag_list: { $set: d.metadata.system.tag_list } // fix empty tag_list not updating
          },
          visibility: d.metadata.visibility
        };
        this.setObject(updatedState);
        return d;
      })
      .catch(err => {
        if (err.case === API_ERRORS.notFoundError)
          this.set("core.available", false);

        else throw err;
      });
  }

  saveProjectLastNode(nodeData) {
    this.set("filesTree.last", nodeData);
  }

  initialFetchProjectFilesTree(client, openFilePath, openFolder ) {
    this.setUpdating({ transient: { requests: { filesTree: true } } });
    return client.getProjectFilesTree(this.get("core.id"), openFilePath)
      .then(d => {
        const updatedState = { filesTree: d, transient: { requests: { filesTree: false } } };
        this.setObject(updatedState);
        this.set("filesTree", d);
        return d;
      })
      .then(d=> {
        return this.returnTreeOrFetchNext(client, openFilePath, openFolder, d);
      });
  }

  deepFetchProjectFilesTree(client, openFilePath, openFolder, oldTree) {
    this.setUpdating({ transient: { requests: { filesTree: true } } });
    return client.getProjectFilesTree(this.get("core.id"), openFilePath, openFolder, oldTree.lfsFiles)
      .then(d => {
        const updatedState = this.insertInParentTree(oldTree, d, openFolder);
        this.setObject(updatedState);
        this.set("filesTree", oldTree);
        return oldTree;
      }).then(d=> {
        return this.returnTreeOrFetchNext(client, openFilePath, openFolder, d);
      });
  }

  returnTreeOrFetchNext(client, openFilePath, openFolder, tree) {
    if (openFilePath !== undefined && openFilePath.split("/").length > 1) {
      const openFilePathArray = openFilePath.split("/");
      const goTo = openFolder !== undefined ?
        openFolder + "/" + openFilePathArray[0]
        : openFilePathArray[0];
      return this.fetchProjectFilesTree(client, openFilePath.replace(openFilePathArray[0], ""), goTo);
    }
    return tree;

  }

  cleanFilePathUrl(openFilePath) {
    if (openFilePath.startsWith("/"))
      return openFilePath = openFilePath.substring(1);
    return openFilePath;
  }

  insertInParentTree(parentTree, newTree, openFolder) {
    parentTree.hash[openFolder].treeRef.children = newTree.tree;
    parentTree.hash[openFolder].childrenLoaded = true;
    parentTree.hash[openFolder].childrenOpen = true;
    for (const node in newTree.hash)
      parentTree.hash[node] = newTree.hash[node];
    return { filesTree: parentTree, transient: { requests: { filesTree: false } } };
  }

  fetchProjectFilesTree(client, openFilePath, openFolder) {
    if (this.get("transient.requests.filesTree") === SpecialPropVal.UPDATING) return;
    const oldTree = this.get("filesTree");
    openFilePath = this.cleanFilePathUrl(openFilePath);
    if (isNullOrUndefined(oldTree))
      return this.initialFetchProjectFilesTree(client, openFilePath, openFolder);

    if (openFolder !== undefined && oldTree.hash[openFolder].childrenLoaded === false)
      return this.deepFetchProjectFilesTree(client, openFilePath, openFolder, oldTree);

    return oldTree;


  }

  setProjectOpenFolder(client, folderPath) {
    let filesTree = this.get("filesTree");
    if (filesTree.hash[folderPath].childrenLoaded === false)
      this.fetchProjectFilesTree(client, "", folderPath);

    filesTree.hash[folderPath].childrenOpen = !filesTree.hash[folderPath].childrenOpen;
    this.set("filesTree", filesTree);
  }

  fetchProjectDatasetsFromKg(client) { //from KG
    if (this.get("core.datasets_kg") === SpecialPropVal.UPDATING) return;
    this.setUpdating({ core: { datasets_kg: true } });
    return client.getProjectDatasetsFromKG(this.get("core.path_with_namespace"))
      .then(datasets => {
        const updatedState = { datasets_kg: { $set: datasets }, transient: { requests: { datasets_kg: false } } };
        this.setObject({ core: updatedState });
        return datasets;
      })
      .catch(err => {
        const datasets = [];
        const updatedState = { datasets_kg: { $set: datasets }, transient: { requests: { datasets_kg: false } } };
        this.setObject({ core: updatedState });
      });
  }


  fetchProjectDatasets(client, forceReFetch) {
    let datasets = this.get("core.datasets");
    if (datasets === SpecialPropVal.UPDATING) return;
    if (datasets && datasets.error === undefined && !forceReFetch) return datasets;
    this.setUpdating({ core: { datasets: true } });
    return client.listProjectDatasetsFromCoreService(this.get("system.http_url"))
      .then(response => {
        let responseDs = response.data.error ? response.data : response.data.result.datasets;
        const updatedState = { datasets: { $set: responseDs }, transient: { requests: { datasets: false } } };
        this.setObject({ core: updatedState });
        return responseDs;
      })
      .catch(err => {
        const updatedState = { datasets: { $set: { error: err } }, transient: { requests: { datasets: false } } };
        this.setObject({ core: updatedState });
      });
  }

  fetchModifiedFiles(client) {
    client.getModifiedFiles(this.get("core.id"))
      .then(d => {
        this.set("files.modifiedFiles", d);
      });
  }

  fetchMergeRequests(client) {
    client.getMergeRequests(this.get("core.id"))
      .then(resp => resp.data)
      .then(d => {
        this.set("system.merge_requests", d);
      });
  }

  // TODO: migrate branches to ProjectCoordinator and use a pattern similar to fetchCommits
  fetchBranches(client) {
    const branches = this.get("system.branches");
    if (branches === SpecialPropVal.UPDATING)
      return;
    this.setUpdating({ system: { branches: true } });
    return client.getBranches(this.get("core.id"))
      .then(resp => resp.data)
      .then(data => {
        // split away autosaved branches and add external url
        const { standard, autosaved } = splitAutosavedBranches(data);
        const externalUrl = this.get("core.external_url");
        const autosavedUrl = autosaved.map(branch => {
          const url = `${externalUrl}/tree/${branch.name}`;
          branch.autosave.url = url;
          return branch;
        });
        this.setObject({
          system: {
            branches: { $set: standard },
            autosaved: { $set: autosavedUrl }
          }
        });

        return standard;
      });
  }

  fetchReadme(client) {
    // Do not fetch if a fetch is in progress
    if (this.get("transient.requests.readme") === SpecialPropVal.UPDATING) return;

    this.setUpdating({ transient: { requests: { readme: true } } });
    client.getProjectReadme(this.get("core.id"))
      .then(d => this.set("data.readme.text", d.text))
      .catch(error => {
        if (error.case === API_ERRORS.notFoundError)
          this.set("data.readme.text", "No readme file found.");

      })
      .finally(() => this.set("transient.requests.readme", false));
  }

  setTags(client, tags) {
    this.setUpdating({ system: { tag_list: [true] } });
    client.setTags(this.get("core.id"), tags)
      .then(() => { this.fetchProject(client, this.get("core.id")); });
  }

  setDescription(client, description) {
    this.setUpdating({ core: { description: true } });
    client.setDescription(this.get("core.id"), description).then(() => {
      this.fetchProject(client, this.get("core.id"));
    });
  }

  setAvatar(client, avatarFile) {
    // this.setUpdating({ core: { avatar_url: [true] } });
    return client.setAvatar(this.get("core.id"), avatarFile)
      .then(() => { this.fetchProject(client, this.get("core.id")); });
  }

  toggleForkModal() {
    const forkModalOpen = this.get("transient.forkModalOpen");
    const forkModalFlipped = forkModalOpen === false ? true : false;
    this.set("transient.forkModalOpen", forkModalFlipped);
  }

  star(client, starred) {
    return client.starProject(this.get("core.id"), starred)
      .then((resp) => resp.data);
  }

  setStars(num) {
    this.set("system.star_count", num);
  }
}

class ProjectCoordinator {
  constructor(client, model, notifications = null) {
    this.client = client;
    this.model = model;
    this.notifications = notifications;
  }

  get(component = "") {
    return this.model.get(component);
  }

  resetProject() {
    const emptyModel = projectGlobalSchema.createInitialized();
    this.model.setObject({
      metadata: { $set: emptyModel.metadata },
      statistics: { $set: emptyModel.statistics }
    });
  }

  setProjectData(data, statistics = false) {
    let metadata, statsObject;

    // set metadata
    if (!data) {
      metadata = {
        $set: {
          ...projectGlobalSchema.createInitialized().metadata,
          exists: false,
          fetched: new Date(),
          fetching: false
        }
      };
      statsObject = {
        $set: {
          ...projectGlobalSchema.createInitialized().statistics,
          fetched: new Date(),
          fetching: false
        }
      };
    }
    else {
      metadata = {
        exists: true,
        id: data.all.id,
        namespace: data.all.namespace.full_path,
        path: data.all.path,
        pathWithNamespace: data.all.path_with_namespace,
        repositoryUrl: data.all.web_url,
        starCount: data.all.star_count,
        forksCount: data.all.forks_count,
        visibility: data.metadata.visibility.level, // this is computed in carveProject
        accessLevel: data.metadata.visibility.accessLevel, // this is computed in carveProject
        fetched: new Date(),
        fetching: false
      };

      // set statistics
      if (statistics) {
        const stats = data.all && data.all.statistics ?
          data.all.statistics :
          projectGlobalSchema.createInitialized().statistics.data;
        statsObject = {
          data: { $set: stats },
          fetched: new Date(),
          fetching: false
        };
      }
    }

    this.model.setObject({ metadata: metadata, statistics: statsObject });
    return metadata;
  }

  async fetchStatistics(pathWithNamespace) {
    if (this.model.get("statistics.fetching"))
      return;
    if (!pathWithNamespace)
      pathWithNamespace = this.model.get("metadata.pathWithNamespace");
    if (!pathWithNamespace)
      return;
    this.model.set("statistics.fetching", true);
    const resp = await this.client.getProject(pathWithNamespace, { statistics: true });
    const stats = resp.data.all.statistics ?
      resp.data.all.statistics :
      projectGlobalSchema.createInitialized().statistics.data;
    const statsObject = {
      fetching: false,
      fetched: new Date(),
      data: { $set: stats }
    };
    this.model.setObject({ statistics: statsObject });
    return stats;
  }

  async fetchCommits(customFilters = null) {
    const projectId = this.model.get("metadata.id");
    if (!projectId)
      return {};
    const branch = customFilters ?
      customFilters.branch :
      this.model.get("filters.branch.name");

    // start fetching
    this.model.set("commits.fetching", true);
    let response = null, date = null, commits = [], error = null;
    try {
      response = await this.client.getCommits(projectId, branch);
      if (response.data)
        commits = response.data;
      error = response.error;
      date = new Date();
    }
    catch (commitsError) {
      error = commitsError;
    }

    if (error && this.notifications) {
      // Add warning when something fails. It's not needed when the problem is the commits number.
      const errorMex = error.message ?
        error.message :
        JSON.stringify(error);
      if (!errorMex.startsWith("Cannot iterate more than")) {
        const projectName = this.model.get("metadata.pathWithNamespace");
        this.notifications.addWarning(
          this.notifications.Topics.PROJECT_API,
          "There was an error while fetching the project commits.",
          null, null, [],
          `Error for branch "${branch}" on project "${projectName}": ${errorMex}`
        );
      }
    }
    this.model.setObject({
      commits: {
        fetching: false,
        fetched: date,
        list: { $set: commits },
        error: error
      }
    });
    return commits;
  }

  async fetchProjectConfig(repositoryUrl, branch = null) {
    let configObject = {
      error: { $set: {} },
      fetching: true,
    };
    this.model.setObject({ config: configObject });
    const response = await this.client.getProjectConfig(repositoryUrl, branch);
    configObject.fetching = false;
    configObject.fetched = new Date();
    if (response.data && response.data.error) {
      configObject.error = response.data.error;
      this.model.setObject({ config: configObject });
      return response.data.error;
    }
    configObject.data = { $set: response.data.result };
    this.model.setObject({ config: configObject });
    return response.data.result;
  }
}

export { ProjectModel, GraphIndexingStatus, ProjectCoordinator, MigrationStatus };
