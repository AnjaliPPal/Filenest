import { Request, Response } from 'express';


import { supabase } from '../config/supabase';
import { CreateRequestInput } from '../types';
import { sendNotificationEmail } from '../utils/email';
import { nanoid } from 'nanoid';

// Create a new file request
export const createRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, description, deadline, expiry_days = 7 }: CreateRequestInput = req.body;

    if (!email || !description) {
      res.status(400).json({ error: 'Email and description are required' });
      return;
    }

    // Check if user exists, if not create new user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ email })
        .select()
        .single();

      if (createError) {
        res.status(500).json({ error: 'Failed to create user' });
        return;
      }
      user = newUser;
    }

    // Generate unique link and expiry date
    const unique_link = nanoid(12);
    
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + expiry_days);

    const { data: request, error: requestError } = await supabase
      .from('file_requests')
      .insert({
        user_id: user.id,
        description,
        deadline: deadline || null,
        unique_link,
        expires_at: expires_at.toISOString(),
      })
      .select()
      .single();

    if (requestError) {
      res.status(500).json({ error: 'Failed to create file request' });
      return;
    }

    res.status(201).json({
      message: 'File request created successfully',
      request: {
        id: request.id,
        description: request.description,
        link: `${process.env.FRONTEND_URL}/upload/${unique_link}`,
        expires_at: request.expires_at,
      }
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get file request by unique link
export const getRequestByLink = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Get request by link:', req.params);
    const { link } = req.params;

    if (!link) {
      res.status(400).json({ error: 'Link is required' });
      return;
    }

    const { data: request, error } = await supabase
      .from('file_requests')
      .select('*')
      .eq('unique_link', link)
      .eq('is_active', true)
      .single();

    console.log('Request lookup result:', { request, error });

    if (error || !request) {
      res.status(404).json({ error: 'File request not found or expired' });
      return;
    }

    if (new Date(request.expires_at) < new Date()) {
      res.status(400).json({ error: 'This file request has expired' });
      return;
    }

    res.status(200).json({
      id: request.id,
      description: request.description,
      deadline: request.deadline,
      status: request.status,
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) });
  }
};

// Get all requests for a user
export const getUserRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { data: requests, error: requestsError } = await supabase
      .from('file_requests')
      .select(`
        *,
        uploaded_files (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      res.status(500).json({ error: 'Failed to fetch file requests' });
      return;
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
