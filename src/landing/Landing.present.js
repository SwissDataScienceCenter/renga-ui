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
 *  incubator-renku-ui
 *
 *  Landing.present.js
 *  Presentational components.
 */



import React, { Component } from 'react';

import { Link }  from 'react-router-dom'
import ReactMarkdown from 'react-markdown';

import { Nav, NavItem, NavLink } from 'reactstrap';
import { Row, Col } from 'reactstrap';
import { Jumbotron } from 'reactstrap';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faClone from '@fortawesome/fontawesome-free-solid/faClone';
import faCloudUp from '@fortawesome/fontawesome-free-solid/faCloudUploadAlt';
import faCodeBranch from '@fortawesome/fontawesome-free-solid/faCodeBranch';
import faHeart from '@fortawesome/fontawesome-free-solid/faHeart';
import faSearch from '@fortawesome/fontawesome-free-solid/faSearch';
import faShield from '@fortawesome/fontawesome-free-solid/faShieldAlt';
import faUserFriends from '@fortawesome/fontawesome-free-solid/faUserFriends';

import { ProjectListRow } from '../project';

class YourEmptyProjects extends Component {
  render() {
    return (<Row>
      <Col md={8} lg={6} xl={4}>
        <RenkuIntroText welcomePage={this.props.welcomePage}/>
        <p>
          You are logged in, but you are not yet a member of any projects.

          If there is a project you work on, you should
          search for it in the <Link to={this.props.projectsSearchUrl}>project search</Link>, click on it to view,
          and fork it.
        </p>
        <p>
          Alternatively, you can <Link to={this.props.projectNewUrl}>create a new project</Link>.
        </p>
      </Col>
    </Row>)
  }
}

class YourProjects extends Component {
  render() {
    const projects = this.props.projects || [];
    const projectsUrl = this.props.urlMap.projectsUrl;
    const rows = projects.map(p => <ProjectListRow key={p.id} projectsUrl={projectsUrl} {...p} />);
    if (rows.length > 0)
      return <Row key="projects"><Col md={8}>{rows}</Col></Row>
    else {
      const projectNewUrl = this.props.urlMap.projectNewUrl;
      const projectsSearchUrl = this.props.urlMap.projectsSearchUrl;
      return <YourEmptyProjects projectsSearchUrl={projectsSearchUrl}
        projectNewUrl={projectNewUrl} welcomePage={this.props.welcomePage} />
    }
  }
}

class RenkuIntroText extends Component {
  render() {
    return <ReactMarkdown key="readme" source={this.props.welcomePage} />
  }

}

class StarredEmptyProjects extends Component {
  render() {
    return (<Row>
      <Col md={8} lg={6} xl={4}>
        <RenkuIntroText welcomePage={this.props.welcomePage}/>
        <p>
          You are logged in, but you have not yet starred any projects.
          Starring a project declares your interest in it.
          If there is a project you work on or want to follow, you should search for it in
          the <Link to={this.props.projectsSearchUrl}>project search</Link>, click on it to view, and star it.
        </p>
        <p>
          Alternatively, you can <Link to={this.props.projectNewUrl}>create a new project</Link>.
        </p>
      </Col>
    </Row>)
  }
}

class Starred extends Component {
  render() {
    const projects = this.props.projects || [];
    const projectsUrl = this.props.urlMap.projectsUrl;
    const rows = projects.map(p => <ProjectListRow key={p.id} projectsUrl={projectsUrl} {...p} />);
    if (rows.length > 0)
      return <Row key="projects"><Col md={8}>{rows}</Col></Row>
    else {
      console.log(this.props.urlMap)
      const projectNewUrl = this.props.urlMap.projectNewUrl;
      const projectsSearchUrl = this.props.urlMap.projectsSearchUrl;
      return <StarredEmptyProjects projectsSearchUrl={projectsSearchUrl}
        projectNewUrl={projectNewUrl} welcomePage={this.props.welcomePage} />
    }
  }
}

class Welcome extends Component {
  render() {
    return (<Row>
      <Col md={8} lg={6} xl={4}>
        <RenkuIntroText welcomePage={this.props.welcomePage}/>
      </Col>
    </Row>)
  }
}

class RenkuProvidesHeader extends Component {
  render() {
    return <h3 className="text-primary">
      {this.props.title} <FontAwesomeIcon icon={this.props.icon} id={this.props.title.toLowerCase()}/>
    </h3>
  }
}

class AnonymousHome extends Component {
  render() {
    return [
      <Row key="marquee">
        <Col>
          <Jumbotron className="bg-white text-secondary">
            <Row>
              <Col md={6}>
                <h1>RENKU</h1>
                <h2>Collaborative Data Science</h2>
              </Col>
              <Col md={6} className="d-md-flex justify-content-center align-items-center">
                <div>
                  <Link to="/login" className="btn btn-primary btn-lg">Login or Sign Up</Link>
                </div>
              </Col>
            </Row>
          </Jumbotron>
        </Col>
      </Row>,
      <Row key="content-header">
        <Col>
          <h1 className="text-center">Renku Enables</h1>
        </Col>
      </Row>,
      <Row key="content-body">
        <Col md={6}>
          <RenkuProvidesHeader title="Reproducibility" icon={faClone} />
          <p className="mb-5">Renku <b>captures the lineage</b> of your work so recreating a
            critical piece of analysis is always possible. In addition, it tracks the details of
            your <b>computational environment</b> so that others can reliably work with your data and code.</p>

          <RenkuProvidesHeader title="Shareability" icon={faCloudUp} />
          <p className="mb-5">Need to <b>share your results</b> with a colleague? <b>Make your data available</b> to
            a project partner? <b>Work together</b> on a project with a teammate?
            Renku makes all of these easy. And Renku lets you <b>track everyone&#8217;s contribution</b> to
            the final result.
          </p>

          <RenkuProvidesHeader title="Federation" icon={faUserFriends} />
          <p className="mb-5">
            Collaborate across instituational boundries, while maintaining complete control of your resources.
            Federation lets you <b>share</b> information, data, or code <b>without having to make any compromises</b>.
          </p>
        </Col>
        <Col md={6} className="mt-md-5">
          <RenkuProvidesHeader title="Reusability" icon={faCodeBranch} />
          <p className="mb-5">
            Stand on the shoulders of giants: <i>your colleagues</i>. Renku makes it simple
            to <b>reuse code and data</b> in other projects. No need for you to reinvent the
            wheel, and everyone profits from your improvements.
          </p>

          <RenkuProvidesHeader title="Security" icon={faShield} />
          <p className="mb-5">You have the freedom to share code or data with others, with the
            security of having <b>fine-grained control</b> over what is visible and what is kept private.
            You decide what information about your project is available to whom.
          </p>

          <RenkuProvidesHeader title="Discoverability" icon={faSearch} />
          <p className="mb-5">
            The extensible Renku knowledge graph captures information about your
            project&#8217;s data, code, proceses, and lineage. With its <b>powerful search capabilities</b>,
            if it is in the system, you can always find the information you are looking for.
          </p>
        </Col>
      </Row>,
      <Row key="tutorial" className="mb-3">
        <Col>
          Want to learn more? Create an account
          and <a href="https://renku.readthedocs.io/en/latest/user/firststeps.html">follow the tutorial</a>.
        </Col>
      </Row>,
      <Row key="closing">
        <Col>
          <h3 className="text-primary">
            <FontAwesomeIcon icon={faHeart} id="love"/> Give Renku a try.
            We think you&#8217;ll love it!
          </h3>
        </Col>
      </Row>
    ]
  }
}

class LoggedInNav extends Component {
  render() {
    const selected = this.props.selected;
    return <Nav pills className={'nav-pills-underline'}>
      <NavItem>
        <NavLink href="#" active={selected === 'your_activity'}
          onClick={this.props.onMember}>Your Projects</NavLink>
      </NavItem>
      <NavItem>
        <NavLink href="#" active={selected === 'starred'}
          onClick={this.props.onStarred}>Starred Projects</NavLink>
      </NavItem>
    </Nav>
  }
}

class LoggedInHome extends Component {
  render() {
    let selected = this.props.ui.selected;
    const urlMap = this.props.urlMap;
    const welcome = <Welcome {...this.props} />;
    const nav = <LoggedInNav selected={selected} urlMap={urlMap}
      onStarred={this.props.onStarred}
      onMember={this.props.onMember} />

    const user = this.props.user;
    const starredProjects = (user) ? user.starredProjects : [];
    const memberProjects = (user) ? user.memberProjects : [];

    let visibleTab = <YourProjects urlMap={urlMap} projects={memberProjects} />
    if (selected === 'starred')
      visibleTab = <Starred urlMap={urlMap} projects={starredProjects} welcomePage={this.props.welcomePage} />
    if (selected === 'welcome') visibleTab = welcome;
    return [
      <Row key="nav">
        <Col md={12}>
          {nav}
        </Col>
      </Row>,
      <Row key="spacer"><Col md={12}>&nbsp;</Col></Row>,
      <Row key="content">
        <Col md={12}>
          {visibleTab}
        </Col>
      </Row>
    ]
  }
}

class Home extends Component {
  render() {
    const loggedIn = this.props.user != null
    return (loggedIn) ? <LoggedInHome {...this.props} /> : <AnonymousHome {...this.props} />
  }
}

export default { Home, Starred };
