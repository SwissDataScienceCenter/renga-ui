
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Badge } from "reactstrap";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TimeCaption, Pagination, Loader } from "../../utils/UIComponents";
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
    timeCaption = <TimeCaption caption="Closed" time={mr.closed_at} className="text-secondary"/>;
  }
  else if (status === itemsStateMap.MERGED) {
    badgeText = "Merged";
    badgeColor = "success";
    timeCaption = <TimeCaption caption="Merged" time={mr.merged_at} className="text-secondary"/>;
  }
  else {
    badgeText = mr.merge_status === "can_be_merged" ? "Can be merged" : "Conflicts";
    badgeColor = mr.merge_status === "can_be_merged" ? "success" : "danger";
    timeCaption = <TimeCaption caption="Updated" time={mr.updated_at} className="text-secondary"/>;
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

    return <Link className="d-flex flex-row rk-search-result rk-search-result-100" to={this.props.mrUrl}>
      <span className={"circle me-3 mt-2 collaboration"}></span>
      <Col className="d-flex align-items-start flex-column col-9 overflow-hidden">
        <div className="title d-inline-block text-truncate">
          {this.props.title}
        </div>
        <div className="description text-truncate text-rk-text">
          <span className="issues-description pe-2">
            <div>
              <Badge color="rk-text">{this.props.target_branch}</Badge>
              <FontAwesomeIcon icon={faLeftArrow} className="me-1 ms-1"/>
              <Badge color="rk-text">{this.props.source_branch}</Badge>
            </div>
          </span>
        </div>
        <div className="mt-auto">
          {timeCaption}
        </div>
      </Col>
      <Col className="d-flex justify-content-end flex-shrink-0">
        <span>
          <FontAwesomeIcon icon={faComments} /> {this.props.user_notes_count} {statusBadge}
        </span>
      </Col>
    </Link>;
  }
}


class MergeRequestList extends Component {
  render() {
    const { items } = this.props;

    const rows = items.length > 0 ? items.map((d, i) => {
      const mrUrl = `${this.props.mergeRequestsOverviewUrl}/${d.iid}/changes`;
      return <MergeRequestListRow key={i} {...d} mrUrl={mrUrl} />;
    })
      : <Row>
        <Col sm={8} md={8}>
          No merge requests to display.
        </Col>
      </Row>;

    return [
      <Row key="header" className="pt-2 pb-3">
        <Col className="d-flex mb-2 justify-content-between">
          <h3 className="me-4">Merge Requests List</h3>
        </Col>
      </Row>,
      <Row key="mergeRequests"><Col xs={12}>
        {this.props.loading ?
          <Loader /> :
          <div className="mb-4">{rows}</div>
        }
      </Col></Row>,
      <Pagination key="pagination" {...this.props}
        className="d-flex justify-content-center rk-search-pagination"/>
    ];
  }
}

export default MergeRequestList;
export { mergeRequestRowInfo };
