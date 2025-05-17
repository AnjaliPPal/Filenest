// frontend/src/types/index.ts
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
    uploaded_files?: UploadedFile[];
  }
  
  export interface UploadedFile {
    id: string;
    request_id: string;
    filename: string;
    storage_path: string;
    content_type?: string;
    file_size?: number;
    uploaded_at: string;
    download_url?: string;
  }
  
  export interface CreateRequestInput {
    email: string;
    description: string;
    deadline?: string;
    expiry_days?: number;
  }
  
  export interface CreateRequestFormData {
    email: string;
    description: string;
    deadline?: string;
    expiry_days?: number;
  }
  
  export interface CreateRequestResponse {
    message: string;
    request: {
      id: string;
      description: string;
      link: string;
      expires_at: string;
    };
  }
  
  export interface FileUploadResponse {
    message: string;
    file: {
      id: string;
      filename: string;
      content_type: string;
      uploaded_at: string;
    };
  }
  
  export interface FileDownloadResponse {
    id: string;
    filename: string;
    download_url: string;
  }