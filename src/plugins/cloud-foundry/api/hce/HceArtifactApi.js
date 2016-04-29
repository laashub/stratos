/* DO NOT EDIT: This code has been generated by swagger-codegen */
(function () {
  'use strict';

  angular
    .module('cloud-foundry.api')
    .run(registerApi);

  registerApi.$inject = [
    '$http',
    'app.api.apiManager'
  ];

  function registerApi($http, apiManager) {
    apiManager.register('cloud-foundry.api.HceArtifactApi', new HceArtifactApi($http));
  }

  /**
    * @constructor
    * @name HceArtifactApi
    * @description For more information on this API, please see:
    * https://github.com/hpcloud/hce-rest-service/blob/master/app/v2/swagger.yml
    * @param {object} $http - the Angular $http service
    * @property {object} $http - the Angular $http service
    * @property {string} baseUrl - the API base URL
    * @property {object} defaultHeaders - the default headers
    */
  function HceArtifactApi($http) {
    this.$http = $http;
    this.baseUrl = '/api/ce/v2';
    this.defaultHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };
  }

  angular.extend(HceArtifactApi.prototype, {
    /**
     * @name deleteArtifact
     * @description Deletes the artifact specified in the request params.
     * @param {!number} artifactId - The id of the artifact to delete.
     * @param {object} params - the query parameters
     * @returns {promise} A resolved/rejected promise
     */
    deleteArtifact: function (artifactId, params) {
      var path = this.baseUrl + '/artifacts/{artifact_id}'
        .replace('{' + 'artifact_id' + '}', artifactId);

      var config = {
        method: 'DELETE',
        url: path,
        params: params,
        headers: this.defaultHeaders
      };

      return this.$http(config);
    },

    /**
     * @name downloadArtifact
     * @description Download the file specified by the artifact id. This operation may result in a redirect.
     * @param {!number} artifactId - The id of the artifact to download.
     * @param {object} params - the query parameters
     * @returns {promise} A resolved/rejected promise
     */
    downloadArtifact: function (artifactId, params) {
      var path = this.baseUrl + '/artifacts/{artifact_id}/download'
        .replace('{' + 'artifact_id' + '}', artifactId);

      var config = {
        method: 'GET',
        url: path,
        params: params,
        headers: this.defaultHeaders
      };

      return this.$http(config);
    },

    /**
     * @name getArtifact
     * @description Get the artifact specified in request.
     * @param {!number} artifactId - The id of the artifact.
     * @param {object} params - the query parameters
     * @returns {promise} A resolved/rejected promise
     */
    getArtifact: function (artifactId, params) {
      var path = this.baseUrl + '/artifacts/{artifact_id}'
        .replace('{' + 'artifact_id' + '}', artifactId);

      var config = {
        method: 'GET',
        url: path,
        params: params,
        headers: this.defaultHeaders
      };

      return this.$http(config);
    },

    /**
     * @name getArtifacts
     * @description List the list of artifacts associated with the specified PipelineExecution.
     * @param {object} params - the query parameters
     * @returns {promise} A resolved/rejected promise
     */
    getArtifacts: function (params) {
      var path = this.baseUrl + '/artifacts';

      var config = {
        method: 'GET',
        url: path,
        params: params,
        headers: this.defaultHeaders
      };

      return this.$http(config);
    },

    /**
     * @name uploadArtifact
     * @description Upload an artifact for the specified PipelineExecution.
     * @param {object} data - the request form data
     * @param {object} params - the query parameters
     * @returns {promise} A resolved/rejected promise
     */
    uploadArtifact: function (data, params) {
      var path = this.baseUrl + '/artifacts';
      var headers = angular.extend({}, this.defaultHeaders);
      headers['Content-Type'] = 'application/x-gzip';

      var config = {
        method: 'POST',
        url: path,
        params: params,
        data: data,
        headers: headers
      };

      return this.$http(config);
    }
  });
})();
