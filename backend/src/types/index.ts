export interface User {
    id: string;
    email: string;
    created_at: string;
    last_login?: string;
  }
  
  export interface FileRequest {
    id: string;
    recipient_email: string;
    description: string;
    deadline: string | null;
    unique_link: string;
    status: 'pending' | 'completed' | 'expired';
    created_at: string;
    expires_at: string;
    is_active: boolean;
    user_id: string;
  }
  
  export interface UploadedFile {
    id: string;
    request_id: string;
    filename: string;
    storage_path: string;
    content_type?: string;
    file_size?: number;
    uploaded_at: string;
  }
  
  export interface CreateRequestInput {
    recipientEmail: string;
    description: string;
    deadline?: string;
    expiry_days?: number;
  }
  
  export interface UploadFileInput {
    request_id: string;
    file: Express.Multer.File;
  }

// Add Express namespace declaration to extend Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
      };
    }
  }
}