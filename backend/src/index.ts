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

export default app
