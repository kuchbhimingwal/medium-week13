import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import userRout from './routes/user/user'
import blogRout from './routes/blog/blog'
const app = new Hono<{
  Bindings: {
		DATABASE_URL: string,
    JWT_SECRET: string
	},
  Variables: {
    userId: string
  }
}>()

app.route('/api/v1/user', userRout)

app.route('/api/v1/blog', blogRout)

app.use('/api/v1/blog/*', async (c, next) => {
  // const header = await c.req.json();
  const jwt = c.req.header('Authorization');
  if(!jwt){
    return c.text("not autherized");
  }
	const token = jwt.split(' ')[1];
	// const payload = await verify(token, c.env.JWT_SECRET);
  const userId = await verify(token, c.env.JWT_SECRET)
  console.log(userId);
  if (!userId) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
  c.set('userId', userId.id);
  await next()
})
export default app
