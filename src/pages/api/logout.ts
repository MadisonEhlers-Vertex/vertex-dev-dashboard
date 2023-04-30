import { handleLogout, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';



export default withApiAuthRequired(async function (
  req: NextApiRequest,
  res: NextApiResponse
) {
  await handleLogout(req, res);
  const r = { status: 200 };
  return res.status(r.status).json(r);
});
