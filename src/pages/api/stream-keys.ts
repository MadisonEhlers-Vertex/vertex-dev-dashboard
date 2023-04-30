import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import {
  isFailure,
  StreamKeysApiCreateSceneStreamKeyRequest,
} from '@vertexvis/api-client-node';
import { NextApiRequest, NextApiResponse } from 'next';

import {
  BodyRequired,
  ErrorRes,
  InvalidBody,
  MethodNotAllowed,
  Res,
  toErrorRes,
} from '../../lib/api';
import { getClientFromSession, makeCall } from '../../lib/vertex-api';


export interface CreateStreamKeyRes extends Res {
  readonly key: string;
}

type CreateStreamKeyReq = Pick<StreamKeysApiCreateSceneStreamKeyRequest, 'id'>;

export default withApiAuthRequired(async function handle(
  req: NextApiRequest,
  res: NextApiResponse<CreateStreamKeyRes | ErrorRes>
): Promise<void> {
  if (req.method === 'POST') {
    const r = await create(req);
    return res.status(r.status).json(r);
  }

  return res.status(MethodNotAllowed.status).json(MethodNotAllowed);
});

async function create(
  req: NextApiRequest
): Promise<ErrorRes | CreateStreamKeyRes> {
  if (!req.body) return BodyRequired;

  const b: CreateStreamKeyReq = JSON.parse(req.body);
  if (!b.id) return InvalidBody;

  const c = await getClientFromSession();
  const r = await makeCall(() =>
    c.streamKeys.createSceneStreamKey({
      id: b.id,
      createStreamKeyRequest: {
        data: { type: 'stream-key', attributes: { expiry: 86400 } },
      },
    })
  );
  return isFailure(r)
    ? toErrorRes({ failure: r })
    : { key: r.data.attributes.key ?? '', status: 200 };
}
