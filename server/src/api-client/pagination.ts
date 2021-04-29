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

const PAGINATION_LINK_NAMES = {
  first: "firstPageLink",
  last: "lastPageLink",
  prev: "previousPageLink",
  next: "nextPageLink"
};

const NUMERICAL_X_HEADERS = {
  "X-Next-Page": "nextPage",
  "X-Page": "currentPage",
  "X-Per-Page": "perPage",
  "X-Prev-Page": "previousPage",
  "X-Total": "totalItems",
  "X-Total-Pages": "totalPages",
};

const NUMERICAL_PAGINATION_HEADERS = {
  "Next-Page": "nextPage",
  "Page": "currentPage",
  "Per-Page": "perPage",
  "Total": "totalItems",
  "Total-Pages": "totalPages",
};

// In this function we just parse the pagination related header
// information. The idea that methods performing the the request to
// to fetch the next page has been dropped because we prefer to
// keep the state of the corresponding components serializable.
// // function processPaginationHeaders(headers: Headers) {
// //   let paginationDetail = {};

// //   // Parse the link header if it exists
// //   if (headers.get("Link")) {
// //     const paginationLinks = processLinkHeader(headers.get("Link"));
// //     paginationDetail = { ...paginationDetail, ...paginationLinks };
// //   }

// //   // Parse the pagination related X-... headers
// //   Object.keys(NUMERICAL_X_HEADERS).forEach((header) => {
// //     paginationDetail[NUMERICAL_X_HEADERS[header]] =
// //       parseInt(headers.get(header), 10) || undefined;
// //   });

// //   // Parse the pagination related headers (non-X)
// //   if (!headers.get("X-Page")) {
// //     Object.keys(NUMERICAL_PAGINATION_HEADERS).forEach((header) => {
// //       paginationDetail[NUMERICAL_PAGINATION_HEADERS[header]] =
// //         parseInt(headers.get(header), 10) || undefined;
// //     });
// //   }

// //   return paginationDetail;
// // }

// // function processLinkHeader(linkHeader: string) {
// //   const paginationLinks: Record<string, string | number> = {};

// //   const linksRegex = /<([^>]*?)>;\srel="(.*?)"/g;

// //   let match = linksRegex.exec(linkHeader);

// //   while (match) {
// //     paginationLinks[PAGINATION_LINK_NAMES[match[2]]] = match[1];
// //     match = linksRegex.exec(linkHeader);
// //   }

// //   return paginationLinks;
// // }

// // export { processPaginationHeaders };
