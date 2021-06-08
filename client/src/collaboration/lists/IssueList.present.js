
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Badge } from "reactstrap";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RenkuMarkdown, TimeCaption, Pagination, Loader } from "../../utils/UIComponents";
import { itemsStateMap } from "./CollaborationList.container";

function issueStateBadge(issueStateValue) {
  let issueState = <Badge color="secondary">{issueStateValue}</Badge>;
  if (issueStateValue === itemsStateMap.OPENED)
    issueState = <Badge color="success">open</Badge>;
  if (issueStateValue === itemsStateMap.CLOSED)
    issueState = <Badge color="primary">complete</Badge>;
  return issueState;
}

class IssueListRow extends Component {
  render() {
    const issueIid = this.props.iid;
    const issueUrl = `${this.props.issueBaseUrl}/issues/${issueIid}/`;
    const issueState = issueStateBadge(this.props.state);
    const titleText = this.props.title || "no title";

    return <Link className="d-flex flex-row rk-search-result rk-search-result-100" to={issueUrl}>
      <span className={"circle me-3 mt-2 collaboration"}></span>
      <Col className="d-flex align-items-start flex-column col-10 overflow-hidden">
        <div className="title d-inline-block text-truncate">
          {titleText}
        </div>
        <div className="description text-truncate text-rk-text">
          <RenkuMarkdown markdownText={this.props.description} singleLine={true} />
        </div>
        <div className="mt-auto">
          <TimeCaption caption="Updated" time={this.props.updated_at} className="text-secondary"/>
        </div>
      </Col>
      <Col className="d-flex justify-content-end flex-shrink-0">
        <span>
          <FontAwesomeIcon icon={faComments} /> {this.props.user_notes_count}{"  "}{issueState}
        </span>
      </Col>
    </Link>;
  }
}

class IssueList extends Component {
  render() {
    const { items, user } = this.props;
    const rows = items.length > 0 ? items.map((d, i) =>
      <IssueListRow key={i} {...d}
        issueBaseUrl={this.props.collaborationUrl}
        projectId={this.props.projectId}
      />)
      : <Row>
        <Col sm={8} md={8}>
          No issues to display.
        </Col>
      </Row>;

    const newIssueButton = (user.logged) ?
      <div>
        <Link className="btn btn-secondary btn-sm" role="button" to={this.props.issueNewUrl}>
          <span className="arrow-right pt-2 pb-2">  </span>
          New Issue
        </Link>
      </div>

      :
      null;

    return [<Row key="header" className="pt-2 pb-3">
      <Col className="d-flex mb-2 justify-content-between">
        <h3 className="me-4">Issues List</h3>
        {newIssueButton}
      </Col>
    </Row>
    , <Row key="issues">
      <Col xs={12}>
        {this.props.loading ?
          <Loader /> :
          <div className="mb-4">{rows}</div>
        }
      </Col>
    </Row>
    , <Pagination key="pagination" {...this.props}
      className="d-flex justify-content-center rk-search-pagination"/>
    ];
  }
}

export default IssueList;
