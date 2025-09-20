import { Hono } from 'hono'
import type { Bindings, Variables, APIResponse } from '../types'

export const userRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Get user profile
userRoutes.get('/profile', async (c) => {
  try {
    const payload = c.get('jwtPayload') as any
    
    const user = await c.env.DB.prepare(`
      SELECT id, email, name, role, is_active, created_at, last_login_at
      FROM users WHERE id = ?
    `).bind(payload.user_id).first()

    return c.json<APIResponse>({ success: true, data: user })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to fetch profile' }, 500)
  }
})

// Update user profile
userRoutes.patch('/profile', async (c) => {
  try {
    const payload = c.get('jwtPayload') as any
    const { name } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(name, payload.user_id).run()

    return c.json<APIResponse>({ success: true, message: 'Profile updated' })
  } catch (error) {
    return c.json<APIResponse>({ success: false, error: 'Failed to update profile' }, 500)
  }
})