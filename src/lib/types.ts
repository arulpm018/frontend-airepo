export type Reference = {
  rank: number;
  paper_id: string;
  title: string;
  authors: string;
  year: number;
  type?: string;
  faculty?: string | null;
  department?: string | null;
  abstract: string;
  keywords?: string | null;
  url: string;
  relevance_score: number;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  references?: Reference[];
};

export type ApiMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  references: Reference[];
};

export type Session = {
  id: number;
  title: string;
  username: string;
  created_at: string;
  updated_at: string;
};

export type SelectedPaper = {
  id: string;
  title: string;
};

export type FilterOptions = {
  faculty?: string;
  department?: string;
  document_type?: string;
  year?: number;
  year_range?: {
    start: number;
    end: number;
  };
};

export type ActiveFilters = {
  faculty: string | null;
  department: string | null;
  document_type: string | null;
  year: number | null;
  year_range: {
    start: number | null;
    end: number | null;
  };
};

