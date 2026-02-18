export type UserRole = 'client' | 'graphic_designer' | 'web_designer' | 'admin' | 'worker' | 'print_specialist' | 'designer' | 'developer' | 'video_editor';

export interface Profile {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: UserRole;
    specialization?: string;
    email?: string;
    phone?: string;
    bio?: string;
    skill?: string;
    skills?: string[];
    is_active: boolean;
    is_available?: boolean; // Worker Availability
    preferred_comm_method?: string;
    notification_preferences?: {
        project_updates: boolean;
        messages: boolean;
        marketing: boolean;
    };
    verification_status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
    minimum_price?: number | null;
}

export type ProjectStatus =
    'pending'
    | 'queued'
    | 'matching'
    | 'assigned'
    | 'waiting_for_client'
    | 'awaiting_down_payment'
    | 'active'
    | 'in_progress'
    | 'work_started'
    | 'review_samples'
    | 'ready_for_review'
    | 'review'
    | 'approved'
    | 'awaiting_payout'
    | 'awaiting_final_payment'
    | 'pending_agreement'
    | 'pending_down_payment'
    | 'chat_negotiation'
    | 'stuck_in_negotiation'
    | 'NO_WORKER_AVAILABLE'
    | 'completed'
    | 'cancelled'
    | 'flagged';

export interface WorkerStats {
    worker_id: string;
    average_rating: number;
    total_projects: number;
    completed_projects: number;
    active_projects: number;
    is_probation: boolean;
    max_projects_limit: number;
    availability_status: 'available' | 'busy' | 'away';
    portfolio_visible: boolean;
    skills: string[];
    last_assignment_at?: string;
    idle_since?: string;
}

export interface Review {
    id: string;
    project_id: string;
    worker_id: string;
    client_id: string;
    rating: number;
    comment: string;
    created_at: string;
}

export interface ProjectFile {
    id: string;
    project_id: string;
    uploader_id: string;
    file_name: string;
    file_url: string;
    file_type: 'deliverable' | 'resource';
    created_at: string;
}

export interface Project {
    id: string;
    client_id: string;
    worker_id?: string;
    title: string;
    description: string;
    status: ProjectStatus;
    project_type: 'graphic_design' | 'web_design' | 'printing';
    assignment_method?: 'ai' | 'manual' | 'legacy';
    assignment_metadata?: any;
    assignment_deadline?: string;
    created_at: string;
    updated_at: string;
    worker_stats?: WorkerStats;
    last_message?: {
        content: string;
        created_at: string;
        sender_id?: string;
        sender_name?: string;
    };
}

export interface Message {
    id: string;
    project_id: string;
    sender_id: string;
    content: string;
    attachment_url?: string;
    attachment_type?: 'image' | 'video' | 'audio' | 'file';
    attachment_name?: string;
    is_voice_note?: boolean;
    is_read?: boolean;
    payload?: any; // For agreements, system messages, etc.
    created_at: string;
    profiles?: Profile; // Joined data
}

export interface GalleryItem {
    id: string;
    project_id: string;
    worker_id: string;
    title: string;
    image_url: string;
    is_approved: boolean;
    is_featured: boolean;
    created_at: string;
}

export interface PortfolioItem {
    id: string;
    worker_id: string;
    project_id?: string;
    image_url: string;
    service_type: string;
    title?: string;
    description?: string;
    ai_polished_description?: string;
    is_approved: boolean;
    is_featured: boolean;
    website_link?: string;
    created_at: string;
    profiles?: {
        full_name: string;
    };
}

export interface AuthContextType {
    user: any | null;
    session: any | null;
    profile: Profile | null;
    workerStats?: WorkerStats | null;
    role: UserRole | null;
    specialization: string | null;
    isLoading: boolean;
    signIn: (data: any) => Promise<any>;
    signUp: (data: any) => Promise<any>;
    signOut: (options?: any) => Promise<any>;
    refreshProfile: () => Promise<void>;
}
export interface Payment {
    id: string;
    project_id: string;
    payer_id: string;
    amount: number;
    payment_type: 'down_payment' | 'final_payment';
    status: 'pending' | 'confirmed' | 'failed';
    reference?: string;
    created_at: string;
    projects?: {
        title: string;
    };
}

export interface Payout {
    id: string;
    project_id: string;
    worker_id: string;
    amount: number;
    platform_fee: number;
    status: 'awaiting_payment' | 'payment_sent' | 'payment_verified' | 'failed' | 'pending' | 'paid';
    transaction_reference?: string;
    payout_date?: string;
    admin_paid_at?: string;
    worker_confirmed_at?: string;
    created_at: string;
    projects?: {
        title: string;
    };
}
