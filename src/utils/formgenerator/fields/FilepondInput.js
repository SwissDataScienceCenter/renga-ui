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
import React, { useState, useEffect, useRef } from "react";
import { FormGroup, Label, Table, Spinner, Button } from "reactstrap";
import ValidationAlert from './ValidationAlert';
import HelpText from './HelpText';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { formatBytes } from './../../HelperFunctions'
import worker_script from './uploadfile';

function removeItems(arr, item) {
  for (var i = 0; i < item; i++) {
    arr.pop();
  }
}

function useFiles({ initialState = [], maxFiles = 150 }) {
  const [state, setState] = useState(initialState);
  function withBlobs(files) {
    const destructured = [...files];
    // if (destructured.length > maxFiles) {
    //   const difference = destructured.length - maxFiles;
    //   removeItems(destructured, difference);
    // }
    const blobs = destructured
      .map(file => {
        return file;
      })
      .filter(elem => elem !== null);
    setState(blobs);
  }
  return [state, withBlobs];
}

function getWorker(workers = []){
  if(workers.length === 0) return;

  let min_load_worker = workers[0];

  for(let i = 0; i<workers.length; i++){
    if (workers[i].load == 0)
      return workers[i];
    else if(workers[i].load < min_load_worker.load){
      min_load_worker = workers[i]
    }
  }
  return min_load_worker;
}

function getArrayOfWorkers(amount = 10, setUploadedFiles, setFilesErrors){
  console.log("getting array of workers")
  let workers = [];
  for(let i = 0; i<amount; i++){
    let worker = new Worker(worker_script);

    worker.onmessage= ev => {
      const response = ev.data;
      if (response.error !== undefined) {
        setFilesErrors(prevFilesErrors => [...prevFilesErrors, { file_name:response.file.name , file_size:response.file.size, file_error: response.error}])
        return [];
      } else {
        let request_file = response.file;
        let response_file = response.body.result.files[0];
        if(response_file.file_name !== undefined && response_file.file_name !== request_file.name){
          response_file = { 
            "file_name": response.file.name, 
            "file_size": response_file.file_size,
            "file_id": response_file.file_id,
            "file_alias": response_file.file_name
          }
        }
        setUploadedFiles(prevUploadedFiles => [...prevUploadedFiles, response_file]);
        return response_file;
      }
    }
    workers[i] = {worker: worker, load: 0, index:i};  
  }
  console.log(workers)
  return workers;
}

function FilePondInput({ name, label, type, value, alert, setInputs, help }) {
  
  const maxFiles = 10;
  const [over, setOver] = useState(false);
  const [files, setFiles] = useFiles({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [displayFiles, setDisplayFiles] = useState([]);
  const [filesErrors, setFilesErrors] = useState([]);
  const $input = useRef(null);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    console.log(workers);
    if(workers.length === 0)
      setWorkers(getArrayOfWorkers(10, setUploadedFiles, setFilesErrors));
  }, []);

  useEffect(() => {
    // action on update of uploadedFiles
    const artifitialEvent = {
      target: { name: name, value: uploadedFiles },
      isPersistent: () => false
    };
    setInputs(artifitialEvent);
    setDisplayFiles(prevDisplayFiles =>
      prevDisplayFiles.map(dFile => {
        let uploadingFile = uploadedFiles.find(uFile => uFile.file_name === dFile.file_name);
        if (uploadingFile !== undefined)
          return {
            file_name: uploadingFile.file_name,
            file_size: uploadingFile.file_size,
            file_id: uploadingFile.file_id,
            file_alias: uploadingFile.file_alias,
            //there is a problem here in uploadingFile.file.name because file is undefined
            file_error: filesErrors.find(file => file.file_name === uploadingFile.file.name)
          }
        return dFile;
      })
    )
  }, [uploadedFiles]);


  useEffect(() => {
    setDisplayFiles(prevDisplayFiles =>
      prevDisplayFiles.map(dFile => {
        let errorFile = filesErrors.find(eFile => eFile.file_name === dFile.file_name);
        if (errorFile !== undefined)
          return {
            file_name: errorFile.file_name,
            file_size: errorFile.file_size,
            file_id: null,
            file_error: errorFile.file_error,
            file_alias: errorFile.file_alias
          }
        return dFile;
      })
    )
  }, [filesErrors]);


  let uploadFile = (file) =>{ 
    console.log(workers);
    const worker = getWorker(workers);
    console.log(worker);
    worker.load = worker.load+1;
    worker.worker.postMessage([file]);
  }



  let deleteFile = (file_name) => {
    setFilesErrors(prevfilesErrors => prevfilesErrors.filter(file => file.file_name !== file_name));
    setDisplayFiles(prevDisplayFiles => prevDisplayFiles.filter(file => file.file_name !== file_name));
    setUploadedFiles(prevUploadedFiles => prevUploadedFiles.filter(file => file.file_name !== file_name));    
  }

  useEffect(() => {
    // // if (onDrop) {
    // //   onDrop(files);
    // // }
  }, [files]);
  return (
    <FormGroup>
      <Label htmlFor={name}>{label}</Label>
      <div
        // onClick={() => {
        //   $input.current.click();
        // }}
        onDrop={e => {
          e.preventDefault();
          e.persist();
          console.log("on drop")
          Array.from(e.dataTransfer.files).map(file => uploadFile(file));
          setFiles([...files, ...e.dataTransfer.files]);
          const newDisplayFiles = Array.from(e.dataTransfer.files)
            .map(file => ({
              file_name: file.name,
              file_id: null,
              file_size: file.size,
              file_error: undefined
            }))
          setDisplayFiles([...displayFiles, ...newDisplayFiles])
          setOver(false);
        }}
        onDragOver={e => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={e => {
          e.preventDefault();
          setOver(false);
        }}
        className={over ? "over" : ""}
      >
          
        <Table hover bordered className="table-files">
          <thead>
            <tr>
              <th className="font-weight-light text-center">#</th>
              <th className="font-weight-light">File Name</th>
              <th className="font-weight-light">File Size</th>
              <th className="font-weight-light">Status</th>
              <th className="font-weight-light"></th>
            </tr>
          </thead>
          <tbody>
            { displayFiles.map((file, index) => (
              <tr key={file.file_name + "file"} onClick={()=>{}}>
                <td className="text-center">{index + 1}</td>
                <td>
                  <span>{file.file_name}</span>
                  {file.file_alias ? <small><br></br><span className="text-danger"> *File was renamed to:{file.file_alias}</span></small> : null}
                </td>
                <td>{formatBytes(file.file_size)}</td>
                <td>{
                  file.file_id !== null ?
                    <span><FontAwesomeIcon color="var(--success)" icon={faCheck}/> uploaded</span>
                    : file.file_error !== undefined ?
                      <span><FontAwesomeIcon color="var(--danger)" icon={faTimes}/> {file.file_error}</span>
                      : <span><Spinner color="primary" size="sm" /> uploading</span>
                }</td>
                <td>
                  <FontAwesomeIcon  color="var(--danger)" icon={faTrashAlt} className="text-center" onClick={ () => deleteFile(file.file_name)}/>
                </td>
              </tr>
            ))
            }
            <tr>
              <td colSpan="5">
                &nbsp;
              </td>
            </tr>
          </tbody>
          <tfoot onClick={() => { $input.current.click();}}>
            <tr>
              <td colSpan="5">
                Drag and Drop files or click here to open file dialog.
              </td>
            </tr>
          </tfoot>
        </Table>
      </div>
     
      <input
        style={{ display: "none" }}
        type="file"
        ref={$input}
        onChange={e => {
          e.preventDefault();
          Array.from(e.target.files).map(file => uploadFile(file));
          setFiles([...files, ...e.target.files]);
          const newDisplayFiles = Array.from(e.target.files)
            .map(file => ({
              file_name: file.name,
              file_id: null,
              file_size: file.size,
              file_error: undefined
            }))
          setDisplayFiles([...displayFiles, ...newDisplayFiles])
        }}
        multiple={maxFiles > 1}
      />
      <HelpText content={help} />
      <ValidationAlert content={alert} />
    </FormGroup>
  );
}
export default FilePondInput;
