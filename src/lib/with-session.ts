import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { OAuth2Token } from '@vertexvis/api-client-node';
import { Environment } from '@vertexvis/viewer';

export type EnvironmentWithCustom = Environment | 'custom';

export interface NetworkConfig {
  apiHost: string;
  renderingHost: string;
  sceneTreeHost: string;
  sceneViewHost: string;
}

export interface CommonProps {
  readonly clientId: string;
  readonly vertexEnv: Environment;
  readonly networkConfig?: NetworkConfig;
}

export type SessionToken = {
  readonly token: OAuth2Token;
  readonly expiration: number;
};

export type OAuthCredentials = {
  readonly id: string;
  readonly secret: string;
};
const NetworkConfig = 'networkConfig';


export function getCreds(): OAuthCredentials | undefined {
  if (process.env.VERTEX_CLIENT_ID != null && process.env.VERTEX_CLIENT_SECRET != null) {
    return {
      id: process.env.VERTEX_CLIENT_ID,
      secret: process.env.VERTEX_CLIENT_SECRET
    }
  }

  return undefined;
}

export const defaultServerSideProps = withPageAuthRequired();

export function getEnv(): Environment | undefined {
  return 'platdev'
}