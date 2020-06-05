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

import React, { Component } from "react";
import { Row, Col, Nav, NavItem } from "reactstrap";
import { Switch, Route } from "react-router-dom";
import { faCodeBranch, faListUl } from "@fortawesome/free-solid-svg-icons";
import { faGitlab } from "@fortawesome/free-brands-svg-icons";

import { TooltipToggleButton, ExternalIconLink, RenkuNavLink } from "../../utils/UIComponents";
import { Contribution, NewContribution } from "../../contribution";
import { CommitsView } from "../../utils/Commits";


function MergeRequestHeader(props) {

  const buttonGit = <ExternalIconLink tooltip="Open in GitLab" icon={faGitlab} to={props.externalMRUrl} />;

  const actionButton = props.showMergeButton ?
    <TooltipToggleButton
      onClick={props.onMergeClick} tooltip={`Merge`}
      active={true}
      activeIcon={faCodeBranch} inactiveIcon={faCodeBranch}
      activeClass="text-success fa-flip-vertical" inactiveClass="text-primary" />
    : null;

  const backToList =
    <TooltipToggleButton
      onClick={() => props.history.push(props.mergeRequestsOverviewUrl)} tooltip={"Back to list"}
      active={true}
      activeIcon={faListUl} />;

  return <Row key="title" className="pb-2">
    <Col sm={8} style={{ overflow: "hidden" }}>
      <h3>{props.title}</h3>
    </Col>
    <Col sm={4} className="float-right pt-3" style={{ textAlign: "end" }}>
      {backToList}
      {buttonGit}
      {actionButton}
    </Col>
  </Row>;
}

function MergeRequestNavigation(props) {
  return <Nav tabs>
    <NavItem>
      <RenkuNavLink to="discussion" matchpath={true} title="Discussion" />
    </NavItem>
    <NavItem>
      <RenkuNavLink to="changes" matchpath={true} title="Changes" />
    </NavItem>
    <NavItem>
      <RenkuNavLink to="commits" matchpath={true} title="Commits" />
    </NavItem>
  </Nav>;
}

function ContributionsView(props) {
  // We sort the date strings instead of actual Date objects here - ok due to ISO format.
  const contributions = props.contributions
    .sort((el1, el2) => el1.created_at > el2.created_at ? -1 : 1)
    .filter(c => c.system !== true)
    .map(cont => <Contribution key={cont.id} contribution={cont.notes[0]} {...props} />);

  return [contributions,
    <NewContribution key="newContribution" {...props} mergeRequest={true} />
  ];
}

function ChangesView(props) {

  const opaqueChanges = props.changes
    .filter((change) => change.new_path.split(".").pop() !== "ipynb");

  const notebookChanges = props.changes
    .filter((change) => change.new_path.split(".").pop() === "ipynb");

  return [(opaqueChanges.length > 0) ?
    <OpaqueChanges key="opaque" changes={opaqueChanges} author={props.author} updated_at={props.updated_at}
      target_branch={props.target_branch} source_branch={props.source_branch} /> :
    null,
  (notebookChanges.length > 0) ?
    <NotebookComparisonList key="notebooks" changes={notebookChanges}
      notebookComparisonView={props.notebookComparisonView}
      target_branch={props.target_branch} source_branch={props.source_branch} /> :
    null
  ];
}

class MergeRequestPresent extends Component {

  render() {
    if (this.props.title == null) return null;
    return [
      < MergeRequestHeader key="header" {...this.props} />
      ,
      <Row key="description" className="pb-2">
        <Col sm={11}>
          <p key="lead" className="lead">
            {this.props.author.name} wants to merge changes from branch&nbsp;
            <em><strong>{this.props.source_branch}</strong></em> into&nbsp;
            <em><strong>{this.props.target_branch}</strong></em>.
          </p>
        </Col>
      </Row>,
      <MergeRequestNavigation key="navigation" {...this.props} />,
      <Col key="content" sm={12} md={12}>
        <Switch>
          <Route path={this.props.mergeRequestDiscussionUrl} render={props =>
            <ContributionsView {...this.props} />
          } />
          <Route path={this.props.mergeRequestChangesUrl} render={props =>
            <ChangesView {...this.props} />
          } />
          <Route path={this.props.mergeRequestCommitsUrl} render={props =>
            <div style={{ paddingTop: "20px" }}>
              <CommitsView
                commits={this.props.commits}
                fetched={true}
                fetching={false}
                urlRepository={this.props.externalUrl}
                urlDiff={`${this.props.externalMRUrl}?commit_id=`}
              />
            </div>
          } />
        </Switch>
      </Col>
    ];
  }
}

class SimpleChange extends Component {
  render() {
    let line;
    if (this.props.new_file)
      line = `New file: ${this.props.new_path}`;

    else if (this.props.deleted_file)
      line = `Deleted file: ${this.props.new_path}`;

    else if (this.props.renamed_file)
      line = `Renamed file: ${this.props.old_path} --> ${this.props.new_path}`;

    else
      line = `Modified file: ${this.props.new_path}`;

    return <Row>
      <Col xs={6}>
      </Col>
      <Col xs={6}>
        {line}
      </Col>
    </Row>;
  }
}

class NotebookComparisonList extends Component {
  render() {
    const notebookChanges = this.props.changes
      .map((change, i) => this.props.notebookComparisonView(change, i));
    return [
      <br key="space" />,
      <Row key="header"><br /><Col><p><strong>Notebook Changes</strong></p></Col></Row>,
      <Row key="titles">
        <Col xs={6}><p><strong>{this.props.target_branch}</strong></p></Col>
        <Col xs={6}><p><strong>{this.props.source_branch}</strong></p></Col>
      </Row>,
      notebookChanges
    ];
  }
}

class NotebookComparisonPresent extends Component {
  render() {
    return (
      <Row>
        <Col xs={6}>
          <p><br />{this.props.filePath}</p>
          <div className="notebook-comparison">
            {this.props.leftNotebookComponent}
          </div>
        </Col>
        <Col xs={6}>
          <p><br />{this.props.filePath}</p>
          <div className="notebook-comparison">
            {this.props.rightNotebookComponent}
          </div>
        </Col>
      </Row>
    );
  }
}

class OpaqueChanges extends Component {
  render() {

    const opaqueChanges = this.props.changes
      .map((change, i) => <SimpleChange {...change} key={i} />);

    return [
      <br key="space" />,
      <Row key="header"><Col><p><strong>Opaque Changes</strong></p></Col></Row>,
      <Row key="titles">
        <Col xs={6}><p><strong>{this.props.target_branch}</strong></p></Col>
        <Col xs={6}><p><strong>{this.props.source_branch}</strong></p></Col>
      </Row>,
      opaqueChanges];
  }
}


export { SimpleChange, NotebookComparisonPresent, MergeRequestPresent };