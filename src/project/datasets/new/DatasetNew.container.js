/*!
 * Copyright 2017 - Swiss Data Science Center (SDSC)
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
 *  DatasetNew.container.js
 *  Container components for new dataset.
 */

import React, { useState } from 'react';
import { datasetFormSchema } from '../../../model/RenkuModels';
import DatasetNew from './DatasetNew.present'

function NewDataset(props) {

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);

  const handlers = {
    setName : setName,
    setDescription: setDescription,
    setFiles: setFiles
  }
	
  return <DatasetNew
    handlers={handlers}
    datasetFormSchema={datasetFormSchema}
    user={props.user}
    name={name}
    description={description}
    files={files} />;
}


export default NewDataset;
