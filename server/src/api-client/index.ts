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

import winston from "winston";
import hash from "object-hash"; // ? use to compare servers response hashes
import axios, { Method } from "axios"; // ? https://blog.logrocket.com/axios-or-fetch-api/


const FETCH_DEFAULT = {
  method: "get" as Method,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Credentials": "same-origin",
    "X-Requested-With": "XMLHttpRequest"
  },
  reLogin: true,
  timeout: 60000 // ? in ms. 0 means no timeout
};

interface ApiClient {
  logger: winston.Logger,
  baseUrl: string,
  gatewayUrl: string,
}

class ApiClient {
  constructor(logger: winston.Logger, baseUrl: string, gatewayUrl: string) {
    this.logger = logger;
    this.baseUrl = baseUrl;
    this.gatewayUrl = gatewayUrl;
  }

  async tryRelogin(headers: Record<string, string>): Promise<void> {
    // This is invoked to try to refresh authentication.
    // ? window.location = `${this.baseUrl}/auth/login?redirect_url=${encodeURIComponent(window.location.href)}`;
    const url = `${this.gatewayUrl}/auth/login?redirect_url=${encodeURIComponent(this.baseUrl)}`;
    return axios.get(url, { headers, maxRedirects: 100, withCredentials: true, responseType: "text" })
      .then(result => {
        this.logger.info(result);

        // ?  USE result.request.res.responseUrl instead of result.request.path
        // ? REF: https://stackoverflow.com/questions/54384896/handling-redirects-with-axios-in-browser
        if (result && result.request && result.request.res && result.request.res.responseUrl) {
          if (result.headers["set-cookie"] && result.headers["set-cookie"].length) {
            const newUrl = result.request.res.responseUrl;
            const mappedCookies = result.headers["set-cookie"]
              .map((cont: string) => cont.substring(0, cont.indexOf(";")));
            const newCookies = mappedCookies.join(";");
            // ! This is not needed. Using `withCredentials: true` automatically set the incoming cookies
            const newHeaders = { cookie: newCookies, accept: "text/html" };
            return axios.get(newUrl, { headers: newHeaders, maxRedirects: 100, withCredentials: true })
              .then(result2 => {
                this.logger.info(result2);
              })
              .catch(error => {
                this.logger.error(error);
              });
          }
        }
      })
      .catch(error => {
        this.logger.error(error);
      });
  }

  async clientFetch(
    url: string,
    headers: Record<string, string> = null,
    method: Method = FETCH_DEFAULT.method,
    queryParams: Record<string, string> = null,
    data: Record<string, string> = null,
    reLogin: boolean = FETCH_DEFAULT.reLogin,
    timeout: number = FETCH_DEFAULT.timeout
  ): Promise<any> {
    // Include query params
    const urlObject = new URL(url);
    if (queryParams) {
      for (const param of Object.keys(queryParams))
        urlObject.searchParams.append(param, queryParams[param]);
    }


    // create query object
    const headersWithDefault = { ...FETCH_DEFAULT.headers, ...headers };
    const axiosOptions = { url, headers: headersWithDefault, method, timeout, data };

    return axios.request(axiosOptions)
      .catch((error) => {
        // For permission errors we try to re-login
        if (reLogin && error.isAxiosError && error.response.status === 401)
          this.tryRelogin(headers);
          // ! TODO: this should wait for the tryRelogin and, if successful, invoke again the query.
          // ! Not returning anything here tryiggers an early error and return a wrong response
        else
          return Promise.reject(error);
      })
      .then(response => {
        this.logger.info(response.status);
        // TODO - improve
        return {
          data: response.data,
          pagination: {} //processPaginationHeaders(response.headers)
        };
      });
  }

  // TODO: move this to an extentions. Even better, use the `declare module` on a `d.ts` file.
  async getNotebookServers(cookies: string = null): Promise<Record<string, Record<string, unknown>>> {
    const headers = { "cookie": cookies };
    const url = `${this.gatewayUrl}/notebooks/servers`;
    return this.clientFetch(url, headers)
      .then(response => {
        return response.data.servers;
      })
      .catch(error => {
        return this.logger.error(error);
      });
  }
}

export { ApiClient };
export default ApiClient;
