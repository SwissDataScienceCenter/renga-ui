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
 *  FilePondInput.js
 *  Presentational components.
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import ValidationAlert from './ValidationAlert';
import HelpText from './HelpText';
import { FormGroup, Label, Input , Alert} from 'reactstrap';
import { FilePond } from 'react-filepond';

function FilePondInput({ name, label, type, value, alert, setInputs, help }) {
  
  const [files, setFiles] = useState([]);
  const [uploadInput, setUploadInput] = useState('');

  let handleUploadImage = (ev) => {
    ev.preventDefault();

    const data = new FormData();
    data.append('file', uploadInput.files[0]);
    data.append('file_name', uploadInput.files[0].name);

    let headers = new Headers({
      'credentials': 'same-origin',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json'
    });
    

    fetch('https://virginia.dev.renku.ch/api/core/renku/files-upload', {
      method: 'POST',
      headers: headers,
      body: data,
      processData: false,
    }).then((response) => {
      response.json().then((body) => {
        console.log(body.result.files["0"]);
        const resultFiles = body.result.files["0"];
        setFiles([...files, resultFiles]);
        console.log(files);
        const artifitialEvent = { 
          target : { name: name , value: files}, 
          isPersistent : () => false } ;
        setInputs(artifitialEvent);
      });
    });
  }



  return (

    ///WORKKKKKKKKSSSSSS
    <div>
      <div>
      {files.map((file, index) => (
        <div key={index.toString()}>
          <Alert color="success">
            {file.file_name}
          </Alert>
        </div>
      ))}
    </div>
  
    <form onSubmit={handleUploadImage} encType="multipart/form-data">
      <input ref={(ref) => { setUploadInput(ref) }} type="file" />
      <button>Upload</button>
    </form>
    </div>
    ///WORKKKKKKKKSSSSSS
 //<form onSubmit={handleUploadImage} encType="multipart/form-data">
    //  <FormGroup>
    //   <Label htmlFor={name}>{label}</Label>
    //   <Input id={name} name={name} type="file" value={value || ""} onChange={setInputs}/>
    //   <HelpText content={help} />
    //   <ValidationAlert content={alert} />
    // </FormGroup> 
    // <FormGroup>
    //   <Label htmlFor={name}>{label}</Label>
    //   <MyUploader />
      // <FilePond
      //  id={name}
      //  files={value}
      //  allowMultiple={true}
        //server={{
        //   // fake server to simulate loading a 'local' server file and processing a file
        //   process: (fieldName, file, metadata, load) => {
        //     console.log("process")
        //     // simulates uploading a file
        //     setTimeout(() => {
        //       load(Date.now());
        //     }, 1500);
        //   },
        //   load: (source, load) => {
        //     console.log(source);
        //     console.log(load);
        //     console.log("loadddd")
        //     // simulates loading a file from the server
        //     fetch(source)
        //       .then(res => {
        //         console.log(res);
        //         return res.blob();
        //       })
        //       .then(blob => {
        //         console.log(blob);
        //         return load(blob);
        //       });
        //   }
        // }}
    //     server={{
    //       load: () => {
    //         console.log("on llllooooad")
    //       },
    //       process: (fieldName, file, metadata, load, error, progress, abort, transfer, options) => {
    //         // fieldName is the name of the input field
    //         // file is the actual file object to send
    //         const formData = new FormData();
    //         formData.append('file', file);
    //         formData.append('file_name', file.name);

    //         const request = new XMLHttpRequest();
    //         request.open('POST', 'https://virginia.dev.renku.ch/api/core/cache/files-upload');
    //         //request.setRequestHeader('Content-Type', 'multipart/form-data');
    //       //  request.setRequestHeader('credentials', 'same-origin');
    //         request.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest');
    //         request.setRequestHeader('Accept', 'application/json')

    //         // Should call the progress method to update the progress to 100% before calling load
    //         // Setting computable to false switches the loading indicator to infinite mode
    //         request.upload.onprogress = (e) => {
    //             progress(e.lengthComputable, e.loaded, e.total);
    //         };

    //         // Should call the load method when done and pass the returned server file id
    //         // this server file id is then used later on when reverting or restoring a file
    //         // so your server knows which file to return without exposing that info to the client
    //        request.onload = function() {
    //             if (request.status >= 200 && request.status < 300) {
    //               console.log(request)
    //               const body = JSON.parse(request.response);
    //                 // console.log(body);
    //                 // console.log(body.result.files[0].file_id)
    //                 // console.log(body.result.files[0]);
    //                 // setImageURL(body.result.files[0].file_id);
    //                 const artifitialEvent = { 
    //                   target : { name: name , value: body.result.files}, 
    //                   isPersistent : () => false } ;
    //                 setInputs(artifitialEvent);
    //                 progress(true, 0, 1024);
    //                 // console.log("HEREEEEEEE")
    //                 // // the load method accepts either a string (id) or an object
    //                 // console.log(body.result.files[0].file_id);
    //                 // console.log(file)
    //                 // console.log(body.result.files);

    //                 //load(null);
    //                 //load(body.result.files[0].file_id);
    //                // load(request.responseText);// the load method accepts either a string (id) or an object
    //             }
    //             else {
    //                 // Can call the error method if something is wrong, should exit after
    //                 error('oh no');
    //             }
    //         };

    //         request.send(formData);
            
    //         // Should expose an abort method so the request can be cancelled
    //         return {
    //             abort: () => {
    //                 // This function is entered if the user has tapped the cancel button
    //                 request.abort();

    //                 // Let FilePond know the request has been cancelled
    //                 abort();
    //             }
    //         };
    //     }
    //     }}
    //     onupdatefiles={
    //       ( fileItems ) => {
    //         const artifitialEvent = { 
    //           target : { name: name , value:  fileItems.map(fileItem => fileItem.file)}, 
    //           isPersistent : () => false } ;
    //         setInputs(artifitialEvent);
    //       } 
    //     }
    //     labelIdle="Drag Drop your files or click to browse." /> */}
    //   <HelpText content={help} />
    // 	<ValidationAlert content={alert} 	/>
    // </FormGroup>
    // </form> */}
  )
}

export default FilePondInput;
