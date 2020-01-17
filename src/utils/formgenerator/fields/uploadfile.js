const workercode = () => {
  /* eslint-disable-next-line no-restricted-globals */
  self.onmessage = function(message) {

    const file = message.data[0];

    const data = new FormData();
    data.append('file', file);
    data.append('file_name', file.name);

    let headers = new Headers({
      'credentials': 'same-origin',
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json'
    });

    fetch('https://virginia.dev.renku.ch/api/renku/cache.files_upload?override_existing=true', {
      method: 'POST',
      headers: headers,
      body: data,
      processData: false
    }).then((response) => {
      if(response.status >=400) 
      /* eslint-disable-next-line no-restricted-globals */
        self.postMessage({file:file, error:"Error uploading the file. "+response.status });
      else
        response.json().then((body) => {
          /* eslint-disable-next-line no-restricted-globals */
          self.postMessage({body: body, file:file});
        })
    }).catch((error) => {
      /* eslint-disable-next-line no-restricted-globals */
      self.postMessage({file:file, error:"Error uploading the file."})
    })
  }
}


let code = workercode.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

const blob = new Blob([code], { type: "application/javascript" });
const worker_script = URL.createObjectURL(blob);

export default worker_script;

  // let uploadFile = (file) => {
  //   const data = new FormData();
  //   data.append('file', file);
  //   data.append('file_name', file.name);

  //   let headers = new Headers({
  //     'credentials': 'same-origin',
  //     'X-Requested-With': 'XMLHttpRequest',
  //     'Accept': 'application/json'
  //   });

  //   return fetch('https://virginia.dev.renku.ch/api/renku/cache.files_upload?override_existing=true', {
  //     method: 'POST',
  //     headers: headers,
  //     body: data,
  //     processData: false
  //   }).then((response) => {
  //     if(response.status >=400) throw new Error();
  //     response.json().then((body) => {
  //       if (body.error) {
  //         setFilesErrors(prevFilesErrors => [...prevFilesErrors, { file_name:file.name , file_size:file.size, file_error: body.error.reason}])
  //         return [];
  //       } else {
  //         let new_file = body.result.files[0]//Object.keys(body.result.files).map((key) => body.result.files[key]);
  //         if(body.result.files[0].file_name !== undefined && body.result.files[0].file_name !== file.name){
  //           new_file = { 
  //             "file_name": file.name, 
  //             "file_size": new_file.file_size,
  //             "file_id": new_file.file_id,
  //             "file_alias": new_file.file_name
  //           }
  //         }
  //         setUploadedFiles(prevUploadedFiles => [...prevUploadedFiles, new_file]);
  //         return new_file;
  //       }
  //     });
  //   }).catch((error) => {
  //     setFilesErrors(prevFilesErrors => [...prevFilesErrors, { file_name:file.name , file_size:file.size, file_error: "Error uploading the file."}])
  //     return [];
  //   })
  // }
