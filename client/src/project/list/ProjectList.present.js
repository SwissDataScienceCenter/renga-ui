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

import React, { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button, ButtonDropdown, Col, DropdownItem, DropdownMenu, DropdownToggle, Form, Input, InputGroup,
  Nav, NavItem, Row
} from "reactstrap";
import { faCheck, faSearch, faSortAmountDown, faSortAmountUp, faBars, faTh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Loader, ProjectAvatar, RenkuMarkdown, RenkuNavLink, TimeCaption, ListDisplay, MarkdownTextExcerpt
} from "../../utils/UIComponents";
import { ProjectTagList } from "../shared";
import { Url } from "../../utils/url";
import "../Project.css";
import { Label } from "reactstrap/lib";


function ProjectListRowBar(props) {
  const {
    owner, path, path_with_namespace, last_activity_at, description, avatar_url, getAvatar, tag_list
  } = props;
  const namespace = props.namespace.full_path;

  const url = Url.get(Url.pages.project, { namespace, path });
  const title = path_with_namespace || "no title";

  const descriptionMarkdown = description ?
    (
      <Fragment>
        <RenkuMarkdown markdownText={description} fixRelativePaths={false} singleLine={true} />
        <span className="ms-1">{description.includes("\n") ? " [...]" : ""}</span>
      </Fragment>
    ) :
    null;

  return (
    <Link className="d-flex flex-row rk-search-result" to={url}>
      <span className={"circle me-3 mt-2 project"}></span>
      <Col className="d-flex align-items-start flex-column col-10 overflow-hidden">
        <div className="title d-inline-block text-truncate">
          {title}
        </div>
        <div className="description text-truncate text-rk-text d-flex">
          {descriptionMarkdown}
        </div>
        <div className="tagList">
          <ProjectTagList tagList={tag_list} />
        </div>
        <div className="mt-auto">
          <TimeCaption caption="Updated" time={last_activity_at} className="text-secondary"/>
        </div>
      </Col>
      <Col className="d-flex justify-content-end align-self-center flex-shrink-0">
        <ProjectAvatar
          owner={owner}
          avatar_url={avatar_url}
          namespace={namespace}
          getAvatarFromNamespace={getAvatar}
        />
      </Col>
    </Link>
  );
}

function ProjectListRows(props) {
  const { currentPage, perPage, projects, search, totalItems, gridDisplay } = props;

  const projectItems = projects.map(project => {
    const namespace = project.namespace ? project.namespace.full_path : "";
    const path = project.path;
    const url = Url.get(Url.pages.project, { namespace, path });
    return {
      id: project.id,
      url: url,
      title: project.path_with_namespace,
      itemType: "project",
      description: project.description ?
        <Fragment>
          <MarkdownTextExcerpt markdownText={project.description} singleLine={gridDisplay ? false : true}
            charsLimit={gridDisplay ? 200 : 150} />
          <span className="ms-1">{project.description.includes("\n") ? " [...]" : ""}</span>
        </Fragment>
        : " ",
      tagList: project.tag_list,
      timeCaption: project.last_activity_at,
      mediaContent: project.avatar_url
    };
  });

  return <ListDisplay
    itemsType="project"
    search={search}
    currentPage={currentPage}
    gridDisplay={gridDisplay}
    totalItems={totalItems}
    perPage={perPage}
    items={projectItems}
  />;
}

function SearchInFilter(props) {
  const { loggedIn, params, sectionsMap, searchInMap, searchWithValues, currentSearchInObject } = props;

  // search in
  const [dropdownSearchIn, setDropdownSearchIn] = useState(false);
  const toggleDropdownSearchIn = () => setDropdownSearchIn(!dropdownSearchIn);
  if (!loggedIn)
    return null;

  const searchInItems = Object.values(searchInMap).map(v => (
    <DropdownItem key={v.value} value={v.value} onClick={() => { searchWithValues({ searchIn: v.value }); }}>
      {v.value === currentSearchInObject.value ? <FontAwesomeIcon icon={faCheck} /> : null} {v.text}
    </DropdownItem>
  ));

  return params.section === sectionsMap.all ?
    (
      <Fragment>
        <ButtonDropdown toggle={toggleDropdownSearchIn} isOpen={dropdownSearchIn}
          className="input-group-append input-group-prepend m-0">
          <DropdownToggle caret color="rk-white">
            {currentSearchInObject.text}
          </DropdownToggle>
          <DropdownMenu>
            {searchInItems}
          </DropdownMenu>
        </ButtonDropdown>
      </Fragment>
    ) :
    null;
}

function SearchOrder(props) {
  const { params, orderByMap, searchWithValues } = props;

  const orderingIcon = params.ascending ?
    faSortAmountUp :
    faSortAmountDown;
  const [dropdownOrderBy, setDropdownOrderBy] = useState(false);
  const toggleDropdownOrderBy = () => setDropdownOrderBy(!dropdownOrderBy);
  const currentOrderMapObject = Object.values(orderByMap).find(v => v.value === params.orderBy);


  const orderByItems = Object.values(orderByMap).map(v => (
    <DropdownItem key={v.value} value={v.value} onClick={() => { searchWithValues({ orderBy: v.value }); }}>
      {v.value === currentOrderMapObject.value ? <FontAwesomeIcon icon={faCheck} /> : null} {v.text}
    </DropdownItem>
  ));

  return <Fragment>
    <Col className="col-auto ms-2">
      <Label className="text-rk-text">
        Order by:&nbsp;
      </Label>
      <Fragment>
        <ButtonDropdown toggle={toggleDropdownOrderBy} isOpen={dropdownOrderBy}>
          <DropdownToggle caret color="rk-light" >
            {currentOrderMapObject.text}
          </DropdownToggle>
          <DropdownMenu>
            {orderByItems}
          </DropdownMenu>
        </ButtonDropdown>
      </Fragment>
    </Col>
    <Col className="col-auto">
      <Button color="rk-white" onClick={() => { searchWithValues({ ascending: !params.ascending }); }}>
        <FontAwesomeIcon icon={orderingIcon} />
      </Button>
    </Col>
  </Fragment>;
}

function ProjectListSearch(props) {
  const { loggedIn, orderByMap, params, search, searchInMap, sectionsMap, gridDisplay, setGridDisplay } = props;

  // input and search
  const [userInput, setUserInput] = useState(params.query.toString());

  const searchWithValues = (modifiedParams) => {
    let newParams = modifiedParams || {};
    if (params.query.toString() !== userInput.toString())
      newParams.query = userInput.toString();
    search(newParams);
  };
  useEffect(() => {
    // reset input on relevant changes.
    setUserInput(params.query);
    // ? on `query` because it can come from the an outside component (e.g. the QuickNav search)
    // ? on `page` because the user could modify the search and change page without searching first
  }, [params.query, params.page]);

  const currentSearchInObject = Object.values(searchInMap).find(v => v.value === params.searchIn);

  const navBar = props.loggedIn ?
    (<ProjectListNav key="navbar" getPreciseUrl={props.getPreciseUrl} sectionsMap={props.sectionsMap} />) :
    null;

  const navBarJustify = props.loggedIn ?
    "row row-cols-lg-auto justify-content-lg-end justify-content-md-center g-1 pb-2"
    : "row row-cols-lg-auto justify-content-start g-1 pb-2";

  return (
    <Row className="justify-content-lg-between justify-content-md-center pb-2">
      {navBar}
      <Col md={12} lg={7} className="pb-2">
        <Form inline onSubmit={e => { e.preventDefault(); searchWithValues(); }}
          className={navBarJustify}
          size="sm">
          <Col className="col-auto">
            <InputGroup>
              <Input name="searchQuery" id="searchQuery"
                className="border-light text-rk-text"
                placeholder={"Search... "} value={userInput}
                onChange={e => setUserInput(e.target.value.toString())} />
              <SearchInFilter loggedIn={loggedIn} params={params} sectionsMap={sectionsMap} searchInMap={searchInMap}
                searchWithValues={searchWithValues} currentSearchInObject={currentSearchInObject} />
            </InputGroup>
          </Col>
          <SearchOrder params={params} orderByMap={orderByMap} searchWithValues={searchWithValues} />
          <Col className="col-auto">
            <Button color="rk-white" id="searchButton" onClick={() => searchWithValues()}>
              <FontAwesomeIcon icon={faSearch} />
            </Button>
          </Col>
          <Col className="col-auto">
            <Button color="rk-white" id="displayButton" onClick={() => setGridDisplay(!gridDisplay)}>
              {
                gridDisplay ?
                  <FontAwesomeIcon icon={faBars} /> :
                  <FontAwesomeIcon icon={faTh} />
              }
            </Button>
          </Col>
        </Form>
      </Col>
    </Row>
  );
}

function ProjectListUsersFilter(props) {
  const { users, setTarget, target } = props;

  let usersList = null;
  if (users.list && users.list.length) {
    usersList = users.list.map(u => {
      const identifier = u.full_path ?
        encodeURIComponent(u.full_path) :
        u.username;
      const active = target === identifier ?
        true :
        false;
      return (
        <Button key={u.id} className="mb-1 me-1 d-inline-block" color="rk-white" size="sm"
          onClick={() => { setTarget(identifier); }} active={active} >
          { u.name}
          <small className="font-italic d-none d-sm-block">{decodeURIComponent(identifier)}</small>
        </Button>
      );
    });
  }

  const list = usersList ?
    (<Col className="d-flex flex-col flex-wrap justify-content-center justify-content-lg-start rk-button-group">
      {usersList}
    </Col>
    ) :
    null;

  return (list);
}

function verifyRules(params, searchInMap, sectionsMap) {
  if (params.searchIn === searchInMap.projects.value || !params.searchIn) {
    if (params.query && params.query.length < 3)
      return "You can either leave the filter empty to browse all projects or enter at least 3 characters to filter.";
  }
  else {
    if (!params.query || params.query.length < 3)
      return `Filtering by ${params.searchIn.toLowerCase()} requires a filter of minimum 3 characters.`;
  }
}

function ProjectListContent(props) {
  const {
    fetched, fetching, getAvatar, loggedIn, orderByMap, params, projects, search, searchInMap, sectionsMap,
    setTarget, users, target, totalProjects
  } = props;

  const [gridDisplay, setGridDisplay] = useState(true);

  let usersFilter = null;
  if (params.searchIn !== searchInMap.projects.value) {
    if (users.fetching)
      usersFilter = (<Loader />);
    else if (users.fetched)
      usersFilter = (<ProjectListUsersFilter users={users} setTarget={setTarget} target={target} />);
  }

  let content = null;
  // don't show anything if users are updating, since the content would be outdated
  if (!users.fetching) {
    if (fetching) {
      content = (<Loader />);
    }
    else if (!fetched) {
      content = (<p>Please enter text in the field above and click on Search to see the results.</p>);
    }
    else {
      const notAllowed = verifyRules(params, searchInMap, sectionsMap);
      if (notAllowed) {
        content = (<p>{notAllowed}</p>);
      }
      else {
        content = (
          <ProjectListRows
            currentPage={params.page || 1}
            perPage={params.perPage}
            getAvatar={getAvatar}
            projects={projects}
            search={search}
            totalItems={totalProjects}
            gridDisplay={gridDisplay}
          />
        );
      }
    }
  }

  return (
    <div>
      <div className="pb-4 rk-search-bar">
        <ProjectListSearch
          loggedIn={loggedIn}
          orderByMap={orderByMap}
          params={params}
          search={search}
          searchInMap={searchInMap}
          sectionsMap={sectionsMap}
          getPreciseUrl={props.getPreciseUrl}
          gridDisplay={gridDisplay}
          setGridDisplay={setGridDisplay}
        />
        {usersFilter}
      </div>
      {content}
    </div>
  );
}

function ProjectListNav(props) {
  const { getPreciseUrl, sectionsMap } = props;
  return (
    <Col className="d-flex pb-2 mb-1 justify-content-evenly justify-content-lg-between" md={12} lg={5}>
      <Nav pills className="nav-pills-underline" size="sm">
        <NavItem>
          <RenkuNavLink title="Your Projects" id="link-projects-your" className="pb-2"
            to={getPreciseUrl(sectionsMap.own)} noSubPath={true} />
        </NavItem>
        <NavItem>
          <RenkuNavLink title="Starred Projects" id="link-projects-starred" className="pb-2"
            to={getPreciseUrl(sectionsMap.starred)} exact={false} />
        </NavItem>
        <NavItem>
          <RenkuNavLink title="All Projects" id="link-projects-all" className="pb-2"
            to={getPreciseUrl(sectionsMap.all)} exact={false} />
        </NavItem>
      </Nav>
    </Col>
  );
}

function ProjectList(props) {
  const {
    fetched, fetching, getAvatar, loggedIn, orderByMap, params, projectNew, projects, search, searchInMap,
    sectionsMap, setTarget, users, target, totalProjects
  } = props;

  const newProjectButton = loggedIn ?
    (<div>
      <Link className="btn btn-secondary" role="button" to={projectNew}>
        <span className="arrow-right">  </span>
        New project
      </Link></div>) :
    null;
  return (
    <Fragment>
      <Row className="pt-2 pb-3">
        <Col className="d-flex mb-2 justify-content-between">
          <h2>Renku Projects</h2>
          {newProjectButton}
        </Col>
      </Row>
      <ProjectListContent
        fetching={fetching}
        fetched={fetched}
        getAvatar={getAvatar}
        loggedIn={loggedIn}
        orderByMap={orderByMap}
        params={params}
        projects={projects}
        search={search}
        searchInMap={searchInMap}
        sectionsMap={sectionsMap}
        setTarget={setTarget}
        users={users}
        target={target}
        totalProjects={totalProjects}
        getPreciseUrl={props.getPreciseUrl}
      />
    </Fragment>
  );
}


export default ProjectList;
export { ProjectListRowBar as ProjectListRow, ProjectList };
