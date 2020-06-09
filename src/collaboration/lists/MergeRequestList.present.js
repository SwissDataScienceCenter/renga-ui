
import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import { Row, Col, Badge, ListGroup, ListGroupItem, Nav, NavItem, NavLink as ReactNavLink } from "reactstrap";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UserAvatar, TimeCaption, Pagination, Loader } from "../../utils/UIComponents";
import { itemsStateMap } from "./CollaborationList.container";
import { faLongArrowAltLeft as faLeftArrow } from "@fortawesome/free-solid-svg-icons";


/**
 * Extract the display info from a merge request object.
 * @param {object} mr the merge request
 * @returns {object} the display information
 */
function mergeRequestRowInfo(mr) {
  const status = (mr.closed_at !== null) ?
    itemsStateMap.CLOSED :
    (mr.merged_at !== null) ?
      itemsStateMap.MERGED :
      itemsStateMap.OPENED;
  let badgeText = "", badgeColor = "", timeCaption = null;
  if (status === itemsStateMap.CLOSED) {
    badgeText = "Closed";
    badgeColor = "success";
    timeCaption = <TimeCaption caption="Closed" time={mr.closed_at} />;
  }
  else if (status === itemsStateMap.MERGED) {
    badgeText = "Merged";
    badgeColor = "success";
    timeCaption = <TimeCaption caption="Merged" time={mr.merged_at} />;
  }
  else {
    badgeText = mr.merge_status === "can_be_merged" ? "Can be merged" : "Conflicts";
    badgeColor = mr.merge_status === "can_be_merged" ? "success" : "danger";
    timeCaption = <TimeCaption caption="Updated" time={mr.updated_at} />;
  }

  return {
    badgeText, badgeColor, timeCaption
  };
}

class MergeRequestListRow extends Component {
  render() {
    const rowInfo = mergeRequestRowInfo(this.props);
    const { badgeText, badgeColor, timeCaption } = rowInfo;
    const statusBadge = <Badge color={badgeColor}>{badgeText}</Badge>;

    const title = this.props.active ?
      this.props.title :
      <NavLink activeClassName="selected-issue" to={this.props.mrUrl}>{this.props.title}</NavLink>;

    return <ListGroupItem action className="pr-0 pl-0 pt-1 pb-1" style={{ border: "none" }}>
      <Row>
        <Col sm={8} md={8}>
          <div className="d-flex project-list-row mb-3">
            <div className="mr-2">
              <UserAvatar size="lg" person={this.props.author} />
            </div>
            <div className="issue-text-crop">
              <b>
                <span className="issue-title">
                  {title}
                </span>
              </b><br />
              <span className="issues-description">
                <div>
                  <Badge color="light">{this.props.target_branch}</Badge> <FontAwesomeIcon icon={faLeftArrow} />
                  <Badge color="light">{this.props.source_branch}</Badge> &nbsp;&nbsp;</div>
              </span>
            </div>
          </div>
        </Col>
        <Col sm={4} md={4} className="float-right" style={{ textAlign: "end" }}>
          <FontAwesomeIcon icon={faComments} /> {this.props.user_notes_count} {statusBadge}
          <br />
          <small>{timeCaption}</small>
        </Col>
      </Row>
    </ListGroupItem>;
  }
}


class MergeRequestList extends Component {
  render() {
    const { items, itemsState } = this.props;

    const rows = items.length > 0 ? items.map((d, i) => {
      const mrUrl = `${this.props.mergeRequestsOverviewUrl}/${d.iid}/changes`;
      return <MergeRequestListRow key={i} {...d} mrUrl={mrUrl} />;
    })
      : <ListGroupItem style={{ border: "none" }}>
        <Row>
          <Col sm={8} md={8}>
            No merge requests to display.
          </Col>
        </Row>
      </ListGroupItem>;

    return [
      <Row key="header" className="pb-3">
        <Col sm={8}>
          <h2>Merge Requests
          </h2>
        </Col>
      </Row>,
      <Row key="nav">
        <Col xs={12} className="pb-2">
          <Nav tabs>
            <NavItem>
              <ReactNavLink
                to="mergerequests?page=1&itemsState=opened"
                isActive={() => itemsState === itemsStateMap.OPENED}
                tag={NavLink}
              >Open</ReactNavLink>
            </NavItem>
            <NavItem>
              <ReactNavLink
                to="mergerequests?page=1&itemsState=merged"
                tag={NavLink}
                isActive={() => itemsState === itemsStateMap.MERGED}
              >Merged</ReactNavLink>
            </NavItem>
            <NavItem>
              <ReactNavLink
                to="mergerequests?page=1&itemsState=closed"
                tag={NavLink}
                isActive={() => itemsState === itemsStateMap.CLOSED}
              >Complete</ReactNavLink>
            </NavItem>
          </Nav>
        </Col>
      </Row>,
      <Row key="mergeRequests"><Col xs={12}>
        {this.props.loading ?
          <Loader /> :
          <ListGroup>{rows}</ListGroup>
        }
      </Col></Row>,
      <Pagination key="pagination" {...this.props} />
    ];
  }
}

export default MergeRequestList;
export { mergeRequestRowInfo };
