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

import React, { Component } from 'react';
import { NotebookComparisonPresent, MergeRequestPresent } from './MergeRequest.present';
import Notebook from '../file/Notebook'
import { ACCESS_LEVELS } from '../api-client';

class MergeRequestContainer extends Component {
  constructor(props){
    super(props);
    this.state = {
      changes: [],
      author: {name: ''}
    }
  }

  // TODO: Write a wrapper to make promises cancellable to avoid usage of this._isMounted
  componentDidMount() {
    this._isMounted = true;
    this.props.client.getMergeRequestChanges(this.props.projectId, this.props.iid)
      .then(d => {
        if (this._isMounted) this.setState({...d});
      });
  }

  merge() {
    this.props.client.mergeMergeRequest(this.props.projectId, this.props.iid)
      .then(() => {
        this.props.updateProjectState();
        this.props.history.push(`/projects/${this.props.projectId}/pending`)
      });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {

    const externalMROverviewUrl = `${this.props.externalUrl}/merge_requests`;
    const externalMRUrl = `${externalMROverviewUrl}/${this.props.iid}/diffs`;

    const notebookComparisonView = (change, i) => {
      return <NotebookComparisonContainer
        key={i} {...this.props}
        filePath={change.new_path}
        ref1={this.state.target_branch}
        ref2={this.state.source_branch} />
    }

    const showMergeButton = this.state.merge_status === 'can_be_merged' &&
      this.props.accessLevel >= ACCESS_LEVELS.DEVELOPER

    return <MergeRequestPresent
      title={this.state.title}
      author={this.state.author}
      externalMRUrl={externalMRUrl}
      externalMROverviewUrl={externalMROverviewUrl}
      changes={this.state.changes}
      notebookComparisonView={notebookComparisonView}
      source_branch={this.state.source_branch}
      target_branch={this.state.target_branch}
      onMergeClick={this.merge.bind(this)}
      showMergeButton={showMergeButton}
    />
  }
}

class NotebookComparisonContainer extends Component {
  render() {
    const notebook1 = <Notebook.Show {...this.props} accessLevel={0} branchName={this.props.ref1} />;
    const notebook2 = <Notebook.Show {...this.props} accessLevel={0} branchName={this.props.ref2} />;

    return <NotebookComparisonPresent
      filePath={this.props.filePath}
      leftNotebookComponent={notebook1}
      rightNotebookComponent={notebook2}
    />;
  }
}

export { MergeRequestContainer }
