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
 *  FormPanel.js
 *  Presentational components.
 */

import React from 'react';
import { Form, Button, Col } from 'reactstrap';
import useForm from './UseForm';
import TextInput from './fields/TextInput';
import CktextareaInput from './fields/CKEditorTextArea';
import FilepondInput from './fields/FilepondInput';
import './FormGenerator.css'

function FormPanel({ title, btnName, submitCallback, model }) {

	const modelValues = Object.values(model)

  const [inputs, setInputs, setSubmit] = useForm(modelValues, submitCallback);

  const Components = { TextInput, CktextareaInput, FilepondInput };

  const capitalize = expression => expression.charAt(0).toUpperCase() + expression.slice(1);

  const renderInput = input => {
    const Component = Components[capitalize(input.type) + 'Input'];
    return <Component key={input.name} setInputs={setInputs} {...input} />;
  }

  return (
    <Col>
      <h3 className="uk-heading-divider uk-text-center pb-2">{title}</h3>
      {/* <Form> */}
      <div>
        {inputs.map(input => renderInput(input))}
        <Button className="float-right mt-1" color="primary" onClick={setSubmit}>{btnName}</Button>
        </div>
      {/* </Form> */}
    </Col>
  )
}

export default FormPanel;
