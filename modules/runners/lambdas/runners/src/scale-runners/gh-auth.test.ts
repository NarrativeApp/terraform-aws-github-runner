import { createOctoClient, createGithubAuth } from './gh-auth';
import nock from 'nock';
import { createAppAuth } from '@octokit/auth-app';
import { StrategyOptions } from '@octokit/auth-app/dist-types/types';
import SSM from './ssm';
import { RequestInterface } from '@octokit/types';
import { mock, MockProxy } from 'jest-mock-extended';
import { request } from '@octokit/request';

jest.mock('@octokit/auth-app');
jest.mock('./ssm');

const cleanEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env = { ...cleanEnv };
  nock.disableNetConnect();
});

describe('Test createOctoClient', () => {
  test('Creates app client to GitHub public', async () => {
    // Arrange
    const token = '123456';

    // Act
    const result = await createOctoClient(token);

    // Assert
    expect(result.request.endpoint.DEFAULTS.baseUrl).toBe('https://api.github.com');
  });

  test('Creates app client to GitHub ES', async () => {
    // Arrange
    const enterpriseServer = 'https://github.enterprise.notgoingtowork';
    const token = '123456';

    // Act
    const result = await createOctoClient(token, enterpriseServer);

    // Assert
    expect(result.request.endpoint.DEFAULTS.baseUrl).toBe(enterpriseServer);
    expect(result.request.endpoint.DEFAULTS.mediaType.previews).toStrictEqual(['antiope']);
  });
});

describe('Test createGithubAuth', () => {
  const mockedSSM = SSM as jest.MockedClass<typeof SSM>;
  const mockedCreatAppAuth = (createAppAuth as unknown) as jest.Mock;
  const mockedDefaults = jest.spyOn(request, 'defaults');
  let mockedRequestInterface: MockProxy<RequestInterface>;

  const installationId = 1;
  const authType = 'app';
  const token = '123456';
  const privateKey = 'my-private-key';
  const privateKeyBase64 = Buffer.from(privateKey, 'binary').toString('base64');
  const appId = '123';
  const clientId = 'abc';
  const clientSecret = 'abcdef123456';

  beforeEach(() => {
    process.env.GITHUB_APP_KEY_BASE64_PARAMETER_NAME = 'private-key';
    process.env.GITHUB_APP_ID_PARAMETER_NAME = 'app-id';
    process.env.GITHUB_APP_CLIENT_ID_PARAMETER_NAME = 'client-id';
    process.env.GITHUB_APP_CLIENT_SECRET_PARAMETER_NAME = 'client-secret';
    process.env.ENVIRONMENT = 'dev';
  });

  test('Creates auth object for public GitHub', async () => {
    // Arrange
    const authOptions = {
      appId: parseInt(appId),
      privateKey,
      installationId,
      clientId,
      clientSecret,
    };

    const mockedGetParameter = jest.fn()
        .mockResolvedValueOnce(privateKeyBase64)
        .mockResolvedValueOnce(appId)
        .mockResolvedValueOnce(clientId)
        .mockResolvedValueOnce(clientSecret);
    mockedSSM.mockImplementation(() => ({
      ssm: null as any,
      getParameter: mockedGetParameter,
    }));

    const mockedAuth = jest.fn();
    mockedAuth.mockResolvedValue({ token });
    mockedCreatAppAuth.mockImplementation(() => mockedAuth);

    // Act
    const result = await createGithubAuth(installationId, authType);

    // Assert
    expect(mockedGetParameter).toBeCalledWith(
      process.env.GITHUB_APP_KEY_BASE64_PARAMETER_NAME
    );
    expect(mockedGetParameter).toBeCalledWith(
      process.env.GITHUB_APP_ID_PARAMETER_NAME
    );
    expect(mockedGetParameter).toBeCalledWith(
      process.env.GITHUB_APP_CLIENT_ID_PARAMETER_NAME
    );
    expect(mockedGetParameter).toBeCalledWith(
      process.env.GITHUB_APP_CLIENT_SECRET_PARAMETER_NAME
    );
    expect(mockedCreatAppAuth).toBeCalledTimes(1);
    expect(mockedCreatAppAuth).toBeCalledWith(authOptions);
    expect(mockedAuth).toBeCalledWith({ type: authType });
    expect(result.token).toBe(token);
  });

  test('Creates auth object for Enterprise Server', async () => {
    // Arrange
    const githubServerUrl = 'https://github.enterprise.notgoingtowork';

    mockedRequestInterface = mock<RequestInterface>();
    mockedDefaults.mockImplementation(() => {
      return mockedRequestInterface.defaults({ baseUrl: githubServerUrl });
    });

    const authOptions = {
      appId: parseInt(appId),
      privateKey,
      installationId,
      clientId,
      clientSecret,
      request: mockedRequestInterface.defaults({ baseUrl: githubServerUrl }),
    };

    const mockedGetParameter = jest.fn()
        .mockResolvedValueOnce(privateKeyBase64)
        .mockResolvedValueOnce(appId)
        .mockResolvedValueOnce(clientId)
        .mockResolvedValueOnce(clientSecret);
    mockedSSM.mockImplementation(() => ({
      ssm: null as any,
      getParameter: mockedGetParameter,
    }));

    const mockedAuth = jest.fn();
    mockedAuth.mockResolvedValue({ token });
    mockedCreatAppAuth.mockImplementation(() => mockedAuth);

    // Act
    const result = await createGithubAuth(installationId, authType, githubServerUrl);

    // Assert
    expect(mockedGetParameter).toBeCalledWith(
      process.env.GITHUB_APP_KEY_BASE64_PARAMETER_NAME
    );
    expect(mockedGetParameter).toBeCalledWith(
      process.env.GITHUB_APP_ID_PARAMETER_NAME
    );
    expect(mockedGetParameter).toBeCalledWith(
      process.env.GITHUB_APP_CLIENT_ID_PARAMETER_NAME
    );
    expect(mockedGetParameter).toBeCalledWith(
      process.env.GITHUB_APP_CLIENT_SECRET_PARAMETER_NAME
    );
    expect(mockedCreatAppAuth).toBeCalledTimes(1);
    expect(mockedCreatAppAuth).toBeCalledWith(authOptions);
    expect(mockedAuth).toBeCalledWith({ type: authType });
    expect(result.token).toBe(token);
  });
});
