import { TestBed, async, inject } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { BaseRequestOptions, Http, RequestMethod, Response, ResponseOptions } from '@angular/http';

import { UserInfoResponse } from '../../models/UserInfo';
import { YipeeFileService } from './yipee-file.service';
import { YipeeFileMetadataRaw } from '../../models/YipeeFileMetadataRaw';
import * as yf from '../../models/YipeeFileRaw';
import { OpenShiftFile } from '../../models/OpenShiftFile';
import { KubernetesFile } from '../../models/KubernetesFile';
import { OpenShiftFileResponse } from '../../models/OpenShiftFileResponse';
import { KubernetesFileResponse } from '../../models/KubernetesFileResponse';
import { YipeeFileResponse } from '../../models/YipeeFileResponse';
import { AuthResponse } from '../../models/AuthResponse';
import { LogoutResponse } from '../../models/LogoutResponse';
import { ApiService } from './api.service';

describe('ApiService', () => {

  const rawYipeeFile1: any = {
    'appinfo': {
      'name': 'randy-test-services',
      'readme': 'This is the readme that supports markdown.',
      'description': 'Description.'
    },
    'networks': [{
      'public': false,
      'name': 'private'
    }],
    'volumes': [],
    'services': [{
      'not_in_interface': 'foo',
      'number_nii': 6,
      'object_not_in_interface': {
        'foo': 'bar',
        'name': 'hello'
      },
      'labels': ['label=value'],
      'restart': 'always',
      'name': 'mariadb',
      'volumes': [],
      'networks': [{
        'aliases': [],
        'name': 'default'
      }],
      'ports': ['8080:80'],
      'build': 'build',
      'healthcheck': {
        'retries': 10,
        'timeout': 30,
        'interval': 60,
        'healthcmd': ['param1', 'param2']
      },
      'image': 'mariadb:latest',
      'annotations': {
        'description': 'MariaDB is a community-developed fork of MySQL intended to remain free under the GNU GPL.',
        'override': 'none'
      },
      'environment': ['ENV_VAR=value'],
      'deploy': {
        'mode': 'allnodes'
      }
    }, {
      'name': 'postgres',
      'not_in_interface': 'foo',
      'number_nii': 6,
      'object_not_in_interface': {
        'foo': 'bar',
        'name': 'hello'
      },
      'build': 'build',
      'networks': [{
        'aliases': [],
        'name': 'private'
      }],
      'volumes': [],
      'depends_on': ['mariadb'],
      'annotations': {
        'description': 'The PostgreSQL object-relational database system provides reliability and data integrity.',
        'override': 'none'
      },
      'image': 'postgres:latest'
    }],
    'secrets': [{
      'name': 'Secret1',
      'file': '/boo',
      'annotations': {
        'secret_config': {
          'file': '/boo',
          'externalName': 'true'
        }
      }
    }, {
      'name': 'Secret2',
      'external': true,
      'annotations': {
        'secret_config': {
          'file': '',
          'externalName': 'true'
        }
      }
    }]
  };

  const rawYipeeFile2: any = {
    'networks': [{
      'name': 'frontend'
    }, {
      'public': false,
      'name': 'backend',
      'annotations': {
        'description': '[insert description of network here]'
      }
    }],
    'volumes': [{
      'driver': 'nfs',
      'driver_opts': [{
        'name': 'vol_key1',
        'value': 'vol_val1'
      }, {
        'name': 'vol_key2',
        'value': 'vol_val2'
      }],
      'name': 'volume_0'
    }],
    'services': [{
      'name': 'wordpress',
      'command': ['haproxy', '-f', '/usr/local/etc/haproxy/haproxy.cfg'],
      'depends_on': ['mysql'],
      'volumes': [],
      'networks': [{
        'aliases': ['barf', 'alot'],
        'name': 'frontend'
      }, {
        'aliases': ['barf', 'alot'],
        'name': 'backend'
      }],
      'entrypoint': ['sh', '-c'],
      'image': 'haproxy:1.7.2-alpine',
      'annotations': {
        'description': '[insert description of service here]'
      }
    }, {
      'name': 'mysql',
      'networks': [{
        'aliases': [],
        'name': 'backend'
      }],
      'volumes': ['volume_0:/foo:ro'],
      'image': 'anotherrepo/mysql-image:xxxx',
      'annotations': {
        'description': '[insert description of service here]'
      }
    }, {
      'labels': ['someLabel=someLabelValue'],
      'restart': 'unless-stopped',
      'name': 'redis',
      'command': '/also_no_idea_what_command_might_be',
      'volumes': ['/somepath:/localpath/directory'],
      'logging': {
        'driver': 'someloggingdriver',
        'options': [{
          'name': 'logkey1',
          'value': 'logval1'
        }]
      },
      'networks': [{
        'aliases': [],
        'name': 'backend'
      }],
      'ports': ['8080:9090'],
      'build': 'somebuilddirectivewords',
      'entrypoint': '/no_idea_what_entrypoint_might_be',
      'image': 'redis:latest',
      'annotations': {
        'description': '[insert description of service here]'
      },
      'environment': ['envvar1=envval1']
    }],
    'appinfo': {
      'logo': '[insert name of app logo image here]',
      'name': '[insert app name here]',
      'description': '[insert app description here]'
    }
  };

  const openShiftFile1: OpenShiftFile = {
    openShiftFile: 'openShiftFile1',
    name: 'openShiftFile1',
    version: 2
  };

  const kubernetesFile1: KubernetesFile = {
    kubernetesFile: 'kubernetesFile1',
    name: 'kubernetesFile1',
    version: 2
  };

  const openShiftFileResponse1: OpenShiftFileResponse = {
    success: true,
    total: 1,
    data: [openShiftFile1]
  };

  const kubernetesFileResponse1: KubernetesFileResponse = {
    success: true,
    total: 1,
    data: [kubernetesFile1]
  };

  const yipeeMetadata: YipeeFileMetadataRaw = YipeeFileService.newTestYipeeFileMetadata('doggy').toRaw();

  const yipeeFileResponse: YipeeFileResponse = {
    success: true,
    total: 1,
    data: [yipeeMetadata]
  };

  const userInfo1: UserInfoResponse = {
    loggedIn: true,
    userInfo: {
      githubUsername: 'copan02',
      avatarURL: 'https://avatars.github-isl-01.ca.com/u/4187?',
      activatedOn: '2017-09-19T14:50:51.307374+00:00'
    },
    permissions: {
      userId: 'd2587542-97c9-11e7-b422-73953baaabfc',
      id: 'copan02',
      viewYipeeCatalog: true,
      yipeeTeamMember: false,
      terms: true,
      paidUser: false,
      downloadKubernetesFiles: false
    }
  };
  /* ----------------------------- */
  /* BEGIN METHOD RESPONSE OBJECTS */
  /* ----------------------------- */

  const loginResponse: AuthResponse = {
    authenticated: true,
    githubUsername: 'copan02',
    registered: true
  };

  const logoutResponse: LogoutResponse = {
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/',
  };

  const githubIdResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/configurations/CLIENT_ID',
    _body: {
      success: true,
      total: 1,
      data: [{
        _id: '398c8dba-97c1-11e7-9967-f753811b2bc4',
        key: 'CLIENT_ID',
        val: '1930325ba3a90de9bfa0'
      }]
    }
  };

  const githubHostResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/configurations/GITHUB_HOST',
    _body: {
      success: true,
      total: 1,
      data: [{
        _id: '398d02b8-97c1-11e7-9967-73769d8de375',
        key: 'GITHUB_HOST',
        val: 'github-isl-01.ca.com'
      }]
    }
  };

  const yipeeStoreResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/configurations/GITHUB_HOST',
    _body: {
      success: true,
      total: 1,
      data: [{
        _id: '398d02b8-97c1-11e7-9967-73769d8de375',
        key: 'yipeeStore',
        val: 'cannot-find-where-function-is-used'
      }]
    }
  };

  const yipeeAppsResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/yipeefiles/myapps',
    _body: {
      success: true,
      total: 1,
      data: [yipeeMetadata]
    }
  };

  const validateGithubIdResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/query',
    _body: {
      data: {
        userByIdentity: {
          id: 'c1f2b694-97d9-11e7-9215-73a85b907ae8'
        }
      }
    }
  };

  // Making multiple of same object for responses, as these may need to change with time.
  // The reason for this is the headers are not included to save space and are not currently
  // needed for the mock backend response.
  const updateOrgPermissionsResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/query',
    _body: {
      data: {
        updateOrg: {
          errors: []
        }
      }
    }
  };

  const removeUserFromOrgResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/query',
    _body: {
      data: {
        updateOrg: {
          errors: []
        }
      }
    }
  };

  const addUserToOrgResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/query',
    _body: {
      data: {
        updateOrg: {
          errors: []
        }
      }
    }
  };

  const updateOrgNameResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/query',
    _body: {
      data: {
        updateOrg: {
          errors: []
        }
      }
    }
  };

  const createOrgResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/query',
    _body: {
      data: {
        addTeam: {
          errors: []
        }
      }
    }
  };

  const downloadOpenShiftResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/yipeefiles/6a379f42-9d50-11e7-99a2-e3878023cbd7/compose',
    _body: {
      openShiftFileResponse1
    }
  };

  const downloadKubernetesResponse = {
    headers: {
      Headers: { _headers: [], _normalizedNames: [] }
    },
    ok: true,
    status: 200,
    statusText: 'OK',
    type: 2,
    url: 'http://localhost:8080/api/yipeefiles/6a379f42-9d50-11e7-99a2-e3878023cbd7/compose',
    _body: {
      kubernetesFileResponse1
    }
  };

  /* --------------------------- */
  /* END METHOD RESPONSE OBJECTS */
  /* --------------------------- */

  const userInfoResponse = userInfo1;
  const deleteAppResponse = yipeeFileResponse;
  const makePublicResponse = yipeeFileResponse;
  const newAppResponse = yipeeFileResponse;
  const updateAppResponse = yipeeFileResponse;
  const importAppResponse = yipeeFileResponse;
  const getAppResponse = yipeeFileResponse;

  const githubCode = '45454545';
  const userId = 'testy02';
  const orgName = 'Team1';
  const appId = '6a379f42-9d50-11e7-99a2-e3878023cbd7';
  const orgId = 'ca804b54-97da-11e7-8353-571828076bea';
  const loginStatusTrue = { loggedIn: true };
  const isAdmin = true;
  const isWriter = true;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        ApiService,
        MockBackend,
        BaseRequestOptions,
        {
          provide: Http,
          useFactory: (backend: MockBackend, defaultOptions: BaseRequestOptions) => {
            return new Http(backend, defaultOptions);
          },
          deps: [MockBackend, BaseRequestOptions]
        },
      ]
    });
  });

  it('should be created', inject([ApiService], (service: ApiService) => {
    expect(service).toBeTruthy();
  }));

  /* ----------------------------- */
  /* AUTHENTICATION ENDPOINT TESTS */
  /* ----------------------------- */

  it('should login to yipee given a github code', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        authenticated: true,
        githubUsername: 'copan02',
        registered: true
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.loginToYipee(githubCode).subscribe(data => {
      expect(data).toEqual(loginResponse);
    });
  }));

  it('should logout to yipee homepage', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    /* only mocking out the status code here since thats what the API service
    uses right now, theres not much point in mocking much else. In the future
    we can mock an error code and error other than 200 to test the error handler */
    const response = new ResponseOptions({
      status: 200,
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.logoutOfYipee().subscribe(data => {
      expect(data).toEqual(true);
    });
  }));

  it('should return loginStatus', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({ loggedIn: true })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.getLoginStatus().subscribe(data => {
      expect(data).toEqual(loginStatusTrue.loggedIn);
    });
  }));

  /* --------------------------------- */
  /* END AUTHENTICATION ENDPOINT TESTS */
  /* --------------------------------- */

  /* ---------------------------------------- */
  /* APPLICATION CONFIGURATION ENDPOINT TESTS */
  /* ---------------------------------------- */

  it('should return github client ID', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        headers: {
          Headers: { _headers: [], _normalizedNames: [] }
        },
        ok: true,
        status: 200,
        statusText: 'OK',
        type: 2,
        url: 'http://localhost:8080/api/configurations/CLIENT_ID',
        success: true,
        total: 1,
        data: [{
          _id: '398c8dba-97c1-11e7-9967-f753811b2bc4',
          key: 'CLIENT_ID',
          val: '1930325ba3a90de9bfa0'
        }]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.getGithubClientID().subscribe(data => {
      expect(data).toEqual(githubIdResponse._body.data[0].val);
    });
  }));

  it('should return analytics key', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        headers: {
          Headers: { _headers: [], _normalizedNames: [] }
        },
        ok: true,
        status: 200,
        statusText: 'OK',
        type: 2,
        url: 'http://localhost:8080/api/configurations/ANALYTICS_KEY',
        success: true,
        total: 1,
        data: [{
          _id: '498c8dba-97c1-11e7-9967-f753811b2bc4',
          key: 'ANALYTICS_KEY',
          val: '42'
        }]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.getAnalyticsKey().subscribe(data => {
      expect(data).toEqual('42');
    });
  }));

  it('should return github client Host', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        headers: {
          Headers: { _headers: [], _normalizedNames: [] }
        },
        ok: true,
        status: 200,
        statusText: 'OK',
        type: 2,
        url: 'http://localhost:8080/api/configurations/GITHUB_HOST',
        success: true,
        total: 1,
        data: [{
          _id: '398d02b8-97c1-11e7-9967-73769d8de375',
          key: 'GITHUB_HOST',
          val: 'github-isl-01.ca.com'
        }]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.getGitHubClientHost().subscribe(data => {
      expect(data).toEqual(githubHostResponse._body.data[0].val);
    });
  }));

  it('should return yipee store repo', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        headers: {
          Headers: { _headers: [], _normalizedNames: [] }
        },
        ok: true,
        status: 200,
        statusText: 'OK',
        type: 2,
        url: 'http://localhost:8080/api/configurations/GITHUB_HOST',
        success: true,
        total: 1,
        data: [{
          _id: '398d02b8-97c1-11e7-9967-73769d8de375',
          key: 'yipeeStore',
          val: 'cannot-find-where-function-is-used'
        }]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.getYipeeStoreRepo().subscribe(data => {
      expect(data).toEqual(yipeeStoreResponse._body.data[0].val);
    });
  }));

  /* -------------------------------------------- */
  /* END APPLICATION CONFIGURATION ENDPOINT TESTS */
  /* -------------------------------------------- */

  /* ------------------- */
  /* USER ENDPOINT TESTS */
  /* ------------------- */

  it('should return userInfo', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        loggedIn: true,
        userInfo: {
          githubUsername: 'copan02',
          avatarURL: 'https://avatars.github-isl-01.ca.com/u/4187?',
          activatedOn: '2017-09-19T14:50:51.307374+00:00'
        },
        permissions: {
          userId: 'd2587542-97c9-11e7-b422-73953baaabfc',
          id: 'copan02',
          viewYipeeCatalog: true,
          yipeeTeamMember: false,
          terms: true,
          paidUser: false,
          downloadKubernetesFiles: false
        }
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.getUserInfo().subscribe(data => {
      expect(data).toEqual(userInfoResponse);
    });
  }));

  it('should return githubUsername is valid in yipee and return the id', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        headers: {
          Headers: { _headers: [], _normalizedNames: [] }
        },
        ok: true,
        status: 200,
        statusText: 'OK',
        type: 2,
        url: 'http://localhost:8080/api/query',
        data: {
          userByIdentity: {
            id: 'c1f2b694-97d9-11e7-9215-73a85b907ae8'
          }
        }
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.validateGithubId(userId).subscribe(data => {
      expect(data).toEqual(validateGithubIdResponse._body.data.userByIdentity.id);
    });
  }));

  it('should return githubUsername is invalid in yipee and return null', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        headers: {
          Headers: { _headers: [], _normalizedNames: [] }
        },
        ok: true,
        status: 200,
        statusText: 'OK',
        type: 2,
        url: 'http://localhost:8080/api/query',
        data: {
          userByIdentity: null
        }
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.validateGithubId(userId).subscribe(data => {
      expect(data).toEqual(null);
    });
  }));

  /* ----------------------- */
  /* END USER ENDPOINT TESTS */
  /* ----------------------- */
  /* ---------------------- */
  /* CATALOG ENDPOINT TESTS */
  /* ---------------------- */

  it('should return private applications', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        headers: {
          Headers: { _headers: [], _normalizedNames: [] }
        },
        ok: true,
        status: 200,
        statusText: 'OK',
        type: 2,
        url: 'http://localhost:8080/api/yipeefiles/myapps',
        success: true,
        total: 1,
        data: [yipeeMetadata]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.getPrivateApps().subscribe(data => {
      expect(data).toEqual(yipeeAppsResponse._body.data);
    });
  }));

  it('should return public applications', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        headers: {
          Headers: { _headers: [], _normalizedNames: [] }
        },
        ok: true,
        status: 200,
        statusText: 'OK',
        type: 2,
        url: 'http://localhost:8080/api/yipeefiles/myapps',
        success: true,
        total: 1,
        data: [yipeeMetadata]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.getPublicApps().subscribe(data => {
      expect(data).toEqual(yipeeAppsResponse._body.data);
    });
  }));

  it('should make an application public', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        success: true,
        total: 1,
        data: [yipeeMetadata]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.makePublic(appId).subscribe(data => {
      expect(data).toEqual(makePublicResponse);
    });
  }));

  it('should import an application using a compose file', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        success: true,
        total: 1,
        data: [yipeeMetadata]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.importApp(yipeeMetadata.uiFile).subscribe(data => {
      expect(data).toEqual(importAppResponse);
    });
  }));

  /* -------------------------- */
  /* END CATALOG ENDPOINT TESTS */
  /* -------------------------- */

  /* ------------------------------- */
  /* DOWNLOAD SERVICE ENDPOINT TESTS */
  /* ------------------------------- */

  it('should download a kubernetes file', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        headers: {
          Headers: { _headers: [], _normalizedNames: [] }
        },
        ok: true,
        status: 200,
        statusText: 'OK',
        type: 2,
        url: 'http://localhost:8080/api/yipeefiles/6a379f42-9d50-11e7-99a2-e3878023cbd7/compose',
        success: true,
        total: 1,
        data: [kubernetesFile1]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.getKubernetesFileData(rawYipeeFile1).subscribe(data => {
      expect(data).toEqual(downloadKubernetesResponse._body.kubernetesFileResponse1.data[0]);
    });
  }));

  it('should download a kubernetes archive file', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        headers: {
          Headers: { _headers: [], _normalizedNames: [] }
        },
        ok: true,
        status: 200,
        statusText: 'OK',
        type: 2,
        url: 'http://localhost:8080/api/yipeefiles/6a379f42-9d50-11e7-99a2-e3878023cbd7/compose',
        success: true,
        total: 1,
        data: [kubernetesFile1]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.getKubernetesArchiveFileData(rawYipeeFile1).subscribe(data => {
      expect(data).toEqual(downloadKubernetesResponse._body.kubernetesFileResponse1.data[0]);
    });
  }));

  /* ----------------------------------- */
  /* END DOWNLOAD SERVICE ENDPOINT TESTS */
  /* ----------------------------------- */

  /* ----------------------------- */
  /* YIPEEFILE CRUD ENDPOINT TESTS */
  /* ----------------------------- */

  it('should return deleted application success', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        success: true,
        total: 1,
        data: [yipeeMetadata]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.getApp(appId).subscribe(data => {
      expect(data).toEqual(getAppResponse);
    });
  }));

  it('should return deleted application success', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        success: true,
        total: 1,
        data: [yipeeMetadata]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.deleteApp(appId).subscribe(data => {
      expect(data).toEqual(deleteAppResponse);
    });
  }));

  // xit('should make create a new application', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
  //   const response = new ResponseOptions({
  //     body: JSON.stringify({
  //       success: true,
  //       total: 1,
  //       data: [yipeeMetadata]
  //     })
  //   });

  //   const baseResponse = new Response(response);

  //   backend.connections.subscribe(
  //     (c: MockConnection) => c.mockRespond(baseResponse)
  //   );

  //   return service.newApp(yipeeMetadata).subscribe(data => {
  //     expect(data).toEqual(makePublicResponse);
  //   });
  // }));

  it('should update an existing application', inject([ApiService, MockBackend], (service: ApiService, backend: MockBackend) => {
    const response = new ResponseOptions({
      body: JSON.stringify({
        success: true,
        total: 1,
        data: [yipeeMetadata]
      })
    });

    const baseResponse = new Response(response);

    backend.connections.subscribe(
      (c: MockConnection) => c.mockRespond(baseResponse)
    );

    return service.updateApp(yipeeMetadata).subscribe(data => {
      expect(data).toEqual(makePublicResponse);
    });
  }));

  /* --------------------------------- */
  /* END YIPEEFILE CRUD ENDPOINT TESTS */
  /* --------------------------------- */

  /* ---------------------------------------------- */
  /* METHODS TO MANAGE THE ORG CONTEXT HEADER TESTS */
  /* ---------------------------------------------- */

  // @TEST
  // PLACE HOLDER for when updateOrgContextHeaderId method becomes finalized

  /* -------------------------------------------------- */
  /* END METHODS TO MANAGE THE ORG CONTEXT HEADER TESTS */
  /* -------------------------------------------------- */

  /* tests to make sure yipee files are marshalled correctly */

  it('should marshall json correctly', () => {
    const file: yf.YipeeFileRaw = <yf.YipeeFileRaw>rawYipeeFile1;
    expect(file).toBeDefined();
    expect(file.appinfo).toBeDefined();
    expect(file.appinfo.description).toEqual('Description.');
    expect(file.services).toBeDefined();
    expect(file.services[0].build).toEqual('build'); // this is in the interface
    expect(file.services[0].not_in_interface).toEqual('foo'); // this is not in the interface
    expect(file.services[0].number_nii).toEqual(6); // this is not in the interface
    expect(file.services[0].object_not_in_interface).toBeDefined();
    expect(file.services[0].object_not_in_interface.foo).toEqual('bar');
    file.services[0].new_item = 'boo'; // these are not in the interface
    file.services[1].new_item = 'boo';
    // marshall to json and then back
    const json = JSON.stringify(file);
    const file2: yf.YipeeFileRaw = <yf.YipeeFileRaw>JSON.parse(json);
    expect(file2).toBeDefined();
    expect(file2.services).toBeDefined();
    expect(file2.services[0].build).toEqual('build');
    expect(file2.services[0].not_in_interface).toEqual('foo');
    expect(file2.services[0].number_nii).toEqual(6);
    expect(file2.services[0].new_item).toEqual('boo');
    expect(file2.services[0].object_not_in_interface).toBeDefined();
    expect(file2.services[0].object_not_in_interface.foo).toEqual('bar');

    const file3: yf.YipeeFileRaw = <yf.YipeeFileRaw>rawYipeeFile2;
    expect(file3).toBeDefined();
    expect(file3.volumes).toBeDefined();
    expect(file3.volumes.length).toEqual(1);
    expect(file3.volumes[0].driver_opts).toBeDefined();
    expect(file3.volumes[0].driver_opts.length).toEqual(2);

  });

});
