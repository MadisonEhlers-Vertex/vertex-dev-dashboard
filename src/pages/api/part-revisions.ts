import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import {
  getPage,
  head,
  logError,
  PartRevisionData,
  VertexError,
} from '@vertexvis/api-client-node';
import { NextApiRequest, NextApiResponse } from 'next';

import {
  ErrorRes,
  GetRes,
  MethodNotAllowed,
  ServerError,
  toErrorRes,
} from '../../lib/api';
import { getClientFromSession } from '../../lib/vertex-api';

export default withApiAuthRequired(async function handle(
  req: NextApiRequest,
  res: NextApiResponse<GetRes<PartRevisionData> | ErrorRes>
): Promise<void> {
  if (req.method === 'GET') {
    const r = await get(req);
    return res.status(r.status).json(r);
  }

  return res.status(MethodNotAllowed.status).json(MethodNotAllowed);
});

async function get(
  req: NextApiRequest
): Promise<ErrorRes | GetRes<PartRevisionData>> {
  try {
    const c = await getClientFromSession();
    const ps = head(req.query.pageSize);
    const pId = head(req.query.partId);

    const { cursors, page } = await getPage(() =>
      c.partRevisions.getPartRevisions({
        id: pId,
        pageSize: ps ? parseInt(ps, 10) : 10,
      })
    );
    return { cursors, data: page.data, status: 200 };
  } catch (error) {
    const e = error as VertexError;
    logError(e);
    return e.vertexError?.res
      ? toErrorRes({ failure: e.vertexError?.res })
      : ServerError;
  }
}
