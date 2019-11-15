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
 *  DatasetNew.present.js
 *  Presentational components.
 */



import React from 'react';
import { Row, Col } from 'reactstrap';
import FormPanel from '../../../utils/formgenerator';

function DatasetNew(props){
	
  const submitCallback = e => 
    alert(Object.values(props.datasetFormSchema)
      .map(m => m.label + ': ' + m.value + ',\n')
      .join(''));

  return (
    <Row>
      <Col>
        <FormPanel
          title="Create Dataset" 
          btnName="Create Dataset" 
          submitCallback={submitCallback} 
          model={props.datasetFormSchema} />
      </Col>
    </Row>
  );

}

export default DatasetNew;
