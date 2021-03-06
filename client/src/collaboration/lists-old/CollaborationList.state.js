/*!
 * Copyright 2019 - Swiss Data Science Center (SDSC)
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
 *  CollaborationList.state.js
 *  Redux-based state-management code.
 */

import { Schema, StateKind, StateModel } from "../../model/Model";

const collaborationListSchema = new Schema({
  loading: { initial: false },
  currentPage: { initial: 1, mandatory: true },
  totalItems: { initial: 0, mandatory: true },
  perPage: { initial: 10, mandatory: true },
  itemsState: { initial: "opened", mandatory: true },
  initialized: { initial: true },
  projectId: { mandatory: true },
  items: { initial: [] },
  errorMessage: { initial: "" }
});

class CollaborationListModel extends StateModel {
  constructor(client, projectId, fetchElements) {
    super(collaborationListSchema, StateKind.REDUX);
    this.client = client;
    this.projectId = projectId;
    this.fetchElements = fetchElements;
  }

  setInitialized(initialized) {
    this.setObject({
      items: { $set: [] },
      initialized: initialized,
      errorMessage: "",
    });
  }

  setPathName(pathName) {
    this.set("pathName", pathName);
  }

  setItemsState(itemsState) {
    this.set("itemsState", itemsState);
  }

  setPage(page) {
    this.set("currentPage", parseInt(page, 10));
  }

  resetBeforeNewSearch() {
    this.setObject({
      currentPage: 1,
      pages: { $set: [] }
    });
  }

  manageResponse(response) {
    const { pagination } = response;
    const newData = {
      items: { $set: response.data },
      currentPage: pagination.currentPage,
      totalItems: pagination.totalItems,
      initialized: false,
      errorMessage: "",
      loading: false
    };
    this.setObject(newData);
    return newData;
  }

  setQueryAndSearch( pathName, pageNumber, itemsState) {
    this.setPathName(pathName);
    this.setPage(pageNumber);
    this.setItemsState(itemsState);
    this.performSearch();
  }

  performSearch() {
    if (this.get("loading")) return;
    this.set("loading", true);
    const queryParams = {
      per_page: this.get("perPage"),
      page: this.get("currentPage"),
      state: this.get("itemsState"),
      order_by: "updated_at"
    };

    return this.fetchElements(this.projectId, queryParams)
      .then(response => this.manageResponse(response));
  }
}

export default CollaborationListModel;
