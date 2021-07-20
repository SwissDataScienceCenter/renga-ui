/*!
 * Copyright 2021 - Swiss Data Science Center (SDSC)
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
 *  incubator-renku-ui
 *
 *  Landing.present.js
 *  Presentational components.
 */


import React, { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { Button, Row, Col } from "reactstrap";
import { Navbar, Nav, Collapse, NavItem } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars
} from "@fortawesome/free-solid-svg-icons";
import { faDiscourse } from "@fortawesome/free-brands-svg-icons";

import { ExternalIconLink, RenkuNavLink } from "../utils/UIComponents";
import { StatuspageBanner } from "../statuspage";
import QuickNav from "../utils/quicknav";
import { RenkuToolbarHelpMenu, RenkuToolbarNotifications } from "./NavBar";

import logo from "./logo.svg";
import VisualHead from "./Assets/Visual_Head.svg";
import VisualFooter from "./Assets/Visual_Footer.svg";

import Look from "./Graphics/Look.jpg";
import Sessions from "./Graphics/Sessions.jpg";
import Context from "./Graphics/Context.jpg";


function HomeHeader(props) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);
  const { urlMap } = props;

  return <Fragment>
    <Row key="statuspage">
      <Col>
        <StatuspageBanner siteStatusUrl={urlMap.siteStatusUrl} statuspageId={props.statuspageId}
          statuspageModel={props.statuspageModel} />
      </Col>
    </Row>
    <header className="px-0 pt-2 pb-4 d-flex rk-anon-home">
      <div className="align-self-center flex-grow-1">
        <img src={logo} alt="Renku" height="68" className="d-block my-1" />
      </div>
      <div className="px-2 mt-3 align-self-center bg-primary">
        <Link className="btn btn-outline-secondary" role="button" id="login-button" to="/login">
          Login
        </Link>
      </div>
      <div className="px-2 mt-1 align-self-center bg-primary">
        <Button onClick={toggleOpen} id="nav-hamburger" className="border-0 mt-3">
          <FontAwesomeIcon icon={faBars} id="userIcon" />
        </Button>
      </div>
    </header>
    <div>
      <Collapse isOpen={isOpen} className="mt-2">
        <Navbar className="navbar rk-anon-home px-0">
          <Nav className="ms-auto flex-column text-end">
            <NavItem className="nav-item pe-1">
              <QuickNav client={props.client} model={props.model} user={props.user} />
            </NavItem>
            <NavItem className="nav-item">
              <RenkuNavLink to="/projects" title="Projects" id="link-projects" className="link-secondary" />
            </NavItem>
            <NavItem className="nav-item">
              <RenkuNavLink to="/datasets" title="Datasets" id="link-datasets" />
            </NavItem>
            <NavItem className="nav-item">
              <RenkuNavLink to="/sessions" title="Sessions" id="link-sessions" />
            </NavItem>
            <NavItem className="nav-item">
              <RenkuToolbarHelpMenu />
            </NavItem>
            <NavItem className="nav-item">
              <RenkuToolbarNotifications {...props} />
            </NavItem>
          </Nav>
        </Navbar>
      </Collapse>
    </div>
  </Fragment>;
}

function Section1(props) {
  const backgroundUrl = VisualHead;
  return <div id="rk-anon-home-section1"
    style={{
      backgroundImage: `url(${backgroundUrl})`
    }}>
    <HomeHeader {...props} />
    <div className="rk-anon-home-section-content">
      <Row>
        <Col className="rk-pt-l rk-w-s" >
          <h1 className="text-white">RenkuLab</h1>
        </Col>
      </Row>
      <Row>
        <Col className="rk-pt-s rk-w-s">
          <h3 className="text-rk-green">We have been improving RenkuLab.</h3>
          <h3 className="text-rk-pink">Welcome to the new version!</h3>
        </Col>
      </Row>
      <Row>
        <Col className="rk-pt-s rk-w-s">
          <ExternalIconLink
            className="btn btn-outline-rk-pink"
            url="https://renku.discourse.group" icon={faDiscourse} title="Feedback" />
          {" "}
          <HashLink className="btn btn-outline-rk-yellow" role="button"
            to="#rk-anon-home-section2">
            Learn more
          </HashLink>
          {" "}
          <Link className="btn btn-outline-secondary" role="button" id="login-button" to="/login">
            Login
          </Link>
        </Col>
      </Row>
    </div>
  </div>;
}

function Section2(props) {
  return <div id="rk-anon-home-section2">
    <div className="rk-anon-home-section-content">
      <Row className="rk-pt-m">
        <Col md={4}>
          <h3 className="text-rk-pink">A cleaner design...</h3>
        </Col>
        <Col md={{ size: 7, offset: 1 }}>
          <h3 className="text-secondary">...easier to use and a better<br />overall experience!
          </h3>
        </Col>
      </Row>
      <Row className="rk-pt-l">
        <Col className="d-md-flex rk-home-gallery">
          <div>
            <div className="text-center"><img alt="new look" src={Look} width="100%" /></div>
            <h3 className="rk-pt-s">New Look</h3>
            <p>
              The change you will most immediately notice is the new look. There is a new logo, a new color
              palette, and a cleaner visual style. We think you will like the new appearance of RenkuLab.
            </p>
          </div>
          <div>
            <div className="text-center"><img alt="better sessions" src={Sessions} width="100%" /></div>
            <h3 className="rk-pt-s">Better Sessions</h3>
            <p>
              Sessions (previously &ldquo;Interactive Environments&rdquo;) have been dramatically redesigned.
              You can now start sessions at the click of a button, and we have made it easier to access
              information and documentation while working within a session.
            </p>
          </div>
          <div>
            <div className="text-center"><img alt="clearer context" src={Context} width="100%" /></div>
            <h3 className="rk-pt-s">Clearer Context</h3>
            <p>
              RenkuLab has always integrated GitLab, and we have made it easier and more intuitive to access. Take
              full advantage of the power of GitLab without losing track of the RenkuLab context.
            </p>
          </div>
        </Col>
      </Row>
    </div>
  </div>;
}

function Section3(props) {
  const backgroundUrl = VisualFooter;
  return <div id="rk-anon-home-section3" style={{
    backgroundImage: `url(${backgroundUrl})`
  }}>
    <div className="rk-anon-home-section-content">
      <Row className="rk-pt-s">
        <Col md={9} lg={6} className="rk-pt-m" style={{ maxWidth: "660px", background: "rgba(245, 245, 245, 0.7)" }}>
          <h3>More improvements on the way</h3>
          <p>
            There are further improvements in the works. We are working on making it easier to{" "}
            track and understand the lineage of your results, simplifying reuse of workflows, and{" "}
            aim to allow easy access to shared datasets.
          </p>
        </Col>
      </Row>
    </div>
  </div>;
}


function TransitionalHome(props) {
  return <Fragment>
    <Section1 {...props} />
    <Section2 />
    <Section3 />
  </Fragment>;

}

export default TransitionalHome;
