import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { signupInput, signinInput } from '@kuchbhimingwal/medium-common'

const userRout = new Hono<{
  Bindings: {
		DATABASE_URL: string,
    JWT_SECRET: string
	},
  Variables: {
    userId: string
  }
}>()
userRout.post('/signup', async(c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  const body = await c.req.json();
  const { success } = signupInput.safeParse(body);
  if(!success){ 
    c.status(403)
    return c.json({
      "message": "enter a valid input"
    })
  }
  try {
    
    const res = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
        name: body.name
      }
    })
    // console.log(res);
    const payload = {
      id: res.id
    }
    const token = await sign(payload, c.env.JWT_SECRET);

    return c.json({token});
  } catch (error) {
    console.log(error);
    
    return c.text(JSON.stringify(error));
  }
  
})

userRout.post('/signin', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  const body = await c.req.json();
  const { success } = signinInput.safeParse(body);
  if(!success){ 
    c.status(403)
    return c.json({
      "message": "enter a valid input"
    })
  }

    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
        password: body.password
      }
    })
    if(!user){
      c.status(403);
      return c.json({error: "user not found"})
    }
    const token = await sign({id: user.id}, c.env.JWT_SECRET);
    return c.json({token});
    
})

export default userRout;