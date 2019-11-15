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
 *  renku-ui
 *
 *  RenkuModels.js
 *
 */

import { Schema } from './Model'
import { parseOnlyLetterAndSpace } from '../utils/formgenerator/services/InputParser';
import { checkAtLeastLength, checkIsfilled } from '../utils/formgenerator/services/InputValidator';

const userSchema = new Schema({
  name: {initial: '', mandatory: false},
  username: {initial: '', mandatory: true},
  avatarUrl: {initial: '', mandatory: false}
});

const metaSchema = new Schema({
  id: {initial: '', mandatory: false},
  // author: {schema: userSchema, mandatory: false},
  projectNamespace: {initial: {}, mandatory: false},
  visibility: {initial: 'public', mandatory: true},
  optoutKg: {initial: false, mandatory: false},
});

const displaySchema = new Schema({
  title: {initial:'', mandatory: true},
  description: {initial: '', mandatory: true},
  displayId: {initial: '', mandatory: false},
  slug: {initial: '', mandatory: true},
  loading: {initial: false, mandatory: false},
  errors: {initial: [], mandatory: false},
});

const newProjectSchema = new Schema({
  meta: {schema: metaSchema, mandatory: true},
  display: {schema: displaySchema, mandatory: true}
});

const forkDisplaySchema = new Schema({
  title: {initial:'', mandatory: true},
  description: {initial: '', mandatory: true},
  displayId: {initial: '', mandatory: false},
  slug: {initial: '', mandatory: true},
  loading: {initial: false, mandatory: false},
  errors: {initial: [], mandatory: false},

  statuses: {initial: []},
  namespaces: {initial: []},
  namespaceGroup: {initial: null},
  namespacesFetched: {initial: false}
})

const forkProjectSchema = new Schema({
  meta: {schema: metaSchema, mandatory: true},
  display: {schema: forkDisplaySchema, mandatory: true}
});

const projectSchema = new Schema({
  core: {
    schema: {
      available: {initial: null},
      created_at: {initial: null,},
      last_activity_at: {initial: null,},
      id: {initial: null,},
      description: {initial: 'no description', mandatory: true},
      displayId: {initial: '',},
      title: {initial: 'no title', mandatory: true},
      external_url: {initial: '',},
      path_with_namespace: {initial: null},
      owner: {initial: null},
    }
  },
  visibility: {
    schema: {
      level: {initial: 'private', mandatory: true},
      accessLevel: {initial: 0, mandatory: true}
    }
  },
  data: {
    schema: {
      reference: {
        schema: {
          url_or_doi: {initial:''},
          author: {initial: ''}
        },
      },
      upload: {
        schema: {
          files: {schema: []}
        }
      },
      readme: {
        schema: {
          text: {initial: '', mandatory: false}
        }
      }
    },
  },
  system: {
    schema: {
      tag_list: {schema: []},
      star_count: {initial: 0, mandatory: true},
      forks_count: {initial: 0, mandatory: true},
      forked_from_project: {initial: {}},
      ssh_url: {initial: '',},
      http_url: {initial: '',},
      merge_requests: {schema: [], initial:[]},
      branches: {schema: [], initial:[]},
      autosaved: {schema: [], initial:[]},
    }
  },
  files: {
    schema: {
      notebooks: {schema: []},
      data: {schema: []},
      modifiedFiles: {initial: {}, mandatory: true}
    }
  },
  statistics: {
    schema: {
      "commit_count": {initial: 0},
      "storage_size": {initial: 0},
      "repository_size": {initial: 0},
      "lfs_objects_size": {initial: 0},
      "job_artifacts_size": {initial: 0}
    },
  },
  transient: {
    schema: {
      requests: {initial: {}}
    }
  },
  webhook: {
    schema: {
      status: {initial: null},
      created: {initial: null},
      possible: {initial: null},
      stop: {initial: null},
      progress: {initial: null}
    }
  }
});

const notebooksSchema = new Schema({
  notebooks: {
    schema: {
      all: { initial: {} },
      poller: { initial: null },
      fetched: { initial: null },
      fetching: { initial: false },
      options: { initial: {} },
      lastParameters: { initial: null }
    }
  },
  filters: {
    schema: {
      namespace: { initial: null },
      project: { initial: null },
      branch: { initial: {} },
      commit: { initial: {} },
      discard: { initial: false },
      options: { initial: {} },

      includeMergedBranches: { initial: false },
      displayedCommits: { initial: 10 },
    }
  },
  pipelines: {
    schema: {
      main: { initial: {} },
      poller: { initial: null },
      fetched: { initial: null },
      fetching: { initial: false },

      lastParameters: { initial: null },
      lastMainId: { initial: null },
    }
  },
  data: {
    schema: {
      commits: { initial: [] }, // ! TODO: move to Project pages, shouldn't be here
      fetched: { initial: null },
      fetching: { initial: false },
    }
  },
  logs: {
    schema: {
      data: { initial: [] },
      fetched: { initial: null },
      fetching: { initial: false },
    }
  }
});

const datasetFormSchema = new Schema({
  name: {
    initial: "",
    name: 'name',
    label: 'Name',
    type: 'text',
    parseFun: parseOnlyLetterAndSpace,
    help: "Help text",
    validators: [{
      id: 'name-length',
      isValidFun: expression => checkAtLeastLength(expression, 3),
      alert: 'Name is too short'
    }]
  },
  description: {
    initial: "",
    name: 'description',
    label: 'Description',
    type: 'cktextarea',
    validators: [{
      id: 'name-length',
      isValidFun: expression => checkIsfilled(expression, 3),
      alert: 'Description can\'t be emtpy'
    }]
  },
  files: {
    initial: [],
    name: 'files',
    label: 'Files',
    type: 'filepond',
    validators:[{
      id: 'files-length',
      isValidFun: expression => checkIsfilled(expression, 1),
      alert: 'File length should be more than 1.'
    }]
  }
});

export { userSchema, metaSchema, displaySchema, newProjectSchema, projectSchema, forkProjectSchema };
export { notebooksSchema };
export { datasetFormSchema };
