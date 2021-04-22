import { Octokit } from '@octokit/rest';
import { request } from '@octokit/request';
import { createAppAuth } from '@octokit/auth-app';
import { Authentication, StrategyOptions } from '@octokit/auth-app/dist-types/types';
import { OctokitOptions } from '@octokit/core/dist-types/types';
import SSM from './ssm';

export async function createOctoClient(token: string, ghesApiUrl = ''): Promise<Octokit> {
  const ocktokitOptions: OctokitOptions = {
    auth: token,
  };
  if (ghesApiUrl) {
    ocktokitOptions.baseUrl = ghesApiUrl;
    ocktokitOptions.previews = ['antiope'];
  }
  return new Octokit(ocktokitOptions);
}

export async function createGithubAuth(
  installationId: number | undefined,
  authType: 'app' | 'installation',
  ghesApiUrl = '',
): Promise<Authentication> {
  const ssm = new SSM();
  const privateKeyBase64 = await ssm.getParameter(
    process.env.GITHUB_APP_KEY_BASE64_PARAMETER_NAME as string
  );
  const appIdString = await ssm.getParameter(
    process.env.GITHUB_APP_ID_PARAMETER_NAME as string
  );
  const clientId = await ssm.getParameter(
    process.env.GITHUB_APP_CLIENT_ID_PARAMETER_NAME as string
  );
  const clientSecret = await ssm.getParameter(
    process.env.GITHUB_APP_CLIENT_SECRET_PARAMETER_NAME as string
  );
  if (privateKeyBase64 === undefined
      || appIdString === undefined
      || clientId === undefined
      || clientSecret === undefined) {
    throw Error('Cannot decrypt GitHub App parameters.');
  }

  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString();
  const appId = parseInt(appIdString);

  const authOptions: StrategyOptions = {
    appId,
    privateKey,
    installationId,
    clientId,
    clientSecret,
  };
  console.debug(ghesApiUrl);
  if (ghesApiUrl) {
    authOptions.request = request.defaults({
      baseUrl: ghesApiUrl,
    });
  }
  return await createAppAuth(authOptions)({ type: authType });
}
