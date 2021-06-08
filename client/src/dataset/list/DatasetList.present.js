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

import React, { Component, Fragment } from "react";
import { Route, Switch } from "react-router-dom";
import { Row, Col, Alert, Card, CardBody } from "reactstrap";
import { Button, Form, FormText, Input, Label, InputGroup, UncontrolledCollapse } from "reactstrap";
import { DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import { MarkdownTextExcerpt, ListDisplay } from "../../utils/UIComponents";
import { faCheck, faSortAmountUp, faSortAmountDown, faSearch, faBars, faTh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonDropdown } from "reactstrap/lib";


function OrderByDropdown(props) {
  return <Fragment>
    <Col className="col-auto ms-2">
      <Label className="text-rk-text">
        Order by:&nbsp;
      </Label>
      <Fragment>
        <ButtonDropdown
          toggle={props.handlers.onOrderByDropdownToggle}
          isOpen={props.orderByDropdownOpen}>
          <DropdownToggle caret color="rk-light">
            {props.orderByLabel}
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem value={props.orderByValuesMap.TITLE}
              onClick={props.handlers.changeSearchDropdownOrder}>
              {props.orderBy === props.orderByValuesMap.TITLE ?
                <FontAwesomeIcon icon={faCheck} /> : null} Title
            </DropdownItem>
            <DropdownItem value={props.orderByValuesMap.DATE}
              onClick={props.handlers.changeSearchDropdownOrder}>
              {props.orderBy === props.orderByValuesMap.DATE ?
                <FontAwesomeIcon icon={faCheck} /> : null} Date
            </DropdownItem>
            <DropdownItem value={props.orderByValuesMap.PROJECTSCOUNT}
              onClick={props.handlers.changeSearchDropdownOrder}>
              {props.orderBy === props.orderByValuesMap.PROJECTSCOUNT ?
                <FontAwesomeIcon icon={faCheck} /> : null} Projects Count
            </DropdownItem>
          </DropdownMenu>
        </ButtonDropdown>
      </Fragment>
    </Col>
    <Col className="col-auto">
      <Button color="rk-white" onClick={props.handlers.toggleSearchSorting}>
        {props.orderSearchAsc ?
          <FontAwesomeIcon icon={faSortAmountUp} /> :
          <FontAwesomeIcon icon={faSortAmountDown} />
        }
      </Button>
    </Col>
  </Fragment>;
}

class DatasetSearchForm extends Component {

  render() {
    return <Row className="justify-content-lg-between justify-content-md-center pb-2">
      <Col md={12} className="pb-2">
        <Form key="form" inline onSubmit={this.props.handlers.onSearchSubmit}
          className="row row-cols-lg-auto justify-content-start g-1 pb-2">
          <Col className="col-auto w-25 d-inline-block">
            <InputGroup>
              <Input type="text"
                name="searchQuery"
                id="searchQuery"
                placeholder={"Search... "}
                value={decodeURIComponent(this.props.searchQuery) || ""}
                onChange={this.props.handlers.onSearchQueryChange}
                className="border-light text-rk-text" />
              <Label for="searchQuery" hidden>Query</Label>
            </InputGroup>
          </Col>
          <OrderByDropdown
            handlers={this.props.handlers}
            orderByDropdownOpen={this.props.orderByDropdownOpen}
            orderByLabel={this.props.orderByLabel}
            orderByValuesMap={this.props.orderByValuesMap}
            orderBy={this.props.orderBy}
            orderSearchAsc={this.props.orderSearchAsc}
          />
          <Col className="col-auto">
            <Button color="rk-white" id="searchButton" onClick={this.props.handlers.onSearchSubmit}>
              <FontAwesomeIcon icon={faSearch} />
            </Button>
          </Col>
          <Col className="col-auto">
            <Button color="rk-white" id="displayButton"
              onClick={() => this.props.onGridDisplayToggle()}>
              {
                this.props.gridDisplay ?
                  <FontAwesomeIcon icon={faBars} /> :
                  <FontAwesomeIcon icon={faTh} />
              }
            </Button>
          </Col>
        </Form>
        <Col sm={12}>
          <FormText key="help" color="rk-text">
            {this.props.errorMessage} If you are not finding what you are looking
            for, <Button className="p-0 mb-1" color="link" id="toggler">
              <small>click here for help.</small>
            </Button>
          </FormText>
          <UncontrolledCollapse key="searchHelp" toggler="#toggler" className="pt-2">
            <Card>
              <CardBody>
                <small className="text-rk-text">
                  <p>
                    A wildcard can be used to broaden your search: &apos;*&apos; for any number of
                    characters or &apos;?&apos; for one character.
                    Quotation marks can be used to make your search more specific. <br />
                  </p>
                  Examples:<br />
                  - &quot;ren*&quot; will match any word starting with &quot;ren&quot;,
                  like <i>renku</i> and <i>renga</i><br />
                  - &quot;*ku&quot; will match any word that ends with &quot;ku&quot;,
                  like <i>renku</i> and <i>haiku</i><br />
                  - &quot;re*ku&quot; will match any word that ends with &quot;re&quot; and ends with &quot;ku&quot;,
                  like <i>renku</i> and <i>relotsofstuffku</i><br />
                  - &quot;re?ku&quot; will match any five-letter word that starts with re and ends with u.,
                  like <i>renku</i> and <i>renzu</i><br />
                  - &quot;reku~2&quot; will perform a fuzzy search and match any word with up
                  to 2 changes to the string &quot;reku&quot;,
                  like <i>renku</i> and <i>akku</i><br />
                  - Quotation marks around a phrase will match a specific phrase, like &quot;renku
                  reproducibility&quot;.<br />
                </small>
              </CardBody>
            </Card>
          </UncontrolledCollapse>
        </Col>
      </Col>
    </Row>;
  }
}

class DatasetsRows extends Component {
  render() {
    const datasets = this.props.datasets || [];
    const datasetsUrl = this.props.datasetsUrl;

    const { currentPage, perPage, search, totalItems, gridDisplay } = this.props;

    const datasetItems = datasets.map(dataset => {
      const projectsCount = dataset.projectsCount > 1
        ? `In ${dataset.projectsCount} projects`
        : `In ${dataset.projectsCount} project`;

      return {
        id: dataset.identifier,
        itemType: "dataset",
        url: `${datasetsUrl}/${encodeURIComponent(dataset.identifier)}`,
        title: dataset.title || dataset.name,
        description: dataset.description !== undefined && dataset.description !== null ?
          <Fragment>
            <MarkdownTextExcerpt markdownText={dataset.description} singleLine={gridDisplay ? false : true}
              charsLimit={gridDisplay ? 200 : 100} />
            <span className="ms-1">{dataset.description.includes("\n") ? " [...]" : ""}</span>
          </Fragment>
          : null,
        timeCaption: new Date(dataset.date),
        labelCaption: projectsCount + ". Created",
        creators: dataset.published !== undefined && dataset.published.creator !== undefined ?
          dataset.published.creator : null,
      };
    });

    return <ListDisplay
      itemsType="dataset"
      search={search}
      currentPage={currentPage}
      gridDisplay={gridDisplay}
      totalItems={totalItems}
      perPage={perPage}
      items={datasetItems}
    />;

  }
}


function DatasetsSearch(props) {

  const loading = props.loading || false;

  return [
    <div key="form">
      {
        (props.loggedOutMessage !== undefined) ?
          <Col bg={6} md={8} sm={12} ><span>{props.loggedOutMessage}</span><br /><br /></Col>
          :
          <span></span>
      }
      <div className="pb-2 rk-search-bar">
        <DatasetSearchForm
          searchQuery={props.searchQuery}
          handlers={props.handlers}
          errorMessage={props.errorMessage}
          orderByValuesMap={props.orderByValuesMap}
          orderBy={props.orderBy}
          orderByDropdownOpen={props.orderByDropdownOpen}
          orderSearchAsc={props.orderSearchAsc}
          orderByLabel={props.orderByLabel}
          gridDisplay={props.gridDisplay}
          onGridDisplayToggle={props.onGridDisplayToggle}
        />
      </div>
    </div>,
    <DatasetsRows
      key="datasets"
      datasets={props.datasets}
      loading={loading}
      currentPage={props.currentPage}
      totalItems={props.totalItems}
      perPage={props.perPage}
      search={props.onPageChange}
      gridDisplay={props.gridDisplay}
      datasetsUrl={props.urlMap.datasetsUrl}
    />
  ];

}

class NotFoundInsideDataset extends Component {
  render() {
    return <Col key="notFound">
      <Row>
        <Col xs={12} md={12}>
          <Alert color="primary">
            <h4>404 - Page not found</h4>
            The URL
            <strong> {this.props.location.pathname.replace(this.props.match.url, "")} </strong>
            is not a sub-path of <strong>/datasets</strong>. You can navigate through renku datasets
            using the tabs on top.
          </Alert>
        </Col>
      </Row>
    </Col>;
  }
}

function DatasetList(props) {

  const urlMap = props.urlMap;

  return <Fragment>
    <Row className="pt-2 pb-3">
      <Col className="d-flex mb-2">
        <h2 className="me-4">Renku Datasets</h2>
      </Col>
    </Row>
    <Switch>
      <Route exact path={urlMap.datasetsUrl}
        render={p => <DatasetsSearch {...props} />} />
      <Route component={NotFoundInsideDataset} />
    </Switch>
  </Fragment>;
}

export default DatasetList;
