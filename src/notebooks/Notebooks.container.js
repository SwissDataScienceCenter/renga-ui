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

import React, { Component } from 'react';
// import { Notebooks as NotebooksPresent } from './Notebooks.present';


class NotebookAdmin extends Component {
  render() {
    const adminUiUrl = this.props.adminUiUrl;
    // return <iframe width="100%" height="100%"
    //   style={{border:"none"}}
    //   src={adminUiUrl}></iframe>
    return <a href={adminUiUrl} target="_blank"
      className="btn btn-primary" role="button">Launch Notebook Admin UI</a>
  }
}


export { NotebookAdmin };
