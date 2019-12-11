export default function addDatasetMethods(client) {

  client.searchDatasets = (query) => {
    let url = `${client.baseUrl}/knowledge-graph/datasets?query=${query}`;
    url = url.replace('/api','');//The url should change in the backend so we don't have to do this
    const headers = client.getBasicHeaders();
    return client.clientFetch(url, {method:'GET', headers}).then((resp) => {
      return resp.data;
    });
  }

  client.uploadFiles = (files) => {

    let headers = client.getBasicHeaders();
    headers.append('Content-Type', 'multipart/form-data');
    headers.append('X-Requested-With', 'XMLHttpRequest');

    let formData = new FormData();
    formData.append("file", files[0]);


    return client.clientFetch(`${client.baseUrl}/renku/cache.files_upload`,{
      method: 'POST',
      headers: headers,
      query_string: JSON.stringify({
        override_existing: false,
        unpack_archive: false
      }),
      body: formData
      // body: JSON.stringify({
      //   files: { file: files[0] }
      // })
    })
  }

  client.postDataset = (projectPathWithNamespace, renkuDataset) => {
    let headers = client.getBasicHeaders();
    headers.append('Content-Type', 'application/json');
    headers.append('X-Requested-With', 'XMLHttpRequest');

    let project_id;

    return client.clientFetch(`${client.baseUrl}/renku/cache.project_clone`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        depth: 1,
        git_url: `https://dev.renku.ch/gitlab/${projectPathWithNamespace}.git`
        //TO-DO: this is a test URL--> CHANGE IT FOR THE REAL PROJECT URL
      })
    }).then(response => {
      project_id= response.data.result.project_id;
      console.log(project_id)
      //response.data.error
      return client.clientFetch(`${client.baseUrl}/renku/datasets.create`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          "dataset_name":renkuDataset.name,
          "description":renkuDataset.description,
          "project_id": project_id
        })
      })
    })
      .then(response => {

        console.log(renkuDataset.files.map((file) => {console.log(file); return { "file_id": file.file_id }}))
        return client.clientFetch(`${client.baseUrl}/renku/datasets.add`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            "dataset_name":renkuDataset.name,
            "files":renkuDataset.files,
            "project_id": project_id
          })
        })
      })
  }
}
