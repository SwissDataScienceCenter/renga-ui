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

/**
 *  renku-ui
 *
 *  landing/NavBar.js
 *  NavBar for logged-in and logged-out users.
 */

import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";
import {
  UncontrolledDropdown, DropdownItem, Navbar, Nav, NavbarBrand,
  NavbarToggler, Collapse, NavItem, DropdownToggle, DropdownMenu
} from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faBars } from "@fortawesome/free-solid-svg-icons";
import { faQuestionCircle, faUser } from "@fortawesome/free-regular-svg-icons";
import { faGitlab } from "@fortawesome/free-brands-svg-icons";

import logo from "./logo.svg";
import { ExternalDocsLink, ExternalLink, Loader, RenkuNavLink, UserAvatar } from "../utils/UIComponents";
import { getActiveProjectPathWithNamespace, gitLabUrlFromProfileUrl } from "../utils/HelperFunctions";
import QuickNav from "../utils/quicknav";
import { Url } from "../utils/url";
import { NotificationsMenu } from "../notifications";
import { LoginHelper } from "../authentication";
import "./NavBar.css";


class RenkuNavBar extends Component {
  render() {
    const { user } = this.props;
    const userAvatar = <UserAvatar person={user.data} size="sm" />;

    return (user.logged) ?
      <LoggedInNavBar {...this.props} userAvatar={userAvatar} /> :
      <AnonymousNavBar {...this.props} userAvatar={userAvatar} />;
  }
}

function gitLabSettingsUrlFromProfileUrl(webUrl) {
  // Yes, the settings URL ends with 'profile'; the profile URL ends with the username
  const comps = webUrl.split("/");
  comps.pop();
  comps.push("profile");
  return comps.join("/");
}

class RenkuToolbarItemUser extends Component {
  render() {
    const { location, user } = this.props;
    const gatewayURL = this.props.params.GATEWAY_URL;
    const redirect_url = encodeURIComponent(this.props.params.BASE_URL);
    if (!user.fetched) {
      return <Loader size="16" inline="true" />;
    }
    else if (!user.logged) {
      const to = Url.get(Url.pages.login.link, { pathname: location.pathname });
      return (<RenkuNavLink to={to} title="Login" />);
    }

    return <UncontrolledDropdown className="nav-item dropdown">
      <Fragment>
        <DropdownToggle className="nav-link" nav caret id="profile-dropdown">
          <FontAwesomeIcon icon={faUser} id="userIcon" />
        </DropdownToggle>
        <DropdownMenu className="user-menu" end key="user-bar" aria-labelledby="user-menu">
          <ExternalLink url={`${gatewayURL}/auth/user-profile`}
            title="Account" className="dropdown-item" role="link" />
          <DropdownItem divider />
          <a id="logout-link" className="dropdown-item" onClick={() => { LoginHelper.notifyLogout(); }}
            href={`${gatewayURL}/auth/logout?redirect_url=${redirect_url}`}>Logout</a>
        </DropdownMenu>
      </Fragment>
    </UncontrolledDropdown>;
  }
}

class RenkuToolbarItemPlus extends Component {
  render() {
    // Display the Issue/Notebook server related header options only if a project is active.
    const activeProjectPathWithNamespace = getActiveProjectPathWithNamespace(this.props.currentPath);
    const issueDropdown = activeProjectPathWithNamespace ?
      <Link className="dropdown-item"
        to={`/projects/${activeProjectPathWithNamespace}/collaboration/issues/issue_new`}>
        Issue
      </Link>
      : null;
    const datasetDropdown = activeProjectPathWithNamespace ?
      <Link className="dropdown-item" to={`/projects/${activeProjectPathWithNamespace}/datasets/new`}>
        Dataset
      </Link>
      : null;
    const projectDropdown = <Link className="dropdown-item" id="navbar-project-new" to="/projects/new">
      Project
    </Link>;

    return <UncontrolledDropdown className="nav-item dropdown">
      <Fragment>
        <DropdownToggle className="nav-link" nav caret id="plus-dropdown">
          <FontAwesomeIcon icon={faPlus} id="createPlus" />
        </DropdownToggle>
        <DropdownMenu className="plus-menu" end key="plus-bar" aria-labelledby="plus-menu">
          {projectDropdown}
          {issueDropdown}
          {datasetDropdown}
        </DropdownMenu>
      </Fragment>
    </UncontrolledDropdown>;
  }
}

function RenkuToolbarHelpMenu(props) {

  return <UncontrolledDropdown className="nav-item dropdown">
    <Fragment>
      <DropdownToggle className="nav-link" nav caret>
        <FontAwesomeIcon icon={faQuestionCircle} id="helpDropdownToggle" />
      </DropdownToggle>
      <DropdownMenu className="help-menu" key="help-bar" aria-labelledby="help-menu">
        <Link className="dropdown-item" to="/help">Help</Link>
        <DropdownItem divider />
        <ExternalDocsLink url="https://renku.readthedocs.io/en/latest/"
          title="Renku Docs" className="dropdown-item" />
        <ExternalDocsLink url="https://renku-python.readthedocs.io/en/latest/"
          title="Renku CLI Docs" className="dropdown-item" />
        <DropdownItem divider />
        <ExternalDocsLink url="https://renku.discourse.group" title="Forum" className="dropdown-item" />
        <ExternalDocsLink url="https://gitter.im/SwissDataScienceCenter/renku"
          title="Gitter" className="dropdown-item" />
        <ExternalDocsLink url="https://github.com/SwissDataScienceCenter/renku"
          title="GitHub" className="dropdown-item" />
      </DropdownMenu>
    </Fragment>
  </UncontrolledDropdown>;
}

function RenkuToolbarGitLabMenu(props) {
  const user = props.user;
  if (!user.fetched)
    return "";

  else if (!user.data.id)
    return "";

  const gitLabUrl = gitLabUrlFromProfileUrl(user.data.web_url);

  return <UncontrolledDropdown className="nav-item dropdown">
    <Fragment>
      <DropdownToggle className="nav-link" nav caret id="gitLab-menu">
        <FontAwesomeIcon icon={faGitlab} id="gitLabDropdownToggle" />
      </DropdownToggle>
      <DropdownMenu className="gitLab-menu" end key="gitLab-bar" aria-labelledby="gitLab-menu">
        <ExternalLink url={gitLabUrl}
          title="GitLab" className="dropdown-item" role="link" />
        <ExternalLink url={gitLabSettingsUrlFromProfileUrl(user.data.web_url)}
          title="Settings" className="dropdown-item" role="link" />
        <ExternalLink url={user.data.web_url} title="Profile" className="dropdown-item" role="link" />
      </DropdownMenu>
    </Fragment>
  </UncontrolledDropdown>;
}

function RenkuToolbarNotifications(props) {
  if (!props.notifications)
    return null;

  return (
    <UncontrolledDropdown className="nav-item dropdown">
      <NotificationsMenu {...props} />
    </UncontrolledDropdown>
  );
}

class LoggedInNavBar extends Component {

  constructor(props) {
    super(props);
    this.onSelect = this.handleSelect.bind(this);
    this.toggle = this.toggle.bind(this);
    this.state = {
      isOpen: true
    };
  }

  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  handleSelect(eventKey, event) {
    let nextRoute = null;
    switch (eventKey) {
      case "new.projects":
        nextRoute = "/projects";
        break;
      default:
        break;
    }
    if (null != nextRoute) this.props.history.push(nextRoute);
  }
  render() {
    return (
      <header className="navbar navbar-expand-lg navbar-dark rk-navbar p-0">
        <Navbar color="primary" className="container-fluid flex-wrap flex-lg-nowrap pb-3 renku-container">
          <NavbarBrand href="/" className="navbar-brand me-2 pb-0 pt-0">
            <img src={logo} alt="Renku" height="50" className="d-block" />
          </NavbarBrand>
          <NavbarToggler onClick={this.toggle} className="border-0">
            <FontAwesomeIcon icon={faBars} id="userIcon" color="white" />
          </NavbarToggler>
          <Collapse isOpen={!this.state.isOpen} navbar>
            <Nav className="navbar-nav flex-row flex-wrap ms-lg-auto">
              <NavItem className="nav-item col-12 col-lg-auto pe-0 pe-lg-4 my-2 my-lg-0">
                <QuickNav client={this.props.client} model={this.props.model} user={this.props.user} />
              </NavItem>
              <NavItem className="nav-item col-4 col-lg-auto">
                <RenkuNavLink to="/projects" alternate={["/projects/all", "/projects/starred"]}
                  title="Projects" id="link-projects" className="link-secondary" />
              </NavItem>
              <NavItem className="nav-item col-4 col-lg-auto">
                <RenkuNavLink to="/datasets" title="Datasets" id="link-datasets" />
              </NavItem>
              <NavItem className="nav-item col-4 col-lg-auto pe-4">
                <RenkuNavLink to="/sessions" title="Sessions" id="link-sessions" />
              </NavItem>
              <NavItem className="nav-item col-1 col-lg-auto">
                <RenkuToolbarItemPlus currentPath={this.props.location.pathname} />
              </NavItem>
              <NavItem className="nav-item col-1 col-lg-auto">
                <RenkuToolbarGitLabMenu user={this.props.user} />
              </NavItem>
              <NavItem className="nav-item col-1 col-lg-auto">
                <RenkuToolbarHelpMenu />
              </NavItem>
              <NavItem className="nav-item col-1 col-lg-auto">
                <RenkuToolbarNotifications {...this.props} />
              </NavItem>
              <NavItem className="nav-item col-1 col-lg-auto">
                <RenkuToolbarItemUser {...this.props} />
              </NavItem>
            </Nav>
          </Collapse>
        </Navbar>
      </header>
    );
  }
}

class AnonymousNavBar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isOpen: true
    };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  render() {
    return (
      <header className="navbar navbar-expand-lg navbar-dark rk-navbar p-0">
        <Navbar color="primary" className="container-fluid flex-wrap flex-lg-nowrap renku-container">
          <NavbarBrand href="/" className="navbar-brand me-2 pb-0 pt-0">
            <img src={logo} alt="Renku" height="68" className="d-block my-1" />
          </NavbarBrand>
          <NavbarToggler onClick={this.toggle} className="border-0 mt-3">
            <FontAwesomeIcon icon={faBars} id="userIcon" color="white" />
          </NavbarToggler>
          <Collapse isOpen={!this.state.isOpen} navbar className="mt-2">
            <Nav className="navbar-nav flex-row flex-wrap ms-lg-auto align-items-center">
              <NavItem className="nav-item col-6 col-lg-auto pe-4">
                <QuickNav client={this.props.client} model={this.props.model} user={this.props.user} />
              </NavItem>
              <NavItem className="nav-item col-6 col-lg-auto">
                <RenkuNavLink to="/projects" alternate={"/projects/all"}
                  title="Projects" id="link-projects" className="link-secondary" />
              </NavItem>
              <NavItem className="nav-item col-6 col-lg-auto">
                <RenkuNavLink to="/datasets" title="Datasets" id="link-datasets" />
              </NavItem>
              <NavItem className="nav-item col-6 col-lg-auto pe-4">
                <RenkuNavLink to="/sessions" title="Sessions" id="link-sessions" />
              </NavItem>
              <NavItem className="nav-item col-1 col-lg-auto">
                <RenkuToolbarHelpMenu />
              </NavItem>
              <NavItem className="nav-item col-1 col-lg-auto">
                <RenkuToolbarNotifications {...this.props} />
              </NavItem>
              <NavItem className="nav-item col-1 col-lg-auto">
                <RenkuToolbarItemUser {...this.props} />
              </NavItem>
            </Nav>
          </Collapse>
        </Navbar>
      </header>
    );
  }
}

class MaintenanceNavBar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isOpen: true
    };
  }

  render() {
    return (
      <header>
        <nav className="navbar navbar-expand-sm navbar-light bg-light justify-content-between">
          <span className="navbar-brand">
            <Link to="/"><img src={logo} alt="Renku" height="24" /></Link>
          </span>
          <button className="navbar-toggler mt-3" type="button" data-toggle="collapse"
            data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
            aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
        </nav>
      </header>
    );
  }
}

class FooterNavbar extends Component {
  render() {
    const { params } = this.props;
    const privacyLink = params && params["PRIVACY_STATEMENT"] ?
      (<RenkuNavLink to="/privacy" title="Privacy" />) :
      null;
    return (
      <footer className="footer mt-auto pt-4">
        <Navbar className="container-fluid flex-wrap flex-lg-nowrap renku-container navbar bg-primary navbar-dark">
          <span className="text-white-50">&copy; SDSC {(new Date()).getFullYear()}</span>
          <Nav className="ms-auto">
            <Link className="nav-link" to="/">
              <img src={logo} alt="Renku" className="pb-2" height="44" />
            </Link>
          </Nav>
          <Nav className="ms-auto">
            <RenkuNavLink to="/help" title="Help" />
            {privacyLink}
            <ExternalDocsLink url="https://renku.discourse.group" title="Forum" className="nav-link" />
            <ExternalDocsLink url="https://gitter.im/SwissDataScienceCenter/renku"
              title="Gitter" className="nav-link" />
            <ExternalDocsLink url="https://datascience.ch/who-we-are" title="About" className="nav-link" />
          </Nav>
        </Navbar>
      </footer>
    );
  }
}

export { RenkuNavBar, FooterNavbar, MaintenanceNavBar };
export { RenkuToolbarHelpMenu, RenkuToolbarNotifications };
