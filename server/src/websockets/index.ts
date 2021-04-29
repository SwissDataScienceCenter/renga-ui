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
import http from "http";
import ws from "ws";
import hash from "object-hash";
import ApiClient from "../api-client";


function websocketsSetup(server: http.Server, logger: winston.Logger, client: ApiClient): void {
  const wss = new ws.Server({ server });
  // ? REF: https://github.com/websockets/ws/blob/master/doc/ws.md

  // Emitted when the handshake is complete.
  wss.on("connection", function connection(socket, request) {
    const cookies = request.headers.cookie ?
      request.headers.cookie :
      "";

    const monitor = {
      sessions: {
        enabled: true,
        previous: null as string
      }
    };

    // Resource monitor
    // ? TMP DISABLED
    // // const interval = setInterval(() => {
    // //   const mex = cookies && cookies.length ?
    // //     cookies.substring(0, 30) :
    // //     "anonym";
    // //   logger.info("test, " + mex);

    // //   // business logic

    // //   // sessions
    // //   if (monitor.sessions.enabled) {
    // //     try {
    // //       const url = `${process.env.GATEWAY_URL}/notebooks/servers`;
    // //       // TODO: use got? https://www.npmjs.com/package/got
    // //       // ? check HERE for reference, but fetch may be good enough
    // //       // ? https://nodesource.com/blog/express-going-into-maintenance-mode
    // //       // ! TODO: from here
    // //       const serverPromise = fetch(url);
    // //       serverPromise.then(servers => {
    // //         const hashed = hash(servers);
    // //         if (monitor.sessions.previous !== null) {
    // //           if (hashed !== monitor.sessions.previous)
    // //             socket.send("{sessions: changed}");
    // //         }
    // //         monitor.sessions.previous = hashed;
    // //       });
    // //     }
    // //     catch (e) {
    // //       logger.info("Error! " + JSON.stringify(e));
    // //     }
    // //   }

    // // }, 3000);

    // // socket.on("close", (code, reason) => {
    // //   clearInterval(interval);
    // //   logger.info(`CLOSED with number ${code} for the following reason: ${reason}`);
    // // });

    socket.send("Connection enstablished");
    socket.on("message", async (message) => {
      logger.info(`Message received: ${message}`);
      socket.send(`Received: ${message}`);
      if (message === "servers") {
        socket.send(`COMMAND: checking servers`);
        // send back response
        const servers = await client.getNotebookServers(cookies);
        const length = Object.keys(servers) && Object.keys(servers).length ?
          Object.keys(servers).length :
          0;
        socket.send(`COMMAND: found ${length} servers`);
      }
    });
  });
}

export default { websocketsSetup };
