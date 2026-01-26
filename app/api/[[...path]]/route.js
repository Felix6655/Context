import { NextResponse } from 'next/server'
import { supabase, getAdminClient } from '../../../lib/supabase'
import { setupSQL } from '../../../lib/database-setup'
import { computeDeadZoneFlags } from '../../../lib/deadzone'
import { generatePerspectiveCards } from '../../../lib/perspective'
import { v4 as uuidv4 } from 'uuid'

// Helper to get current user from request
async function getCurrentUser(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return null
  }
  return user
}

// Create authenticated supabase client
function getAuthenticatedClient(token) {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  )
}

export async function GET(request, { params }) {
  const path = params.path || []
  const pathStr = path.join('/')
  
  try {
    // Health check
    if (pathStr === '' || pathStr === 'health') {
      return NextResponse.json({ status: 'ok', message: 'Context API is running' })
    }
    
    // Get auth token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    // Auth endpoints
    if (pathStr === 'auth/user') {
      if (!token) {
        return NextResponse.json({ user: null })
      }
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error) {
        return NextResponse.json({ user: null })
      }
      return NextResponse.json({ user })
    }
    
    // Protected routes - require auth
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const authClient = getAuthenticatedClient(token)
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get profile
    if (pathStr === 'profile') {
      const { data, error } = await authClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ profile: data || { id: user.id, full_name: '', perspective_intensity: 'medium' } })
    }
    
    // Get receipts
    if (pathStr === 'receipts') {
      const { data, error } = await authClient
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ receipts: data || [] })
    }
    
    // Get single receipt
    if (path[0] === 'receipts' && path[1]) {
      const { data, error } = await authClient
        .from('receipts')
        .select('*')
        .eq('id', path[1])
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      return NextResponse.json({ receipt: data })
    }
    
    // Get moments
    if (pathStr === 'moments') {
      const { data, error } = await authClient
        .from('moments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ moments: data || [] })
    }
    
    // Get single moment
    if (path[0] === 'moments' && path[1]) {
      const { data, error } = await authClient
        .from('moments')
        .select('*')
        .eq('id', path[1])
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      return NextResponse.json({ moment: data })
    }
    
    // Get timeline (combined receipts + moments)
    if (pathStr === 'timeline') {
      const url = new URL(request.url)
      const type = url.searchParams.get('type') // 'receipt', 'moment', or null for all
      const tag = url.searchParams.get('tag')
      const category = url.searchParams.get('category')
      const decision_type = url.searchParams.get('decision_type')
      
      let receipts = []
      let moments = []
      
      if (!type || type === 'receipt') {
        let query = authClient.from('receipts').select('*').eq('user_id', user.id)
        if (tag) query = query.contains('tags', [tag])
        if (decision_type) query = query.eq('decision_type', decision_type)
        const { data } = await query.order('created_at', { ascending: false })
        receipts = (data || []).map(r => ({ ...r, item_type: 'receipt' }))
      }
      
      if (!type || type === 'moment') {
        let query = authClient.from('moments').select('*').eq('user_id', user.id)
        if (tag) query = query.contains('tags', [tag])
        if (category) query = query.eq('category', category)
        const { data } = await query.order('created_at', { ascending: false })
        moments = (data || []).map(m => ({ ...m, item_type: 'moment' }))
      }
      
      // Combine and sort by date
      const timeline = [...receipts, ...moments].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )
      
      return NextResponse.json({ timeline })
    }
    
    // Get deadzone data
    if (pathStr === 'deadzone') {
      // Fetch recent receipts and moments
      const { data: receipts } = await authClient
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
      
      const { data: moments } = await authClient
        .from('moments')
        .select('*')
        .eq('user_id', user.id)
      
      const { flags, summary } = computeDeadZoneFlags(receipts || [], moments || [], 14)
      
      return NextResponse.json({ flags, summary })
    }
    
    // Get perspective cards
    if (pathStr === 'perspective-cards') {
      // Get existing cards
      const { data: existingCards } = await authClient
        .from('perspective_cards')
        .select('*')
        .eq('user_id', user.id)
      
      // Get profile for intensity
      const { data: profile } = await authClient
        .from('profiles')
        .select('perspective_intensity')
        .eq('id', user.id)
        .single()
      
      const intensity = profile?.perspective_intensity || 'medium'
      
      // Get receipts and moments
      const { data: receipts } = await authClient
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
      
      const { data: moments } = await authClient
        .from('moments')
        .select('*')
        .eq('user_id', user.id)
      
      // Generate new cards based on rules
      const newCards = generatePerspectiveCards(
        receipts || [], 
        moments || [], 
        existingCards || [],
        intensity
      )
      
      // Save new cards to database
      if (newCards.length > 0) {
        const cardsToInsert = newCards.map(c => ({
          ...c,
          user_id: user.id
        }))
        await authClient.from('perspective_cards').insert(cardsToInsert)
      }
      
      // Return all non-dismissed cards
      const { data: allCards } = await authClient
        .from('perspective_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
      
      return NextResponse.json({ cards: allCards || [] })
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  const path = params.path || []
  const pathStr = path.join('/')
  
  try {
    // Auth: Sign up
    if (pathStr === 'auth/signup') {
      const { email, password, full_name } = await request.json()
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name }
        }
      })
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      return NextResponse.json({ 
        user: data.user, 
        session: data.session,
        message: 'Check your email for verification link'
      })
    }
    
    // Auth: Sign in
    if (pathStr === 'auth/signin') {
      const { email, password } = await request.json()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      return NextResponse.json({ 
        user: data.user, 
        session: data.session 
      })
    }
    
    // Auth: Magic link
    if (pathStr === 'auth/magic-link') {
      const { email } = await request.json()
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
        }
      })
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      return NextResponse.json({ message: 'Check your email for the magic link' })
    }
    
    // Auth: Sign out
    if (pathStr === 'auth/signout') {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ message: 'Signed out successfully' })
    }
    
    // Database setup (admin only - one time)
    if (pathStr === 'admin/setup-database') {
      return NextResponse.json({ 
        message: 'Please run the SQL in Supabase SQL Editor',
        sql: setupSQL 
      })
    }
    
    // Protected routes
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const authClient = getAuthenticatedClient(token)
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Create receipt
    if (pathStr === 'receipts') {
      const body = await request.json()
      
      const receipt = {
        id: uuidv4(),
        user_id: user.id,
        title: body.title,
        decision_type: body.decision_type,
        context: body.context || null,
        assumptions: body.assumptions || null,
        constraints: body.constraints || null,
        emotions: body.emotions || [],
        confidence: body.confidence || 50,
        change_mind: body.change_mind || null,
        tags: body.tags || [],
        link_url: body.link_url || null,
        location_label: body.location_label || null
      }
      
      const { data, error } = await authClient
        .from('receipts')
        .insert([receipt])
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ receipt: data })
    }
    
    // Create moment
    if (pathStr === 'moments') {
      const body = await request.json()
      
      const moment = {
        id: uuidv4(),
        user_id: user.id,
        title: body.title,
        category: body.category,
        note: body.note || null,
        why_mattered: body.why_mattered || null,
        tags: body.tags || []
      }
      
      const { data, error } = await authClient
        .from('moments')
        .insert([moment])
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ moment: data })
    }
    
    // Dismiss perspective card
    if (path[0] === 'perspective-cards' && path[1] && path[2] === 'dismiss') {
      const { error } = await authClient
        .from('perspective_cards')
        .update({ dismissed: true })
        .eq('id', path[1])
        .eq('user_id', user.id)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const path = params.path || []
  
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const authClient = getAuthenticatedClient(token)
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Update profile
    if (path[0] === 'profile') {
      const body = await request.json()
      
      // Try to update, if fails (doesn't exist), insert
      const { data: existing } = await authClient
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      let result
      if (existing) {
        result = await authClient
          .from('profiles')
          .update({
            full_name: body.full_name,
            perspective_intensity: body.perspective_intensity
          })
          .eq('id', user.id)
          .select()
          .single()
      } else {
        result = await authClient
          .from('profiles')
          .insert([{
            id: user.id,
            full_name: body.full_name,
            perspective_intensity: body.perspective_intensity
          }])
          .select()
          .single()
      }
      
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 })
      }
      
      return NextResponse.json({ profile: result.data })
    }
    
    // Update receipt
    if (path[0] === 'receipts' && path[1]) {
      const body = await request.json()
      
      const { data, error } = await authClient
        .from('receipts')
        .update({
          title: body.title,
          decision_type: body.decision_type,
          context: body.context,
          assumptions: body.assumptions,
          constraints: body.constraints,
          emotions: body.emotions,
          confidence: body.confidence,
          change_mind: body.change_mind,
          tags: body.tags,
          link_url: body.link_url,
          location_label: body.location_label
        })
        .eq('id', path[1])
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ receipt: data })
    }
    
    // Update moment
    if (path[0] === 'moments' && path[1]) {
      const body = await request.json()
      
      const { data, error } = await authClient
        .from('moments')
        .update({
          title: body.title,
          category: body.category,
          note: body.note,
          why_mattered: body.why_mattered,
          tags: body.tags
        })
        .eq('id', path[1])
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ moment: data })
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const path = params.path || []
  
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const authClient = getAuthenticatedClient(token)
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Delete receipt
    if (path[0] === 'receipts' && path[1]) {
      const { error } = await authClient
        .from('receipts')
        .delete()
        .eq('id', path[1])
        .eq('user_id', user.id)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    // Delete moment
    if (path[0] === 'moments' && path[1]) {
      const { error } = await authClient
        .from('moments')
        .delete()
        .eq('id', path[1])
        .eq('user_id', user.id)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
