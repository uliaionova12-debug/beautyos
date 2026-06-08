export type ClientStatus = 'active' | 'at_risk' | 'lost'

export interface Client {
  id: string
  salon_id: string
  external_id?: string
  name: string
  phone?: string
  first_visit_date: string
  last_visit_date: string
  total_visits: number
  total_revenue: number
  avg_check: number
  avg_interval_days: number
  status: ClientStatus
  risk_score: number
  return_score: number
  revenue_opportunity: number
  days_since_last_visit: number
  created_at?: string
  updated_at?: string
}

export interface Visit {
  id: string
  salon_id: string
  client_id: string
  master_id?: string
  master_name?: string
  service_name?: string
  visit_date: string
  amount: number
  created_at?: string
}

export interface Master {
  id: string
  salon_id: string
  name: string
  retention_rate: number
  avg_check: number
  total_revenue: number
  active_clients_count: number
  at_risk_clients_count: number
  lost_clients_count: number
}

export interface DailyAction {
  master_name: string
  client_count: number
  potential_revenue: number
  probability: number
  client_ids: string[]
}

export interface Insight {
  id: string
  salon_id: string
  agent_type: 'retention' | 'profit' | 'load' | 'marketing' | 'quality' | 'reputation' | 'competitor'
  title: string
  body: string
  financial_impact: number
  priority: 'critical' | 'warning' | 'info'
  action_label?: string
  created_at?: string
}

export interface RetentionAnalysis {
  salon_id: string
  period_days: number
  total_clients: number
  active_clients: number
  at_risk_clients: number
  lost_clients: number
  total_financial_impact: number
  retention_rate: number
  at_risk_list: Client[]
  lost_list: Client[]
  masters: Master[]
  ai_insights: string[]
  ai_recommendation: string
  analyzed_at: string
}

export interface CSVRow {
  client_name: string
  phone: string
  visit_date: string
  master_name: string
  service_name: string
  amount: string
}

export interface Salon {
  id: string
  name: string
  owner_id: string
}

// --- Salon Memory ---

export interface DataUpload {
  id: string
  salon_id: string
  filename?: string
  period_from?: string
  period_to?: string
  row_count: number
  created_at?: string
}

export interface AnalysisSnapshot {
  id: string
  salon_id: string
  upload_id?: string
  snapshot_date: string
  total_clients: number
  active_clients: number
  at_risk_clients: number
  lost_clients: number
  total_revenue: number
  avg_check: number
  retention_rate: number
  total_financial_impact: number
  created_at?: string
}

export type ActionType = 'call' | 'sms' | 'offer' | 'review_request'
export type ActionStatus = 'pending' | 'done' | 'skipped'

export interface Action {
  id: string
  salon_id: string
  action_type: ActionType
  title: string
  description?: string
  target_client_ids?: string[]
  financial_impact: number
  probability: number
  status: ActionStatus
  created_at?: string
  completed_at?: string
}

export interface ActionResult {
  id: string
  action_id: string
  salon_id: string
  clients_contacted: number
  clients_returned: number
  revenue_recovered: number
  measured_at?: string
}
