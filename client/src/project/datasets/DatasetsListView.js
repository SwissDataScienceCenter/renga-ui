import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Row, Col } from "reactstrap";
import { ACCESS_LEVELS } from "../../api-client";
import "../filestreeview/treeviewstyle.css";
import { Loader, MarkdownTextExcerpt, TimeCaption } from "../../utils/UIComponents";
import { SpecialPropVal } from "../../model";

function DatasetListRow(props) {
  const dataset = props.dataset;

  return <Link className="d-flex flex-row rk-search-result"
    to={`${props.datasetsUrl}/${encodeURIComponent(dataset.name)}/`}>
    <span className={"circle me-3 mt-2 dataset"}></span>
    <Col className="d-flex align-items-start flex-column col-9 overflow-hidden">
      <div className="title d-inline-block text-truncate">
        {dataset.title || dataset.name}
      </div>
      <div className="creators text-truncate text-rk-text">
        {
          dataset.creators !== undefined ?
            <small style={{ display: "block" }} className="font-weight-light">
              {dataset.creators.slice(0, 3).map((creator) => creator.name).join(", ")}
              {dataset.creators.length > 3 ? ", et al." : null}
            </small>
            : null
        }
      </div>
      <div className="description text-truncate text-rk-text">
        {
          dataset.description !== undefined && dataset.description !== null ?
            <div className="datasetDescriptionText font-weight-normal">
              <MarkdownTextExcerpt markdownText={dataset.description} charsLimit={500} />
            </div>
            : null
        }
      </div>
      <div className="mt-auto">
        {
          dataset.created_at !== undefined && dataset.created_at !== null ?
            <TimeCaption caption="Created"
              time={new Date(dataset.created_at.replace(/ /g, "T"))} className="text-secondary"/>
            : null
        }
      </div>
    </Col>
    <Col className="d-flex justify-content-end flex-shrink-0">
      <span className="text-secondary">
        <small>
          {props.dataset_kg !== undefined && props.graphStatus === true ?
            "In the Knowledge Graph"
            : "Not in the Knowledge Graph"}
        </small>
      </span>
    </Col>
  </Link>;
}

function AddDatasetButton(props) {
  if (props.visibility.accessLevel >= ACCESS_LEVELS.MAINTAINER) {
    return <div>
      <Link className="btn btn-sm btn-secondary" role="button" to={props.newDatasetUrl}>
        <span className="arrow-right pt-2 pb-2">  </span>
        Add Dataset
      </Link>
    </div>;
  }
  return null;
}

export default function DatasetsListView(props) {

  const datasets = useMemo(()=>props.datasets, [props.datasets]);

  if (props.datasets_kg === SpecialPropVal.UPDATING)
    return <Loader />;

  return [ <Row key="header" className="pt-2 pb-3">
    <Col className="d-flex mb-2 justify-content-between">
      <h3 className="me-4">Datasets List</h3>
      <AddDatasetButton
        visibility={props.visibility}
        newDatasetUrl={props.newDatasetUrl} />
    </Col>
  </Row>
  , <Row key="datasetsList">
    <Col xs={12}>
      {
        datasets !== undefined ?
          datasets.map((dataset)=>
            <DatasetListRow
              key={"dataset-" + dataset.name}
              dataset={dataset}
              dataset_kg={props.datasets_kg
                ? props.datasets_kg.find(dataset_kg => dataset_kg.name === dataset.name) : undefined}
              graphStatus={props.graphStatus}
              datasetsUrl={props.datasetsUrl} />
          )
          : <Loader />
      }
    </Col>
  </Row>
  ];

}
