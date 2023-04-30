import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

export default withApiAuthRequired(function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  console.log('req: ', req);
  res.send({ isLoggedIn: true });
});
