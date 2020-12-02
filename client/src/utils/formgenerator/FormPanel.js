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

import React, { Fragment } from "react";
import { Form, Button, Col, UncontrolledAlert, FormText } from "reactstrap";
import useForm from "./UseForm";
import TextInput from "./fields/TextInput";
import TextareaInput from "./fields/TexAreaInput";
import SelectInput from "./fields/SelectInput";
import CreatorsInput from "./fields/CreatorsInput";
import SelectautosuggestInput from "./fields/SelectAutosuggestInput";
import CktextareaInput from "./fields/CKEditorTextArea";
import FileUploaderInput from "./fields/FileUploaderInput";
import KeywordsInput from "./fields/KeywordsInput";
import ValidationAlert from "./fields/ValidationAlert";
import { Loader } from "../../utils/UIComponents";
import "./FormGenerator.css";

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function SubmitButtonGroup(props) {
  const { submitCallback, submitLoader, btnName, errorFields } = props;
  const { onCancel, cancelBtnName } = props;
  const submitButton = submitCallback !== undefined ?
    <Button type="submit" disabled={submitLoader.value} className="float-right mt-1" color="primary">
      {btnName}
    </Button>
    : null;
  const cancelButton = onCancel !== undefined ?
    <Button disabled={submitLoader.value} className="float-right mt-1 mr-1"
      color="secondary" onClick={onCancel}>
      {cancelBtnName ? cancelBtnName : "Cancel"}
    </Button>
    : null;
  const errorMessage = (errorFields.length > 0) ?
    <ValidationAlert
      content={`Please fix problems in the following fields: ${errorFields.map(d => d.label).join(" ")}`} /> :
    null;
  return <Fragment>
    { errorMessage }
    { submitButton }
    { cancelButton }
  </Fragment>;
}

function FormPanel({ title, btnName, submitCallback, model, serverErrors,
  serverWarnings, submitLoader, onCancel, edit, cancelBtnName, disableAll }) {
  const modelValues = Object.values(model);
  const [inputs, setInputs, setSubmit] = useForm(modelValues, submitCallback);
  const Components = {
    TextInput,
    TextareaInput,
    CktextareaInput,
    FileUploaderInput,
    SelectInput,
    SelectautosuggestInput,
    CreatorsInput,
    KeywordsInput
  };
  const renderInput = input => {
    const Component = Components[capitalize(input.type) + "Input"];
    return <Component key={input.name}
      disabled={submitLoader.value || (input.edit === false && edit) || disableAll} setInputs={setInputs} {...input} />;
  };

  const extractErrorsAndWarnings = (errorOrWarning, errorMessage) => {
    let content;
    console.log(errorOrWarning);
    console.log(typeof errorOrWarning);
    if (typeof errorOrWarning === "string") {
      content = <p>{errorOrWarning}</p>;
    }
    else if (!Array.isArray(errorOrWarning)) {
      content = errorOrWarning;
    }
    else {
      //this could be improve to extract better the error message
      //ideally we could map backend and frontend fields and put the error under the field
      content = Object.keys(errorOrWarning).map(error =>
        (<p key={error}>{`${error}: ${JSON.stringify(errorOrWarning[error])}`}</p>)
      );
    }
    return (<div>
      {errorMessage ? <p>Errors occurred while creating the project.</p> : null }
      {content}
    </div>);
  };

  const errorFields = inputs.filter(input => (input.alert != null) && (input.edit !== false));

  return (
    <Col>
      { title !== undefined ?
        <h3 className="uk-heading-divider uk-text-center pb-2">{title}</h3>
        : null }
      <Form onSubmit={setSubmit}>
        <div>
          {inputs.map(input => renderInput(input))}
          {serverErrors ? <UncontrolledAlert color="danger">
            {extractErrorsAndWarnings(serverErrors, true)}</UncontrolledAlert> : null}
          {serverWarnings ? <UncontrolledAlert color="warning">
            {extractErrorsAndWarnings(serverWarnings, false)}</UncontrolledAlert> : null}
          {submitLoader !== undefined && submitLoader.value ?
            <FormText color="primary">
              <Loader size="16" inline="true" margin="2" />
              {submitLoader.text}
            </FormText>
            : null
          }
          <SubmitButtonGroup
            submitCallback={submitCallback} submitLoader={submitLoader} btnName={btnName} errorFields={errorFields}
            onCancel={onCancel} cancelBtnName={cancelBtnName}
          />
        </div>
      </Form>
    </Col>
  );
}

export default FormPanel;
export { capitalize };
