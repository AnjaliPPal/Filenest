export interface User {
    id: string;
    email: string;
    created_at: string;
    last_login?: string;
  }
  
  export interface FileRequest {
    id: string;
    user_id: string;
    description: string;
    deadline?: string;
    status: 'pending' | 'completed' | 'expired';
    unique_link: string;
    created_at: string;
    expires_at: string;
    is_active: boolean;
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
    email: string;
    description: string;
    deadline?: string;
    expiry_days?: number;
  }
  
  export interface UploadFileInput {
    request_id: string;
    file: Express.Multer.File;
  }