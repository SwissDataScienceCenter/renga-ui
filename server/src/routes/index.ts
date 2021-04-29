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

import express from "express";

function register(app: express.Application): void {
  // define a route handler for the default home page
  app.get("/", (req, res) => {
    res.send("Hello world!");
  });

  // define a route handler for the readiness probe
  app.get("/readiness", (req, res) => {
    res.send("ready");
  });

  // define a route handler for the liveness probe
  app.get("/liveness", (req, res) => {
    res.send("live");
  });

  // define a route handler for the ingress entry point
  app.get("/ui-server", (req, res) => {
    res.send("Hello ingress!");
  });
}

export default { register };
