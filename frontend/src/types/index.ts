export interface User {
  userId: string;
  name: string;
}

export interface DatabaseCredentials {
  type: 'postgresql' | 'mysql' | 'sqlite';
  connectionString?: string;
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
}

export interface ConnectionInfo {
  connectionString: string;
  dbName: string;
}

export interface QueryResult {
  sql_query: string;
  data?: Record<string, any>[];
  visualizationData?: any;
}


export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}
