import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import {
  head,
  logError,
  SceneItemData,
  VertexError,
} from '@vertexvis/api-client-node';
import { NextApiRequest, NextApiResponse } from 'next';

import {
  ErrorRes,
  MethodNotAllowed,
  ServerError,
  toErrorRes,
} from '../../../lib/api';
import { getClientFromSession } from '../../../lib/vertex-api';

export default withApiAuthRequired(async function handle(
  req: NextApiRequest,
  res: NextApiResponse<SceneItemData | ErrorRes>
): Promise<void> {
  if (req.method === 'GET') {
    const r = await get(req);
    return res.status(200).json(r);
  }

  return res.status(MethodNotAllowed.status).json(MethodNotAllowed);
});

async function get(req: NextApiRequest): Promise<ErrorRes | SceneItemData> {
  try {
    const c = await getClientFromSession();
    const id = head(req.query.id);
    const item = await c.sceneItems.getSceneItem({
      id,
      fieldsSceneItem: 'id,suppliedId,name,metadata',
    });

    return item.data.data;
  } catch (error) {
    const e = error as VertexError;
    logError(e);
    return e.vertexError?.res
      ? toErrorRes({ failure: e.vertexError?.res })
      : ServerError;
  }
}
