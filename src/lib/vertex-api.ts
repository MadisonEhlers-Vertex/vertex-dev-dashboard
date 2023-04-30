import {
  ApiError,
  Configuration,
  Failure,
  isFailure,
  logError,
  Oauth2Api,
  OAuth2Token,
  VertexClient,
  VertexError,
} from '@vertexvis/api-client-node';
import assert from 'assert';
import { AxiosResponse } from 'axios';
import type { NextApiResponse } from 'next';

import { ErrorRes, ServerError } from './api';
import {
  getCreds,
  getEnv,
  NetworkConfig,
} from './with-session';

const basePath = (env: string, networkConfig?: NetworkConfig) => {
  if (env === 'custom' && networkConfig != null) {
    return networkConfig.apiHost;
  }

  return env === 'platprod'
    ? 'https://platform.vertexvis.com'
    : `https://platform.${env}.vertexvis.io`;
};

export async function makeCallRes<T>(
  res: NextApiResponse<T | Failure>,
  apiCall: () => Promise<AxiosResponse<T>>
): Promise<void> {
  const result = await makeCall(apiCall);
  return isFailure(result)
    ? res.status(ServerError.status).json(result)
    : res.status(200).json(result);
}

export async function makeCall<T>(
  apiCall: () => Promise<AxiosResponse<T>>
): Promise<T | Failure> {
  try {
    return (await apiCall()).data;
  } catch (error) {
    const ve = error as VertexError;
    logError(ve);
    return ve.vertexError?.res ?? toFailure(ServerError);
  }
}

export async function getToken(
  id: string,
  secret: string,
  env: string,
  networkConfig?: NetworkConfig
): Promise<OAuth2Token> {
  const auth = new Oauth2Api(
    new Configuration({
      basePath: basePath(env, networkConfig),
      username: id,
      password: secret,
    }),
    basePath(env, networkConfig)
  );

  return (await auth.createToken({ grantType: 'client_credentials' })).data;
}

export async function getClientWithCreds(
  id: string,
  secret: string,
  env: string,
): Promise<VertexClient> {
  console.log('env: ', env);
  const client = await VertexClient.build({
    basePath: `https://platform.platdev.vertexvis.io`,
    client: {
      id,
      secret,
    },
  });

  return client;
}

export async function getClientFromSession(
): Promise<VertexClient> {
  const creds = getCreds();
  const env = getEnv();
  assert(creds != null);
  assert(env != null);

  return getClientWithCreds(
    creds.id,
    creds.secret,
    env,
  );
}

export function toFailure({ message, status }: ErrorRes): Failure {
  const es = new Set<ApiError>();
  es.add({ status: status.toString(), title: message });
  return { errors: es };
}
