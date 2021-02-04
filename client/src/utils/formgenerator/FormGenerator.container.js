/*!
 * Copyright 2020 - Swiss Data Science Center (SDSC)
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
 *  FormGenerator.container.js
 *  Container components for form generator
 */

import React, { Component } from "react";
import { connect } from "react-redux";

import { FormGeneratorCoordinator } from "./FormGenerator.state";
import FormPanel from "./FormPanel";


class FormGenerator extends Component {

  constructor(props) {
    super(props);
    this.model = props.model_top.subModel("formGenerator");
    this.coordinator = new FormGeneratorCoordinator(props.client, this.model);
    this.handlers = {
      addDraft: this.addDraft.bind(this),
      getDraft: this.getDraft.bind(this),
      removeDraft: this.removeDraft.bind(this),
      getFormDraftProperty: this.getFormDraftProperty.bind(this),
      getFormDraftFieldValue: this.getFormDraftFieldValue.bind(this),
      setSubmitLoader: this.setSubmitLoader.bind(this),
      getSubmitLoader: this.getSubmitLoader.bind(this),
      getServerErrors: this.getServerErrors.bind(this),
      setServerErrors: this.setServerErrors.bind(this),
      getDisableAll: this.getDisableAll.bind(this),
      setDisableAll: this.setDisableAll.bind(this),
      getServerWarnings: this.getServerWarnings.bind(this),
      setServerWarnings: this.setServerWarnings.bind(this),
      getSecondaryButtonText: this.getSecondaryButtonText.bind(this),
      setSecondaryButtonText: this.setSecondaryButtonText.bind(this),
      isMounted: this.isMounted.bind(this),
      setFormDraftInternalValuesProperty: this.setFormDraftInternalValuesProperty.bind(this),
      getFormDraftInternalValuesProperty: this.getFormDraftInternalValuesProperty.bind(this)
    };
  }

  addDraft(formDraft, mounted, submitLoader, formLocation = this.props.formLocation) {
    return this.coordinator.addFormDraft(formLocation, formDraft, mounted, submitLoader);
  }

  getDraft( formLocation = this.props.formLocation) {
    return this.coordinator.getFormDraft(formLocation);
  }

  removeDraft( formLocation = this.props.formLocation) {
    return this.coordinator.removeFormDraft(formLocation);
  }

  setSubmitLoader(submitLoader, formLocation = this.props.formLocation) {
    return this.coordinator.setSubmitLoader(formLocation, submitLoader);
  }

  getSubmitLoader( formLocation = this.props.formLocation) {
    return this.coordinator.getSubmitLoader(formLocation);
  }

  setServerErrors(serverErrors, formLocation = this.props.formLocation) {
    return this.coordinator.setServerErrors(formLocation, serverErrors);
  }

  getServerErrors( formLocation = this.props.formLocation) {
    return this.coordinator.getServerErrors(formLocation);
  }

  setServerWarnings(serverWarnings, formLocation = this.props.formLocation) {
    return this.coordinator.setServerWarnings(formLocation, serverWarnings);
  }

  getServerWarnings( formLocation = this.props.formLocation) {
    return this.coordinator.getServerWarnings(formLocation);
  }

  setDisableAll(disableAll, formLocation = this.props.formLocation) {
    return this.coordinator.setDisableAll(formLocation, disableAll);
  }

  getDisableAll( formLocation = this.props.formLocation) {
    return this.coordinator.getDisableAll(formLocation);
  }

  setSecondaryButtonText(text, formLocation = this.props.formLocation) {
    return this.coordinator.setSecondaryButtonText(formLocation, text);
  }

  getSecondaryButtonText( formLocation = this.props.formLocation) {
    return this.coordinator.getSecondaryButtonText(formLocation);
  }

  isMounted( formLocation = this.props.formLocation) {
    return this.coordinator.isMounted(formLocation);
  }

  getFormDraftProperty( formLocation = this.props.formLocation, fieldName, property) {
    return this.coordinator.getFormDraftProperty(formLocation, fieldName, property);
  }

  setFormDraftInternalValuesProperty( formLocation = this.props.formLocation, fieldName, property, value) {
    return this.coordinator.setFormDraftInternalValuesProperty(formLocation, fieldName, property, value);
  }

  getFormDraftInternalValuesProperty( formLocation = this.props.formLocation, fieldName, property) {
    return this.coordinator.getFormDraftInternalValuesProperty(formLocation, fieldName, property);
  }

  getFormDraftFieldValue( formLocation = this.props.formLocation, fieldName) {
    return this.coordinator.getFormDraftFieldValue(formLocation, fieldName);
  }

  mapStateToProps(state) {
    return {
      handlers: this.handlers,
      drafts: state.formGenerator,
      formLocation: this.props.formLocation
    };
  }

  render() {
    const VisibleFormGenerator = connect(this.mapStateToProps.bind(this))(FormPanel);
    return (<VisibleFormGenerator
      {...this.props}
      store={this.model.reduxStore}
    />);
  }
}
export default FormGenerator;
