/*!
 * Copyright 2017 - Swiss Data Science Center (SDSC)
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
 *  incubator-renku-ui
 *
 *  DatasetNew.container.js
 *  Container components for new dataset.
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { datasetFormSchema } from "../../../model/RenkuModels";
import DatasetChange from "./DatasetChange.present";
import { JobStatusMap } from "../../../job/Job";
import { FILE_STATUS } from "../../../utils/formgenerator/fields/FileUploaderInput";
import FormGenerator from "../../../utils/formgenerator/";
import { mapDataset } from "../../../dataset/index";
import _ from "lodash";

let dsFormSchema = _.cloneDeep(datasetFormSchema);
function ChangeDataset(props) {

  if (dsFormSchema == null)
    dsFormSchema = _.cloneDeep(datasetFormSchema);


  const [datasetFiles, setDatasetFiles] = useState();
  const dataset = useMemo(() =>
    mapDataset(props.datasets ?
      props.datasets.find(dataset => dataset.name === props.datasetId)
      : undefined
    , undefined, datasetFiles)
  , [props.datasets, props.datasetId, datasetFiles]);
  const [serverErrors, setServerErrors] = useState(undefined);
  const [submitLoader, setSubmitLoader] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [jobsStats, setJobsStats] = useState(undefined);
  const [remoteBranch, setRemoteBranch] = useState(undefined);
  const warningOn = useRef(false);
  const datasetInRemoteBranch = useRef(false);

  dsFormSchema.files.uploadFileFunction = props.client.uploadFile;
  dsFormSchema.files.filesOnUploader = useRef(0);

  if (props.edit === false) {
    dsFormSchema.title.parseFun = () => {
      dsFormSchema.name.value = FormGenerator.Parsers.slugFromTitle(dsFormSchema.title.value);
      return dsFormSchema.title.value;
    };
    dsFormSchema.title.help = `${datasetFormSchema.title.help} ${datasetFormSchema.name.help}` ;
  }
  else {
    dsFormSchema.title.help = datasetFormSchema.title.help;
    dsFormSchema.title.parseFun = undefined;
  }

  const onCancel = e => {
    props.history.push({ pathname: `/projects/${props.projectPathWithNamespace}/datasets` });
  };

  function setNewJobStatus(localJob, remoteJobsList) {
    let remoteJob = remoteJobsList.find(newJob => newJob.job_id === localJob.job_id);
    if (remoteJob !== undefined) {
      localJob.job_status = remoteJob.state;
      localJob.extras = remoteJob.extras;
    }
  }

  function checkJobsAndSetWarnings(jobsList, tooLong = false, remote_branch) {
    let failed = jobsList.filter(job => job.job_status === JobStatusMap.FAILED );
    let inProgress = jobsList
      .filter(job => (job.job_status === JobStatusMap.IN_PROGRESS || job.job_status === JobStatusMap.ENQUEUED) );

    if (remote_branch) {
      datasetInRemoteBranch.current = true;
      setRemoteBranch(remote_branch);
    }

    if (failed.length !== 0 || inProgress.length !== 0 || tooLong === true) {
      setJobsStats({ failed, inProgress, tooLong });
      warningOn.current = true;
      setSubmitLoader(false);
    }
  }

  function getJobsStats(jobsList) {
    const failed = jobsList.filter(job => job.job_status === JobStatusMap.FAILED);
    const completed = jobsList.filter(job => job.job_status === JobStatusMap.COMPLETED);
    const inProgress = jobsList.filter(job =>
      (job.job_status === JobStatusMap.IN_PROGRESS || job.job_status === JobStatusMap.ENQUEUED));
    return { failed, completed, inProgress, finished: inProgress.length === 0 };
  }

  const monitorURLJobsStatuses = (datasetsJobsArray) => {
    return props.client.getAllJobStatus()
      .then(response => {
        // we set the new status and then we check if they are all finished (completed or failed)
        datasetsJobsArray.map(localJob => setNewJobStatus(localJob, response.jobs));
        return getJobsStats(datasetsJobsArray);
      });
  };

  const redirectAfterSuccess = (interval, datasetId) => {
    setSubmitLoader(false);
    if (interval !== undefined) clearInterval(interval);
    props.fetchDatasets(true);
    props.history.push({
      pathname: `/projects/${props.projectPathWithNamespace}/datasets/${datasetId}/`
    });
  };

  const getCreator = (creator)=>{
    let newCreator = { name: creator.name };
    if (creator.email)
      newCreator.email = creator.email;
    if (creator.affiliation)
      newCreator.affiliation = creator.affiliation;
    return newCreator;
  };

  const submitCallback = e => {
    setServerErrors(undefined);
    setSubmitLoader(true);
    const dataset = {};
    dataset.name = dsFormSchema.name.value;
    dataset.title = dsFormSchema.title.value;
    dataset.description = dsFormSchema.description.value;

    const pendingFiles = dsFormSchema.files.value
      .filter(f => f.file_status === FILE_STATUS.PENDING).map(f => ({ "file_url": f.file_name }));
    dataset.files = [].concat.apply([], dsFormSchema.files.value
      .filter(f => f.file_status !== FILE_STATUS.PENDING && f.file_status !== FILE_STATUS.ADDED)
      .map(f => f.file_id)).map(f => ({ "file_id": f }));

    dataset.files = [...dataset.files, ...pendingFiles];
    dataset.keywords = dsFormSchema.keywords.value;
    dataset.creators = dsFormSchema.creators.value
      .map(creator => getCreator(creator));

    props.client.postDataset(props.httpProjectUrl, dataset, props.edit)
      .then(response => {
        if (response.data.error !== undefined) {
          setSubmitLoader(false);
          setServerErrors(response.data.error.reason);
        }
        else {
          let filesURLJobsArray = [];

          if (response.data.result.files) {
            response.data.result.files.map(file => {
              if (file.job_id !== undefined)
                filesURLJobsArray.push({ job_id: file.job_id, file_url: file.file_url, job_status: null });
              return file;
            });
          }

          let cont = 0;
          const INTERVAL = 6000;
          const remote_branch = response.data.result.remote_branch;

          let monitorJobs = setInterval(() => {
            if (filesURLJobsArray.length === 0) {
              if (remote_branch) {
                setRemoteBranch(remote_branch);
                datasetInRemoteBranch.current = true;
                setSubmitLoader(false);
                clearInterval(monitorJobs);
              }
              else { redirectAfterSuccess(monitorJobs, dataset.name); }
            }
            else {
              monitorURLJobsStatuses(filesURLJobsArray).then(jobsStats => {
                if (jobsStats.finished) {
                  if (jobsStats.failed.length === 0) {
                    if (remote_branch) {
                      setRemoteBranch(remote_branch);
                      datasetInRemoteBranch.current = true;
                      setSubmitLoader(false);
                      clearInterval(monitorJobs);
                    }
                    else { redirectAfterSuccess(monitorJobs, dataset.name); }
                  }
                  else {
                    //some or all failed, but all finished
                    checkJobsAndSetWarnings(filesURLJobsArray, false, remote_branch);
                    clearInterval(monitorJobs);
                  }
                }
              });
            }

            if (cont >= 20) {
              checkJobsAndSetWarnings(filesURLJobsArray, true);
              clearInterval(monitorJobs);
            }
            cont++;
          }, INTERVAL);
        }
      });
  };

  useEffect(() => {
    let unmounted = false;
    if (props.edit) {
      if (!initialized && dataset !== undefined) {
        props.client.fetchDatasetFilesFromCoreService(dataset.name, props.httpProjectUrl)
          .then(response => {
            if (!unmounted && datasetFiles === undefined) {
              if (response.data.result) {
                dsFormSchema.files.uploadFileFunction = props.client.uploadFile;
                dsFormSchema.name.value = dataset.name;
                dsFormSchema.title.value = dataset.title;
                dsFormSchema.description.value = dataset.description;
                dsFormSchema.creators.value = dataset.published.creator.map(
                  creator => creator.email === props.user.data.email ?
                    {
                      name: creator.name,
                      email: creator.email,
                      affiliation: creator.organization,
                      default: true
                    }
                    : creator);
                if (dsFormSchema.creators.value.find(creator =>
                  creator.email === props.user.data.email) === undefined) {
                  dsFormSchema.creators.value.push({
                    name: props.user.data.name,
                    email: props.user.data.email,
                    affiliation: props.user.data.organization,
                    default: true
                  });
                }
                dsFormSchema.keywords.value = dataset.keywords;
                dsFormSchema.files.value = response.data.result.files
                  .map(file => ({ name: file.name, atLocation: file.path, file_status: "added" }));
                setInitialized(true);
              }
              else { setDatasetFiles(response.data); }
            }
          });
      }
    }
    else {
      setInitialized(true);
      dsFormSchema.name.value = dsFormSchema.name.initial;
      dsFormSchema.title.value = dsFormSchema.title.initial;
      dsFormSchema.description.value = dsFormSchema.description.initial;
      dsFormSchema.files.value = dsFormSchema.files.initial;
      dsFormSchema.creators.value = [
        {
          name: props.user.data.name,
          email: props.user.data.email,
          affiliation: props.user.data.organization,
          default: true
        }
      ];
      dsFormSchema.keywords.value = dsFormSchema.keywords.initial;
    }
  }, [props, initialized, dataset, datasetFiles,
    setDatasetFiles, props.client]);

  return <DatasetChange
    initialized={initialized}
    datasetFormSchema={dsFormSchema}
    accessLevel={props.accessLevel}
    serverErrors={serverErrors}
    submitCallback={submitCallback}
    submitLoader={submitLoader}
    onCancel={onCancel}
    warningOn={warningOn}
    datasetInRemoteBranch={datasetInRemoteBranch}
    jobsStats={jobsStats}
    remoteBranch={remoteBranch}
    overviewCommitsUrl={props.overviewCommitsUrl}
    mergeRequestsOverviewUrl={props.mergeRequestsOverviewUrl}
    edit={props.edit}
  />;
}

export default ChangeDataset;
