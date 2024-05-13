import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from 'hono/jwt'
import { createBlogInput, updateBlogInput } from '@kuchbhimingwal/medium-common'
const blogRout = new Hono<{
  Bindings: {
		DATABASE_URL: string,
    JWT_SECRET: string
	},
  Variables: {
    userId: string
  }
}>()
// midleware 
blogRout.use('/*', async (c, next) => {
  // const header = await c.req.json();
  const jwt = c.req.header('Authorization');
  if(!jwt){
    return c.text("not autherized");
  }
	const token = jwt.split(' ')[1];
	// const payload = await verify(token, c.env.JWT_SECRET);
  const userId = await verify(token, c.env.JWT_SECRET)
  // console.log(userId);
  if (!userId) {
		c.status(401);
		return c.json({ error: "unauthorized" });
	}
  c.set('userId', userId.id);
  await next()
})


blogRout.post('/', async (c) => {
  const userId = c.get('userId')
  console.log(userId);
  
  const body = await c.req.json();
  const { success } = createBlogInput.safeParse(body);
  if(!success){ 
    c.status(403)
    return c.json({
      "message": "enter a valid input"
    })
  }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try {
      const res = await prisma.post.create({
        data: {
          title: body.title,
          content: body.content,
          authorId: userId
        }
      })
      return c.json({"message": "post created"})
    } catch (error) {
      console.log(error);
      
      return c.text(JSON.stringify(error));
    }
})

blogRout.put('/', async(c) => {
  const userId = c.get('userId')

  const body = await c.req.json();
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const { success } = updateBlogInput.safeParse(body);
    if(!success){ 
      c.status(403)
      return c.json({
        "message": "enter a valid input"
      })
    }
    try {
      await prisma.post.update({
        where: {
          id: body.id,
          authorId: userId
        },
        data: {
          title: body.title,
          content: body.content,
        }
      })
      return c.json({
        "message": "updated"
      })
    } catch (error) {
      console.log(error);
      
      return c.text(JSON.stringify(error));
    }
})

blogRout.get('/post/:id', async (c) => {
	const id = c.req.param('id')
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
  try {
    const res = await prisma.post.findUnique({
      where: {
        id: id
      }
    }) 

    return c.json(res);
  } catch (error) {
    console.log(error);
    
    return c.text(JSON.stringify(error));
  }
})

blogRout.get('/bulk', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

	try {
    const res = await prisma.post.findMany();

    console.log("adae"); 
    return c.json(res);
  } catch (error) {

      console.log(error);
      return c.text(JSON.stringify(error));
    }
})

export default blogRout